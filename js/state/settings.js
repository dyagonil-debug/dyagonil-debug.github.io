// ============================================================================
// PERSISTENT USER SETTINGS ENGINE (localStorage) (js/state/settings.js)
// ============================================================================

// ============================================================================
// 0. PERSISTENT USER SETTINGS ENGINE (localStorage: c4_subterranean_settings)
// ============================================================================
const SETTINGS_STORAGE_KEY = 'c4_subterranean_settings';
const userSettings = {
    slotCalloutsEnabled: true,
    floatingPopsEnabled: true,
    notificationSpeed: 'normal', // 'fast' (2500ms) | 'normal' (4800ms) | 'extended' (7000ms)
    musicEnabled: true,          // Retro 8-Bit Chiptune Soundtrack toggle
    sfxEnabled: true,
    hapticsEnabled: true,
    touchDropMode: 'confirm'     // 'confirm' (Two-Tap Safe) | 'instant' (Single-Tap Fast)
};

function loadUserSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            Object.assign(userSettings, parsed);
        }
    } catch (e) {}
}

function saveUserSettings() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
    } catch (e) {}
    syncSettingsUI();
}

function getConfiguredHoldDuration(baseMs = 4800) {
    if (userSettings.notificationSpeed === 'fast') return Math.round(baseMs * 0.52);
    if (userSettings.notificationSpeed === 'extended') return Math.round(baseMs * 1.46);
    return baseMs;
}

loadUserSettings();
