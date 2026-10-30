// ============================================================================
// SUBTERRANEAN ASCENSION — UNIVERSAL EMOJI & RAW <IMG> INTERCEPTOR
// (js/ui/emojiReplacer.js)
// 1. Replaces all remaining Unicode emojis (🎒, 💀, ❤️/🖤/💔, ✨, and UI icons)
//    with custom Subterranean vector SVGs.
// 2. Automatically upgrades any raw `<img ... c4-item-icon ...>` strings that
//    were accidentally assigned via `.textContent` (such as `#roulette-result-title`
//    in rouletteSim.js and `#bazaar-swap-title` in modals.js) into real DOM <img> nodes.
// ============================================================================
(function installSubterraneanEmojiReplacer() {
  function iconTag(src, extraClass = '') {
    const cls = ['c4-item-icon', extraClass].filter(Boolean).join(' ');
    return `<img class="${cls}" src="${src}" alt="" aria-hidden="true" loading="eager" decoding="async">`;
  }

  // Ordered longest-first so variation selectors (\uFE0F) & ZWJ sequences match cleanly
  const EMOJI_SVG_ENTRIES = [
    ['🐈‍⬛', iconTag('./assets/icons/gambits/obsidian_cat.svg')],
    ['🖥️', iconTag('./assets/icons/hud/fullscreen.svg')],
    ['🖥',  iconTag('./assets/icons/hud/fullscreen.svg')],
    ['⏱️', iconTag('./assets/icons/hud/timer.svg')],
    ['⏱',  iconTag('./assets/icons/hud/timer.svg')],
    ['🏔️', iconTag('./assets/icons/hud/mountain.svg')],
    ['🏔',  iconTag('./assets/icons/hud/mountain.svg')],
    ['⛰️', iconTag('./assets/icons/hud/mountain.svg')],
    ['⛰',  iconTag('./assets/icons/hud/mountain.svg')],
    ['🛠️', iconTag('./assets/icons/hud/wrench.svg')],
    ['🛠',  iconTag('./assets/icons/hud/wrench.svg')],
    ['🗑️', iconTag('./assets/icons/hud/trash.svg')],
    ['🗑',  iconTag('./assets/icons/hud/trash.svg')],
    ['⌨️', iconTag('./assets/icons/hud/keyboard.svg')],
    ['⌨',  iconTag('./assets/icons/hud/keyboard.svg')],
    ['👁️', iconTag('./assets/icons/hud/eye.svg')],
    ['👁',  iconTag('./assets/icons/hud/eye.svg')],
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
    ['🎒', iconTag('./assets/icons/hud/backpack.svg')],
    ['💀', iconTag('./assets/icons/hud/skull.svg')],
    ['💖', iconTag('./assets/icons/hud/heart_full.svg')],
    ['💗', iconTag('./assets/icons/hud/heart_full.svg')],
    ['🖤', iconTag('./assets/icons/hud/heart_empty.svg')],
    ['💔', iconTag('./assets/icons/hud/heart_empty.svg')],
    ['✨', iconTag('./assets/icons/hud/sparkle.svg')],
    ['🪙', iconTag('./assets/icons/hud/coin.svg')],
    ['🌋', iconTag('./assets/icons/hud/stability.svg')],
    ['🏆', iconTag('./assets/icons/hud/trophy.svg')],
    ['🎁', iconTag('./assets/icons/hud/chest.svg')],
    ['🎡', iconTag('./assets/icons/hud/wheel.svg')],
    ['🎲', iconTag('./assets/icons/hud/reroll.svg')],
    ['⚡', iconTag('./assets/icons/hud/mana.svg')],
    ['📐', iconTag('./assets/icons/topologies/classic_grid.svg')],
    ['👆', iconTag('./assets/icons/hud/touch.svg')],
    ['🎵', iconTag('./assets/icons/hud/music.svg')],
    ['🔊', iconTag('./assets/icons/hud/sfx.svg')],
    ['🔇', iconTag('./assets/icons/hud/muted.svg')],
    ['📳', iconTag('./assets/icons/hud/haptics.svg')],
    ['🚀', iconTag('./assets/icons/hud/launch.svg')],
    ['🔄', iconTag('./assets/icons/hud/reset.svg')],
    ['🃏', iconTag('./assets/icons/hud/cards.svg')],
    ['📖', iconTag('./assets/icons/hud/book.svg')],
    ['🟢', iconTag('./assets/icons/hud/gem_easy.svg', 'c4-item-icon-sm')],
    ['🟡', iconTag('./assets/icons/hud/gem_medium.svg', 'c4-item-icon-sm')],
    ['🔴', iconTag('./assets/icons/hud/gem_hard.svg', 'c4-item-icon-sm')]
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
        EYE: iconTag('./assets/icons/hud/eye.svg'),
        MUTED: iconTag('./assets/icons/hud/muted.svg'),
        SPEAKER: iconTag('./assets/icons/hud/sfx.svg'),
        HEART_FULL: iconTag('./assets/icons/hud/heart_full.svg'),
        HEART_EMPTY: iconTag('./assets/icons/hud/heart_empty.svg'),
        BACKPACK: iconTag('./assets/icons/hud/backpack.svg'),
        SPARKLE: iconTag('./assets/icons/hud/sparkle.svg')
      });
    } catch (_) {}
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE']);

  function containsRawImgMarkup(str) {
    return typeof str === 'string' && str.includes('<img') && (str.includes('c4-item-icon') || str.includes('data:image/svg+xml'));
  }

  function replaceEmojisInPlainString(str) {
    if (!str || !EMOJI_REGEX.test(str)) {
      EMOJI_REGEX.lastIndex = 0;
      return str;
    }
    EMOJI_REGEX.lastIndex = 0;
    return str.replace(EMOJI_REGEX, (match) => EMOJI_LOOKUP[match] || match);
  }

  function replaceTextNodeWithSvgNodes(textNode) {
    const parent = textNode.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return;

    const val = textNode.nodeValue;
    if (!val) return;

    // Case 1: A script assigned raw `<img src="data:image/svg+xml..." class="c4-item-icon">` via .textContent
    // (e.g. #roulette-result-title in rouletteSim.js or #bazaar-swap-title in modals.js)
    if (containsRawImgMarkup(val)) {
      const safeHtml = val
        .split(/(<img[^>]*>)/gi)
        .map((part) => (/^<img[^>]*>$/i.test(part) ? part : replaceEmojisInPlainString(part)))
        .join('');
      const temp = document.createElement('span');
      temp.innerHTML = safeHtml;
      const frag = document.createDocumentFragment();
      while (temp.firstChild) frag.appendChild(temp.firstChild);
      parent.replaceChild(frag, textNode);
      return;
    }

    // Case 2: Standard Unicode emoji replacement inside a text node
    if (!EMOJI_REGEX.test(val)) return;
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

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodesToProcess = [];
    let current;
    while ((current = walker.nextNode())) {
      const v = current.nodeValue;
      if (v && (containsRawImgMarkup(v) || EMOJI_REGEX.test(v))) {
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
