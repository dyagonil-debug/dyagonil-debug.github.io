// ============================================================================
// APPLICATION ENTRY POINT & GLOBAL NAMESPACE (js/main.js)
// ============================================================================
if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
  lucide.createIcons();
}

function registerSubterraneanServiceWorker() {
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', () => {
      if (window.caches && typeof window.caches.keys === 'function') {
        window.caches.keys().then((keys) => {
          keys.forEach((k) => {
            if (k !== 'subterranean-ascension-v59.0.0') {
              window.caches.delete(k).catch(() => {});
            }
          });
        }).catch(() => {});
      }
      navigator.serviceWorker.register('./sw.js?v=59').then((reg) => {
        if (reg && typeof reg.update === 'function') {
          reg.update().catch(() => {});
        }
      }).catch((err) => {
        console.warn('[C4 PWA] Service Worker registration skipped:', err);
      });
    });
  }
}

// Expose structured global namespace for inspection and extensibility
window.C4 = {
  version: '2.9.0-ascension-v59',
  config: {
    ROWS,
    COLS,
    TOTAL_FLOORS,
    DIFFICULTY_TIERS,
    LOADOUT_CATALOG: typeof LOADOUT_CATALOG !== 'undefined' ? LOADOUT_CATALOG : {},
    BOARD_TOPOLOGIES,
    CARD_CATALOG,
    RESERVE_CATALOG,
    GAMBIT_CATALOG,
    ENCHANT_TYPES,
    BOSS_POOLS_BY_ACT,
    ROULETTE_WEDGES,
    UI_ICONS: typeof UI_ICONS !== 'undefined' ? UI_ICONS : {}
  },
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
    if (typeof LOADOUT_STORAGE_KEY !== 'undefined' && typeof LOADOUT_CATALOG !== 'undefined') {
      const savedLoadout = localStorage.getItem(LOADOUT_STORAGE_KEY);
      state.loadoutId = (savedLoadout && LOADOUT_CATALOG[savedLoadout]) ? savedLoadout : 'spelunker';
    }
  } catch (_) {
    state.difficulty = 'MEDIUM';
    state.loadoutId = 'spelunker';
  }

  // 1. Capture & lock any existing checkpoint BEFORE initNewRun() resets state to Floor 1
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.captureBootCheckpointBeforeInit();
  }

  syncSettingsUI();
  updateCameraAspect();
  initNewRun();
  startFloorMatch(false);
  animate();
  runOpeningSplashAndTitleSequence();

  // 2. Install hooks on `#title-start-game-btn` ("Start Game") and auto-save observers
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.installAutoSaveHooks();
  }

  // 3. Register Offline PWA Service Worker
  registerSubterraneanServiceWorker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame, { once: true });
} else {
  bootGame();
}
window.addEventListener('load', bootGame);
