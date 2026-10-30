// ============================================================================
// 14. PLAYABLE INTERACTIVE TUTORIAL ENGINE (js/ui/tutorial.js)
// Guided 5-stage playable "Training Grotto" that leads directly into gameplay
// ============================================================================

const PLAYABLE_TUTORIAL_STEPS = [
  {
    id: 'drop_enchanted_slot',
    icon: '🪙',
    badge: 'TRAINING GROTTO • OBJECTIVE 1 OF 4',
    title: 'Aim & Claim a Gilded Slot',
    targetSelector: null,
    calloutPosition: 'top',
    promptText: '👉 Drop in Col 2',
    expectedAction: {
      type: 'DROP_STANDARD',
      col: 1, // 0-indexed Column 2
      wrongColToast: 'Aim for Column 2 to land on the glowing Gold Ring (+$3 Gold)!'
    },
    body: `
      <p>You have two <strong>Amber Tokens</strong> at the bottom of Columns 1 &amp; 2, and a glowing <strong class="text-amber-300">Gilded Slot (+$3 Gold)</strong> sits right above Column 2.</p>
      <p class="text-teal-300 font-semibold">🎯 Action: Tap or drag to <strong>Column 2</strong> on the 3D board and drop your token into the Gold Ring!</p>
    `
  },
  {
    id: 'cast_pickaxe_card',
    icon: '⛏️',
    badge: 'TRAINING GROTTO • OBJECTIVE 2 OF 4',
    title: 'Cast an Arcane Card (Free Action!)',
    targetSelector: '#hand-container',
    calloutPosition: 'top',
    promptText: '👉 Cast Pickaxe on Col 3',
    expectedAction: {
      type: 'CAST_CARD',
      cardId: 'pickaxe',
      col: 2, // 0-indexed Column 3
      wrongCardToast: 'Select ⛏️ Spelunker\'s Pickaxe from your hand first!',
      wrongColToast: 'Cast ⛏️ Spelunker\'s Pickaxe on Column 3 to shatter the Petrified Stone!'
    },
    body: `
      <p>A neutral <strong>Petrified Stone</strong> in <strong>Column 3</strong> is blocking your horizontal 4-in-a-row! Casting Arcane Cards costs <strong>⚡ Mana</strong> and <em>does not end your turn</em>.</p>
      <p class="text-teal-300 font-semibold">🎯 Action: Tap <strong>⛏️ Spelunker's Pickaxe</strong> in your bottom hand, then tap <strong>Column 3</strong> to shatter the stone!</p>
    `
  },
  {
    id: 'deploy_anvil_reserve',
    icon: '⚓',
    badge: 'TRAINING GROTTO • OBJECTIVE 3 OF 4',
    title: 'Deploy a Tactical Reserve Token',
    targetSelector: '#reserve-pouch-container',
    calloutPosition: 'top',
    promptText: '👉 Drop Anvil in Col 4',
    expectedAction: {
      type: 'DROP_RESERVE',
      reserveId: 'anvil',
      col: 3, // 0-indexed Column 4
      wrongReserveToast: 'Tap the ⚓ Heavy Anvil Token in your Reserve Pouch above your hand!',
      wrongColToast: 'Drop the ⚓ Heavy Anvil into Column 4 to crush the AI token at the bottom!'
    },
    body: `
      <p>Notice how shattering that stone triggered your <strong class="text-amber-300">🐈‍⬛ Obsidian Cat Gambit (+$2 Gold)</strong>! Next, an AI token in <strong>Column 4</strong> is blocking your bottom line.</p>
      <p class="text-rose-300 font-semibold">🎯 Action: Tap the <strong>⚓ Heavy Anvil</strong> in your Reserve Pouch, then drop it into <strong>Column 4</strong> to crush the AI token beneath it!</p>
    `
  },
  {
    id: 'win_connect_four',
    icon: '🏆',
    badge: 'TRAINING GROTTO • OBJECTIVE 4 OF 4',
    title: 'Complete Your Connect 4!',
    targetSelector: null,
    calloutPosition: 'top',
    promptText: '👉 Drop in Col 3 to Win!',
    expectedAction: {
      type: 'ANY_DROP_WIN',
      col: 2, // 0-indexed Column 3
      wrongColToast: 'Drop your token into Column 3 to connect 4 across the bottom row!'
    },
    body: `
      <p>Your Heavy Anvil crushed the AI blocker and claimed the bottom of Column 4! You now hold <strong>Columns 1, 2, and 4</strong> along the bottom row.</p>
      <p class="text-amber-300 font-semibold">🎯 Action: Drop your token (or 💎 Wild Token) into <strong>Column 3</strong> to score Connect 4 and clear the floor!</p>
    `
  },
  {
    id: 'tutorial_complete',
    icon: '🎉',
    badge: 'TRAINING COMPLETE • READY FOR DELVE',
    title: 'Grotto Cleared & Stability Bonus!',
    targetSelector: ['#gold-badge', '#stability-info-btn'],
    calloutPosition: 'bottom',
    promptText: 'Continue to Game →',
    expectedAction: null,
    body: `
      <p><strong>Victory!</strong> Every remaining turn on your <strong class="text-orange-300">🌋 Seismic Stability</strong> timer converts into <strong>+$1 Speed Bonus Gold</strong> for the <strong>Underground Bazaar</strong>.</p>
      <p class="text-teal-300 font-semibold">Tap <strong>Continue to Game →</strong> below to jump straight into Floor 1!</p>
    `
  }
];

let tutorialActive = false;
window.tutorialActive = false;
let tutorialStepIdx = 0;
let tutorialHooksInstalled = false;

function setTutorialActiveState(isActive) {
  tutorialActive = !!isActive;
  window.tutorialActive = tutorialActive;
}

function setupPlayableTutorialBoard() {
  setTutorialActiveState(true);
  initNewRun();
  state.floorIdx = 0;
  state.gold = 6;
  state.maxMana = 2;
  state.mana = 2;
  state.handSize = 3;
  state.maxGambitSlots = 2;
  state.gambits = ['obsidian_cat', 'butter_crust'];
  state.reservePouchUnlocked = true;
  state.reservePouch = ['anvil', 'wild'];
  state.masterDeck = ['pickaxe', 'pebble'];

  startFloorMatch(false);
  state.stability = 14;
  state.turn = PLAYER;
  state.busy = false;
  state.gameOver = false;
  state.hand = ['pickaxe', 'pebble'];
  state.drawPile = [];
  state.selectedCardIdx = null;
  state.selectedReserveIdx = null;

  while (tokensGroup.children.length > 0) {
    tokensGroup.remove(tokensGroup.children[0]);
  }
  state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
  state.meshes = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const initialPieces = [
    [0, 0, PLAYER],
    [0, 1, PLAYER],
    [0, 2, STONE],
    [0, 3, AI],
    [0, 5, AI]
  ];
  initialPieces.forEach(([r, c, type]) => {
    spawnTokenMesh(r, c, type);
    if (state.meshes[r] && state.meshes[r][c]) {
      state.meshes[r][c].position.y = state.meshes[r][c].userData.targetY;
      state.meshes[r][c].userData.velY = 0;
    }
  });

  state.enchantGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(ENCHANT_TYPES.NONE));
  state.enchantGrid[1][1] = ENCHANT_TYPES.GILDED;
  state.enchantGrid[2][4] = ENCHANT_TYPES.SPICE;
  state.enchantGrid[2][5] = ENCHANT_TYPES.AMPLIFIER;
  rebuildEnchantmentRings();

  updateHUD();
  updateTelemetryBadges();
  updateColumnPreviewVisual(1);
  setStatusBanner(true, "TRAINING STEP 1: Drop your token into Column 2 (Gilded Slot)!");
}

function computeTutorialTargetRect(targetSelector) {
  const pad = 8;
  if (!targetSelector) {
    const w = Math.min(window.innerWidth * 0.90, 440);
    const h = Math.min(window.innerHeight * 0.40, 310);
    return {
      left: (window.innerWidth - w) / 2,
      top: (window.innerHeight - h) / 2 - 6,
      width: w,
      height: h
    };
  }

  const selectors = Array.isArray(targetSelector) ? targetSelector : [targetSelector];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  selectors.forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  });

  if (minX === Infinity) {
    return { left: 24, top: 80, width: window.innerWidth - 48, height: 120 };
  }

  return {
    left: Math.max(6, minX - pad),
    top: Math.max(6, minY - pad),
    width: Math.min(window.innerWidth - 12, (maxX - minX) + pad * 2),
    height: (maxY - minY) + pad * 2
  };
}

function renderTutorialStep() {
  if (!tutorialActive) return;
  const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
  if (!step) return;

  const tutOverlay = document.getElementById('tutorial-overlay');
  const spotlight = document.getElementById('tutorial-spotlight');
  const card = document.getElementById('tutorial-callout-card');
  const iconEl = document.getElementById('tutorial-step-icon');
  const counterEl = document.getElementById('tutorial-step-counter');
  const titleEl = document.getElementById('tutorial-step-title');
  const bodyEl = document.getElementById('tutorial-step-body');
  const prevBtn = document.getElementById('tutorial-prev-btn');
  const dotsEl = document.getElementById('tutorial-progress-dots');
  const nextPrompt = document.getElementById('tutorial-next-prompt');

  const isPlayableStep = !!step.expectedAction;

  // Allow pointer events straight through to the 3D board & hand during Steps 1-4
  if (tutOverlay) {
    tutOverlay.style.pointerEvents = isPlayableStep ? 'none' : 'auto';
  }
  if (card) {
    card.style.pointerEvents = 'auto';
  }

  if (spotlight) {
    spotlight.style.boxShadow = isPlayableStep
      ? '0 0 0 9999px rgba(5, 4, 9, 0.42), 0 0 26px rgba(251, 191, 36, 0.85), inset 0 0 16px rgba(45, 212, 191, 0.35)'
      : '0 0 0 9999px rgba(5, 4, 9, 0.78), 0 0 26px rgba(251, 191, 36, 0.75), inset 0 0 16px rgba(45, 212, 191, 0.35)';
  }

  const rect = computeTutorialTargetRect(step.targetSelector);
  spotlight.style.left = `${rect.left}px`;
  spotlight.style.top = `${rect.top}px`;
  spotlight.style.width = `${rect.width}px`;
  spotlight.style.height = `${rect.height}px`;

  iconEl.textContent = step.icon;
  counterEl.textContent = step.badge;
  titleEl.textContent = step.title;
  bodyEl.innerHTML = step.body;

  if (prevBtn) {
    prevBtn.style.visibility = 'hidden';
  }

  dotsEl.innerHTML = PLAYABLE_TUTORIAL_STEPS.map((_, i) => `
    <span class="w-1.5 h-1.5 rounded-full transition-all ${
      i === tutorialStepIdx
        ? 'w-4 bg-amber-400 shadow-[0_0_6px_#fbbf24]'
        : (i < tutorialStepIdx ? 'bg-teal-400/70' : 'bg-white/20')
    }"></span>
  `).join('');

  nextPrompt.textContent = step.promptText || 'Continue →';
  nextPrompt.className = isPlayableStep
    ? 'px-3 py-1.5 rounded-xl bg-teal-500/25 border border-teal-400/60 text-teal-200 font-mono-code font-bold text-[10px] uppercase tracking-wider shadow-md'
    : 'px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-mono-code font-bold text-[11px] uppercase tracking-wider shadow-lg animate-pulse cursor-pointer';

  requestAnimationFrame(() => {
    const cardH = card.offsetHeight || 195;
    if (step.calloutPosition === 'top') {
      card.style.top = '12px';
      card.style.bottom = 'auto';
    } else {
      const desiredTop = Math.min(window.innerHeight - cardH - 16, rect.top + rect.height + 14);
      card.style.top = `${Math.max(16, desiredTop)}px`;
      card.style.bottom = 'auto';
    }
  });
}

function runScriptedTutorialAIResponse(aiTargetCol, nextStepDelayMs = 650) {
  state.turn = AI;
  state.busy = true;
  clearActionSelection();
  updateColumnPreviewVisual(-1);
  setStatusBanner(false, "Training Sentinel is responding...");

  setTimeout(() => {
    if (!tutorialActive) return;
    const r = aiEngine.getAvailableRow(state.board, aiTargetCol);
    if (r !== -1) {
      sfx.playWoodClack(false);
      spawnTokenMesh(r, aiTargetCol, AI);
    }
    state.stability = Math.max(1, state.stability - 1);

    setTimeout(() => {
      if (!tutorialActive) return;
      state.turn = PLAYER;
      state.turnNumber++;
      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
      advanceTutorialStep();
    }, nextStepDelayMs);
  }, 480);
}

function installPlayableTutorialHooksOnce() {
  if (tutorialHooksInstalled) return;
  tutorialHooksInstalled = true;

  // 1. Guide card selection during Step 2
  const _origToggleSelectCard = window.toggleSelectCard || toggleSelectCard;
  window.toggleSelectCard = toggleSelectCard = function(idx) {
    if (tutorialActive) {
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      const exp = step && step.expectedAction;
      if (!exp || exp.type !== 'CAST_CARD') {
        showToast("Complete the current board objective first!", "🃏");
        return;
      }
      const clickedCardId = state.hand[idx];
      if (clickedCardId !== exp.cardId) {
        showToast(exp.wrongCardToast || "Select ⛏️ Spelunker's Pickaxe for this step!", "⛏️");
        return;
      }
      _origToggleSelectCard(idx);
      const spotlight = document.getElementById('tutorial-spotlight');
      if (spotlight) {
        const boardRect = computeTutorialTargetRect(null);
        spotlight.style.left = `${boardRect.left}px`;
        spotlight.style.top = `${boardRect.top}px`;
        spotlight.style.width = `${boardRect.width}px`;
        spotlight.style.height = `${boardRect.height}px`;
      }
      updateColumnPreviewVisual(exp.col);
      setStatusBanner(true, "Now tap Column 3 on the 3D board to swing Spelunker's Pickaxe!");
      return;
    }
    return _origToggleSelectCard(idx);
  };

  // 2. Guide Reserve Token selection during Step 3
  const _origToggleSelectReserve = window.toggleSelectReserveToken || toggleSelectReserveToken;
  window.toggleSelectReserveToken = toggleSelectReserveToken = function(idx) {
    if (tutorialActive) {
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      const exp = step && step.expectedAction;
      if (!exp || (exp.type !== 'DROP_RESERVE' && exp.type !== 'ANY_DROP_WIN')) {
        showToast("Save your Reserve Tokens for Objective 3!", "🎒");
        return;
      }
      const clickedReserveId = state.reservePouch[idx];
      if (exp.type === 'DROP_RESERVE' && clickedReserveId !== exp.reserveId) {
        showToast(exp.wrongReserveToast || "Select the ⚓ Heavy Anvil Token first!", "⚓");
        return;
      }
      _origToggleSelectReserve(idx);
      const spotlight = document.getElementById('tutorial-spotlight');
      if (spotlight) {
        const boardRect = computeTutorialTargetRect(null);
        spotlight.style.left = `${boardRect.left}px`;
        spotlight.style.top = `${boardRect.top}px`;
        spotlight.style.width = `${boardRect.width}px`;
        spotlight.style.height = `${boardRect.height}px`;
      }
      updateColumnPreviewVisual(exp.col);
      setStatusBanner(true, `Now tap Column ${exp.col + 1} on the board to deploy your Reserve Token!`);
      return;
    }
    return _origToggleSelectReserve(idx);
  };

  // 3. Validate each playable tutorial objective in commitColumnAction
  const _origCommitColumnAction = window.commitColumnAction || commitColumnAction;
  window.commitColumnAction = commitColumnAction = function(col) {
    if (!tutorialActive) {
      return _origCommitColumnAction(col);
    }

    const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
    const exp = step && step.expectedAction;
    if (!exp) return;

    if (col !== exp.col) {
      sfx.playHoverTick();
      showToast(exp.wrongColToast || `Aim for Column ${exp.col + 1}!`, "🎯");
      updateColumnPreviewVisual(exp.col);
      return;
    }

    // STEP 1: Standard Token Drop into Column 2 (Gilded Slot)
    if (exp.type === 'DROP_STANDARD') {
      if (state.selectedCardIdx !== null || state.selectedReserveIdx !== null) {
        clearActionSelection();
      }
      const r = aiEngine.getAvailableRow(state.board, col);
      sfx.playWoodClack(true);
      spawnTokenMesh(r, col, PLAYER);
      triggerSlotEnchantment(r, col, PLAYER);
      checkPlayerDropGambits(col);
      updateColumnPreviewVisual(-1);

      runScriptedTutorialAIResponse(5, 700);
      return;
    }

    // STEP 2: Cast Spelunker's Pickaxe on Column 3
    if (exp.type === 'CAST_CARD') {
      if (state.selectedCardIdx === null || state.hand[state.selectedCardIdx] !== exp.cardId) {
        showToast(exp.wrongCardToast, "⛏️");
        return;
      }
      castCardOnColumn(state.selectedCardIdx, col);
      setTimeout(() => {
        if (!tutorialActive) return;
        advanceTutorialStep();
        setStatusBanner(true, "TRAINING STEP 3: Arm ⚓ Heavy Anvil from your Reserve Pouch & drop in Col 4!");
      }, 620);
      return;
    }

    // STEP 3: Deploy Heavy Anvil Reserve Token in Column 4
    if (exp.type === 'DROP_RESERVE') {
      if (state.selectedReserveIdx === null || state.reservePouch[state.selectedReserveIdx] !== exp.reserveId) {
        showToast(exp.wrongReserveToast, "⚓");
        return;
      }
      const r = aiEngine.getAvailableRow(state.board, col);
      const rType = state.reservePouch[state.selectedReserveIdx];
      state.reservePouch.splice(state.selectedReserveIdx, 1);
      clearActionSelection();
      sfx.playWoodClack(true);
      executeReserveTokenDrop(r, col, rType);
      checkPlayerDropGambits(col);
      updateColumnPreviewVisual(-1);

      runScriptedTutorialAIResponse(6, 700);
      return;
    }

    // STEP 4: Winning Connect-4 Drop in Column 3!
    if (exp.type === 'ANY_DROP_WIN') {
      const r = aiEngine.getAvailableRow(state.board, col);
      sfx.playWoodClack(true);
      if (state.selectedReserveIdx !== null) {
        const rType = state.reservePouch[state.selectedReserveIdx];
        state.reservePouch.splice(state.selectedReserveIdx, 1);
        clearActionSelection();
        executeReserveTokenDrop(r, col, rType);
      } else {
        spawnTokenMesh(r, col, PLAYER);
        triggerSlotEnchantment(r, col, PLAYER);
      }
      checkPlayerDropGambits(col);
      updateColumnPreviewVisual(-1);

      const winLine = aiEngine.findWinningLine(state.board, PLAYER);
      if (winLine) {
        highlightWinningLine(winLine);
      }
      state.busy = true;
      const speedBonus = Math.max(0, state.stability);
      const totalEarned = 3 + speedBonus;
      state.gold += totalEarned;
      sfx.playResultChime(true);
      triggerHaptic([40, 30, 70]);
      spawnFloatingPop(`🏆 Training Clear! +$${totalEarned} Gold!`, 'text-amber-300', 5000);
      updateHUD();
      setStatusBanner(true, `🎉 Connect 4! Earned +$${totalEarned} Gold ($3 Base + $${speedBonus} Stability Bonus)!`);

      setTimeout(() => {
        if (!tutorialActive) return;
        advanceTutorialStep();
      }, 650);
    }
  };
}

function startTutorialSequence() {
  installPlayableTutorialHooksOnce();
  setTutorialActiveState(true);
  tutorialStepIdx = 0;

  sfx.playCardChime();
  triggerHaptic([20, 25]);

  const introOverlay = document.getElementById('intro-sequence-overlay');
  if (introOverlay) {
    introOverlay.style.opacity = '0';
    introOverlay.style.pointerEvents = 'none';
    setTimeout(() => {
      introOverlay.classList.add('hidden');
      introOverlay.style.display = 'none';
    }, 380);
  }

  dismissAllActiveNotifications();
  setupPlayableTutorialBoard();

  const tutOverlay = document.getElementById('tutorial-overlay');
  if (tutOverlay) {
    tutOverlay.classList.remove('hidden');
    tutOverlay.style.display = '';
  }
  renderTutorialStep();
}

function advanceTutorialStep() {
  if (!tutorialActive) return;
  if (tutorialStepIdx < PLAYABLE_TUTORIAL_STEPS.length - 1) {
    tutorialStepIdx++;
    const nextStep = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
    const isFinal = tutorialStepIdx === PLAYABLE_TUTORIAL_STEPS.length - 1;
    sfx.playTutorialStepBlip(tutorialStepIdx, isFinal);
    triggerHaptic(18);
    renderTutorialStep();

    if (nextStep && nextStep.expectedAction && typeof nextStep.expectedAction.col === 'number') {
      updateColumnPreviewVisual(nextStep.expectedAction.col);
    }
  } else {
    sfx.playTutorialStepBlip(tutorialStepIdx, true);
    triggerHaptic([25, 30, 45]);
    finishTutorialSequence();
  }
}

function stepBackTutorial() {
  if (!tutorialActive) return;
}

// Immediately transitions out of the tutorial into live Floor 1 gameplay (or asks to resume
// a prior saved delve only AFTER the player has finished the tutorial sequence).
function finishTutorialSequence() {
  setTutorialActiveState(false);

  const tutOverlay = document.getElementById('tutorial-overlay');
  if (tutOverlay) {
    tutOverlay.classList.add('hidden');
    tutOverlay.style.pointerEvents = 'auto';
  }

  dismissAllActiveNotifications();

  // Hide any lingering title/intro/difficulty overlays so gameplay starts immediately
  if (
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.dismissAnyTitleOrSplashOverlays === 'function'
  ) {
    runPersistence.dismissAnyTitleOrSplashOverlays();
  }

  // Initialize fresh Floor 1 board immediately for active gameplay
  initNewRun();
  startFloorMatch(false);
  state.turn = PLAYER;
  state.busy = false;
  state.gameOver = false;
  updateHUD();
  updateTelemetryBadges();
  setStatusBanner(true, 'Floor 1 Begins — Drag across columns to aim!');

  // If the player had a saved run before entering the tutorial, only now (after
  // completing the tutorial sequence) offer to continue it.
  if (
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.hasSavedRun === 'function' &&
    runPersistence.hasSavedRun()
  ) {
    runPersistence.promptResumeIfAvailable();
  }
}

(function bindTutorialEvents() {
  const tutOverlay = document.getElementById('tutorial-overlay');
  const card = document.getElementById('tutorial-callout-card');
  const nextPrompt = document.getElementById('tutorial-next-prompt');
  const skipBtn = document.getElementById('tutorial-skip-btn');

  if (tutOverlay) {
    tutOverlay.addEventListener('click', (e) => {
      if (e.target.closest('#tutorial-skip-btn')) return;
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      // Only allow clicking to finish once the player has reached the final step
      if (step && !step.expectedAction) {
        advanceTutorialStep();
      }
    });
  }

  if (nextPrompt) {
    nextPrompt.addEventListener('click', (e) => {
      e.stopPropagation();
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      if (step && !step.expectedAction) {
        advanceTutorialStep();
      } else if (step && step.expectedAction) {
        showToast(step.body.replace(/<[^>]*>?/gm, '').trim().slice(0, 120), '🎯');
      }
    });
  }

  if (card) {
    card.addEventListener('click', (e) => {
      if (e.target.closest('#tutorial-skip-btn')) return;
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      if (step && !step.expectedAction) {
        advanceTutorialStep();
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.playHoverTick();
      finishTutorialSequence();
    });
  }

  window.addEventListener('resize', () => {
    if (tutorialActive) renderTutorialStep();
  });
})();
