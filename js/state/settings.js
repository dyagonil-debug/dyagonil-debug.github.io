// ============================================================================
// PERSISTENT USER SETTINGS ENGINE (localStorage) (js/state/settings.js)
// ============================================================================
const SETTINGS_STORAGE_KEY = 'c4_subterranean_settings';
const VALID_NOTIFICATION_SPEEDS = new Set(['fast', 'normal', 'extended']);
const VALID_TOUCH_DROP_MODES = new Set(['confirm', 'instant']);
const VALID_GRAPHICS_MODES = new Set(['fancy', 'performance']);
const BOOLEAN_SETTING_KEYS = [
  'simplifiedViewEnabled',
  'uiAutoScale',
  'slotCalloutsEnabled',
  'floatingPopsEnabled',
  'musicEnabled',
  'sfxEnabled',
  'hapticsEnabled'
];

const userSettings = {
  simplifiedViewEnabled: true, // ON by default: Binding of Isaac-style lore hints & low visual clutter
  uiAutoScale: true,           // ON by default: Automatically scales UI based on viewport width
  uiScalePercent: 115,         // Manual UI scale percentage (75% to 150%) when uiAutoScale is OFF
  slotCalloutsEnabled: true,
  floatingPopsEnabled: true,
  notificationSpeed: 'normal', // 'fast' (2500ms) | 'normal' (4800ms) | 'extended' (7000ms)
  musicEnabled: true,
  sfxEnabled: true,
  hapticsEnabled: true,
  touchDropMode: 'confirm',    // 'confirm' (Two-Tap Safe) | 'instant' (Single-Tap Fast)
  graphicsMode: 'fancy'        // 'fancy' (High Detail 3D & Blur) | 'performance' (Cool & Fast)
};

function isPerformanceMode() {
  return typeof userSettings !== 'undefined' && userSettings && userSettings.graphicsMode === 'performance';
}

function applyGraphicsModeSetting() {
  const perf = isPerformanceMode();
  if (typeof document !== 'undefined') {
    if (document.body && document.body.classList) {
      document.body.classList.toggle('perf-mode', perf);
    }
    if (document.documentElement && typeof document.documentElement.setAttribute === 'function') {
      document.documentElement.setAttribute('data-graphics-mode', perf ? 'performance' : 'fancy');
    }
  }
  if (typeof applySceneGraphicsQuality === 'function') {
    applySceneGraphicsQuality();
  }
}

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

function computeAutoUiScalePercent() {
  const w = (typeof window !== 'undefined' && window.innerWidth)
    ? window.innerWidth
    : ((typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) || 1024);
  if (w >= 1600) return 130;
  if (w >= 1280) return 120;
  if (w >= 1024) return 115;
  if (w >= 768) return 108;
  return 100;
}

function getEffectiveUiScalePercent() {
  if (typeof userSettings === 'undefined' || !userSettings) return 100;
  if (userSettings.uiAutoScale !== false) {
    return computeAutoUiScalePercent();
  }
  const raw = Number(userSettings.uiScalePercent);
  if (!Number.isFinite(raw)) return 100;
  return Math.max(75, Math.min(150, Math.round(raw)));
}

function applyUiScaleSetting() {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const pct = getEffectiveUiScalePercent();
  const factor = pct / 100;
  const rootEl = document.documentElement;
  if (rootEl.style) {
    rootEl.style.fontSize = `${(16 * factor).toFixed(2)}px`;
    if (typeof rootEl.style.setProperty === 'function') {
      rootEl.style.setProperty('--c4-ui-scale', String(factor));
    }
  }
  if (typeof rootEl.setAttribute === 'function') {
    rootEl.setAttribute('data-ui-scale-mode', userSettings.uiAutoScale !== false ? 'auto' : 'manual');
    rootEl.setAttribute('data-ui-scale-pct', String(pct));
  }
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
    if (VALID_GRAPHICS_MODES.has(parsed.graphicsMode)) {
      userSettings.graphicsMode = parsed.graphicsMode;
    }
    if (typeof parsed.uiScalePercent === 'number' && Number.isFinite(parsed.uiScalePercent)) {
      userSettings.uiScalePercent = Math.max(75, Math.min(150, Math.round(parsed.uiScalePercent)));
    } else if (typeof parsed.uiScale === 'string') {
      // Backward compatibility with earlier preset values
      if (parsed.uiScale === 'auto') {
        userSettings.uiAutoScale = true;
      } else {
        const n = parseInt(parsed.uiScale, 10);
        if (Number.isFinite(n)) {
          userSettings.uiAutoScale = false;
          userSettings.uiScalePercent = Math.max(75, Math.min(150, n));
        }
      }
    }
  } catch (_) {}
}

function saveUserSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  } catch (_) {}
  applyUiScaleSetting();
  applyGraphicsModeSetting();
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
applyUiScaleSetting();
applyGraphicsModeSetting();

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (userSettings.uiAutoScale !== false) {
      applyUiScaleSetting();
      if (typeof syncSettingsUI === 'function') syncSettingsUI();
    }
  });
  Object.assign(window, {
    userSettings,
    isPerformanceMode,
    applyGraphicsModeSetting,
    isSimplifiedView,
    getItemDesc,
    getCardShortDesc,
    computeAutoUiScalePercent,
    getEffectiveUiScalePercent,
    applyUiScaleSetting,
    loadUserSettings,
    saveUserSettings,
    getConfiguredHoldDuration
  });
}
