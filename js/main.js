// ============================================================================
// APPLICATION ENTRY POINT & GLOBAL NAMESPACE (js/main.js)
// ============================================================================
if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
  lucide.createIcons();
}

function deepFreezeConfig(obj) {
  if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreezeConfig(obj[key]);
  }
  return obj;
}

// Expose structured global namespace for inspection and extensibility
window.C4 = {
  config: deepFreezeConfig({
    ROWS,
    COLS,
    TOTAL_FLOORS,
    DIFFICULTY_TIERS,
    BOARD_TOPOLOGIES,
    CARD_CATALOG,
    RESERVE_CATALOG,
    GAMBIT_CATALOG,
    ENCHANT_TYPES,
    BOSS_POOLS_BY_ACT,
    ROULETTE_WEDGES
  }),
  settings: userSettings,
  state,
  sfx,
  bgm,
  aiEngine,
  rouletteSim,
  persistence: typeof runPersistence !== 'undefined' ? runPersistence : null,
  scene3d: {
    scene,
    camera,
    renderer,
    boardGroup,
    tokensGroup,
    enchantGroup,
    vfxGroup
  }
};

function bootGame() {
  if (bootGame.started) return;
  bootGame.started = true;

  try {
    const savedDiff = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    state.difficulty = (savedDiff && DIFFICULTY_TIERS[savedDiff]) ? savedDiff : 'MEDIUM';
  } catch (e) {
    state.difficulty = 'MEDIUM';
  }

  // Snapshot any existing mid-run save BEFORE initNewRun() resets state to Floor 1
  const hadPriorSavedRun =
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    runPersistence.hasSavedRun();

  syncSettingsUI();
  updateCameraAspect();
  initNewRun();
  startFloorMatch(false);
  animate();
  runOpeningSplashAndTitleSequence();

  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.installAutoSaveHooks();
    if (hadPriorSavedRun) {
      // Present the Resume Delve prompt after boot initialization
      setTimeout(() => {
        runPersistence.promptResumeIfAvailable();
      }, 650);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
window.addEventListener('load', bootGame);
