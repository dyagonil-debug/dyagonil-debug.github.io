// ============================================================================
// APPLICATION ENTRY POINT & GLOBAL NAMESPACE (js/main.js)
// ============================================================================

lucide.createIcons();

// Expose structured global namespace for inspection and extensibility
window.C4 = {
    config: {
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
    },
    settings: userSettings,
    state,
    sfx,
    bgm,
    aiEngine,
    rouletteSim,
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
    syncSettingsUI();
    updateCameraAspect();
    initNewRun();
    startFloorMatch(false);
    animate();
    runOpeningSplashAndTitleSequence();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
} else {
    bootGame();
}
window.addEventListener('load', bootGame);
