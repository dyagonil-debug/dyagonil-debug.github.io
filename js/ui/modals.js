// ============================================================================
// MODALS, BAZAAR ECONOMY, BOSS CHEST, DIFFICULTY & SETTINGS UI (js/ui/modals.js)
// ============================================================================

function modalHudIcon(filename, extraClass = '') {
  const cls = ['c4-item-icon', extraClass].filter(Boolean).join(' ');
  return `<img class="${cls}" src="./assets/icons/hud/${filename}" alt="" aria-hidden="true" loading="eager" decoding="async">`;
}

function ensureValidGold() {
  if (typeof state !== 'undefined' && (!Number.isFinite(state.gold) || Number.isNaN(state.gold))) {
    const diff = typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null;
    state.gold = (diff && Number.isFinite(diff.startingGold)) ? diff.startingGold : 6;
  }
}

function clearFloorIntroAndModalLocks() {
  if (typeof activeFloorIntroTimers !== 'undefined' && Array.isArray(activeFloorIntroTimers)) {
    activeFloorIntroTimers.forEach((t) => clearTimeout(t));
    activeFloorIntroTimers.length = 0;
  }

  const introEl = document.getElementById('floor-intro-overlay');
  if (introEl) {
    introEl.classList.add('hidden');
    introEl.classList.remove('floor-intro-active', 'floor-intro-fadeout', 'act-curtain-mode');
    introEl.style.display = '';
    introEl.style.opacity = '';
    introEl.style.pointerEvents = '';
  }
  const actCurtainEl = document.getElementById('act-intro-curtain');
  if (actCurtainEl) {
    actCurtainEl.classList.add('hidden');
    actCurtainEl.classList.remove('act-curtain-visible', 'act-curtain-fadeout');
  }
  const introCardEl = document.getElementById('floor-intro-card');
  if (introCardEl) {
    introCardEl.classList.remove('hidden', 'floor-card-visible');
  }

  const gameOverEl = document.getElementById('gameover-modal');
  if (gameOverEl) {
    gameOverEl.classList.add('hidden');
    gameOverEl.style.display = '';
    gameOverEl.style.opacity = '';
    gameOverEl.style.pointerEvents = '';
  }

  if (typeof bgm !== 'undefined' && bgm) {
    bgm.isPausedForLevelIntro = false;
    bgm.isPausedForModal = false;
  }

  if (typeof state !== 'undefined' && state) {
    state.gameOver = false;
    state.busy = false;
    state.turn = PLAYER;
  }
}

// ============================================================================
// 0. FLOOR-START LOADOUT CHECKPOINT SYSTEM
// ============================================================================
function saveFloorStartCheckpoint() {
  if (typeof state === 'undefined') return;
  ensureValidGold();
  state.floorStartSnapshot = {
    floorIdx: state.floorIdx,
    loadoutId: state.loadoutId || 'spelunker',
    paradoxRoll: state.paradoxRoll ? JSON.parse(JSON.stringify(state.paradoxRoll)) : null,
    freeRerollsRemaining: state.freeRerollsRemaining || 0,
    gold: state.gold,
    maxMana: state.maxMana,
    handSize: state.handSize,
    maxGambitSlots: state.maxGambitSlots,
    persistentEnchantCount: state.persistentEnchantCount,
    reservePouchUnlocked: state.reservePouchUnlocked,
    unlockedShopTier: state.unlockedShopTier,
    highTierCardsUnlocked: state.highTierCardsUnlocked,
    masterDeck: Array.isArray(state.masterDeck) ? [...state.masterDeck] : [],
    reservePouch: Array.isArray(state.reservePouch) ? [...state.reservePouch] : [],
    gambits: Array.isArray(state.gambits) ? [...state.gambits] : [],
    nextFloorModifiers: state.nextFloorModifiers
      ? { ...state.nextFloorModifiers }
      : { bonusMana: 0, bonusStability: 0, bonusEnchantSlots: 0, caveInStones: 0, aiHeadstartTokens: 0 }
  };
}

function restoreFloorStartCheckpoint() {
  if (typeof state === 'undefined' || !state.floorStartSnapshot) return false;
  const snap = state.floorStartSnapshot;
  state.floorIdx = snap.floorIdx;
  if (snap.loadoutId) state.loadoutId = snap.loadoutId;
  if (snap.paradoxRoll) state.paradoxRoll = JSON.parse(JSON.stringify(snap.paradoxRoll));
  state.freeRerollsRemaining = snap.freeRerollsRemaining || 0;
  state.gold = Number.isFinite(snap.gold) ? snap.gold : 6;
  state.maxMana = snap.maxMana;
  state.handSize = snap.handSize;
  state.maxGambitSlots = snap.maxGambitSlots;
  state.persistentEnchantCount = snap.persistentEnchantCount;
  state.reservePouchUnlocked = snap.reservePouchUnlocked;
  state.unlockedShopTier = Number.isFinite(snap.unlockedShopTier) ? snap.unlockedShopTier : 1;
  state.highTierCardsUnlocked = snap.highTierCardsUnlocked;
  state.masterDeck = [...snap.masterDeck];
  state.reservePouch = [...snap.reservePouch];
  state.gambits = [...snap.gambits];
  state.nextFloorModifiers = { ...snap.nextFloorModifiers };
  return true;
}

(function hookStartFloorMatchForCheckpoints() {
  if (typeof window.startFloorMatch !== 'function' || window.startFloorMatch._checkpointHooked) return;
  const origStartFloorMatch = window.startFloorMatch;
  window.startFloorMatch = function (showIntro = true) {
    const introEl = document.getElementById('floor-intro-overlay');
    if (introEl) {
      introEl.style.display = '';
      introEl.style.opacity = '';
      introEl.style.pointerEvents = '';
    }

    if (state._isRetryingFloor) {
      restoreFloorStartCheckpoint();
      state._isRetryingFloor = false;
    }
    saveFloorStartCheckpoint();
    const res = origStartFloorMatch.call(this, showIntro);

    if (!showIntro && typeof state !== 'undefined' && state) {
      state.busy = false;
      state.gameOver = false;
      state.turn = PLAYER;
    }
    return res;
  };
  window.startFloorMatch._checkpointHooked = true;
})();

// ============================================================================
// 1. BINDING OF ISAAC-STYLE DELVER VESSEL & CAVERN DESCENT SELECTOR MODAL
// ============================================================================
function updateDifficultyUI() {
  if (typeof getActiveDifficulty !== 'function') return;
  const diff = getActiveDifficulty();
  const loadout = (typeof getActiveLoadout === 'function') ? getActiveLoadout() : null;

  const badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.innerHTML = diff.shortBadge;
    badge.className = `px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-tight border active:scale-95 transition flex items-center gap-1 ${diff.badgeClass}`;
  }

  const loadoutBadge = document.getElementById('loadout-badge');
  if (loadoutBadge && loadout) {
    loadoutBadge.innerHTML = `${loadout.icon}<span>${loadout.shortName}</span>`;
    loadoutBadge.className = `px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-tight border active:scale-95 transition flex items-center gap-1 ${loadout.badgeClass}`;
  }

  const settingsLbl = document.getElementById('settings-difficulty-label');
  if (settingsLbl) {
    const vesselPrefix = loadout ? `${loadout.numeral}. ${loadout.name} • ` : '';
    settingsLbl.innerHTML = `Active: ${vesselPrefix}${diff.fullBadge}`;
  }

  const rerollBtn = document.getElementById('reroll-shop-btn');
  if (rerollBtn) {
    const isFreeSpelunker = typeof state !== 'undefined' && state && state.loadoutId === 'spelunker' && (state.freeRerollsRemaining || 0) > 0;
    if (isFreeSpelunker) {
      rerollBtn.innerHTML = `${modalHudIcon('reroll.svg', 'c4-item-icon-sm')} Reroll (FREE!)`;
    } else {
      rerollBtn.innerHTML = `${modalHudIcon('reroll.svg', 'c4-item-icon-sm')} Reroll ($${diff.rerollCost || 4})`;
    }
  }
}

function renderIsaacStatPipBar(pips = 3, delta = 0) {
  const clamped = Math.max(1, Math.min(5, Math.round(pips)));
  const fillClass = delta > 0
    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
    : (delta < 0 ? 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.7)]' : 'bg-amber-400');
  let html = '<div class="flex items-center gap-0.5">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="w-2.5 h-1.5 md:w-3.5 md:h-2 rounded-sm ${i <= clamped ? fillClass : 'bg-stone-800 border border-white/10'}"></span>`;
  }
  html += '</div>';
  return html;
}

function formatStatDeltaBadge(delta, prefix = '', suffix = '') {
  if (!delta || delta === 0) {
    return `<span class="text-[8px] font-mono-code text-slate-400">BASE</span>`;
  }
  if (delta > 0) {
    return `<span class="px-1 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/40 text-[8px] font-mono-code font-bold text-emerald-300">▲ +${prefix}${delta}${suffix}</span>`;
  }
  return `<span class="px-1 py-0.2 rounded bg-rose-500/20 border border-rose-400/40 text-[8px] font-mono-code font-bold text-rose-300">▼ -${prefix}${Math.abs(delta)}${suffix}</span>`;
}

function groupIdsByCount(idList) {
  const map = new Map();
  if (!Array.isArray(idList)) return [];
  idList.forEach((id) => {
    map.set(id, (map.get(id) || 0) + 1);
  });
  return Array.from(map.entries()).map(([id, count]) => ({ id, count }));
}

function syncLoadoutViewModePill() {
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  const modeBtn = document.getElementById('loadout-view-mode-btn');
  if (modeBtn) {
    modeBtn.innerHTML = simp ? '🕯️ Simplified View: ON' : '📐 Detailed Math: ON';
    modeBtn.className = simp
      ? 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono-code font-bold text-emerald-200 active:scale-95 transition'
      : 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-code font-bold text-amber-200 active:scale-95 transition';
  }
  const bazModeBtn = document.getElementById('bazaar-view-mode-btn');
  if (bazModeBtn) {
    bazModeBtn.innerHTML = simp ? '🕯️ Lore' : '📐 Math';
    bazModeBtn.className = simp
      ? 'px-2 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono-code font-bold text-emerald-200 active:scale-95 transition'
      : 'px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-code font-bold text-amber-200 active:scale-95 transition';
  }
  const bossModeBtn = document.getElementById('boss-chest-view-mode-btn');
  if (bossModeBtn) {
    bossModeBtn.innerHTML = simp ? '🕯️ Lore' : '📐 Math';
    bossModeBtn.className = simp
      ? 'px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono-code font-bold text-emerald-200 active:scale-95 transition shrink-0'
      : 'px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-code font-bold text-amber-200 active:scale-95 transition shrink-0';
  }
  const introModeBtn = document.getElementById('floor-intro-view-mode-btn');
  if (introModeBtn) {
    introModeBtn.innerHTML = simp ? '🕯️ Lore' : '📐 Math';
    introModeBtn.className = simp
      ? 'px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono-code font-bold text-emerald-200 active:scale-95 transition shrink-0 pointer-events-auto'
      : 'px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-code font-bold text-amber-200 active:scale-95 transition shrink-0 pointer-events-auto';
  }
  if (typeof window._refreshActiveFloorIntroCard === 'function') {
    const introOverlay = document.getElementById('floor-intro-overlay');
    if (introOverlay && !introOverlay.classList.contains('hidden')) {
      window._refreshActiveFloorIntroCard();
    }
  }
  const roulLegend = document.getElementById('roulette-legend-section');
  if (roulLegend) {
    roulLegend.classList.toggle('hidden', simp);
  }
}

function renderLoadoutSelector() {
  if (typeof LOADOUT_CATALOG === 'undefined' || typeof getResolvedLoadoutKit !== 'function') return;
  const activeLoadoutId = (typeof getActiveLoadoutId === 'function') ? getActiveLoadoutId() : 'spelunker';
  const kit = getResolvedLoadoutKit(activeLoadoutId, state.difficulty);
  const loadout = kit.loadout;
  const diff = getActiveDifficulty();
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  syncLoadoutViewModePill();

  // 1. Render 6-Vessel Roster Strip
  const rosterEl = document.getElementById('loadout-roster-strip');
  if (rosterEl) {
    rosterEl.innerHTML = LOADOUT_ORDER.map((id) => {
      const entry = LOADOUT_CATALOG[id];
      if (!entry) return '';
      const isSelected = id === activeLoadoutId;
      return `
        <button type="button" data-loadout="${id}"
          class="loadout-roster-btn p-1.5 md:p-2 rounded-2xl border flex flex-col items-center justify-center gap-0.5 md:gap-1 transition-all active:scale-95 ${
            isSelected
              ? entry.pillActiveClass
              : 'border-white/10 bg-stone-900/80 text-slate-400 hover:border-white/25 hover:text-slate-200 opacity-80'
          }">
          <span class="text-lg md:text-2xl leading-none">${entry.icon}</span>
          <span class="text-[8px] font-display font-bold truncate max-w-full leading-tight">${entry.shortName}</span>
        </button>
      `;
    }).join('');

    rosterEl.querySelectorAll('.loadout-roster-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosenId = btn.getAttribute('data-loadout');
        if (chosenId) selectLoadoutArchetype(chosenId);
      });
    });
  }

  // 2. Render Selected Character Spotlight Sheet
  const spotlightEl = document.getElementById('loadout-spotlight-container');
  if (spotlightEl) {
    const displayGoldDelta = loadout.id === 'bastion' ? -(diff.startingGold || 3) : kit.goldOffset;

    if (simp) {
      // ======================================================================
      // SIMPLIFIED VIEW (ON BY DEFAULT):
      //   • Minimal header + 1-line flavor blurb (no extra info pills)
      //   • Just the 5-pip stat rating bars (no exact numbers or delta pills)
      //   • Starting loadout listed as JUST icons
      // ======================================================================
      const iconItems = [];

      kit.gambits.forEach((gId) => {
        const g = typeof GAMBIT_CATALOG !== 'undefined' ? GAMBIT_CATALOG[gId] : null;
        if (!g) return;
        const tip = `${g.name} — ${typeof getItemDesc === 'function' ? getItemDesc(g) : g.desc}`.replace(/"/g, '&quot;');
        iconItems.push({
          icon: g.icon,
          count: 1,
          borderClass: 'border-amber-400/50 bg-amber-950/40',
          tip
        });
      });

      groupIdsByCount(kit.reserves).forEach(({ id: rId, count }) => {
        const rTok = typeof RESERVE_CATALOG !== 'undefined' ? RESERVE_CATALOG[rId] : null;
        if (!rTok) return;
        const tip = `${rTok.name} — ${typeof getItemDesc === 'function' ? getItemDesc(rTok) : rTok.desc}`.replace(/"/g, '&quot;');
        iconItems.push({
          icon: rTok.icon,
          count,
          borderClass: 'border-rose-400/45 bg-rose-950/40',
          tip
        });
      });

      groupIdsByCount(kit.deck).forEach(({ id: cId, count }) => {
        const c = typeof CARD_CATALOG !== 'undefined' ? CARD_CATALOG[cId] : null;
        if (!c) return;
        const tip = `${c.name} — ${typeof getItemDesc === 'function' ? getItemDesc(c) : c.desc}`.replace(/"/g, '&quot;');
        iconItems.push({
          icon: c.icon,
          count,
          borderClass: 'border-teal-400/40 bg-teal-950/35',
          tip
        });
      });

      const iconsStripHtml = iconItems.map((it) => `
        <div class="relative w-9 h-9 md:w-11 md:h-11 rounded-xl border ${it.borderClass} flex items-center justify-center text-lg md:text-xl shadow-inner shrink-0" title="${it.tip}">
          <span>${it.icon}</span>
          ${it.count > 1 ? `<span class="absolute -bottom-1 -right-1 px-1 rounded-full bg-stone-950 border border-white/25 font-mono-code font-bold text-[8px] text-amber-200 leading-tight">×${it.count}</span>` : ''}
        </div>
      `).join('');

      spotlightEl.innerHTML = `
        <div class="p-3 sm:p-3.5 rounded-2xl bg-stone-950/90 border-2 ${loadout.cardBorderClass} space-y-2.5 transition-all">
          <!-- Minimal Character Header -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-stone-900 border border-white/15 flex items-center justify-center text-2xl md:text-3xl shrink-0 shadow-inner">
                ${loadout.icon}
              </div>
              <div class="min-w-0">
                <h3 class="font-display font-bold text-base sm:text-lg text-white leading-tight truncate">${loadout.name}</h3>
                <p class="text-[10px] text-slate-300 leading-snug mt-0.5">${loadout.loreSummary || loadout.lore}</p>
              </div>
            </div>
            ${kit.isParadox ? `
              <button type="button" id="reroll-paradox-seed-btn" class="p-2 rounded-xl bg-fuchsia-500/25 hover:bg-fuchsia-500/35 border border-fuchsia-300/60 text-fuchsia-100 text-xs active:scale-95 transition shrink-0" title="Reroll Anomaly Seed">
                🎲
              </button>
            ` : ''}
          </div>

          <!-- Pure Stat Rating Bars (No exact numbers or delta pills) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 px-2.5 py-2 rounded-xl bg-stone-900/75 border border-white/10">
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">🌋 Stability</span>
              ${renderIsaacStatPipBar(kit.statPips.stability, kit.stabilityOffset)}
            </div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">⚡ Mana</span>
              ${renderIsaacStatPipBar(kit.statPips.mana, kit.maxManaOffset)}
            </div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">🃏 Draw</span>
              ${renderIsaacStatPipBar(kit.statPips.hand, kit.handSizeOffset)}
            </div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">🪙 Wealth</span>
              ${renderIsaacStatPipBar(kit.statPips.gold, displayGoldDelta)}
            </div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">✨ Luck</span>
              ${renderIsaacStatPipBar(kit.statPips.luck, kit.extraEnchantSlots)}
            </div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="text-[9px] font-mono-code text-slate-300 flex items-center gap-1">🏺 Relics</span>
              ${renderIsaacStatPipBar(kit.statPips.relics, kit.startingGambitSlots - 1)}
            </div>
          </div>

          <!-- Starting Loadout: Listed as Just Icons -->
          <div class="flex items-center justify-between gap-2 pt-0.5">
            <span class="text-[9px] font-mono-code uppercase tracking-wider text-slate-400 shrink-0">Starting Loadout</span>
            <div class="flex items-center flex-wrap justify-end gap-1.5">
              ${iconsStripHtml}
            </div>
          </div>
        </div>
      `;
    } else {
      // ======================================================================
      // DETAILED MATH VIEW (WHEN SIMPLIFIED VIEW IS OFF)
      // ======================================================================
      const gambitsHtml = kit.gambits.length === 0
        ? `<span class="text-[9px] font-mono-code text-slate-400">None</span>`
        : kit.gambits.map((gId) => {
            const g = typeof GAMBIT_CATALOG !== 'undefined' ? GAMBIT_CATALOG[gId] : null;
            if (!g) return '';
            const isDiffBonus = gId === diff.starterGambitId && !(loadout.starterGambits || []).includes(gId);
            return `
              <div class="p-1.5 rounded-xl bg-stone-950/90 border border-amber-400/35 flex items-start gap-2">
                <span class="text-base shrink-0 mt-0.5">${g.icon}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-display font-bold text-[10px] text-amber-200">${g.name}</span>
                    <span class="px-1 py-0.1 rounded bg-amber-500/20 border border-amber-400/40 text-[8px] font-mono-code text-amber-300">T${g.tier || 1} Relic</span>
                    ${isDiffBonus ? `<span class="px-1 py-0.1 rounded bg-emerald-500/20 border border-emerald-400/40 text-[8px] font-mono-code text-emerald-300">Glowworm Bonus</span>` : ''}
                  </div>
                  <p class="text-[9px] text-slate-300 leading-tight mt-0.5">${g.desc}</p>
                </div>
              </div>
            `;
          }).join('');

      const groupedReserves = groupIdsByCount(kit.reserves);
      const reservesHtml = groupedReserves.length === 0
        ? `<span class="text-[9px] font-mono-code text-slate-400">Locked until Floor 3 Boss</span>`
        : groupedReserves.map(({ id: rId, count }) => {
            const rTok = typeof RESERVE_CATALOG !== 'undefined' ? RESERVE_CATALOG[rId] : null;
            if (!rTok) return '';
            return `
              <div class="px-2 py-1 rounded-xl bg-rose-950/45 border border-rose-400/35 flex items-center gap-1.5" title="${rTok.desc.replace(/"/g, '&quot;')}">
                <span class="text-sm shrink-0">${rTok.icon}</span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    <span class="font-display font-bold text-[10px] text-rose-100">${rTok.name}</span>
                    <span class="px-1.5 py-0.2 rounded-full bg-rose-500/30 border border-rose-300/50 font-mono-code font-bold text-[8px] text-rose-200">×${count}</span>
                  </div>
                  <div class="text-[8px] text-slate-300 leading-tight">${rTok.desc}</div>
                </div>
              </div>
            `;
          }).join('');

      const groupedDeck = groupIdsByCount(kit.deck);
      const deckHtml = groupedDeck.map(({ id: cId, count }) => {
        const c = typeof CARD_CATALOG !== 'undefined' ? CARD_CATALOG[cId] : null;
        if (!c) return '';
        const t = c.tier || 1;
        const tierClr = t >= 5
          ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/60'
          : t === 4
            ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
            : t === 3
              ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
              : (t === 2 ? 'bg-teal-500/25 text-teal-200 border-teal-400/40' : 'bg-amber-500/20 text-amber-200 border-amber-400/35');
        return `
          <div class="p-1.5 rounded-xl bg-stone-950/85 border border-teal-500/30 flex items-center justify-between gap-1.5" title="${c.desc.replace(/"/g, '&quot;')}">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-sm shrink-0">${c.icon}</span>
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <span class="font-display font-bold text-[10px] text-white truncate">${c.name}</span>
                  <span class="px-1 py-0.1 rounded text-[8px] font-mono-code font-bold bg-amber-400 text-stone-950 shrink-0">${c.cost}M</span>
                  <span class="px-1 py-0.1 rounded border text-[7px] font-mono-code font-bold ${tierClr} shrink-0">T${t}</span>
                </div>
                <div class="text-[8px] text-slate-300 truncate">${c.shortDesc}</div>
              </div>
            </div>
            <span class="px-1.5 py-0.5 rounded-lg bg-teal-500/20 border border-teal-400/40 font-mono-code font-bold text-[9px] text-teal-200 shrink-0">×${count}</span>
          </div>
        `;
      }).join('');

      const paradoxRerollHtml = kit.isParadox
        ? `
          <button type="button" id="reroll-paradox-seed-btn" class="px-2.5 py-1 rounded-xl bg-fuchsia-500/25 hover:bg-fuchsia-500/35 border border-fuchsia-300/60 text-fuchsia-100 font-mono-code font-bold text-[9px] active:scale-95 transition flex items-center gap-1 shrink-0 shadow-md">
            <span>🎲 Reroll Seed (${kit.seedCode})</span>
          </button>
        `
        : `
          <span class="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-[9px] font-mono-code text-slate-300 shrink-0">
            ${loadout.isaacArchetype}
          </span>
        `;

      spotlightEl.innerHTML = `
        <div class="p-3 sm:p-3.5 rounded-2xl bg-stone-950/90 border-2 ${loadout.cardBorderClass} space-y-2.5 transition-all">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-stone-900 border border-white/15 flex items-center justify-center text-2xl md:text-3xl shrink-0 shadow-inner">
                ${loadout.icon}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-mono-code uppercase tracking-widest text-amber-400 font-bold">VESSEL ${loadout.numeral}</span>
                  <span class="text-[9px] font-mono-code text-slate-400">• ${loadout.epithet}</span>
                </div>
                <h3 class="font-display font-bold text-base sm:text-lg text-white leading-tight truncate">${loadout.name}</h3>
              </div>
            </div>
            ${paradoxRerollHtml}
          </div>

          <p class="text-[10px] sm:text-[11px] text-slate-300 leading-relaxed">${loadout.lore}</p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-0.5">
            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">🌋 STABILITY</span>
                ${formatStatDeltaBadge(kit.stabilityOffset, '', 'T')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-orange-300">${kit.floor1Stability} Turns</span>
                ${renderIsaacStatPipBar(kit.statPips.stability, kit.stabilityOffset)}
              </div>
            </div>

            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">⚡ MAX MANA</span>
                ${formatStatDeltaBadge(kit.maxManaOffset, '', 'M')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-teal-300">${kit.startingMaxMana} Mana</span>
                ${renderIsaacStatPipBar(kit.statPips.mana, kit.maxManaOffset)}
              </div>
            </div>

            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">🃏 HAND SIZE</span>
                ${formatStatDeltaBadge(kit.handSizeOffset, '', '')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-purple-300">${kit.startingHandSize} Cards</span>
                ${renderIsaacStatPipBar(kit.statPips.hand, kit.handSizeOffset)}
              </div>
            </div>

            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">🪙 START GOLD</span>
                ${formatStatDeltaBadge(displayGoldDelta, '$', '')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-amber-300">$${kit.startingGold}</span>
                ${renderIsaacStatPipBar(kit.statPips.gold, displayGoldDelta)}
              </div>
            </div>

            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">✨ BOARD RINGS</span>
                ${formatStatDeltaBadge(kit.extraEnchantSlots, '', '/F')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-yellow-300">${kit.startingEnchantSlots} Slot${kit.startingEnchantSlots > 1 ? 's' : ''}</span>
                ${renderIsaacStatPipBar(kit.statPips.luck, kit.extraEnchantSlots)}
              </div>
            </div>

            <div class="p-2 rounded-xl bg-stone-900/90 border border-white/10 flex flex-col gap-1">
              <div class="flex items-center justify-between text-[9px] font-mono-code">
                <span class="text-slate-400 flex items-center gap-1">🏺 RELIC SLOTS</span>
                ${formatStatDeltaBadge(kit.startingGambitSlots - 1, '', '')}
              </div>
              <div class="flex items-center justify-between">
                <span class="font-mono-code font-bold text-xs text-emerald-300">${kit.startingGambitSlots} Slot${kit.startingGambitSlots > 1 ? 's' : ''}</span>
                ${renderIsaacStatPipBar(kit.statPips.relics, kit.startingGambitSlots - 1)}
              </div>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/65 via-stone-900/90 to-teal-950/65 border border-amber-400/40">
            <div class="flex items-center gap-1.5 text-[10px] font-mono-code font-bold text-amber-300">
              <span>${loadout.passiveIcon}</span>
              <span>INNATE VESSEL PASSIVE: ${loadout.passiveName.toUpperCase()}</span>
            </div>
            <p class="text-[10px] text-slate-200 leading-snug mt-0.5">${loadout.passiveDesc}</p>
          </div>

          <div class="space-y-2 pt-0.5">
            <div class="space-y-1">
              <span class="text-[9px] font-mono-code uppercase tracking-wider text-amber-300 font-bold block">Starting Gambit Relic(s) (${kit.gambits.length}/${kit.startingGambitSlots} Slots)</span>
              <div class="grid grid-cols-1 gap-1.5">${gambitsHtml}</div>
            </div>
            <div class="space-y-1">
              <span class="text-[9px] font-mono-code uppercase tracking-wider text-rose-300 font-bold block">Starting Tactical Reserve Pouch (${kit.reserves.length} Token${kit.reserves.length === 1 ? '' : 's'} • Unlocked F1)</span>
              <div class="flex flex-wrap gap-1.5">${reservesHtml}</div>
            </div>
            <div class="space-y-1">
              <span class="text-[9px] font-mono-code uppercase tracking-wider text-teal-300 font-bold block">Starting Arcane Card Stockpile (${kit.deck.length} Cards)</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${deckHtml}</div>
            </div>
          </div>
        </div>
      `;
    }

    document.getElementById('reroll-paradox-seed-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof rollParadoxLoadoutSeed === 'function') {
        rollParadoxLoadoutSeed();
      }
      sfx.playDiceClatter(true);
      triggerHaptic([20, 25]);
      renderLoadoutSelector();
      renderDifficultyCards();
    });
  }

  // 3. Update Launch CTA Button
  const launchBtn = document.getElementById('confirm-loadout-start-btn');
  if (launchBtn) {
    launchBtn.innerHTML = simp
      ? `<span>⚔️ Begin Descent as ${loadout.name} →</span>`
      : `<span>⚔️ Descend as ${loadout.numeral}. ${loadout.name} (${diff.name}) →</span>`;
  }
}

function selectLoadoutArchetype(loadoutId, playSound = true) {
  if (typeof LOADOUT_CATALOG === 'undefined' || !LOADOUT_CATALOG[loadoutId]) return;
  state.loadoutId = loadoutId;
  try {
    if (typeof LOADOUT_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(LOADOUT_STORAGE_KEY, state.loadoutId);
    }
  } catch (_) {}
  if (loadoutId === 'paradox' && typeof getActiveParadoxRoll === 'function') {
    getActiveParadoxRoll();
  }
  if (playSound && typeof sfx !== 'undefined' && sfx) {
    sfx.playHoverTick();
    if (typeof triggerHaptic === 'function') triggerHaptic(15);
  }
  renderLoadoutSelector();
  renderDifficultyCards();
}

function cycleLoadoutSelection(delta) {
  if (typeof LOADOUT_ORDER === 'undefined' || !Array.isArray(LOADOUT_ORDER)) return;
  const curId = (typeof getActiveLoadoutId === 'function') ? getActiveLoadoutId() : 'spelunker';
  const curIdx = Math.max(0, LOADOUT_ORDER.indexOf(curId));
  const nextIdx = (curIdx + delta + LOADOUT_ORDER.length) % LOADOUT_ORDER.length;
  selectLoadoutArchetype(LOADOUT_ORDER[nextIdx], true);
}

function renderDifficultyCards() {
  const container = document.getElementById('difficulty-cards-container');
  if (!container || typeof DIFFICULTY_TIERS === 'undefined') return;
  const activeLoadoutId = (typeof getActiveLoadoutId === 'function') ? getActiveLoadoutId() : 'spelunker';
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;

  container.innerHTML = Object.values(DIFFICULTY_TIERS).map((tier) => {
    const isSelected = state.difficulty === tier.id;

    if (simp) {
      // SIMPLIFIED VIEW: Just title + one-line flavor blurb (zero stat/info pills!)
      return `
        <button type="button" data-tier="${tier.id}"
          class="diff-select-card w-full text-left px-3 py-2 rounded-2xl border transition-all active:scale-[0.98] ${tier.cardClass} ${isSelected ? 'ring-2 ring-amber-300/90 shadow-md' : 'opacity-75 hover:opacity-100'}">
          <div class="flex items-center justify-between gap-2">
            <span class="font-display font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">${tier.fullBadge}</span>
            ${isSelected ? `<span class="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_#fde047] shrink-0"></span>` : ''}
          </div>
          <p class="text-[10px] text-slate-300 mt-0.5 leading-snug truncate">${tier.loreDescription || tier.description}</p>
        </button>
      `;
    }

    const tierKit = (typeof getResolvedLoadoutKit === 'function')
      ? getResolvedLoadoutKit(activeLoadoutId, tier.id)
      : {
          startingGold: tier.startingGold,
          startingMaxMana: tier.startingMaxMana,
          startingHandSize: tier.startingHandSize,
          floor1Stability: 15 + (tier.stabilityOffset || 0)
        };

    return `
      <button type="button" data-tier="${tier.id}"
        class="diff-select-card w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all active:scale-[0.98] ${tier.cardClass} ${isSelected ? 'ring-2 ring-amber-300/90 shadow-lg' : 'opacity-80 hover:opacity-100'}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-display font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">${tier.fullBadge}</span>
          <span class="px-2 py-0.5 rounded-lg text-[9px] font-mono-code font-bold ${
            isSelected ? 'bg-amber-400 text-stone-950' : 'bg-black/40 text-slate-300 border border-white/10'
          }">${isSelected ? '✓ Selected Tier' : tier.subtitle}</span>
        </div>
        <p class="text-[10px] text-slate-200/90 mt-1 leading-snug">${tier.description}</p>
        <div class="flex flex-wrap gap-1.5 mt-2 text-[9px] font-mono-code text-amber-200">
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('coin.svg', 'c4-item-icon-sm')} $${tierKit.startingGold} Start</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('mana.svg', 'c4-item-icon-sm')} ${tierKit.startingMaxMana}M (${tier.manaRateLabel})</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('cards.svg', 'c4-item-icon-sm')} ${tierKit.startingHandSize} Hand (${tier.drawRateLabel})</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('stability.svg', 'c4-item-icon-sm')} ${tierKit.floor1Stability} F1 Stab</span>
        </div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.diff-select-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tierId = btn.getAttribute('data-tier');
      if (!tierId || !DIFFICULTY_TIERS[tierId]) return;
      if (state.difficulty !== tierId) {
        state.difficulty = tierId;
        try {
          if (typeof DIFFICULTY_STORAGE_KEY !== 'undefined') {
            localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty);
          }
        } catch (_) {}
        sfx.playHoverTick();
        renderLoadoutSelector();
        renderDifficultyCards();
      } else {
        selectDifficultyAndStart(tierId, state.loadoutId);
      }
    });
  });
}

function openDifficultyModal(allowCancel = false) {
  if (typeof bgm !== 'undefined' && bgm) {
    if (!allowCancel) {
      bgm.isPausedForLevelIntro = false;
      bgm.isPausedForModal = false;
    }
    if (typeof bgm.setMode === 'function') {
      bgm.setMode('cavern');
    }
  }
  renderLoadoutSelector();
  renderDifficultyCards();
  const cancelBtn = document.getElementById('cancel-difficulty-modal-btn');
  if (cancelBtn) {
    cancelBtn.classList.toggle('hidden', !allowCancel);
  }
  const diffModal = document.getElementById('difficulty-modal');
  if (diffModal) {
    diffModal.style.display = '';
    diffModal.style.opacity = '';
    diffModal.style.pointerEvents = '';
    diffModal.classList.remove('hidden');
  }
}

function selectDifficultyAndStart(tierId = state.difficulty, loadoutId = state.loadoutId) {
  state.difficulty = (typeof DIFFICULTY_TIERS !== 'undefined' && DIFFICULTY_TIERS[tierId]) ? tierId : 'MEDIUM';
  if (typeof LOADOUT_CATALOG !== 'undefined' && loadoutId && LOADOUT_CATALOG[loadoutId]) {
    state.loadoutId = loadoutId;
  }
  try {
    if (typeof DIFFICULTY_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty);
    }
    if (typeof LOADOUT_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(LOADOUT_STORAGE_KEY, state.loadoutId);
    }
  } catch (_) {}
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.clearSavedRun();
  }
  document.getElementById('difficulty-modal')?.classList.add('hidden');
  clearFloorIntroAndModalLocks();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  if (typeof bgm !== 'undefined' && bgm) {
    bgm.hasStartedAfterDifficulty = true;
    bgm.isPausedForModal = false;
  }
  initNewRun();
  startFloorMatch(true);
  const diff = getActiveDifficulty();
  const vessel = (typeof getActiveLoadout === 'function') ? getActiveLoadout() : null;
  const vesselLabel = vessel ? `${vessel.name} • ` : '';
  showToast(`Descent Begun: ${vesselLabel}${diff.fullBadge}`, vessel ? vessel.icon : modalHudIcon('mountain.svg'), 4500);
}

document.getElementById('loadout-prev-btn')?.addEventListener('click', () => cycleLoadoutSelection(-1));
document.getElementById('loadout-next-btn')?.addEventListener('click', () => cycleLoadoutSelection(1));
document.getElementById('loadout-random-btn')?.addEventListener('click', () => {
  if (typeof LOADOUT_ORDER === 'undefined') return;
  const pick = LOADOUT_ORDER[Math.floor(Math.random() * LOADOUT_ORDER.length)];
  if (pick === 'paradox' && typeof rollParadoxLoadoutSeed === 'function') {
    rollParadoxLoadoutSeed();
  }
  sfx.playDiceClatter(true);
  selectLoadoutArchetype(pick, false);
});
document.getElementById('confirm-loadout-start-btn')?.addEventListener('click', () => {
  sfx.playCardChime();
  triggerHaptic([20, 30]);
  selectDifficultyAndStart(state.difficulty, state.loadoutId);
});

window.addEventListener('keydown', (e) => {
  const diffModal = document.getElementById('difficulty-modal');
  if (!diffModal || diffModal.classList.contains('hidden')) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    cycleLoadoutSelection(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    cycleLoadoutSelection(1);
  }
});

document.getElementById('loadout-badge')?.addEventListener('click', () => {
  sfx.playHoverTick();
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('difficulty-badge')?.addEventListener('click', () => {
  sfx.playHoverTick();
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('cancel-difficulty-modal-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('difficulty-modal')?.classList.add('hidden');
  if (typeof bgm !== 'undefined' && bgm) {
    const fIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 0;
    const isBoss = typeof isBossFloorIndex === 'function' ? isBossFloorIndex(fIdx) : ((fIdx + 1) % 3 === 0);
    const bossActIdx = Math.floor(fIdx / 3);
    const bossBgmModes = ['boss1', 'boss2', 'boss3', 'boss4', 'boss5'];
    bgm.setMode(isBoss ? (bossBgmModes[Math.min(4, bossActIdx)] || 'boss1') : 'cavern');
    bgm.resumeFromSettings();
  }
});

// ============================================================================
// 2. INSPECTOR SHEET MODAL (GAMBITS, BOSS INFO, STABILITY, MILESTONES & SLOTS)
// ============================================================================
let activeInspectedGambitId = null;

function showInfoSheetModal({ icon, category, title, descHtml, statusText, sellableGambitId = null }) {
  activeInspectedGambitId = sellableGambitId;
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');
  const sellBtn = document.getElementById('sell-gambit-btn');

  if (iconEl) iconEl.innerHTML = icon;
  if (catEl) catEl.textContent = category;
  if (titleEl) titleEl.innerHTML = title;
  if (descEl) descEl.innerHTML = descHtml;
  if (statusEl) statusEl.textContent = statusText;
  if (sellBtn) {
    const canSell = !!(sellableGambitId && !state.busy && !(typeof window !== 'undefined' && window.tutorialActive));
    sellBtn.classList.toggle('hidden', !canSell);
  }
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
}

function openGambitSheet(gambitId) {
  const g = GAMBIT_CATALOG[gambitId];
  if (!g) return;
  const isSpentCat = gambitId === 'obsidian_cat' && state.catNineLivesUsed;
  showInfoSheetModal({
    icon: g.icon,
    category: `Tier ${g.tier || 1} Synergistic Gambit`,
    title: g.name,
    descHtml: `<p>${typeof getItemDesc === 'function' ? getItemDesc(g) : g.desc}</p>`,
    statusText: isSpentCat ? 'Nine Lives Used This Floor (Resets Next Floor)' : 'Status: Active Relic',
    sellableGambitId: state.gambits.includes(gambitId) ? gambitId : null
  });
}

document.getElementById('sell-gambit-btn')?.addEventListener('click', () => {
  if (!activeInspectedGambitId || !state.gambits.includes(activeInspectedGambitId)) return;
  const g = GAMBIT_CATALOG[activeInspectedGambitId];
  state.gambits = state.gambits.filter((id) => id !== activeInspectedGambitId);
  state.gold += 3;
  activeInspectedGambitId = null;
  sfx.playCoinDing();
  document.getElementById('info-sheet-modal')?.classList.add('hidden');
  showToast(`Sold ${g ? g.name : 'Gambit'} for +$3 Gold!`, modalHudIcon('coin.svg'));
  updateHUD();
});

document.getElementById('boss-info-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  const floorData = getFloorConfig(state.floorIdx);
  const topo = state.currentTopology || getFloorTopology(state.floorIdx);
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  const bossRuleText = simp && floorData.isBoss && floorData.bossArchetype && floorData.bossArchetype.loreRule
    ? `${floorData.bossArchetype.loreRule} Score a Connect-4 to shatter each Boss HP heart!`
    : (simp && !floorData.isBoss
      ? (floorData.isPreBoss
        ? 'An elite vanguard guarding the Boss chamber on a warped cavern board.'
        : 'A subterranean sentinel guarding an open 7x6 grid. Connect 4 before the ceiling collapses!')
      : floorData.fullRule);
  const topoText = simp && topo.loreDesc ? topo.loreDesc : topo.desc;
  showInfoSheetModal({
    icon: floorData.isBoss && floorData.bossArchetype ? floorData.bossArchetype.icon : topo.icon,
    category: `Floor ${floorData.floor} of ${TOTAL_FLOORS} • ${topo.name}`,
    title: floorData.boss,
    descHtml: `
      <p>${bossRuleText}</p>
      <p class="text-amber-300/90 mt-1.5"><strong>Cavern Shape (${topo.name}):</strong> ${topoText}</p>
    `,
    statusText: floorData.isBoss
      ? `Boss Hearts: ${state.bossHp}/${state.bossMaxHp}`
      : (simp ? `Floor ${floorData.floor} Guardian` : `AI Solver Depth D${floorData.depth} (${floorData.aiPrecisionPct}% Precision)`)
  });
});

document.getElementById('stability-info-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  showInfoSheetModal({
    icon: modalHudIcon('stability.svg'),
    category: 'Cavern Anti-Stall Mechanic & Speed Bounty',
    title: 'Seismic Stability Timer',
    descHtml: `
      <p>Every AI turn reduces <strong>Seismic Stability</strong> by <strong>1</strong>. If Stability reaches <strong>0</strong>, the cavern ceiling shakes and drops a neutral <strong>Petrified Stone Blocker</strong> into a random column every turn!</p>
      <p class="text-emerald-300 mt-1.5"><strong>Speed Victory Bonus:</strong> Winning a floor awards <strong>+$1 Bonus Gold</strong> for every point of Seismic Stability remaining!</p>
    `,
    statusText: `Current Stability: ${state.stability} Turns (+$${Math.max(0, state.stability)} Speed Bonus)`
  });
});

document.getElementById('milestone-info-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  showInfoSheetModal({
    icon: modalHudIcon('trophy.svg'),
    category: '15-Floor / 5-Act Ascension Progression',
    title: 'Boss Milestone Power Spikes',
    descHtml: `
      <p><strong>Floor 3 Boss Clear (Act I):</strong> Unlocks <strong>Tier 2 Shop Wares</strong>, +1 Max Mana, +1 Hand Size, Reserve Pouch (+1 Heavy Anvil), &amp; 1 free Boss Relic.</p>
      <p><strong>Floor 6 Boss Clear (Act II):</strong> Unlocks <strong>Tier 3 Shop Wares</strong>, +1 Max Mana, +1 Hand Size, +1 Brood Spider Egg Token, expands to 3 Relic Slots, &amp; 1 free Boss Relic.</p>
      <p><strong>Floor 9 Boss Clear (Act III):</strong> Unlocks <strong>Tier 4 Shop Wares</strong>, +1 Max Mana, +1 Dwarven Nitro Cask, expands to 4 Relic Slots, &amp; 1 free Boss Relic.</p>
      <p><strong>Floor 12 Boss Clear (Act IV • 4❤️):</strong> Unlocks <strong>Tier 5 Sovereign Wares</strong>, +1 Max Mana, +1 Golden Midas Eye, expands to 5 Relic Slots, &amp; 1 free Boss Relic.</p>
      <p><strong>Floor 15 Final Boss Clear (Act V • 5❤️ 4-Board Tesseract):</strong> Complete Subterranean Ascension Mastery!</p>
    `,
    statusText: `Current Progress: Floor ${state.floorIdx + 1} of ${TOTAL_FLOORS} (Shop Tier ${getMaxAllowedShopTier()}/5)`
  });
});

document.getElementById('legend-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  showInfoSheetModal({
    icon: modalHudIcon('sparkle.svg'),
    category: 'Board Ring Legend',
    title: 'Enchanted Cavern Slots',
    descHtml: simp
      ? `
        <p><strong class="text-yellow-300">🟡 Gilded Ring:</strong> Mints a handful of bonus gold coins when claimed.</p>
        <p><strong class="text-rose-300">🔴 Volatile Spice Ring:</strong> Sparks mana and scorches a neighboring rival piece.</p>
        <p><strong class="text-sky-300">🔵 Wild Amplifier Ring:</strong> Transmutes the landed piece into a shared Wild gem.</p>
        <p><strong class="text-purple-300">🟣 Spider Web Ring:</strong> Traps a rival piece in stone, or steadies the roof for you.</p>
        <p><strong class="text-lime-300">🟢 Cursed Spore:</strong> Siphons your mana—or turns your piece to stone if you are dry.</p>
      `
      : `
        <p><strong class="text-yellow-300">🟡 Gilded Slot:</strong> Grants <strong>+$3 Bonus Gold</strong> when your token lands inside.</p>
        <p><strong class="text-rose-300">🔴 Volatile Spice Slot:</strong> Grants <strong>+1 Mana</strong> and shatters 1 orthogonally adjacent AI token.</p>
        <p><strong class="text-sky-300">🔵 Wild Amplifier Slot:</strong> Upgrades the token into a <strong>Wild Prismatic Token</strong> (+$2 Gold for you).</p>
        <p><strong class="text-purple-300">🟣 Spider Web Slot:</strong> Petrifies an AI token into neutral Stone, or grants you <strong>+1 Stability</strong>.</p>
        <p><strong class="text-lime-300">🟢 Cursed Spore (Boss):</strong> Drains 1 Mana or calcifies your token into Stone if at 0 Mana.</p>
      `,
    statusText: `${state.persistentEnchantCount} Base Enchanted Ring(s) Per Floor`
  });
});

document.getElementById('close-info-sheet')?.addEventListener('click', () => {
  document.getElementById('info-sheet-modal')?.classList.add('hidden');
});

document.getElementById('info-sheet-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'info-sheet-modal') {
    document.getElementById('info-sheet-modal')?.classList.add('hidden');
  }
});

// ============================================================================
// 3. BOSS VICTORY CHEST, UNDERGROUND BAZAAR ECONOMY & ROULETTE CONTROLS
// ============================================================================

// Clear Item Type Pill Badges & Row Accents for Shop & Boss Reward Screens
function getItemCategoryIndicatorBadge(itemType) {
  if (itemType === 'card') {
    return `<span class="px-1.5 py-0.5 rounded-md bg-sky-500/25 border border-sky-400/60 text-[8px] font-mono-code font-bold uppercase tracking-wider text-sky-200 shrink-0">🃏 CARD</span>`;
  }
  if (itemType === 'reserve') {
    return `<span class="px-1.5 py-0.5 rounded-md bg-teal-500/25 border border-teal-400/60 text-[8px] font-mono-code font-bold uppercase tracking-wider text-teal-200 shrink-0">🪙 TOKEN</span>`;
  }
  if (itemType === 'unlock_pouch') {
    return `<span class="px-1.5 py-0.5 rounded-md bg-teal-500/25 border border-teal-400/60 text-[8px] font-mono-code font-bold uppercase tracking-wider text-teal-200 shrink-0">🎒 POUCH + 2 TOKENS</span>`;
  }
  if (itemType === 'gambit') {
    return `<span class="px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/60 text-[8px] font-mono-code font-bold uppercase tracking-wider text-amber-200 shrink-0">🏺 RELIC</span>`;
  }
  return `<span class="px-1.5 py-0.5 rounded-md bg-purple-500/25 border border-purple-400/60 text-[8px] font-mono-code font-bold uppercase tracking-wider text-purple-200 shrink-0">⚡ UPGRADE</span>`;
}

function getItemRowAccentClass(itemType) {
  if (itemType === 'card') return 'border-l-4 border-l-sky-400/80';
  if (itemType === 'reserve' || itemType === 'unlock_pouch') return 'border-l-4 border-l-teal-400/80';
  if (itemType === 'gambit') return 'border-l-4 border-l-amber-400/85';
  return 'border-l-4 border-l-purple-400/80';
}

function renderBossChestEquippedGambits() {
  const slotsLabel = document.getElementById('boss-chest-sockets-label');
  const hintLabel = document.getElementById('boss-chest-sockets-hint');
  const strip = document.getElementById('boss-chest-equipped-gambits');
  if (!strip || !slotsLabel) return;

  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  const isFull = state.gambits.length >= state.maxGambitSlots;

  slotsLabel.textContent = simp
    ? `Relic Sockets (${state.gambits.length}/${state.maxGambitSlots})`
    : `Equipped Gambit Relics (${state.gambits.length}/${state.maxGambitSlots} Sockets)`;

  if (hintLabel) {
    hintLabel.textContent = isFull
      ? (simp ? 'Sockets Full • Tap Relic Below to Trade' : 'Sockets Full — Pick a Boss Relic below to trade out an equipped Relic')
      : (simp ? 'Open Socket Ready' : 'Open Socket Available — Claim 1 Free Boss Relic');
    hintLabel.className = isFull
      ? 'text-[9px] font-mono-code font-bold text-amber-300'
      : 'text-[9px] font-mono-code text-emerald-300';
  }

  strip.innerHTML = '';

  if (simp) {
    for (let i = 0; i < state.maxGambitSlots; i++) {
      const gId = state.gambits[i];
      const g = gId ? GAMBIT_CATALOG[gId] : null;
      if (g) {
        const badge = document.createElement('div');
        badge.title = `${g.name}: ${g.shopWhisper || g.loreDesc || g.desc}`;
        badge.className = 'relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/15 border border-amber-400/45 flex items-center justify-center text-lg md:text-xl shrink-0';
        badge.innerHTML = `<span>${g.icon}</span>`;
        strip.appendChild(badge);
      } else {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'w-9 h-9 md:w-10 md:h-10 rounded-xl border border-dashed border-emerald-400/40 bg-emerald-950/25 flex items-center justify-center text-[10px] text-emerald-300/80 shrink-0';
        emptySlot.textContent = '+';
        strip.appendChild(emptySlot);
      }
    }
    return;
  }

  if (state.gambits.length === 0) {
    strip.innerHTML = '<span class="text-[10px] font-mono-code text-slate-400">No Relics equipped yet</span>';
    return;
  }

  state.gambits.forEach((gId) => {
    const g = GAMBIT_CATALOG[gId];
    if (!g) return;
    const pill = document.createElement('div');
    pill.className = 'px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center gap-1.5 shrink-0';
    pill.innerHTML = `
      <span class="text-xs">${g.icon}</span>
      <span class="text-[10px] font-medium text-amber-100">${g.name}</span>
      <span class="px-1 py-0.2 rounded bg-amber-500/25 text-[7px] font-mono-code font-bold text-amber-200 uppercase">Relic</span>
    `;
    strip.appendChild(pill);
  });
}

function openBossRelicSwapPrompt(newRelicId) {
  const newRelic = GAMBIT_CATALOG[newRelicId];
  if (!newRelic) return;
  state.pendingBossSwapRelicId = newRelicId;

  const promptEl = document.getElementById('boss-relic-swap-prompt');
  const optionsEl = document.getElementById('boss-swap-options');
  const titleEl = document.getElementById('boss-swap-title');
  const descEl = document.getElementById('boss-swap-desc');
  if (!promptEl || !optionsEl) return;

  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;

  if (titleEl) {
    titleEl.innerHTML = simp
      ? `Swap in ${newRelic.icon} ${newRelic.name}`
      : `Relic Sockets Full (${state.gambits.length}/${state.maxGambitSlots}) — Swap in ${newRelic.icon} ${newRelic.name}`;
  }
  if (descEl) {
    descEl.textContent = simp
      ? 'Tap one of your current Relics below to trade it out for this Boss Relic:'
      : `Choose which currently equipped Relic to trade out and replace with ${newRelic.name}:`;
  }

  optionsEl.innerHTML = '';

  state.gambits.forEach((equippedId, replaceIdx) => {
    const eq = GAMBIT_CATALOG[equippedId];
    if (!eq) return;
    const subText = simp
      ? (eq.shopWhisper || eq.loreDesc || eq.desc)
      : eq.desc;

    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'p-2.5 rounded-xl border border-amber-400/55 bg-stone-900/95 hover:bg-stone-800/95 flex items-center justify-between gap-2.5 text-left text-xs text-amber-100 active:scale-98 transition';
    swapBtn.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-lg shrink-0">${eq.icon}</span>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-display font-bold text-xs text-white truncate">Trade ${eq.name}</span>
            ${getItemCategoryIndicatorBadge('gambit')}
          </div>
          <p class="text-[10px] text-slate-300 leading-tight truncate mt-0.5">${subText}</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        ${simp ? 'Swap ↻' : 'Replace ↻'}
      </span>
    `;
    swapBtn.addEventListener('click', () => {
      state.gambits[replaceIdx] = newRelicId;
      state.pendingBossSwapRelicId = null;
      promptEl.classList.add('hidden');
      sfx.playCardChime();
      document.getElementById('boss-chest-modal')?.classList.add('hidden');
      showToast(`Traded ${eq.name} for Boss Relic: ${newRelic.name}!`, newRelic.icon);
      openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
    });
    optionsEl.appendChild(swapBtn);
  });

  promptEl.classList.remove('hidden');
}

function renderBossVictoryChest() {
  const milestoneBox = document.getElementById('boss-milestone-box');
  const subtitleEl = document.getElementById('boss-chest-subtitle');
  const titleEl = document.getElementById('boss-chest-title');
  const draftLabelEl = document.getElementById('boss-relic-draft-label');
  const skipBtnEl = document.getElementById('skip-boss-relic-btn');
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  if (typeof syncLoadoutViewModePill === 'function') syncLoadoutViewModePill();

  const isSocketsFull = state.gambits.length >= state.maxGambitSlots;

  if (subtitleEl) {
    subtitleEl.textContent = simp
      ? 'Boss Vanquished • Vessel Empowered'
      : 'Boss Vanquished • Ascension Milestone!';
  }
  if (titleEl) {
    titleEl.textContent = simp
      ? 'Boss Spoils & Relic Chest'
      : 'Ascension Power Spike Unlocked';
  }
  if (draftLabelEl) {
    draftLabelEl.textContent = isSocketsFull
      ? (simp ? 'Sockets Full — Tap a Boss Relic to Swap' : 'Relic Sockets Full — Pick 1 Boss Relic to Trade Out (Or Salvage +$8)')
      : (simp ? 'Pick 1 Free Boss Relic' : 'Draft 1 Free Boss Gambit Relic (Or Claim +$8 Gold)');
  }
  if (skipBtnEl) {
    skipBtnEl.textContent = simp
      ? '🪙 Salvage Chest (+$8 Gold) →'
      : 'Salvage Chest for +$8 Gold & Enter Bazaar →';
  }

  const mFloor = typeof state.lastBossMilestoneFloorIdx === 'number' ? state.lastBossMilestoneFloorIdx : state.floorIdx;

  if (milestoneBox) {
    if (mFloor === 2) {
      milestoneBox.innerHTML = simp
        ? `
          <div class="text-center space-y-1.5">
            <div class="text-[10px] text-emerald-200">“The Vitreous Catacombs unsealed.” Vessel upgrades &amp; bonus token granted:</div>
            <div class="flex items-center justify-center flex-wrap gap-1.5 pt-0.5 text-[10px] font-mono-code font-bold text-amber-200">
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🛒 Tier 2 Shop</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">⚡ +1 Mana</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🃏 +1 Card Draw</span>
              <span class="px-2 py-0.5 rounded-lg bg-teal-500/25 border border-teal-400/50 text-teal-200">🪙 TOKEN: +1 Heavy Anvil</span>
              <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/45 text-amber-200">🏺 ${state.maxGambitSlots} Relic Sockets</span>
            </div>
          </div>
        `
        : `
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 2 Shop Wares Unlocked:</strong> Tier 2 Cards, Tokens &amp; Relics now in stock</div>
          <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
          <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
          <div class="flex items-center gap-1.5 flex-wrap">${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Reserve Pouch Unlocked:</strong> +1 Free <strong>Heavy Anvil</strong> ${getItemCategoryIndicatorBadge('reserve')}</div>
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Relic Capacity:</strong> Up to <strong>${state.maxGambitSlots} Relic Sockets</strong></div>
        `;
    } else if (mFloor === 5) {
      milestoneBox.innerHTML = simp
        ? `
          <div class="text-center space-y-1.5">
            <div class="text-[10px] text-emerald-200">“The Brimstone Caldera breached.” Vessel upgrades &amp; bonus token granted:</div>
            <div class="flex items-center justify-center flex-wrap gap-1.5 pt-0.5 text-[10px] font-mono-code font-bold text-amber-200">
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🛒 Tier 3 Shop</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">⚡ +1 Mana</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🃏 +1 Card Draw</span>
              <span class="px-2 py-0.5 rounded-lg bg-teal-500/25 border border-teal-400/50 text-teal-200">🪙 TOKEN: +1 Spider Egg</span>
              <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/45 text-amber-200">🏺 ${state.maxGambitSlots} Relic Sockets</span>
            </div>
          </div>
        `
        : `
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 3 Shop Wares Unlocked:</strong> Tier 3 Cards, Tokens &amp; Relics now in stock</div>
          <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
          <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
          <div class="flex items-center gap-1.5 flex-wrap">${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Trap-Layer Token Granted:</strong> +1 Free <strong>Brood Spider Egg</strong> ${getItemCategoryIndicatorBadge('reserve')}</div>
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Relic Capacity:</strong> Up to <strong>${state.maxGambitSlots} Relic Sockets</strong></div>
        `;
    } else if (mFloor === 8) {
      milestoneBox.innerHTML = simp
        ? `
          <div class="text-center space-y-1.5">
            <div class="text-[10px] text-cyan-200">“The Horizon Fault opened.” Vessel upgrades &amp; bonus token granted:</div>
            <div class="flex items-center justify-center flex-wrap gap-1.5 pt-0.5 text-[10px] font-mono-code font-bold text-amber-200">
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🛒 Tier 4 Shop</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">⚡ +1 Mana</span>
              <span class="px-2 py-0.5 rounded-lg bg-teal-500/25 border border-teal-400/50 text-teal-200">🪙 TOKEN: +1 Nitro Cask</span>
              <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/45 text-amber-200">🏺 ${state.maxGambitSlots} Relic Sockets</span>
            </div>
          </div>
        `
        : `
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 4 Shop Wares Unlocked:</strong> Tier 4 Singularity Cards, Tokens &amp; Relics now in stock</div>
          <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
          <div class="flex items-center gap-1.5 flex-wrap">${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Demolition Token Granted:</strong> +1 Free <strong>Dwarven Nitro Cask</strong> ${getItemCategoryIndicatorBadge('reserve')}</div>
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Relic Capacity:</strong> Up to <strong>${state.maxGambitSlots} Relic Sockets</strong></div>
        `;
    } else {
      milestoneBox.innerHTML = simp
        ? `
          <div class="text-center space-y-1.5">
            <div class="text-[10px] text-fuchsia-200">“The Fourfold Sanctum approached.” Apex upgrades &amp; bonus token granted:</div>
            <div class="flex items-center justify-center flex-wrap gap-1.5 pt-0.5 text-[10px] font-mono-code font-bold text-amber-200">
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🛒 Tier 5 Shop</span>
              <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">⚡ +1 Mana</span>
              <span class="px-2 py-0.5 rounded-lg bg-teal-500/25 border border-teal-400/50 text-teal-200">🪙 TOKEN: +1 Midas Eye</span>
              <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/45 text-amber-200">🏺 ${state.maxGambitSlots} Relic Sockets</span>
            </div>
          </div>
        `
        : `
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 5 Sovereign Wares Unlocked:</strong> Tier 5 Apex Cards, Tokens &amp; Relics now in stock</div>
          <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
          <div class="flex items-center gap-1.5 flex-wrap">${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Sovereign Token Granted:</strong> +1 Free <strong>Golden Midas Eye</strong> ${getItemCategoryIndicatorBadge('reserve')}</div>
          <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Maximum Relic Capacity:</strong> All <strong>${state.maxGambitSlots} Relic Sockets</strong> Unlocked</div>
        `;
    }
  }

  renderBossChestEquippedGambits();

  const choicesEl = document.getElementById('boss-relic-choices');
  if (choicesEl) {
    choicesEl.innerHTML = '';
    const unowned = Array.isArray(state.bossRelicChoices) ? state.bossRelicChoices : [];

    unowned.forEach((gId) => {
      const g = GAMBIT_CATALOG[gId];
      if (!g) return;
      const t = getExplicitItemTier(g, 2);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `arcane-card ${getItemRowAccentClass('gambit')} p-2.5 rounded-2xl flex items-center justify-between gap-3 text-left active:scale-98 transition`;
      const whisperText = simp
        ? (g.shopWhisper || g.loreDesc || g.desc)
        : g.desc;
      const tierBadge = simp
        ? ''
        : `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
            t >= 5
              ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/60'
              : t === 4
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                : t === 3
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                  : (t === 2 ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40' : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
          }">T${t}</span>`;
      const actionLabel = isSocketsFull
        ? (simp ? 'Swap ↻' : 'Swap Relic')
        : (simp ? 'Claim' : 'Claim Free');

      btn.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-2xl shrink-0">${g.icon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-display font-bold text-xs text-white truncate">${g.name}</span>
              ${getItemCategoryIndicatorBadge('gambit')}
              ${tierBadge}
            </div>
            <p class="text-[10px] text-slate-300 leading-snug mt-0.5">${whisperText}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-xl ${
          isSocketsFull ? 'bg-amber-500/25 border border-amber-400/60 text-amber-200' : 'bg-amber-400 text-stone-950'
        } font-mono-code font-bold text-[10px] shrink-0">${actionLabel}</span>
      `;
      btn.addEventListener('click', () => {
        if (state.gambits.length >= state.maxGambitSlots) {
          sfx.playHoverTick();
          openBossRelicSwapPrompt(gId);
          return;
        }
        state.gambits.push(gId);
        state.pendingBossSwapRelicId = null;
        document.getElementById('boss-relic-swap-prompt')?.classList.add('hidden');
        sfx.playCardChime();
        document.getElementById('boss-chest-modal')?.classList.add('hidden');
        showToast(`Claimed Boss Relic: ${g.name}!`, g.icon);
        openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
      });
      choicesEl.appendChild(btn);
    });
  }

  // If the swap prompt was already open when toggling Simple Mode, refresh its text too
  const swapPromptEl = document.getElementById('boss-relic-swap-prompt');
  if (swapPromptEl && !swapPromptEl.classList.contains('hidden') && state.pendingBossSwapRelicId) {
    openBossRelicSwapPrompt(state.pendingBossSwapRelicId);
  }
}

function openBossVictoryChest(floorData) {
  state.lastBossMilestoneFloorIdx = state.floorIdx;
  state.pendingBossSwapRelicId = null;
  document.getElementById('boss-relic-swap-prompt')?.classList.add('hidden');

  if (state.floorIdx === 2) {
    state.unlockedShopTier = Math.max(state.unlockedShopTier || 1, 2);
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.max(state.maxGambitSlots, 2);
    state.reservePouchUnlocked = true;
    state.reservePouch.push('anvil');
  } else if (state.floorIdx === 5) {
    state.unlockedShopTier = Math.max(state.unlockedShopTier || 1, 3);
    state.highTierCardsUnlocked = true;
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.min(5, Math.max(state.maxGambitSlots, 3));
    state.reservePouch.push('parasite_egg');
  } else if (state.floorIdx === 8) {
    state.unlockedShopTier = Math.max(state.unlockedShopTier || 1, 4);
    state.highTierCardsUnlocked = true;
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.maxGambitSlots = Math.min(5, Math.max(state.maxGambitSlots, 4));
    state.reservePouch.push('powder_keg');
  } else {
    state.unlockedShopTier = 5;
    state.highTierCardsUnlocked = true;
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.maxGambitSlots = 5;
    state.reservePouch.push('midas_eye');
  }

  const maxTier = getMaxAllowedShopTier();
  const eligibleIds = Object.keys(GAMBIT_CATALOG)
    .filter((id) => !state.gambits.includes(id) && getExplicitItemTier(GAMBIT_CATALOG[id], 1) <= maxTier);
  const topTierPool = eligibleIds
    .filter((id) => getExplicitItemTier(GAMBIT_CATALOG[id], 1) === maxTier)
    .sort(() => Math.random() - 0.5);
  const lowerTierPool = eligibleIds
    .filter((id) => getExplicitItemTier(GAMBIT_CATALOG[id], 1) < maxTier)
    .sort(() => Math.random() - 0.5);
  state.bossRelicChoices = [...topTierPool, ...lowerTierPool].slice(0, 3);

  renderBossVictoryChest();
  updateHUD();
  document.getElementById('boss-chest-modal')?.classList.remove('hidden');
}

function renderBazaarEquippedGambits() {
  const slotsLabel = document.getElementById('bazaar-gambit-slots-label');
  const expandBtn = document.getElementById('bazaar-expand-slot-btn');
  const strip = document.getElementById('bazaar-equipped-gambits');
  if (!strip || !slotsLabel) return;
  ensureValidGold();
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
  const activeShopTier = typeof getMaxAllowedShopTier === 'function' ? getMaxAllowedShopTier() : 1;

  slotsLabel.textContent = simp
    ? 'Relic Sockets'
    : `Shop Tier ${activeShopTier}/5 • Equipped Gambits (${state.gambits.length}/${state.maxGambitSlots} Slots)`;

  if (expandBtn) {
    if (state.maxGambitSlots >= 5) {
      expandBtn.textContent = 'Max Sockets';
      expandBtn.className = 'px-2 py-0.5 rounded-lg bg-stone-800 text-slate-500 font-mono-code text-[9px] pointer-events-none';
    } else {
      const sCost = getActiveDifficulty().slotExpandCost || 8;
      const canExpand = state.gold >= sCost;
      expandBtn.textContent = `+Socket ($${sCost})`;
      expandBtn.className = `px-2 py-0.5 rounded-lg border font-mono-code text-[9px] font-bold active:scale-95 ${
        canExpand
          ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
          : 'bg-stone-800/70 border-white/10 text-slate-400'
      }`;
    }
  }

  strip.innerHTML = '';

  if (simp) {
    // SIMPLIFIED VIEW: Render equipped Relics as just icons + empty socket outlines (tap icon to sell for +$3)
    for (let i = 0; i < state.maxGambitSlots; i++) {
      const gId = state.gambits[i];
      const g = gId ? GAMBIT_CATALOG[gId] : null;
      if (g) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = `${g.name} — Tap to sell for +$3 Gold`;
        btn.className = 'relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/15 border border-amber-400/45 flex items-center justify-center text-lg md:text-xl shrink-0 active:scale-95 transition';
        btn.innerHTML = `
          <span>${g.icon}</span>
          <span class="absolute -bottom-1 -right-1 px-1 rounded-full bg-rose-950 border border-rose-400/60 font-mono-code font-bold text-[7px] text-rose-200 leading-tight">+$3</span>
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          ensureValidGold();
          state.gambits = state.gambits.filter((id) => id !== gId);
          state.gold += 3;
          sfx.playCoinDing();
          showToast(`Sold ${g.name} (+$3)`, modalHudIcon('coin.svg'));
          document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
          renderBazaarStock();
          updateHUD();
        });
        strip.appendChild(btn);
      } else {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'w-9 h-9 md:w-10 md:h-10 rounded-xl border border-dashed border-white/15 bg-stone-950/50 flex items-center justify-center text-[10px] text-slate-600 shrink-0';
        emptySlot.textContent = '○';
        strip.appendChild(emptySlot);
      }
    }
    return;
  }

  if (state.gambits.length === 0) {
    strip.innerHTML = '<span class="text-[10px] font-mono-code text-slate-400">No Gambits equipped</span>';
    return;
  }

  state.gambits.forEach((gId) => {
    const g = GAMBIT_CATALOG[gId];
    if (!g) return;
    const pill = document.createElement('div');
    pill.className = 'px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center gap-1.5 shrink-0';
    pill.innerHTML = `
      <span class="text-xs">${g.icon}</span>
      <span class="text-[10px] font-medium text-amber-100">${g.name.split(' ')[0]}</span>
      <button type="button" class="px-1.5 py-0.5 rounded bg-rose-500/30 border border-rose-400/40 text-[9px] font-mono-code font-bold text-rose-200 active:scale-95">Sell +$3</button>
    `;
    pill.querySelector('button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      ensureValidGold();
      state.gambits = state.gambits.filter((id) => id !== gId);
      state.gold += 3;
      sfx.playCoinDing();
      showToast(`Sold ${g.name} for +$3 Gold!`, modalHudIcon('coin.svg'));
      document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
      renderBazaarStock();
      updateHUD();
    });
    strip.appendChild(pill);
  });
}

function openBazaarGambitSwapPrompt(shopIdx) {
  const item = state.shopItems[shopIdx];
  if (!item || item.bought) return;
  const promptEl = document.getElementById('bazaar-swap-prompt');
  const optionsEl = document.getElementById('bazaar-swap-options');
  const titleEl = document.getElementById('bazaar-swap-title');
  const descEl = document.getElementById('bazaar-swap-desc');
  if (!promptEl || !optionsEl) return;
  ensureValidGold();
  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;

  if (titleEl) {
    titleEl.innerHTML = `Equip ${item.icon} ${item.cleanName || item.name} ($${item.price})`;
  }
  if (descEl) {
    descEl.textContent = simp
      ? 'Sockets full—trade in an equipped relic (+$3) or carve a new socket:'
      : `Your Gambit slots are full (${state.gambits.length}/${state.maxGambitSlots}). Swap out an equipped Gambit (adds +$3 resale value toward this purchase!) or expand your slots:`;
  }

  optionsEl.innerHTML = '';

  if (state.maxGambitSlots < 5) {
    const slotPrice = getActiveDifficulty().slotExpandCost || 8;
    const bundleCost = item.price + slotPrice;
    const canAffordBundle = state.gold >= bundleCost;
    const bundleBtn = document.createElement('button');
    bundleBtn.type = 'button';
    bundleBtn.className = `p-2 rounded-xl border flex items-center justify-between text-left text-xs transition ${
      canAffordBundle
        ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-100 active:scale-98'
        : 'bg-stone-900/40 border-white/10 text-slate-400 opacity-60'
    }`;
    bundleBtn.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span>${modalHudIcon('chest.svg', 'c4-item-icon-sm')}</span>
        <span class="truncate">+1 Socket &amp; Equip Both</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-emerald-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        $${bundleCost}
      </span>
    `;
    bundleBtn.addEventListener('click', () => {
      if (!canAffordBundle) {
        showToast(`Need $${bundleCost} Gold!`, modalHudIcon('coin.svg'));
        return;
      }
      state.gold -= bundleCost;
      state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
      state.gambits.push(item.id);
      item.bought = true;
      promptEl.classList.add('hidden');
      sfx.playCoinDing();
      showToast(`Expanded Sockets & equipped ${item.cleanName || item.name}!`, item.icon);
      renderBazaarStock();
      updateHUD();
    });
    optionsEl.appendChild(bundleBtn);
  }

  state.gambits.forEach((gId) => {
    const g = GAMBIT_CATALOG[gId];
    if (!g) return;
    const netCost = Math.max(0, item.price - 3);
    const canAffordSwap = (state.gold + 3) >= item.price;
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = `p-2 rounded-xl border flex items-center justify-between text-left text-xs transition ${
      canAffordSwap
        ? 'bg-stone-900/90 border-amber-400/50 text-amber-100 active:scale-98'
        : 'bg-stone-900/40 border-white/10 text-slate-400 opacity-60'
    }`;
    swapBtn.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span>🔄</span>
        <span class="truncate">Trade <strong>${g.icon} ${g.name}</strong></span>
      </div>
      <span class="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">$${netCost}</span>
    `;
    swapBtn.addEventListener('click', () => {
      if (!canAffordSwap) {
        showToast(`Need $${netCost} Gold after trade-in!`, modalHudIcon('coin.svg'));
        return;
      }
      state.gold = state.gold + 3 - item.price;
      const replaceIdx = state.gambits.indexOf(gId);
      if (replaceIdx !== -1) state.gambits[replaceIdx] = item.id;
      else state.gambits.push(item.id);
      item.bought = true;
      promptEl.classList.add('hidden');
      sfx.playCoinDing();
      showToast(`Swapped ${g.name} for ${item.cleanName || item.name}!`, item.icon);
      renderBazaarStock();
      updateHUD();
    });
    optionsEl.appendChild(swapBtn);
  });

  promptEl.classList.remove('hidden');
}

function renderBazaarStock() {
  ensureValidGold();
  const listEl = document.getElementById('bazaar-items-list');
  const goldDisp = document.getElementById('bazaar-gold-display');
  if (goldDisp) goldDisp.textContent = `$${state.gold}`;
  if (typeof syncLoadoutViewModePill === 'function') syncLoadoutViewModePill();
  renderBazaarEquippedGambits();

  const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;

  // Update Bazaar Payout & Roulette banners based on Simplified View
  const payoutLbl = document.getElementById('bazaar-payout-label');
  const payoutEl = document.getElementById('bazaar-payout-amount');
  if (payoutEl && state.pendingVictoryPayout) {
    const floorData = getFloorConfig(state.floorIdx);
    const baseReward = floorData.isBoss ? 7 : 3;
    const totalEarned = state.pendingVictoryPayout.totalEarned || baseReward;
    const speedBonus = state.pendingVictoryPayout.speedBonus || 0;
    if (payoutLbl) {
      payoutLbl.textContent = simp ? 'Floor Bounty:' : 'Floor Clear + Stability Speed Bonus:';
    }
    payoutEl.textContent = simp
      ? `+$${totalEarned}`
      : `+$${totalEarned} ($${baseReward} Base + $${speedBonus} Speed)`;
  }

  const riskBadge = document.getElementById('roulette-risk-badge');
  if (riskBadge) riskBadge.classList.toggle('hidden', simp);

  const summaryEl = document.getElementById('roulette-bazaar-summary');
  if (summaryEl) {
    summaryEl.textContent = simp
      ? '“Tempt the wheel for blessings or curses.”'
      : 'Spin the physics roulette wheel for Jackpots, Relics & Mana—or risk Curses, Gremlins & Cave-Ins!';
  }

  if (!listEl) return;

  listEl.innerHTML = '';
  state.shopItems.forEach((item, idx) => {
    const isUnavailable = !!item.bought;
    const isGambitFull = item.type === 'gambit' && state.gambits.length >= state.maxGambitSlots;
    const canAffordDirect = state.gold >= item.price && !isUnavailable;
    const canAffordTradeIn = isGambitFull && (state.gold + 3) >= item.price && !isUnavailable;
    const isInteractive = !isUnavailable && (canAffordDirect || canAffordTradeIn);

    let badgeLabel = `$${item.price}`;
    if (item.bought) {
      badgeLabel = 'SOLD';
    } else if (isGambitFull && !simp) {
      badgeLabel = canAffordDirect ? `$${item.price} (Swap/Slot)` : `Swap ($${Math.max(0, item.price - 3)})`;
    } else if (isGambitFull && simp) {
      badgeLabel = canAffordDirect ? `$${item.price}` : `$${Math.max(0, item.price - 3)}↻`;
    }

    const row = document.createElement('button');
    row.type = 'button';
    row.style.position = 'relative';
    row.style.zIndex = '2';
    row.style.pointerEvents = isUnavailable ? 'none' : 'auto';

    const displayName = item.cleanName || item.name.replace(/^Card:\s*/i, '');
    const typeBadgeHtml = getItemCategoryIndicatorBadge(item.type);
    const rowAccentCls = getItemRowAccentClass(item.type);

    if (simp) {
      // SIMPLIFIED VIEW: Clean icon + item name + clear Card/Token/Relic/Upgrade badge + one-line whisper + price tag
      const catEntry = (typeof CARD_CATALOG !== 'undefined' && CARD_CATALOG[item.id])
        || (typeof RESERVE_CATALOG !== 'undefined' && RESERVE_CATALOG[item.id])
        || (typeof GAMBIT_CATALOG !== 'undefined' && GAMBIT_CATALOG[item.id])
        || null;
      const fallbackQuotes = {
        early_pouch: '“Packrat’s side-satchel.”',
        slot_plus: '“Hollowed obsidian socket.”',
        enchant_plus: '“Glowing mineral seam.”'
      };
      const whisper = item.shopWhisper
        || (catEntry && catEntry.shopWhisper)
        || fallbackQuotes[item.id]
        || item.loreDesc
        || item.desc;
      const spanCls = (idx === state.shopItems.length - 1 && state.shopItems.length % 2 === 1) ? "md:col-span-2" : "";
      row.className = `arcane-card ${rowAccentCls} ${spanCls} px-3 py-2.5 rounded-2xl flex items-center justify-between gap-2.5 text-left transition ${
        isUnavailable ? 'opacity-35' : (isInteractive ? 'active:scale-98' : 'opacity-60')
      }`;
      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl shrink-0">${item.icon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-display font-bold text-xs text-white truncate">${displayName}</span>
              ${typeBadgeHtml}
            </div>
            <p class="text-[10px] text-slate-300 leading-tight truncate mt-0.5">${whisper}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-xl font-mono-code font-bold text-[10px] shrink-0 ${
          item.bought
            ? 'bg-stone-800 text-slate-400'
            : (isInteractive ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-rose-300 border border-rose-400/30')
        }">
          ${badgeLabel}
        </span>
      `;
    } else {
      const t = item.tier || 1;
      const tierBadgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
        t >= 5
          ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/60'
          : t === 4
            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
            : t === 3
              ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
              : (t === 2 ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40' : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
      }">T${t}</span>`;

      const spanCls = (idx === state.shopItems.length - 1 && state.shopItems.length % 2 === 1) ? "md:col-span-2" : "";
      row.className = `arcane-card ${rowAccentCls} ${spanCls} p-2.5 md:p-3 rounded-2xl flex items-center justify-between gap-2.5 text-left transition ${
        isUnavailable ? 'opacity-40' : (isInteractive ? 'active:scale-98' : 'opacity-65')
      }`;
      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl shrink-0">${item.icon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-display font-bold text-xs text-white truncate">${displayName}</span>
              ${typeBadgeHtml}
              ${tierBadgeHtml}
            </div>
            <p class="text-[10px] text-slate-300 leading-snug mt-0.5">${item.desc}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-xl font-mono-code font-bold text-[10px] shrink-0 ${
          item.bought
            ? 'bg-stone-800 text-slate-400'
            : (isInteractive ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-rose-300 border border-rose-400/30')
        }">
          ${badgeLabel}
        </span>
      `;
    }

    row.addEventListener('click', () => buyBazaarItem(idx));
    listEl.appendChild(row);
  });
}

function generateBazaarStock() {
  const items = [];
  updateDifficultyUI();

  const maxTier = getMaxAllowedShopTier();
  const isTierAllowed = (tier) => tier >= 1 && tier <= maxTier;

  const pickTieredId = (catalog, filterFn, defaultTier = 1, preferMaxTierWeight = 0.68) => {
    const allAllowed = Object.keys(catalog).filter((id) => {
      const entry = catalog[id];
      const t = getExplicitItemTier(entry, defaultTier);
      return isTierAllowed(t) && filterFn(id, entry, t);
    });
    if (allAllowed.length === 0) return null;

    const topTierMatches = allAllowed.filter((id) => getExplicitItemTier(catalog[id], defaultTier) === maxTier);
    const pool = (topTierMatches.length > 0 && Math.random() < preferMaxTierWeight) ? topTierMatches : allAllowed;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Slot 1: Primary Arcane Card (excludes starterOnly cards: pebble & oracle_peek)
  let primaryCardId = pickTieredId(
    CARD_CATALOG,
    (id, c, t) => t > 0 && !c.starterOnly && !isStackableCurseCard(id) && !playerOwnsCard(id),
    1,
    0.72
  );
  if (!primaryCardId) {
    primaryCardId = pickTieredId(
      CARD_CATALOG,
      (id, c, t) => t > 0 && !c.starterOnly && !isStackableCurseCard(id),
      1,
      0.72
    );
  }
  if (primaryCardId) {
    const card = CARD_CATALOG[primaryCardId];
    items.push({
      type: 'card',
      id: card.id,
      tier: getExplicitItemTier(card, 1),
      name: `Card: ${card.name}`,
      cleanName: card.name,
      icon: card.icon,
      desc: card.desc,
      loreDesc: card.loreDesc || card.desc,
      shopWhisper: card.shopWhisper || card.loreDesc || card.desc,
      price: getScaledPrice(card.price),
      bought: false
    });
  }

  // Slot 2: Secondary Arcane Card (excludes starterOnly cards: pebble & oracle_peek)
  let secondaryCardId = pickTieredId(
    CARD_CATALOG,
    (id, c, t) => t > 0 && !c.starterOnly && !isStackableCurseCard(id) && id !== primaryCardId && !playerOwnsCard(id),
    1,
    0.45
  );
  if (!secondaryCardId) {
    secondaryCardId = pickTieredId(
      CARD_CATALOG,
      (id, c, t) => t > 0 && !c.starterOnly && !isStackableCurseCard(id) && id !== primaryCardId,
      1,
      0.45
    );
  }
  if (secondaryCardId) {
    const card2 = CARD_CATALOG[secondaryCardId];
    items.push({
      type: 'card',
      id: card2.id,
      tier: getExplicitItemTier(card2, 1),
      name: `Card: ${card2.name}`,
      cleanName: card2.name,
      icon: card2.icon,
      desc: card2.desc,
      loreDesc: card2.loreDesc || card2.desc,
      shopWhisper: card2.shopWhisper || card2.loreDesc || card2.desc,
      price: getScaledPrice(card2.price),
      bought: false
    });
  }

  // Slot 3: Tactical Reserve Token or Early Pouch Unlock
  if (state.reservePouchUnlocked || state.floorIdx >= 1) {
    const rId = pickTieredId(RESERVE_CATALOG, () => true, 1, 0.65);
    if (rId) {
      const rTok = RESERVE_CATALOG[rId];
      items.push({
        type: 'reserve',
        id: rTok.id,
        tier: getExplicitItemTier(rTok, 1),
        name: rTok.name,
        cleanName: rTok.name,
        icon: rTok.icon,
        desc: rTok.desc,
        loreDesc: rTok.loreDesc || rTok.desc,
        shopWhisper: rTok.shopWhisper || rTok.loreDesc || rTok.desc,
        price: getScaledPrice(rTok.price),
        bought: false
      });
    }
  } else {
    items.push({
      type: 'unlock_pouch',
      id: 'early_pouch',
      tier: 1,
      name: "Early Reserve Pouch + Fool's Penny",
      cleanName: "Packrat's Reserve Satchel",
      icon: '🎒',
      desc: "Unlock the Tactical Reserve Token Pouch early and receive +1 Heavy Anvil & +1 Fool's Counterfeit Penny!",
      loreDesc: '“Packrat’s satchel.” Unlocks your side-pouch early, stuffed with an Anvil and a Counterfeit Penny.',
      shopWhisper: '“Packrat’s side-satchel.”',
      price: getScaledPrice(7),
      bought: false
    });
  }

  // Slot 4: Synergistic Gambit Relic
  const chosenGambitId = pickTieredId(
    GAMBIT_CATALOG,
    (id) => !state.gambits.includes(id),
    1,
    0.70
  );
  if (chosenGambitId) {
    const g = GAMBIT_CATALOG[chosenGambitId];
    items.push({
      type: 'gambit',
      id: g.id,
      tier: getExplicitItemTier(g, 1),
      name: g.name,
      cleanName: g.name,
      icon: g.icon,
      desc: g.desc,
      loreDesc: g.loreDesc || g.desc,
      shopWhisper: g.shopWhisper || g.loreDesc || g.desc,
      price: getScaledPrice(g.price),
      bought: false
    });
  } else {
    const extraReserveId = pickTieredId(RESERVE_CATALOG, (id) => !items.some((it) => it.id === id), 1, 0.65);
    if (extraReserveId) {
      const rTok = RESERVE_CATALOG[extraReserveId];
      items.push({
        type: 'reserve',
        id: rTok.id,
        tier: getExplicitItemTier(rTok, 1),
        name: rTok.name,
        cleanName: rTok.name,
        icon: rTok.icon,
        desc: rTok.desc,
        loreDesc: rTok.loreDesc || rTok.desc,
        shopWhisper: rTok.shopWhisper || rTok.loreDesc || rTok.desc,
        price: getScaledPrice(rTok.price),
        bought: false
      });
    }
  }

  // Slot 5: Permanent Vessel / Cavern Upgrade
  if (state.maxGambitSlots < 5 && state.floorIdx >= 1) {
    items.push({
      type: 'gambit_slot_upgrade',
      id: 'slot_plus',
      tier: Math.min(2, maxTier),
      name: 'Carved Relic Socket (+1 Gambit Slot)',
      cleanName: 'Carved Relic Socket',
      icon: '🏺',
      desc: `Permanently expands your active Gambit Relic capacity from ${state.maxGambitSlots} to ${state.maxGambitSlots + 1} slots!`,
      loreDesc: '“Hollowed obsidian socket.” Carves room to carry one additional Gambit Relic at a time.',
      shopWhisper: '“Hollowed obsidian socket.”',
      price: getScaledPrice(6),
      bought: false
    });
  } else {
    items.push({
      type: 'enchant_upgrade',
      id: 'enchant_plus',
      tier: 1,
      name: 'Enchanted Cavern Vein (+2 Board Rings)',
      cleanName: 'Enchanted Cavern Vein',
      icon: '✨',
      desc: 'Permanently spawns +2 extra Enchanted Slots on every future floor board!',
      loreDesc: '“Glowing mineral seam.” Enriches every future cavern board with extra enchanted rings.',
      shopWhisper: '“Glowing mineral seam.”',
      price: getScaledPrice(5),
      bought: false
    });
  }

  state.shopItems = items;
  renderBazaarStock();
}

function buyBazaarItem(idx) {
  ensureValidGold();
  const item = state.shopItems[idx];
  if (!item || item.bought) return;
  if (item.type === 'gambit' && state.gambits.length >= state.maxGambitSlots) {
    openBazaarGambitSwapPrompt(idx);
    return;
  }
  if (state.gold < item.price) {
    showToast(`Need $${item.price} Gold to buy ${item.cleanName || item.name}!`, modalHudIcon('coin.svg'));
    return;
  }
  if (item.type === 'gambit') {
    state.gambits.push(item.id);
  } else if (item.type === 'reserve') {
    state.reservePouchUnlocked = true;
    state.reservePouch.push(item.id);
  } else if (item.type === 'unlock_pouch') {
    state.reservePouchUnlocked = true;
    state.reservePouch.push('anvil', 'fools_penny');
  } else if (item.type === 'gambit_slot_upgrade') {
    state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
  } else if (item.type === 'enchant_upgrade') {
    state.persistentEnchantCount = Math.min(14, state.persistentEnchantCount + 2);
  } else if (item.type === 'card') {
    addCardToStockpile(item.id);
  }
  state.gold -= item.price;
  item.bought = true;
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
  sfx.playCoinDing();
  showToast(`Purchased ${item.cleanName || item.name}!`, item.icon);
  renderBazaarStock();
  updateHUD();
}

function openUndergroundBazaar(totalEarned, speedBonus) {
  ensureValidGold();
  state.rouletteSpinsThisFloor = 0;
  state.pendingVictoryPayout = { totalEarned, speedBonus };
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
  updateRouletteButtonsUI();
  generateBazaarStock();
  document.getElementById('bazaar-modal')?.classList.remove('hidden');
}

function closeRouletteModal() {
  if (typeof rouletteSim !== 'undefined' && rouletteSim && rouletteSim.isSpinning) {
    showToast('Wait for the silver ball to settle into a pocket!', modalHudIcon('wheel.svg'));
    return;
  }
  document.getElementById('roulette-modal')?.classList.add('hidden');
  renderBazaarStock();
  updateHUD();
}

document.getElementById('open-roulette-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  updateRouletteButtonsUI();
  document.getElementById('roulette-modal')?.classList.remove('hidden');
});

document.getElementById('close-roulette-btn')?.addEventListener('click', closeRouletteModal);
document.getElementById('done-roulette-btn')?.addEventListener('click', closeRouletteModal);

document.getElementById('reroll-shop-btn')?.addEventListener('click', () => {
  ensureValidGold();
  const isFreeSpelunker = state.loadoutId === 'spelunker' && (state.freeRerollsRemaining || 0) > 0;
  const cost = isFreeSpelunker ? 0 : (getActiveDifficulty().rerollCost || 4);
  if (state.gold < cost) {
    showToast(`Need $${cost} Gold to reroll!`, modalHudIcon('coin.svg'));
    return;
  }
  state.gold -= cost;
  if (isFreeSpelunker) {
    state.freeRerollsRemaining = Math.max(0, (state.freeRerollsRemaining || 0) - 1);
  }
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
  sfx.playHoverTick();
  generateBazaarStock();
  updateHUD();
  showToast(
    isFreeSpelunker
      ? "🧭 Explorer's Equilibrium: Used Free Act Bazaar Reroll!"
      : 'Rerolled Underground Bazaar stock!',
    modalHudIcon('reroll.svg')
  );
});

document.getElementById('bazaar-expand-slot-btn')?.addEventListener('click', () => {
  ensureValidGold();
  if (state.maxGambitSlots >= 5) {
    showToast('Already at maximum 5 Gambit Slots!', modalHudIcon('chest.svg'));
    return;
  }
  const slotCost = getActiveDifficulty().slotExpandCost || 8;
  if (state.gold < slotCost) {
    showToast(`Need $${slotCost} Gold to unlock +1 Gambit Slot!`, modalHudIcon('coin.svg'));
    return;
  }
  state.gold -= slotCost;
  state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
  sfx.playCoinDing();
  showToast(`Unlocked +1 Gambit Slot (${state.maxGambitSlots} total)!`, modalHudIcon('chest.svg'));
  renderBazaarStock();
  updateHUD();
});

document.getElementById('bazaar-swap-cancel')?.addEventListener('click', () => {
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
});

document.getElementById('boss-swap-cancel')?.addEventListener('click', () => {
  state.pendingBossSwapRelicId = null;
  document.getElementById('boss-relic-swap-prompt')?.classList.add('hidden');
});

document.getElementById('next-floor-btn')?.addEventListener('click', () => {
  document.getElementById('bazaar-modal')?.classList.add('hidden');
  clearFloorIntroAndModalLocks();
  state.floorIdx = Math.min(TOTAL_FLOORS - 1, state.floorIdx + 1);
  startFloorMatch(true);
});

document.getElementById('skip-boss-relic-btn')?.addEventListener('click', () => {
  state.gold += 8;
  sfx.playCoinDing();
  document.getElementById('boss-chest-modal')?.classList.add('hidden');
  showToast('Salvaged Boss Chest for +$8 Gold!', modalHudIcon('coin.svg'));
  openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
});

// ============================================================================
// 4. GAME OVER / RUN VICTORY MODAL
// ============================================================================
function showGameOverModal(isWin, heading, body) {
  const emojiEl = document.getElementById('gameover-emoji');
  const tagEl = document.getElementById('gameover-tag');
  const headingEl = document.getElementById('gameover-heading');
  const bodyEl = document.getElementById('gameover-body');
  const modalEl = document.getElementById('gameover-modal');

  if (emojiEl) emojiEl.textContent = isWin ? '🏆' : '💀';
  if (tagEl) tagEl.textContent = isWin ? 'ASCENSION COMPLETE' : `FLOOR ${state.floorIdx + 1} DEFEAT`;
  if (headingEl) headingEl.textContent = heading;
  if (bodyEl) bodyEl.textContent = body;
  if (modalEl) {
    modalEl.style.display = '';
    modalEl.style.opacity = '';
    modalEl.style.pointerEvents = '';
    modalEl.classList.remove('hidden');
  }
}

document.getElementById('retry-floor-btn')?.addEventListener('click', () => {
  clearFloorIntroAndModalLocks();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  state._isRetryingFloor = true;
  startFloorMatch(true);
});

document.getElementById('new-ascension-btn')?.addEventListener('click', () => {
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.clearSavedRun();
  }
  clearFloorIntroAndModalLocks();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  state._isRetryingFloor = false;
  openDifficultyModal(false);
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.clearSavedRun();
  }
  clearFloorIntroAndModalLocks();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  state._isRetryingFloor = false;
  initNewRun();
  startFloorMatch(true);
});

// ============================================================================
// 5. SUBTERRANEAN SETTINGS MODAL & FULLSCREEN DISPLAY LOGIC
// ============================================================================
function styleTogglePill(btnEl, isEnabled) {
  if (!btnEl) return;
  btnEl.textContent = isEnabled ? 'ON' : 'OFF';
  btnEl.className = isEnabled
    ? 'px-3 py-1.5 rounded-xl font-mono-code font-bold text-[11px] shrink-0 active:scale-95 transition bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 shadow-inner'
    : 'px-3 py-1.5 rounded-xl font-mono-code font-bold text-[11px] shrink-0 active:scale-95 transition bg-stone-800 border border-white/10 text-slate-400';
}

function isFullscreenActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function syncFullscreenUI() {
  const fsBtn = document.getElementById('toggle-fullscreen-btn');
  if (fsBtn) styleTogglePill(fsBtn, isFullscreenActive());
}

function toggleFullScreenCavernMode() {
  const docEl = document.documentElement;
  if (!isFullscreenActive()) {
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    if (req) Promise.resolve(req.call(docEl)).catch(() => {}).then(syncFullscreenUI);
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) Promise.resolve(exit.call(document)).catch(() => {}).then(syncFullscreenUI);
  }
}

document.addEventListener('fullscreenchange', syncFullscreenUI);
document.addEventListener('webkitfullscreenchange', syncFullscreenUI);

function syncSettingsUI() {
  syncFullscreenUI();
  updateDifficultyUI();
  if (typeof syncLoadoutViewModePill === 'function') syncLoadoutViewModePill();
  styleTogglePill(document.getElementById('toggle-simplified-view-btn'), userSettings.simplifiedViewEnabled !== false);
  styleTogglePill(document.getElementById('toggle-slot-callouts-btn'), userSettings.slotCalloutsEnabled);
  styleTogglePill(document.getElementById('toggle-floating-pops-btn'), userSettings.floatingPopsEnabled);
  styleTogglePill(document.getElementById('toggle-music-btn'), userSettings.musicEnabled);
  styleTogglePill(document.getElementById('toggle-sfx-btn'), userSettings.sfxEnabled);
  styleTogglePill(document.getElementById('toggle-haptics-btn'), userSettings.hapticsEnabled);

  document.querySelectorAll('.dur-mode-btn').forEach((btn) => {
    const active = btn.getAttribute('data-dur') === userSettings.notificationSpeed;
    btn.className = `dur-mode-btn py-1.5 px-2 rounded-xl border text-[10px] font-mono-code font-bold transition active:scale-95 ${
      active
        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
        : 'bg-stone-950/70 text-slate-300 border-white/10'
    }`;
  });

  document.querySelectorAll('.drop-mode-btn').forEach((btn) => {
    const active = btn.getAttribute('data-drop') === userSettings.touchDropMode;
    btn.className = `drop-mode-btn py-1.5 px-2 rounded-xl border text-[10px] font-mono-code font-bold transition active:scale-95 ${
      active
        ? 'bg-teal-400 text-stone-950 border-teal-300 shadow-md'
        : 'bg-stone-950/70 text-slate-300 border-white/10'
    }`;
  });

  const isAutoScale = userSettings.uiAutoScale !== false;
  const effPct = typeof getEffectiveUiScalePercent === 'function'
    ? getEffectiveUiScalePercent()
    : (Number(userSettings.uiScalePercent) || 100);

  const scaleSlider = document.getElementById('ui-scale-slider');
  if (scaleSlider) {
    scaleSlider.value = String(effPct);
  }

  const scaleLabel = document.getElementById('ui-scale-value-label');
  if (scaleLabel) {
    scaleLabel.textContent = isAutoScale ? `Auto (${effPct}%)` : `${effPct}%`;
  }

  const autoScaleBtn = document.getElementById('toggle-ui-autoscale-btn');
  if (autoScaleBtn) {
    autoScaleBtn.textContent = isAutoScale ? 'Auto: ON' : 'Auto: OFF';
    autoScaleBtn.className = `px-2.5 py-1 rounded-full font-mono-code font-bold text-[10px] uppercase border transition active:scale-95 ${
      isAutoScale
        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-sm'
        : 'bg-stone-800/80 text-slate-400 border-white/10'
    }`;
  }

  const muteIconEl = document.getElementById('mute-icon');
  if (muteIconEl && typeof lucide !== 'undefined') {
    muteIconEl.setAttribute('data-lucide', sfx.muted ? 'volume-x' : 'volume-2');
    lucide.createIcons();
  }
}

function openSettingsModal() {
  bgm.pauseForSettings();
  syncSettingsUI();
  document.getElementById('settings-modal')?.classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal')?.classList.add('hidden');
  bgm.resumeFromSettings();
}

document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
document.getElementById('close-settings-btn')?.addEventListener('click', closeSettingsModal);
document.getElementById('done-settings-btn')?.addEventListener('click', closeSettingsModal);
document.getElementById('settings-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'settings-modal') closeSettingsModal();
});

document.getElementById('toggle-fullscreen-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  toggleFullScreenCavernMode();
});

document.getElementById('dismiss-all-callouts-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playHoverTick();
  dismissAllActiveNotifications();
});

document.getElementById('toggle-slot-callouts-btn')?.addEventListener('click', () => {
  userSettings.slotCalloutsEnabled = !userSettings.slotCalloutsEnabled;
  if (!userSettings.slotCalloutsEnabled) {
    document.querySelectorAll('.slot-bonus-callout').forEach((el) => el.remove());
    if (typeof updateDismissAllCalloutsButton === 'function') updateDismissAllCalloutsButton();
  }
  sfx.playHoverTick();
  saveUserSettings();
  syncSettingsUI();
});

document.getElementById('toggle-floating-pops-btn')?.addEventListener('click', () => {
  userSettings.floatingPopsEnabled = !userSettings.floatingPopsEnabled;
  sfx.playHoverTick();
  saveUserSettings();
  syncSettingsUI();
});

document.getElementById('toggle-music-btn')?.addEventListener('click', () => {
  userSettings.musicEnabled = !userSettings.musicEnabled;
  sfx.playHoverTick();
  saveUserSettings();
  if (userSettings.musicEnabled && !sfx.muted) {
    bgm.play();
  } else {
    bgm.stop();
  }
  syncSettingsUI();
});

document.getElementById('toggle-sfx-btn')?.addEventListener('click', () => {
  userSettings.sfxEnabled = !userSettings.sfxEnabled;
  sfx.setMuted(!userSettings.sfxEnabled);
  sfx.playHoverTick();
  saveUserSettings();
  syncSettingsUI();
});

document.getElementById('toggle-haptics-btn')?.addEventListener('click', () => {
  userSettings.hapticsEnabled = !userSettings.hapticsEnabled;
  if (userSettings.hapticsEnabled && typeof triggerHaptic === 'function') triggerHaptic(20);
  sfx.playHoverTick();
  saveUserSettings();
  syncSettingsUI();
});

document.querySelectorAll('.dur-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dur = btn.getAttribute('data-dur');
    if (dur) {
      userSettings.notificationSpeed = dur;
      sfx.playHoverTick();
      saveUserSettings();
      syncSettingsUI();
    }
  });
});

document.querySelectorAll('.drop-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-drop');
    if (mode) {
      userSettings.touchDropMode = mode;
      sfx.playHoverTick();
      saveUserSettings();
      syncSettingsUI();
      if (typeof updateColumnPreviewVisual === 'function') {
        updateColumnPreviewVisual(state.previewCol);
      }
    }
  });
});

document.getElementById('settings-change-difficulty-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('settings-modal')?.classList.add('hidden');
  openDifficultyModal(true);
});

document.getElementById('settings-replay-tutorial-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  closeSettingsModal();
  if (typeof startTutorialSequence === 'function') {
    startTutorialSequence();
  }
});

document.getElementById('settings-title-screen-btn')?.addEventListener('click', () => {
  sfx.playCardChime();
  if (typeof triggerHaptic === 'function') triggerHaptic(20);
  if (typeof returnToTitleScreen === 'function') {
    returnToTitleScreen();
  } else {
    closeSettingsModal();
  }
});

document.getElementById('settings-reset-run-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  if (typeof runPersistence !== 'undefined' && runPersistence) {
    runPersistence.clearSavedRun();
  }
  closeSettingsModal();
  clearFloorIntroAndModalLocks();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  state._isRetryingFloor = false;
  initNewRun();
  startFloorMatch(true);
  showToast('Ascension Run Reset to Floor 1!', modalHudIcon('reroll.svg'));
});


function toggleSimplifiedViewSetting(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  userSettings.simplifiedViewEnabled = !(userSettings.simplifiedViewEnabled !== false);
  sfx.playHoverTick();
  saveUserSettings();
  syncSettingsUI();
  if (typeof renderLoadoutSelector === 'function') renderLoadoutSelector();
  if (typeof renderDifficultyCards === 'function') renderDifficultyCards();
  if (typeof renderBazaarStock === 'function') {
    renderBazaarStock();
  }
  if (typeof renderBossVictoryChest === 'function') {
    const bossChestModal = document.getElementById('boss-chest-modal');
    if (bossChestModal && !bossChestModal.classList.contains('hidden')) {
      renderBossVictoryChest();
    }
  }
  if (typeof updateHUD === 'function') updateHUD();
  showToast(
    userSettings.simplifiedViewEnabled
      ? '🕯️ Simplified View ON: Showing Isaac-style lore tooltips'
      : '📐 Simplified View OFF: Showing full mechanical breakdowns',
    modalHudIcon('sparkle.svg'),
    3200
  );
}

document.getElementById('toggle-simplified-view-btn')?.addEventListener('click', toggleSimplifiedViewSetting);
document.getElementById('loadout-view-mode-btn')?.addEventListener('click', toggleSimplifiedViewSetting);
document.getElementById('bazaar-view-mode-btn')?.addEventListener('click', toggleSimplifiedViewSetting);
document.getElementById('boss-chest-view-mode-btn')?.addEventListener('click', toggleSimplifiedViewSetting);


function setCustomUiScalePercent(rawPct, announce = false) {
  const clamped = Math.max(75, Math.min(150, Math.round((Number(rawPct) || 100) / 5) * 5));
  userSettings.uiAutoScale = false;
  userSettings.uiScalePercent = clamped;
  saveUserSettings();
  if (typeof applyUiScaleSetting === 'function') applyUiScaleSetting();
  syncSettingsUI();
  if (announce && typeof showToast === 'function') {
    showToast(`Interface scale set to ${clamped}%`, modalHudIcon('sparkle.svg'), 1800);
  }
}

const uiScaleSliderEl = document.getElementById('ui-scale-slider');
if (uiScaleSliderEl) {
  uiScaleSliderEl.addEventListener('input', (e) => {
    e.stopPropagation();
    const val = Number(e.target.value) || 100;
    setCustomUiScalePercent(val, false);
  });
  uiScaleSliderEl.addEventListener('change', (e) => {
    e.stopPropagation();
    sfx.playHoverTick();
    const val = Number(e.target.value) || 100;
    setCustomUiScalePercent(val, true);
  });
}

document.getElementById('ui-scale-dec-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playHoverTick();
  const cur = typeof getEffectiveUiScalePercent === 'function' ? getEffectiveUiScalePercent() : (Number(userSettings.uiScalePercent) || 100);
  setCustomUiScalePercent(cur - 5, true);
});

document.getElementById('ui-scale-inc-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playHoverTick();
  const cur = typeof getEffectiveUiScalePercent === 'function' ? getEffectiveUiScalePercent() : (Number(userSettings.uiScalePercent) || 100);
  setCustomUiScalePercent(cur + 5, true);
});

document.getElementById('toggle-ui-autoscale-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playHoverTick();
  userSettings.uiAutoScale = !(userSettings.uiAutoScale !== false);
  if (userSettings.uiAutoScale && typeof computeAutoUiScalePercent === 'function') {
    userSettings.uiScalePercent = computeAutoUiScalePercent();
  }
  saveUserSettings();
  if (typeof applyUiScaleSetting === 'function') applyUiScaleSetting();
  syncSettingsUI();
  const effPct = typeof getEffectiveUiScalePercent === 'function' ? getEffectiveUiScalePercent() : userSettings.uiScalePercent;
  showToast(
    userSettings.uiAutoScale
      ? `Auto-Scale ON (${effPct}% for current display)`
      : `Manual Scale active (${effPct}%)`,
    modalHudIcon('sparkle.svg'),
    2200
  );
});
