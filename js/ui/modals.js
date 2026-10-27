// ============================================================================
// MODALS, BAZAAR ECONOMY, BOSS CHEST, DIFFICULTY & SETTINGS UI (js/ui/modals.js)
// ============================================================================

// Self-healing style guard: ensures #floor-intro-overlay renders full-screen
// even if css/overlays.css was renamed or cached by an older Service Worker.
(function ensureFloorIntroOverlayStyles() {
  if (document.getElementById('floor-intro-fallback-styles')) return;
  const style = document.createElement('style');
  style.id = 'floor-intro-fallback-styles';
  style.textContent = `
    #floor-intro-overlay {
      position: fixed;
      inset: 0;
      z-index: 160;
      background: radial-gradient(circle at 50% 45%, rgba(22, 17, 32, 0.96) 0%, rgba(7, 6, 9, 0.99) 80%);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.52s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #floor-intro-overlay.hidden {
      display: none !important;
    }
    #floor-intro-overlay.floor-intro-active {
      opacity: 1;
      pointer-events: auto;
    }
    #floor-intro-card {
      transform: translateY(18px) scale(0.94);
      opacity: 0;
      transition: transform 0.52s cubic-bezier(0.2, 0.9, 0.3, 1.08), opacity 0.45s ease-out;
    }
    #floor-intro-overlay.floor-intro-active #floor-intro-card {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
})();

// ============================================================================
// 0. FLOOR-START LOADOUT CHECKPOINT SYSTEM (Preserves Loadout on Floor Retry)
// ============================================================================
function saveFloorStartCheckpoint() {
  if (typeof state === 'undefined') return;
  state.floorStartSnapshot = {
    floorIdx: state.floorIdx,
    gold: state.gold,
    maxMana: state.maxMana,
    handSize: state.handSize,
    maxGambitSlots: state.maxGambitSlots,
    persistentEnchantCount: state.persistentEnchantCount,
    reservePouchUnlocked: state.reservePouchUnlocked,
    highTierCardsUnlocked: state.highTierCardsUnlocked,
    masterDeck: Array.isArray(state.masterDeck) ? [...state.masterDeck] : [],
    reservePouch: Array.isArray(state.reservePouch) ? [...state.reservePouch] : [],
    gambits: Array.isArray(state.gambits) ? [...state.gambits] : [],
    nextFloorModifiers: state.nextFloorModifiers
      ? { ...state.nextFloorModifiers }
      : {
          bonusMana: 0,
          bonusStability: 0,
          bonusEnchantSlots: 0,
          caveInStones: 0,
          aiHeadstartTokens: 0
        }
  };
}

function restoreFloorStartCheckpoint() {
  if (typeof state === 'undefined' || !state.floorStartSnapshot) return false;
  const snap = state.floorStartSnapshot;

  state.floorIdx = snap.floorIdx;
  state.gold = snap.gold;
  state.maxMana = snap.maxMana;
  state.handSize = snap.handSize;
  state.maxGambitSlots = snap.maxGambitSlots;
  state.persistentEnchantCount = snap.persistentEnchantCount;
  state.reservePouchUnlocked = snap.reservePouchUnlocked;
  state.highTierCardsUnlocked = snap.highTierCardsUnlocked;
  state.masterDeck = [...snap.masterDeck];
  state.reservePouch = [...snap.reservePouch];
  state.gambits = [...snap.gambits];
  state.nextFloorModifiers = { ...snap.nextFloorModifiers };
  return true;
}

// Wrap startFloorMatch so every floor entry automatically snapshots the pre-floor loadout
(function hookStartFloorMatchForCheckpoints() {
  if (typeof window.startFloorMatch !== 'function' || window.startFloorMatch._checkpointHooked) return;
  const origStartFloorMatch = window.startFloorMatch;

  window.startFloorMatch = function (showIntro = true) {
    if (state._isRetryingFloor) {
      restoreFloorStartCheckpoint();
      state._isRetryingFloor = false;
    }
    // Capture the snapshot right before startFloorMatch consumes nextFloorModifiers or draws cards
    saveFloorStartCheckpoint();
    return origStartFloorMatch.call(this, showIntro);
  };
  window.startFloorMatch._checkpointHooked = true;
})();

// ============================================================================
// 1. DIFFICULTY TIER UI & SELECTION MODAL
// ============================================================================
function updateDifficultyUI() {
  const diff = getActiveDifficulty();
  const badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.textContent = diff.shortBadge;
    badge.className = `px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold tracking-tight border active:scale-95 transition ${diff.badgeClass}`;
  }
  const settingsLbl = document.getElementById('settings-difficulty-label');
  if (settingsLbl) {
    settingsLbl.textContent = `Active: ${diff.fullBadge}`;
  }
  const rerollBtn = document.getElementById('reroll-shop-btn');
  if (rerollBtn) rerollBtn.textContent = `🎲 Reroll ($${diff.rerollCost})`;
  const pruneBtn = document.getElementById('prune-card-btn');
  if (pruneBtn) pruneBtn.textContent = `✂️ Banish Card ($${diff.banishCost})`;
}

function renderDifficultyCards() {
  const container = document.getElementById('difficulty-cards-container');
  if (!container) return;
  container.innerHTML = Object.values(DIFFICULTY_TIERS).map(tier => {
    const isSelected = state.difficulty === tier.id;
    return `
      <button type="button" data-tier="${tier.id}"
        class="diff-select-card w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${tier.cardClass} ${isSelected ? 'ring-2 ring-amber-300/80' : ''}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-display font-bold text-sm text-white">${tier.fullBadge}</span>
          <span class="text-[10px] font-mono-code text-slate-300">${tier.subtitle}</span>
        </div>
        <p class="text-[11px] text-slate-200/90 mt-1.5 leading-relaxed">${tier.description}</p>
        <div class="flex flex-wrap gap-1.5 mt-2.5 text-[9px] font-mono-code text-amber-200">
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🪙 $${tier.startingGold} Start</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">⚡ ${tier.manaRateLabel} (Max ${tier.startingMaxMana})</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🃏 ${tier.drawRateLabel} (${tier.startingHandSize} Hand)</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🌋 ${tier.stabilityOffset >= 0 ? '+' + tier.stabilityOffset : tier.stabilityOffset} Stability</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🛒 ${Math.round(tier.bazaarPriceMultiplier * 100)}% Bazaar</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">🧠 AI D${tier.depthByFloor[0]}–D${tier.depthByFloor[8]}</span>
        </div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.diff-select-card').forEach(btn => {
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
  document.getElementById('difficulty-modal').classList.remove('hidden');
}

function selectDifficultyAndStart(tierId) {
  state.difficulty = DIFFICULTY_TIERS[tierId] ? tierId : 'MEDIUM';
  try { localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty); } catch (e) {}
  document.getElementById('difficulty-modal').classList.add('hidden');
  dismissAllActiveNotifications();
  bgm.hasStartedAfterDifficulty = true;
  bgm.isPausedForModal = false;
  initNewRun();
  startFloorMatch(true);
  const diff = getActiveDifficulty();
  showToast(`Descent Begun: ${diff.fullBadge}`, '🏔️', 4200);
}

// ============================================================================
// 2. INSPECTOR SHEET MODALS (GAMBITS, BOSS INFO, MILESTONES, STABILITY, SLOTS)
// ============================================================================
function openGambitSheet(gambitId) {
  const g = GAMBIT_CATALOG[gambitId];
  if (!g) return;
  document.getElementById('sheet-icon').textContent = g.icon;
  document.getElementById('sheet-category').textContent = 'Synergistic Gambit (Relic)';
  document.getElementById('sheet-title').textContent = g.name;
  document.getElementById('sheet-desc').textContent = g.desc;
  document.getElementById('sheet-status').textContent = (gambitId === 'obsidian_cat' && state.catNineLivesUsed)
    ? 'Nine Lives Used This Floor (+$2/shatter still active)'
    : 'Active Synergy';

  const sellBtn = document.getElementById('sell-gambit-btn');
  sellBtn.classList.remove('hidden');
  sellBtn.onclick = () => {
    state.gambits = state.gambits.filter(id => id !== gambitId);
    state.gold += 3;
    sfx.playCoinDing();
    document.getElementById('info-sheet-modal').classList.add('hidden');
    updateHUD();
    showToast(`Sold ${g.name} for +$3 Gold!`, "🪙");
  };
  document.getElementById('info-sheet-modal').classList.remove('hidden');
}

document.getElementById('boss-info-btn').addEventListener('click', () => {
  const f = getFloorConfig(state.floorIdx);
  const topo = state.currentTopology || getFloorTopology(state.floorIdx);
  document.getElementById('sheet-icon').textContent = f.isBoss ? f.bossArchetype.icon : (f.isPreBoss ? topo.icon : '🛡️');
  const poolLabel = (f.isBoss && f.bossArchetype && f.bossArchetype.poolLabel) ? f.bossArchetype.poolLabel : 'Boss Encounter';
  const hpText = (f.isBoss && state.bossMaxHp) ? ` (${state.bossHp}/${state.bossMaxHp} ❤️ HP)` : '';
  document.getElementById('sheet-category').textContent = f.isBoss
    ? `Floor ${f.floor} • ${poolLabel}${hpText}`
    : (f.isPreBoss ? `Floor ${f.floor} Pre-Boss Vanguard` : `Floor ${f.floor} Standard Cavern Sentinel`);
  document.getElementById('sheet-title').textContent = f.boss;
  document.getElementById('sheet-desc').innerHTML = `
    <div>${f.fullRule}</div>
    ${f.isBoss && state.bossMaxHp > 1 ? `
      <div class="mt-2 p-2 rounded-xl bg-rose-500/15 border border-rose-400/35">
        <strong class="text-rose-300">❤️ Multi-Phase Boss (${state.bossHp}/${state.bossMaxHp} HP Remaining)</strong><br/>
        <span>Each 4-in-a-row depletes 1 Boss HP (Overkills & Multi-Trap Forks deal 2–3x HP damage!).</span>
      </div>
    ` : ''}
    <div class="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-400/30">
      <strong class="text-amber-300">${topo.icon} Board Topology: ${topo.name}</strong><br/>
      <span>${topo.desc}</span>
    </div>
  `;
  document.getElementById('sheet-status').textContent = f.isBoss
    ? `Boss Countdown: ${f.telegraph}`
    : `Next Boss on Floor ${Math.ceil((state.floorIdx + 1) / 3) * 3}`;
  document.getElementById('sell-gambit-btn').classList.add('hidden');
  document.getElementById('info-sheet-modal').classList.remove('hidden');
});

document.getElementById('milestone-info-btn').addEventListener('click', () => {
  document.getElementById('sheet-icon').textContent = '🏔️';
  document.getElementById('sheet-category').textContent = 'Ascension Progression & Tier Unlocks';
  document.getElementById('sheet-title').textContent = 'Earned Power Spike Milestones';
  document.getElementById('sheet-desc').innerHTML = `
    <div>• <strong>Act I — Floors 1–2 (Tier 1 Gear):</strong> 1 Max Mana, 2-Card Hand, Tier 1 Bazaar Wares. Focus on core Connect 4 positioning & Gilded Slots!</div>
    <div>• <strong>Defeat Floor 3 Boss (Unlocks Tier 2 Gear):</strong> Unlocks <strong>+1 Max Mana</strong>, <strong>+1 Hand Size</strong>, <strong>Tactical Reserve Pouch</strong> (+1 Free Anvil Token), <strong>2 Gambit Slots</strong>, and <strong>Tier 2 Bazaar Cards, Tokens & Relics</strong>!</div>
    <div>• <strong>Defeat Floor 6 Boss (Unlocks Tier 3 Gear):</strong> Unlocks <strong>+1 Max Mana</strong>, <strong>4 Gambit Slots</strong>, and <strong>Tier 3 Late-Game Mastery</strong> (Brimstone Laser, Stalactite Strike, Midas Eye & Sacred Heart)!</div>
    <div>• <strong>Defeat Floor 9 Final Boss:</strong> Complete the Subterranean Ascension!</div>
  `;
  document.getElementById('sheet-status').textContent = `Current Capacities: ${state.maxMana} Max Mana • ${state.handSize} Hand Size • ${state.maxGambitSlots} Gambit Slots`;
  document.getElementById('sell-gambit-btn').classList.add('hidden');
  document.getElementById('info-sheet-modal').classList.remove('hidden');
});

document.getElementById('stability-info-btn').addEventListener('click', () => {
  document.getElementById('sheet-icon').textContent = '🌋';
  document.getElementById('sheet-category').textContent = 'Cavern Collapse Mechanic';
  document.getElementById('sheet-title').textContent = `Seismic Stability: ${state.stability} Turns`;
  document.getElementById('sheet-desc').textContent =
    'Inspired by Gambonanza: Every turn decreases Seismic Stability by 1. Winning before Stability hits 0 awards +$1 Bonus Gold per remaining turn! If Stability reaches 0, Stalactite Collapse drops petrified stones onto the board each round.';
  document.getElementById('sheet-status').textContent = `Current Speed Bonus: +$${Math.max(0, state.stability)} Gold`;
  document.getElementById('sell-gambit-btn').classList.add('hidden');
  document.getElementById('info-sheet-modal').classList.remove('hidden');
});

document.getElementById('legend-btn').addEventListener('click', () => {
  document.getElementById('sheet-icon').textContent = '✨';
  document.getElementById('sheet-category').textContent = '3D Board Enchantments';
  document.getElementById('sheet-title').textContent = 'Enchanted Ring Legend';
  document.getElementById('sheet-desc').innerHTML = `
    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span><strong>Gilded Slot (Gold Ring):</strong> Awards +$3 Gold immediately when filled.</div>
    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span><strong>Volatile Spice (Red Ring):</strong> Grants +1 Mana & chars 1 adjacent AI token.</div>
    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-500 inline-block"></span><strong>Spider Web (Purple Ring):</strong> Petrifies AI tokens into neutral stone; gives you +1 Stability.</div>
    <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-400 inline-block"></span><strong>Amplifier (Cyan Ring):</strong> Upgrades token into a Wild Prismatic Token +$2 Gold!</div>
  `;
  document.getElementById('sheet-status').textContent = `${state.persistentEnchantCount} Base Enchanted Slots Spawn Per Floor`;
  document.getElementById('sell-gambit-btn').classList.add('hidden');
  document.getElementById('info-sheet-modal').classList.remove('hidden');
});

// ============================================================================
// 3. BOSS VICTORY CHEST, UNDERGROUND BAZAAR & STRICT TIER GATING
// ============================================================================
function getRouletteSpinCost() {
  return state.rouletteSpinsThisFloor === 0 ? 0 : state.rouletteSpinsThisFloor * 5;
}

function updateRouletteButtonsUI() {
  const cost = getRouletteSpinCost();
  const openBtn = document.getElementById('open-roulette-btn');
  const chargeBtn = document.getElementById('charge-spin-btn');
  const goldDisp = document.getElementById('roulette-gold-display');
  if (goldDisp) goldDisp.textContent = `$${state.gold}`;
  if (openBtn) {
    openBtn.textContent = cost === 0 ? 'Spin Free!' : `Spin ($${cost})`;
  }
  if (chargeBtn) {
    chargeBtn.textContent = cost === 0
      ? 'Hold to Charge & Spin (FREE)'
      : `Hold to Charge & Spin ($${cost})`;
  }
}

// Strict Act-Based Tier Ceiling:
// - Act I Shops (after Floors 1 & 2, state.floorIdx < 2): Strictly Tier 1 ONLY (maxTier = 1)
// - Act II Shops (after Floors 3, 4 & 5, 2 <= state.floorIdx < 5): Tiers 1 & 2 ONLY (maxTier = 2)
// - Act III Shops (after Floor 6+, state.floorIdx >= 5): Tiers 1, 2 & 3 Unlocked (maxTier = 3)
function getMaxAllowedShopTier() {
  if (state.floorIdx >= 5 || state.highTierCardsUnlocked) return 3;
  if (state.floorIdx >= 2) return 2;
  return 1;
}

function getExplicitItemTier(itemObj, defaultTier = 1) {
  if (!itemObj) return defaultTier;
  if (typeof itemObj.tier === 'number') return itemObj.tier;
  return defaultTier;
}

function openBossVictoryChest(floorData) {
  const milestoneBox = document.getElementById('boss-milestone-box');
  if (state.floorIdx === 2) {
    // Floor 3 Boss defeated -> Unlock Act II (Tier 2 Wares)
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.max(state.maxGambitSlots, 2);
    state.reservePouchUnlocked = true;
    state.reservePouch.push('anvil');
    milestoneBox.innerHTML = `
      <div>⚡ <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
      <div>🃏 <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
      <div>🎒 <strong>Tactical Reserve Pouch Unlocked:</strong> +1 Free <strong>Heavy Anvil Token</strong></div>
      <div>🏺 <strong>Act II Tier-2 Wares & 2 Relic Slots Unlocked!</strong></div>
    `;
  } else {
    // Floor 6 Boss defeated -> Unlock Act III mastery & Late-Game Tier-3 Cards
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.min(5, Math.max(state.maxGambitSlots, 4));
    state.highTierCardsUnlocked = true;
    state.reservePouch.push('wild');
    milestoneBox.innerHTML = `
      <div>⚡ <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
      <div>🃏 <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
      <div>🩸 <strong>Tier-3 Late-Game Mastery:</strong> <strong>Brimstone Laser</strong>, <strong>Stalactite Strike</strong>, <strong>Midas Eye</strong> & <strong>Sacred Heart</strong> unlocked + Free <strong>Wild Token</strong>!</div>
    `;
  }

  // Cap Floor 3 Boss Chest at Tier 2 Relics; unlock Tier 3 Relics at Floor 6 Boss Chest
  const maxBossRelicTier = state.floorIdx < 5 ? 2 : 3;
  const choicesEl = document.getElementById('boss-relic-choices');
  choicesEl.innerHTML = '';

  const unowned = shuffle(
    Object.keys(GAMBIT_CATALOG).filter(id => {
      const g = GAMBIT_CATALOG[id];
      return !state.gambits.includes(id) && getExplicitItemTier(g, 2) <= maxBossRelicTier;
    })
  ).slice(0, 3);

  unowned.forEach(gId => {
    const g = GAMBIT_CATALOG[gId];
    const t = getExplicitItemTier(g, 2);
    const btn = document.createElement('button');
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
      <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        CLAIM
      </span>
    `;
    btn.addEventListener('click', () => {
      if (state.gambits.length >= state.maxGambitSlots) {
        state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
      }
      state.gambits.push(gId);
      sfx.playCoinDing();
      document.getElementById('boss-chest-modal').classList.add('hidden');
      showToast(`Claimed Boss Relic: ${g.name}!`, g.icon);
      updateHUD();
      openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
    });
    choicesEl.appendChild(btn);
  });

  document.getElementById('boss-chest-modal').classList.remove('hidden');
}

function renderBazaarEquippedGambits() {
  const slotsLabel = document.getElementById('bazaar-gambit-slots-label');
  const expandBtn = document.getElementById('bazaar-expand-slot-btn');
  const strip = document.getElementById('bazaar-equipped-gambits');
  if (!strip || !slotsLabel) return;

  slotsLabel.textContent = `Equipped Gambits (${state.gambits.length}/${state.maxGambitSlots} Slots)`;
  if (expandBtn) {
    if (state.maxGambitSlots >= 5) {
      expandBtn.textContent = 'Max 5 Slots';
      expandBtn.className = 'px-2 py-0.5 rounded-lg bg-stone-800 text-slate-500 font-mono-code text-[9px] pointer-events-none';
    } else {
      const sCost = getActiveDifficulty().slotExpandCost || 4;
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
    strip.innerHTML = `<span class="text-[10px] font-mono-code text-slate-400">No Gambits equipped — Open slot ready!</span>`;
    return;
  }

  state.gambits.forEach(gId => {
    const g = GAMBIT_CATALOG[gId];
    if (!g) return;
    const pill = document.createElement('div');
    pill.className = 'px-2 py-1 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center gap-1.5 shrink-0';
    pill.innerHTML = `
      <span class="text-xs">${g.icon}</span>
      <span class="text-[10px] font-medium text-amber-100">${g.name.split(' ')[0]}</span>
      <button class="px-1.5 py-0.5 rounded bg-rose-500/30 border border-rose-400/40 text-[9px] font-mono-code font-bold text-rose-200 active:scale-95">
        Sell +$3
      </button>
    `;
    pill.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      state.gambits = state.gambits.filter(id => id !== gId);
      state.gold += 3;
      sfx.playCoinDing();
      showToast(`Sold ${g.name} for +$3 Gold!`, '🪙');
      document.getElementById('bazaar-swap-prompt').classList.add('hidden');
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

  titleEl.textContent = `Equip ${item.icon} ${item.name} ($${item.price})`;
  descEl.textContent = `Your Gambit slots are full (${state.gambits.length}/${state.maxGambitSlots}). Swap out an equipped Gambit (adds +$3 resale value toward this purchase!) or expand your slots:`;
  optionsEl.innerHTML = '';

  const slotExpandCost = getActiveDifficulty().slotExpandCost || 4;

  // Option A: Swap with any currently equipped Gambit (net cost = item.price - 3)
  state.gambits.forEach(gId => {
    const g = GAMBIT_CATALOG[gId];
    if (!g) return;
    const netCost = Math.max(0, item.price - 3);
    const canAffordSwap = (state.gold + 3) >= item.price;

    const swapBtn = document.createElement('button');
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
      <span class="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        Net $${netCost}
      </span>
    `;
    swapBtn.addEventListener('click', () => {
      if (!canAffordSwap) {
        showToast(`Need $${netCost} Gold after +$3 trade-in!`, '🪙');
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

  // Option B: Expand +1 Gambit Slot & Equip immediately
  if (state.maxGambitSlots < 5) {
    const bundleCost = item.price + slotExpandCost;
    const canAffordBundle = state.gold >= bundleCost;
    const bundleBtn = document.createElement('button');
    bundleBtn.className = `p-2 rounded-xl border flex items-center justify-between text-left text-xs transition ${
      canAffordBundle
        ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-100 active:scale-98'
        : 'bg-stone-900/40 border-white/10 text-slate-400 opacity-60'
    }`;
    bundleBtn.innerHTML = `
      <div class="flex items-center gap-2 min-w-0">
        <span>🏺</span>
        <span class="truncate">Unlock +1 Gambit Slot & Equip Both</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-emerald-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        $${bundleCost}
      </span>
    `;
    bundleBtn.addEventListener('click', () => {
      if (!canAffordBundle) {
        showToast(`Need $${bundleCost} Gold ($${slotExpandCost} Slot + $${item.price} Gambit)!`, '🪙');
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

  promptEl.classList.remove('hidden');
}

function renderBazaarStock() {
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
            ${item.tier ? `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
              item.tier >= 3
                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                : (item.tier === 2
                  ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
            }">T${item.tier}</span>` : ''}
          </div>
          <p class="text-[10px] text-slate-300 leading-snug mt-0.5 line-clamp-2">${item.desc}</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-xl font-mono-code font-bold text-[10px] shrink-0 ${
        isUnavailable
          ? 'bg-stone-800 text-slate-400'
          : (isInteractive ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-rose-300 border border-rose-500/30')
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

  const maxTier = getMaxAllowedShopTier();
  const isTierAllowed = (tier) => tier >= 1 && tier <= maxTier;

  // Helper: Pick an item strictly <= maxTier, favoring the current Act's highest unlocked tier
  const pickTieredId = (catalog, filterFn, defaultTier = 1) => {
    const allAllowed = Object.keys(catalog).filter((id) => {
      const entry = catalog[id];
      const t = getExplicitItemTier(entry, defaultTier);
      return isTierAllowed(t) && filterFn(id, entry, t);
    });
    if (allAllowed.length === 0) return null;

    const topTierMatches = allAllowed.filter((id) => getExplicitItemTier(catalog[id], defaultTier) === maxTier);
    const pool = (topTierMatches.length > 0 && Math.random() < 0.72) ? topTierMatches : allAllowed;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // 1. Curated Arcane Card (Strictly <= maxTier; never stocks curses)
  let chosenCardId = pickTieredId(
    CARD_CATALOG,
    (id, c, t) => t > 0 && !isStackableCurseCard(id) && (typeof playerOwnsCard === 'function' ? !playerOwnsCard(id) : true),
    1
  );
  if (!chosenCardId) {
    chosenCardId = pickTieredId(
      CARD_CATALOG,
      (id, c, t) => t > 0 && !isStackableCurseCard(id),
      1
    );
  }
  if (chosenCardId) {
    const card = CARD_CATALOG[chosenCardId];
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

  // 2. Tactical Reserve Token (Strictly <= maxTier)
  if (state.reservePouchUnlocked || state.floorIdx >= 2) {
    const chosenReserveId = pickTieredId(RESERVE_CATALOG, () => true, 1);
    if (chosenReserveId) {
      const rTok = RESERVE_CATALOG[chosenReserveId];
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
      price: getScaledPrice(5),
      bought: false
    });
  }

  // 3. Unowned Gambit Relic (Strictly <= maxTier — zero unfiltered fallback to higher tiers!)
  const chosenGambitId = pickTieredId(
    GAMBIT_CATALOG,
    (id) => !state.gambits.includes(id),
    2
  );
  if (chosenGambitId) {
    const g = GAMBIT_CATALOG[chosenGambitId];
    items.push({
      type: 'gambit',
      id: g.id,
      tier: getExplicitItemTier(g, 2),
      name: g.name,
      icon: g.icon,
      desc: g.desc,
      price: getScaledPrice(g.price),
      bought: false
    });
  } else {
    // If all Gambits in the current Act's tier are already equipped, offer an extra Tier-appropriate Reserve Token
    const bonusReserveId = pickTieredId(
      RESERVE_CATALOG,
      (id) => !items.some((it) => it.type === 'reserve' && it.id === id),
      1
    );
    if (bonusReserveId) {
      const rTok = RESERVE_CATALOG[bonusReserveId];
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

  // 4. Permanent Run Vessel Upgrade
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
      name: 'Enchanted Cavern Sigil (+2 Slots)',
      icon: '✨',
      desc: 'Permanently enchants +2 additional board cells every floor with Gilded, Spice, Web, or Amplifier rings!',
      price: getScaledPrice(4),
      bought: false
    });
  }

  state.shopItems = items;
  renderBazaarStock();
}

function buyBazaarItem(idx) {
  const item = state.shopItems[idx];
  if (!item || item.bought) return;

  // If buying a Gambit when Gambit slots are full, open the inline Swap / Expand prompt!
  if (item.type === 'gambit' && state.gambits.length >= state.maxGambitSlots) {
    openBazaarGambitSwapPrompt(idx);
    return;
  }

  if (state.gold < item.price) {
    showToast(`Need $${item.price} Gold to buy ${item.name}!`, "🪙");
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
    if (typeof addCardToInventory === 'function') {
      addCardToInventory(item.id);
    } else if (typeof addUniqueCardToInventory === 'function') {
      const added = addUniqueCardToInventory(item.id);
      if (!added) state.masterDeck.push(item.id);
    } else {
      state.masterDeck.push(item.id);
    }
  }

  state.gold -= item.price;
  item.bought = true;
  document.getElementById('bazaar-swap-prompt').classList.add('hidden');
  sfx.playCoinDing();
  showToast(`Purchased ${item.name}!`, item.icon);
  renderBazaarStock();
  updateHUD();
}

function openUndergroundBazaar(totalEarned, speedBonus) {
  state.rouletteSpinsThisFloor = 0;
  const floorData = getFloorConfig(state.floorIdx);
  const baseReward = floorData.isBoss ? 7 : 3;
  document.getElementById('bazaar-payout-amount').textContent = `+$${totalEarned} ($${baseReward} Base + $${speedBonus} Speed)`;
  document.getElementById('roulette-bazaar-summary').textContent =
    "Spin the physics roulette wheel for Jackpots, Relics & Mana—or risk Curses, Gremlins & Cave-Ins!";
  document.getElementById('bazaar-swap-prompt').classList.add('hidden');

  updateRouletteButtonsUI();
  generateBazaarStock();
  document.getElementById('bazaar-modal').classList.remove('hidden');
}

// ============================================================================
// 4. ROULETTE, BAZAAR & GAME OVER MODAL EVENT LISTENERS
// ============================================================================
document.getElementById('open-roulette-btn').addEventListener('click', () => {
  updateRouletteButtonsUI();
  document.getElementById('roulette-modal').classList.remove('hidden');
});

document.getElementById('close-roulette-btn').addEventListener('click', () => {
  if (rouletteSim.isSpinning) {
    showToast("Wait for the silver ball to settle into a pocket!", "🎡");
    return;
  }
  document.getElementById('roulette-modal').classList.add('hidden');
});

document.getElementById('done-roulette-btn').addEventListener('click', () => {
  if (rouletteSim.isSpinning) {
    showToast("Wait for the silver ball to settle into a pocket!", "🎡");
    return;
  }
  document.getElementById('roulette-modal').classList.add('hidden');
});

// Shop Reroll (Difficulty-Scaled)
document.getElementById('reroll-shop-btn').addEventListener('click', () => {
  const cost = getActiveDifficulty().rerollCost;
  if (state.gold < cost) {
    showToast(`Need $${cost} Gold to reroll!`, "🪙");
    return;
  }
  state.gold -= cost;
  document.getElementById('bazaar-swap-prompt').classList.add('hidden');
  sfx.playHoverTick();
  generateBazaarStock();
  showToast("Rerolled Underground Bazaar stock!", "🎲");
});

// Quick +1 Gambit Slot Expansion inside Bazaar (Difficulty-Scaled)
document.getElementById('bazaar-expand-slot-btn').addEventListener('click', () => {
  if (state.maxGambitSlots >= 5) {
    showToast("Already at maximum 5 Gambit Slots!", "🏺");
    return;
  }
  const slotCost = getActiveDifficulty().slotExpandCost || 4;
  if (state.gold < slotCost) {
    showToast(`Need $${slotCost} Gold to unlock +1 Gambit Slot!`, "🪙");
    return;
  }
  state.gold -= slotCost;
  state.maxGambitSlots = Math.min(5, state.maxGambitSlots + 1);
  document.getElementById('bazaar-swap-prompt').classList.add('hidden');
  sfx.playCoinDing();
  showToast(`Unlocked +1 Gambit Slot (${state.maxGambitSlots} total)!`, "🏺");
  renderBazaarStock();
  updateHUD();
});

document.getElementById('bazaar-swap-cancel').addEventListener('click', () => {
  document.getElementById('bazaar-swap-prompt').classList.add('hidden');
});

// Banish / Prune a random basic card from deck (Difficulty-Scaled)
document.getElementById('prune-card-btn').addEventListener('click', () => {
  const cost = getActiveDifficulty().banishCost;
  if (state.gold < cost) {
    showToast(`Need $${cost} Gold to banish a card!`, "🪙");
    return;
  }
  if (state.masterDeck.length <= 1) {
    showToast("Keep at least 1 card in your stockpile!", "⚠️");
    return;
  }
  state.gold -= cost;
  const removed = state.masterDeck.shift();
  sfx.playCardChime();
  renderBazaarStock();
  updateHUD();
  showToast(`Banished ${CARD_CATALOG[removed] ? CARD_CATALOG[removed].name : 'Card'} from your stockpile!`, "✂️");
});

document.getElementById('next-floor-btn').addEventListener('click', () => {
  document.getElementById('bazaar-modal').classList.add('hidden');
  state.floorIdx = Math.min(TOTAL_FLOORS - 1, state.floorIdx + 1);
  startFloorMatch(true);
});

document.getElementById('skip-boss-relic-btn').addEventListener('click', () => {
  state.gold += 8;
  sfx.playCoinDing();
  document.getElementById('boss-chest-modal').classList.add('hidden');
  showToast("Salvaged Boss Chest for +$8 Gold!", "🪙");
  openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
});

function showGameOverModal(isWin, heading, body) {
  document.getElementById('gameover-emoji').textContent = isWin ? '🏆' : '💀';
  document.getElementById('gameover-tag').textContent = isWin ? 'ASCENSION COMPLETE' : `FLOOR ${state.floorIdx + 1} DEFEAT`;
  document.getElementById('gameover-heading').textContent = heading;
  document.getElementById('gameover-body').textContent = body;
  document.getElementById('gameover-modal').classList.remove('hidden');
}

// ============================================================================
// 5. SUBTERRANEAN SETTINGS MODAL, FULLSCREEN & RUN RESET LOGIC
// ============================================================================
function isFullscreenActive() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function toggleFullscreenMode() {
  const docEl = document.documentElement;
  if (!isFullscreenActive()) {
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
    if (req) {
      Promise.resolve(req.call(docEl)).catch(() => {
        showToast("Fullscreen blocked by browser", "🖥️");
      });
    } else {
      showToast("Fullscreen API not supported on this device", "🖥️");
    }
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (exit) {
      Promise.resolve(exit.call(document)).catch(() => {});
    }
  }
}

function styleTogglePill(btnEl, isEnabled) {
  if (!btnEl) return;
  btnEl.textContent = isEnabled ? 'ON' : 'OFF';
  btnEl.className = isEnabled
    ? 'px-3 py-1.5 rounded-xl font-mono-code font-bold text-[11px] shrink-0 active:scale-95 transition bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 shadow-inner'
    : 'px-3 py-1.5 rounded-xl font-mono-code font-bold text-[11px] shrink-0 active:scale-95 transition bg-stone-800 border border-white/10 text-slate-400';
}

function syncSettingsUI() {
  styleTogglePill(document.getElementById('toggle-fullscreen-btn'), isFullscreenActive());
  styleTogglePill(document.getElementById('toggle-slot-callouts-btn'), userSettings.slotCalloutsEnabled);
  styleTogglePill(document.getElementById('toggle-floating-pops-btn'), userSettings.floatingPopsEnabled);
  styleTogglePill(document.getElementById('toggle-music-btn'), userSettings.musicEnabled);
  styleTogglePill(document.getElementById('toggle-sfx-btn'), userSettings.sfxEnabled);
  styleTogglePill(document.getElementById('toggle-haptics-btn'), userSettings.hapticsEnabled);

  document.querySelectorAll('.dur-mode-btn').forEach(btn => {
    const active = btn.getAttribute('data-dur') === userSettings.notificationSpeed;
    btn.className = `dur-mode-btn py-1.5 px-2 rounded-xl border text-[10px] font-mono-code font-bold transition active:scale-95 ${
      active
        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
        : 'bg-stone-950/70 text-slate-300 border-white/10'
    }`;
  });

  document.querySelectorAll('.drop-mode-btn').forEach(btn => {
    const active = btn.getAttribute('data-drop') === userSettings.touchDropMode;
    btn.className = `drop-mode-btn py-1.5 px-2 rounded-xl border text-[10px] font-mono-code font-bold transition active:scale-95 ${
      active
        ? 'bg-teal-400 text-stone-950 border-teal-300 shadow-md'
        : 'bg-stone-950/70 text-slate-300 border-white/10'
    }`;
  });

  const muteIconEl = document.getElementById('mute-icon');
  if (muteIconEl) {
    muteIconEl.setAttribute('data-lucide', sfx.muted ? 'volume-x' : 'volume-2');
    lucide.createIcons();
  }
}

function openSettingsModal() {
  bgm.pauseForSettings();
  syncSettingsUI();
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
  bgm.resumeFromSettings();
}

document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
const fsBtn = document.getElementById('toggle-fullscreen-btn');
if (fsBtn) {
  fsBtn.addEventListener('click', toggleFullscreenMode);
}
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evtName => {
  document.addEventListener(evtName, () => {
    updateCameraAspect();
    syncSettingsUI();
  });
});

document.getElementById('close-settings-btn').addEventListener('click', closeSettingsModal);
document.getElementById('done-settings-btn').addEventListener('click', closeSettingsModal);
document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target.id === 'settings-modal') closeSettingsModal();
});

document.getElementById('dismiss-all-callouts-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.playHoverTick();
  dismissAllActiveNotifications();
});

document.getElementById('toggle-slot-callouts-btn').addEventListener('click', () => {
  userSettings.slotCalloutsEnabled = !userSettings.slotCalloutsEnabled;
  if (!userSettings.slotCalloutsEnabled) {
    document.querySelectorAll('.slot-bonus-callout').forEach(el => el.remove());
    updateDismissAllCalloutsButton();
  }
  sfx.playHoverTick();
  saveUserSettings();
});

document.getElementById('toggle-floating-pops-btn').addEventListener('click', () => {
  userSettings.floatingPopsEnabled = !userSettings.floatingPopsEnabled;
  sfx.playHoverTick();
  saveUserSettings();
});

document.querySelectorAll('.dur-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    userSettings.notificationSpeed = btn.getAttribute('data-dur');
    sfx.playHoverTick();
    saveUserSettings();
  });
});

document.querySelectorAll('.drop-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    userSettings.touchDropMode = btn.getAttribute('data-drop');
    sfx.playHoverTick();
    saveUserSettings();
    showToast(
      userSettings.touchDropMode === 'instant'
        ? "Single-Tap Instant Drop Enabled"
        : "Two-Tap Confirm Drop Enabled",
      "👆",
      2800
    );
  });
});

document.getElementById('toggle-music-btn').addEventListener('click', () => {
  userSettings.musicEnabled = !userSettings.musicEnabled;
  sfx.playHoverTick();
  saveUserSettings();
  if (!userSettings.musicEnabled) {
    bgm.stop();
    showToast("8-Bit Chiptune Music: OFF", "🔇", 2500);
  } else {
    showToast("8-Bit Chiptune Music: ON (Resumes on Save & Resume)", "🎵", 2500);
  }
});

document.getElementById('toggle-sfx-btn').addEventListener('click', () => {
  sfx.setMuted(userSettings.sfxEnabled);
  if (userSettings.sfxEnabled) sfx.playHoverTick();
});

document.getElementById('toggle-haptics-btn').addEventListener('click', () => {
  userSettings.hapticsEnabled = !userSettings.hapticsEnabled;
  saveUserSettings();
  if (userSettings.hapticsEnabled) triggerHaptic(25);
});

document.getElementById('settings-reset-run-btn').addEventListener('click', () => {
  closeSettingsModal();
  dismissAllActiveNotifications();
  initNewRun();
  startFloorMatch(true);
  showToast("Fresh Ascension Run Started (Boss Order Shuffled)!", "🔥");
});

document.getElementById('restart-btn').addEventListener('click', () => {
  dismissAllActiveNotifications();
  initNewRun();
  startFloorMatch(true);
  showToast("Fresh Ascension Run Started (Boss Order Shuffled)!", "🔥");
});

document.getElementById('retry-floor-btn').addEventListener('click', () => {
  document.getElementById('gameover-modal').classList.add('hidden');
  dismissAllActiveNotifications();
  state._isRetryingFloor = true;
  restoreFloorStartCheckpoint();
  startFloorMatch(true);
  showToast("Floor Reset — Start-of-Floor Loadout Restored!", "🔄");
});

document.getElementById('new-ascension-btn').addEventListener('click', () => {
  document.getElementById('gameover-modal').classList.add('hidden');
  document.getElementById('restart-btn').click();
});

document.getElementById('difficulty-badge').addEventListener('click', () => {
  sfx.playHoverTick();
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('settings-change-difficulty-btn').addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('settings-modal').classList.add('hidden');
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('cancel-difficulty-modal-btn').addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('difficulty-modal').classList.add('hidden');
  bgm.resumeFromSettings();
});
