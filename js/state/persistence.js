// ============================================================================
// MID-RUN SAVE & RESUME PERSISTENCE ENGINE (js/state/persistence.js)
// ============================================================================
// Automatically serializes active run state to localStorage after each turn,
// card play, reserve token action, floor transition, and page hide event.
// Rehydrates catalog references and reconstructs the 3D board & HUD on resume.
// ============================================================================

const RUN_SAVE_STORAGE_KEY = 'c4_subterranean_saved_run_v1';
const RUN_SAVE_SCHEMA_VERSION = 1;

// Keys on `state` that represent transient UI/animation locks or non-serializable refs
const TRANSIENT_STATE_KEYS = new Set([
  'isAnimating',
  'aiThinking',
  'isAiThinking',
  'inputLocked',
  'turnLocked',
  'isSpinningRoulette',
  'rouletteSpinning',
  'activeModal',
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
  'turnTimerId'
]);

const SAFE_TRANSIENT_DEFAULTS = {
  isAnimating: false,
  aiThinking: false,
  isAiThinking: false,
  inputLocked: false,
  turnLocked: false,
  isSpinningRoulette: false,
  rouletteSpinning: false,
  hoveredCol: -1,
  hoverCol: -1,
  pendingDropCol: null,
  selectedCardIdx: null,
  selectedCardIndex: null,
  selectedReserveIdx: null,
  selectedReserveIndex: null
};

// Build a lookup map of all catalog entries in window.C4.config so rehydration
// restores functions, prototypes, and frozen references after JSON.parse.
function buildCatalogLookupMap() {
  const map = new Map();
  const cfg = (window.C4 && window.C4.config) ? window.C4.config : {};

  function indexCollection(col, prefix) {
    if (!col || typeof col !== 'object') return;
    if (Array.isArray(col)) {
      for (const item of col) {
        if (item && typeof item === 'object') {
          const id = item.id || item.key || item.code || item.name;
          if (id) map.set(`${prefix}:${id}`, item);
          if (id) map.set(`any:${id}`, item);
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

// Safely clone serializable state while stripping Three.js objects, DOM nodes, & timers
function sanitizeForSerialization(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean') return value;
  if (t === 'function' || t === 'symbol') return undefined;

  if (t === 'object') {
    if (seen.has(value)) return undefined;
    // Skip DOM elements, Three.js Object3D / Material / Geometry / Scene / WebGL objects
    if (
      value.nodeType ||
      value.isObject3D ||
      value.isMaterial ||
      value.isBufferGeometry ||
      value.isTexture ||
      value.isScene ||
      value.isCamera ||
      value instanceof HTMLElement
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

// Rehydrate catalog objects (restoring any non-JSON functions/methods from config catalogs)
function rehydrateFromCatalogs(value, catalogMap) {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => rehydrateFromCatalogs(item, catalogMap));
  }

  const candidateId = value.id || value.key || value.code || value.topologyId || value.bossId;
  if (candidateId && catalogMap.has(`any:${candidateId}`)) {
    const template = catalogMap.get(`any:${candidateId}`);
    // Merge template methods/defaults with saved instance properties (e.g. cooldowns, charges, upgraded flags)
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

// Check whether the current state represents an active, mid-progress run worth saving
function isRunSaveable() {
  if (typeof state === 'undefined' || !state) return false;
  if (state.runOver || state.isGameOver || state.gameOver || state.victory || state.runComplete) {
    return false;
  }

  const floorIdx = getFloorIndexFromState(state);
  const hasBoardMove = Array.isArray(state.board) && state.board.some(
    (row) => Array.isArray(row) && row.some((cell) => cell === PLAYER || cell === AI || cell === WILD)
  );
  const hasLoadoutProgress =
    (Array.isArray(state.gambits) && state.gambits.length > 0) ||
    (Array.isArray(state.activeGambits) && state.activeGambits.length > 0) ||
    (typeof state.turnCount === 'number' && state.turnCount > 0) ||
    (typeof state.movesPlayed === 'number' && state.movesPlayed > 0);

  return floorIdx > 0 || hasBoardMove || hasLoadoutProgress;
}

function getFloorIndexFromState(s) {
  if (!s) return 0;
  if (typeof s.floorIndex === 'number') return s.floorIndex;
  if (typeof s.currentFloorIndex === 'number') return s.currentFloorIndex;
  if (typeof s.floor === 'number') {
    // Handle either 0-indexed (0..8) or 1-indexed (1..9) conventions
    return s.floor;
  }
  return 0;
}

function saveCurrentRun(force = false) {
  try {
    if (typeof state === 'undefined' || !state) return false;
    if (!force && !isRunSaveable()) return false;

    const cleanState = sanitizeForSerialization(state);
    if (!cleanState || typeof cleanState !== 'object') return false;

    // Normalize mid-turn state so resuming always lands on a playable state
    for (const [k, defaultVal] of Object.entries(SAFE_TRANSIENT_DEFAULTS)) {
      if (k in state) {
        cleanState[k] = defaultVal;
      }
    }

    const payload = {
      schemaVersion: RUN_SAVE_SCHEMA_VERSION,
      savedAt: Date.now(),
      summary: {
        floorIndex: getFloorIndexFromState(state),
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
      stateSnapshot: cleanState
    };

    localStorage.setItem(RUN_SAVE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

function loadSavedRunPayload() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.schemaVersion !== RUN_SAVE_SCHEMA_VERSION ||
      !parsed.stateSnapshot ||
      typeof parsed.stateSnapshot !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

function hasSavedRun() {
  return loadSavedRunPayload() !== null;
}

function clearSavedRun() {
  try {
    localStorage.removeItem(RUN_SAVE_STORAGE_KEY);
  } catch (e) {}
}

// Rebuilds the 3D scene and 2D HUD to match the restored `state`
function syncSceneAndHudAfterRestore() {
  // 1. Trigger whichever 3D board & token rebuild helpers exist injs/graphics/scene3d.js or boardLogic.js
  const boardRebuildFns = [
    'rebuild3DBoard',
    'build3DBoard',
    'rebuildBoard3D',
    'buildBoard3D',
    'init3DBoard',
    'sync3DBoard',
    'render3DBoard'
  ];
  for (const fnName of boardRebuildFns) {
    if (typeof window[fnName] === 'function') {
      try {
        window[fnName]();
        break;
      } catch (e) {}
    }
  }

  // 2. Sync 3D Enchantment slots if a dedicated helper exists
  const enchantSyncFns = [
    'rebuildEnchantMeshes',
    'renderEnchantSlots',
    'syncEnchantGroup',
    'buildEnchantSlots3D',
    'updateEnchantVisuals'
  ];
  for (const fnName of enchantSyncFns) {
    if (typeof window[fnName] === 'function') {
      try {
        window[fnName]();
        break;
      } catch (e) {}
    }
  }

  // 3. Reconstruct 3D tokens on the board
  const tokenSyncFns = [
    'rebuildTokens3D',
    'syncTokens3D',
    'rebuild3DTokens',
    'renderTokens3D'
  ];
  let tokensRebuiltByHelper = false;
  for (const fnName of tokenSyncFns) {
    if (typeof window[fnName] === 'function') {
      try {
        window[fnName]();
        tokensRebuiltByHelper = true;
        break;
      } catch (e) {}
    }
  }

  // Fallback token spawner if the codebase spawns tokens incrementally during drops
  if (!tokensRebuiltByHelper && Array.isArray(state.board)) {
    try {
      if (typeof tokensGroup !== 'undefined' && tokensGroup && typeof tokensGroup.clear === 'function') {
        tokensGroup.clear();
      } else if (typeof tokensGroup !== 'undefined' && tokensGroup && Array.isArray(tokensGroup.children)) {
        while (tokensGroup.children.length > 0) {
          tokensGroup.remove(tokensGroup.children[0]);
        }
      }

      const singleTokenSpawners = [
        'spawnTokenMeshAt',
        'createTokenMesh',
        'addTokenToScene',
        'spawn3DToken',
        'placeToken3D'
      ];
      let spawner = null;
      for (const fnName of singleTokenSpawners) {
        if (typeof window[fnName] === 'function') {
          spawner = window[fnName];
          break;
        }
      }

      if (spawner) {
        for (let r = 0; r < state.board.length; r++) {
          const row = state.board[r];
          if (!Array.isArray(row)) continue;
          for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            if (cell && cell !== EMPTY && cell !== VOID_CELL) {
              try {
                spawner(r, c, cell, false);
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {}
  }

  // 4. Refresh all HUD & UI panels
  const hudSyncFns = [
    'syncHUD',
    'updateHUD',
    'renderHUD',
    'refreshHUD',
    'renderCardsHUD',
    'renderHand',
    'renderReservesHUD',
    'renderReserves',
    'renderGambitsHUD',
    'renderGambits',
    'updateFloorBanner',
    'updateTurnIndicator',
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

// Restores a saved run into `state`, rebuilds the current floor's 3D board, and syncs the HUD
function resumeSavedRun() {
  const payload = loadSavedRunPayload();
  if (!payload) return false;

  const catalogMap = buildCatalogLookupMap();
  const restored = rehydrateFromCatalogs(payload.stateSnapshot, catalogMap);

  // Phase 1: Apply run-level & floor-level properties first
  Object.assign(state, restored);

  // Let startFloorMatch initialize the floor's 3D cavern topology, lighting, and boss banner
  if (typeof startFloorMatch === 'function') {
    try {
      startFloorMatch(false);
    } catch (e) {}
  }

  // Phase 2: Re-apply the exact mid-floor snapshot (board tokens, hand, reserves, turn, enchants)
  Object.assign(state, rehydrateFromCatalogs(payload.stateSnapshot, catalogMap));
  for (const [k, defaultVal] of Object.entries(SAFE_TRANSIENT_DEFAULTS)) {
    if (k in state) {
      state[k] = defaultVal;
    }
  }

  syncSceneAndHudAfterRestore();

  // If the game was saved while it was the AI's turn, nudge the AI solver to act
  if (state.turn === AI || state.currentTurn === AI) {
    const aiTriggerFns = ['triggerAiTurn', 'executeAiTurn', 'runAiTurn', 'scheduleAiMove'];
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
      showToast('SUBTERRANEAN DELVE RESUMED');
    } catch (e) {}
  }

  return true;
}

// Format relative time for the Resume Modal
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

// Presents a non-intrusive cavern-styled modal allowing the player to Resume or Start Fresh
function promptResumeIfAvailable() {
  const payload = loadSavedRunPayload();
  if (!payload) return false;

  const existing = document.getElementById('c4-resume-delve-modal');
  if (existing) existing.remove();

  const summary = payload.summary || {};
  const rawFloor = typeof summary.floorIndex === 'number' ? summary.floorIndex : 0;
  // Display 1-indexed floor number (1..9)
  const displayFloor = Math.min(
    TOTAL_FLOORS,
    Math.max(1, rawFloor < TOTAL_FLOORS ? rawFloor + 1 : rawFloor)
  );
  const actNum = Math.ceil(displayFloor / 3);
  const diffLabel = summary.difficulty || 'MEDIUM';
  const timeAgo = formatRelativeSaveTime(payload.savedAt);

  const overlay = document.createElement('div');
  overlay.id = 'c4-resume-delve-modal';
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 95',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'padding: 1.25rem',
    'background: rgba(7, 6, 9, 0.82)',
    'backdrop-filter: blur(10px)',
    '-webkit-backdrop-filter: blur(10px)',
    'opacity: 0',
    'transition: opacity 0.25s ease-out'
  ].join(';');

  overlay.innerHTML = `
    <div class="cavern-panel" style="
      width: 100%;
      max-width: 380px;
      border-radius: 1rem;
      padding: 1.35rem 1.25rem;
      border: 1px solid rgba(245, 158, 11, 0.42);
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.88), 0 0 24px rgba(245, 158, 11, 0.14);
      color: #f8fafc;
      text-align: center;
    ">
      <div class="font-mono-code" style="
        font-size: 0.7rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #fbbf24;
        margin-bottom: 0.35rem;
      ">// ACTIVE DELVE TELEMETRY DETECTED //</div>

      <h2 class="font-display" style="
        margin: 0 0 0.4rem 0;
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: #f8fafc;
      ">RESUME ASCENSION?</h2>

      <p style="
        margin: 0 0 1rem 0;
        font-size: 0.82rem;
        color: #94a3b8;
        line-height: 1.45;
      ">An unfinished subterranean run was recorded ${timeAgo}.</p>

      <div class="font-mono-code" style="
        background: rgba(7, 6, 9, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.18);
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
          padding: 0.78rem 1rem;
          border-radius: 0.65rem;
          border: 1px solid #2dd4bf;
          background: linear-gradient(135deg, rgba(13, 148, 136, 0.38), rgba(15, 118, 110, 0.65));
          color: #f0fdfa;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(45, 212, 191, 0.25);
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
  document.body.classList.add('modal-occluded');
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  const closePrompt = () => {
    overlay.style.opacity = '0';
    document.body.classList.remove('modal-occluded');
    setTimeout(() => overlay.remove(), 240);
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
    });
  }

  return true;
}

// Automatically hook lifecycle & turn-mutation functions to save or clear runs seamlessly
function installAutoSaveHooks() {
  if (installAutoSaveHooks.installed) return;
  installAutoSaveHooks.installed = true;

  // Wrap known global gameplay functions if present so saves trigger immediately after actions
  const actionFunctionsToSaveAfter = [
    'startFloorMatch',
    'advanceToNextFloor',
    'nextFloor',
    'playArcaneCard',
    'useArcaneCard',
    'activateCard',
    'useReserveToken',
    'selectReserveToken',
    'claimGambitReward',
    'applyRouletteOutcome',
    'finishRouletteSpin'
  ];

  for (const fnName of actionFunctionsToSaveAfter) {
    if (typeof window[fnName] === 'function' && !window[fnName]._c4SaveWrapped) {
      const originalFn = window[fnName];
      const wrapped = function (...args) {
        const result = originalFn.apply(this, args);
        setTimeout(() => saveCurrentRun(), 60);
        return result;
      };
      wrapped._c4SaveWrapped = true;
      window[fnName] = wrapped;
    }
  }

  // Clear saved run automatically when a run finishes in defeat or final victory
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

  // Lightweight state-fingerprint poller: catches async AI drops, gravity cascades, & roulette resolutions
  let lastFingerprint = '';
  setInterval(() => {
    if (typeof state === 'undefined' || !state) return;

    if (state.runOver || state.isGameOver || state.gameOver || state.victory || state.runComplete) {
      if (lastFingerprint !== 'TERMINAL') {
        clearSavedRun();
        lastFingerprint = 'TERMINAL';
      }
      return;
    }

    // Wait until animations settle before snapshotting
    if (state.isAnimating || state.aiThinking || state.isAiThinking) return;

    try {
      const boardSig = Array.isArray(state.board) ? JSON.stringify(state.board) : '';
      const floorSig = getFloorIndexFromState(state);
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
  }, 800);

  // Save immediately when switching mobile apps, locking screen, or closing tab
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
  saveRun: saveCurrentRun,
  loadRun: loadSavedRunPayload,
  hasSavedRun,
  clearSavedRun,
  resumeSavedRun,
  promptResumeIfAvailable,
  installAutoSaveHooks
};

window.runPersistence = runPersistence;
