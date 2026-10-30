// ============================================================================
// MODALS, BAZAAR ECONOMY, BOSS CHEST, DIFFICULTY & SETTINGS UI (js/ui/modals.js)
// Complete Drop-In Replacement for v24+
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
    #floor-intro-overlay.floor-intro-fadeout {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.58s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #floor-intro-overlay.floor-intro-fadeout #floor-intro-card {
      transform: translateY(-12px) scale(1.04);
      opacity: 0;
      transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.48s ease-in;
    }
  `;
  document.head.appendChild(style);
})();

// Remove legacy Banish / Prune Card UI element if present in any cached DOM template
document.getElementById('prune-card-btn')?.remove();

// Helper for crisp inline HUD SVG icons
function modalHudIcon(filename, extraClass = '') {
  const cls = ['c4-item-icon', extraClass].filter(Boolean).join(' ');
  return `<img class="${cls}" src="./assets/icons/hud/${filename}" alt="" aria-hidden="true" loading="eager" decoding="async">`;
}

// Sanitize state.gold if a previous NaN ever occurred
function ensureValidGold() {
  if (typeof state !== 'undefined' && (!Number.isFinite(state.gold) || Number.isNaN(state.gold))) {
    const diff = typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null;
    state.gold = (diff && Number.isFinite(diff.startingGold)) ? diff.startingGold : 6;
  }
}

// ============================================================================
// 0. FLOOR-START LOADOUT CHECKPOINT SYSTEM (Preserves Loadout on Floor Retry)
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
  // Ensure legacy #prune-card-btn is removed if present
  document.getElementById('prune-card-btn')?.remove();
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
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('mana.svg', 'c4-item-icon-sm')} ${tier.manaRateLabel} (Max ${tier.startingMaxMana})</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('cards.svg', 'c4-item-icon-sm')} ${tier.drawRateLabel} (${tier.startingHandSize} Hand)</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10 flex items-center gap-1">${modalHudIcon('stability.svg', 'c4-item-icon-sm')} ${tier.stabilityOffset >= 0 ? '+' + tier.stabilityOffset : tier.stabilityOffset} Stability</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">${Math.round(tier.bazaarPriceMultiplier * 100)}% Bazaar</span>
          <span class="px-2 py-0.5 rounded-lg bg-black/45 border border-white/10">AI D${tier.depthByFloor[0]}–D${tier.depthByFloor[8]}</span>
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
  document.getElementById('difficulty-modal')?.classList.remove('hidden');
}

function selectDifficultyAndStart(tierId) {
  state.difficulty = (typeof DIFFICULTY_TIERS !== 'undefined' && DIFFICULTY_TIERS[tierId]) ? tierId : 'MEDIUM';
  try {
    if (typeof DIFFICULTY_STORAGE_KEY !== 'undefined') {
      localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty);
    }
  } catch (e) {}
  document.getElementById('difficulty-modal')?.classList.add('hidden');
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

document.getElementById('settings-change-difficulty-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('settings-modal')?.classList.add('hidden');
  bgm.pauseForSettings();
  openDifficultyModal(true);
});

document.getElementById('cancel-difficulty-modal-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  document.getElementById('difficulty-modal')?.classList.add('hidden');
  bgm.resumeFromSettings();
});

// ============================================================================
// 2. INSPECTOR SHEET MODAL (Gambit, Boss, Milestone, Stability & Slot Legend)
// ============================================================================
function openGambitSheet(gambitId) {
  const g = GAMBIT_CATALOG[gambitId];
  if (!g) return;
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');

  if (iconEl) iconEl.innerHTML = g.icon;
  if (catEl) catEl.textContent = 'Synergistic Gambit (Relic)';
  if (titleEl) titleEl.innerHTML = g.name;
  if (descEl) descEl.innerHTML = g.desc;
  if (statusEl) {
    statusEl.textContent = (gambitId === 'obsidian_cat' && state.catNineLivesUsed)
      ? 'Nine Lives Used This Floor (+$2/shatter still active)'
      : 'Active Synergy';
  }

  const sellBtn = document.getElementById('sell-gambit-btn');
  if (sellBtn) {
    sellBtn.classList.remove('hidden');
    sellBtn.onclick = () => {
      ensureValidGold();
      state.gambits = state.gambits.filter((id) => id !== gambitId);
      state.gold += 3;
      sfx.playCoinDing();
      document.getElementById('info-sheet-modal')?.classList.add('hidden');
      updateHUD();
      showToast(`Sold ${g.name} for +$3 Gold!`, modalHudIcon('coin.svg'));
    };
  }
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
}

document.getElementById('boss-info-btn')?.addEventListener('click', () => {
  const f = getFloorConfig(state.floorIdx);
  const topo = state.currentTopology || getFloorTopology(state.floorIdx);
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');

  if (iconEl) {
    iconEl.innerHTML = f.isBoss
      ? f.bossArchetype.icon
      : (f.isPreBoss ? topo.icon : `<img class="c4-item-icon c4-item-icon-lg" src="./assets/icons/bosses/sentinel.svg" alt="">`);
  }
  if (catEl) {
    catEl.innerHTML = f.isBoss
      ? `Floor ${f.floor} • ${f.bossArchetype.poolLabel} (${state.bossHp}/${state.bossMaxHp} ${modalHudIcon('heart_full.svg', 'c4-item-icon-sm')} HP)`
      : (f.isPreBoss ? `Floor ${f.floor} Pre-Boss Vanguard` : `Floor ${f.floor} Standard Cavern Sentinel`);
  }
  if (titleEl) titleEl.innerHTML = f.boss;
  if (descEl) {
    descEl.innerHTML = `
      <div>${f.fullRule}</div>
      ${f.isBoss ? `
      <div class="mt-2 p-2 rounded-xl bg-rose-500/15 border border-rose-400/35 text-rose-200">
        <strong>${modalHudIcon('heart_full.svg', 'c4-item-icon-sm')} Multi-Phase Boss Health (${state.bossHp}/${state.bossMaxHp} HP Remaining):</strong><br/>
        <span>Each Connect-4 you score shatters 1 Boss HP (+$2 Gold) and turns the winning token you played into neutral Petrified Stone while play continues!</span>
      </div>` : ''}
      <div class="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-400/30">
        <strong class="text-amber-300">${topo.icon} Board Topology: ${topo.name}</strong><br/>
        <span>${topo.desc}</span>
      </div>
    `;
  }
  if (statusEl) {
    statusEl.innerHTML = f.isBoss
      ? `HP: ${state.bossHp}/${state.bossMaxHp} ${modalHudIcon('heart_full.svg', 'c4-item-icon-sm')} • ${f.telegraph}`
      : `AI Level ${f.floor}/9 (D${f.depth} • ${f.aiPrecisionPct}% IQ) • Next Boss: F${Math.ceil((state.floorIdx + 1) / 3) * 3}`;
  }
  document.getElementById('sell-gambit-btn')?.classList.add('hidden');
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
});

document.getElementById('milestone-info-btn')?.addEventListener('click', () => {
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');

  if (iconEl) iconEl.innerHTML = modalHudIcon('mountain.svg', 'c4-item-icon-lg');
  if (catEl) catEl.textContent = 'Slowed Ascension Progression';
  if (titleEl) titleEl.textContent = 'Earned Power Spike Milestones';
  if (descEl) {
    descEl.innerHTML = `
      <div>• <strong>Floors 1–2 (Humble Start):</strong> 1 Max Mana, 2-Card Hand, 3-Card Starter Deck, 0 Gambits. Focus on core Connect 4 positioning & Gilded Slots!</div>
      <div>• <strong>Defeat Floor 3 Boss:</strong> Unlocks <strong>2 Max Mana</strong>, <strong>3-Card Hand Size</strong>, <strong>Tactical Reserve Pouch</strong> (+1 Free Anvil Token), <strong>2 Gambit Slots</strong>, and a Free Boss Relic Chest!</div>
      <div>• <strong>Defeat Floor 6 Boss:</strong> Unlocks <strong>3 Max Mana</strong>, <strong>4 Gambit Slots</strong>, <strong>High-Tier Arcane Cards</strong>, and a Free Boss Relic Chest!</div>
      <div>• <strong>Defeat Floor 9 Final Boss:</strong> Complete the Subterranean Ascension!</div>
    `;
  }
  if (statusEl) {
    statusEl.textContent = `Current Capacities: ${state.maxMana} Max Mana • ${state.handSize} Hand Size • ${state.maxGambitSlots} Gambit Slots`;
  }
  document.getElementById('sell-gambit-btn')?.classList.add('hidden');
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
});

document.getElementById('stability-info-btn')?.addEventListener('click', () => {
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');

  if (iconEl) iconEl.innerHTML = modalHudIcon('stability.svg', 'c4-item-icon-lg');
  if (catEl) catEl.textContent = 'Cavern Collapse Mechanic';
  if (titleEl) titleEl.textContent = `Seismic Stability: ${state.stability} Turns`;
  if (descEl) {
    descEl.textContent =
      'Inspired by Gambonanza: Every turn decreases Seismic Stability by 1. Winning before Stability hits 0 awards +$1 Bonus Gold per remaining turn! If Stability reaches 0, Stalactite Collapse drops petrified stones onto the board each round.';
  }
  if (statusEl) {
    statusEl.textContent = `Current Speed Bonus: +$${Math.max(0, state.stability)} Gold`;
  }
  document.getElementById('sell-gambit-btn')?.classList.add('hidden');
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
});

document.getElementById('legend-btn')?.addEventListener('click', () => {
  const iconEl = document.getElementById('sheet-icon');
  const catEl = document.getElementById('sheet-category');
  const titleEl = document.getElementById('sheet-title');
  const descEl = document.getElementById('sheet-desc');
  const statusEl = document.getElementById('sheet-status');

  if (iconEl) iconEl.innerHTML = modalHudIcon('sparkle.svg', 'c4-item-icon-lg');
  if (catEl) catEl.textContent = '3D Board Enchantments';
  if (titleEl) titleEl.textContent = 'Enchanted Ring Legend';
  if (descEl) {
    descEl.innerHTML = `
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span><strong>Gilded Slot (Gold Ring):</strong> Awards +$3 Gold immediately when filled.</div>
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span><strong>Volatile Spice (Red Ring):</strong> Grants +1 Mana & chars 1 adjacent AI token.</div>
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-500 inline-block"></span><strong>Spider Web (Purple Ring):</strong> Petrifies AI tokens into neutral stone; gives you +1 Stability.</div>
      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-400 inline-block"></span><strong>Amplifier (Cyan Ring):</strong> Upgrades token into a Wild Prismatic Token +$2 Gold!</div>
    `;
  }
  if (statusEl) {
    statusEl.textContent = `${state.persistentEnchantCount} Enchanted Slots Spawn Per Floor`;
  }
  document.getElementById('sell-gambit-btn')?.classList.add('hidden');
  document.getElementById('info-sheet-modal')?.classList.remove('hidden');
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
function getRouletteSpinCost() {
  return state.rouletteSpinsThisFloor === 0 ? 0 : state.rouletteSpinsThisFloor * 5;
}

function updateRouletteButtonsUI() {
  ensureValidGold();
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

function openBossVictoryChest(floorData) {
  const milestoneBox = document.getElementById('boss-milestone-box');
  if (state.floorIdx === 2) {
    // Floor 3 Boss defeated -> Unlock Act II capabilities
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.max(state.maxGambitSlots, 2);
    state.reservePouchUnlocked = true;
    state.reservePouch.push('anvil');
    if (milestoneBox) {
      milestoneBox.innerHTML = `
        <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
        <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
        <div>${modalHudIcon('backpack.svg', 'c4-item-icon-sm')} <strong>Tactical Reserve Pouch Unlocked:</strong> +1 Free <strong>Heavy Anvil Token</strong></div>
        <div>${modalHudIcon('chest.svg', 'c4-item-icon-sm')} <strong>Gambit Capacity Expanded:</strong> Up to <strong>${state.maxGambitSlots} Relic Slots</strong></div>
      `;
    }
  } else {
    // Floor 6 Boss defeated -> Unlock Act III mastery & Late-Game Tier-3 Cards
    state.maxMana = Math.max(state.maxMana, state.maxMana + 1);
    state.handSize = Math.min(5, state.handSize + 1);
    state.maxGambitSlots = Math.min(5, Math.max(state.maxGambitSlots, 4));
    state.highTierCardsUnlocked = true;
    state.reservePouch.push('wild');
    if (milestoneBox) {
      milestoneBox.innerHTML = `
        <div>${modalHudIcon('mana.svg', 'c4-item-icon-sm')} <strong>Max Mana Expanded:</strong> Now <strong>${state.maxMana} Mana</strong></div>
        <div>${modalHudIcon('cards.svg', 'c4-item-icon-sm')} <strong>Opening Hand Expanded:</strong> Draw <strong>${state.handSize} Cards</strong> per floor</div>
        <div>${modalHudIcon('trophy.svg', 'c4-item-icon-sm')} <strong>Tier-3 Late-Game Mastery:</strong> <strong>Brimstone Laser</strong>, <strong>Midas Eye</strong> & <strong>Sacred Heart</strong> unlocked + Free <strong>Wild Token</strong>!</div>
      `;
    }
  }

  const choicesEl = document.getElementById('boss-relic-choices');
  if (choicesEl) {
    choicesEl.innerHTML = '';
    const unowned = shuffle(Object.keys(GAMBIT_CATALOG).filter((id) => !state.gambits.includes(id))).slice(0, 3);

    unowned.forEach((gId) => {
      const g = GAMBIT_CATALOG[gId];
      const btn = document.createElement('button');
      btn.className = 'arcane-card p-3 rounded-2xl flex items-center justify-between gap-3 text-left active:scale-98 transition';
      btn.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-2xl shrink-0">${g.icon}</span>
          <div class="min-w-0">
            <div class="font-display font-bold text-xs text-white truncate">${g.name}</div>
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
        document.getElementById('boss-chest-modal')?.classList.add('hidden');
        showToast(`Claimed Boss Relic: ${g.name}!`, g.icon);
        updateHUD();
        openUndergroundBazaar(state.pendingVictoryPayout.totalEarned, state.pendingVictoryPayout.speedBonus);
      });
      choicesEl.appendChild(btn);
    });
  }

  document.getElementById('boss-chest-modal')?.classList.remove('hidden');
}

function renderBazaarEquippedGambits() {
  const slotsLabel = document.getElementById('bazaar-gambit-slots-label');
  const expandBtn = document.getElementById('bazaar-expand-slot-btn');
  const strip = document.getElementById('bazaar-equipped-gambits');
  if (!strip || !slotsLabel) return;

  ensureValidGold();
  slotsLabel.textContent = `Equipped Gambits (${state.gambits.length}/${state.maxGambitSlots} Slots)`;
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
    strip.innerHTML = `<span class="text-[10px] font-mono-code text-slate-400">No Gambits equipped — Open slot ready!</span>`;
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
      <button type="button" class="px-1.5 py-0.5 rounded bg-rose-500/30 border border-rose-400/40 text-[9px] font-mono-code font-bold text-rose-200 active:scale-95">
        Sell +$3
      </button>
    `;
    pill.querySelector('button').addEventListener('click', (e) => {
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
  // Use .innerHTML so item.icon (<img class="c4-item-icon">) renders as a vector icon instead of raw text
  if (titleEl) {
    titleEl.innerHTML = `Equip ${item.icon} ${item.name} ($${item.price})`;
  }
  if (descEl) {
    descEl.textContent = `Your Gambit slots are full (${state.gambits.length}/${state.maxGambitSlots}). Swap out an equipped Gambit (adds +$3 resale value toward this purchase!) or expand your slots:`;
  }
  optionsEl.innerHTML = '';

  // Option A: Swap with any currently equipped Gambit (net cost = item.price - 3)
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
        <span>${modalHudIcon('reset.svg', 'c4-item-icon-sm')}</span>
        <span class="truncate">Replace <strong>${g.icon} ${g.name}</strong> (+$3 Trade-In)</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-mono-code font-bold text-[10px] shrink-0">
        Net $${netCost}
      </span>
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

  // Option B: Expand +1 Gambit Slot & Equip immediately (slotExpandCost + item.price)
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
        <span class="truncate">Unlock +1 Gambit Slot & Equip Both</span>
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
    const ownedCopies = (item.type === 'card' && typeof countCardCopiesInInventory === 'function')
      ? countCardCopiesInInventory(item.id)
      : 0;
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
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-display font-bold text-xs text-white truncate">${item.name}</span>
            ${item.tier ? `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold uppercase shrink-0 ${
              item.tier >= 3
                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                : (item.tier === 2
                  ? 'bg-teal-500/25 text-teal-200 border border-teal-400/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/35')
            }">T${item.tier}</span>` : ''}
            ${item.type === 'card' ? `<span class="px-1.5 py-0.2 rounded text-[8px] font-mono-code font-bold bg-stone-800 text-amber-300 border border-amber-400/30 shrink-0">${ownedCopies > 0 ? `Stockpiled: ×${ownedCopies}` : '1-Use Consumable'}</span>` : ''}
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

  const isTierAllowed = (tier) => {
    if (tier === 0) return false;
    if (tier === 2 && !state.highTierCardsUnlocked && state.floorIdx < 2) return false;
    if (tier >= 3 && !state.highTierCardsUnlocked && state.floorIdx < 5) return false;
    return true;
  };

  // 1. Arcane Cards (Never stock curse cards like Dead Weight Stone)
  const allowedCards = Object.keys(CARD_CATALOG).filter((id) => {
    const c = CARD_CATALOG[id];
    const isCurse = (typeof isStackableCurseCard === 'function') ? isStackableCurseCard(id) : (id === 'dead_weight');
    if (!c || c.tier === 0 || isCurse) return false;
    return isTierAllowed(c.tier ?? 1);
  });
  if (allowedCards.length > 0) {
    const shuffledCards = shuffle(allowedCards);
    const cardSlotsToStock = Math.min(2, shuffledCards.length);
    for (let s = 0; s < cardSlotsToStock; s++) {
      const cId = shuffledCards[s];
      const card = CARD_CATALOG[cId];
      items.push({
        type: 'card',
        id: card.id,
        tier: card.tier || 1,
        name: `Card: ${card.name}`,
        icon: card.icon,
        desc: card.desc,
        price: getScaledPrice(card.price),
        bought: false
      });
    }
  }

  // 2. Tactical Reserve Token
  if (state.reservePouchUnlocked || state.floorIdx >= 2) {
    const allowedReserves = Object.keys(RESERVE_CATALOG).filter((id) => isTierAllowed(RESERVE_CATALOG[id].tier || 1));
    const rPool = allowedReserves.length > 0 ? allowedReserves : Object.keys(RESERVE_CATALOG);
    const rId = rPool[Math.floor(Math.random() * rPool.length)];
    const rTok = RESERVE_CATALOG[rId];
    items.push({
      type: 'reserve',
      id: rTok.id,
      tier: rTok.tier || 1,
      name: rTok.name,
      icon: rTok.icon,
      desc: rTok.desc,
      price: getScaledPrice(rTok.price),
      bought: false
    });
  } else {
    items.push({
      type: 'unlock_pouch',
      id: 'early_pouch',
      tier: 1,
      name: "Early Reserve Pouch + Fool's Penny",
      icon: modalHudIcon('backpack.svg'),
      desc: "Unlock the Tactical Reserve Token Pouch early and receive +1 Heavy Anvil & +1 Fool's Counterfeit Penny!",
      price: getScaledPrice(7),
      bought: false
    });
  }

  // 3. Unowned Gambit Relic
  const allowedGambits = Object.keys(GAMBIT_CATALOG).filter(
    (id) => !state.gambits.includes(id) && isTierAllowed(GAMBIT_CATALOG[id].tier || 2)
  );
  const fallbackGambits = Object.keys(GAMBIT_CATALOG).filter((id) => !state.gambits.includes(id));
  const gPool = allowedGambits.length > 0 ? allowedGambits : fallbackGambits;
  if (gPool.length > 0) {
    const gId = gPool[Math.floor(Math.random() * gPool.length)];
    const g = GAMBIT_CATALOG[gId];
    items.push({
      type: 'gambit',
      id: g.id,
      tier: g.tier || 2,
      name: g.name,
      icon: g.icon,
      desc: g.desc,
      price: getScaledPrice(g.price),
      bought: false
    });
  }

  // 4. Permanent Run Vessel Upgrade
  if (state.maxGambitSlots < 5 && state.floorIdx >= 1) {
    items.push({
      type: 'gambit_slot_upgrade',
      id: 'slot_plus',
      name: 'Carved Relic Socket (+1 Gambit Slot)',
      icon: modalHudIcon('chest.svg'),
      desc: `Permanently expands your active Gambit Relic capacity from ${state.maxGambitSlots} to ${state.maxGambitSlots + 1} slots!`,
      price: getScaledPrice(10),
      bought: false
    });
  } else {
    items.push({
      type: 'enchant_upgrade',
      id: 'enchant_plus',
      name: 'Enchanted Cavern Sigil (+2 Slots)',
      icon: modalHudIcon('sparkle.svg'),
      desc: 'Permanently enchants +2 additional board cells every floor with Gilded, Spice, Web, or Amplifier rings!',
      price: getScaledPrice(8),
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

  // If buying a Gambit when Gambit slots are full, open the inline Swap / Expand prompt
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
    if (typeof addCardToStockpile === 'function') {
      addCardToStockpile(item.id);
    } else {
      state.masterDeck.push(item.id);
    }
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
    summaryEl.textContent =
      'Spin the physics roulette wheel for Jackpots, Relics & Mana—or risk Curses, Gremlins & Cave-Ins!';
  }
  document.getElementById('bazaar-swap-prompt')?.classList.add('hidden');

  updateRouletteButtonsUI();
  generateBazaarStock();
  document.getElementById('bazaar-modal')?.classList.remove('hidden');
}

// Roulette Modal Listeners
document.getElementById('open-roulette-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  updateRouletteButtonsUI();
  document.getElementById('roulette-modal')?.classList.remove('hidden');
});

function closeRouletteModal() {
  if (typeof rouletteSim !== 'undefined' && rouletteSim && rouletteSim.isSpinning) {
    showToast('Wait for the silver ball to settle into a pocket!', modalHudIcon('wheel.svg'));
    return;
  }
  document.getElementById('roulette-modal')?.classList.add('hidden');
  renderBazaarStock();
  updateHUD();
}

document.getElementById('close-roulette-btn')?.addEventListener('click', closeRouletteModal);
document.getElementById('done-roulette-btn')?.addEventListener('click', closeRouletteModal);

// Shop Reroll (Difficulty-Scaled)
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

// Quick +1 Gambit Slot Expansion inside Bazaar
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

// Return to Game / Descend to Next Subterranean Floor Button
document.getElementById('next-floor-btn')?.addEventListener('click', () => {
  document.getElementById('bazaar-modal')?.classList.add('hidden');
  state.floorIdx = Math.min(TOTAL_FLOORS - 1, state.floorIdx + 1);
  startFloorMatch();
});

// Salvage Boss Chest for +$8 Gold & Enter Bazaar
document.getElementById('skip-boss-relic-btn')?.addEventListener('click', () => {
  ensureValidGold();
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

  if (emojiEl) {
    emojiEl.innerHTML = modalHudIcon(isWin ? 'trophy.svg' : 'skull.svg', 'c4-item-icon-lg');
  }
  if (tagEl) tagEl.textContent = isWin ? 'ASCENSION COMPLETE' : `FLOOR ${state.floorIdx + 1} DEFEAT`;
  if (headingEl) headingEl.textContent = heading;
  if (bodyEl) bodyEl.textContent = body;
  if (modalEl) modalEl.classList.remove('hidden');
}

document.getElementById('retry-floor-btn')?.addEventListener('click', () => {
  document.getElementById('gameover-modal')?.classList.add('hidden');
  state._isRetryingFloor = true;
  startFloorMatch();
});

document.getElementById('new-ascension-btn')?.addEventListener('click', () => {
  document.getElementById('gameover-modal')?.classList.add('hidden');
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  initNewRun();
  startFloorMatch();
  showToast('Fresh Ascension Run Started (Boss Order Shuffled)!', modalHudIcon('reset.svg'));
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
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function syncFullscreenUI() {
  const fsBtn = document.getElementById('toggle-fullscreen-btn');
  if (fsBtn) {
    styleTogglePill(fsBtn, isFullscreenActive());
  }
}

function toggleFullScreenCavernMode() {
  const docEl = document.documentElement;
  if (!isFullscreenActive()) {
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
    if (req) {
      Promise.resolve(req.call(docEl)).then(syncFullscreenUI).catch(() => syncFullscreenUI());
    }
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit) {
      Promise.resolve(exit.call(document)).then(syncFullscreenUI).catch(() => syncFullscreenUI());
    }
  }
}

document.addEventListener('fullscreenchange', syncFullscreenUI);
document.addEventListener('webkitfullscreenchange', syncFullscreenUI);

function syncSettingsUI() {
  syncFullscreenUI();
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
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
});

document.getElementById('toggle-slot-callouts-btn')?.addEventListener('click', () => {
  userSettings.slotCalloutsEnabled = !userSettings.slotCalloutsEnabled;
  if (!userSettings.slotCalloutsEnabled) {
    document.querySelectorAll('.slot-bonus-callout').forEach((el) => el.remove());
    if (typeof updateDismissAllCalloutsButton === 'function') updateDismissAllCalloutsButton();
  }
  sfx.playHoverTick();
  saveUserSettings();
});

document.getElementById('toggle-floating-pops-btn')?.addEventListener('click', () => {
  userSettings.floatingPopsEnabled = !userSettings.floatingPopsEnabled;
  sfx.playHoverTick();
  saveUserSettings();
});

document.querySelectorAll('.dur-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    userSettings.notificationSpeed = btn.getAttribute('data-dur');
    sfx.playHoverTick();
    saveUserSettings();
  });
});

document.querySelectorAll('.drop-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    userSettings.touchDropMode = btn.getAttribute('data-drop');
    sfx.playHoverTick();
    saveUserSettings();
    showToast(
      userSettings.touchDropMode === 'instant'
        ? 'Single-Tap Instant Drop Enabled'
        : 'Two-Tap Confirm Drop Enabled',
      modalHudIcon('touch.svg'),
      2800
    );
  });
});

document.getElementById('toggle-music-btn')?.addEventListener('click', () => {
  userSettings.musicEnabled = !userSettings.musicEnabled;
  sfx.playHoverTick();
  saveUserSettings();
  if (!userSettings.musicEnabled) {
    bgm.stop();
    showToast('8-Bit Chiptune Music: OFF', modalHudIcon('muted.svg'), 2500);
  } else {
    showToast('8-Bit Chiptune Music: ON (Resumes on Save & Resume)', modalHudIcon('music.svg'), 2500);
  }
});

document.getElementById('toggle-sfx-btn')?.addEventListener('click', () => {
  sfx.setMuted(userSettings.sfxEnabled);
  if (userSettings.sfxEnabled) sfx.playHoverTick();
});

document.getElementById('toggle-haptics-btn')?.addEventListener('click', () => {
  userSettings.hapticsEnabled = !userSettings.hapticsEnabled;
  saveUserSettings();
  if (userSettings.hapticsEnabled && typeof triggerHaptic === 'function') triggerHaptic(25);
});

document.getElementById('settings-reset-run-btn')?.addEventListener('click', () => {
  closeSettingsModal();
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  initNewRun();
  startFloorMatch();
  showToast('Fresh Ascension Run Started (Boss Order Shuffled)!', modalHudIcon('reset.svg'));
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  if (typeof dismissAllActiveNotifications === 'function') dismissAllActiveNotifications();
  initNewRun();
  startFloorMatch();
  showToast('Fresh Ascension Run Started (Boss Order Shuffled)!', modalHudIcon('reset.svg'));
});
