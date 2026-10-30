// ============================================================================
// MID-RUN SAVE & RESUME PERSISTENCE ENGINE v2 (js/state/persistence.js)
// ============================================================================
// Fixes:
// 1. Auto-save gate lock: Prevents bootGame()'s initNewRun() and Title Screen
//    initialization from overwriting an existing checkpoint in localStorage.
// 2. Title/Splash Screen integration: Intercepts #title-start-game-btn and
//    post-boot initNewRun() calls, and dismisses lingering overlays on resume.
// 3. Direct Three.js tokensGroup & enchantGroup mesh serialization/restoration
//    plus state.meshes[r][c] re-linking so 3D tokens reappear and stay interactive.
// ============================================================================

const RUN_SAVE_STORAGE_KEY = 'c4_subterranean_saved_run_v1';
const RUN_SAVE_SCHEMA_VERSION = 2;

// Keys on `state` that represent transient UI/animation locks or timer IDs
const TRANSIENT_STATE_KEYS = new Set([
  'busy',
  'isAnimating',
  'aiThinking',
  'isAiThinking',
  'inputLocked',
  'turnLocked',
  'isSpinningRoulette',
  'rouletteSpinning',
  'activeModal',
  'previewCol',
  'hoveredCol',
  'hoverCol',
  'pendingDropCol',
  'selectedCardIdx',
  'selectedCardIndex',
  'selectedReserveIdx',
  'selectedReserveIndex',
  'winningCells',
  'winLine',
  'aiTimeoutId',
  'turnTimerId',
  'meshes'
]);

const SAFE_TRANSIENT_DEFAULTS = {
  busy: false,
  isAnimating: false,
  aiThinking: false,
  isAiThinking: false,
  inputLocked: false,
  turnLocked: false,
  isSpinningRoulette: false,
  rouletteSpinning: false,
  previewCol: -1,
  hoveredCol: -1,
  hoverCol: -1,
  pendingDropCol: null,
  selectedCardIdx: null,
  selectedCardIndex: null,
  selectedReserveIdx: null,
  selectedReserveIndex: null
};

// Gate lock: when a prior save exists at boot, block all auto-saves until the
// player explicitly chooses "Resume Delve" or "Abandon & Start Floor 1".
let _saveGateLocked = false;
let _bootCachedPayload = null;
let _isRestoringRun = false;

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

// ----------------------------------------------------------------------------
// 2. THREE.JS 3D TOKEN & ENCHANT MESH SNAPSHOTTING
// ----------------------------------------------------------------------------
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

    const m = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (m) {
      node.mat = {
        type: m.type || 'MeshStandardMaterial',
        color: (m.color && typeof m.color.getHex === 'function') ? m.color.getHex() : 0xffffff,
        emissive: (m.emissive && typeof m.emissive.getHex === 'function') ? m.emissive.getHex() : 0x000000,
        emissiveIntensity: typeof m.emissiveIntensity === 'number' ? m.emissiveIntensity : 1,
        roughness: typeof m.roughness === 'number' ? m.roughness : 0.4,
        metalness: typeof m.metalness === 'number' ? m.metalness : 0.3,
        transparent: !!m.transparent,
        opacity: typeof m.opacity === 'number' ? m.opacity : 1,
        wireframe: !!m.wireframe,
        side: typeof m.side === 'number' ? m.side : 0
      };
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

function reconstructThreeObject(node) {
  if (!node || typeof THREE === 'undefined') return null;

  let obj3d = null;
  if (node.isMesh && node.geom && node.mat) {
    let geometry = null;
    const p = node.geom.params || {};
    const gType = node.geom.type;

    try {
      if (gType === 'CylinderGeometry' || gType === 'CylinderBufferGeometry') {
        if (typeof tokenGeo !== 'undefined' && tokenGeo) {
          geometry = tokenGeo;
        } else {
          geometry = new THREE.CylinderGeometry(
            p.radiusTop ?? 0.44,
            p.radiusBottom ?? 0.44,
            p.height ?? 0.32,
            p.radialSegments ?? 28,
            p.heightSegments ?? 1,
            p.openEnded ?? false
          );
          geometry.rotateX(Math.PI / 2);
        }
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
      } else if (gType === 'OctahedronGeometry' || gType === 'OctahedronBufferGeometry') {
        geometry = new THREE.OctahedronGeometry(p.radius ?? 0.4, p.detail ?? 0);
      } else if (gType === 'IcosahedronGeometry' || gType === 'IcosahedronBufferGeometry') {
        geometry = new THREE.IcosahedronGeometry(p.radius ?? 0.4, p.detail ?? 0);
      } else if (gType === 'ConeGeometry' || gType === 'ConeBufferGeometry') {
        geometry = new THREE.ConeGeometry(p.radius ?? 0.4, p.height ?? 0.6, p.radialSegments ?? 24);
      } else if (typeof THREE[gType] === 'function') {
        geometry = new THREE[gType]();
      }
    } catch (e) {}

    if (!geometry) {
      if (typeof tokenGeo !== 'undefined' && tokenGeo) {
        geometry = tokenGeo;
      } else {
        geometry = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 28);
        geometry.rotateX(Math.PI / 2);
      }
    }

    // Reuse canonical scene3d token materials when color matches so woodTex maps are preserved
    let material = null;
    const hexColor = node.mat.color ?? 0xffffff;
    if (!node.mat.transparent) {
      if (hexColor === 0xfbbf24 && typeof playerMat !== 'undefined' && playerMat) {
        material = playerMat;
      } else if (hexColor === 0x14b8a6 && typeof aiMat !== 'undefined' && aiMat) {
        material = aiMat;
      } else if (hexColor === 0x78716c && typeof stoneMat !== 'undefined' && stoneMat) {
        material = stoneMat;
      } else if (hexColor === 0xe879f9 && typeof wildMat !== 'undefined' && wildMat) {
        material = wildMat;
      } else if (hexColor === 0xffffff && typeof winGlowMat !== 'undefined' && winGlowMat) {
        material = winGlowMat;
      }
    }

    if (!material) {
      const MatClass = (typeof THREE[node.mat.type] === 'function')
        ? THREE[node.mat.type]
        : THREE.MeshStandardMaterial;

      const matConfig = {
        color: hexColor,
        transparent: !!node.mat.transparent,
        opacity: node.mat.opacity ?? 1,
        wireframe: !!node.mat.wireframe
      };
      if (MatClass !== THREE.MeshBasicMaterial) {
        matConfig.emissive = node.mat.emissive ?? 0x000000;
        matConfig.emissiveIntensity = node.mat.emissiveIntensity ?? 1;
        if ('roughness' in node.mat) matConfig.roughness = node.mat.roughness;
        if ('metalness' in node.mat) matConfig.metalness = node.mat.metalness;
      }

      material = new MatClass(matConfig);
    }
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

// Re-links `state.meshes[r][c]` to restored 3D token meshes so cards & boss powers can manipulate them
function rebuildStateMeshesGridFromScene(tGroup) {
  if (typeof state === 'undefined' || !state) return;
  const rows = typeof ROWS === 'number' ? ROWS : 6;
  const cols = typeof COLS === 'number' ? COLS : 7;

  // If spawnTokenMesh exists and tokensGroup is empty, rebuild from state.board
  if (
    tGroup &&
    tGroup.children.length === 0 &&
    Array.isArray(state.board) &&
    typeof spawnTokenMesh === 'function'
  ) {
    state.meshes = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = state.board[r] ? state.board[r][c] : 0;
        if (cell === PLAYER || cell === AI || cell === STONE || cell === WILD) {
          try {
            spawnTokenMesh(r, c, cell);
            if (state.meshes[r] && state.meshes[r][c] && state.meshes[r][c].userData) {
              state.meshes[r][c].position.y = state.meshes[r][c].userData.targetY ?? state.meshes[r][c].position.y;
            }
          } catch (e) {}
        }
      }
    }
    return;
  }

  if (!tGroup || !Array.isArray(tGroup.children)) return;
  state.meshes = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (const child of tGroup.children) {
    if (!child) continue;
    const ud = child.userData || {};
    if (typeof ud.row === 'number' && typeof ud.col === 'number') {
      if (state.meshes[ud.row]) {
        state.meshes[ud.row][ud.col] = child;
      }
      continue;
    }
    // Fallback: derive grid (row, col) from world (x, targetY/y) if getBoardWorldPos is available
    if (typeof getBoardWorldPos === 'function') {
      let bestR = -1;
      let bestC = -1;
      let bestDist = Infinity;
      const targetY = typeof ud.targetY === 'number' ? ud.targetY : child.position.y;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wp = getBoardWorldPos(r, c);
          if (!wp) continue;
          const d = Math.hypot(child.position.x - wp.x, targetY - wp.y);
          if (d < bestDist && d < 0.65) {
            bestDist = d;
            bestR = r;
            bestC = c;
          }
        }
      }
      if (bestR !== -1 && bestC !== -1 && state.meshes[bestR]) {
        state.meshes[bestR][bestC] = child;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 3. PROGRESS DETECTION & CHECKPOINT SAVING
// ----------------------------------------------------------------------------
function getZeroBasedFloorIndex(s) {
  if (!s) return 0;
  if (typeof s.floorIdx === 'number') return s.floorIdx;
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

// Only consider a run saveable if the player has actually dropped at least 1 token
// OR advanced past Floor 1 (floorIdx > 0), preventing blank Floor 1 overwrites!
function isRunSaveable() {
  if (_saveGateLocked || _isRestoringRun) return false;
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

    const cleanState = sanitizeForSerialization(state);
    if (!cleanState || typeof cleanState !== 'object') return false;

    for (const [k, defaultVal] of Object.entries(SAFE_TRANSIENT_DEFAULTS)) {
      if (k in state) {
        cleanState[k] = defaultVal;
      }
    }

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
        floorIndex: getZeroBasedFloorIndex(state),
        tokensOnBoard: countPlayerOrAiTokensOnBoard(state),
        difficulty: state.difficulty || 'MEDIUM',
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
    if (!raw) return _bootCachedPayload || null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !parsed.stateSnapshot ||
      typeof parsed.stateSnapshot !== 'object'
    ) {
      return _bootCachedPayload || null;
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
// 4. RESTORING THE SAVED RUN (STATE + 3D SCENE + HUD + OVERLAY CLEANUP)
// ----------------------------------------------------------------------------
function dismissAnyTitleOrSplashOverlays() {
  const candidateIds = [
    'title-screen',
    'title-modal',
    'title-overlay',
    'difficulty-modal',
    'floor-intro-overlay',
    'splash-screen',
    'splash-overlay',
    'intro-overlay',
    'intro-screen',
    'boot-gate',
    'terminal-gate',
    'crt-gate',
    'opening-overlay'
  ];
  for (const id of candidateIds) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  }

  const allFixed = document.querySelectorAll('.fixed.inset-0, [style*="position: fixed"]');
  allFixed.forEach((el) => {
    if (el.id === 'webgl-container' || el.id === 'c4-resume-delve-modal') return;
    const txt = (el.innerText || '').toUpperCase();
    if (
      el.querySelector('.title-token-piece') ||
      (txt.includes('SUBTERRANEAN ASCENSION') && (txt.includes('BEGIN') || txt.includes('START') || txt.includes('ASCEND') || txt.includes('ENTER')))
    ) {
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  });
  document.body.classList.remove('modal-occluded');
}

function syncSceneAndHudAfterRestore(payload) {
  const tGroup = (typeof tokensGroup !== 'undefined' && tokensGroup)
    ? tokensGroup
    : (window.C4 && window.C4.scene3d ? window.C4.scene3d.tokensGroup : null);

  const eGroup = (typeof enchantGroup !== 'undefined' && enchantGroup)
    ? enchantGroup
    : (window.C4 && window.C4.scene3d ? window.C4.scene3d.enchantGroup : null);

  // Restore 3D tokens directly into tokensGroup if snapshot meshes exist
  if (tGroup && payload && Array.isArray(payload.tokens3DSnapshot) && payload.tokens3DSnapshot.length > 0) {
    restoreGroupChildren(tGroup, payload.tokens3DSnapshot);
  }

  // Re-link state.meshes[r][c] so card/boss effects can reference restored 3D tokens
  rebuildStateMeshesGridFromScene(tGroup);

  // Restore 3D enchant meshes if snapshot exists, or rebuild via rebuildEnchantmentRings
  if (eGroup && payload && Array.isArray(payload.enchant3DSnapshot) && payload.enchant3DSnapshot.length > 0) {
    restoreGroupChildren(eGroup, payload.enchant3DSnapshot);
  } else if (typeof rebuildEnchantmentRings === 'function') {
    try { rebuildEnchantmentRings(); } catch (e) {}
  }

  // Call any global HUD refresh functions defined in js/ui/hud.js or notifications.js
  const hudSyncFns = [
    'syncHUD',
    'updateHUD',
    'renderHUD',
    'refreshHUD',
    'renderCardsHUD',
    'renderHand',
    'renderArcaneCards',
    'renderReservesHUD',
    'renderReserves',
    'renderReserveTokens',
    'renderGambitsHUD',
    'renderGambits',
    'updateFloorBanner',
    'updateHeaderHUD',
    'updateTurnIndicator',
    'updateTelemetryBadges',
    'syncSettingsUI'
  ];
  for (const fnName of hudSyncFns) {
    if (typeof window[fnName] === 'function') {
      try {
        window[fnName]();
      } catch (e) {}
    }
  }
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
    Object.assign(state, restoredPhase1);

    // 2. Let startFloorMatch build the 3D cavern board geometry & lighting for this floor
    if (typeof startFloorMatch === 'function') {
      try {
        startFloorMatch(false);
      } catch (e) {}
    }

    // 3. Re-apply the exact mid-floor snapshot (board matrix, hand, reserves, gambits, turn)
    const restoredPhase2 = rehydrateFromCatalogs(payload.stateSnapshot, catalogMap);
    Object.assign(state, restoredPhase2);

    for (const [k, defaultVal] of Object.entries(SAFE_TRANSIENT_DEFAULTS)) {
      if (k in state) {
        state[k] = defaultVal;
      }
    }

    // 4. Reconstruct 3D token meshes, enchantment slots, and HUD
    syncSceneAndHudAfterRestore(payload);
    dismissAnyTitleOrSplashOverlays();

    // Ensure localStorage still holds the restored payload
    localStorage.setItem(RUN_SAVE_STORAGE_KEY, JSON.stringify(payload));
    _bootCachedPayload = payload;
    updateCheckpointPillUI(true);

    // 5. If it was the AI's turn when saved, trigger AI move
    if (state.turn === AI || state.currentTurn === AI) {
      const aiTriggerFns = ['triggerAiTurn', 'executeAiTurn', 'runAiTurn', 'scheduleAiMove', 'aiMove'];
      setTimeout(() => {
        for (const fnName of aiTriggerFns) {
          if (typeof window[fnName] === 'function') {
            try {
              window[fnName]();
              break;
            } catch (e) {}
          }
        }
      }, 450);
    }

    if (typeof showToast === 'function') {
      try {
        showToast('CHECKPOINT RESTORED');
      } catch (e) {}
    }
  } finally {
    _isRestoringRun = false;
  }

  return true;
}

// ----------------------------------------------------------------------------
// 5. RESUME MODAL & HUD CHECKPOINT PILL
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

function promptResumeIfAvailable(onAbandonCallback = null) {
  const payload = loadSavedRunPayload();
  if (!payload) return false;

  const existing = document.getElementById('c4-resume-delve-modal');
  if (existing) existing.remove();

  const summary = payload.summary || {};
  const snap = payload.stateSnapshot || {};
  const rawFloorIdx = typeof summary.floorIndex === 'number'
    ? summary.floorIndex
    : getZeroBasedFloorIndex(snap);
  const displayFloor = Math.min(TOTAL_FLOORS, Math.max(1, rawFloorIdx + 1));
  const actNum = Math.ceil(displayFloor / 3);
  const diffLabel = summary.difficulty || snap.difficulty || 'MEDIUM';
  const tokensCount = summary.tokensOnBoard ?? countPlayerOrAiTokensOnBoard(snap);
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
      border-radius: 1rem;
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
      ">Checkpoint recorded ${timeAgo} (${tokensCount} tokens on board).</p>

      <div class="font-mono-code" style="
        background: rgba(7, 6, 9, 0.78);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 0.65rem;
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
          <span style="color: #64748b; display: block; font-size: 0.65rem;">RELICS & RESERVES</span>
          <strong style="color: #f43f5e;">${summary.gambitCount || 0}G / ${summary.reserveCount || 0}R</strong>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        <button id="c4-btn-resume-delve" class="font-display" style="
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 0.65rem;
          border: 1px solid #2dd4bf;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.45), rgba(15, 118, 110, 0.75));
          color: #f0fdfa;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(45, 212, 191, 0.28);
        ">RESUME DELVE</button>

        <button id="c4-btn-abandon-delve" class="font-mono-code" style="
          width: 100%;
          padding: 0.62rem 1rem;
          border-radius: 0.65rem;
          border: 1px solid rgba(244, 63, 94, 0.35);
          background: rgba(30, 20, 26, 0.75);
          color: #fda4af;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          cursor: pointer;
        ">ABANDON &amp; START FLOOR 1</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  const closePrompt = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 220);
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
      if (typeof onAbandonCallback === 'function') {
        try { onAbandonCallback(); } catch (e) {}
      }
    });
  }

  return true;
}

// Subtle floating checkpoint pill so you can visually see & test saves anytime
function mountCheckpointPillUI() {
  if (document.getElementById('c4-checkpoint-pill')) return;
  const pill = document.createElement('button');
  pill.id = 'c4-checkpoint-pill';
  pill.className = 'font-mono-code';
  pill.title = 'Click to manually save or restore checkpoint';
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

  pill.innerHTML = `<span id="c4-cp-dot" style="width:6px;height:6px;border-radius:50%;background:#64748b;display:inline-block;"></span><span id="c4-cp-label">CP: READY</span>`;

  pill.addEventListener('click', () => {
    if (_saveGateLocked && hasSavedRun()) {
      promptResumeIfAvailable();
      return;
    }
    const ok = saveCurrentRun(true);
    if (ok) {
      if (typeof showToast === 'function') {
        try { showToast('CHECKPOINT SAVED'); } catch (e) {}
      }
    } else if (hasSavedRun()) {
      promptResumeIfAvailable();
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
// 6. LIFECYCLE & AUTO-SAVE HOOKS
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

  // 1. Intercept `#title-start-game-btn` in capture phase so clicking "Start Game"
  //    immediately prompts to resume before opening the Difficulty Selector modal.
  const startBtn = document.getElementById('title-start-game-btn');
  if (startBtn && !startBtn._c4ResumeInterceptAttached) {
    startBtn._c4ResumeInterceptAttached = true;
    startBtn.addEventListener(
      'click',
      (e) => {
        if (_saveGateLocked && _bootCachedPayload && !_isRestoringRun) {
          e.stopImmediatePropagation();
          e.preventDefault();
          promptResumeIfAvailable(() => {
            startBtn.click();
          });
        }
      },
      true
    );
  }

  // 2. Also wrap initNewRun() as a fallback if called directly while a save is gated
  if (typeof window.initNewRun === 'function' && !window.initNewRun._c4InterceptWrapped) {
    const origInitNewRun = window.initNewRun;
    const wrappedInit = function (...args) {
      if (_saveGateLocked && _bootCachedPayload && !_isRestoringRun) {
        setTimeout(() => {
          promptResumeIfAvailable(() => {
            origInitNewRun.apply(this, args);
            if (typeof startFloorMatch === 'function') {
              try { startFloorMatch(true); } catch (e) {}
            }
          });
        }, 80);
        return;
      }
      return origInitNewRun.apply(this, args);
    };
    wrappedInit._c4InterceptWrapped = true;
    window.initNewRun = wrappedInit;
  }

  // 3. Clear saved run automatically when a run finishes in defeat or final victory
  const terminalFunctionsToClearOn = [
    'triggerGameOver',
    'handleDefeat',
    'handleFloorDefeat',
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

  // 4. Poll every 750ms for settled board/floor changes
  let lastFingerprint = '';
  setInterval(() => {
    if (typeof state === 'undefined' || !state) return;
    if (_saveGateLocked || _isRestoringRun) return;

    if (state.runOver || state.isGameOver || state.gameOver || state.victory || state.runComplete) {
      if (lastFingerprint !== 'TERMINAL') {
        clearSavedRun();
        lastFingerprint = 'TERMINAL';
      }
      return;
    }

    if (state.busy || state.isAnimating || state.aiThinking || state.isAiThinking) return;
    if (!isRunSaveable()) return;

    try {
      const boardSig = Array.isArray(state.board) ? JSON.stringify(state.board) : '';
      const floorSig = getZeroBasedFloorIndex(state);
      const turnSig = state.turn || state.currentTurn || 0;
      const handSig = Array.isArray(state.hand)
        ? state.hand.length
        : (Array.isArray(state.cards) ? state.cards.length : 0);
      const resSig = Array.isArray(state.reserves)
        ? state.reserves.length
        : (Array.isArray(state.reserveTokens) ? state.reserveTokens.length : 0);
      const gambitSig = Array.isArray(state.gambits)
        ? state.gambits.length
        : (Array.isArray(state.activeGambits) ? state.activeGambits.length : 0);

      const fp = `${floorSig}|${turnSig}|${handSig}|${resSig}|${gambitSig}|${boardSig}`;
      if (fp !== lastFingerprint) {
        lastFingerprint = fp;
        saveCurrentRun();
      }
    } catch (e) {}
  }, 750);

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
