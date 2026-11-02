// ============================================================================
// PERSISTENT USER SETTINGS ENGINE (localStorage) (js/state/settings.js)
// ============================================================================
const SETTINGS_STORAGE_KEY = 'c4_subterranean_settings';
const VALID_NOTIFICATION_SPEEDS = new Set(['fast', 'normal', 'extended']);
const VALID_TOUCH_DROP_MODES = new Set(['confirm', 'instant']);
const VALID_UI_SCALES = new Set(['auto', '100', '115', '130']);
const BOOLEAN_SETTING_KEYS = [
  'simplifiedViewEnabled',
  'slotCalloutsEnabled',
  'floatingPopsEnabled',
  'musicEnabled',
  'sfxEnabled',
  'hapticsEnabled'
];

const userSettings = {
  simplifiedViewEnabled: true, // ON by default: Binding of Isaac-style lore hints & low visual clutter
  slotCalloutsEnabled: true,
  floatingPopsEnabled: true,
  notificationSpeed: 'normal', // 'fast' (2500ms) | 'normal' (4800ms) | 'extended' (7000ms)
  musicEnabled: true,
  sfxEnabled: true,
  hapticsEnabled: true,
  touchDropMode: 'confirm', // 'confirm' (Two-Tap Safe) | 'instant' (Single-Tap Fast)
  uiScale: 'auto' // 'auto' (Responsive Desktop Boost) | '100' | '115' | '130'
};

function isSimplifiedView() {
  return !(typeof userSettings !== 'undefined' && userSettings && userSettings.simplifiedViewEnabled === false);
}

function getItemDesc(entry) {
  if (!entry) return '';
  if (isSimplifiedView() && entry.loreDesc) return entry.loreDesc;
  return entry.desc || '';
}

function getCardShortDesc(entry) {
  if (!entry) return '';
  if (isSimplifiedView() && entry.loreShortDesc) return entry.loreShortDesc;
  return entry.shortDesc || entry.desc || '';
}

function loadUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
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
    if (VALID_UI_SCALES.has(parsed.uiScale)) {
      userSettings.uiScale = parsed.uiScale;
    }
  } catch (_) {}
}

function saveUserSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  } catch (_) {}
  applyUiScaleSetting();
  if (typeof syncSettingsUI === 'function') {
    syncSettingsUI();
  }
}

function getConfiguredHoldDuration(baseMs = 4800) {
  if (userSettings.notificationSpeed === 'fast') return Math.round(baseMs * 0.52);
  if (userSettings.notificationSpeed === 'extended') return Math.round(baseMs * 1.46);
  return baseMs;
}


function applyUiScaleSetting() {
  if (typeof document === 'undefined' || !document.documentElement || typeof document.documentElement.setAttribute !== 'function') return;
  const scale = (typeof userSettings !== 'undefined' && userSettings && userSettings.uiScale) ? userSettings.uiScale : 'auto';
  document.documentElement.setAttribute('data-ui-scale', scale);
}

loadUserSettings();
applyUiScaleSetting();

if (typeof window !== 'undefined') {
  Object.assign(window, {
    userSettings,
    isSimplifiedView,
    getItemDesc,
    getCardShortDesc,
    loadUserSettings,
    saveUserSettings,
    applyUiScaleSetting,
    getConfiguredHoldDuration
  });
}
