// ============================================================================
// RUN CHECKPOINT PERSISTENCE ENGINE (js/state/persistence.js)
// Auto-saves mid-run progress and prompts to Continue AFTER hitting Play
// (from Title Screen or after Tutorial) and BEFORE Difficulty Selection.
// ============================================================================

const RUN_SAVE_STORAGE_KEY = 'c4_subterranean_saved_run_v1';

// Locks auto-saving during initial boot, title screen staging, and playable tutorial
// so staging a demo/training board never overwrites an existing mid-run checkpoint.
let _saveGateLocked = false;
let _bootCheckpointCache = null;
let _autoSaveHooksInstalled = false;
let _difficultyGateInstalled = false;

function isTutorialCurrentlyActive() {
  if (typeof tutorialActive !== 'undefined' && tutorialActive) return true;
  const tutOverlay = document.getElementById('tutorial-overlay');
  return !!(tutOverlay && !tutOverlay.classList.contains('hidden'));
}

function sanitizeForSerialization(rawState) {
  if (!rawState || typeof rawState !== 'object') return null;

  return {
    version: 36,
    timestamp: Date.now(),
    difficulty: rawState.difficulty || 'MEDIUM',
    floorIdx: typeof rawState.floorIdx === 'number' ? rawState.floorIdx : 0,
    gold: typeof rawState.gold === 'number' ? rawState.gold : 3,
    stability: typeof rawState.stability === 'number' ? rawState.stability : 15,
    board: Array.isArray(rawState.board) ? rawState.board.map(row => row.slice()) : [],
    boardMask: Array.isArray(rawState.boardMask) ? rawState.boardMask.map(row => row.slice()) : [],
    currentTopologyId: rawState.currentTopology && rawState.currentTopology.id
      ? rawState.currentTopology.id
      : 'classic_grid',
    currentTopologyMask: rawState.currentTopology && Array.isArray(rawState.currentTopology.mask)
      ? rawState.currentTopology.mask.map(row => row.slice())
      : null,
    shuffledTopologyIds: Array.isArray(rawState.shuffledTopologyPool)
      ? rawState.shuffledTopologyPool.map(t => (typeof t === 'string' ? t : t.id)).filter(Boolean)
      : [],
    shuffledBossIds: Array.isArray(rawState.shuffledBossPool)
      ? rawState.shuffledBossPool.map(b => (typeof b === 'string' ? b : (b && b.id))).filter(Boolean)
      : [],
    enchantGrid: Array.isArray(rawState.enchantGrid)
      ? rawState.enchantGrid.map(row => row.slice())
      : [],
    persistentEnchantCount: typeof rawState.persistentEnchantCount === 'number'
      ? rawState.persistentEnchantCount
      : 1,
    turn: typeof rawState.turn === 'number' ? rawState.turn : PLAYER,
    turnNumber: typeof rawState.turnNumber === 'number' ? rawState.turnNumber : 1,
    gameOver: !!rawState.gameOver,
    lastDroppedCols: Array.isArray(rawState.lastDroppedCols) ? rawState.lastDroppedCols.slice() : [],
    shatterCounter: rawState.shatterCounter || 0,
    shroomDropCounter: rawState.shroomDropCounter || 0,
    bossHp: typeof rawState.bossHp === 'number' ? rawState.bossHp : 1,
    bossMaxHp: typeof rawState.bossMaxHp === 'number' ? rawState.bossMaxHp : 1,
    bossMarkedCol: typeof rawState.bossMarkedCol === 'number' ? rawState.bossMarkedCol : 3,
    maxMana: typeof rawState.maxMana === 'number' ? rawState.maxMana : 1,
    mana: typeof rawState.mana === 'number' ? rawState.mana : 1,
    handSize: typeof rawState.handSize === 'number' ? rawState.handSize : 2,
    maxGambitSlots: typeof rawState.maxGambitSlots === 'number' ? rawState.maxGambitSlots : 1,
    reservePouchUnlocked: !!rawState.reservePouchUnlocked,
    highTierCardsUnlocked: !!rawState.highTierCardsUnlocked,
    masterDeck: Array.isArray(rawState.masterDeck) ? rawState.masterDeck.slice() : [],
    drawPile: Array.isArray(rawState.drawPile) ? rawState.drawPile.slice() : [],
    hand: Array.isArray(rawState.hand) ? rawState.hand.slice() : [],
    discardPile: Array.isArray(rawState.discardPile) ? rawState.discardPile.slice() : [],
    reservePouch: Array.isArray(rawState.reservePouch) ? rawState.reservePouch.slice() : [],
    gambits: Array.isArray(rawState.gambits) ? rawState.gambits.slice() : [],
    catNineLivesUsed: !!rawState.catNineLivesUsed,
    showTelemetry: rawState.showTelemetry !== undefined ? !!rawState.showTelemetry : true,
    rouletteSpinsThisFloor: rawState.rouletteSpinsThisFloor || 0,
    nextFloorModifiers: rawState.nextFloorModifiers
      ? { ...rawState.nextFloorModifiers }
      : {
          bonusMana: 0,
          bonusStability: 0,
          bonusEnchantSlots: 0,
          caveInStones: 0,
          aiHeadstartTokens: 0
        },
    inBazaar: !!(
      document.getElementById('bazaar-modal') &&
      !document.getElementById('bazaar-modal').classList.contains('hidden')
    ),
    inBossChest: !!(
      document.getElementById('boss-chest-modal') &&
      !document.getElementById('boss-chest-modal').classList.contains('hidden')
    ),
    shopItems: Array.isArray(rawState.shopItems)
      ? rawState.shopItems.map(item => ({ ...item }))
      : [],
    pendingVictoryPayout: rawState.pendingVictoryPayout
      ? { ...rawState.pendingVictoryPayout }
      : { totalEarned: 0, speedBonus: 0 }
  };
}

function isMeaningfulCheckpoint(payload) {
  if (!payload || typeof payload !== 'object') return false;
  // Do not treat a completed Floor 9 victory or a Floor 1 defeat as a resumable checkpoint
  if (payload.gameOver && !payload.inBazaar && !payload.inBossChest) {
    return false;
  }
  // Meaningful if beyond Floor 1, or mid-floor with tokens/turns played, or inside Bazaar/Boss Chest
  if (payload.floorIdx > 0) return true;
  if (payload.inBazaar || payload.inBossChest) return true;
  if (payload.turnNumber > 1) return true;
  if (Array.isArray(payload.board)) {
    for (let r = 0; r < payload.board.length; r++) {
      for (let c = 0; c < (payload.board[r] ? payload.board[r].length : 0); c++) {
        const cell = payload.board[r][c];
        if (cell === PLAYER || cell === WILD) return true;
      }
    }
  }
  return false;
}

function loadSavedRunPayload() {
  if (_bootCheckpointCache && isMeaningfulCheckpoint(_bootCheckpointCache)) {
    return _bootCheckpointCache;
  }
  try {
    const raw = localStorage.getItem(RUN_SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isMeaningfulCheckpoint(parsed)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function hasSavedRun() {
  return !!loadSavedRunPayload();
}

function captureBootCheckpointBeforeInit() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isMeaningfulCheckpoint(parsed)) {
        _bootCheckpointCache = parsed;
      }
    }
  } catch (e) {}
  // Lock auto-saving while on the Title Screen / Tutorial until the player either
  // continues their checkpoint or selects a difficulty tier for a new run.
  _saveGateLocked = true;
  return _bootCheckpointCache;
}

function saveCurrentRun() {
  if (_saveGateLocked || isTutorialCurrentlyActive()) return false;
  if (typeof state === 'undefined' || !state) return false;

  // If the player lost a match (gameOver outside Bazaar/Boss Chest), clear the checkpoint
  const bazaarOpen = !!(
    document.getElementById('bazaar-modal') &&
    !document.getElementById('bazaar-modal').classList.contains('hidden')
  );
  const chestOpen = !!(
    document.getElementById('boss-chest-modal') &&
    !document.getElementById('boss-chest-modal').classList.contains('hidden')
  );
  if (state.gameOver && !bazaarOpen && !chestOpen) {
    clearSavedRun();
    return false;
  }

  const snapshot = sanitizeForSerialization(state);
  if (!isMeaningfulCheckpoint(snapshot)) return false;

  try {
    localStorage.setItem(RUN_SAVE_STORAGE_KEY, JSON.stringify(snapshot));
    _bootCheckpointCache = snapshot;
    return true;
  } catch (e) {
    return false;
  }
}

function clearSavedRun() {
  _bootCheckpointCache = null;
  try {
    localStorage.removeItem(RUN_SAVE_STORAGE_KEY);
  } catch (e) {}
}

function buildCatalogLookupMap(catalogArray) {
  const map = {};
  if (Array.isArray(catalogArray)) {
    catalogArray.forEach(entry => {
      if (entry && entry.id) map[entry.id] = entry;
    });
  }
  return map;
}

function rehydrateFromCatalogs(payload) {
  const topoMap = typeof BOARD_TOPOLOGIES !== 'undefined' ? buildCatalogLookupMap(BOARD_TOPOLOGIES) : {};
  const bossMap = typeof BOSS_ARCHETYPES !== 'undefined' ? buildCatalogLookupMap(BOSS_ARCHETYPES) : {};

  if (Array.isArray(payload.shuffledTopologyIds) && payload.shuffledTopologyIds.length > 0) {
    state.shuffledTopologyPool = payload.shuffledTopologyIds
      .map(id => topoMap[id])
      .filter(Boolean);
  }
  if (!state.shuffledTopologyPool || state.shuffledTopologyPool.length === 0) {
    state.shuffledTopologyPool = typeof BOARD_TOPOLOGIES !== 'undefined' ? BOARD_TOPOLOGIES.slice() : [];
  }

  if (Array.isArray(payload.shuffledBossIds) && payload.shuffledBossIds.length > 0) {
    state.shuffledBossPool = payload.shuffledBossIds
      .map(id => bossMap[id])
      .filter(Boolean);
  }

  const mask = Array.isArray(payload.currentTopologyMask)
    ? payload.currentTopologyMask.map(r => r.slice())
    : (Array.isArray(payload.boardMask) && payload.boardMask.length === ROWS
        ? payload.boardMask.map(r => r.slice())
        : Array.from({ length: ROWS }, () => Array(COLS).fill(true)));

  if (payload.currentTopologyId === 'classic_grid' || !topoMap[payload.currentTopologyId]) {
    state.currentTopology = {
      id: 'classic_grid',
      name: 'Classic 7x6 Cavern Grid',
      icon: '📐',
      desc: 'Standard 42-slot subterranean Connect 4 frame with 0 void cells.',
      isProcedural: false,
      mask
    };
  } else {
    const tDef = topoMap[payload.currentTopologyId];
    state.currentTopology = {
      id: tDef.id,
      name: tDef.name,
      icon: tDef.icon,
      desc: tDef.desc,
      isProcedural: true,
      mask
    };
  }
  state.boardMask = mask;
}

function resumeSavedRun() {
  const payload = loadSavedRunPayload();
  if (!payload) return false;

  _saveGateLocked = false;
  _bootCheckpointCache = payload;

  // Hide Intro, Tutorial, and Difficulty modals if any are visible
  ['intro-sequence-overlay', 'tutorial-overlay', 'difficulty-modal', 'floor-intro-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  state.difficulty = payload.difficulty || 'MEDIUM';
  try {
    if (typeof DIFFICULTY_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty);
    }
  } catch (e) {}

  state.floorIdx = payload.floorIdx || 0;
  state.gold = typeof payload.gold === 'number' ? payload.gold : 3;
  state.stability = typeof payload.stability === 'number' ? payload.stability : 15;
  state.persistentEnchantCount = payload.persistentEnchantCount || 1;
  state.turn = PLAYER;
  state.turnNumber = payload.turnNumber || 1;
  state.busy = false;
  state.gameOver = !!payload.gameOver;
  state.previewCol = -1;
  state.selectedCardIdx = null;
  state.selectedReserveIdx = null;
  state.lastDroppedCols = Array.isArray(payload.lastDroppedCols) ? payload.lastDroppedCols.slice() : [];
  state.shatterCounter = payload.shatterCounter || 0;
  state.shroomDropCounter = payload.shroomDropCounter || 0;
  state.bossHp = payload.bossHp || 1;
  state.bossMaxHp = payload.bossMaxHp || 1;
  state.bossMarkedCol = typeof payload.bossMarkedCol === 'number' ? payload.bossMarkedCol : 3;
  state.maxMana = payload.maxMana || 1;
  state.mana = typeof payload.mana === 'number' ? payload.mana : state.maxMana;
  state.handSize = payload.handSize || 2;
  state.maxGambitSlots = payload.maxGambitSlots || 1;
  state.reservePouchUnlocked = !!payload.reservePouchUnlocked;
  state.highTierCardsUnlocked = !!payload.highTierCardsUnlocked;
  state.masterDeck = Array.isArray(payload.masterDeck) ? payload.masterDeck.slice() : [];
  state.drawPile = Array.isArray(payload.drawPile) ? payload.drawPile.slice() : [];
  state.hand = Array.isArray(payload.hand) ? payload.hand.slice() : [];
  state.discardPile = Array.isArray(payload.discardPile) ? payload.discardPile.slice() : [];
  state.reservePouch = Array.isArray(payload.reservePouch) ? payload.reservePouch.slice() : [];
  state.gambits = Array.isArray(payload.gambits) ? payload.gambits.slice() : [];
  state.catNineLivesUsed = !!payload.catNineLivesUsed;
  state.showTelemetry = payload.showTelemetry !== undefined ? !!payload.showTelemetry : true;
  state.rouletteSpinsThisFloor = payload.rouletteSpinsThisFloor || 0;
  state.nextFloorModifiers = payload.nextFloorModifiers
    ? { ...payload.nextFloorModifiers }
    : { bonusMana: 0, bonusStability: 0, bonusEnchantSlots: 0, caveInStones: 0, aiHeadstartTokens: 0 };
  state.shopItems = Array.isArray(payload.shopItems) ? payload.shopItems.map(i => ({ ...i })) : [];
  state.pendingVictoryPayout = payload.pendingVictoryPayout || { totalEarned: 0, speedBonus: 0 };

  rehydrateFromCatalogs(payload);

  if (Array.isArray(payload.board) && payload.board.length === ROWS) {
    state.board = payload.board.map(r => r.slice());
  }
  if (Array.isArray(payload.enchantGrid) && payload.enchantGrid.length === ROWS) {
    state.enchantGrid = payload.enchantGrid.map(r => r.slice());
  }

  // Rebuild 3D board geometry, enchantment rings, and settled token meshes
  if (typeof rebuild3DBoardGeometry === 'function') {
    rebuild3DBoardGeometry(state.boardMask);
  }
  if (typeof rebuildEnchantmentRings === 'function') {
    rebuildEnchantmentRings();
  }
  if (typeof rebuildBoardMeshes === 'function') {
    rebuildBoardMeshes();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.meshes[r] && state.meshes[r][c]) {
          state.meshes[r][c].position.y = state.meshes[r][c].userData.targetY;
          state.meshes[r][c].userData.velY = 0;
        }
      }
    }
  }

  const floorData = typeof getFloorConfig === 'function' ? getFloorConfig(state.floorIdx) : { isBoss: false, floor: state.floorIdx + 1 };
  if (typeof bgm !== 'undefined' && bgm) {
    bgm.hasStartedAfterDifficulty = true;
    bgm.isPausedForModal = false;
    bgm.isPausedForIntro = false;
    const targetBgmMode = floorData.isBoss
      ? (state.floorIdx >= 8 ? 'boss3' : (state.floorIdx >= 5 ? 'boss2' : 'boss1'))
      : 'cavern';
    bgm.setMode(targetBgmMode);
    bgm.play();
  }

  if (typeof updateDifficultyUI === 'function') updateDifficultyUI();
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof updateTelemetryBadges === 'function') updateTelemetryBadges();

  // Restore between-floor Bazaar or Boss Chest if the checkpoint was saved there
  if (payload.inBossChest && typeof openBossVictoryChest === 'function') {
    openBossVictoryChest(floorData);
  } else if (payload.inBazaar) {
    const bModal = document.getElementById('bazaar-modal');
    if (bModal) {
      if (typeof updateRouletteButtonsUI === 'function') updateRouletteButtonsUI();
      if (typeof renderBazaarStock === 'function') renderBazaarStock();
      bModal.classList.remove('hidden');
    }
  }

  if (typeof showToast === 'function') {
    showToast(`Checkpoint Resumed: Floor ${state.floorIdx + 1} of 9`, '🧭', 3800);
  }
  saveCurrentRun();
  return true;
}

function promptResumeIfAvailable(options = {}) {
  const payload = loadSavedRunPayload();
  if (!payload) {
    if (typeof options.onNoSave === 'function') options.onNoSave();
    return false;
  }

  const existing = document.getElementById('c4-resume-delve-modal');
  if (existing) existing.remove();

  const floorNum = (payload.floorIdx || 0) + 1;
  const actNum = Math.floor((payload.floorIdx || 0) / 3) + 1;
  const diffKey = payload.difficulty || 'MEDIUM';
  const diffTier = (typeof DIFFICULTY_TIERS !== 'undefined' && DIFFICULTY_TIERS[diffKey])
    ? DIFFICULTY_TIERS[diffKey]
    : { fullBadge: diffKey };
  const phaseLabel = payload.inBossChest
    ? 'Boss Relic Chest'
    : (payload.inBazaar ? 'Underground Bazaar' : `Turn ${payload.turnNumber || 1} • Active Battle`);

  const modal = document.createElement('div');
  modal.id = 'c4-resume-delve-modal';
  modal.className = 'fixed inset-0 z-[230] bg-black/88 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-200';
  modal.innerHTML = `
    <div class="cavern-panel w-full max-w-sm rounded-3xl p-5 border border-amber-400/55 shadow-[0_0_50px_rgba(245,158,11,0.28)] space-y-4 text-left">
      <div class="flex items-center gap-3 border-b border-white/10 pb-3">
        <div class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0">
          🧭
        </div>
        <div>
          <span class="text-[10px] font-mono-code uppercase tracking-[0.2em] text-amber-400 font-bold block">
            Subterranean Checkpoint Found
          </span>
          <h3 class="font-display font-bold text-lg text-white leading-tight">
            Continue Saved Delve?
          </h3>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-stone-950/90 border border-white/10 space-y-1.5 text-xs font-mono-code">
        <div class="flex items-center justify-between">
          <span class="text-slate-400">SAVED DEPTH:</span>
          <span class="text-amber-300 font-bold">Act ${actNum} • Floor ${floorNum} of 9</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-400">DESCENT TIER:</span>
          <span class="text-teal-300 font-bold">${diffTier.fullBadge || diffKey}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-400">STATUS:</span>
          <span class="text-slate-200">${phaseLabel}</span>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-white/10">
          <span class="text-slate-400">VESSEL TELEMETRY:</span>
          <span class="text-amber-200">🪙 $${payload.gold ?? 0} • ⚡ ${payload.mana ?? 1}/${payload.maxMana ?? 1}M • 🏺 ${(payload.gambits || []).length} Relics</span>
        </div>
      </div>

      <div class="flex flex-col gap-2 pt-1">
        <button type="button" id="c4-btn-resume-delve" class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-stone-950 font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition">
          ▶ Continue Saved Run (Floor ${floorNum})
        </button>
        <button type="button" id="c4-btn-abandon-delve" class="w-full py-2.5 px-4 rounded-2xl bg-stone-800/90 hover:bg-stone-700 text-slate-200 font-mono-code font-semibold text-xs border border-white/10 active:scale-95 transition">
          🗑️ Start Fresh Run (Select Difficulty)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const resumeBtn = document.getElementById('c4-btn-resume-delve');
  const abandonBtn = document.getElementById('c4-btn-abandon-delve');

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (typeof sfx !== 'undefined' && sfx) sfx.playCardChime();
      if (typeof triggerHaptic === 'function') triggerHaptic([20, 30]);
      modal.remove();
      // Restores saved run and completely bypasses Difficulty Selection!
      resumeSavedRun();
      if (typeof options.onContinue === 'function') options.onContinue();
    });
  }

  if (abandonBtn) {
    abandonBtn.addEventListener('click', () => {
      if (typeof sfx !== 'undefined' && sfx) sfx.playHoverTick();
      if (typeof triggerHaptic === 'function') triggerHaptic(18);
      modal.remove();
      clearSavedRun();
      _saveGateLocked = false;
      if (typeof options.onAbandon === 'function') {
        options.onAbandon();
      }
    });
  }

  return true;
}

// Unified entry point called after hitting Play (on Title Screen or after Tutorial)
// and before Difficulty Selection triggers.
function proceedToPlayOrDifficulty() {
  if (hasSavedRun()) {
    promptResumeIfAvailable({
      onContinue: () => {
        // Bypasses difficulty selection completely
      },
      onAbandon: () => {
        // Player chose to start a fresh run -> now show Difficulty Selection
        if (typeof _origOpenDifficultyModal === 'function') {
          _origOpenDifficultyModal(false);
        }
      }
    });
  } else {
    openDifficultyModal(false);
  }
}

let _origOpenDifficultyModal = null;

function installPreDifficultyCheckpointGate() {
  if (_difficultyGateInstalled) return;
  if (typeof openDifficultyModal !== 'function') return;
  _difficultyGateInstalled = true;

  _origOpenDifficultyModal = window.openDifficultyModal || openDifficultyModal;

  // Intercept pre-run openDifficultyModal(false) calls (triggered by Title Screen Play
  // and Tutorial Completion/Skip) so the Continue Checkpoint prompt always runs first.
  window.openDifficultyModal = openDifficultyModal = function(allowCancel = false) {
    if (!allowCancel && hasSavedRun()) {
      promptResumeIfAvailable({
        onContinue: () => {
          // Bypasses difficulty selection
        },
        onAbandon: () => {
          _origOpenDifficultyModal(false);
        }
      });
      return;
    }
    return _origOpenDifficultyModal(allowCancel);
  };

  // Unlock auto-saving once the player selects a difficulty tier for a fresh run
  if (typeof selectDifficultyAndStart === 'function') {
    const _origSelectDiff = window.selectDifficultyAndStart || selectDifficultyAndStart;
    window.selectDifficultyAndStart = selectDifficultyAndStart = function(tierId) {
      clearSavedRun();
      _saveGateLocked = false;
      const res = _origSelectDiff(tierId);
      saveCurrentRun();
      return res;
    };
  }
}

function installAutoSaveHooks() {
  installPreDifficultyCheckpointGate();
  if (_autoSaveHooksInstalled) return;
  _autoSaveHooksInstalled = true;

  // Hook into key gameplay transitions to auto-save checkpoints
  const wrapForAutoSave = (fnName, delayMs = 0) => {
    const orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function(...args) {
      const result = orig.apply(this, args);
      if (delayMs > 0) {
        setTimeout(() => saveCurrentRun(), delayMs);
      } else {
        saveCurrentRun();
      }
      return result;
    };
  };

  wrapForAutoSave('startFloorMatch', 120);
  wrapForAutoSave('commitColumnAction', 550);
  wrapForAutoSave('castCardOnColumn', 650);
  wrapForAutoSave('buyBazaarItem', 50);
  wrapForAutoSave('openUndergroundBazaar', 80);
  wrapForAutoSave('openBossVictoryChest', 80);

  window.addEventListener('pagehide', () => saveCurrentRun());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveCurrentRun();
  });
}

const saveRun = saveCurrentRun;
const loadRun = loadSavedRunPayload;

if (typeof window !== 'undefined') {
  window.C4 = window.C4 || {};
  window.C4.persistence = {
    RUN_SAVE_STORAGE_KEY,
    captureBootCheckpointBeforeInit,
    saveCurrentRun,
    saveRun,
    loadSavedRunPayload,
    loadRun,
    hasSavedRun,
    clearSavedRun,
    resumeSavedRun,
    promptResumeIfAvailable,
    proceedToPlayOrDifficulty,
    installAutoSaveHooks
  };
  Object.assign(window, {
    RUN_SAVE_STORAGE_KEY,
    captureBootCheckpointBeforeInit,
    saveCurrentRun,
    saveRun,
    loadSavedRunPayload,
    loadRun,
    hasSavedRun,
    clearSavedRun,
    resumeSavedRun,
    promptResumeIfAvailable,
    proceedToPlayOrDifficulty,
    installAutoSaveHooks
  });
}
