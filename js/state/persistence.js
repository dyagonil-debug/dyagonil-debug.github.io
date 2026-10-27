// ============================================================================
// MID-RUN SAVE & RESUME PERSISTENCE ENGINE v3 (js/state/persistence.js)
// ============================================================================
// Key Behaviors:
// 1. No popup at initial boot: Waits until the player clicks `#title-start-game-btn`
//    ("Start Game") on the Title Screen before showing the Resume Delve modal.
// 2. Full transition into gameplay on Resume: Dismisses `#intro-sequence-overlay`,
//    `#difficulty-modal`, and `#floor-intro-overlay`, restores `state` in-place,
//    invokes the game's native 3D scene & HUD render functions (discovered via
//    runtime function introspection), and restores 3D token meshes in `tokensGroup`.
// ============================================================================

const RUN_SAVE_STORAGE_KEY = 'c4_subterranean_saved_run_v1';
const RUN_SAVE_SCHEMA_VERSION = 3;

const TRANSIENT_STATE_KEYS = new Set([
  'isAnimating',
  'aiThinking',
  'isAiThinking',
  'inputLocked',
  'turnLocked',
  'isPaused',
  'paused',
  'introActive',
  'floorIntroActive',
  'isSpinningRoulette',
  'rouletteSpinning',
  'activeModal',
  'hoveredCol',
  'hoverCol',
  'pendingDropCol',
  'confirmedCol',
  'selectedCardIdx',
  'selectedCardIndex',
  'armedCardIdx',
  'armedCardIndex',
  'selectedReserveIdx',
  'selectedReserveIndex',
  'armedReserveIdx',
  'armedReserveIndex',
  'winningCells',
  'winLine',
  'aiTimeoutId',
  'turnTimerId'
]);

const SAFE_PLAYABLE_FLAGS = {
  isAnimating: false,
  aiThinking: false,
  isAiThinking: false,
  inputLocked: false,
  turnLocked: false,
  isPaused: false,
  paused: false,
  introActive: false,
  floorIntroActive: false,
  isSpinningRoulette: false,
  rouletteSpinning: false,
  gameOver: false,
  isGameOver: false,
  runOver: false,
  hoveredCol: -1,
  hoverCol: -1,
  pendingDropCol: null,
  confirmedCol: null,
  selectedCardIdx: null,
  selectedCardIndex: null,
  armedCardIdx: null,
  armedCardIndex: null,
  selectedReserveIdx: null,
  selectedReserveIndex: null,
  armedReserveIdx: null,
  armedReserveIndex: null
};

// Gate lock: prevents bootGame()'s initial Floor 1 setup from overwriting a saved run
// while the player is still on the CRT boot gate or Title Screen.
let _saveGateLocked = false;
let _bootCachedPayload = null;
let _isRestoringRun = false;
let _bypassStartBtnInterceptOnce = false;

// ----------------------------------------------------------------------------
// 1. CATALOG LOOKUP & STATE SERIALIZATION
// ----------------------------------------------------------------------------
function buildCatalogLookupMap() {
  const map = new Map();
  const cfg = (window.C4 && window.C4.config) ? window.C4.config : {};

  function indexCollection(col, prefix) {
    if (!col || typeof col !== 'object') return;
    if (Array.isArray(col)) {
      for (const item of col) {
        if (item && typeof item === 'object') {
          const id = item.id || item.key || item.code || item.name;
          if (id) {
            map.set(`${prefix}:${id}`, item);
            map.set(`any:${id}`, item);
          }
        }
      }
    } else {
      for (const [k, item] of Object.entries(col)) {
        if (item && typeof item === 'object') {
          map.set(`${prefix}:${k}`, item);
          map.set(`any:${k}`, item);
          const id = item.id || item.key || item.code || item.name;
          if (id) {
            map.set(`${prefix}:${id}`, item);
            map.set(`any:${id}`, item);
          }
        }
      }
    }
  }

  indexCollection(cfg.BOARD_TOPOLOGIES, 'topology');
  indexCollection(cfg.CARD_CATALOG, 'card');
  indexCollection(cfg.RESERVE_CATALOG, 'reserve');
  indexCollection(cfg.GAMBIT_CATALOG, 'gambit');
  indexCollection(cfg.ENCHANT_TYPES, 'enchant');
  indexCollection(cfg.ROULETTE_WEDGES, 'wedge');
  indexCollection(cfg.DIFFICULTY_TIERS, 'difficulty');

  if (cfg.BOSS_POOLS_BY_ACT && typeof cfg.BOSS_POOLS_BY_ACT === 'object') {
    for (const pool of Object.values(cfg.BOSS_POOLS_BY_ACT)) {
      indexCollection(pool, 'boss');
    }
  }

  return map;
}

function sanitizeForSerialization(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean') return value;
  if (t === 'function' || t === 'symbol') return undefined;

  if (t === 'object') {
    if (seen.has(value)) return undefined;
    if (
      value.nodeType ||
      value.isObject3D ||
      value.isMaterial ||
      value.isBufferGeometry ||
      value.isTexture ||
      value.isScene ||
      value.isCamera ||
      (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement)
    ) {
      return undefined;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const arr = [];
      for (let i = 0; i < value.length; i++) {
        const cleaned = sanitizeForSerialization(value[i], seen);
        arr.push(cleaned === undefined ? null : cleaned);
      }
      seen.delete(value);
      return arr;
    }

    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (TRANSIENT_STATE_KEYS.has(k)) continue;
      if (k.startsWith('_three') || k.endsWith('Mesh') || k.endsWith('Group')) continue;
      const cleaned = sanitizeForSerialization(v, seen);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    seen.delete(value);
    return out;
  }
  return undefined;
}

function rehydrateFromCatalogs(value, catalogMap) {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => rehydrateFromCatalogs(item, catalogMap));
  }

  const candidateId = value.id || value.key || value.code || value.topologyId || value.bossId;
  if (candidateId && catalogMap.has(`any:${candidateId}`)) {
    const template = catalogMap.get(`any:${candidateId}`);
    const rehydrated = Object.assign({}, template);
    for (const [k, v] of Object.entries(value)) {
      rehydrated[k] = rehydrateFromCatalogs(v, catalogMap);
    }
    return rehydrated;
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = rehydrateFromCatalogs(v, catalogMap);
  }
  return out;
}

// Restores properties onto `state` while mutating existing arrays/objects in-place
// where possible so any external references to `state.board`, `state.hand`, etc. stay valid.
function applyRestoredStateInPlace(targetState, restoredObj) {
  if (!targetState || !restoredObj) return;

  for (const [key, val] of Object.entries(restoredObj)) {
    if (key === 'board' && Array.isArray(val) && Array.isArray(targetState.board)) {
      targetState.board.length = val.length;
      for (let r = 0; r < val.length; r++) {
        if (Array.isArray(val[r])) {
          if (!Array.isArray(targetState.board[r])) {
            targetState.board[r] = [...val[r]];
          } else {
            targetState.board[r].length = val[r].length;
            for (let c = 0; c < val[r].length; c++) {
              targetState.board[r][c] = val[r][c];
            }
          }
        } else {
          targetState.board[r] = val[r];
        }
      }
    } else if (Array.isArray(val) && Array.isArray(targetState[key])) {
      targetState[key].length = 0;
      targetState[key].push(...val);
    } else {
      targetState[key] = val;
    }
  }

  for (const [flagKey, safeVal] of Object.entries(SAFE_PLAYABLE_FLAGS)) {
    if (flagKey in targetState) {
      targetState[flagKey] = safeVal;
    }
  }
}

// ----------------------------------------------------------------------------
// 2. THREE.JS 3D TOKEN & ENCHANT MESH SNAPSHOTTING
// ----------------------------------------------------------------------------
function serializeMaterial(m) {
  if (!m) return null;
  return {
    type: m.type || 'MeshStandardMaterial',
    color: (m.color && typeof m.color.getHex === 'function') ? m.color.getHex() : 0xffffff,
    emissive: (m.emissive && typeof m.emissive.getHex === 'function') ? m.emissive.getHex() : 0x000000,
    emissiveIntensity: typeof m.emissiveIntensity === 'number' ? m.emissiveIntensity : 1,
    roughness: typeof m.roughness === 'number' ? m.roughness : 0.38,
    metalness: typeof m.metalness === 'number' ? m.metalness : 0.35,
    transparent: !!m.transparent,
    opacity: typeof m.opacity === 'number' ? m.opacity : 1,
    wireframe: !!m.wireframe,
    side: typeof m.side === 'number' ? m.side : 0
  };
}

function serializeThreeObject(obj) {
  if (!obj || !obj.isObject3D) return null;

  const node = {
    isMesh: !!obj.isMesh,
    name: obj.name || '',
    visible: obj.visible !== false,
    pos: [obj.position.x, obj.position.y, obj.position.z],
    rot: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    userData: sanitizeForSerialization(obj.userData || {}),
    children: []
  };

  if (obj.isMesh && obj.geometry && obj.material) {
    const g = obj.geometry;
    node.geom = {
      type: g.type || 'CylinderGeometry',
      params: g.parameters ? sanitizeForSerialization(g.parameters) : null
    };

    if (Array.isArray(obj.material)) {
      node.matList = obj.material.map(serializeMaterial);
    } else {
      node.mat = serializeMaterial(obj.material);
    }
  }

  if (Array.isArray(obj.children)) {
    for (const child of obj.children) {
      const serializedChild = serializeThreeObject(child);
      if (serializedChild) node.children.push(serializedChild);
    }
  }

  return node;
}

function buildThreeMaterial(matData) {
  if (!matData || typeof THREE === 'undefined') {
    return new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
  }
  const MatClass = (typeof THREE[matData.type] === 'function')
    ? THREE[matData.type]
    : THREE.MeshStandardMaterial;

  const matConfig = {
    color: matData.color ?? 0xffffff,
    transparent: !!matData.transparent,
    opacity: matData.opacity ?? 1,
    wireframe: !!matData.wireframe,
    side: matData.side ?? THREE.FrontSide
  };

  if (MatClass !== THREE.MeshBasicMaterial) {
    matConfig.emissive = matData.emissive ?? 0x000000;
    matConfig.emissiveIntensity = matData.emissiveIntensity ?? 1;
    if ('roughness' in matData) matConfig.roughness = matData.roughness;
    if ('metalness' in matData) matConfig.metalness = matData.metalness;
  }

  return new MatClass(matConfig);
}

function reconstructThreeObject(node) {
  if (!node || typeof THREE === 'undefined') return null;

  let obj3d = null;
  if (node.isMesh && node.geom && (node.mat || node.matList)) {
    let geometry = null;
    const p = node.geom.params || {};
    const gType = node.geom.type;

    try {
      if (gType === 'CylinderGeometry' || gType === 'CylinderBufferGeometry') {
        geometry = new THREE.CylinderGeometry(
          p.radiusTop ?? 0.42,
          p.radiusBottom ?? 0.42,
          p.height ?? 0.25,
          p.radialSegments ?? 32,
          p.heightSegments ?? 1,
          p.openEnded ?? false
        );
      } else if (gType === 'SphereGeometry' || gType === 'SphereBufferGeometry') {
        geometry = new THREE.SphereGeometry(
          p.radius ?? 0.42,
          p.widthSegments ?? 24,
          p.heightSegments ?? 16
        );
      } else if (gType === 'BoxGeometry' || gType === 'BoxBufferGeometry') {
        geometry = new THREE.BoxGeometry(
          p.width ?? 0.8,
          p.height ?? 0.8,
          p.depth ?? 0.25
        );
      } else if (gType === 'TorusGeometry' || gType === 'TorusBufferGeometry') {
        geometry = new THREE.TorusGeometry(
          p.radius ?? 0.38,
          p.tube ?? 0.08,
          p.radialSegments ?? 16,
          p.tubularSegments ?? 32
        );
      } else if (gType === 'RingGeometry' || gType === 'RingBufferGeometry') {
        geometry = new THREE.RingGeometry(
          p.innerRadius ?? 0.25,
          p.outerRadius ?? 0.42,
          p.thetaSegments ?? 32
        );
      } else if (gType === 'PlaneGeometry' || gType === 'PlaneBufferGeometry') {
        geometry = new THREE.PlaneGeometry(
          p.width ?? 0.8,
          p.height ?? 0.8,
          p.widthSegments ?? 1,
          p.heightSegments ?? 1
        );
      } else if (gType === 'CircleGeometry' || gType === 'CircleBufferGeometry') {
        geometry = new THREE.CircleGeometry(
          p.radius ?? 0.4,
          p.segments ?? 32
        );
      } else if (gType === 'OctahedronGeometry' || gType === 'OctahedronBufferGeometry') {
        geometry = new THREE.OctahedronGeometry(p.radius ?? 0.4, p.detail ?? 0);
      } else if (gType === 'IcosahedronGeometry' || gType === 'IcosahedronBufferGeometry') {
        geometry = new THREE.IcosahedronGeometry(p.radius ?? 0.4, p.detail ?? 0);
      } else if (gType === 'DodecahedronGeometry' || gType === 'DodecahedronBufferGeometry') {
        geometry = new THREE.DodecahedronGeometry(p.radius ?? 0.4, p.detail ?? 0);
      } else if (gType === 'ConeGeometry' || gType === 'ConeBufferGeometry') {
        geometry = new THREE.ConeGeometry(p.radius ?? 0.4, p.height ?? 0.6, p.radialSegments ?? 24);
      } else if (typeof THREE[gType] === 'function') {
        geometry = new THREE[gType]();
      }
    } catch (e) {}

    if (!geometry) {
      geometry = new THREE.CylinderGeometry(0.42, 0.42, 0.25, 32);
    }

    const material = Array.isArray(node.matList)
      ? node.matList.map(buildThreeMaterial)
      : buildThreeMaterial(node.mat);

    obj3d = new THREE.Mesh(geometry, material);
    obj3d.castShadow = true;
    obj3d.receiveShadow = true;
  } else {
    obj3d = new THREE.Group();
  }

  obj3d.name = node.name || '';
  obj3d.visible = node.visible !== false;
  if (Array.isArray(node.pos)) obj3d.position.set(node.pos[0], node.pos[1], node.pos[2]);
  if (Array.isArray(node.rot)) obj3d.rotation.set(node.rot[0], node.rot[1], node.rot[2]);
  if (Array.isArray(node.scale)) obj3d.scale.set(node.scale[0], node.scale[1], node.scale[2]);
  if (node.userData && typeof node.userData === 'object') {
    obj3d.userData = Object.assign({}, node.userData);
    // Ensure any falling-token targetY animation is settled at its final resting position
    if (typeof obj3d.userData.targetY === 'number') {
      obj3d.position.y = obj3d.userData.targetY;
    }
  }

  if (Array.isArray(node.children)) {
    for (const childNode of node.children) {
      const childObj = reconstructThreeObject(childNode);
      if (childObj) obj3d.add(childObj);
    }
  }

  return obj3d;
}

function serializeGroupChildren(group) {
  if (!group || !Array.isArray(group.children)) return [];
  const out = [];
  for (const child of group.children) {
    const serialized = serializeThreeObject(child);
    if (serialized) out.push(serialized);
  }
  return out;
}

function restoreGroupChildren(group, serializedList) {
  if (!group || !Array.isArray(serializedList)) return;
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  for (const item of serializedList) {
    const obj = reconstructThreeObject(item);
    if (obj) group.add(obj);
  }
}

// ----------------------------------------------------------------------------
// 3. RUNTIME INTROSPECTION OF NATIVE GAME FUNCTIONS (HUD & 3D SCENE)
// ----------------------------------------------------------------------------
// Discovers the exact helper functions called inside `startFloorMatch` and `hud.js`
// so resuming invokes the game's real renderers (preserving card/token click listeners).
function invokeDiscoveredNativeSyncFunctions(payload) {
  const excludedNames = new Set([
    'bootGame',
    'initNewRun',
    'startFloorMatch',
    'animate',
    'runOpeningSplashAndTitleSequence',
    'openBazaarModal',
    'openBossChestModal',
    'openRouletteModal',
    'triggerGameOver',
    'handleDefeat',
    'showFloorIntro',
    'playFloorIntro',
    'triggerFloorIntro',
    'runFloorIntro',
    'openDifficultyModal'
  ]);

  // 1. Parse helper calls directly inside window.startFloorMatch.toString()
  if (typeof window.startFloorMatch === 'function') {
    try {
      const src = window.startFloorMatch.toString();
      const callMatches = [...src.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*\)/g)];
      for (const m of callMatches) {
        const fnName = m[1];
        if (excludedNames.has(fnName)) continue;
        if (
          fnName.toLowerCase().includes('intro') ||
          fnName.toLowerCase().includes('reset') ||
          fnName.toLowerCase().includes('clear') ||
          fnName.toLowerCase().includes('init') ||
          fnName.toLowerCase().includes('draw') ||
          fnName.toLowerCase().includes('deal') ||
          fnName.toLowerCase().includes('shuffle')
        ) {
          continue;
        }
        if (typeof window[fnName] === 'function' && window[fnName].length === 0) {
          try {
            window[fnName]();
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // 2. Scan global functions on `window` that render HUD containers by their exact DOM IDs in index.html
  const hudDomTargetIds = [
    'hand-container',
    'reserve-pouch-container',
    'gambit-strip',
    'floor-num-badge',
    'boss-name-label',
    'gold-badge',
    'stability-badge',
    'mana-current',
    'floor-pip-bar',
    'difficulty-badge',
    'status-text'
  ];

  const mutationVerbs = /^(init|start|reset|clear|buy|sell|play|use|drop|cast|activate|trigger|open|close|show|hide|toggle|handle|on|bind|setup|boot|launch|apply|advance|next|spin|charge)/i;
  const renderVerbs = /^(update|render|sync|refresh|build|rebuild|draw|populate)/i;

  for (const key of Object.keys(window)) {
    if (excludedNames.has(key)) continue;
    if (mutationVerbs.test(key)) continue;
    if (!renderVerbs.test(key)) continue;

    let fn;
    try {
      fn = window[key];
    } catch (e) {
      continue;
    }
    if (typeof fn !== 'function' || fn.length > 0) continue;

    try {
      const fnSrc = fn.toString();
      // Never call a function that mutates floor/board/deck or opens an overlay
      if (
        fnSrc.includes('floor-intro-overlay') ||
        fnSrc.includes('intro-sequence-overlay') ||
        fnSrc.includes('difficulty-modal') ||
        fnSrc.includes('bazaar-modal') ||
        fnSrc.includes('gameover-modal')
      ) {
        continue;
      }

      const touchesHudDom = hudDomTargetIds.some((id) => fnSrc.includes(id));
      if (touchesHudDom) {
        fn();
      }
    } catch (e) {}
  }

  // 3. Direct DOM synchronization fallback for top/bottom HUD badges in index.html
  try {
    const s = state;
    if (!s) return;

    const floorIdx = getZeroBasedFloorIndex(s);
    const displayFloor = Math.min(TOTAL_FLOORS, Math.max(1, floorIdx + 1));

    const floorBadge = document.getElementById('floor-num-badge');
    if (floorBadge) floorBadge.textContent = `F${displayFloor}`;

    const goldBadge = document.getElementById('gold-badge');
    if (goldBadge && typeof s.gold === 'number') {
      goldBadge.textContent = `$${s.gold}`;
    }

    const stabilityBadge = document.getElementById('stability-badge');
    const stabVal = s.stability ?? s.seismicStability ?? s.turnsLeft;
    if (stabilityBadge && typeof stabVal === 'number') {
      stabilityBadge.textContent = `${stabVal}`;
    }

    const manaCur = document.getElementById('mana-current');
    const manaMax = document.getElementById('mana-max');
    if (manaCur && typeof s.mana === 'number') manaCur.textContent = `${s.mana}`;
    if (manaMax && typeof s.maxMana === 'number') manaMax.textContent = `${s.maxMana}`;

    const drawCountEl = document.getElementById('draw-count');
    const deckArr = s.drawPile || s.deck;
    if (drawCountEl && Array.isArray(deckArr)) {
      drawCountEl.textContent = `${deckArr.length}`;
    }

    const bossNameEl = document.getElementById('boss-name-label');
    if (bossNameEl && s.boss && s.boss.name) {
      bossNameEl.textContent = s.boss.name;
    }

    const topoBadge = document.getElementById('topology-badge');
    if (topoBadge && s.topology && s.topology.name) {
      const icon = s.topology.icon || '📐';
      topoBadge.textContent = `${icon} ${s.topology.name}`;
    }
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 4. PROGRESS DETECTION & CHECKPOINT SAVING
// ----------------------------------------------------------------------------
function getZeroBasedFloorIndex(s) {
  if (!s) return 0;
  if (typeof s.floorIndex === 'number') return s.floorIndex;
  if (typeof s.currentFloorIndex === 'number') return s.currentFloorIndex;
  if (typeof s.floor === 'number') {
    return s.floor > 0 ? s.floor - 1 : 0;
  }
  return 0;
}

function countPlayerOrAiTokensOnBoard(s) {
  if (!s || !Array.isArray(s.board)) return 0;
  let count = 0;
  for (const row of s.board) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (cell === PLAYER || cell === AI || cell === WILD) {
        count++;
      }
    }
  }
  return count;
}

function isIntroOrTitleStillVisible() {
  const introEl = document.getElementById('intro-sequence-overlay');
  if (introEl && !introEl.classList.contains('hidden') && introEl.style.display !== 'none') {
    const computed = window.getComputedStyle(introEl);
    if (computed.display !== 'none' && computed.visibility !== 'hidden' && parseFloat(computed.opacity || '1') > 0.05) {
      return true;
    }
  }
  const diffEl = document.getElementById('difficulty-modal');
  if (diffEl && !diffEl.classList.contains('hidden')) {
    return true;
  }
  return false;
}

function isRunSaveable() {
  if (_saveGateLocked || _isRestoringRun) return false;
  if (isIntroOrTitleStillVisible()) return false;
  if (typeof state === 'undefined' || !state) return false;
  if (state.runOver || state.isGameOver || state.gameOver || state.victory || state.runComplete) {
    return false;
  }

  const floorIdx = getZeroBasedFloorIndex(state);
  const droppedTokens = countPlayerOrAiTokensOnBoard(state);

  return floorIdx > 0 || droppedTokens > 0;
}

function saveCurrentRun(force = false) {
  try {
    if (_isRestoringRun) return false;
    if (!force && (_saveGateLocked || !isRunSaveable())) return false;
    if (typeof state === 'undefined' || !state) return false;

    const floorIdx = getZeroBasedFloorIndex(state);
    const droppedTokens = countPlayerOrAiTokensOnBoard(state);
    // Even if forced, never overwrite a valid checkpoint with a blank Floor 1 board
    if (floorIdx === 0 && droppedTokens === 0 && !force) return false;

    const cleanState = sanitizeForSerialization(state);
    if (!cleanState || typeof cleanState !== 'object') return false;

    for (const [k, defaultVal] of Object.entries(SAFE_PLAYABLE_FLAGS)) {
      if (k in state) {
        cleanState[k] = defaultVal;
      }
    }

    const bGroup = (typeof boardGroup !== 'undefined' && boardGroup)
      ? boardGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.boardGroup : null);

    const tGroup = (typeof tokensGroup !== 'undefined' && tokensGroup)
      ? tokensGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.tokensGroup : null);

    const eGroup = (typeof enchantGroup !== 'undefined' && enchantGroup)
      ? enchantGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.enchantGroup : null);

    const payload = {
      schemaVersion: RUN_SAVE_SCHEMA_VERSION,
      savedAt: Date.now(),
      summary: {
        floorIndex: floorIdx,
        tokensOnBoard: droppedTokens,
        difficulty: state.difficulty || 'MEDIUM',
        gold: typeof state.gold === 'number' ? state.gold : 6,
        gambitCount: Array.isArray(state.gambits)
          ? state.gambits.length
          : (Array.isArray(state.activeGambits) ? state.activeGambits.length : 0),
        cardCount: Array.isArray(state.hand)
          ? state.hand.length
          : (Array.isArray(state.cards) ? state.cards.length : 0),
        reserveCount: Array.isArray(state.reserves)
          ? state.reserves.length
          : (Array.isArray(state.reserveTokens) ? state.reserveTokens.length : 0)
      },
      stateSnapshot: cleanState,
      board3DSnapshot: serializeGroupChildren(bGroup),
      tokens3DSnapshot: serializeGroupChildren(tGroup),
      enchant3DSnapshot: serializeGroupChildren(eGroup)
    };

    localStorage.setItem(RUN_SAVE_STORAGE_KEY, JSON.stringify(payload));
    _bootCachedPayload = payload;
    updateCheckpointPillUI(true);
    return true;
  } catch (e) {
    return false;
  }
}

function loadSavedRunPayload() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : _bootCachedPayload;
    if (
      !parsed ||
      !parsed.stateSnapshot ||
      typeof parsed.stateSnapshot !== 'object'
    ) {
      return null;
    }

    // Ignore any corrupted/blank Floor 1 save left over from v1/v2 boot overwrites
    const floorIdx = getZeroBasedFloorIndex(parsed.stateSnapshot);
    const tokensCount = countPlayerOrAiTokensOnBoard(parsed.stateSnapshot);
    if (floorIdx === 0 && tokensCount === 0) {
      return null;
    }

    return parsed;
  } catch (e) {
    return _bootCachedPayload || null;
  }
}

function hasSavedRun() {
  return loadSavedRunPayload() !== null;
}

function clearSavedRun() {
  _bootCachedPayload = null;
  _saveGateLocked = false;
  try {
    localStorage.removeItem(RUN_SAVE_STORAGE_KEY);
  } catch (e) {}
  updateCheckpointPillUI(false);
}

// ----------------------------------------------------------------------------
// 5. FULL OVERLAY DISMISSAL & RUN RESTORATION
// ----------------------------------------------------------------------------
function dismissStartupAndIntroOverlays() {
  // 1. Explicitly hide `#intro-sequence-overlay` and its inner stages from index.html
  const introOverlay = document.getElementById('intro-sequence-overlay');
  if (introOverlay) {
    introOverlay.classList.add('hidden');
    introOverlay.style.display = 'none';
    introOverlay.style.opacity = '0';
    introOverlay.style.pointerEvents = 'none';
  }

  const stageIds = [
    'terminal-boot-stage',
    'dyagonil-splash-stage',
    'title-opener-stage'
  ];
  for (const id of stageIds) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  // 2. Hide `#difficulty-modal` and `#floor-intro-overlay` using `.hidden` class
  //    (without permanently breaking their inline `display` for future floors)
  const modalIdsToClose = [
    'difficulty-modal',
    'floor-intro-overlay',
    'gameover-modal'
  ];
  for (const id of modalIdsToClose) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active', 'visible', 'show', 'flex');
    }
  }

  document.body.classList.remove('modal-occluded');
}

function resumeSavedRun() {
  const payload = loadSavedRunPayload();
  if (!payload || !payload.stateSnapshot) return false;

  _isRestoringRun = true;
  _saveGateLocked = false;

  try {
    const catalogMap = buildCatalogLookupMap();
    const restoredPhase1 = rehydrateFromCatalogs(payload.stateSnapshot, catalogMap);

    // 1. Apply floor/topology/boss state first
    applyRestoredStateInPlace(state, restoredPhase1);

    // 2. Let startFloorMatch build the 3D cavern board geometry & lighting for this floor
    if (typeof startFloorMatch === 'function') {
      try {
        startFloorMatch(false);
      } catch (e) {}
    }

    // 3. Re-apply the exact mid-floor snapshot (board matrix, hand, deck, reserves, gambits, mana, stability, turn)
    const restoredPhase2 = rehydrateFromCatalogs(payload.stateSnapshot, catalogMap);
    applyRestoredStateInPlace(state, restoredPhase2);

    // 4. Restore 3D groups (tokensGroup & enchantGroup, plus boardGroup fallback)
    const bGroup = (typeof boardGroup !== 'undefined' && boardGroup)
      ? boardGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.boardGroup : null);

    const tGroup = (typeof tokensGroup !== 'undefined' && tokensGroup)
      ? tokensGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.tokensGroup : null);

    const eGroup = (typeof enchantGroup !== 'undefined' && enchantGroup)
      ? enchantGroup
      : (window.C4 && window.C4.scene3d ? window.C4.scene3d.enchantGroup : null);

    if (bGroup && bGroup.children.length === 0 && Array.isArray(payload.board3DSnapshot) && payload.board3DSnapshot.length > 0) {
      restoreGroupChildren(bGroup, payload.board3DSnapshot);
    }

    if (eGroup && Array.isArray(payload.enchant3DSnapshot) && payload.enchant3DSnapshot.length > 0) {
      restoreGroupChildren(eGroup, payload.enchant3DSnapshot);
    }

    if (tGroup && Array.isArray(payload.tokens3DSnapshot) && payload.tokens3DSnapshot.length > 0) {
      restoreGroupChildren(tGroup, payload.tokens3DSnapshot);
    }

    // 5. Invoke discovered native HUD & scene sync functions
    invokeDiscoveredNativeSyncFunctions(payload);

    // Re-ensure 3D tokens are in tokensGroup in case a native sync function cleared tokensGroup
    if (tGroup && tGroup.children.length === 0 && Array.isArray(payload.tokens3DSnapshot) && payload.tokens3DSnapshot.length > 0) {
      restoreGroupChildren(tGroup, payload.tokens3DSnapshot);
    }

    // 6. Dismiss `#intro-sequence-overlay`, `#difficulty-modal`, and `#floor-intro-overlay`
    //    immediately and again after short delays (in case startFloorMatch schedules a fade-in timer)
    dismissStartupAndIntroOverlays();
    setTimeout(dismissStartupAndIntroOverlays, 80);
    setTimeout(dismissStartupAndIntroOverlays, 320);
    setTimeout(() => {
      applyRestoredStateInPlace(state, rehydrateFromCatalogs(payload.stateSnapshot, catalogMap));
      if (tGroup && tGroup.children.length === 0 && Array.isArray(payload.tokens3DSnapshot) && payload.tokens3DSnapshot.length > 0) {
        restoreGroupChildren(tGroup, payload.tokens3DSnapshot);
      }
      invokeDiscoveredNativeSyncFunctions(payload);
    }, 150);

    // 7. Start 8-bit chiptune BGM if music is enabled
    if (typeof userSettings !== 'undefined' && userSettings.musicEnabled && typeof bgm !== 'undefined' && bgm) {
      try {
        if (typeof bgm.start === 'function') bgm.start();
        else if (typeof bgm.play === 'function') bgm.play();
      } catch (e) {}
    }

    // 8. Re-persist the active payload and update the HUD pill
    localStorage.setItem(RUN_SAVE_STORAGE_KEY, JSON.stringify(payload));
    _bootCachedPayload = payload;
    updateCheckpointPillUI(true);

    // 9. If it was the AI's turn when saved, nudge the AI solver to make its move
    if (state.turn === AI || state.currentTurn === AI) {
      const aiTriggerFns = ['triggerAiTurn', 'executeAiTurn', 'runAiTurn', 'scheduleAiMove', 'aiMove', 'performAiMove'];
      setTimeout(() => {
        for (const fnName of aiTriggerFns) {
          if (typeof window[fnName] === 'function') {
            try {
              window[fnName]();
              break;
            } catch (e) {}
          }
        }
      }, 500);
    }

    if (typeof showToast === 'function') {
      try {
        showToast('DELVE RESUMED');
      } catch (e) {}
    }
  } finally {
    _isRestoringRun = false;
  }

  return true;
}

// ----------------------------------------------------------------------------
// 6. RESUME DELVE DIALOGUE BOX (TRIGGERED AFTER HITTING "START GAME")
// ----------------------------------------------------------------------------
function formatRelativeSaveTime(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function promptResumeIfAvailable(options = {}) {
  const payload = loadSavedRunPayload();
  if (!payload) return false;

  const existing = document.getElementById('c4-resume-delve-modal');
  if (existing) existing.remove();

  const summary = payload.summary || {};
  const rawFloorIdx = typeof summary.floorIndex === 'number'
    ? summary.floorIndex
    : getZeroBasedFloorIndex(payload.stateSnapshot);
  const displayFloor = Math.min(TOTAL_FLOORS, Math.max(1, rawFloorIdx + 1));
  const actNum = Math.ceil(displayFloor / 3);
  const diffLabel = summary.difficulty || payload.stateSnapshot.difficulty || 'MEDIUM';
  const tokensCount = typeof summary.tokensOnBoard === 'number'
    ? summary.tokensOnBoard
    : countPlayerOrAiTokensOnBoard(payload.stateSnapshot);
  const timeAgo = formatRelativeSaveTime(payload.savedAt);

  const overlay = document.createElement('div');
  overlay.id = 'c4-resume-delve-modal';
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 2147483647',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'padding: 1.25rem',
    'background: rgba(7, 6, 9, 0.86)',
    'backdrop-filter: blur(12px)',
    '-webkit-backdrop-filter: blur(12px)',
    'opacity: 0',
    'transition: opacity 0.22s ease-out',
    'pointer-events: auto'
  ].join(';');

  overlay.innerHTML = `
    <div class="cavern-panel" style="
      width: 100%;
      max-width: 390px;
      border-radius: 1.25rem;
      padding: 1.35rem 1.25rem;
      border: 1px solid rgba(45, 212, 191, 0.55);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.92), 0 0 28px rgba(45, 212, 191, 0.18);
      color: #f8fafc;
      text-align: center;
    ">
      <div class="font-mono-code" style="
        font-size: 0.7rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #2dd4bf;
        margin-bottom: 0.35rem;
      ">// CHECKPOINT TELEMETRY DETECTED //</div>

      <h2 class="font-display" style="
        margin: 0 0 0.4rem 0;
        font-size: 1.32rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #f8fafc;
      ">RESUME SAVED DELVE?</h2>

      <p style="
        margin: 0 0 1rem 0;
        font-size: 0.82rem;
        color: #94a3b8;
        line-height: 1.45;
      ">Unfinished delve recorded ${timeAgo} (${tokensCount} tokens on board).</p>

      <div class="font-mono-code" style="
        background: rgba(7, 6, 9, 0.78);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 1.15rem;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.55rem;
        font-size: 0.75rem;
        text-align: left;
      ">
        <div>
          <span style="color: #64748b; display: block; font-size: 0.65rem;">DEPTH</span>
          <strong style="color: #2dd4bf;">FLOOR ${displayFloor}/${TOTAL_FLOORS} (ACT ${actNum})</strong>
        </div>
        <div>
          <span style="color: #64748b; display: block; font-size: 0.65rem;">DIFFICULTY</span>
          <strong style="color: #fbbf24;">${diffLabel}</strong>
        </div>
        <div>
          <span style="color: #64748b; display: block; font-size: 0.65rem;">ARCANE HAND</span>
          <strong style="color: #e2e8f0;">${summary.cardCount || 0} CARDS</strong>
        </div>
        <div>
          <span style="color: #64748b; display: block; font-size: 0.65rem;">RELICS &amp; RESERVES</span>
          <strong style="color: #f43f5e;">${summary.gambitCount || 0}G / ${summary.reserveCount || 0}R</strong>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        <button type="button" id="c4-btn-resume-delve" class="font-display" style="
          width: 100%;
          padding: 0.82rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #2dd4bf;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.45), rgba(15, 118, 110, 0.78));
          color: #f0fdfa;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(45, 212, 191, 0.28);
        ">⛏️ RESUME DELVE (FLOOR ${displayFloor})</button>

        <button type="button" id="c4-btn-abandon-delve" class="font-mono-code" style="
          width: 100%;
          padding: 0.65rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(244, 63, 94, 0.35);
          background: rgba(30, 20, 26, 0.78);
          color: #fda4af;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          cursor: pointer;
        ">ABANDON &amp; START FRESH RUN</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  const closePrompt = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  const resumeBtn = document.getElementById('c4-btn-resume-delve');
  const abandonBtn = document.getElementById('c4-btn-abandon-delve');

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (typeof sfx !== 'undefined' && sfx && typeof sfx.click === 'function') {
        try { sfx.click(); } catch (e) {}
      }
      closePrompt();
      resumeSavedRun();
    });
  }

  if (abandonBtn) {
    abandonBtn.addEventListener('click', () => {
      if (typeof sfx !== 'undefined' && sfx && typeof sfx.click === 'function') {
        try { sfx.click(); } catch (e) {}
      }
      clearSavedRun();
      closePrompt();

      // If this prompt was triggered by clicking `#title-start-game-btn`, proceed
      // with the normal Start Game flow (which fades out the title screen & opens difficulty modal)
      if (options.fromStartButton) {
        const startBtn = document.getElementById('title-start-game-btn');
        if (startBtn) {
          _bypassStartBtnInterceptOnce = true;
          startBtn.click();
        }
      }
    });
  }

  return true;
}

// ----------------------------------------------------------------------------
// 7. FLOATING HUD CHECKPOINT PILL
// ----------------------------------------------------------------------------
function mountCheckpointPillUI() {
  if (document.getElementById('c4-checkpoint-pill')) return;
  const pill = document.createElement('button');
  pill.id = 'c4-checkpoint-pill';
  pill.type = 'button';
  pill.className = 'font-mono-code';
  pill.title = 'Click to save checkpoint or open Resume Delve menu';
  pill.style.cssText = [
    'position: fixed',
    'bottom: max(0.55rem, env(safe-area-inset-bottom))',
    'right: 0.65rem',
    'z-index: 49',
    'padding: 0.28rem 0.55rem',
    'border-radius: 999px',
    'font-size: 0.62rem',
    'letter-spacing: 0.06em',
    'background: rgba(14, 12, 18, 0.88)',
    'border: 1px solid rgba(45, 212, 191, 0.35)',
    'color: #94a3b8',
    'cursor: pointer',
    'display: flex',
    'align-items: center',
    'gap: 0.35rem',
    'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6)'
  ].join(';');

  pill.innerHTML = `<span id="c4-cp-dot" style="width:6px;height:6px;border-radius:50%;background:#64748b;display:inline-block;"></span><span id="c4-cp-label">CP: EMPTY</span>`;

  pill.addEventListener('click', () => {
    if (hasSavedRun() && (_saveGateLocked || isIntroOrTitleStillVisible())) {
      promptResumeIfAvailable({ fromStartButton: false });
      return;
    }
    const ok = saveCurrentRun(false);
    if (ok) {
      if (typeof showToast === 'function') {
        try { showToast('CHECKPOINT SAVED'); } catch (e) {}
      }
    } else if (hasSavedRun()) {
      promptResumeIfAvailable({ fromStartButton: false });
    }
  });

  document.body.appendChild(pill);
  updateCheckpointPillUI(hasSavedRun());
}

function updateCheckpointPillUI(saved) {
  const dot = document.getElementById('c4-cp-dot');
  const label = document.getElementById('c4-cp-label');
  if (!dot || !label) return;
  if (saved) {
    dot.style.background = '#2dd4bf';
    dot.style.boxShadow = '0 0 8px #2dd4bf';
    label.style.color = '#ccfbf1';
    label.textContent = 'CP: SAVED';
  } else {
    dot.style.background = '#64748b';
    dot.style.boxShadow = 'none';
    label.style.color = '#94a3b8';
    label.textContent = 'CP: EMPTY';
  }
}

// ----------------------------------------------------------------------------
// 8. HOOKS ON `#title-start-game-btn`, RESET BUTTONS, & AUTO-SAVE POLLER
// ----------------------------------------------------------------------------
function captureBootCheckpointBeforeInit() {
  const existing = loadSavedRunPayload();
  if (existing && existing.stateSnapshot) {
    _bootCachedPayload = existing;
    _saveGateLocked = true;
    return true;
  }
  return false;
}

function installAutoSaveHooks() {
  if (installAutoSaveHooks.installed) return;
  installAutoSaveHooks.installed = true;

  mountCheckpointPillUI();

  // 1. Intercept `#title-start-game-btn` ("⛏️ Start Game") in the capture phase
  //    so the Resume Delve dialogue box appears ONLY after hitting Start Game!
  const titleStartBtn = document.getElementById('title-start-game-btn');
  if (titleStartBtn) {
    titleStartBtn.addEventListener(
      'click',
      (e) => {
        if (_bypassStartBtnInterceptOnce) {
          _bypassStartBtnInterceptOnce = false;
          _saveGateLocked = false;
          return;
        }
        if (hasSavedRun()) {
          e.stopImmediatePropagation();
          e.preventDefault();
          if (typeof sfx !== 'undefined' && sfx && typeof sfx.click === 'function') {
            try { sfx.click(); } catch (err) {}
          }
          promptResumeIfAvailable({ fromStartButton: true });
        } else {
          _saveGateLocked = false;
        }
      },
      true // Capture phase: runs before introSequence.js's bubble listener
    );
  }

  // 2. Unlock `_saveGateLocked` when any difficulty card is chosen for a new run
  const diffContainer = document.getElementById('difficulty-cards-container');
  if (diffContainer) {
    diffContainer.addEventListener(
      'click',
      () => {
        _saveGateLocked = false;
      },
      true
    );
  }

  // 3. Clear saved checkpoint when the player explicitly clicks "Restart Run",
  //    "Reset Run (Floor 1)", or "Start Fresh Run (Floor 1)"
  const explicitResetBtnIds = [
    'restart-btn',
    'settings-reset-run-btn',
    'new-ascension-btn'
  ];
  for (const btnId of explicitResetBtnIds) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener(
        'click',
        () => {
          clearSavedRun();
        },
        true
      );
    }
  }

  // 4. Clear saved run automatically when a run ends in defeat or final victory
  const terminalFunctionsToClearOn = [
    'triggerGameOver',
    'handleDefeat',
    'showRunVictoryModal',
    'handleRunVictory'
  ];

  for (const fnName of terminalFunctionsToClearOn) {
    if (typeof window[fnName] === 'function' && !window[fnName]._c4ClearWrapped) {
      const originalFn = window[fnName];
      const wrapped = function (...args) {
        clearSavedRun();
        return originalFn.apply(this, args);
      };
      wrapped._c4ClearWrapped = true;
      window[fnName] = wrapped;
    }
  }

  // 5. Poll every 700ms for settled board/floor progress during active gameplay
  let lastFingerprint = '';
  setInterval(() => {
    if (typeof state === 'undefined' || !state) return;
    if (_saveGateLocked || _isRestoringRun) return;
    if (isIntroOrTitleStillVisible()) return;

    if (state.runOver || state.isGameOver || state.gameOver || state.victory || state.runComplete) {
      if (lastFingerprint !== 'TERMINAL') {
        clearSavedRun();
        lastFingerprint = 'TERMINAL';
      }
      return;
    }

    if (state.isAnimating || state.aiThinking || state.isAiThinking) return;
    if (!isRunSaveable()) return;

    try {
      const boardSig = Array.isArray(state.board) ? JSON.stringify(state.board) : '';
      const floorSig = getZeroBasedFloorIndex(state);
      const turnSig = state.turn || state.currentTurn || 0;
      const goldSig = state.gold || 0;
      const manaSig = state.mana || 0;
      const handSig = Array.isArray(state.hand)
        ? state.hand.length
        : (Array.isArray(state.cards) ? state.cards.length : 0);
      const resSig = Array.isArray(state.reserves)
        ? state.reserves.length
        : (Array.isArray(state.reserveTokens) ? state.reserveTokens.length : 0);
      const gambitSig = Array.isArray(state.gambits)
        ? state.gambits.length
        : (Array.isArray(state.activeGambits) ? state.activeGambits.length : 0);

      const fp = `${floorSig}|${turnSig}|${goldSig}|${manaSig}|${handSig}|${resSig}|${gambitSig}|${boardSig}`;
      if (fp !== lastFingerprint) {
        lastFingerprint = fp;
        saveCurrentRun();
      }
    } catch (e) {}
  }, 700);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveCurrentRun();
    }
  });
  window.addEventListener('pagehide', () => {
    saveCurrentRun();
  });
  window.addEventListener('beforeunload', () => {
    saveCurrentRun();
  });
}

const runPersistence = {
  STORAGE_KEY: RUN_SAVE_STORAGE_KEY,
  captureBootCheckpointBeforeInit,
  saveRun: saveCurrentRun,
  loadRun: loadSavedRunPayload,
  hasSavedRun,
  clearSavedRun,
  resumeSavedRun,
  promptResumeIfAvailable,
  installAutoSaveHooks
};

window.runPersistence = runPersistence;
