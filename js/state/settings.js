// ============================================================================
// PERSISTENT USER SETTINGS ENGINE (localStorage) (js/state/settings.js)
// ============================================================================
// ============================================================================
// 0. PERSISTENT USER SETTINGS ENGINE (localStorage: c4_subterranean_settings)
// ============================================================================
const SETTINGS_STORAGE_KEY = 'c4_subterranean_settings';
const VALID_NOTIFICATION_SPEEDS = new Set(['fast', 'normal', 'extended']);
const VALID_TOUCH_DROP_MODES = new Set(['confirm', 'instant']);
const BOOLEAN_SETTING_KEYS = [
  'slotCalloutsEnabled',
  'floatingPopsEnabled',
  'musicEnabled',
  'sfxEnabled',
  'hapticsEnabled'
];

const userSettings = {
  simplifiedText: true,
  slotCalloutsEnabled: true,
  floatingPopsEnabled: true,
  notificationSpeed: 'normal', // 'fast' (2500ms) | 'normal' (4800ms) | 'extended' (7000ms)
  musicEnabled: true, // Retro 8-Bit Chiptune Soundtrack toggle
  sfxEnabled: true,
  hapticsEnabled: true,
  touchDropMode: 'confirm' // 'confirm' (Two-Tap Safe) | 'instant' (Single-Tap Fast)
};

function loadUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    userSettings.simplifiedText = (typeof parsed.simplifiedText === 'boolean')
      ? parsed.simplifiedText
      : true;
    if (!parsed || typeof parsed !== 'object') return;

    for (const key of BOOLEAN_SETTING_KEYS) {
      if (typeof parsed[key] === 'boolean') {
        userSettings[key] = parsed[key];
      }
    }
    if (VALID_NOTIFICATION_SPEEDS.has(parsed.notificationSpeed)) {
      userSettings.notificationSpeed = parsed.notificationSpeed;
    }
    if (VALID_TOUCH_DROP_MODES.has(parsed.touchDropMode)) {
      userSettings.touchDropMode = parsed.touchDropMode;
    }
  } catch (e) {}
}

function saveUserSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  } catch (e) {}
  if (typeof syncSettingsUI === 'function') {
    syncSettingsUI();
  }
}

function getConfiguredHoldDuration(baseMs = 4800) {
  if (userSettings.notificationSpeed === 'fast') return Math.round(baseMs * 0.52);
  if (userSettings.notificationSpeed === 'extended') return Math.round(baseMs * 1.46);
  return baseMs;
}

loadUserSettings();
