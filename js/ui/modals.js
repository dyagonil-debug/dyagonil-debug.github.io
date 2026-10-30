// Remove legacy #prune-card-btn if still present in any cached DOM template
document.getElementById('prune-card-btn')?.remove();

// Reroll Shop Stock Button
document.getElementById('reroll-shop-btn')?.addEventListener('click', () => {
  const rerollCost = getActiveDifficulty().rerollCost || 4;
  if (state.gold < rerollCost) {
    showToast(`Need $${rerollCost} Gold to Reroll Wares!`, '⚠️');
    return;
  }
  state.gold -= rerollCost;
  sfx.playCardCast();
  generateBazaarStock();
  renderBazaarStock();
  updateHUD();
});

// Return to Game / Descend to Next Floor Button
document.getElementById('next-floor-btn')?.addEventListener('click', () => {
  document.getElementById('bazaar-modal')?.classList.add('hidden');
  state.floorIdx = Math.min(TOTAL_FLOORS - 1, state.floorIdx + 1);
  startFloorMatch();
});

// Boss Chest Salvage (+8 Gold) Button
document.getElementById('skip-boss-relic-btn')?.addEventListener('click', () => {
  state.gold += 8;
  sfx.playCoinDing();
  document.getElementById('boss-chest-modal')?.classList.add('hidden');
  showToast('Salvaged Boss Chest for +$8 Gold!', '🪙');
  openUndergroundBazaar(
    state.pendingVictoryPayout.totalEarned,
    state.pendingVictoryPayout.speedBonus
  );
});

// Roulette Modal Open / Close / Back Buttons
document.getElementById('open-roulette-btn')?.addEventListener('click', () => {
  sfx.playHoverTick();
  updateRouletteButtonsUI();
  document.getElementById('roulette-modal')?.classList.remove('hidden');
});

function closeRouletteModal() {
  if (typeof rouletteSim !== 'undefined' && rouletteSim && rouletteSim.isSpinning) {
    showToast('Wait for the silver ball to settle in a pocket!', '🎡');
    return;
  }
  document.getElementById('roulette-modal')?.classList.add('hidden');
  renderBazaarStock();
  updateHUD();
}

document.getElementById('close-roulette-btn')?.addEventListener('click', closeRouletteModal);
document.getElementById('done-roulette-btn')?.addEventListener('click', closeRouletteModal);

// Game Over Modal Retry & New Run Buttons
document.getElementById('retry-floor-btn')?.addEventListener('click', () => {
  document.getElementById('gameover-modal')?.classList.add('hidden');
  state._isRetryingFloor = true;
  startFloorMatch();
});

document.getElementById('new-ascension-btn')?.addEventListener('click', () => {
  document.getElementById('gameover-modal')?.classList.add('hidden');
  initNewRun();
  startFloorMatch();
});
