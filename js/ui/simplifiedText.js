// ============================================================================
// ISAAC-STYLE SIMPLIFIED TEXT ENGINE & TOGGLE CONTROLLER
// (js/ui/simplifiedText.js)
// ============================================================================

(function () {
  // Ensure userSettings.simplifiedText exists and defaults to true
  if (typeof window.userSettings !== 'undefined' && typeof window.userSettings.simplifiedText !== 'boolean') {
    window.userSettings.simplifiedText = true;
  }

  // Helper to check if Brief Text Mode is active
  function isSimplifiedMode() {
    return typeof window.userSettings !== 'undefined'
      ? Boolean(window.userSettings.simplifiedText)
      : true;
  }

  // Dual-text helper for runtime strings
  function tText(fullText, shortText) {
    return isSimplifiedMode() ? shortText : fullText;
  }

  // --------------------------------------------------------------------------
  // 1. STATIC DOM ELEMENT TEXT PAIRS (id / selector -> { full, short })
  // --------------------------------------------------------------------------
  const STATIC_DOM_MAP = [
    // Settings Modal
    {
      selector: '#simplified-text-status-desc',
      full: 'Condense item, difficulty, and UI descriptions into ultra-short pickup phrases.',
      short: 'Short item & rule text.'
    },
    {
      selector: '#fullscreen-status-desc',
      full: 'Expand the 3D cavern viewport to fill your entire screen.',
      short: 'Fill entire screen.'
    },
    {
      selector: '#toggle-slot-callouts-btn',
      targetParentP: true,
      full: 'Show 3D-projected bonus cards over the board when landing on Enchanted Slots.',
      short: 'Show 3D pop-ups on Enchanted Slots.'
    },
    {
      selector: '#toggle-floating-pops-btn',
      targetParentP: true,
      full: 'Show floating +Gold, +Mana & Gambit synergy pills drifting above the board.',
      short: 'Show floating +Gold & +Mana text.'
    },
    {
      selector: '.dur-mode-btn',
      targetContainerP: true,
      full: 'Adjust how long slot callouts and toasts stay on screen before fading out.',
      short: 'Pop-up fade speed.'
    },
    {
      selector: '.drop-mode-btn',
      targetContainerP: true,
      full: 'Choose between Two-Tap Confirm (prevents misclicks) or Single-Tap Instant Drop.',
      short: 'Two-Tap Confirm vs. Single-Tap Drop.'
    },
    {
      selector: '#settings-reset-run-btn',
      full: '🔄 Reset Run (Floor 1)',
      short: '🔄 Restart Run'
    },

    // Boot & Title Screen
    {
      selector: '#terminal-start-app-btn span',
      full: '⌨️ [ TAP OR PRESS ENTER TO START APP ]',
      short: '⌨️ [ TAP TO START ]'
    },
    {
      selector: '#terminal-crt-card > div:last-child',
      full: 'Initializes Web Audio Synthesizer & Launches Splash Screen',
      short: 'Unlocks audio & starts game'
    },
    {
      selector: '#title-Main-Header span',
      full: '⛰️ 3D Roguelike Deckbuilder',
      short: '⛰️ Roguelike Connect 4'
    },
    {
      selector: '#title-Sub-Desc',
      full: 'Outsmart the Grandmaster Negamax AI across procedural cavern topologies, wield Arcane Cards, and spin the Wheel of Fate.',
      short: 'Connect 4. Cast cards. Break the cavern.'
    },
    {
      selector: '#title-tutorial-btn span',
      full: '📖 How to Play (Tutorial)',
      short: '📖 How to Play'
    },
    {
      selector: '#title-Start-Wrap > div > span:last-child',
      full: '8-Bit Chiptune Audio Active',
      short: '8-Bit Audio ON'
    },

    // Difficulty Selection Modal
    {
      selector: '#difficulty-modal h2',
      full: 'Select Your Cavern Descent Tier',
      short: 'Select Difficulty'
    },
    {
      selector: '#difficulty-modal h2 + p',
      full: 'Choose how unforgiving the subterranean caverns, Bazaar economy, seismic timers, and Grandmaster AI will be on this run.',
      short: 'Sets AI smarts, timers, and shop prices.'
    },
    {
      selector: '#cancel-difficulty-modal-btn',
      full: 'Keep Current Run & Close',
      short: 'Cancel'
    },

    // Floor Intro Overlay
    {
      selector: '#floor-intro-rule-desc',
      full: 'Standard Cavern Guardian. Connect 4 tokens before Seismic Stability collapses!',
      short: 'Connect 4 before the ceiling caves in'
    },
    {
      selector: '#floor-intro-card .animate-pulse span',
      full: '👆 Tap anywhere to begin',
      short: '👆 Tap to fight'
    },

    // Top HUD & Banner
    {
      selector: '#status-text',
      full: 'Drag across columns to aim • Tap again to drop',
      short: 'Drag to aim • Tap to drop'
    },

    // Underground Bazaar Modal
    {
      selector: '#bazaar-payout-summary > span',
      full: 'Floor Clear + Stability Speed Bonus:',
      short: 'Clear + Speed Bonus:'
    },
    {
      selector: '#roulette-bazaar-summary',
      full: 'Spin the physics roulette wheel for Jackpots, Relics & Mana—or risk Curses, Gremlins & Cave-Ins!',
      short: 'Spin for Jackpots & Relics—or Curses!'
    },
    {
      selector: '#bazaar-swap-title',
      full: 'Gambit Slots Full — Swap or Expand!',
      short: 'Slots Full — Swap or Buy Slot'
    },
    {
      selector: '#bazaar-swap-desc',
      full: 'Choose an equipped Gambit below to sell (+$3) & replace, or expand your Gambit capacity on the spot:',
      short: 'Sell a Gambit (+$3) to make room, or buy +1 slot:'
    },
    {
      selector: '#next-floor-btn',
      full: 'Descend to Next Subterranean Floor →',
      short: 'Next Floor →'
    },

    // Boss Victory Chest Modal
    {
      selector: '#boss-chest-subtitle',
      full: 'Boss Vanquished • Ascension Milestone!',
      short: 'Boss Defeated!'
    },
    {
      selector: '#boss-chest-title',
      full: 'Ascension Power Spike Unlocked',
      short: 'Stat Upgrade Unlocked'
    },
    {
      selector: '#boss-relic-choices',
      targetPrevSibling: true,
      full: 'Draft 1 Free Boss Gambit Relic (Or Claim +$8 Gold)',
      short: 'Pick 1 Free Relic (or take +$8)'
    },
    {
      selector: '#skip-boss-relic-btn',
      full: 'Salvage Chest for +$8 Gold & Enter Bazaar →',
      short: 'Take +$8 Gold →'
    },

    // Wheel of Subterranean Fate (Roulette Modal)
    {
      selector: '#roulette-modal h3',
      full: 'The Wheel of Subterranean Fate',
      short: 'Wheel of Fate'
    },
    {
      selector: '#roulette-center-label',
      full: 'Hold Launch to Spin',
      short: 'Hold to Spin'
    },
    {
      selector: '#roulette-result-title',
      full: '5 Blessings & 4 Cursed Hazards Await',
      short: '5 Blessings • 4 Curses'
    },
    {
      selector: '#roulette-result-desc',
      full: 'Hold the Spin button (or drag across the wheel rim) to set launch velocity, then release to hurl the silver ball!',
      short: 'Hold Spin or swipe the wheel to launch!'
    },
    {
      selector: '#charge-spin-btn',
      full: 'Hold to Charge & Spin (FREE)',
      short: 'Hold to Spin (FREE)'
    },

    // Game Over Modal Buttons
    {
      selector: '#retry-floor-btn',
      full: 'Retry Current Floor',
      short: 'Retry Floor'
    },
    {
      selector: '#new-ascension-btn',
      full: 'Start Fresh Run (Floor 1)',
      short: 'New Run (Floor 1)'
    },

    // Floating Dismiss Callouts Pill
    {
      selector: '#dismiss-all-callouts-btn span',
      full: '✕ Dismiss All Pop-Outs',
      short: '✕ Clear'
    }
  ];

  // Tooltip (`title` attribute) replacements
  const TOOLTIP_MAP = [
    {
      selector: '#boss-hp-strip',
      full: 'Boss Health Points (Deplete all HP phases to vanquish Boss)',
      short: 'Boss HP: Win 1 round per heart'
    },
    {
      selector: '#gold-badge',
      targetParent: true,
      full: 'Gold Coins ($1 per unused Stability turn)',
      short: 'Gold (+$1 per spare turn)'
    },
    {
      selector: '#stability-info-btn',
      full: 'Seismic Stability (Turns before Stalactite Collapse)',
      short: 'Turns until cave-in'
    }
  ];

  // --------------------------------------------------------------------------
  // 2. ISAAC-STYLE BRIEF CATALOG OVERRIDES & KEYWORD CONDENSER
  // --------------------------------------------------------------------------
  const BRIEF_DIFFICULTY_DESC = {
    EASY: 'More gold, generous timer, forgiving AI',
    MEDIUM: 'Standard gold, timer & AI depth',
    HARD: 'Scarce gold, fast collapse, brutal AI'
  };

  const BRIEF_BY_NAME_OR_ID = {
    // Reserve Tokens
    ANVIL: 'Crushes token directly below',
    'Heavy Anvil': 'Crushes token directly below',
    WILD: 'Counts for any color line',
    'Wild Prismatic': 'Counts for any color line',
    BOMB: 'Vaporizes row or column on impact',
    'Jalapeño Bomb': 'Vaporizes row or column on impact',
    BAT: 'Hovers & steals enemy spot',
    'Cave Bat': 'Hovers & steals enemy spot',

    // Cards
    TREMOR: 'Shakes board • Shifts bottom tokens',
    'Subterranean Tremor': 'Shakes board • Shifts bottom tokens',

    // Gambits
    OBSIDIAN_CAT: 'Extra life / Lucky slot triggers',
    'Obsidian Cat Figurine': 'Extra life / Lucky slot triggers',

    // Enchanted Slots
    GOLD: '+$3 Gold on land',
    MANA: '+1 Mana on land',
    CARD: 'Draw 1 card on land',
    DRAW: 'Draw 1 card on land',
    STABILITY: '+2 Stability turns on land'
  };

  // Fallback automatic Isaac-style condenser for any catalog item not explicitly keyed above
  function condenseToIsaacPhrase(rawText, itemObj) {
    if (!rawText || typeof rawText !== 'string') return '';
    if (itemObj) {
      if (itemObj.shortDesc) return itemObj.shortDesc;
      if (itemObj.id && BRIEF_BY_NAME_OR_ID[itemObj.id]) return BRIEF_BY_NAME_OR_ID[itemObj.id];
      if (itemObj.name && BRIEF_BY_NAME_OR_ID[itemObj.name]) return BRIEF_BY_NAME_OR_ID[itemObj.name];
    }

    const lower = rawText.toLowerCase();
    // Pattern-based Isaac-style boiling down
    if (lower.includes('crush') && lower.includes('below')) return 'Crushes token directly below';
    if (lower.includes('wild') || lower.includes('both players') || lower.includes('any color')) return 'Counts for any color line';
    if (lower.includes('jalape') || lower.includes('vaporiz') || lower.includes('explod')) return 'Vaporizes nearby tokens on impact';
    if (lower.includes('bottom row') && (lower.includes('clear') || lower.includes('destroy') || lower.includes('shift'))) return 'Shifts or clears bottom row';
    if (lower.includes('swap') && lower.includes('top')) return 'Swaps top two tokens';
    if (lower.includes('invert') || lower.includes('flip')) return 'Flips column token stack';
    if (lower.includes('stone') || lower.includes('blocker') || lower.includes('petrif')) return 'Drops neutral stone blocker';
    if (lower.includes('peek') || lower.includes('telegraph') || lower.includes('intent')) return 'Reveals AI next move';
    if (lower.includes('gravity')) return 'Alters token drop gravity';

    // Extract concise first clause (up to first period or dash, capped at ~52 chars)
    const firstSentence = rawText
      .replace(/\s+/g, ' ')
      .split(/\.(?:\s|$)|—|;/)[0]
      .trim();

    if (firstSentence.length <= 52) return firstSentence;
    return firstSentence.slice(0, 49).trim() + '…';
  }

  // Sync a dictionary or array of catalog items so `.desc` toggles between full & brief
  function syncCatalogCollection(collection, customShortMap) {
    if (!collection || typeof collection !== 'object') return;
    const entries = Array.isArray(collection) ? collection : Object.entries(collection);

    entries.forEach((entry) => {
      const key = Array.isArray(collection) ? (entry?.id || entry?.name) : entry[0];
      const item = Array.isArray(collection) ? entry : entry[1];
      if (!item || typeof item !== 'object') return;

      const fields = ['desc', 'description', 'ruleDesc', 'passiveDesc', 'summary'];
      fields.forEach((field) => {
        if (typeof item[field] === 'string') {
          const backupField = `_full_${field}`;
          const shortField = `_short_${field}`;
          if (!item[backupField]) {
            item[backupField] = item[field];
          }
          if (!item[shortField]) {
            item[shortField] = (customShortMap && customShortMap[key])
              || BRIEF_BY_NAME_OR_ID[key]
              || BRIEF_BY_NAME_OR_ID[item.id]
              || BRIEF_BY_NAME_OR_ID[item.name]
              || condenseToIsaacPhrase(item[backupField], item);
          }
          item[field] = isSimplifiedMode() ? item[shortField] : item[backupField];
        }
      });
    });
  }

  // Tutorial step brief overrides
  const BRIEF_TUTORIAL_STEPS = [
    'Drop tokens to connect 4 horizontally, vertically, or diagonally.',
    'Win before turns hit 0. Spare turns = +$1 Gold each.',
    'Land on glowing slots for instant Gold, Mana, or Card bonuses.',
    'Spend Mana to cast cards that bend board rules.',
    'One-use special tokens (Anvils, Bombs, Wilds) that replace your normal drop.',
    'Passive relics that trigger automatic bonuses every floor.',
    'Toggle the Eye icon to see the AI score for each column.',
    'Spend Gold on upgrades and spin the Wheel of Fate between floors.',
    'Floors 3, 6 & 9 have multi-HP Bosses with custom board hazards.'
  ];

  function syncAllCatalogs() {
    if (typeof DIFFICULTY_TIERS !== 'undefined') {
      syncCatalogCollection(DIFFICULTY_TIERS, BRIEF_DIFFICULTY_DESC);
    }
    if (typeof CARD_CATALOG !== 'undefined') {
      syncCatalogCollection(CARD_CATALOG);
    }
    if (typeof RESERVE_CATALOG !== 'undefined') {
      syncCatalogCollection(RESERVE_CATALOG);
    }
    if (typeof GAMBIT_CATALOG !== 'undefined') {
      syncCatalogCollection(GAMBIT_CATALOG);
    }
    if (typeof ENCHANT_TYPES !== 'undefined') {
      syncCatalogCollection(ENCHANT_TYPES);
    }
    if (typeof BOARD_TOPOLOGIES !== 'undefined') {
      syncCatalogCollection(BOARD_TOPOLOGIES);
    }
    if (typeof ROULETTE_WEDGES !== 'undefined') {
      syncCatalogCollection(ROULETTE_WEDGES);
    }
    if (typeof BOSS_POOLS_BY_ACT !== 'undefined' && BOSS_POOLS_BY_ACT) {
      Object.values(BOSS_POOLS_BY_ACT).forEach((pool) => syncCatalogCollection(pool));
    }
    if (typeof TUTORIAL_STEPS !== 'undefined' && Array.isArray(TUTORIAL_STEPS)) {
      TUTORIAL_STEPS.forEach((step, idx) => {
        if (!step || typeof step !== 'object') return;
        const bodyField = typeof step.body === 'string' ? 'body' : (typeof step.desc === 'string' ? 'desc' : null);
        if (bodyField) {
          if (!step._fullBody) step._fullBody = step[bodyField];
          if (!step._shortBody) step._shortBody = BRIEF_TUTORIAL_STEPS[idx] || condenseToIsaacPhrase(step._fullBody, step);
          step[bodyField] = isSimplifiedMode() ? step._shortBody : step._fullBody;
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. APPLY STATIC DOM & LIVE UI REFRESH
  // --------------------------------------------------------------------------
  function syncStaticDOM() {
    const brief = isSimplifiedMode();

    STATIC_DOM_MAP.forEach((entry) => {
      const el = document.querySelector(entry.selector);
      if (!el) return;

      let target = el;
      if (entry.targetParentP && el.parentElement) {
        target = el.parentElement.querySelector('p');
      } else if (entry.targetContainerP) {
        const container = el.closest('.space-y-2');
        target = container ? container.querySelector('p') : null;
      } else if (entry.targetPrevSibling) {
        target = el.previousElementSibling;
      }

      if (target) {
        target.textContent = brief ? entry.short : entry.full;
      }
    });

    TOOLTIP_MAP.forEach((entry) => {
      const el = document.querySelector(entry.selector);
      if (!el) return;
      const target = entry.targetParent ? el.parentElement : el;
      if (target) {
        target.setAttribute('title', brief ? entry.short : entry.full);
      }
    });
  }

  function refreshActiveViews() {
    // Re-render HUD strips & hand if those functions exist in global scope
    if (typeof renderHand === 'function') renderHand();
    if (typeof renderReservePouch === 'function') renderReservePouch();
    if (typeof renderGambitStrip === 'function') renderGambitStrip();
    if (typeof updateTopHUD === 'function') updateTopHUD();
    if (typeof renderDifficultyCards === 'function') renderDifficultyCards();

    // Update armed action inspector if currently visible
    const inspectorEl = document.getElementById('action-inspector');
    if (inspectorEl && !inspectorEl.classList.contains('hidden') && typeof state !== 'undefined') {
      const descEl = document.getElementById('inspector-desc');
      if (descEl && state.armedAction) {
        const item = state.armedAction.item || state.armedAction;
        if (item && typeof item.desc === 'string') {
          descEl.textContent = item.desc;
        }
      }
    }
  }

  function applySimplifiedTextMode() {
    syncAllCatalogs();
    syncStaticDOM();
    refreshActiveViews();
  }

  // --------------------------------------------------------------------------
  // 4. SETTINGS MODAL BUTTON BINDING & SYNC HOOK
  // --------------------------------------------------------------------------
  function bindSimplifiedTextToggle() {
    const toggleBtn = document.getElementById('toggle-simplified-text-btn');
    if (toggleBtn && !toggleBtn.dataset.boundSimplified) {
      toggleBtn.dataset.boundSimplified = 'true';
      toggleBtn.addEventListener('click', () => {
        userSettings.simplifiedText = !userSettings.simplifiedText;
        if (typeof sfx !== 'undefined' && typeof sfx.playHoverTick === 'function') {
          sfx.playHoverTick();
        }
        if (typeof saveUserSettings === 'function') {
          saveUserSettings();
        }
        applySimplifiedTextMode();
        if (typeof syncSettingsUI === 'function') {
          syncSettingsUI();
        }
      });
    }

    // Wrap syncSettingsUI so the toggle pill stays styled in sync with other settings pills
    if (typeof window.syncSettingsUI === 'function' && !window.syncSettingsUI._wrappedSimplified) {
      const origSyncSettingsUI = window.syncSettingsUI;
      window.syncSettingsUI = function () {
        origSyncSettingsUI.apply(this, arguments);
        if (typeof styleTogglePill === 'function') {
          styleTogglePill(
            document.getElementById('toggle-simplified-text-btn'),
            Boolean(userSettings.simplifiedText)
          );
        }
        syncStaticDOM();
      };
      window.syncSettingsUI._wrappedSimplified = true;
    }

    // Wrap showToast to condense common system toasts when Brief Text Mode is ON
    if (typeof window.showToast === 'function' && !window.showToast._wrappedSimplified) {
      const origShowToast = window.showToast;
      const BRIEF_TOAST_MAP = {
        'Salvaged Boss Chest for +$8 Gold!': '+$8 Gold!',
        'AI Column Telemetry: ON': 'AI Scores: ON',
        'AI Column Telemetry: OFF': 'AI Scores: OFF',
        'Audio & Chiptune Music Muted': 'Muted',
        'Audio & Chiptune Music Active': 'Audio ON'
      };
      window.showToast = function (msg, icon) {
        const outMsg = (isSimplifiedMode() && BRIEF_TOAST_MAP[msg]) ? BRIEF_TOAST_MAP[msg] : msg;
        return origShowToast.call(this, outMsg, icon);
      };
      window.showToast._wrappedSimplified = true;
    }

    // Wrap showGameOverModal to condense multi-sentence end-of-run messages
    if (typeof window.showGameOverModal === 'function' && !window.showGameOverModal._wrappedSimplified) {
      const origShowGameOver = window.showGameOverModal;
      window.showGameOverModal = function (isWin, heading, body) {
        let outBody = body;
        if (isSimplifiedMode() && typeof body === 'string') {
          if (isWin) {
            outBody = 'All 9 floors conquered!';
          } else if (body.toLowerCase().includes('stability') || body.toLowerCase().includes('collapse')) {
            outBody = 'Crushed by cave-in (0 Stability).';
          } else {
            outBody = 'Guardian connected 4.';
          }
        }
        return origShowGameOver.call(this, isWin, heading, outBody);
      };
      window.showGameOverModal._wrappedSimplified = true;
    }
  }

  // Expose helper API on window and window.C4
  window.SimplifiedText = {
    isSimplifiedMode,
    tText,
    apply: applySimplifiedTextMode,
    condenseToIsaacPhrase
  };

  // Initialize immediately and re-verify on DOMContentLoaded
  function initSimplifiedTextSystem() {
    bindSimplifiedTextToggle();
    applySimplifiedTextMode();
    if (typeof window.syncSettingsUI === 'function') {
      window.syncSettingsUI();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimplifiedTextSystem, { once: true });
  } else {
    initSimplifiedTextSystem();
  }
})();
