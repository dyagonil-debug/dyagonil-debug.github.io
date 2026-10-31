// ============================================================================
// 14. PLAYABLE INTERACTIVE TUTORIAL ENGINE (js/ui/tutorial.js)
// Realistic Tactical Puzzle: AI blocks every threat; Player wins via Same-Turn Combo
// ============================================================================

const PLAYABLE_TUTORIAL_STEPS = [
  {
    id: 'step1_gilded_threat',
    icon: '🪙',
    badge: 'TACTICAL TRAINING • STEP 1 OF 4',
    title: 'Claim a Gilded Slot & Build Pressure',
    targetSelector: null,
    calloutPosition: 'top',
    promptText: '👉 Drop in Col 4',
    expectedAction: {
      type: 'DROP_STANDARD',
      col: 3, // 0-indexed Column 4 -> lands at (r=1, c=3) on Gilded Slot
      wrongColToast: 'Drop your token into Column 4 to claim the glowing Gilded Slot (+$3 Gold)!'
    },
    body: `
      <p>Two <strong>Petrified Stones</strong> in <strong>Column 3</strong> split the center of the board. A glowing <strong class="text-amber-300">🪙 Gilded Slot (+$3 Gold)</strong> sits in <strong>Column 4</strong> above your Amber token.</p>
      <p class="text-teal-300 font-semibold">🎯 Action: Drop a token into <strong>Column 4</strong> to claim <strong>+$3 Gold</strong> and stack a vertical threat! Watch the AI immediately cap your column to block you.</p>
    `
  },
  {
    id: 'step2_anvil_crush',
    icon: '⚓',
    badge: 'TACTICAL TRAINING • STEP 2 OF 4',
    title: 'Crush the AI Stack with Heavy Anvil',
    targetSelector: '#reserve-pouch-container',
    calloutPosition: 'top',
    promptText: '👉 Anvil on Col 5',
    expectedAction: {
      type: 'DROP_RESERVE',
      reserveId: 'anvil',
      col: 4, // 0-indexed Column 5 -> crushes AI at (r=1, c=4) and takes Row 2!
      wrongReserveToast: 'Tap the ⚓ Heavy Anvil in your Reserve Pouch above your hand first!',
      wrongColToast: 'Drop the ⚓ Heavy Anvil into Column 5 to crush the AI\'s Row 2 token!'
    },
    body: `
      <p>The AI capped Column 4! Now look at <strong>Column 5</strong>: the AI has two stacked Teal tokens guarding Row 2 and building a vertical threat of its own.</p>
      <p class="text-rose-300 font-semibold">🎯 Action: Tap <strong>⚓ Heavy Anvil</strong> in your Reserve Pouch, then drop it into <strong>Column 5</strong> to crush the top AI token and claim Row 2!</p>
    `
  },
  {
    id: 'step3_pickaxe_combo',
    icon: '⛏️',
    badge: 'TACTICAL TRAINING • STEP 3 OF 4',
    title: 'Execute a Same-Turn Arcane Combo!',
    targetSelector: '#hand-container',
    calloutPosition: 'top',
    promptText: '👉 Pickaxe on Col 3',
    expectedAction: {
      type: 'CAST_CARD',
      cardId: 'pickaxe',
      col: 2, // 0-indexed Column 3 -> shatters BOTH Stones at (0,2) & (1,2)!
      wrongCardToast: 'Tap ⛏️ Spelunker\'s Pickaxe in your hand dock!',
      wrongColToast: 'Cast ⛏️ Spelunker\'s Pickaxe on Column 3 to shatter the Petrified Stones!'
    },
    body: `
      <p>The AI blocked Column 6 so you can't extend right! Look at <strong>Row 2</strong>: you hold <strong>Cols 2, 4, and 5</strong>, with only the Petrified Stones in <strong>Column 3</strong> standing in your way.</p>
      <p class="text-teal-300 font-semibold">🎯 Action: Casting cards <em>does not end your turn</em>! Tap <strong>⛏️ Spelunker's Pickaxe</strong> and cast it on <strong>Column 3</strong> to shatter both stones at once!</p>
    `
  },
  {
    id: 'step4_winning_drop',
    icon: '🏆',
    badge: 'TACTICAL TRAINING • STEP 4 OF 4',
    title: 'Finish the Combo Before the AI Moves!',
    targetSelector: null,
    calloutPosition: 'top',
    promptText: '👉 Drop in Col 3 to Win!',
    expectedAction: {
      type: 'ANY_DROP_WIN',
      col: 2, // 0-indexed Column 3 -> lands at newly opened (r=1, c=2)!
      wrongColToast: 'Drop your token into Column 3 to complete your Row 2 Connect 4!'
    },
    body: `
      <p>Shattering those two stones triggered <strong class="text-amber-300">🐈‍⬛ Obsidian Cat (+$4 Gold)</strong> and dropped your top Column 3 token to the bottom—opening <strong>Row 2, Column 3</strong> while <strong>it is still your turn!</strong></p>
      <p class="text-amber-300 font-semibold">🎯 Action: Drop your token into <strong>Column 3</strong> right now to connect 4 across Row 2 (Cols 2–5) for an unstoppable win!</p>
    `
  },
  {
    id: 'tutorial_complete',
    icon: '🎉',
    badge: 'TRAINING COMPLETE • READY FOR DELVE',
    title: 'Grandmaster Outsmarted!',
    targetSelector: ['#gold-badge', '#stability-info-btn'],
    calloutPosition: 'bottom',
    promptText: 'Start Real Run →',
    expectedAction: null,
    body: `
      <p><strong>Unstoppable Combo!</strong> Even when the Grandmaster AI blocks every standard threat, chaining a free-action <strong>Arcane Card</strong> into your token drop lets you open and win a line on the exact same turn.</p>
      <p class="text-teal-300 font-semibold">Your remaining <strong class="text-orange-300">🌋 Seismic Stability</strong> turns converted into <strong>+$1 Speed Bonus Gold</strong> each. Tap below to start your real run!</p>
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

  // Realistic Mid-Game Setup:
  // • Col 1 (c=0): (0,0)=AI, (1,0)=AI
  // • Col 2 (c=1): (0,1)=PLAYER, (1,1)=PLAYER
  // • Col 3 (c=2): (0,2)=STONE, (1,2)=STONE, (2,2)=PLAYER  <-- Pickaxe shatters both Stones, dropping (2,2) to (0,2)!
  // • Col 4 (c=3): (0,3)=PLAYER                           <-- Step 1 drops at (1,3) Gilded; AI caps at (2,3)!
  // • Col 5 (c=4): (0,4)=AI, (1,4)=AI                     <-- Step 2 Anvil crushes (1,4) -> Player claims (1,4)!
  // • Col 6 (c=5): (0,5)=PLAYER                           <-- After Step 2, AI blocks Row 2 right side at (1,5)!
  const initialPieces = [
    [0, 0, AI],
    [1, 0, AI],
    [0, 1, PLAYER],
    [1, 1, PLAYER],
    [0, 2, STONE],
    [1, 2, STONE],
    [2, 2, PLAYER],
    [0, 3, PLAYER],
    [0, 4, AI],
    [1, 4, AI],
    [0, 5, PLAYER]
  ];

  initialPieces.forEach(([r, c, type]) => {
    spawnTokenMesh(r, c, type);
    if (state.meshes[r] && state.meshes[r][c]) {
      state.meshes[r][c].position.y = state.meshes[r][c].userData.targetY;
      state.meshes[r][c].userData.velY = 0;
    }
  });

  state.enchantGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(ENCHANT_TYPES.NONE));
  state.enchantGrid[1][3] = ENCHANT_TYPES.GILDED;    // Step 1 target in Col 4
  state.enchantGrid[2][4] = ENCHANT_TYPES.SPICE;
  state.enchantGrid[2][1] = ENCHANT_TYPES.AMPLIFIER;
  rebuildEnchantmentRings();

  updateHUD();
  updateTelemetryBadges();
  updateColumnPreviewVisual(3); // Highlight Column 4 for Step 1
  setStatusBanner(true, "TRAINING STEP 1: Drop your token into Column 4 (Gilded Slot)!");
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

  nextPrompt.textContent = step.promptText || 'Next →';
  nextPrompt.className = isPlayableStep
    ? 'px-3 py-1.5 rounded-xl bg-teal-500/25 border border-teal-400/60 text-teal-200 font-mono-code font-bold text-[10px] uppercase tracking-wider shadow-md'
    : 'px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-mono-code font-bold text-[10px] uppercase tracking-wider shadow-md animate-pulse cursor-pointer';

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

function runRealisticTutorialAIBlock(aiTargetCol, blockReasonToast, nextStepDelayMs = 720) {
  state.turn = AI;
  state.busy = true;
  clearActionSelection();
  updateColumnPreviewVisual(-1);
  setStatusBanner(false, "Grandmaster AI is calculating optimal block...");

  setTimeout(() => {
    if (!tutorialActive) return;
    const r = aiEngine.getAvailableRow(state.board, aiTargetCol);
    if (r !== -1) {
      sfx.playWoodClack(false);
      spawnTokenMesh(r, aiTargetCol, AI);
      spawn3DShockwaveRing(r, aiTargetCol, 0x14b8a6, 2.0, 420);
    }
    if (blockReasonToast) {
      showToast(blockReasonToast, "🤖", 4200, "border-teal-400/70 text-teal-100");
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
  }, 520);
}

function installPlayableTutorialHooksOnce() {
  if (tutorialHooksInstalled) return;
  tutorialHooksInstalled = true;

  const _origToggleSelectCard = window.toggleSelectCard || toggleSelectCard;
  window.toggleSelectCard = toggleSelectCard = function(idx) {
    if (tutorialActive) {
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      const exp = step && step.expectedAction;
      if (!exp || exp.type !== 'CAST_CARD') {
        showToast("Save your Arcane Cards for Step 3's combo!", "🃏");
        return;
      }
      const clickedCardId = state.hand[idx];
      if (clickedCardId !== exp.cardId) {
        showToast(exp.wrongCardToast || "Tap ⛏️ Spelunker's Pickaxe for this combo!", "⛏️");
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
      setStatusBanner(true, "Now tap Column 3 on the 3D board to shatter both Petrified Stones!");
      return;
    }
    return _origToggleSelectCard(idx);
  };

  const _origToggleSelectReserve = window.toggleSelectReserveToken || toggleSelectReserveToken;
  window.toggleSelectReserveToken = toggleSelectReserveToken = function(idx) {
    if (tutorialActive) {
      const step = PLAYABLE_TUTORIAL_STEPS[tutorialStepIdx];
      const exp = step && step.expectedAction;
      if (!exp || (exp.type !== 'DROP_RESERVE' && exp.type !== 'ANY_DROP_WIN')) {
        showToast("Follow the current training step first!", "🎒");
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
      setStatusBanner(true, `Now tap Column ${exp.col + 1} on the board to crush the AI's token!`);
      return;
    }
    return _origToggleSelectReserve(idx);
  };

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

    // STEP 1: Drop in Col 4 (c=3) -> hits Gilded Slot at (1, 3).
    // AI immediately blocks on top of your vertical stack at Col 4 (r=2, c=3)!
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

      runRealisticTutorialAIBlock(
        3, // Col 4 (r=2, c=3) — AI immediately caps your vertical stack in Col 4!
        "🤖 AI capped Column 4 to block your vertical stack!",
        750
      );
      return;
    }

    // STEP 2: Deploy Heavy Anvil in Col 5 (c=4) -> crushes AI at (1, 4), placing Player at (1, 4).
    // AI sees you building on Row 2 ((1,3) & (1,4)) and immediately blocks at Col 6 (r=1, c=5)!
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

      runRealisticTutorialAIBlock(
        5, // Col 6 (r=1, c=5) — AI immediately blocks your Row 2 expansion on the right!
        "🤖 AI blocked Column 6 to cut off your Row 2 line!",
        750
      );
      return;
    }

    // STEP 3: Cast Spelunker's Pickaxe on Column 3 (c=2) -> shatters BOTH Stones at (0,2) & (1,2),
    // compacting Player's (2,2) token down to (0,2) and leaving (1,2) wide open on the SAME turn!
    if (exp.type === 'CAST_CARD') {
      if (state.selectedCardIdx === null || state.hand[state.selectedCardIdx] !== exp.cardId) {
        showToast(exp.wrongCardToast, "⛏️");
        return;
      }
      castCardOnColumn(state.selectedCardIdx, col);
      setTimeout(() => {
        if (!tutorialActive) return;
        advanceTutorialStep();
        setStatusBanner(true, "TRAINING STEP 4: It's still your turn! Drop in Column 3 to score Connect 4!");
      }, 650);
      return;
    }

    // STEP 4: Winning Drop in Column 3 (c=2) -> lands at (1, 2) to connect Row 2: (1,1)-(1,2)-(1,3)-(1,4)!
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

  // Preserve & lock any existing saved run before setupPlayableTutorialBoard() resets state
  if (
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.captureBootCheckpointBeforeInit === 'function'
  ) {
    runPersistence.captureBootCheckpointBeforeInit();
  }

  sfx.playCardChime();
  triggerHaptic([20, 25]);

  const introOverlay = document.getElementById('intro-sequence-overlay');
  if (introOverlay) {
    introOverlay.style.opacity = '0';
    introOverlay.style.pointerEvents = 'none';
    setTimeout(() => introOverlay.classList.add('hidden'), 420);
  }

  dismissAllActiveNotifications();
  setupPlayableTutorialBoard();

  const tutOverlay = document.getElementById('tutorial-overlay');
  tutOverlay.classList.remove('hidden');
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
    finishTutorialSequence(false);
  }
}

function stepBackTutorial() {
  if (!tutorialActive) return;
}

function finishTutorialSequence(returnToTitle = false) {
  setTutorialActiveState(false);
  const tutOverlay = document.getElementById('tutorial-overlay');
  if (tutOverlay) {
    tutOverlay.classList.add('hidden');
    tutOverlay.style.pointerEvents = 'auto';
  }

  dismissAllActiveNotifications();

  // If a saved run exists when hitting "Start Real Run ->", show the Continue
  // Saved Delve prompt first before opening the Difficulty Modal!
  if (
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.hasSavedRun === 'function' &&
    runPersistence.hasSavedRun()
  ) {
    if (typeof runPersistence.dismissAnyTitleOrSplashOverlays === 'function') {
      runPersistence.dismissAnyTitleOrSplashOverlays();
    }
    runPersistence.promptResumeIfAvailable(() => {
      initNewRun();
      startFloorMatch(false);
      openDifficultyModal(false);
    });
    return;
  }

  initNewRun();
  startFloorMatch(false);

  if (returnToTitle) {
    const introOverlay = document.getElementById('intro-sequence-overlay');
    if (introOverlay) {
      introOverlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        introOverlay.style.opacity = '1';
        introOverlay.style.pointerEvents = 'auto';
      });
    }
  } else {
    openDifficultyModal(false);
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
      finishTutorialSequence(false);
    });
  }

  window.addEventListener('resize', () => {
    if (tutorialActive) renderTutorialStep();
  });
})();
