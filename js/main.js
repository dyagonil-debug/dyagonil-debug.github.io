// ============================================================================
// APPLICATION ENTRY POINT & GLOBAL NAMESPACE (js/main.js)
// ============================================================================
if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
  lucide.createIcons();
}

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

  // 2. Install hooks on `#title-start-game-btn` ("Start Game") and auto-save observers.
  //    The Resume Delve modal will appear ONLY after the user clicks "Start Game".
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.installAutoSaveHooks();
  }
}

// ============================================================================
// COMPLETE SUBTERRANEAN EMOJI-TO-SVG INTERCEPTOR (HUD + SETTINGS + DEBUG + UI)
// ============================================================================
(function installSubterraneanEmojiReplacer() {
  const svgUri = (body) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${body}</svg>`
    )}`;

  const INLINE_SVGS = {
    BACKPACK: svgUri(`
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="55%" stop-color="#b45309"/><stop offset="100%" stop-color="#78350f"/></linearGradient></defs>
      <path d="M24 14 C24 7, 40 7, 40 14" fill="none" stroke="#d97706" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="7" y="30" width="7" height="18" rx="3.5" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
      <rect x="50" y="30" width="7" height="18" rx="3.5" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
      <rect x="13" y="14" width="38" height="42" rx="10" fill="url(#g)" stroke="#fde68a" stroke-width="2.5"/>
      <path d="M13 24 C13 16, 51 16, 51 24 L49 32 C49 35, 15 35, 15 32 Z" fill="#92400e" stroke="#fbbf24" stroke-width="2"/>
      <rect x="19" y="36" width="26" height="15" rx="5" fill="#451a03" stroke="#f59e0b" stroke-width="2"/>
      <rect x="28" y="26" width="8" height="12" rx="2.5" fill="#fde68a" stroke="#451a03" stroke-width="1.5"/>
    `),
    SPARKLE: svgUri(`
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#2dd4bf"/></linearGradient></defs>
      <path d="M32 4 Q35 25 56 28 Q35 31 32 52 Q29 31 8 28 Q29 25 32 4 Z" fill="url(#g)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 8 Q51.5 15 58 16.5 Q51.5 18 50 25 Q48.5 18 42 16.5 Q48.5 15 50 8 Z" fill="#5eead4" stroke="#ccfbf1" stroke-width="1.2"/>
      <path d="M16 40 Q17.5 47 24 48.5 Q17.5 50 16 57 Q14.5 50 8 48.5 Q14.5 47 16 40 Z" fill="#fde047" stroke="#fef9c3" stroke-width="1.2"/>
    `),
    FULLSCREEN: svgUri(`
      <rect x="6" y="10" width="52" height="38" rx="6" fill="#1c1917" stroke="#2dd4bf" stroke-width="3"/>
      <path d="M14 24 V16 H22 M50 24 V16 H42 M14 34 V42 H22 M50 34 V42 H42" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 54 H42 M32 48 V54" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>
    `),
    TIMER: svgUri(`
      <rect x="26" y="4" width="12" height="6" rx="2" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>
      <path d="M32 10 V14 M48 16 L53 11" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="22" fill="#1c1917" stroke="#f59e0b" stroke-width="3.5"/>
      <circle cx="32" cy="36" r="17" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="4 4"/>
      <path d="M32 36 V23 M32 36 L42 41" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="32" cy="36" r="3" fill="#fbbf24"/>
    `),
    TOUCH: svgUri(`
      <circle cx="32" cy="16" r="10" fill="none" stroke="#2dd4bf" stroke-width="2.5" stroke-dasharray="4 3"/>
      <circle cx="32" cy="16" r="5" fill="#2dd4bf" fill-opacity="0.35"/>
      <path d="M28 16 V36 L21 33 C18 32, 16 35, 18 38 L27 52 C29 55, 33 56, 38 56 H44 C49 56, 52 52, 52 47 V33 C52 30, 48 30, 48 33 V29 C48 26, 42 26, 42 29 V27 C42 24, 36 24, 36 27 V16 C36 12, 28 12, 28 16 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2.2" stroke-linejoin="round"/>
    `),
    MUSIC: svgUri(`
      <path d="M24 46 V16 L52 10 V40" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 24 L52 18" stroke="#2dd4bf" stroke-width="3.5"/>
      <ellipse cx="18" cy="47" rx="8" ry="6" transform="rotate(-15 18 47)" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
      <ellipse cx="46" cy="41" rx="8" ry="6" transform="rotate(-15 46 41)" fill="#2dd4bf" stroke="#ccfbf1" stroke-width="2"/>
    `),
    SFX: svgUri(`
      <path d="M10 24 H20 L34 12 V52 L20 40 H10 Z" fill="#f59e0b" stroke="#fde68a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M42 22 C47 27, 47 37, 42 42" fill="none" stroke="#2dd4bf" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M49 14 C57 23, 57 41, 49 50" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>
    `),
    HAPTICS: svgUri(`
      <rect x="18" y="10" width="28" height="44" rx="5" fill="#1c1917" stroke="#fbbf24" stroke-width="2.5"/>
      <circle cx="32" cy="47" r="2.2" fill="#2dd4bf"/>
      <path d="M11 20 L7 26 L12 32 L7 38 L11 44" fill="none" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M53 20 L57 26 L52 32 L57 38 L53 44" fill="none" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    MOUNTAIN: svgUri(`
      <defs><linearGradient id="m" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#44403c"/></linearGradient></defs>
      <path d="M6 54 L26 14 L44 54 Z" fill="url(#m)" stroke="#fde68a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M28 54 L44 24 L58 54 Z" fill="#292524" stroke="#2dd4bf" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M19 28 L26 14 L33 28 L28 24 L26 29 L23 24 Z" fill="#fef08a"/>
    `),
    WRENCH: svgUri(`
      <path d="M43 10 C37 10, 33 15, 34 21 L13 42 C10 45, 10 50, 13 53 C16 56, 21 56, 24 53 L45 32 C51 33, 56 29, 56 23 C56 21, 55 19, 54 18 L48 24 L42 22 L40 16 L46 10 C45 10, 44 10, 43 10 Z" fill="#2dd4bf" stroke="#ccfbf1" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M14 12 L26 24 M10 18 L22 6 L30 14 L18 26 Z" fill="#f59e0b" stroke="#fde68a" stroke-width="2" stroke-linejoin="round"/>
    `),
    LAUNCH: svgUri(`
      <path d="M14 38 L10 50 L22 46 Z" fill="#f97316"/>
      <path d="M36 10 C46 8, 56 18, 54 28 C51 40, 38 48, 26 46 L18 38 C16 26, 24 13, 36 10 Z" fill="#2dd4bf" stroke="#ffffff" stroke-width="2.2"/>
      <circle cx="38" cy="26" r="5" fill="#0f172a" stroke="#fbbf24" stroke-width="2.2"/>
      <path d="M24 22 L12 24 L18 32 Z M42 40 L40 52 L32 46 Z" fill="#f59e0b" stroke="#fde68a" stroke-width="1.8" stroke-linejoin="round"/>
    `),
    RESET: svgUri(`
      <path d="M50 32 A18 18 0 1 1 44 18" fill="none" stroke="#fbbf24" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M46 8 V20 H34" fill="none" stroke="#2dd4bf" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    TRASH: svgUri(`
      <path d="M14 18 H50 M24 18 V12 H40 V18" fill="none" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 18 L21 54 H43 L46 18 Z" fill="#4c0519" stroke="#fb7185" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M27 26 V46 M37 26 V46" stroke="#fda4af" stroke-width="2.5" stroke-linecap="round"/>
    `),
    CARDS: svgUri(`
      <rect x="12" y="14" width="26" height="38" rx="4" transform="rotate(-10 25 33)" fill="#3b0764" stroke="#c084fc" stroke-width="2.2"/>
      <rect x="24" y="12" width="28" height="40" rx="4" transform="rotate(8 38 32)" fill="#1e1b4b" stroke="#fbbf24" stroke-width="2.5"/>
      <path d="M38 22 L44 32 L38 42 L32 32 Z" fill="#2dd4bf" stroke="#ccfbf1" stroke-width="1.5"/>
    `),
    KEYBOARD: svgUri(`
      <rect x="6" y="16" width="52" height="34" rx="6" fill="#1c1917" stroke="#2dd4bf" stroke-width="2.5"/>
      <rect x="13" y="23" width="7" height="6" rx="1.5" fill="#fbbf24"/><rect x="24" y="23" width="7" height="6" rx="1.5" fill="#fbbf24"/><rect x="35" y="23" width="7" height="6" rx="1.5" fill="#fbbf24"/><rect x="45" y="23" width="6" height="6" rx="1.5" fill="#2dd4bf"/>
      <rect x="18" y="38" width="28" height="6" rx="2" fill="#f59e0b"/>
    `),
    BOOK: svgUri(`
      <path d="M10 14 C18 12, 26 14, 32 18 C38 14, 46 12, 54 14 V48 C46 46, 38 48, 32 52 C26 48, 18 46, 10 48 Z" fill="#134e4a" stroke="#2dd4bf" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 18 V52" stroke="#fbbf24" stroke-width="2.5"/>
      <path d="M16 24 H26 M16 32 H26 M38 24 H48 M38 32 H48" stroke="#ccfbf1" stroke-width="2.2" stroke-linecap="round"/>
    `),
    GEM_GREEN: svgUri(`
      <polygon points="32,6 54,22 46,54 18,54 10,22" fill="#10b981" stroke="#a7f3d0" stroke-width="3"/>
      <polygon points="32,14 45,25 39,46 25,46 19,25" fill="#34d399"/>
    `),
    GEM_YELLOW: svgUri(`
      <polygon points="32,6 54,22 46,54 18,54 10,22" fill="#f59e0b" stroke="#fde68a" stroke-width="3"/>
      <polygon points="32,14 45,25 39,46 25,46 19,25" fill="#fbbf24"/>
    `),
    GEM_RED: svgUri(`
      <polygon points="32,6 54,22 46,54 18,54 10,22" fill="#e11d48" stroke="#fecdd3" stroke-width="3"/>
      <polygon points="32,14 45,25 39,46 25,46 19,25" fill="#fb7185"/>
    `)
  };

  function iconTag(src, extraClass = '') {
    const cls = ['c4-item-icon', extraClass].filter(Boolean).join(' ');
    return `<img class="${cls}" src="${src}" alt="" aria-hidden="true" loading="eager" decoding="async">`;
  }

  // Ordered longest-first so multi-codepoint sequences (e.g. 🐈‍⬛, 🖥️, ⏱️) match cleanly
  const EMOJI_SVG_ENTRIES = [
    ['🐈‍⬛', iconTag('./assets/icons/gambits/obsidian_cat.svg')],
    ['🖥️', iconTag(INLINE_SVGS.FULLSCREEN)],
    ['🖥',  iconTag(INLINE_SVGS.FULLSCREEN)],
    ['⏱️', iconTag(INLINE_SVGS.TIMER)],
    ['⏱',  iconTag(INLINE_SVGS.TIMER)],
    ['🏔️', iconTag(INLINE_SVGS.MOUNTAIN)],
    ['🏔',  iconTag(INLINE_SVGS.MOUNTAIN)],
    ['⛰️', iconTag(INLINE_SVGS.MOUNTAIN)],
    ['⛰',  iconTag(INLINE_SVGS.MOUNTAIN)],
    ['🛠️', iconTag(INLINE_SVGS.WRENCH)],
    ['🛠',  iconTag(INLINE_SVGS.WRENCH)],
    ['🗑️', iconTag(INLINE_SVGS.TRASH)],
    ['🗑',  iconTag(INLINE_SVGS.TRASH)],
    ['⌨️', iconTag(INLINE_SVGS.KEYBOARD)],
    ['⌨',  iconTag(INLINE_SVGS.KEYBOARD)],
    ['⛏️', iconTag('./assets/icons/cards/pickaxe.svg')],
    ['⛏',  iconTag('./assets/icons/cards/pickaxe.svg')],
    ['🛡️', iconTag('./assets/icons/bosses/sentinel.svg')],
    ['🛡',  iconTag('./assets/icons/bosses/sentinel.svg')],
    ['☠️', iconTag('./assets/icons/hud/skull.svg')],
    ['☠',  iconTag('./assets/icons/hud/skull.svg')],
    ['❤️', iconTag('./assets/icons/hud/heart_full.svg')],
    ['❤',  iconTag('./assets/icons/hud/heart_full.svg')],
    ['⚠️', iconTag('./assets/icons/hud/warning.svg')],
    ['⚠',  iconTag('./assets/icons/hud/warning.svg')],
    ['🎒', iconTag(INLINE_SVGS.BACKPACK)],
    ['💀', iconTag('./assets/icons/hud/skull.svg')],
    ['💖', iconTag('./assets/icons/hud/heart_full.svg')],
    ['💗', iconTag('./assets/icons/hud/heart_full.svg')],
    ['🖤', iconTag('./assets/icons/hud/heart_empty.svg')],
    ['💔', iconTag('./assets/icons/hud/heart_empty.svg')],
    ['✨', iconTag(INLINE_SVGS.SPARKLE)],
    ['🪙', iconTag('./assets/icons/hud/coin.svg')],
    ['🌋', iconTag('./assets/icons/hud/stability.svg')],
    ['🏆', iconTag('./assets/icons/hud/trophy.svg')],
    ['🎁', iconTag('./assets/icons/hud/chest.svg')],
    ['🎡', iconTag('./assets/icons/hud/wheel.svg')],
    ['🎲', iconTag('./assets/icons/hud/reroll.svg')],
    ['⚡', iconTag('./assets/icons/hud/mana.svg')],
    ['📐', iconTag('./assets/icons/topologies/classic_grid.svg')],
    ['👆', iconTag(INLINE_SVGS.TOUCH)],
    ['🎵', iconTag(INLINE_SVGS.MUSIC)],
    ['🔊', iconTag(INLINE_SVGS.SFX)],
    ['📳', iconTag(INLINE_SVGS.HAPTICS)],
    ['🚀', iconTag(INLINE_SVGS.LAUNCH)],
    ['🔄', iconTag(INLINE_SVGS.RESET)],
    ['🃏', iconTag(INLINE_SVGS.CARDS)],
    ['📖', iconTag(INLINE_SVGS.BOOK)],
    ['🟢', iconTag(INLINE_SVGS.GEM_GREEN, 'c4-item-icon-sm')],
    ['🟡', iconTag(INLINE_SVGS.GEM_YELLOW, 'c4-item-icon-sm')],
    ['🔴', iconTag(INLINE_SVGS.GEM_RED, 'c4-item-icon-sm')]
  ];

  const escapedKeys = EMOJI_SVG_ENTRIES.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const EMOJI_REGEX = new RegExp(`(${escapedKeys.join('|')})`, 'g');
  const EMOJI_LOOKUP = Object.fromEntries(EMOJI_SVG_ENTRIES);

  if (typeof window.UI_ICONS === 'object' && window.UI_ICONS) {
    try {
      window.UI_ICONS = Object.freeze({
        ...window.UI_ICONS,
        COIN: iconTag('./assets/icons/hud/coin.svg'),
        WARNING: iconTag('./assets/icons/hud/warning.svg'),
        TROPHY: iconTag('./assets/icons/hud/trophy.svg'),
        SKULL: iconTag('./assets/icons/hud/skull.svg'),
        HEART_FULL: iconTag('./assets/icons/hud/heart_full.svg'),
        HEART_EMPTY: iconTag('./assets/icons/hud/heart_empty.svg'),
        BACKPACK: iconTag(INLINE_SVGS.BACKPACK),
        SPARKLE: iconTag(INLINE_SVGS.SPARKLE)
      });
    } catch (_) {}
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE']);

  function replaceTextNodeWithSvgNodes(textNode) {
    const parent = textNode.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return;

    const val = textNode.nodeValue;
    if (!val || !EMOJI_REGEX.test(val)) return;
    EMOJI_REGEX.lastIndex = 0;

    const parts = val.split(EMOJI_REGEX);
    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      if (EMOJI_LOOKUP[part]) {
        const temp = document.createElement('span');
        temp.innerHTML = EMOJI_LOOKUP[part];
        while (temp.firstChild) frag.appendChild(temp.firstChild);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    parent.replaceChild(frag, textNode);
  }

  function scanSubtreeForEmojis(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      replaceTextNodeWithSvgNodes(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has(root.tagName)) return;

    if (
      root.childNodes.length === 1 &&
      root.firstChild.nodeType === Node.TEXT_NODE &&
      root.firstChild.nodeValue.includes('<img') &&
      root.firstChild.nodeValue.includes('c4-item-icon')
    ) {
      root.innerHTML = root.firstChild.nodeValue;
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodesToProcess = [];
    let current;
    while ((current = walker.nextNode())) {
      if (current.nodeValue && EMOJI_REGEX.test(current.nodeValue)) {
        nodesToProcess.push(current);
      }
      EMOJI_REGEX.lastIndex = 0;
    }
    for (let i = 0; i < nodesToProcess.length; i++) {
      replaceTextNodeWithSvgNodes(nodesToProcess[i]);
    }
  }

  function initEmojiObserver() {
    scanSubtreeForEmojis(document.body);
    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'characterData') {
          replaceTextNodeWithSvgNodes(m.target);
        } else if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            scanSubtreeForEmojis(m.addedNodes[j]);
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiObserver, { once: true });
  } else {
    initEmojiObserver();
  }
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
window.addEventListener('load', bootGame);