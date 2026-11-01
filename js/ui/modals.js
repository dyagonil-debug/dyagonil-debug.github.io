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
    introEl.classList.remove('floor-intro-active', 'floor-intro-fadeout');
    introEl.style.display = '';
    introEl.style.opacity = '';
    introEl.style.pointerEvents = '';
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
// 1. DIFFICULTY TIER UI & SELECTION MODAL
// ============================================================================
function updateDifficultyUI() {
  if (typeof getActiveDifficulty !== 'function') return;
  const diff = getActiveDifficulty();
  const badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.innerHTML = diff.shortBadge;
    badge.className = `px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-tight border active:scale-95 transition flex items-center gap-1 ${diff.badgeClass}`;
  }
  const settingsLbl = document.getElementById('settings-difficulty-label');
  if (settingsLbl) {
    settingsLbl.innerHTML = `Active: ${diff.fullBadge}`;
  }
  const rerollBtn = document.getElementById('reroll-shop-btn');
  if (rerollBtn) {
    rerollBtn.innerHTML = `${modalHudIcon('reroll.svg', 'c4-item-icon-sm')} Reroll ($${diff.rerollCost || 4})`;
  }
}

function renderDifficultyCards() {
  const container = document.getElementById('difficulty-cards-container');
  if (!container || typeof DIFFICULTY_TIERS === 'undefined') return;
  container.innerHTML = Object.values(DIFFICULTY_TIERS).map((tier) => {
    const isSelected = state.difficulty === tier.id;
    return `
      <button type="button" data-tier="${tier.id}"
        class="diff-select-card w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${tier.cardClass} ${isSelected ? 'ring-2 ring-amber-300/80' : ''}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-display font-bold text-sm text-white flex items-center gap-1.5">${tier.fullBadge}</span>
          <span class="text-[10px] font-mono-code text-slate-300">${tier.subtitle}</span>
        </div>
        <p class="text-[11px] text-slate-200/90 mt-1.5 leading-relaxed">${tier.description}</p>
        <div class="flex flex-wrap gap-1.5 mt-2.5 text-[9px] font-mono-code text-amber-200">
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('coin.svg', 'c4-item-icon-sm')} $${tier.startingGold} Start</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('mana.svg', 'c4-item-icon-sm')} ${tier.startingMaxMana} Max Mana</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('cards.svg', 'c4-item-icon-sm')} ${tier.startingHandSize} Hand Size</span>
        </div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.diff-select-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tierId = btn.getAttribute('data-tier');
      selectDifficultyAndStart(tierId);
    });
  });
}

function openDifficultyModal(allowCancel = false) {
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

function selectDifficultyAndStart(tierId) {
  state.difficulty = (typeof DIFFICULTY_TIERS !== 'undefined' && DIFFICULTY_TIERS[tierId]) ? tierId : 'MEDIUM';
  try {
    if (typeof DIFFICULTY_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty);
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
  showToast(`Descent Begun: ${diff.fullBadge}`, modalHudIcon('mountain.svg'), 4200);
}

document.getElementById('difficulty-badge')?.addEventListener('click', () => {
  sfx.playHoverTick();
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('cancel-difficulty-modal-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('difficulty-modal')?.classList.add('hidden');
  bgm.resumeFromSettings();
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
    descHtml: `<p>${g.desc}</p>`,
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
  showInfoSheetModal({
    icon: floorData.isBoss && floorData.bossArchetype ? floorData.bossArchetype.icon : topo.icon,
    category: `Floor ${floorData.floor} of ${TOTAL_FLOORS} • ${topo.name}`,
    title: floorData.boss,
    descHtml: `
      <p>${floorData.fullRule}</p>
      <p class="text-amber-300/90 mt-1.5"><strong>Board Geometry (${topo.name}):</strong> ${topo.desc}</p>
    `,
    statusText: floorData.isBoss
      ? `Boss HP: ${state.bossHp}/${state.bossMaxHp} • AI Depth D${floorData.depth}`
      : `AI Solver Depth D${floorData.depth} (${floorData.aiPrecisionPct}% Precision)`
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
    category: '9-Floor Ascension Progression',
    title: 'Boss Milestone Power Spikes',
    descHtml: `
      <p><strong>Floor 3 Boss Clear (Boss Fight 1):</strong> Unlocks <strong>Tier 2 Shop Wares</strong>, +1 Max Mana, +1 Hand Size, Tactical Reserve Pouch (+1 Heavy Anvil), &amp; 1 free Boss Gambit Relic.</p>
      <p><strong>Floor 6 Boss Clear (Boss Fight 2):</strong> Unlocks <strong>Tier 3 Shop Wares</strong>, +1 Max Mana, +1 Hand Size, expands to 4 Gambit Slots (+1 Wild Token), &amp; 1 free Boss Gambit Relic.</p>
      <p><strong>Floor 9 Final Boss Clear:</strong> Complete Subterranean Ascension Mastery!</p>
    `,
    statusText: `Current Progress: Floor ${state.floorIdx + 1} of ${TOTAL_FLOORS}`
  });
});

document.getElementById('legend-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  showInfoSheetModal({
    icon: modalHudIcon('sparkle.svg'),
    category: 'Board Ring Legend',
    title: 'Enchanted Cavern Slots',
    descHtml: `
      <p><strong class="text-yellow-300">🟡 Gilded Slot:</strong> Grants <strong>+$3 Bonus Gold</strong> when your token lands inside.</p>
      <p><strong class="text-rose-300">🔴 Volatile Spice Slot:</strong> Grants <strong>+1 Mana</strong> and shatters 1 orthogonally adjacent AI token.</p>
      <p><strong class="text-sky-300">🔵 Wild Amplifier Slot:</strong> Upgrades the token into a <strong>Wild Prismatic Token</strong> (+$2 Gold for you).</p>
      <p><strong class="text-purple-300">🟣 Spider Web Slot:</strong> Petrifies an AI token into neutral Stone, or grants you <strong>+1 Stability</strong>.</p>
      <p><strong class="text-lime-300">🟢 Cursed Spore (Boss):</strong> Drains 1 Mana or calcifies your token into Stone if at 0 Mana.</p>
    `,
    statusText: `${state.persistentEnchantCount} Base Enchanted Slot(s) Per Floor`
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
function openBossVictoryChest(floorData) {
  const milestoneBox = document.getElementById('boss-milestone-box');
  if (state.floorIdx === 2) {
    state.unlockedShopTier = Math.max(state.unlockedShopTier || 1, 2);
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.max(state.maxGambitSlots, 2);
    state.reservePouchUnlocked = true;
    state.reservePouch.push('anvil');
    if (milestoneBox) {
      milestoneBox.innerHTML = `
        <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 2 Shop Wares Unlocked:</strong> Tier 2 Cards, Reserves &amp; Gambits now in stock</div>
        <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
        <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
        <div>${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Tactical Reserve Pouch Unlocked:</strong> +1 Free <strong>Heavy Anvil Token</strong></div>
        <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Gambit Capacity Expanded:</strong> Up to <strong>${state.maxGambitSlots} Relic Slots</strong></div>
      `;
    }
  } else {
    state.unlockedShopTier = 3;
    state.highTierCardsUnlocked = true;
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.min(5, Math.max(state.maxGambitSlots, 4));
    state.reservePouch.push('wild');
    if (milestoneBox) {
      milestoneBox.innerHTML = `
        <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Tier 3 Shop Wares Unlocked:</strong> Tier 3 Mastery Cards, Reserves &amp; Gambits now in stock</div>
        <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
        <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
        <div>${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Prismatic Reserve Granted:</strong> +1 Free <strong>Wild Prismatic Token</strong></div>
        <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Gambit Capacity Expanded:</strong> Up to <strong>${state.maxGambitSlots} Relic Slots</strong></div>
      `;
    }
  }

  const choicesEl = document.getElementById('boss-relic-choices');
  if (choicesEl) {
    choicesEl.innerHTML = '';
    const maxTier = getMaxAllowedShopTier();
    const eligibleIds = Object.keys(GAMBIT_CATALOG)
      .filter((id) => !state.gambits.includes(id) && getExplicitItemTier(GAMBIT_CATALOG[id], 1) <= maxTier);
    const topTierPool = eligibleIds
      .filter((id) => getExplicitItemTier(GAMBIT_CATALOG[id], 1) === maxTier)
      .sort(() => Math.random() - 0.5);
    const lowerTierPool = eligibleIds
      .filter((id) => getExplicitItemTier(GAMBIT_CATALOG[id], 1) < maxTier)
      .sort(() => Math.random() - 0.5);
    const unowned = [...topTierPool, ...lowerTierPool].slice(0, 3);

    unowned.forEach((gId) => {
      const g = GAMBIT_CATALOG[gId];
      const t = getExplicitItemTier(g, 2);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arcane-card p-3 rounded-2xl flex items-center justify-between gap-3 text-left active:scale-98 transition';
      btn.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-2xl shrink-0">${g.icon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-display font-bold text-xs text-white truncate">${g.name}</span>
              <span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
                t >= 3
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                  : (t === 2 ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40' : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
              }">T${t}</span>
            </div>
            <p class="text-[10px] text-slate-300 leading-snug mt-0.5">${g.desc}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">Claim</span>
      `;
      btn.addEventListener('click', () => {
        if (state.gambits.length >= state.maxGambitSlots) {
          state.maxGambitSlots = Math.min(5, state.gambits.length + 1);
        }
        state.gambits.push(gId);
        sfx.playCardChime();
        document.getElementById('boss-chest-modal')?.classList.add('hidden');
        showToast(`Claimed Boss Relic: ${g.name}!`, g.icon);
        openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
      });
      choicesEl.appendChild(btn);
    });
  }

  updateHUD();
  document.getElementById('boss-chest-modal')?.classList.remove('hidden');
}

function renderBazaarEquippedGambits() {
  const slotsLabel = document.getElementById('bazaar-gambit-slots-label');
  const expandBtn = document.getElementById('bazaar-expand-slot-btn');
  const strip = document.getElementById('bazaar-equipped-gambits');
  if (!strip || !slotsLabel) return;
  ensureValidGold();
  const activeShopTier = typeof getMaxAllowedShopTier === 'function' ? getMaxAllowedShopTier() : 1;
  slotsLabel.textContent = `Shop Tier ${activeShopTier}/3 • Equipped Gambits (${state.gambits.length}/${state.maxGambitSlots} Slots)`;

  if (expandBtn) {
    if (state.maxGambitSlots >= 5) {
      expandBtn.textContent = 'Max 5 Slots';
      expandBtn.className = 'px-2 py-0.5 rounded-lg bg-stone-800 text-slate-500 font-mono-code text-[9px] pointer-events-none';
    } else {
      const sCost = getActiveDifficulty().slotExpandCost || 8;
      const canExpand = state.gold >= sCost;
      expandBtn.textContent = `+1 Slot ($${sCost})`;
      expandBtn.className = `px-2 py-0.5 rounded-lg border font-mono-code text-[9px] font-bold active:scale-95 ${
        canExpand
          ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
          : 'bg-stone-800/70 border-white/10 text-slate-400'
      }`;
    }
  }

  strip.innerHTML = '';
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

  if (titleEl) {
    titleEl.innerHTML = `Equip ${item.icon} ${item.name} ($${item.price})`;
  }
  if (descEl) {
    descEl.textContent = `Your Gambit slots are full (${state.gambits.length}/${state.maxGambitSlots}). Swap out an equipped Gambit (adds +$3 resale value toward this purchase!) or expand your slots:`;
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
        <span class="truncate">Unlock +1 Gambit Slot &amp; Equip Both</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-emerald-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        $${bundleCost}
      </span>
    `;
    bundleBtn.addEventListener('click', () => {
      if (!canAffordBundle) {
        showToast(`Need $${bundleCost} Gold ($${slotPrice} Slot + $${item.price} Gambit)!`, modalHudIcon('coin.svg'));
        return;
      }
      state.gold -= bundleCost;
      state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
      state.gambits.push(item.id);
      item.bought = true;
      promptEl.classList.add('hidden');
      sfx.playCoinDing();
      showToast(`Expanded Gambit Slots & equipped ${item.name}!`, item.icon);
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
        <span class="truncate">Replace <strong>${g.icon} ${g.name}</strong> (+$3 Trade-In)</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">Net $${netCost}</span>
    `;
    swapBtn.addEventListener('click', () => {
      if (!canAffordSwap) {
        showToast(`Need $${netCost} Gold after +$3 trade-in!`, modalHudIcon('coin.svg'));
        return;
      }
      state.gold = state.gold + 3 - item.price;
      const replaceIdx = state.gambits.indexOf(gId);
      if (replaceIdx !== -1) state.gambits[replaceIdx] = item.id;
      else state.gambits.push(item.id);
      item.bought = true;
      promptEl.classList.add('hidden');
      sfx.playCoinDing();
      showToast(`Swapped ${g.name} for ${item.name}!`, item.icon);
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
  renderBazaarEquippedGambits();
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
    } else if (isGambitFull) {
      badgeLabel = canAffordDirect ? `$${item.price} (Swap/Slot)` : `Swap ($${Math.max(0, item.price - 3)})`;
    }

    const t = item.tier || 1;
    const tierBadgeHtml = `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
      t >= 3
        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
        : (t === 2 ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40' : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
    }">T${t}</span>`;

    const row = document.createElement('button');
    row.type = 'button';
    row.style.position = 'relative';
    row.style.zIndex = '2';
    row.style.pointerEvents = isUnavailable ? 'none' : 'auto';
    row.className = `arcane-card p-2.5 rounded-2xl flex items-center justify-between gap-2.5 text-left transition ${
      isUnavailable ? 'opacity-40' : (isInteractive ? 'active:scale-98' : 'opacity-65')
    }`;
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-xl shrink-0">${item.icon}</span>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-display font-bold text-xs text-white truncate">${item.name}</span>
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
    row.addEventListener('click', () => buyBazaarItem(idx));
    listEl.appendChild(row);
  });
}

function generateBazaarStock() {
  const items = [];
  updateDifficultyUI();

  // Boss-gated Shop Tier enforcement:
  // Tier 1 before Boss 1 | Tier 2 after Boss 1 | Tier 3 after Boss 2
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

  // Slot 1: Primary Arcane Card (prefers unowned & highest unlocked tier)
  let primaryCardId = pickTieredId(
    CARD_CATALOG,
    (id, c, t) => t > 0 && !isStackableCurseCard(id) && !playerOwnsCard(id),
    1,
    0.72
  );
  if (!primaryCardId) {
    primaryCardId = pickTieredId(
      CARD_CATALOG,
      (id, c, t) => t > 0 && !isStackableCurseCard(id),
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
      icon: card.icon,
      desc: card.desc,
      price: getScaledPrice(card.price),
      bought: false
    });
  }

  // Slot 2: Secondary Arcane Card (distinct tier-allowed card for expanded catalog variety)
  let secondaryCardId = pickTieredId(
    CARD_CATALOG,
    (id, c, t) => t > 0 && !isStackableCurseCard(id) && id !== primaryCardId && !playerOwnsCard(id),
    1,
    0.45
  );
  if (!secondaryCardId) {
    secondaryCardId = pickTieredId(
      CARD_CATALOG,
      (id, c, t) => t > 0 && !isStackableCurseCard(id) && id !== primaryCardId,
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
      icon: card2.icon,
      desc: card2.desc,
      price: getScaledPrice(card2.price),
      bought: false
    });
  }

  // Slot 3: Tactical Reserve Token (strictly gated by maxTier) or Early Pouch Unlock on Floor 1
  if (state.reservePouchUnlocked || state.floorIdx >= 1) {
    const rId = pickTieredId(RESERVE_CATALOG, () => true, 1, 0.65);
    if (rId) {
      const rTok = RESERVE_CATALOG[rId];
      items.push({
        type: 'reserve',
        id: rTok.id,
        tier: getExplicitItemTier(rTok, 1),
        name: rTok.name,
        icon: rTok.icon,
        desc: rTok.desc,
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
      icon: '🎒',
      desc: "Unlock the Tactical Reserve Token Pouch early and receive +1 Heavy Anvil & +1 Fool's Counterfeit Penny!",
      price: getScaledPrice(7),
      bought: false
    });
  }

  // Slot 4: Synergistic Gambit Relic (strictly gated by maxTier)
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
      icon: g.icon,
      desc: g.desc,
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
        icon: rTok.icon,
        desc: rTok.desc,
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
      icon: '🏺',
      desc: `Permanently expands your active Gambit Relic capacity from ${state.maxGambitSlots} to ${state.maxGambitSlots + 1} slots!`,
      price: getScaledPrice(6),
      bought: false
    });
  } else {
    items.push({
      type: 'enchant_upgrade',
      id: 'enchant_plus',
      tier: 1,
      name: 'Enchanted Cavern Vein (+2 Board Rings)',
      icon: '✨',
      desc: 'Permanently spawns +2 extra Enchanted Slots on every future floor board!',
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
    showToast(`Need $${item.price} Gold to buy ${item.name}!`, modalHudIcon('coin.svg'));
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
  showToast(`Purchased ${item.name}!`, item.icon);
  renderBazaarStock();
  updateHUD();
}

function openUndergroundBazaar(totalEarned, speedBonus) {
  ensureValidGold();
  state.rouletteSpinsThisFloor = 0;
  const floorData = getFloorConfig(state.floorIdx);
  const baseReward = floorData.isBoss ? 7 : 3;
  const payoutEl = document.getElementById('bazaar-payout-amount');
  if (payoutEl) {
    payoutEl.textContent = `+$${totalEarned} ($${baseReward} Base + $${speedBonus} Speed)`;
  }
  const summaryEl = document.getElementById('roulette-bazaar-summary');
  if (summaryEl) {
    summaryEl.textContent = 'Spin the physics roulette wheel for Jackpots, Relics & Mana—or risk Curses, Gremlins & Cave-Ins!';
  }
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
  const cost = getActiveDifficulty().rerollCost || 4;
  if (state.gold < cost) {
    showToast(`Need $${cost} Gold to reroll!`, modalHudIcon('coin.svg'));
    return;
  }
  state.gold -= cost;
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');
  sfx.playHoverTick();
  generateBazaarStock();
  updateHUD();
  showToast('Rerolled Underground Bazaar stock!', modalHudIcon('reroll.svg'));
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
  initNewRun();
  startFloorMatch(true);
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
