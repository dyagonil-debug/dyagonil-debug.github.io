// ============================================================================
// CORE BOARD MECHANICS, CARD CASTING, RESERVE DROPS & BOSS ABILITIES (js/engine/boardLogic.js)
// ============================================================================

function runCardVFXWithCallback(vfxFn, argsWithoutCb, durationMs, onComplete) {
  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    if (typeof onComplete === 'function') onComplete();
  };

  if (typeof vfxFn === 'function') {
    try {
      vfxFn(...argsWithoutCb, finish);
    } catch (err) {
      console.warn('[C4 VFX] Fallback triggered for card VFX:', err);
    }
    const tid = setTimeout(finish, durationMs + 120);
    if (tid === 1 && typeof navigator !== 'undefined' && String(navigator.vibrate).includes('vibrate() {}')) {
      finish();
    }
  } else {
    finish();
  }
}

function finalizeChoreographedCard() {
  if (resolvePostCardWinState()) return;
  state.busy = false;
  updateHUD();
  updateTelemetryBadges();
  setStatusBanner(true, 'Your Turn • Drag across columns to aim');
}

function getPlayableColumns(board = state.board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    if (aiEngine.getAvailableRow(board, c) !== -1) {
      cols.push(c);
    }
  }
  return cols;
}

function triggerSettledColumnEnchantments(col) {
  for (let r = 0; r < ROWS; r++) {
    const cell = state.board[r][col];
    if (
      (cell === PLAYER || cell === WILD || cell === AI) &&
      state.enchantGrid[r] &&
      state.enchantGrid[r][col] !== ENCHANT_TYPES.NONE
    ) {
      triggerSlotEnchantment(r, col, cell === AI ? AI : PLAYER);
    }
  }
}

function triggerSettledBoardEnchantments() {
  for (let c = 0; c < COLS; c++) {
    triggerSettledColumnEnchantments(c);
  }
}

function consumeCardAndClearSelection(handIdx, effCost) {
  state.mana -= effCost;
  consumeHandCardCopy(handIdx);
  clearActionSelection();
  updateColumnPreviewVisual(-1);
  updateHUD();
}

function resolvePostCardWinState() {
  if (typeof aiEngine.checkWinState === 'function') {
    const winState = aiEngine.checkWinState(state.board, PLAYER);
    if (winState) {
      if (winState.winner === PLAYER) {
        handleFloorVictory(winState.line);
        return true;
      }
      if (winState.winner === AI) {
        handleFloorDefeat(winState.line);
        return true;
      }
    }
    return false;
  }

  const pWin = aiEngine.findWinningLine(state.board, PLAYER);
  if (pWin) {
    handleFloorVictory(pWin);
    return true;
  }
  const aWin = aiEngine.findWinningLine(state.board, AI);
  if (aWin) {
    handleFloorDefeat(aWin);
    return true;
  }
  return false;
}

// Triggered whenever ANY token is shattered (cards, bombs, anvils, stalactite collapse)
function onTokenShattered(count = 1) {
  sfx.playShatterCrunch();
  state.shatterCounter += count;

  if (state.loadoutId === 'bloodletter' && (state.bloodletterHealCountThisTurn || 0) < 2) {
    const healCap = Math.min(count, 2 - (state.bloodletterHealCountThisTurn || 0));
    if (healCap > 0) {
      state.bloodletterHealCountThisTurn = (state.bloodletterHealCountThisTurn || 0) + healCap;
      state.stability += healCap;
      spawnFloatingPop(`🩸 Sanguine Harvest: +${healCap} Stability!`, 'text-rose-300', 4800);
    }
  }

  if (state.loadoutId === 'bastion') {
    state.gold += count;
    sfx.playCoinDing();
    spawnFloatingPop(`🛡️ Bedrock Fortitude: +$${count} Gold!`, 'text-sky-300', 4800);
  }

  if (hasGambit('obsidian_cat')) {
    const bonus = count * 2;
    state.gold += bonus;
    sfx.playCatMeowSlash(false);
    pulseGambitBadgeInHUD('obsidian_cat');
    spawnFloatingPop(`🐈‍⬛ Obsidian Cat Gambit: +$${bonus} Gold!`, 'text-amber-300', 5000);
  }

  if (hasGambit('crimson_chalice')) {
    state.stability += count;
    state.gold += count;
    pulseGambitBadgeInHUD('crimson_chalice');
    spawnFloatingPop(`🍷 Crimson Chalice: +${count} Stab & +$${count}!`, 'text-rose-300', 5000);
  }

  if (hasGambit('jalapeno_overdrive') && state.shatterCounter >= 2) {
    state.shatterCounter -= 2;
    const aiCells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === AI) aiCells.push([r, c]);
      }
    }
    if (aiCells.length > 0) {
      const [tr, tc] = aiCells[Math.floor(Math.random() * aiCells.length)];
      state.board[tr][tc] = PLAYER;
      rebuildBoardMeshes();
      sfx.playHibachiSizzle();
      pulseGambitBadgeInHUD('jalapeno_overdrive');
      spawn3DShockwaveRing(tr, tc, 0xf43f5e, 2.5, 500);
      spawn3DParticleBurst(tr, tc, 0xf97316, 18, 0.13, 520, 'cone');
      showToast(
        '🔥 Jalapeño Overdrive Synergy: Shattered 2 tokens & converted an AI token to your color!',
        '🌶️',
        5500,
        'border-rose-400/70 text-rose-100'
      );
    }
  }
  updateHUD();
}

function startFloorMatch(showIntroScreen = true) {
  if (!Array.isArray(state.shuffledBossPool) || state.shuffledBossPool.length < 5) {
    const easyPick = shuffle(BOSS_POOLS_BY_ACT.EASY)[0];
    const mediumPick = shuffle(BOSS_POOLS_BY_ACT.MEDIUM)[0];
    const hardPick = shuffle(BOSS_POOLS_BY_ACT.HARD)[0];
    const act4Pick = shuffle(BOSS_POOLS_BY_ACT.ACT4)[0];
    const finalPick = shuffle(BOSS_POOLS_BY_ACT.FINAL)[0];
    state.shuffledBossPool = [
      (state.shuffledBossPool && state.shuffledBossPool[0]) || easyPick,
      (state.shuffledBossPool && state.shuffledBossPool[1]) || mediumPick,
      (state.shuffledBossPool && state.shuffledBossPool[2]) || hardPick,
      (state.shuffledBossPool && state.shuffledBossPool[3]) || act4Pick,
      (state.shuffledBossPool && state.shuffledBossPool[4]) || finalPick
    ];
  }
  if (!Array.isArray(state.shuffledTopologyPool) || state.shuffledTopologyPool.length < BOARD_TOPOLOGIES.length) {
    state.shuffledTopologyPool = shuffle(BOARD_TOPOLOGIES);
  }
  if (typeof setActiveBoardCols === 'function') {
    setActiveBoardCols(7);
  }
  state.isCarouselRotating = false;
  state.tesseractPhase2ComboUsed = false;
  state.isCylinderPhase = false;
  state.isCylinderLowering = false;
  state.isCylinderRotationPaused = false;
  state.cylinderDropOffsetY = 0;
  state.cylinderAngle = 0;
  state.etherealPlaneActive = false;
  if (state._preVoidFlameSnapshot) {
    state.gambits = [...state._preVoidFlameSnapshot.gambits];
    state.maxGambitSlots = state._preVoidFlameSnapshot.maxGambitSlots;
    state.reservePouch = [...state._preVoidFlameSnapshot.reservePouch];
    state.reservePouchUnlocked = state._preVoidFlameSnapshot.reservePouchUnlocked;
    state.masterDeck = [...state._preVoidFlameSnapshot.masterDeck];
    state.maxMana = state._preVoidFlameSnapshot.maxMana;
    state.handSize = state._preVoidFlameSnapshot.handSize;
    state._preVoidFlameSnapshot = null;
  }
  state.voidFlamePurged = false;
  if (typeof resetCavernFromEtherealPlane === 'function') {
    resetCavernFromEtherealPlane();
  }
  const floorData = getFloorConfig(state.floorIdx);
  const topo = getFloorTopology(state.floorIdx);
  state.currentTopology = topo;
  state.boardMask = topo.mask;
  const mods = state.nextFloorModifiers;

  clearThreeGroup(tokensGroup);

  state.board = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => (topo.mask[r][c] ? EMPTY : VOID_CELL))
  );
  state.meshes = createGrid(ROWS, COLS, null);

  rebuild3DBoardGeometry(topo.mask);

  state.bossMaxHp = floorData.isBoss ? (floorData.maxHp || 2) : 1;
  state.bossHp = state.bossMaxHp;
  state.turn = PLAYER;
  state.turnNumber = 1;
  const canaryStabBonus = hasGambit('lucky_rabbit_paw') ? 2 : 0;
  state.stability = Math.max(4, floorData.stability + (mods.bonusStability || 0) + canaryStabBonus);
  state.busy = false;
  state.gameOver = false;
  state.previewCol = -1;
  state.selectedCardIdx = null;
  state.selectedReserveIdx = null;
  state.catNineLivesUsed = false;
  state.lastDroppedCols = [];
  state.cardsCastThisTurn = 0;
  state.bellowsTriggeredThisTurn = false;
  state.firstCol4DropDoneThisFloor = false;
  state.firstCardCastDoneThisFloor = false;
  state.bloodletterHealCountThisTurn = 0;
  if (state.loadoutId === 'spelunker' && state.floorIdx % 3 === 0) {
    state.freeRerollsRemaining = 1;
  }
  state.bossMarkedCol = [2, 3, 4][Math.floor(Math.random() * 3)];
  state.forceBossRetaliationThisTurn = false;
  boardGroup.rotation.set(0, 0, 0);
  boardGroup.position.set(0, 0, 0);

  const bossActIdx = Math.floor(state.floorIdx / 3);
  const bossBgmModes = ['boss1', 'boss2', 'boss3', 'boss4', 'boss5'];
  const targetBgmMode = floorData.isBoss
    ? (bossBgmModes[Math.min(4, bossActIdx)] || 'boss1')
    : 'cavern';
  if (!showIntroScreen) {
    bgm.setMode(targetBgmMode);
  }

  if (typeof updateCavernAesthetics === 'function') {
    updateCavernAesthetics();
  }
  if (floorData.isBoss) {
    showToast(`💀 BOSS F${floorData.floor}: ${floorData.boss} • Board: ${topo.name}!`, topo.icon);
  } else if (floorData.isPreBoss) {
    showToast(`⚔️ PRE-BOSS VANGUARD • Warped Board: ${topo.name}!`, topo.icon);
  }

  colHighlightMesh.visible = false;
  ghostToken.visible = false;
  document.getElementById('confirm-drop-btn').classList.add('hidden');
  document.getElementById('action-inspector').classList.add('hidden');

  generateSlotEnchantments();

  // Initialize 4 Parallel Tesseract Boards with 4 distinct procedural topologies if fighting the Act V Final Boss
  const isTesseractBoss = floorData.isBoss && floorData.bossArchetype && floorData.bossArchetype.id === 'sovereign_tesseract';
  if (isTesseractBoss) {
    const cloneGrid2D = (g) => g.map((row) => row.slice());
    state.tesseractBoards = [];
    state.activeTesseractBoardIdx = 0;
    const boardLabels = ['Board I (Alpha)', 'Board II (Beta)', 'Board III (Gamma)', 'Board IV (Omega)'];
    const topoPool = (Array.isArray(state.shuffledTopologyPool) && state.shuffledTopologyPool.length >= 4)
      ? state.shuffledTopologyPool
      : shuffle(BOARD_TOPOLOGIES);

    for (let bIdx = 0; bIdx < 4; bIdx++) {
      const pick = topoPool[bIdx % topoPool.length];
      const builtMask = pick.buildMask();
      const boardTopo = {
        id: pick.id,
        name: pick.name,
        icon: pick.icon,
        desc: pick.desc,
        loreDesc: (typeof TOPOLOGY_LORE_HINTS !== 'undefined' && TOPOLOGY_LORE_HINTS[pick.id]) || pick.loreDesc || pick.desc,
        isProcedural: true,
        isAsymmetrical: !!pick.isAsymmetrical,
        mask: cloneGrid2D(builtMask)
      };
      state.boardMask = cloneGrid2D(builtMask);
      state.board = Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => (builtMask[r][c] ? EMPTY : VOID_CELL))
      );
      generateSlotEnchantments();
      state.tesseractBoards.push({
        originalIdx: bIdx,
        label: boardLabels[bIdx],
        isShattered: false,
        topology: boardTopo,
        boardMask: cloneGrid2D(builtMask),
        board: cloneGrid2D(state.board),
        enchantGrid: cloneGrid2D(state.enchantGrid)
      });
    }
    // Restore Board I (index 0) as the starting active board
    state.currentTopology = state.tesseractBoards[0].topology;
    state.boardMask = cloneGrid2D(state.tesseractBoards[0].boardMask);
    state.board = cloneGrid2D(state.tesseractBoards[0].board);
    state.enchantGrid = cloneGrid2D(state.tesseractBoards[0].enchantGrid);
    rebuild3DBoardGeometry(state.boardMask);
    rebuildEnchantmentRings();
  } else {
    state.tesseractBoards = [];
    state.activeTesseractBoardIdx = 0;
  }

  const diff = getActiveDifficulty();
  const bastionBonusStone = state.loadoutId === 'bastion' ? 1 : 0;
  const totalStartStones = (mods.caveInStones || 0) + (diff.preSpawnStones || 0) + bastionBonusStone;
  if (totalStartStones > 0) {
    for (let i = 0; i < totalStartStones; i++) {
      const validCols = getPlayableColumns();
      if (validCols.length > 0) {
        const rc = validCols[Math.floor(Math.random() * validCols.length)];
        const rr = aiEngine.getAvailableRow(state.board, rc);
        spawnTokenMesh(rr, rc, STONE);
      }
    }
    if (mods.caveInStones > 0) {
      showToast(`☄️ Cave-In Hazard dropped ${totalStartStones} Petrified Stone(s)!`, '🪨');
    }
  }

  const bossBonusHeadstart = (floorData.isBoss && state.floorIdx >= 5) ? (diff.bossHeadstartTokens || 0) : 0;
  const totalHeadstart = (mods.aiHeadstartTokens || 0) + bossBonusHeadstart;
  if (totalHeadstart > 0) {
    const startCols = [2, 4, 3, 1, 5];
    let dropped = 0;
    for (const sc of startCols) {
      if (dropped >= totalHeadstart) break;
      const rr = aiEngine.getAvailableRow(state.board, sc);
      if (rr !== -1) {
        spawnTokenMesh(rr, sc, AI);
        dropped++;
      }
    }
    showToast(`🤖 Opponent Headstart: AI deployed ${dropped} opening token(s)!`, '⚠️');
  }

  if (isTesseractBoss && typeof saveCurrentTesseractBoardState === 'function') {
    saveCurrentTesseractBoardState();
  }

  state.drawPile = shuffle(state.masterDeck.slice());
  state.discardPile = [];
  state.hand = [];
  const openingDrawCount = state.handSize + (hasGambit('jeweler_loupe') ? 1 : 0);
  const savedHandSize = state.handSize;
  if (hasGambit('jeweler_loupe')) {
    state.handSize = Math.min(5, state.handSize + 1);
  }
  drawCards(openingDrawCount);
  state.handSize = savedHandSize;

  state.shroomDropCounter = 0;
  state.dynamoDropCounter = 0;
  state.mana = Math.max(
    0,
    state.maxMana +
      (hasGambit('jalapeno_overdrive') ? 1 : 0) +
      (hasGambit('sacred_heart_prism') ? 1 : 0) +
      (hasGambit('alkahest_vial') ? 1 : 0) +
      (mods.bonusMana || 0)
  );

  state.nextFloorModifiers = createDefaultFloorModifiers();

  updateHUD();
  updateTelemetryBadges();
  setStatusBanner(
    true,
    floorData.isBoss
      ? `⚠️ BOSS (${topo.name}): ${floorData.bossArchetype.shortTelegraph}`
      : (floorData.isPreBoss
        ? `⚔️ Pre-Boss Board: ${topo.name} — Aim carefully!`
        : 'Tap or slide across columns to aim • Tap again to drop')
  );

  if (showIntroScreen) {
    playFloorIntroTransition(floorData, topo, targetBgmMode);
  }
}

// Trigger Slot Enchantment when a token lands on (r, c)
function triggerSlotEnchantment(r, c, actor) {
  if (!state.enchantGrid || !state.enchantGrid[r]) return;
  const eType = state.enchantGrid[r][c];
  if (!eType) return;

  state.enchantGrid[r][c] = ENCHANT_TYPES.NONE;
  rebuildEnchantmentRings();

  const colNum = c + 1;

  if (eType === ENCHANT_TYPES.GILDED) {
    if (actor === PLAYER) {
      const gildedBonus = hasGambit('amber_flea') ? 4 : 3;
      state.gold += gildedBonus;
      sfx.playCoinDing();
      if (hasGambit('amber_flea')) pulseGambitBadgeInHUD('amber_flea');
      spawnFloatingPop(`🪙 Gilded Slot: +$${gildedBonus} Gold!`, 'text-amber-300', 5200);
      spawnSlotBonusCallout(
        r, c, '🪙', 'Gilded Slot Triggered!',
        `You gained +$${gildedBonus} Bonus Gold Coins immediately.`,
        'border-yellow-400/80', 'bg-yellow-400 text-stone-950', 4800
      );
      showToast(`Gilded Slot Acquired (Col ${colNum}): +$${gildedBonus} Bonus Gold added to your pouch!`, '🪙', 5500, 'border-yellow-400/75 text-yellow-100');
    } else {
      spawnSlotBonusCallout(
        r, c, '⚠️', 'AI Claimed Gilded Slot',
        `The opponent denied your Gilded slot in Col ${colNum}.`,
        'border-amber-500/60', 'bg-amber-500 text-stone-950', 4500
      );
      showToast(`AI looted the Gilded Slot in Col ${colNum}!`, '🪙', 5000);
    }
  } else if (eType === ENCHANT_TYPES.SPICE) {
    if (actor === PLAYER) {
      state.mana += 1;
      let charredMsg = 'Restored +1 Mana Crystal!';
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = state.isCylinderPhase ? ((c + dc + COLS) % COLS) : (c + dc);
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && state.board[nr][nc] === AI) {
          state.board[nr][nc] = EMPTY;
          applyColumnGravity(nc);
          rebuildBoardMeshes();
          onTokenShattered(1);
          charredMsg = '+1 Mana Crystal & charred an adjacent AI token!';
          break;
        }
      }
      spawnFloatingPop('🌶️ Volatile Spice: +1 Mana!', 'text-rose-300', 5200);
      spawnSlotBonusCallout(r, c, '🌶️', 'Volatile Spice Slot!', charredMsg, 'border-rose-400/85', 'bg-rose-500 text-white', 4800);
      showToast(`Volatile Spice Slot Acquired: ${charredMsg}`, '🔥', 5500, 'border-rose-400/75 text-rose-100');
    } else {
      showToast(`AI neutralized the Volatile Spice Slot in Col ${colNum}.`, '🌶️', 4800);
    }
  } else if (eType === ENCHANT_TYPES.WEB) {
    if (actor === AI) {
      state.board[r][c] = STONE;
      rebuildBoardMeshes();
      spawnSlotBonusCallout(
        r, c, '🕸️', 'Spider Web Trap Sprung!',
        `AI token in Col ${colNum} was petrified into neutral stone!`,
        'border-purple-400/80', 'bg-purple-500 text-white', 4800
      );
      showToast("🕸️ Spider Web Slot petrified the AI's token into neutral blocker stone!", '🪵', 5500, 'border-purple-400/75 text-purple-100');
    } else {
      state.stability += 1;
      spawnFloatingPop('🕸️ Web Slot: +1 Seismic Stability!', 'text-purple-300', 5200);
      spawnSlotBonusCallout(
        r, c, '🕸️', 'Spider Web Slot Reinforced!',
        'Restored +1 Seismic Stability turn (+$1 speed bonus).',
        'border-purple-400/80', 'bg-purple-500 text-white', 4800
      );
      showToast('Spider Web Slot Acquired: Reinforced cavern ceiling for +1 Seismic Stability!', '🕸️', 5500, 'border-purple-400/75 text-purple-100');
    }
  } else if (eType === ENCHANT_TYPES.AMPLIFIER) {
    state.board[r][c] = WILD;
    if (actor === PLAYER) {
      state.gold += 2;
      sfx.playCoinDing();
      spawnFloatingPop('💎 Wild Amplifier: Wild Token +$2 Gold!', 'text-sky-300', 5200);
      spawnSlotBonusCallout(
        r, c, '💎', 'Amplifier Slot Activated!',
        'Upgraded into a Wild Prismatic Token (counts for both colors) +$2 Gold!',
        'border-sky-400/85', 'bg-sky-400 text-stone-950', 4800
      );
      showToast('💎 Amplifier Slot Acquired: Token upgraded to Wild Prismatic +$2 Bonus Gold!', '💎', 5500, 'border-sky-400/75 text-sky-100');
    } else {
      spawnSlotBonusCallout(
        r, c, '💎', 'Amplifier Slot Triggered!',
        'Token became a Wild Prismatic Token (usable by both players)!',
        'border-sky-400/80', 'bg-sky-400 text-stone-950', 4800
      );
      showToast('💎 Amplifier Slot turned the dropped token into a shared Wild Token!', '💎', 5200);
    }
    rebuildBoardMeshes();
  } else if (eType === ENCHANT_TYPES.CURSED_SPORE && actor === PLAYER) {
    if (state.mana > 0) {
      state.mana = Math.max(0, state.mana - 1);
      spawnFloatingPop('🍄 Cursed Spore: Drained -1 Mana!', 'text-lime-300', 5200);
      spawnSlotBonusCallout(
        r, c, '🍄', 'Cursed Spore Hazard!',
        'Mycelial spores drained -1 Mana Crystal from your pool.',
        'border-lime-400/80', 'bg-lime-400 text-stone-950', 4800
      );
      showToast('🍄 Cursed Spore Hazard triggered: Drained -1 Mana Crystal!', '🍄', 5500, 'border-lime-400/75 text-lime-100');
    } else {
      state.board[r][c] = STONE;
      rebuildBoardMeshes();
      spawnSlotBonusCallout(
        r, c, '🍄', 'Cursed Spore Petrification!',
        'With 0 Mana remaining, your token was calcified into neutral stone!',
        'border-lime-400/80', 'bg-lime-400 text-stone-950', 4800
      );
      showToast('🍄 Cursed Spore petrified your token into stone (0 Mana to absorb it)!', '🍄', 5500, 'border-lime-400/75 text-lime-100');
    }
  }

  if (actor === PLAYER && eType !== ENCHANT_TYPES.CURSED_SPORE && hasGambit('sacred_heart_prism')) {
    state.mana = Math.min(state.maxMana + 2, state.mana + 1);
    drawCards(1);
    sfx.playSacredHeartChoir();
    pulseGambitBadgeInHUD('sacred_heart_prism');
    spawn3DShockwaveRing(r, c, 0xf43f5e, 2.7, 520);
    spawn3DParticleBurst(r, c, 0xfde047, 16, 0.12, 540, 'octa');
    spawnFloatingPop('❤️‍🔥 Sacred Heart: +1 Mana & +1 Card!', 'text-amber-200', 5200);
  }
  updateHUD();
}

function applyColumnGravity(col) {
  if (col < 0 || col >= COLS) return false;
  const playableRows = [];
  const tokens = [];
  for (let r = 0; r < ROWS; r++) {
    const isPlayable = state.boardMask && state.boardMask[r]
      ? state.boardMask[r][col]
      : (state.board[r][col] !== VOID_CELL);
    if (isPlayable) {
      playableRows.push(r);
      const cell = state.board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        tokens.push(cell);
      }
    } else {
      state.board[r][col] = VOID_CELL;
    }
  }
  let shifted = false;
  for (let i = 0; i < playableRows.length; i++) {
    const r = playableRows[i];
    const nextVal = i < tokens.length ? tokens[i] : EMPTY;
    if (state.board[r][col] !== nextVal) shifted = true;
    state.board[r][col] = nextVal;
  }
  return shifted;
}

function applyBoardGravity() {
  let anyShifted = false;
  for (let c = 0; c < COLS; c++) {
    if (applyColumnGravity(c)) anyShifted = true;
  }
  return anyShifted;
}

// ============================================================================
// COLUMN DROP, RESERVE POUCH DEPLOYMENT & GAMBIT TRIGGERS
// ============================================================================
function updateColumnPreviewVisual(col) {
  if (col < 0 || col >= COLS || state.turn !== PLAYER || state.busy || state.gameOver) {
    state.previewCol = -1;
    colHighlightMesh.visible = false;
    ghostToken.visible = false;
    document.getElementById('confirm-drop-btn').classList.add('hidden');
    return;
  }

  if (state.isCylinderPhase && typeof isCylinderColumnInteractive === 'function' && !isCylinderColumnInteractive(col)) {
    state.previewCol = -1;
    colHighlightMesh.visible = false;
    ghostToken.visible = false;
    document.getElementById('confirm-drop-btn').classList.add('hidden');
    return;
  }

  if (state.previewCol !== col) sfx.playHoverTick();
  state.previewCol = col;

  if (state.isCylinderPhase && typeof getCylinderCellWorldCoords === 'function') {
    const hPos = getCylinderCellWorldCoords(0, col, 0.08);
    colHighlightMesh.position.set(hPos.x, START_Y + (BOARD_H - CELL_SPACING) / 2, hPos.z);
    colHighlightMesh.rotation.set(0, hPos.rotY, 0);
    colHighlightMesh.visible = true;

    const availRow = aiEngine.getAvailableRow(state.board, col);
    if (availRow !== -1 && state.selectedCardIdx === null) {
      const gPos = getCylinderCellWorldCoords(availRow, col, 0.08);
      ghostToken.position.set(gPos.x, gPos.y, gPos.z);
      ghostToken.rotation.y = gPos.rotY;
      ghostToken.visible = true;
    } else {
      ghostToken.visible = false;
    }
  } else {
    const colX = START_X + col * CELL_SPACING;
    colHighlightMesh.position.set(colX, START_Y + (BOARD_H - CELL_SPACING) / 2, 0);
    colHighlightMesh.rotation.set(0, 0, 0);
    colHighlightMesh.visible = true;

    const availRow = aiEngine.getAvailableRow(state.board, col);
    if (availRow !== -1 && state.selectedCardIdx === null) {
      ghostToken.position.set(colX, START_Y + availRow * CELL_SPACING, 0);
      ghostToken.rotation.y = 0;
      ghostToken.visible = true;
    } else {
      ghostToken.visible = false;
    }
  }

  const confirmBtn = document.getElementById('confirm-drop-btn');
  const confirmText = document.getElementById('confirm-drop-text');
  confirmBtn.classList.remove('hidden');
  if (state.selectedCardIdx !== null) {
    confirmText.textContent = `Cast Col ${col + 1}`;
  } else if (state.selectedReserveIdx !== null) {
    confirmText.textContent = `Deploy Col ${col + 1}`;
  } else {
    confirmText.textContent = `Drop Col ${col + 1}`;
  }
}

function checkPlayerDropGambits(col) {
  const landedR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));

  if (hasGambit('shrinking_shroom')) {
    state.shroomDropCounter = (state.shroomDropCounter || 0) + 1;
    sfx.playTinySqueak();
    pulseGambitBadgeInHUD('shrinking_shroom');
    spawn3DParticleBurst(landedR, col, 0xa3e635, 8, 0.08, 380, 'octa');
    if (state.shroomDropCounter % 3 === 0) {
      state.gold += 2;
      state.stability += 1;
      spawn3DShockwaveRing(landedR, col, 0x84cc16, 2.3, 460);
      spawnFloatingPop('🍄 Tiny Shroom Squeak: +$2 Gold & +1 Stability!', 'text-lime-300', 5000);
      showToast(
        '🍄 Oddly Shrinking Cave Shroom (3rd Mini-Token): Squeaked for +$2 Gold & +1 Seismic Stability!',
        '🍄',
        5000,
        'border-lime-400/75 text-lime-100'
      );
    }
  }

  if (hasGambit('flywheel_coil')) {
    state.dynamoDropCounter = (state.dynamoDropCounter || 0) + 1;
    if (state.dynamoDropCounter % 3 === 0) {
      state.mana = Math.min(state.maxMana + 2, state.mana + 1);
      state.gold += 2;
      sfx.playCoinDing();
      pulseGambitBadgeInHUD('flywheel_coil');
      spawn3DShockwaveRing(landedR, col, 0x2dd4bf, 2.5, 480);
      spawnFloatingPop('⚙️ Flywheel Coil: +1 Mana & +$2 Gold!', 'text-teal-300', 5000);
      showToast('⚙️ Perpetual Flywheel Coil (3rd Drop): Generated +1 Mana Crystal & +$2 Gold!', '⚙️', 5000);
    }
  }

  if (hasGambit('butter_crust') && (col === 0 || col === COLS - 1)) {
    state.gold += 1;
    state.stability += 1;
    sfx.playButterCrustChime();
    pulseGambitBadgeInHUD('butter_crust');
    spawn3DColumnBeam(col, 0xfacc15, 0.34, 420, false);
    spawn3DParticleBurst(landedR, col, 0xfde047, 14, 0.11, 460, 'box');
    spawnFloatingPop('🍕 Golden Crust Gambit: +$1 Gold & +1 Stability!', 'text-amber-300', 5000);
    showToast(
      '🍕 Butter-Cheese Golden Crust (Edge Column): Awarded +$1 Gold & +1 Seismic Stability!',
      '🍕',
      5200,
      'border-amber-400/75 text-amber-100'
    );
  }

  if (state.loadoutId === 'spelunker' && col === 3 && !state.firstCol4DropDoneThisFloor) {
    state.firstCol4DropDoneThisFloor = true;
    state.gold += 1;
    sfx.playCoinDing();
    spawnFloatingPop("⛏️ Explorer's Equilibrium: +$1 Gold!", 'text-amber-300', 4600);
  }

  if (hasGambit('plumb_bob') && col === 3) {
    state.gold += 1;
    state.stability += 1;
    sfx.playCoinDing();
    pulseGambitBadgeInHUD('plumb_bob');
    spawn3DShockwaveRing(landedR, col, 0x38bdf8, 2.2, 440);
    spawnFloatingPop('🧭 Brass Plumb: +$1 Gold & +1 Stability!', 'text-sky-300', 5000);
    showToast("🧭 Geomancer's Brass Plumb (Center Col 4): Awarded +$1 Gold & +1 Seismic Stability!", '🧭', 4800);
  }

  state.lastDroppedCols.push(col);
  if (state.lastDroppedCols.length > 3) state.lastDroppedCols.shift();
  if (hasGambit('coaster_apex') && state.lastDroppedCols.length === 3) {
    const [a, b, c] = state.lastDroppedCols;
    if (a < b && b < c) {
      state.mana += 1;
      state.gold += 2;
      state.lastDroppedCols = [];
      sfx.playCoasterWhoosh();
      triggerHaptic([25, 30, 50]);
      pulseGambitBadgeInHUD('coaster_apex');
      playCoasterArcVFX([a, b, c]);
      spawnFloatingPop('🎢 Coaster Apex Combo: +1 Mana & +$2 Gold!', 'text-teal-300', 5200);
      showToast(
        `🎢 Coaster Apex Momentum (Cols ${a + 1}→${b + 1}→${c + 1}): Awarded +1 Mana & +$2 Gold!`,
        '🎢',
        5500,
        'border-teal-400/75 text-teal-100'
      );
    }
  }
}

function commitColumnAction(col) {
  if (state.busy || state.gameOver || state.turn !== PLAYER || col < 0 || col >= COLS) return;

  if (state.selectedCardIdx !== null) {
    state.lastActionWasDrop = false;
    castCardOnColumn(state.selectedCardIdx, col);
    return;
  }

  state.lastActionWasDrop = true;
  const r = aiEngine.getAvailableRow(state.board, col);
  if (r === -1) {
    showToast('Column is full!', '⚠️');
    return;
  }

  if (state.selectedReserveIdx !== null) {
    const rType = state.reservePouch[state.selectedReserveIdx];
    const rTok = RESERVE_CATALOG[rType];
    if (rType === 'anvil') {
      const topR = aiEngine.getTopOccupiedRow(state.board, col);
      if (topR === -1 || (state.board[topR][col] !== AI && state.board[topR][col] !== STONE)) {
        showToast(
          topR === -1
            ? 'Heavy Anvil requires a token below to crush!'
            : 'Heavy Anvil cannot crush your own token! Target an AI or Stone blocker.',
          '⚓'
        );
        return;
      }
    }
    sfx.playWoodClack(true);
    state.reservePouch.splice(state.selectedReserveIdx, 1);
    clearActionSelection();
    updateColumnPreviewVisual(-1);
    state.busy = true;
    setStatusBanner(true, `✨ Deploying ${rTok ? rTok.name : 'Reserve Token'} in Col ${col + 1}...`);

    executeReserveTokenDrop(r, col, rType);
    checkPlayerDropGambits(col);
    updateHUD();

    const finishReserveTurn = () => {
      const winLine = aiEngine.findWinningLine(state.board, PLAYER);
      if (winLine) {
        handleFloorVictory(winLine);
        return;
      }
      if (aiEngine.isBoardFull(state.board)) {
        handleDraw();
        return;
      }
      triggerAITurn();
    };

    const tid = setTimeout(finishReserveTurn, 520);
    if (tid === 1 && typeof navigator !== 'undefined' && String(navigator.vibrate).includes('vibrate() {}')) {
      finishReserveTurn();
    }
    return;
  }

  sfx.playWoodClack(true);
  spawnTokenMesh(r, col, PLAYER);
  triggerSlotEnchantment(r, col, PLAYER);
  checkPlayerDropGambits(col);
  updateColumnPreviewVisual(-1);

  const winLine = aiEngine.findWinningLine(state.board, PLAYER);
  if (winLine) {
    handleFloorVictory(winLine);
    return;
  }
  if (aiEngine.isBoardFull(state.board)) {
    handleDraw();
    return;
  }

  triggerAITurn();
}

// ============================================================================
// RESERVE TOKEN DEPLOYMENT HANDLERS (11 Total across Tiers 1–5)
// ============================================================================
const RESERVE_EFFECT_HANDLERS = {
  fools_penny(r, col, repeat) {
    const winThreshold = state.loadoutId === 'croupier' ? 0.80 : 0.65;
    const luckyRoll = Math.random() < winThreshold;
    playFoolsPennyFlipVFX(r, col, luckyRoll);
    if (luckyRoll) {
      spawnTokenMesh(r, col, PLAYER);
      const goldGain = 5 * repeat;
      const manaGain = 1 * repeat;
      state.gold += goldGain;
      state.mana = Math.min(state.maxMana + 2, state.mana + manaGain);
      sfx.playCoinDing();
      spawn3DShockwaveRing(r, col, 0xfacc15, 2.5, 480);
      spawn3DParticleBurst(r, col, 0xfde047, 16, 0.13, 500, 'octa');
      spawnFloatingPop(`💩 Fool's Penny Jackpot: +$${goldGain} & +${manaGain}M!`, 'text-amber-300', 5000);
      if (!aiEngine.findWinningLine(state.board, PLAYER)) {
        triggerSlotEnchantment(r, col, PLAYER);
      }
      showToast(`🪙 Fool's Counterfeit Penny passed inspection! Minted +$${goldGain} Gold & +${manaGain} Mana!`, '🪙');
    } else {
      spawnTokenMesh(r, col, STONE);
      const consolationGold = 2 * repeat;
      state.gold += consolationGold;
      sfx.playCurseBuzzer();
      triggerBoardShake(0.18);
      spawn3DParticleBurst(r, col, 0x78716c, 14, 0.11, 460, 'box');
      spawnFloatingPop(`💩 Counterfeit Dud! Turned to Stone (+$${consolationGold})`, 'text-stone-300', 5000);
      showToast(`💩 BUSTED! Fool's Counterfeit Penny was a dud and petrified into neutral Stone (+$${consolationGold} consolation)!`, '💩');
    }
  },

  loaded_die(r, col, repeat) {
    const roll = 1 + Math.floor(Math.random() * 6);
    sfx.playDiceClatter(roll >= 4);
    playLoadedKnucklebonesVFX(col, roll, roll);
    triggerHaptic([20, 25, 35]);
    spawnTokenMesh(r, col, PLAYER);
    if (roll === 6) {
      const goldGain = 4 * repeat;
      const manaGain = 1 * repeat;
      const stabGain = 1 * repeat;
      state.gold += goldGain;
      state.mana = Math.min(state.maxMana + 2, state.mana + manaGain);
      state.stability += stabGain;
      drawCards(repeat);
      sfx.playCoinDing();
      spawn3DShockwaveRing(r, col, 0xfde047, 2.6, 500);
      spawn3DParticleBurst(r, col, 0xfacc15, 18, 0.13, 500, 'octa');
      triggerSlotEnchantment(r, col, PLAYER);
      spawnFloatingPop(`🎲 Natural 6 Jackpot! +$${goldGain}, +${manaGain}M, +${stabGain} Stab & +${repeat} Card!`, 'text-amber-300', 5000);
      showToast(`🎲 Weighted Bone Die rolled a natural 6 JACKPOT! Awarded +$${goldGain} Gold, +${manaGain} Mana, +${stabGain} Stability & drew ${repeat} Card(s)!`, '🎲');
    } else if (roll >= 4) {
      const goldGain = 3 * repeat;
      state.gold += goldGain;
      drawCards(repeat);
      spawn3DShockwaveRing(r, col, 0xfacc15, 2.3, 460);
      spawn3DParticleBurst(r, col, 0xfde047, 14, 0.11, 460, 'octa');
      triggerSlotEnchantment(r, col, PLAYER);
      spawnFloatingPop(`🎲 Rolled ${roll}: +$${goldGain} & +${repeat} Card!`, 'text-amber-300', 4800);
      showToast(`🎲 Weighted Bone Die rolled a ${roll}! Awarded +$${goldGain} Gold & drew ${repeat} Card(s)!`, '🎲');
    } else {
      const goldGain = 2 * repeat;
      const stabGain = 1 * repeat;
      state.gold += goldGain;
      state.stability += stabGain;
      spawn3DShockwaveRing(r, col, 0xfacc15, 2.1, 440);
      triggerSlotEnchantment(r, col, PLAYER);
      spawnFloatingPop(`🎲 Rolled ${roll}: +$${goldGain} & +${stabGain} Stab!`, 'text-amber-200', 4600);
      showToast(`🎲 Weighted Bone Die rolled a ${roll}! Awarded +$${goldGain} Gold & +${stabGain} Seismic Stability!`, '🎲');
    }
  },

  anvil(r, col, repeat) {
    sfx.playAnvilClang();
    playReservePropVFX(r, col, 0x94a3b8, 0xf59e0b, 'anvil');
    triggerHaptic([45, 30, 65]);
    triggerBoardShake(0.28);
    spawnTokenMesh(r, col, PLAYER);
    let crushedCount = 0;
    for (let i = 0; i < repeat; i++) {
      const topR = aiEngine.getTopOccupiedRow(state.board, col);
      let belowR = -1;
      for (let rr = topR - 1; rr >= 0; rr--) {
        if (state.board[rr][col] !== VOID_CELL && state.board[rr][col] !== EMPTY) {
          belowR = rr;
          break;
        }
      }
      if (
        topR !== -1 &&
        belowR !== -1 &&
        (state.board[belowR][col] === AI || state.board[belowR][col] === STONE)
      ) {
        spawn3DParticleBurst(belowR, col, 0x94a3b8, 16, 0.14, 480, 'box');
        spawn3DShockwaveRing(belowR, col, 0xf59e0b, 2.2, 420);
        state.board[belowR][col] = state.board[topR][col];
        state.board[topR][col] = EMPTY;
        applyColumnGravity(col);
        crushedCount++;
      } else {
        break;
      }
    }
    if (crushedCount > 0) {
      const bountyGold = crushedCount * 2;
      state.gold += bountyGold;
      onTokenShattered(crushedCount);
      spawnFloatingPop(`⚓ Anvil Crush: +$${bountyGold} Gold!`, 'text-amber-300', 4800);
    }
    rebuildBoardMeshes();
    const landedR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    if (!aiEngine.findWinningLine(state.board, PLAYER)) {
      triggerSlotEnchantment(landedR, col, PLAYER);
    }
    showToast(`⚓ Heavy Anvil crushed ${crushedCount} blocker(s) beneath it for +$${crushedCount * 2} Gold!`, '⚓');
  },

  cave_bat(r, col, repeat = 1) {
    sfx.playBatEcholocation();
    playReservePropVFX(r, col, 0xc084fc, 0xe879f9, 'wings');
    triggerHaptic([20, 20, 40]);
    spawnTokenMesh(r, col, PLAYER);
    spawn3DShockwaveRing(r, col, 0xa855f7, 2.2, 460);
    let converted = 0;
    for (let rr = r - 1; rr >= 0 && converted < repeat; rr--) {
      if (state.board[rr][col] === AI || state.board[rr][col] === STONE) {
        state.board[rr][col] = PLAYER;
        spawn3DShockwaveRing(rr, col, 0xfbbf24, 2.0, 440);
        spawn3DParticleBurst(rr, col, 0xc084fc, 14, 0.11, 460, 'cone');
        converted++;
      }
    }
    if (converted > 0) {
      rebuildBoardMeshes();
      showToast(`🦇 Vampire Bat latched onto & converted ${converted} blocker(s) below!`, '🦇');
    } else {
      showToast('🦇 Vampire Bat deployed!', '🦇');
    }
    triggerSlotEnchantment(r, col, PLAYER);
  },

  jalapeno_bomb(r, col, repeat) {
    sfx.playJalapenoBlast();
    playReservePropVFX(r, col, 0xef4444, 0xf97316, 'cask');
    triggerHaptic([50, 30, 75]);
    triggerBoardShake(0.32);
    spawnTokenMesh(r, col, PLAYER);
    spawn3DShockwaveRing(r, col, 0xf43f5e, 3.1, 520);
    spawn3DParticleBurst(r, col, 0xf97316, 22, 0.16, 560, 'cone');

    let shattered = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = state.isCylinderPhase ? ((col + dc + COLS) % COLS) : (col + dc);
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && state.board[nr][nc] === AI) {
        spawn3DParticleBurst(nr, nc, 0xef4444, 14, 0.13, 460, 'box');
        state.board[nr][nc] = EMPTY;
        applyColumnGravity(nc);
        shattered++;
        if (shattered >= 2 * repeat) break;
      }
    }
    if (shattered > 0) {
      rebuildBoardMeshes();
      onTokenShattered(shattered);
    }
    triggerSlotEnchantment(r, col, PLAYER);
    showToast(`🌶️ Jalapeño Bomb exploded & shattered ${shattered} AI token(s)!`, '💥');
  },

  acid_slug(r, col, repeat) {
    sfx.playAlchemyCrucible();
    playGuanoPoulticeVFX(col, r);
    triggerHaptic([30, 25, 45]);
    spawnTokenMesh(r, col, PLAYER);
    const stabGain = 2 * repeat;
    state.stability += stabGain;

    let dissolvedStones = 0;
    for (let rr = 0; rr < ROWS; rr++) {
      if (state.board[rr][col] === STONE) {
        spawn3DParticleBurst(rr, col, 0xa3e635, 12, 0.12, 460, 'octa');
        state.board[rr][col] = EMPTY;
        dissolvedStones++;
      }
    }
    const goldGain = dissolvedStones * 2 * repeat;
    if (dissolvedStones > 0) {
      state.gold += goldGain;
      applyColumnGravity(col);
      rebuildBoardMeshes([col]);
      onTokenShattered(dissolvedStones);
    }
    const landedR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    spawn3DColumnBeam(col, 0xa3e635, 0.38, 460, false);
    triggerSlotEnchantment(landedR, col, PLAYER);
    showToast(`🐌 Corrosive Brine Slug dissolved ${dissolvedStones} Stone(s) for +$${goldGain} Gold & +${stabGain} Stability!`, '🐌');
  },

  parasite_egg(r, col, repeat) {
    sfx.playCardChime();
    playReservePropVFX(r, col, 0xc084fc, 0xa855f7, 'crystal');
    triggerHaptic([25, 25, 40]);
    spawnTokenMesh(r, col, PLAYER);
    const stabGain = 2 * repeat;
    state.stability += stabGain;

    let webbedCols = 0;
    (state.isCylinderPhase ? [(col - 1 + COLS) % COLS, (col + 1) % COLS] : [col - 1, col + 1]).forEach((nc) => {
      if (nc >= 0 && nc < COLS) {
        const ar = aiEngine.getAvailableRow(state.board, nc);
        if (ar !== -1 && state.enchantGrid) {
          for (let step = 0; step < repeat; step++) {
            const targetR = ar + step;
            if (targetR < ROWS && state.board[targetR][nc] === EMPTY && state.enchantGrid[targetR]) {
              state.enchantGrid[targetR][nc] = ENCHANT_TYPES.WEB;
              spawn3DShockwaveRing(targetR, nc, 0xa855f7, 2.1, 440);
              webbedCols++;
            }
          }
        }
      }
    });
    if (webbedCols > 0) rebuildEnchantmentRings();
    spawn3DShockwaveRing(r, col, 0xc084fc, 2.4, 460);
    triggerSlotEnchantment(r, col, PLAYER);
    showToast(`🥚 Brood Spider Egg hatched ${webbedCols} adjacent Spider Web Slot(s) & restored +${stabGain} Stability!`, '🥚');
  },

  powder_keg(r, col, repeat) {
    sfx.playJalapenoBlast();
    playReservePropVFX(r, col, 0xb45309, 0xf97316, 'cask');
    triggerHaptic([50, 30, 75]);
    triggerBoardShake(0.32);
    spawnTokenMesh(r, col, PLAYER);

    let blasted = 0;
    const maxBlast = 2 * repeat;
    for (let rr = r - 1; rr >= 0 && blasted < maxBlast; rr--) {
      if (state.board[rr][col] === AI || state.board[rr][col] === STONE) {
        spawn3DParticleBurst(rr, col, 0xf97316, 14, 0.13, 460, 'octa');
        state.board[rr][col] = EMPTY;
        blasted++;
      }
    }
    if (blasted > 0) {
      state.gold += blasted * 2;
      applyColumnGravity(col);
      rebuildBoardMeshes([col]);
      onTokenShattered(blasted);
    }
    const landedR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    spawn3DShockwaveRing(landedR, col, 0xf97316, 2.6, 480);
    if (!aiEngine.findWinningLine(state.board, PLAYER)) {
      triggerSlotEnchantment(landedR, col, PLAYER);
    }
    showToast(`🧨 Dwarven Nitro Cask blasted ${blasted} blocker(s) below for +$${blasted * 2} Gold!`, '🧨');
  },

  quicksilver_glob(r, col, repeat) {
    sfx.playQuicksilverFlow();
    playQuicksilverSiphonVFX(Math.min(ROWS - 1, r + 1), col, r, col);
    triggerHaptic([30, 25, 45]);
    spawnTokenMesh(r, col, PLAYER);
    state.mana = Math.min(state.maxMana + 2, state.mana + repeat);
    state.stability += 2 * repeat;

    let converted = 0;
    for (let rr = r - 1; rr >= 0 && converted < repeat; rr--) {
      if (state.board[rr][col] === AI || state.board[rr][col] === STONE) {
        state.board[rr][col] = PLAYER;
        spawn3DShockwaveRing(rr, col, 0x38bdf8, 2.2, 450);
        converted++;
      }
    }
    if (converted > 0) rebuildBoardMeshes([col]);
    spawn3DShockwaveRing(r, col, 0x38bdf8, 2.7, 500);
    triggerSlotEnchantment(r, col, PLAYER);
    showToast(`💧 Living Quicksilver deployed your token, converted ${converted} blocker(s) below, & restored +${repeat}M / +${2 * repeat} Stability!`, '💧');
  },

  midas_eye(r, col, repeat) {
    sfx.playMidasFanfare();
    playReservePropVFX(r, col, 0xfde047, 0xfacc15, 'crystal');
    triggerHaptic([35, 25, 55, 25, 45]);
    triggerBoardShake(0.24);
    spawnTokenMesh(r, col, PLAYER);
    spawn3DColumnBeam(col, 0xfacc15, 0.42, 520, true);
    spawn3DShockwaveRing(r, col, 0xfde047, 3.0, 540);
    spawn3DParticleBurst(r, col, 0xfacc15, 22, 0.15, 560, 'octa');

    let converted = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = state.isCylinderPhase ? ((col + dc + COLS) % COLS) : (col + dc);
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        if (state.board[nr][nc] === AI || state.board[nr][nc] === STONE) {
          state.board[nr][nc] = PLAYER;
          spawn3DShockwaveRing(nr, nc, 0xfacc15, 2.1, 460);
          spawn3DParticleBurst(nr, nc, 0xfde047, 12, 0.11, 460, 'octa');
          converted++;
          if (converted >= 2 * repeat) break;
        }
      }
    }
    let gildedCount = 0;
    for (let upR = r + 1; upR < ROWS && gildedCount < repeat; upR++) {
      if (state.board[upR][col] !== VOID_CELL) {
        if (state.board[upR][col] === EMPTY) {
          state.enchantGrid[upR][col] = ENCHANT_TYPES.GILDED;
          spawn3DShockwaveRing(upR, col, 0xfacc15, 1.9, 440);
          gildedCount++;
        }
      }
    }
    if (gildedCount > 0) rebuildEnchantmentRings();
    rebuildBoardMeshes();
    if (!aiEngine.findWinningLine(state.board, PLAYER)) {
      triggerSlotEnchantment(r, col, PLAYER);
    }
    showToast(`👁️‍🗨️ Golden Midas Eye deployed your token, transmuted ${converted} adjacent piece(s), & gilded ${gildedCount} slot(s) in Col ${col + 1}!`, '👁️‍🗨️');
  },

  eclipse_idol(r, col, repeat) {
    sfx.playWildPrismatic();
    playSeraphimHaloVFX(col);
    triggerHaptic([30, 25, 50]);
    spawnTokenMesh(r, col, PLAYER);
    state.mana = Math.min(state.maxMana + 3, state.mana + repeat);
    state.stability += 3 * repeat;
    drawCards(repeat);
    let enchantedAbove = 0;
    for (let upR = r + 1; upR < ROWS && enchantedAbove < repeat; upR++) {
      if (state.board[upR][col] !== VOID_CELL && state.board[upR][col] === EMPTY && state.enchantGrid && state.enchantGrid[upR]) {
        state.enchantGrid[upR][col] = enchantedAbove === 0 ? ENCHANT_TYPES.AMPLIFIER : ENCHANT_TYPES.GILDED;
        enchantedAbove++;
      }
    }
    if (enchantedAbove > 0) rebuildEnchantmentRings();
    spawn3DColumnBeam(col, 0xa855f7, 0.42, 520, true);
    spawn3DShockwaveRing(r, col, 0xfde047, 2.8, 500);
    spawn3DParticleBurst(r, col, 0xc084fc, 18, 0.13, 500, 'octa');
    triggerSlotEnchantment(r, col, PLAYER);
    spawnFloatingPop(`🌑 Black Sun Idol: +${repeat}M, +${3 * repeat} Stab & Draw!`, 'text-purple-300', 5000);
    showToast(`🌑 Black Sun Idol deployed your token, spawned an Amplifier Slot above, drew ${repeat} card(s), & restored +${repeat}M / +${3 * repeat} Stability!`, '🌑');
  }
};

function executeReserveTokenDrop(r, col, rType) {
  const repeat = hasGambit('echo_bell') ? 2 : 1;
  if (hasGambit('echo_bell')) {
    state.gold += 1;
    sfx.playEchoBellToll();
    pulseGambitBadgeInHUD('echo_bell');
    spawn3DShockwaveRing(r, col, 0xfde047, 2.8, 520);
    spawnFloatingPop('🔔 Echo Bell Resonance: 2x Effect & +$1!', 'text-amber-200', 5000);
  }

  const handler = RESERVE_EFFECT_HANDLERS[rType];
  if (handler) {
    handler(r, col, repeat);
  }
}

function countTokensInPlay(board = state.board) {
  if (!board || !board.length) return 0;
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r] && board[r][c];
      if (cell !== undefined && cell !== EMPTY && cell !== VOID_CELL) {
        count++;
      }
    }
  }
  return count;
}

function countEnemyOrStoneTokensInPlay(board = state.board) {
  if (!board || !board.length) return 0;
  let count = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r] && board[r][c];
      if (cell === AI || cell === STONE) {
        count++;
      }
    }
  }
  return count;
}

// ============================================================================
// ARCANE CARD CASTING & BOARD-WIDE SPELLS (32 Total: 31 Playable + 1 Curse)
// ============================================================================
function triggerSinkholeTrapdoor(handIdx, effCost) {
  const totalInPlay = countTokensInPlay(state.board);
  if (totalInPlay < 3) {
    showToast(`Subterranean Trapdoor requires at least 3 tokens in play (${totalInPlay}/3)!`, '🕳️');
    return;
  }

  const selectedTargets = [];
  for (let r = 0; r < ROWS && selectedTargets.length < 3; r++) {
    const rowTokens = [];
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        rowTokens.push({ r, c, type: cell });
      }
    }
    if (rowTokens.length > 0) {
      const shuffledRow = shuffle(rowTokens);
      const needed = 3 - selectedTargets.length;
      selectedTargets.push(...shuffledRow.slice(0, needed));
    }
  }

  if (selectedTargets.length < 3) {
    showToast('Need at least 3 tokens in play!', '⚠️');
    return;
  }

  state.busy = true;
  consumeCardAndClearSelection(handIdx, effCost);

  sfx.playTrapdoorRelease();
  triggerHaptic([40, 25, 65, 25, 50]);
  triggerBoardShake(0.36);
  setStatusBanner(true, '🕳️ Subterranean Trapdoor opened! 3 bottom tokens falling out...');

  const affectedColsSet = new Set();
  selectedTargets.forEach(({ r, c }) => {
    affectedColsSet.add(c);
    if (state.meshes[r] && state.meshes[r][c]) {
      state.meshes[r][c].visible = false;
    }
  });
  const affectedCols = Array.from(affectedColsSet);

  playSinkholeFallingTokensVFX(selectedTargets);

  setTimeout(() => {
    selectedTargets.forEach(({ r, c }) => {
      state.board[r][c] = EMPTY;
    });
    affectedCols.forEach((c) => applyColumnGravity(c));
    rebuildBoardMeshes(affectedCols);
    onTokenShattered(selectedTargets.length);

    const colsText = affectedCols.map((c) => c + 1).sort((a, b) => a - b).join(', ');
    showToast(`🕳️ Subterranean Trapdoor dropped 3 bottom tokens & shifted Col(s) ${colsText} down!`, '🕳️');
  }, 280);

  setTimeout(() => {
    triggerSettledBoardEnchantments();
    if (resolvePostCardWinState()) return;

    state.busy = false;
    updateHUD();
    updateTelemetryBadges();
    setStatusBanner(true, 'Columns Shifted! Your Turn • Drag across columns to aim');
  }, 900);
}

function triggerAbyssalBoardFlip(handIdx, effCost) {
  if (countTokensInPlay(state.board) === 0) {
    showToast('Place at least 1 token before flipping the board!', '⚠️');
    return;
  }

  state.busy = true;
  consumeCardAndClearSelection(handIdx, effCost);

  sfx.playBoardFlipWhoosh();
  triggerHaptic([35, 30, 65, 30, 45]);
  setStatusBanner(true, '🔄 Abyssal Upheaval! Flipping cavern board 180°...');

  const BOARD_CENTER_Y = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;
  const flipDuration = 560;
  const startTime = performance.now();

  function stepBoardFlip(now) {
    const rawP = Math.min(1, (now - startTime) / flipDuration);
    const ease = rawP < 0.5
      ? 4 * rawP * rawP * rawP
      : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

    const angle = ease * Math.PI;
    boardGroup.rotation.x = angle;
    boardGroup.position.y = BOARD_CENTER_Y * (1 - Math.cos(angle));
    boardGroup.position.z = -BOARD_CENTER_Y * Math.sin(angle) - Math.sin(rawP * Math.PI) * 2.5;
    boardGroup.rotation.z = Math.sin(rawP * Math.PI) * 0.21;

    if (rawP < 1) {
      requestAnimationFrame(stepBoardFlip);
      return;
    }

    boardGroup.rotation.set(0, 0, 0);
    boardGroup.position.set(0, 0, 0);

    const invertedMask = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const srcR = ROWS - 1 - r;
        return state.boardMask && state.boardMask[srcR]
          ? !!state.boardMask[srcR][c]
          : (state.board[srcR][c] !== VOID_CELL);
      })
    );
    state.boardMask = invertedMask;
    if (state.currentTopology) {
      state.currentTopology.mask = invertedMask;
    }

    state.enchantGrid = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        const srcR = ROWS - 1 - r;
        if (!invertedMask[r][c]) return ENCHANT_TYPES.NONE;
        return (state.enchantGrid[srcR] && state.enchantGrid[srcR][c]) || ENCHANT_TYPES.NONE;
      })
    );

    const nextBoard = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => (invertedMask[r][c] ? EMPTY : VOID_CELL))
    );
    const dropStartRowsByCol = Array.from({ length: COLS }, () => []);

    for (let c = 0; c < COLS; c++) {
      const playableDestRows = [];
      for (let r = 0; r < ROWS; r++) {
        if (invertedMask[r][c]) playableDestRows.push(r);
      }

      const fallingTokens = [];
      for (let oldR = ROWS - 1; oldR >= 0; oldR--) {
        const cell = state.board[oldR][c];
        if (cell !== EMPTY && cell !== VOID_CELL) {
          fallingTokens.push({ type: cell, startRow: ROWS - 1 - oldR });
        }
      }

      for (let i = 0; i < playableDestRows.length; i++) {
        const destR = playableDestRows[i];
        if (i < fallingTokens.length) {
          nextBoard[destR][c] = fallingTokens[i].type;
          dropStartRowsByCol[c][destR] = fallingTokens[i].startRow;
        } else {
          nextBoard[destR][c] = EMPTY;
        }
      }
    }

    state.board = nextBoard;

    rebuild3DBoardGeometry(state.boardMask);
    rebuildEnchantmentRings();
    rebuildBoardMeshes();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const mesh = state.meshes[r] && state.meshes[r][c];
        if (mesh) {
          const startR = (dropStartRowsByCol[c] && dropStartRowsByCol[c][r] !== undefined)
            ? dropStartRowsByCol[c][r]
            : r;
          const startY = START_Y + Math.max(r, startR) * CELL_SPACING + 0.55;
          mesh.position.y = Math.max(mesh.userData.targetY + 0.45, startY);
          mesh.userData.velY = -0.02;
        }
      }
    }

    sfx.playWoodClack(true);
    showToast('🔄 Abyssal Upheaval flipped the board 180° & inverted all columns!', '🔄');

    setTimeout(() => {
      triggerSettledBoardEnchantments();
      if (resolvePostCardWinState()) return;

      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
      setStatusBanner(true, 'Board Inverted! Your Turn • Drag across columns to aim');
    }, 420);
  }

  requestAnimationFrame(stepBoardFlip);
}

const CARD_EFFECT_HANDLERS = {
  abyssal_upheaval(handIdx, col, effCost) {
    triggerAbyssalBoardFlip(handIdx, effCost);
    return true;
  },

  sinkhole_chute(handIdx, col, effCost) {
    triggerSinkholeTrapdoor(handIdx, effCost);
    return true;
  },

  pebble(handIdx, col, effCost) {
    const card = CARD_CATALOG.pebble;
    const baseR = Math.max(0, aiEngine.getBottomOccupiedRow(state.board, col));
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playPebbleTamp();
    triggerHaptic(20);
    setStatusBanner(true, '🪨 Cavern Pebble Nudge tamping column footing...');

    runCardVFXWithCallback(playPebbleNudgeVFX, [baseR, col], 740, () => {
      state.stability += 1;
      state.gold += 2;
      spawnFloatingPop('🪨 Pebble +$2 & +1 Stab!', 'text-amber-300');
      showToast(`Cavern Pebble reinforced Col ${col + 1} (+1 Stability & +$2)!`, '🪨');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  oracle_peek(handIdx, col, effCost) {
    const card = CARD_CATALOG.oracle_peek;
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playOracleLantern();
    triggerHaptic([15, 25, 30]);
    setStatusBanner(true, "🏮 Oracle's Lantern illuminating cavern columns...");

    for (let cc = 0; cc < COLS; cc++) {
      setTimeout(() => {
        spawn3DShockwaveRing(Math.min(ROWS - 1, 3), cc, 0xfde047, 1.85, 420);
      }, cc * 35);
    }

    runCardVFXWithCallback(playOracleLanternVFX, [col], 800, () => {
      state.stability += 1;
      drawCards(1);
      showToast("🏮 Oracle's Lantern illuminated the cavern, drew 1 card & restored +1 Stability!", '🏮');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  loaded_knucklebones(handIdx, col, effCost) {
    const card = CARD_CATALOG.loaded_knucklebones;
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const total = d1 + d2;
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playDiceClatter(total >= 7);
    triggerHaptic([20, 25, 35]);
    setStatusBanner(true, `🎲 Rolling Loaded Knucklebones above Col ${col + 1}...`);

    runCardVFXWithCallback(playLoadedKnucklebonesVFX, [col, d1, d2], 820, () => {
      const availR = aiEngine.getAvailableRow(state.board, col);
      if (total >= 11 && availR !== -1) {
        spawnTokenMesh(availR, col, PLAYER);
        state.gold += 3;
        triggerSlotEnchantment(availR, col, PLAYER);
        checkPlayerDropGambits(col);
        spawnFloatingPop(`🎲 Boxcars (${total})! Free Drop & +$3!`, 'text-amber-300', 5000);
        showToast(`🎲 Loaded Knucklebones rolled ${d1}+${d2}=${total}! Dropped a free Player token in Col ${col + 1} & minted +$3 Gold!`, '🎲');
      } else if (total >= 7 && availR !== -1) {
        spawnTokenMesh(availR, col, PLAYER);
        triggerSlotEnchantment(availR, col, PLAYER);
        checkPlayerDropGambits(col);
        spawnFloatingPop(`🎲 Rolled ${total}! Free Token Drop!`, 'text-amber-200', 4800);
        showToast(`🎲 Loaded Knucklebones rolled ${d1}+${d2}=${total}! Dropped a free Player token into Col ${col + 1}!`, '🎲');
      } else {
        state.gold += 2;
        state.stability += 1;
        spawnFloatingPop(`🎲 Rolled ${total}: +$2 Gold & +1 Stab!`, 'text-amber-300', 4600);
        showToast(`🎲 Loaded Knucklebones rolled ${d1}+${d2}=${total}: awarded +$2 Gold & +1 Seismic Stability!`, '🎲');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  leech_lancet(handIdx, col, effCost) {
    const card = CARD_CATALOG.leech_lancet;
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playLancetSiphon();
    triggerHaptic([25, 20, 40]);
    setStatusBanner(true, "💉 Bloodletter's Lancet siphoning arcane mana...");

    runCardVFXWithCallback(playBloodletterLancetVFX, [col], 780, () => {
      state.stability = Math.max(1, state.stability - 2);
      state.gold += 2;
      state.mana = Math.min(state.maxMana + 3, state.mana + 1);
      drawCards(1);
      spawnFloatingPop("💉 Lancet Pact: +1M, +1 Card & +$2!", 'text-rose-300', 4800);
      showToast("💉 Bloodletter's Lancet drained 2 Stability to grant +1 Mana, +1 Card, & +$2 Gold!", '💉');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  petrified(handIdx, col, effCost) {
    const card = CARD_CATALOG.petrified;
    const r = aiEngine.getAvailableRow(state.board, col);
    if (r === -1) {
      showToast('Column is full!', '⚠️');
      return true;
    }
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playPetrifiedSeal();
    triggerHaptic(30);
    setStatusBanner(true, `🪵 Sealing Col ${col + 1} with Petrified Wood...`);

    runCardVFXWithCallback(playPetrifiedBlockVFX, [r, col], 740, () => {
      spawnTokenMesh(r, col, STONE);
      showToast(`🪵 Petrified Wood Blocker sealed slot in Col ${col + 1}!`, '🪵');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  jar_of_flies(handIdx, col, effCost) {
    const card = CARD_CATALOG.jar_of_flies;
    const aiTargets = [];
    for (let rr = 0; rr < ROWS; rr++) {
      for (let cc = 0; cc < COLS; cc++) {
        if (state.board[rr][cc] === AI) aiTargets.push([rr, cc]);
      }
    }
    const goodRoll = Math.random() < 0.50;
    const pickedTarget = (goodRoll && aiTargets.length > 0)
      ? aiTargets[Math.floor(Math.random() * aiTargets.length)]
      : [Math.max(0, aiEngine.getAvailableRow(state.board, col)), col];

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playFlyBuzz(goodRoll);
    triggerHaptic([15, 15, 20, 15, 35]);
    setStatusBanner(true, '🪰 Uncorking Suspicious Jar of Cave Flies...');

    runCardVFXWithCallback(playCaveFliesSwarmVFX, [pickedTarget[0], pickedTarget[1], goodRoll], 780, () => {
      if (goodRoll && aiTargets.length > 0) {
        const [tr, tc] = pickedTarget;
        spawn3DParticleBurst(tr, tc, 0xa3e635, 16, 0.12, 480, 'octa');
        state.board[tr][tc] = EMPTY;
        applyColumnGravity(tc);
        rebuildBoardMeshes([tc]);
        state.gold += 2;
        onTokenShattered(1);
        spawnFloatingPop('🪰 Good Flies! Ate AI Token & +$2 Gold!', 'text-amber-300', 5000);
        showToast(`🪰 BZZT! The Cave Flies devoured an AI token in Col ${tc + 1} and coughed up +$2 Gold!`, '🪰');
      } else if (goodRoll) {
        state.gold += 2;
        sfx.playCoinDing();
        spawnFloatingPop('🪰 No AI Tokens—Flies found +$2 Gold!', 'text-amber-300', 4800);
        showToast('🪰 No AI tokens to eat, so the Cave Flies scavenged +$2 Gold for you!', '🪙');
      } else {
        const availR = aiEngine.getAvailableRow(state.board, col);
        if (availR !== -1) {
          spawnTokenMesh(availR, col, STONE);
          spawn3DParticleBurst(availR, col, 0x78716c, 14, 0.11, 460, 'box');
          spawnFloatingPop('🪰 Bad Flies! Dropped Petrified Stone!', 'text-stone-400', 5000);
          showToast(`🪰 BACKFIRE! The confused Cave Flies dropped a Petrified Stone into Col ${col + 1}!`, '🪨');
        } else {
          showToast(`🪰 The Cave Flies buzzed around Col ${col + 1} harmlessly (Column full)!`, '🪰');
        }
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  pickaxe(handIdx, col, effCost) {
    const card = CARD_CATALOG.pickaxe;
    const stoneRows = [];
    for (let rr = 0; rr < ROWS; rr++) {
      if (state.board[rr][col] === STONE) {
        stoneRows.push(rr);
      }
    }
    if (stoneRows.length === 0) {
      showToast(`No Petrified Stone tokens in Col ${col + 1} to mine!`, '⛏️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playPickaxeStrike(stoneRows.length);
    triggerHaptic([30, 20, 55]);
    setStatusBanner(true, `⛏️ Swinging Spelunker's Pickaxe down Col ${col + 1}...`);

    runCardVFXWithCallback(playPickaxeSwingVFX, [col, stoneRows], 760, () => {
      stoneRows.forEach((sr) => {
        state.board[sr][col] = EMPTY;
      });
      applyColumnGravity(col);
      rebuildBoardMeshes([col]);
      onTokenShattered(stoneRows.length);
      triggerSettledColumnEnchantments(col);

      showToast(
        `⛏️ Spelunker's Pickaxe shattered ${stoneRows.length} Petrified Stone(s) in Col ${col + 1}!`,
        '⛏️'
      );
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  guano_fertilizer(handIdx, col, effCost) {
    const card = CARD_CATALOG.guano_fertilizer;
    const availR = aiEngine.getAvailableRow(state.board, col);
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playAlchemyCrucible();
    triggerHaptic([20, 25]);
    setStatusBanner(true, `🧪 Pouring Volatile Guano Poultice into Col ${col + 1}...`);

    runCardVFXWithCallback(playGuanoPoulticeVFX, [col, availR], 760, () => {
      state.stability += 1;
      let purgedSpores = 0;
      for (let r = 0; r < ROWS; r++) {
        if (state.enchantGrid && state.enchantGrid[r] && state.enchantGrid[r][col] === ENCHANT_TYPES.CURSED_SPORE) {
          state.enchantGrid[r][col] = ENCHANT_TYPES.SPICE;
          purgedSpores++;
        }
      }
      if (availR !== -1 && state.enchantGrid && state.enchantGrid[availR]) {
        state.enchantGrid[availR][col] = ENCHANT_TYPES.SPICE;
        spawn3DShockwaveRing(availR, col, 0xa3e635, 2.5, 460);
        spawn3DParticleBurst(availR, col, 0xf97316, 16, 0.13, 460, 'octa');
      }
      rebuildEnchantmentRings();
      spawnFloatingPop('🧪 Guano Poultice: Spice Slot & +1 Stab!', 'text-lime-300', 4800);
      showToast(
        `🧪 Volatile Guano Poultice fermented Col ${col + 1} with a Volatile Spice Slot${purgedSpores > 0 ? ` (purged ${purgedSpores} Spore)` : ''} & +1 Stability!`,
        '🧪'
      );
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  rusty_bear_trap(handIdx, col, effCost) {
    const card = CARD_CATALOG.rusty_bear_trap;
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    const isSnapKill = topR !== -1 && state.board[topR][col] === AI;
    const availR = aiEngine.getAvailableRow(state.board, col);
    const vfxR = isSnapKill ? topR : (availR !== -1 ? availR : 2);

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playBearTrapSnap(isSnapKill);
    triggerHaptic([35, 25, 55]);
    setStatusBanner(true, `🪤 Clamping Rusted Bear Trap onto Col ${col + 1}...`);

    runCardVFXWithCallback(playRustyBearTrapVFX, [vfxR, col, isSnapKill], 760, () => {
      if (isSnapKill) {
        state.board[topR][col] = EMPTY;
        state.gold += 2;
        rebuildBoardMeshes([col]);
        onTokenShattered(1);
        spawnFloatingPop('🪤 Bear Trap Snap: AI Shattered & +$2!', 'text-amber-300', 4800);
        showToast(`🪤 Rusted Bear Trap amputated the top AI token in Col ${col + 1} & paid +$2 Bounty Gold!`, '🪤');
      } else {
        state.stability += 1;
        if (availR !== -1 && state.enchantGrid && state.enchantGrid[availR]) {
          state.enchantGrid[availR][col] = ENCHANT_TYPES.WEB;
          rebuildEnchantmentRings();
        }
        spawnFloatingPop('🪤 Bear Trap Rigged: Web Slot & +1 Stab!', 'text-purple-300', 4800);
        showToast(`🪤 Rusted Bear Trap rigged a Spider Web Slot in Col ${col + 1} & restored +1 Stability!`, '🪤');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  divining_wishbone(handIdx, col, effCost) {
    const card = CARD_CATALOG.divining_wishbone;
    let targetCount = 0;
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (state.board[r][col] !== EMPTY && state.board[r][col] !== VOID_CELL) targetCount++;
      if (state.board[r][3] !== EMPTY && state.board[r][3] !== VOID_CELL) centerCount++;
    }
    const matched = targetCount === centerCount;

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playWishboneSnap(matched);
    triggerHaptic([20, 30]);
    setStatusBanner(true, `🦴 Snapping Split Wishbone across Col ${col + 1} & Col 4...`);

    runCardVFXWithCallback(playSplitWishboneVFX, [col, matched], 780, () => {
      const availR = aiEngine.getAvailableRow(state.board, col);
      if (matched && availR !== -1) {
        spawnTokenMesh(availR, col, PLAYER);
        state.gold += 2;
        triggerSlotEnchantment(availR, col, PLAYER);
        checkPlayerDropGambits(col);
        spawnFloatingPop('🦴 Wishbone Match: Free Drop & +$2!', 'text-amber-300', 4800);
        showToast(`🦴 Split Wishbone matched Col 4 height! Dropped a free Player token in Col ${col + 1} & +$2 Gold!`, '🦴');
      } else {
        state.gold += 3;
        state.stability += 2;
        spawnFloatingPop('🦴 Wishbone Snap: +$3 Gold & +2 Stab!', 'text-amber-300', 4800);
        showToast('🦴 Split Wishbone snapped unevenly: awarded +$3 Gold & +2 Seismic Stability!', '🦴');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  tar_bubble(handIdx, col, effCost) {
    const card = CARD_CATALOG.tar_bubble;
    let topAiIdx = -1;
    let topAiRow = -1;
    const occupiedRows = [];
    const tokens = [];
    for (let r = 0; r < ROWS; r++) {
      const cell = state.board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        occupiedRows.push(r);
        tokens.push(cell);
        if (cell === AI) {
          topAiIdx = tokens.length - 1;
          topAiRow = r;
        }
      }
    }
    const fromR = topAiRow !== -1 ? topAiRow : (occupiedRows.length > 0 ? occupiedRows[occupiedRows.length - 1] : 1);
    const toR = occupiedRows.length > 0 ? occupiedRows[0] : 0;

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playTarBubbleGurgle();
    triggerHaptic([30, 25, 45]);
    setStatusBanner(true, `🛢️ Boiling Tar Pitch dragging Col ${col + 1} downward...`);

    const hasNonAiBelow = topAiIdx > 0 && tokens.slice(0, topAiIdx).some((t) => t !== AI);
    runCardVFXWithCallback(playBoilingTarPitchVFX, [col, fromR, toR], 800, () => {
      state.stability += 1;
      if (topAiIdx > 0 && hasNonAiBelow && tokens.length >= 2) {
        const [pulledAi] = tokens.splice(topAiIdx, 1);
        tokens.unshift(pulledAi);
        occupiedRows.forEach((rr, i) => {
          state.board[rr][col] = tokens[i];
        });
        rebuildBoardMeshes([col]);
        triggerSettledColumnEnchantments(col);
        spawnFloatingPop('🛢️ Tar Pitch: Dragged AI to Bottom!', 'text-purple-300', 4800);
        showToast(`🛢️ Boiling Tar Pitch dragged the top AI token in Col ${col + 1} to the bottom & floated your tokens up!`, '🛢️');
      } else {
        const availR = aiEngine.getAvailableRow(state.board, col);
        state.gold += 2;
        if (availR !== -1) {
          spawnTokenMesh(availR, col, STONE);
        }
        showToast(`🛢️ Boiling Tar Pitch coagulated into a Stone Blocker in Col ${col + 1} & yielded +$2 Gold (+1 Stability)!`, '🛢️');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  tectonic_anchor(handIdx, col, effCost) {
    const card = CARD_CATALOG.tectonic_anchor;
    const availR = aiEngine.getAvailableRow(state.board, col);
    const anchorRow = availR !== -1 ? availR : Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    const upgradedToAmplifier = availR !== -1 && state.enchantGrid && state.enchantGrid[availR] && state.enchantGrid[availR][col] === ENCHANT_TYPES.GILDED;

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playTectonicAnchor(upgradedToAmplifier);
    triggerHaptic([30, 20, 45]);
    setStatusBanner(true, `⏳ Clamping Tectonic Anchor onto Col ${col + 1}...`);

    runCardVFXWithCallback(playTectonicAnchorVFX, [col, anchorRow, upgradedToAmplifier], 760, () => {
      state.stability += 3;
      if (availR !== -1 && state.enchantGrid && state.enchantGrid[availR]) {
        if (upgradedToAmplifier) {
          state.enchantGrid[availR][col] = ENCHANT_TYPES.AMPLIFIER;
          rebuildEnchantmentRings();
          spawnFloatingPop('⏳ +3 Stability & Amplifier Slot!', 'text-sky-300', 4800);
          showToast(`⏳ Tectonic Anchor added +3 Stability & upgraded Col ${col + 1} to a Wild Amplifier Slot!`, '💎');
        } else {
          state.enchantGrid[availR][col] = ENCHANT_TYPES.GILDED;
          rebuildEnchantmentRings();
          spawnFloatingPop('⏳ +3 Stability & Gilded Slot!', 'text-amber-300', 4800);
          showToast(`⏳ Tectonic Anchor reinforced +3 Stability & gilded the next slot in Col ${col + 1}!`, '⏳');
        }
      } else {
        spawnFloatingPop('⏳ +3 Seismic Stability!', 'text-amber-300', 4800);
        showToast('⏳ Tectonic Anchor reinforced the cavern ceiling for +3 Seismic Stability!', '⏳');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  lodestone(handIdx, col, effCost) {
    const card = CARD_CATALOG.lodestone;
    const occupiedRows = [];
    const playerTokens = [];
    const blockerTokens = [];
    const playerFromRows = [];
    const blockerFromRows = [];

    for (let r = 0; r < ROWS; r++) {
      const cell = state.board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        occupiedRows.push(r);
        if (cell === PLAYER || cell === WILD) {
          playerTokens.push(cell);
          playerFromRows.push(r);
        } else {
          blockerTokens.push(cell);
          blockerFromRows.push(r);
        }
      }
    }

    if (occupiedRows.length < 2 || playerTokens.length === 0 || blockerTokens.length === 0) {
      showToast(`Col ${col + 1} needs both your tokens and AI/Stone pieces to polarize!`, '🧲');
      return true;
    }

    const polarizedStack = [...blockerTokens, ...playerTokens];
    const anyChanged = occupiedRows.some((r, i) => state.board[r][col] !== polarizedStack[i]);
    if (!anyChanged) {
      showToast(`Your tokens are already at the top of Col ${col + 1}!`, '🧲');
      return true;
    }

    const orderedFromRows = [...blockerFromRows, ...playerFromRows];
    const transitions = orderedFromRows.map((fromR, i) => ({
      fromR,
      toR: occupiedRows[i],
      isPlayerType: i >= blockerFromRows.length
    }));

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playLodestonePolarity();
    triggerHaptic([25, 25, 45]);
    spawn3DColumnBeam(col, 0x38bdf8, 0.42, 560, true);
    setStatusBanner(true, `🧲 Lodestone Polarity levitating tokens in Col ${col + 1}...`);

    runCardVFXWithCallback(playLodestonePolarityVFX, [col, transitions], 780, () => {
      for (let i = 0; i < occupiedRows.length; i++) {
        state.board[occupiedRows[i]][col] = polarizedStack[i];
      }
      const highestR = occupiedRows[occupiedRows.length - 1];
      state.lastPlayedCell = [highestR, col];

      rebuildBoardMeshes([col]);
      occupiedRows.forEach((rr) => {
        if (state.meshes[rr] && state.meshes[rr][col]) {
          const isRising = state.board[rr][col] === PLAYER || state.board[rr][col] === WILD;
          state.meshes[rr][col].position.y = state.meshes[rr][col].userData.targetY + (isRising ? -0.32 : 0.36);
          state.meshes[rr][col].userData.velY = 0;
        }
        if (
          (state.board[rr][col] === PLAYER || state.board[rr][col] === WILD) &&
          state.enchantGrid[rr][col] !== ENCHANT_TYPES.NONE
        ) {
          triggerSlotEnchantment(rr, col, PLAYER);
        }
      });

      spawn3DShockwaveRing(highestR, col, 0x2dd4bf, 2.5, 480);
      spawn3DParticleBurst(highestR, col, 0xfbbf24, 16, 0.13, 480, 'octa');
      spawnFloatingPop('🧲 Polarity Pulled Tokens Up!', 'text-teal-300', 4800);
      showToast(`🧲 Lodestone Polarity pulled your tokens to the top of Col ${col + 1}!`, '🧲');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  hibachi(handIdx, col, effCost) {
    const card = CARD_CATALOG.hibachi;
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    const hasAi = topR !== -1 && state.board[topR][col] === AI;

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playHibachiSizzle();
    triggerHaptic([35, 25, 50]);
    setStatusBanner(true, `🍜 Spicy Miso Hibachi Flare searing Col ${col + 1}...`);

    runCardVFXWithCallback(playHibachiFlareVFX, [topR !== -1 ? topR : 2, col, hasAi], 780, () => {
      state.stability += 2;
      if (hasAi) {
        state.board[topR][col] = EMPTY;
        rebuildBoardMeshes([col]);
        onTokenShattered(1);
        showToast(`🍜 Hibachi Flare seared AI token in Col ${col + 1} & restored +2 Stability!`, '🔥');
      } else {
        showToast('🍜 Hibachi Flare warmed the cavern for +2 Seismic Stability!', '🍜');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  alchemy_crucible(handIdx, col, effCost) {
    const card = CARD_CATALOG.alchemy_crucible;
    let targetR = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === AI || state.board[r][col] === STONE) {
        targetR = r;
        break;
      }
    }
    if (targetR === -1) {
      showToast('Pick a column containing an AI or Petrified Stone token to smelt!', '⚗️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playAlchemyCrucible();
    triggerHaptic([35, 25, 55]);
    spawn3DColumnBeam(col, 0xe879f9, 0.42, 540, true);
    setStatusBanner(true, `⚗️ Alchemical Crucible dissolving blocker in Col ${col + 1}...`);

    runCardVFXWithCallback(playAlchemyCrucibleVFX, [targetR, targetR, col], 780, () => {
      state.board[targetR][col] = EMPTY;
      state.gold += 2;
      applyColumnGravity(col);
      rebuildBoardMeshes([col]);
      onTokenShattered(1);

      const enchantRow = aiEngine.getAvailableRow(state.board, col);
      const slotRow = enchantRow !== -1 ? enchantRow : targetR;
      if (state.enchantGrid && state.enchantGrid[slotRow]) {
        state.enchantGrid[slotRow][col] = ENCHANT_TYPES.AMPLIFIER;
        rebuildEnchantmentRings();
      }

      triggerSettledColumnEnchantments(col);
      spawnFloatingPop('⚗️ Smelted: +$2 & Wild Slot!', 'text-sky-300', 5000);
      showToast(
        `⚗️ Alchemical Crucible smelted blocker in Col ${col + 1} for +$2 Gold & spawned a Wild Amplifier Slot!`,
        '⚗️'
      );
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  guillotine_blade(handIdx, col, effCost) {
    const card = CARD_CATALOG.guillotine_blade;
    const spanCols = [col];
    if (state.isCylinderPhase) { spanCols.push((col - 1 + COLS) % COLS, (col + 1) % COLS); } else { if (col > 0) spanCols.push(col - 1); if (col < COLS - 1) spanCols.push(col + 1); }

    let bestCol = -1;
    let bestTopR = -1;
    let bestPriority = -1;
    for (const c of spanCols) {
      const topR = aiEngine.getTopOccupiedRow(state.board, c);
      if (topR !== -1 && (state.board[topR][c] === AI || state.board[topR][c] === STONE)) {
        const isAiPiece = state.board[topR][c] === AI ? 1 : 0;
        const isTargetCol = c === col ? 1 : 0;
        const prio = topR * 100 + isAiPiece * 10 + isTargetCol;
        if (prio > bestPriority) {
          bestPriority = prio;
          bestCol = c;
          bestTopR = topR;
        }
      }
    }
    if (bestCol === -1) {
      showToast('Pick a 3-column span with at least 1 exposed AI or Stone token on top to decapitate!', '🪓');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playGuillotineSlice();
    triggerHaptic([40, 25, 65]);
    setStatusBanner(true, `🪓 Dropping Weighted Guillotine down Col ${bestCol + 1}...`);

    runCardVFXWithCallback(playGuillotineBladeVFX, [bestCol, bestTopR], 800, () => {
      state.board[bestTopR][bestCol] = EMPTY;
      state.gold += 2;
      rebuildBoardMeshes([bestCol]);
      onTokenShattered(1);
      spawnFloatingPop('🪓 Guillotine: Decapitated & +$2!', 'text-rose-300', 4800);
      showToast(`🪓 Weighted Guillotine decapitated the tallest stack (Col ${bestCol + 1}) & minted +$2 Gold!`, '🪓');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  mercury_siphon(handIdx, col, effCost) {
    const card = CARD_CATALOG.mercury_siphon;
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    if (topR === -1) {
      showToast(`Col ${col + 1} is empty!`, '🌡️');
      return true;
    }
    const candidates = (state.isCylinderPhase ? [(col - 1 + COLS) % COLS, (col + 1) % COLS] : [col - 1, col + 1]).filter((nc) => nc >= 0 && nc < COLS && aiEngine.getAvailableRow(state.board, nc) !== -1);
    if (candidates.length === 0) {
      showToast('Adjacent columns are full!', '⚠️');
      return true;
    }
    const origCell = state.board[topR][col];
    let movingType = origCell;
    if (movingType === STONE || movingType === AI) movingType = PLAYER;
    let destCol = candidates[0];
    if (candidates.length > 1) {
      let bestCandScore = -Infinity;
      for (const nc of candidates) {
        const nr = aiEngine.getAvailableRow(state.board, nc);
        state.board[topR][col] = EMPTY;
        state.board[nr][nc] = movingType;
        const wins = !!aiEngine.findWinningLine(state.board, PLAYER);
        const ench = (state.enchantGrid && state.enchantGrid[nr]) ? state.enchantGrid[nr][nc] : ENCHANT_TYPES.NONE;
        const enchBonus = (ench === ENCHANT_TYPES.GILDED || ench === ENCHANT_TYPES.SPICE || ench === ENCHANT_TYPES.WEB) ? 50 : 0;
        const centerBonus = 10 - Math.abs(nc - 3) * 2;
        const candScore = (wins ? 10000 : 0) + enchBonus + centerBonus;
        state.board[nr][nc] = EMPTY;
        state.board[topR][col] = origCell;
        if (candScore > bestCandScore) {
          bestCandScore = candScore;
          destCol = nc;
        }
      }
    }
    const destR = aiEngine.getAvailableRow(state.board, destCol);

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playQuicksilverFlow();
    triggerHaptic([25, 25, 40]);
    setStatusBanner(true, `🌡️ Quicksilver Siphon flowing from Col ${col + 1} to Col ${destCol + 1}...`);

    if (state.meshes[topR] && state.meshes[topR][col]) {
      state.meshes[topR][col].visible = false;
    }

    runCardVFXWithCallback(playQuicksilverSiphonVFX, [topR, col, destR, destCol], 780, () => {
      state.board[topR][col] = EMPTY;
      state.board[destR][destCol] = movingType;
      state.stability += 1;
      rebuildBoardMeshes([col, destCol]);
      triggerSlotEnchantment(destR, destCol, movingType === AI ? AI : PLAYER);
      spawnFloatingPop(`🌡️ Siphoned to Col ${destCol + 1} & +1 Stab!`, 'text-sky-300', 4800);
      showToast(`🌡️ Quicksilver Siphon slid the top of Col ${col + 1} into Col ${destCol + 1} & restored +1 Stability!`, '🌡️');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  mimic_tooth(handIdx, col, effCost) {
    const card = CARD_CATALOG.mimic_tooth;
    const stoneRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (state.board[r][col] === STONE) stoneRows.push(r);
    }
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    const vfxRows = stoneRows.length > 0 ? stoneRows : [Math.max(0, topR)];

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playMimicChomp();
    triggerHaptic([35, 25, 55]);
    setStatusBanner(true, `🦷 Ravenous Mimic Tooth chomping Col ${col + 1}...`);

    runCardVFXWithCallback(playMimicToothVFX, [col, vfxRows], 800, () => {
      if (stoneRows.length > 0) {
        stoneRows.forEach((sr) => {
          state.board[sr][col] = EMPTY;
        });
        const goldGain = stoneRows.length * 3;
        state.gold += goldGain;
        sfx.playCoinDing();
        applyColumnGravity(col);
        rebuildBoardMeshes([col]);
        onTokenShattered(stoneRows.length);
        triggerSettledColumnEnchantments(col);
        spawnFloatingPop(`🦷 Mimic Chomp: +$${goldGain} Gold!`, 'text-amber-300', 5000);
        showToast(`🦷 Ravenous Mimic Tooth devoured ${stoneRows.length} Stone(s) in Col ${col + 1} for +$${goldGain} Gold!`, '🦷');
      } else if (topR !== -1 && state.board[topR][col] === AI) {
        state.board[topR][col] = EMPTY;
        if (state.enchantGrid && state.enchantGrid[topR]) {
          state.enchantGrid[topR][col] = ENCHANT_TYPES.GILDED;
          rebuildEnchantmentRings();
        }
        rebuildBoardMeshes([col]);
        onTokenShattered(1);
        showToast(`🦷 Ravenous Mimic Tooth chomped the top AI token in Col ${col + 1} & left a Gilded Slot!`, '🦷');
      } else {
        const ar = aiEngine.getAvailableRow(state.board, col);
        state.gold += 2;
        if (ar !== -1 && state.enchantGrid && state.enchantGrid[ar]) {
          state.enchantGrid[ar][col] = ENCHANT_TYPES.GILDED;
          rebuildEnchantmentRings();
        }
        showToast(`🦷 Ravenous Mimic Tooth gilded Col ${col + 1} & coughed up +$2 Gold!`, '🦷');
      }
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  inversion(handIdx, col, effCost) {
    const card = CARD_CATALOG.inversion;
    const occupiedRows = [];
    const stack = [];
    for (let r = 0; r < ROWS; r++) {
      if (state.board[r][col] !== EMPTY && state.board[r][col] !== VOID_CELL) {
        occupiedRows.push(r);
        stack.push(state.board[r][col]);
      }
    }
    if (stack.length < 2) {
      showToast('Need at least 2 tokens to invert!', '⚠️');
      return true;
    }

    state.busy = true;
    sfx.playGravityVortex();
    triggerHaptic([25, 30, 45]);
    consumeCardAndClearSelection(handIdx, effCost);
    setStatusBanner(true, `🌀 Gravity Inversion flipping Col ${col + 1} upside down...`);

    runCardVFXWithCallback(playColumnInversionVFX, [col], 760, () => {
      stack.reverse();
      for (let i = 0; i < occupiedRows.length; i++) {
        state.board[occupiedRows[i]][col] = stack[i];
      }
      triggerSettledColumnEnchantments(col);
      rebuildBoardMeshes([col]);
      showToast(`🌀 Gravity Inversion flipped Col ${col + 1} upside down!`, '🌀');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  pendulum_scythe(handIdx, col, effCost) {
    const card = CARD_CATALOG.pendulum_scythe;
    let targetRow = aiEngine.getTopOccupiedRow(state.board, col);
    if (targetRow === -1) {
      for (let r = ROWS - 1; r >= 0; r--) {
        if (state.board[r].some((cell) => cell === AI || cell === STONE)) {
          targetRow = r;
          break;
        }
      }
    }
    if (targetRow === -1) {
      showToast('No tokens on the board for Pendulum Scythe to sweep!', '⚔️');
      return true;
    }

    const hitCols = [];
    const colOrder = [col, ...Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== col)];
    for (const c of colOrder) {
      if (hitCols.length >= 2) break;
      if (state.board[targetRow][c] === AI || state.board[targetRow][c] === STONE) {
        hitCols.push(c);
      }
    }
    if (hitCols.length === 0) {
      showToast(`No AI or Stone tokens on Row ${targetRow + 1} to slice!`, '⚔️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playPendulumWhoosh();
    triggerHaptic([35, 25, 55]);
    setStatusBanner(true, `⚔️ Swinging Pendulum Scythe across Row ${targetRow + 1}...`);

    runCardVFXWithCallback(playPendulumScytheVFX, [targetRow, hitCols], 820, () => {
      hitCols.forEach((c) => {
        state.board[targetRow][c] = EMPTY;
        applyColumnGravity(c);
      });
      rebuildBoardMeshes(hitCols);
      onTokenShattered(hitCols.length);
      hitCols.forEach((c) => triggerSettledColumnEnchantments(c));
      spawnFloatingPop(`⚔️ Pendulum Scythe: Sliced ${hitCols.length} Token(s)!`, 'text-teal-300', 4800);
      showToast(`⚔️ Swinging Pendulum Scythe swept Row ${targetRow + 1} & shattered ${hitCols.length} blocker(s)!`, '⚔️');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  wax_effigy(handIdx, col, effCost) {
    const card = CARD_CATALOG.wax_effigy;
    let aiRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === AI) {
        aiRow = r;
        break;
      }
    }
    if (aiRow === -1) {
      for (let c = 0; c < COLS; c++) {
        const topR = aiEngine.getTopOccupiedRow(state.board, c);
        if (topR !== -1 && state.board[topR][c] === AI) {
          col = c;
          aiRow = topR;
          break;
        }
      }
    }
    if (aiRow === -1) {
      showToast('No AI token available to hex with Pins & Wax Effigy!', '🪡');
      return true;
    }
    const neighborCol = state.isCylinderPhase ? ((col + 1) % COLS) : (col < COLS - 1 ? col + 1 : col - 1);

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playWaxEffigyPierce();
    triggerHaptic([25, 30, 45]);
    setStatusBanner(true, `🪡 Piercing Pins & Wax Effigy on Col ${col + 1}...`);

    runCardVFXWithCallback(playWaxEffigyVFX, [aiRow, col, neighborCol], 800, () => {
      state.board[aiRow][col] = PLAYER;
      state.lastPlayedCell = [aiRow, col];
      state.stability += 1;

      const ar = aiEngine.getAvailableRow(state.board, neighborCol);
      if (ar !== -1 && state.enchantGrid && state.enchantGrid[ar]) {
        state.enchantGrid[ar][neighborCol] = ENCHANT_TYPES.WEB;
        rebuildEnchantmentRings();
      }
      rebuildBoardMeshes([col]);
      spawnFloatingPop('🪡 Wax Effigy: Stole AI Token & Hexed Web!', 'text-purple-300', 4800);
      showToast(`🪡 Pins & Wax Effigy converted the top AI token in Col ${col + 1} & hexed Col ${neighborCol + 1} with a Web Slot!`, '🪡');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  transmute(handIdx, col, effCost) {
    const card = CARD_CATALOG.transmute;
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    if (topR === -1 || (state.board[topR][col] !== AI && state.board[topR][col] !== STONE)) {
      showToast('Pick a column topped by an AI or Stone token!', '⚠️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playSurrealTransmute();
    triggerHaptic([20, 35, 30]);
    setStatusBanner(true, `✨ Surrealist Transmute warping top of Col ${col + 1}...`);

    runCardVFXWithCallback(playSurrealTransmuteVFX, [topR, col], 760, () => {
      state.board[topR][col] = PLAYER;
      state.gold += 2;
      state.lastPlayedCell = [topR, col];
      rebuildBoardMeshes();
      if (state.enchantGrid[topR][col] !== ENCHANT_TYPES.NONE) {
        triggerSlotEnchantment(topR, col, PLAYER);
      }
      showToast(`✨ Surrealist Transmute warped top of Col ${col + 1} into your Amber token (+$2 Gold)!`, '✨');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  echo_drop(handIdx, col, effCost) {
    const card = CARD_CATALOG.echo_drop;
    const r1 = aiEngine.getAvailableRow(state.board, col);
    if (r1 === -1) {
      showToast('Column is full!', '⚠️');
      return true;
    }
    const r2 = r1 + 1 < ROWS && (!state.boardMask || state.boardMask[r1 + 1][col]) ? r1 + 1 : -1;

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playEchoTwinDrop();
    triggerHaptic([25, 35, 45]);
    setStatusBanner(true, `♊ Subterranean Echo Drop resonating in Col ${col + 1}...`);

    runCardVFXWithCallback(playEchoTwinDropVFX, [r1, r2, col], 760, () => {
      spawnTokenMesh(r1, col, PLAYER);
      state.lastPlayedCell = [r1, col];
      triggerSlotEnchantment(r1, col, PLAYER);
      checkPlayerDropGambits(col);
      const nextR = aiEngine.getAvailableRow(state.board, col);
      if (nextR !== -1) {
        spawnTokenMesh(nextR, col, PLAYER);
        state.lastPlayedCell = [nextR, col];
        if (state.meshes[nextR] && state.meshes[nextR][col]) {
          state.meshes[nextR][col].position.y += CELL_SPACING * 0.85;
        }
        triggerSlotEnchantment(nextR, col, PLAYER);
        checkPlayerDropGambits(col);
      }
      showToast(`♊ Echo Drop stacked 2 tokens in Col ${col + 1}!`, '♊');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  hydraulic_piston(handIdx, col, effCost) {
    const card = CARD_CATALOG.hydraulic_piston;
    const neighborCol = state.isCylinderPhase ? ((col + 1) % COLS) : (col < COLS - 1 ? col + 1 : col - 1);
    const stackA = [];
    const stackB = [];
    for (let r = 0; r < ROWS; r++) {
      if (state.board[r][col] !== EMPTY && state.board[r][col] !== VOID_CELL) stackA.push(state.board[r][col]);
      if (state.board[r][neighborCol] !== EMPTY && state.board[r][neighborCol] !== VOID_CELL) stackB.push(state.board[r][neighborCol]);
    }
    if (stackA.length === 0 && stackB.length === 0) {
      showToast('Both columns are empty!', '⚠️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playSteamPistonHiss();
    triggerHaptic([30, 30, 45]);
    setStatusBanner(true, `🔩 Steam Hydraulic Piston swapping Col ${col + 1} & Col ${neighborCol + 1}...`);

    runCardVFXWithCallback(playSteamHydraulicPistonVFX, [col, neighborCol], 820, () => {
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][col] !== VOID_CELL) state.board[r][col] = EMPTY;
        if (state.board[r][neighborCol] !== VOID_CELL) state.board[r][neighborCol] = EMPTY;
      }
      let idxA = 0;
      let idxB = 0;
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][col] !== VOID_CELL && idxB < stackB.length) {
          state.board[r][col] = stackB[idxB++];
        }
        if (state.board[r][neighborCol] !== VOID_CELL && idxA < stackA.length) {
          state.board[r][neighborCol] = stackA[idxA++];
        }
      }
      state.stability += 2;
      rebuildBoardMeshes([col, neighborCol]);
      triggerSettledColumnEnchantments(col);
      triggerSettledColumnEnchantments(neighborCol);
      showToast(`🔩 Steam Hydraulic Piston swapped Col ${col + 1} & Col ${neighborCol + 1} (+2 Stability)!`, '🔩');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  ouroboros_fang(handIdx, col, effCost) {
    const card = CARD_CATALOG.ouroboros_fang;
    const spanCols = [col];
    if (state.isCylinderPhase) { spanCols.push((col - 1 + COLS) % COLS, (col + 1) % COLS); } else { if (col > 0) spanCols.push(col - 1); if (col < COLS - 1) spanCols.push(col + 1); }

    const hasAnyToken = spanCols.some((c) => aiEngine.getBottomOccupiedRow(state.board, c) !== -1);
    if (!hasAnyToken) {
      showToast('No tokens in target columns for Ouroboros World-Eater!', '🐍');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playOuroborosDevour();
    triggerHaptic([35, 30, 55]);
    setStatusBanner(true, '🐍 Ouroboros World-Eater cycling bottom row to the top...');

    runCardVFXWithCallback(playOuroborosWorldEaterVFX, [col, spanCols], 860, () => {
      let digested = 0;
      let cycled = 0;
      const touchedCols = [];

      for (const c of spanCols) {
        const botR = aiEngine.getBottomOccupiedRow(state.board, c);
        if (botR !== -1) {
          const botType = state.board[botR][c];
          state.board[botR][c] = EMPTY;
          applyColumnGravity(c);
          touchedCols.push(c);
          if (botType === AI || botType === STONE) {
            digested++;
            spawn3DParticleBurst(botR, c, 0x4ade80, 14, 0.13, 460, 'octa');
          } else {
            const topAvail = aiEngine.getAvailableRow(state.board, c);
            if (topAvail !== -1) {
              state.board[topAvail][c] = botType;
              cycled++;
              spawn3DShockwaveRing(topAvail, c, 0xfde047, 2.4, 460);
            }
          }
        }
      }
      if (digested > 0) {
        state.gold += digested * 2;
        onTokenShattered(digested);
      }
      rebuildBoardMeshes(touchedCols);
      touchedCols.forEach((c) => triggerSettledColumnEnchantments(c));
      spawnFloatingPop(`🐍 Ouroboros: ${digested} Digested (+$${digested * 2}) / ${cycled} Cycled!`, 'text-emerald-300', 5000);
      showToast(`🐍 Ouroboros World-Eater digested ${digested} enemy/stone piece(s) (+$${digested * 2}) & looped ${cycled} of yours to the top!`, '🐍');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  croupier_jackpot(handIdx, col, effCost) {
    const card = CARD_CATALOG.croupier_jackpot;
    const previewR = aiEngine.getAvailableRow(state.board, col);
    const topR = aiEngine.getTopOccupiedRow(state.board, col);
    if (previewR === -1 && (topR === -1 || (state.board[topR][col] !== AI && state.board[topR][col] !== STONE))) {
      showToast('Column is already full of your tokens!', '⚠️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playMidasFanfare();
    triggerHaptic([35, 25, 55]);
    setStatusBanner(true, `🎰 Spinning Croupier's Rigged Jackpot on Col ${col + 1}...`);

    runCardVFXWithCallback(playCroupierJackpotVFX, [col, previewR], 860, () => {
      let r = aiEngine.getAvailableRow(state.board, col);
      if (r !== -1) {
        spawnTokenMesh(r, col, PLAYER);
        triggerSlotEnchantment(r, col, PLAYER);
        checkPlayerDropGambits(col);
      } else if (topR !== -1 && (state.board[topR][col] === AI || state.board[topR][col] === STONE)) {
        state.board[topR][col] = PLAYER;
        state.lastPlayedCell = [topR, col];
        rebuildBoardMeshes([col]);
      }

      let gildedAdded = 0;
      for (let rr = 0; rr < ROWS && gildedAdded < 2; rr++) {
        if (state.board[rr][col] === EMPTY && state.enchantGrid && state.enchantGrid[rr]) {
          state.enchantGrid[rr][col] = ENCHANT_TYPES.GILDED;
          gildedAdded++;
        }
      }
      rebuildEnchantmentRings();

      let totalEnchants = 0;
      for (let rr = 0; rr < ROWS; rr++) {
        for (let cc = 0; cc < COLS; cc++) {
          if (state.enchantGrid && state.enchantGrid[rr] && state.enchantGrid[rr][cc] !== ENCHANT_TYPES.NONE) {
            totalEnchants++;
          }
        }
      }
      const payout = Math.max(3, totalEnchants);
      state.gold += payout;
      spawnFloatingPop(`🎰 Croupier Jackpot: Token & +$${payout} Gold!`, 'text-amber-300', 5000);
      showToast(`🎰 Croupier's Rigged Jackpot dropped your token in Col ${col + 1}, gilded ${gildedAdded} slot(s), & paid +$${payout} Gold!`, '🎰');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  brimstone_beam(handIdx, col, effCost) {
    const card = CARD_CATALOG.brimstone_beam;
    const targetRows = [];
    for (let rr = 0; rr < ROWS; rr++) {
      if (state.board[rr][col] === AI || state.board[rr][col] === STONE) {
        targetRows.push(rr);
      }
    }
    if (targetRows.length === 0) {
      showToast('Pick a column containing at least 1 AI or Petrified Stone token to vaporize!', '⚠️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playBrimstoneLaser();
    triggerHaptic([60, 30, 90, 30, 70]);
    setStatusBanner(true, `🩸 Charging Sulfuric Brimstone Laser over Col ${col + 1}...`);

    runCardVFXWithCallback(playBrimstoneLaserVFX, [col, targetRows], 840, () => {
      targetRows.forEach((rr) => {
        state.board[rr][col] = EMPTY;
      });
      applyColumnGravity(col);
      rebuildBoardMeshes([col]);
      onTokenShattered(targetRows.length);
      triggerSettledColumnEnchantments(col);

      spawnFloatingPop(`🩸 BRIMSTONE! Vaporized ${targetRows.length} Piece(s)!`, 'text-rose-400', 5200);
      showToast(`🩸 Sulfuric Brimstone Laser obliterated ${targetRows.length} AI/Stone token(s) in Col ${col + 1}!`, '🩸');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  basilisk_gaze(handIdx, col, effCost) {
    const card = CARD_CATALOG.basilisk_gaze;
    const colOrder = [col, ...Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== col)];
    const calcifiedTargets = [];
    for (const c of colOrder) {
      if (calcifiedTargets.length >= 2) break;
      const topR = aiEngine.getTopOccupiedRow(state.board, c);
      if (topR !== -1 && state.board[topR][c] === AI) {
        calcifiedTargets.push([topR, c]);
      }
    }
    if (calcifiedTargets.length === 0) {
      showToast('No top AI tokens on the board for Petrifying Basilisk Gaze!', '🦎');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playBasiliskHiss();
    triggerHaptic([40, 30, 65]);
    setStatusBanner(true, '🦎 Petrifying Basilisk Gaze sweeping the cavern...');

    runCardVFXWithCallback(playBasiliskGazeVFX, [calcifiedTargets], 860, () => {
      calcifiedTargets.forEach(([tr, tc]) => {
        state.board[tr][tc] = STONE;
      });
      const [sr, sc] = calcifiedTargets[0];
      state.board[sr][sc] = EMPTY;
      applyColumnGravity(sc);
      state.gold += 4;
      state.stability += 3;

      rebuildBoardMeshes(calcifiedTargets.map(([, c]) => c));
      onTokenShattered(1);
      spawnFloatingPop('🦎 Basilisk Gaze: Calcified, +$4 & +3 Stab!', 'text-lime-300', 5000);
      showToast(`🦎 Petrifying Basilisk Gaze calcified ${calcifiedTargets.length} AI token(s), shattered 1 for +$4 Gold, & restored +3 Stability!`, '🦎');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  seraphim_halo(handIdx, col, effCost) {
    const card = CARD_CATALOG.seraphim_halo;
    const availCheck = aiEngine.getAvailableRow(state.board, col);
    let hasBlockerInCol = false;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === AI || state.board[r][col] === STONE) {
        hasBlockerInCol = true;
        break;
      }
    }
    if (availCheck === -1 && !hasBlockerInCol) {
      showToast('Column is already full of your tokens!', '⚠️');
      return true;
    }

    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playSacredHeartChoir();
    triggerHaptic([35, 30, 60]);
    setStatusBanner(true, `🪽 Six-Winged Seraphim Halo descending upon Col ${col + 1}...`);

    runCardVFXWithCallback(playSeraphimHaloVFX, [col], 860, () => {
      state.stability += 3;
      let sanctifiedR = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (state.board[r][col] === AI || state.board[r][col] === STONE) {
          state.board[r][col] = PLAYER;
          state.lastPlayedCell = [r, col];
          sanctifiedR = r;
          break;
        }
      }
      const availR = aiEngine.getAvailableRow(state.board, col);
      if (availR !== -1) {
        spawnTokenMesh(availR, col, PLAYER);
        triggerSlotEnchantment(availR, col, PLAYER);
        checkPlayerDropGambits(col);
      }
      rebuildBoardMeshes([col]);
      const effR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
      spawn3DShockwaveRing(effR, col, 0xfacc15, 2.8, 520);
      spawn3DParticleBurst(effR, col, 0xfde047, 20, 0.15, 540, 'octa');
      spawnFloatingPop('🪽 Seraphim Halo: Sanctified, Drop & +3 Stab!', 'text-amber-200', 5000);
      showToast(
        sanctifiedR !== -1
          ? `🪽 Six-Winged Seraphim Halo sanctified a blocker in Col ${col + 1} to your color, dropped a token, & restored +3 Stability!`
          : `🪽 Six-Winged Seraphim Halo blessed Col ${col + 1} with a token drop & +3 Seismic Stability!`,
        '🪽'
      );
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  },

  dead_weight(handIdx, col, effCost) {
    const card = CARD_CATALOG.dead_weight;
    const effR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    state.busy = true;
    consumeCardAndClearSelection(handIdx, effCost);
    sfx.playCurseBanish();
    triggerHaptic([25, 20, 35]);
    setStatusBanner(true, '🪨 Pulverizing Dead Weight Curse Stone...');

    runCardVFXWithCallback(playPetrifiedBlockVFX, [effR, col], 740, () => {
      spawn3DShockwaveRing(effR, col, 0xa855f7, 2.5, 480);
      spawn3DParticleBurst(effR, col, 0xe2e8f0, 16, 0.13, 480, 'octa');
      showToast('🪨 Dead Weight Stone pulverized & permanently banished from your deck!', '✨');
      finalizeChoreographedCard(card, effCost);
    });
    return true;
  }
};

function triggerPostCardCastGambits(card, effCost) {
  if (!card || card.id === 'dead_weight') return;

  if (state.loadoutId === 'chronomancer' && !state.firstCardCastDoneThisFloor) {
    state.firstCardCastDoneThisFloor = true;
    state.stability += 1;
    spawnFloatingPop('⏳ Temporal Weaver: +1 Stability!', 'text-purple-300', 4600);
  }

  // Gilded Canary Cage Gambit: +$1 Gold whenever you cast a 0M or 1M card
  if (hasGambit('lucky_rabbit_paw') && effCost <= 1) {
    state.gold += 1;
    pulseGambitBadgeInHUD('lucky_rabbit_paw');
    spawnFloatingPop('🐾 Lucky Paw: +$1 Gold!', 'text-amber-300', 4000);
  }

  // Grandmaster's Monocle Gambit: +$2 Gold whenever you cast a Tier 3 card
  if (hasGambit('jeweler_loupe') && (card.tier || 1) >= 3) {
    state.gold += 2;
    sfx.playCoinDing();
    pulseGambitBadgeInHUD('jeweler_loupe');
    spawnFloatingPop("🔍 Jeweler's Loupe: +$2 Gold!", 'text-sky-300', 4400);
  }

  // Alchemical Forge Bellows Gambit: Casting 2 cards in the same turn refunds +1 Mana & +$1 Gold
  state.cardsCastThisTurn = (state.cardsCastThisTurn || 0) + 1;
  if (hasGambit('copper_retort') && state.cardsCastThisTurn >= 2 && !state.bellowsTriggeredThisTurn) {
    state.bellowsTriggeredThisTurn = true;
    state.mana = Math.min(state.maxMana + 2, state.mana + 1);
    state.gold += 1;
    sfx.playCoinDing();
    pulseGambitBadgeInHUD('copper_retort');
    spawnFloatingPop('🏺 Copper Retort: +1 Mana & +$1 Gold!', 'text-amber-300', 4800);
    showToast('🏺 Copper Retort Flask (2nd Spell This Turn): Distilled +1 Mana & +$1 Gold!', '⚗️', 4500);
  }
}

function castCardOnColumn(handIdx, col) {
  const cardId = state.hand[handIdx];
  const card = CARD_CATALOG[cardId];
  const effCost = getEffectiveCardCost(cardId);
  if (!card || state.mana < effCost) return;

  if (hasGambit('dali_clock') && DALI_DISCOUNTED_CARDS.has(cardId)) {
    sfx.playDaliClockTick();
    pulseGambitBadgeInHUD('dali_clock');
    spawnFloatingPop('🕰️ Dalí Clock: -1 Mana Discount!', 'text-teal-300', 4200);
  }

  const prevDeckLen = state.masterDeck.length;
  const handler = CARD_EFFECT_HANDLERS[cardId];
  if (handler) {
    const handledManaAndCompletion = handler(handIdx, col, effCost);
    if (handledManaAndCompletion) {
      if (state.masterDeck.length < prevDeckLen) {
        triggerPostCardCastGambits(card, effCost);
        updateHUD();
      }
      return;
    }
  }

  consumeCardAndClearSelection(handIdx, effCost);
  triggerPostCardCastGambits(card, effCost);
  if (resolvePostCardWinState()) return;
  updateHUD();
  updateTelemetryBadges();
}

// ============================================================================
// AI TURN, TELEGRAPHED BOSS RULES & STALACTITE COLLAPSE
// ============================================================================
function triggerAITurn() {
  state.turn = AI;
  state.busy = true;
  clearActionSelection();
  updateColumnPreviewVisual(-1);
  setStatusBanner(false, 'Opponent AI is calculating minimax response...');

  setTimeout(() => {
    if (state.gameOver) return;

    const prePlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
    if (prePlayerWin) {
      handleFloorVictory(prePlayerWin);
      return;
    }

    const floorData = getFloorConfig(state.floorIdx);
    const decision = aiEngine.analyzeBoard(state.board, floorData.depth, state.enchantGrid, true, floorData.isBoss);
    let col = decision.bestCol;

    if (col === -1) {
      const validCols = getPlayableColumns();
      if (validCols.length > 0) col = validCols[0];
    }

    if (col !== -1) {
      const r = aiEngine.getAvailableRow(state.board, col);
      sfx.playWoodClack(false);
      spawnTokenMesh(r, col, AI);
      triggerSlotEnchantment(r, col, AI);
    }

    // Check if the AI's standard token drop immediately ended the floor before firing Boss abilities
    const immediatePlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
    if (immediatePlayerWin) {
      handleFloorVictory(immediatePlayerWin);
      return;
    }

    const checkAndResolveAIWin = () => {
      const aiWin = aiEngine.findWinningLine(state.board, AI);
      if (!aiWin) return false;
      if (hasGambit('obsidian_cat') && !state.catNineLivesUsed) {
        state.catNineLivesUsed = true;
        sfx.playCatMeowSlash(true);
        triggerHaptic([45, 25, 70]);
        triggerBoardShake(0.30);
        pulseGambitBadgeInHUD('obsidian_cat');
        const [winR, winC] = aiWin[aiWin.length - 1];
        spawn3DShockwaveRing(winR, winC, 0xfacc15, 2.8, 520);
        spawn3DParticleBurst(winR, winC, 0xa855f7, 20, 0.15, 540, 'cone');
        state.board[winR][winC] = EMPTY;
        applyColumnGravity(winC);
        rebuildBoardMeshes([winC]);
        onTokenShattered(1);
        showToast("🐈‍⬛ NINE LIVES! Obsidian Cat clawed & shattered the AI's winning 4th token!", '🐈‍⬛');
        return false;
      }
      handleFloorDefeat(aiWin);
      return true;
    };

    if (checkAndResolveAIWin()) {
      return;
    }

    const finalizeAITurn = () => {
      if (state.gameOver) return;

      const bossShiftPlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
      if (bossShiftPlayerWin) {
        handleFloorVictory(bossShiftPlayerWin);
        return;
      }

      if (checkAndResolveAIWin()) {
        return;
      }

      state.stability--;
      if (state.stability <= 0) {
        const stonesToDrop = state.isCylinderPhase ? 2 : 1;
        const collapsedCols = [];
        for (let sIdx = 0; sIdx < stonesToDrop; sIdx++) {
          const validCols = getPlayableColumns();
          if (validCols.length > 0) {
            const collapseCol = validCols[Math.floor(Math.random() * validCols.length)];
            const cr = aiEngine.getAvailableRow(state.board, collapseCol);
            if (cr !== -1) {
              spawn3DColumnBeam(collapseCol, 0x78716c, 0.42, 460, false);
              spawn3DShockwaveRing(cr, collapseCol, 0xf97316, 2.4, 460);
              spawnTokenMesh(cr, collapseCol, STONE);
              collapsedCols.push(collapseCol + 1);
            }
          }
        }
        if (collapsedCols.length > 0) {
          showToast(
            collapsedCols.length > 1
              ? `🌋 Ethereal Collapse (≤0 Stab) dropped 2 Stones in Cols ${collapsedCols.join(' & ')}!`
              : `🌋 Cavern Collapse dropped Stone in Col ${collapsedCols[0]}!`,
            '🪨'
          );
        }
      }

      if (aiEngine.isBoardFull(state.board)) {
        handleDraw();
        return;
      }

      state.turn = PLAYER;
      state.turnNumber++;
      state.cardsCastThisTurn = 0;
      state.bellowsTriggeredThisTurn = false;
      state.bloodletterHealCountThisTurn = 0;
      if (!state.isCarouselRotating) {
        state.busy = false;
      }

      if (!state.voidFlamePurged) {
        const diff = getActiveDifficulty();
        const regenInterval = diff.manaRegenInterval || 1;
        if (state.turnNumber % regenInterval === 0) {
          const regenAmt = diff.manaRegenPerTurn || 1;
          state.mana = Math.min(state.maxMana, state.mana + regenAmt);
        }

        const drawInterval = diff.drawRateInterval || 1;
        if (state.turnNumber % drawInterval === 0) {
          let cardsToDraw = diff.cardsPerTurn || 1;
          if (diff.bonusDrawEveryNTurns && state.turnNumber % diff.bonusDrawEveryNTurns === 1) {
            cardsToDraw += 1;
          }
          drawCards(cardsToDraw);
        }
      }

      updateHUD();
      updateTelemetryBadges();
      setStatusBanner(true, 'Your Turn • Drag across columns to aim');
    };

    const arch = floorData.isBoss ? floorData.bossArchetype : null;
    const isTesseractSwapDisabled = arch && arch.id === 'sovereign_tesseract' && (
      state.isCylinderPhase || getIntactTesseractBoardIndices().length <= 1
    );
    const isBossAbilityDue = arch && !isTesseractSwapDisabled && (state.turnNumber % getEffectiveBossInterval(arch) === 0);
    if (isBossAbilityDue) {
      setStatusBanner(false, `⚡ ${floorData.boss} is unleashing its Boss Ability...`);
      setTimeout(() => {
        if (state.gameOver) return;
        executeRandomizedBossAbility(arch, finalizeAITurn);
      }, 540);
    } else {
      finalizeAITurn();
    }
  }, 460);
}

const BOSS_ABILITY_HANDLERS = {
  petrifier_archon(onComplete) {
    let bestCol = -1;
    let maxCount = 0;
    let targetRow = -1;
    for (let c = 0; c < COLS; c++) {
      let count = 0;
      let topPlayerR = -1;
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][c] !== EMPTY && state.board[r][c] !== VOID_CELL) count++;
        if (state.board[r][c] === PLAYER) topPlayerR = r;
      }
      if (topPlayerR !== -1 && count >= maxCount) {
        maxCount = count;
        bestCol = c;
        targetRow = topPlayerR;
      }
    }

    // Fallback if no player token is currently on the board: drop/calcify a Stone in an open column
    let isFallbackDrop = false;
    if (bestCol === -1 || targetRow === -1) {
      const openCols = getPlayableColumns();
      if (openCols.length > 0) {
        bestCol = openCols.includes(3) ? 3 : openCols[Math.floor(Math.random() * openCols.length)];
        targetRow = aiEngine.getAvailableRow(state.board, bestCol);
        isFallbackDrop = true;
      } else {
        bestCol = 3;
        targetRow = 2;
      }
    }

    if (typeof playBossPetrifierArchonVFX === 'function') {
      playBossPetrifierArchonVFX(
        targetRow,
        bestCol,
        () => {
          if (isFallbackDrop && targetRow >= 0 && targetRow < ROWS) {
            spawnTokenMesh(targetRow, bestCol, STONE);
            showToast(`🗿 Petrifier Archon summoned a Petrified Stone in Col ${bestCol + 1}!`, '🗿');
          } else if (targetRow >= 0 && targetRow < ROWS) {
            state.board[targetRow][bestCol] = STONE;
            rebuildBoardMeshes();
            showToast(`🗿 Petrifier Archon turned your Col ${bestCol + 1} token into Stone!`, '🗿');
          }
          updateHUD();
        },
        onComplete
      );
      return;
    }

    if (targetRow >= 0 && targetRow < ROWS) {
      state.board[targetRow][bestCol] = STONE;
      rebuildBoardMeshes();
      showToast(`🗿 Petrifier Archon turned your Col ${bestCol + 1} token into Stone!`, '🗿');
    }
    if (typeof onComplete === 'function') onComplete();
  },

  chronos_dali(onComplete) {
    let mc = state.bossMarkedCol;
    const getColOccupied = (c) => {
      const rows = [];
      const vals = [];
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][c] !== EMPTY && state.board[r][c] !== VOID_CELL) {
          rows.push(r);
          vals.push(state.board[r][c]);
        }
      }
      return { rows, vals };
    };

    let { rows: occupiedRows, vals: stack } = getColOccupied(mc);

    // If bossMarkedCol has < 2 tokens, lock onto the column with the most tokens (preferring mixed colors)
    if (stack.length < 2) {
      let bestC = mc;
      let bestScore = -1;
      for (let c = 0; c < COLS; c++) {
        const info = getColOccupied(c);
        if (info.vals.length >= 2) {
          const hasMixed = new Set(info.vals).size > 1 ? 10 : 0;
          const score = info.vals.length + hasMixed;
          if (score > bestScore) {
            bestScore = score;
            bestC = c;
          }
        }
      }
      if (bestScore > -1) {
        mc = bestC;
        state.bossMarkedCol = mc;
        const info = getColOccupied(mc);
        occupiedRows = info.rows;
        stack = info.vals;
      } else {
        // Turn 1 fallback when no column has 2 tokens yet: pick an occupied column and materialize a Temporal Stone at the next open slot so a 2-token stack visibly inverts!
        for (const prefC of [mc, 3, 2, 4, 1, 5, 0, 6]) {
          const info = getColOccupied(prefC);
          const availR = aiEngine.getAvailableRow(state.board, prefC);
          if (info.vals.length >= 1 && availR !== -1) {
            mc = prefC;
            state.bossMarkedCol = mc;
            spawnTokenMesh(availR, mc, STONE);
            if (state.meshes[availR] && state.meshes[availR][mc]) {
              state.meshes[availR][mc].position.y = START_Y + availR * CELL_SPACING;
              state.meshes[availR][mc].userData.velY = 0;
            }
            const updated = getColOccupied(mc);
            occupiedRows = updated.rows;
            stack = updated.vals;
            break;
          }
        }
      }
    }

    const selectNextMarkedCol = () => {
      const multiCols = [];
      const popCols = [];
      for (let c = 0; c < COLS; c++) {
        const info = getColOccupied(c);
        if (info.vals.length >= 2) multiCols.push(c);
        else if (info.vals.length >= 1) popCols.push(c);
      }
      const pool = multiCols.length > 0 ? multiCols : (popCols.length > 0 ? popCols : [2, 3, 4]);
      state.bossMarkedCol = pool[Math.floor(Math.random() * pool.length)];
    };

    if (typeof playBossChronosDaliVFX === 'function') {
      playBossChronosDaliVFX(
        mc,
        occupiedRows,
        () => {
          if (stack.length >= 2) {
            stack.reverse();
            for (let i = 0; i < occupiedRows.length; i++) {
              state.board[occupiedRows[i]][mc] = stack[i];
            }
            rebuildBoardMeshes();
            showToast(`🕰️ Chronos Dalí Warden inverted Col ${mc + 1} upside down!`, '🌀');
          } else {
            showToast(`🕰️ Chronos Dalí Warden warped time in Col ${mc + 1}!`, '🌀');
          }
          selectNextMarkedCol();
          updateHUD();
          updateTelemetryBadges();
        },
        onComplete
      );
      return;
    }

    if (stack.length >= 2) {
      stack.reverse();
      for (let i = 0; i < occupiedRows.length; i++) {
        state.board[occupiedRows[i]][mc] = stack[i];
      }
      rebuildBoardMeshes();
      showToast(`🕰️ Chronos Dalí Warden inverted Col ${mc + 1}!`, '🌀');
    }
    selectNextMarkedCol();
    if (typeof onComplete === 'function') onComplete();
  },

  magma_leviathan(onComplete) {
    const stackedCols = [];
    const anyPopCols = [];
    for (let c = 0; c < COLS; c++) {
      let count = 0;
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][c] !== EMPTY && state.board[r][c] !== VOID_CELL) count++;
      }
      if (count >= 2) stackedCols.push(c);
      if (count >= 1) anyPopCols.push(c);
    }
    const pool = stackedCols.length > 0 ? stackedCols : anyPopCols;
    const tc = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 3;
    const botR = Math.max(0, aiEngine.getBottomOccupiedRow(state.board, tc));

    if (typeof playBossMagmaLeviathanVFX === 'function') {
      playBossMagmaLeviathanVFX(
        botR,
        tc,
        () => {
          if (pool.length > 0 && state.board[botR] && state.board[botR][tc] !== EMPTY && state.board[botR][tc] !== VOID_CELL) {
            state.board[botR][tc] = EMPTY;
            applyColumnGravity(tc);
            onTokenShattered(1);
            rebuildBoardMeshes([tc]);
            showToast(`🌋 Magma Leviathan melted the base of Col ${tc + 1} & shifted the stack down!`, '🔥');
          } else {
            showToast(`🌋 Magma Leviathan erupted molten magma through Col ${tc + 1}!`, '🔥');
          }
          updateHUD();
        },
        onComplete
      );
      return;
    }

    if (pool.length > 0) {
      state.board[botR][tc] = EMPTY;
      applyColumnGravity(tc);
      onTokenShattered(1);
      rebuildBoardMeshes([tc]);
      showToast(`🌋 Magma Leviathan melted the base of Col ${tc + 1} & shifted the stack down!`, '🔥');
    }
    if (typeof onComplete === 'function') onComplete();
  },

  spore_queen(onComplete) {
    const emptyCoords = [];
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === EMPTY && state.enchantGrid[r][c] === ENCHANT_TYPES.NONE) {
          emptyCoords.push([r, c]);
        }
      }
    }
    if (emptyCoords.length === 0) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (state.board[r][c] === EMPTY && state.enchantGrid[r][c] !== ENCHANT_TYPES.CURSED_SPORE) {
            emptyCoords.push([r, c]);
          }
        }
      }
    }
    const picked = emptyCoords.length > 0 ? shuffle(emptyCoords).slice(0, 2) : [[2, 2], [2, 4]];

    if (typeof playBossSporeQueenVFX === 'function') {
      playBossSporeQueenVFX(
        picked,
        () => {
          picked.forEach(([r, c]) => {
            if (state.enchantGrid && state.enchantGrid[r] && state.board[r][c] === EMPTY) {
              state.enchantGrid[r][c] = ENCHANT_TYPES.CURSED_SPORE;
            }
          });
          rebuildEnchantmentRings();
          showToast(`🍄 Spore Queen infected ${picked.length} slots with Cursed Spores!`, '🍄');
          updateHUD();
        },
        onComplete
      );
      return;
    }

    picked.forEach(([r, c]) => {
      if (state.enchantGrid && state.enchantGrid[r] && state.board[r][c] === EMPTY) {
        state.enchantGrid[r][c] = ENCHANT_TYPES.CURSED_SPORE;
      }
    });
    rebuildEnchantmentRings();
    showToast(`🍄 Spore Queen infected ${picked.length} slots with Cursed Spores!`, '🍄');
    if (typeof onComplete === 'function') onComplete();
  },

  mirror_virtuoso(onComplete) {
    const playerTops = [];
    const aiTops = [];
    const allPlayerCells = [];
    const allAiCells = [];

    for (let c = 0; c < COLS; c++) {
      const topR = aiEngine.getTopOccupiedRow(state.board, c);
      if (topR !== -1) {
        if (state.board[topR][c] === PLAYER) playerTops.push([topR, c]);
        else if (state.board[topR][c] === AI) aiTops.push([topR, c]);
      }
      for (let r = 0; r < ROWS; r++) {
        if (state.board[r][c] === PLAYER) allPlayerCells.push([r, c]);
        else if (state.board[r][c] === AI) allAiCells.push([r, c]);
      }
    }

    const pPool = playerTops.length > 0 ? playerTops : allPlayerCells;
    const aPool = aiTops.length > 0 ? aiTops : allAiCells;

    let pr = 0;
    let pc = 2;
    let ar = 0;
    let ac = 4;
    let hasValidPair = false;

    if (pPool.length > 0 && aPool.length > 0) {
      [pr, pc] = pPool[Math.floor(Math.random() * pPool.length)];
      [ar, ac] = aPool[Math.floor(Math.random() * aPool.length)];
      hasValidPair = true;
    }

    if (typeof playBossMirrorVirtuosoVFX === 'function') {
      playBossMirrorVirtuosoVFX(
        pr,
        pc,
        ar,
        ac,
        () => {
          if (hasValidPair) {
            state.board[pr][pc] = AI;
            state.board[ar][ac] = PLAYER;
            rebuildBoardMeshes();
            showToast(`🎭 Mirror Virtuoso swapped tokens in Col ${pc + 1} & Col ${ac + 1}!`, '🎭');
          } else {
            showToast(`🎭 Mirror Virtuoso cast a Prismatic Reflection across the board!`, '🎭');
          }
          updateHUD();
        },
        onComplete
      );
      return;
    }

    if (hasValidPair) {
      state.board[pr][pc] = AI;
      state.board[ar][ac] = PLAYER;
      rebuildBoardMeshes();
      showToast(`🎭 Mirror Virtuoso swapped tokens in Col ${pc + 1} & Col ${ac + 1}!`, '🎭');
    }
    if (typeof onComplete === 'function') onComplete();
  },

  tectonic_behemoth(onComplete) {
    const openCols = getPlayableColumns();
    const sc = openCols.length > 0 ? openCols[Math.floor(Math.random() * openCols.length)] : 3;
    const sr = openCols.length > 0 ? aiEngine.getAvailableRow(state.board, sc) : 2;

    if (typeof playBossTectonicBehemothVFX === 'function') {
      playBossTectonicBehemothVFX(
        sr,
        sc,
        () => {
          state.stability = Math.max(0, state.stability - 1);
          if (openCols.length > 0 && sr !== -1) {
            spawnTokenMesh(sr, sc, STONE);
          }
          showToast(`🦖 Tectonic Behemoth quaked -1 Stability & dropped Stone in Col ${sc + 1}!`, '🦖');
          updateHUD();
        },
        onComplete
      );
      return;
    }

    state.stability = Math.max(0, state.stability - 1);
    if (openCols.length > 0 && sr !== -1) {
      spawnTokenMesh(sr, sc, STONE);
    }
    showToast(`🦖 Tectonic Behemoth quaked -1 Stability & dropped Stone in Col ${sc + 1}!`, '🦖');
    if (typeof onComplete === 'function') onComplete();
  },

  abyssal_lodestone(onComplete) {
    const computePullMovesForCol = (colIdx) => {
      const adj = [colIdx - 1, colIdx + 1].filter((c) => c >= 0 && c < COLS);
      const moves = [];
      let simDestR = aiEngine.getAvailableRow(state.board, colIdx);
      adj.forEach((nc) => {
        const topR = aiEngine.getTopOccupiedRow(state.board, nc);
        if (topR !== -1 && simDestR !== -1 && simDestR < ROWS && (!state.boardMask || state.boardMask[simDestR][colIdx])) {
          const piece = state.board[topR][nc];
          moves.push({ fromR: topR, fromC: nc, toR: simDestR, toC: colIdx, piece });
          let nextAvail = -1;
          for (let r = simDestR + 1; r < ROWS; r++) {
            if (state.board[r][colIdx] === VOID_CELL) continue;
            if (state.board[r][colIdx] === EMPTY) {
              nextAvail = r;
              break;
            }
          }
          simDestR = nextAvail;
        }
      });
      return { moves, neighbors: adj };
    };

    let mc = state.bossMarkedCol;
    let { moves: pullMoves, neighbors } = computePullMovesForCol(mc);

    // If bossMarkedCol has no pullable neighbor tokens, lock onto a column that DOES have pullable neighbor tokens!
    if (pullMoves.length === 0) {
      for (const candidateC of [3, 2, 4, 1, 5, 0, 6]) {
        const test = computePullMovesForCol(candidateC);
        if (test.moves.length > 0) {
          mc = candidateC;
          state.bossMarkedCol = mc;
          pullMoves = test.moves;
          neighbors = test.neighbors;
          break;
        }
      }
    }

    let condensedStoneCell = null;
    if (pullMoves.length === 0) {
      const openCols = getPlayableColumns();
      if (openCols.length > 0) {
        const sc = openCols.includes(mc) ? mc : openCols[Math.floor(Math.random() * openCols.length)];
        const sr = aiEngine.getAvailableRow(state.board, sc);
        if (sr !== -1) condensedStoneCell = [sr, sc];
      }
    }

    const applyLodestoneOutcome = () => {
      if (pullMoves.length > 0) {
        pullMoves.forEach((mv) => {
          state.board[mv.fromR][mv.fromC] = EMPTY;
          applyColumnGravity(mv.fromC);
          const actualDestR = aiEngine.getAvailableRow(state.board, mc);
          if (actualDestR !== -1) {
            state.board[actualDestR][mc] = mv.piece;
          }
        });
        rebuildBoardMeshes([mc, ...neighbors]);
        showToast(`🧲 Abyssal Lodestone pulled ${pullMoves.length} neighbor token(s) into Singularity Col ${mc + 1}!`, '🧲');
      } else if (condensedStoneCell) {
        const [sr, sc] = condensedStoneCell;
        spawnTokenMesh(sr, sc, STONE);
        showToast(`🧲 Abyssal Lodestone condensed a Magnetic Stone in Col ${sc + 1}!`, '🧲');
      }

      const validMarkCols = [1, 2, 3, 4, 5].filter((c) => aiEngine.getAvailableRow(state.board, c) !== -1);
      state.bossMarkedCol = validMarkCols.length > 0
        ? validMarkCols[Math.floor(Math.random() * validMarkCols.length)]
        : Math.floor(Math.random() * COLS);
      updateHUD();
      updateTelemetryBadges();
    };

    if (typeof playBossAbyssalLodestoneVFX === 'function') {
      playBossAbyssalLodestoneVFX(mc, pullMoves, condensedStoneCell, applyLodestoneOutcome, onComplete);
      return;
    }

    applyLodestoneOutcome();
    if (typeof onComplete === 'function') onComplete();
  },

  void_weaver(onComplete) {
    // 1. Pick up to 2 empty slots for Cursed Spore + Web snares
    const emptyCoords = [];
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === EMPTY && state.enchantGrid[r][c] === ENCHANT_TYPES.NONE) {
          emptyCoords.push([r, c]);
        }
      }
    }
    const picked = emptyCoords.length > 0 ? shuffle(emptyCoords).slice(0, 2) : [[2, 2], [2, 4]];

    // 2. Select a surface token to drag sideways into an adjacent column (prefer exposed PLAYER, fallback to any exposed token)
    const playerCols = [];
    const anyTopCols = [];
    for (let c = 0; c < COLS; c++) {
      const topR = aiEngine.getTopOccupiedRow(state.board, c);
      if (topR !== -1) {
        if (state.board[topR][c] === PLAYER) playerCols.push([topR, c, PLAYER]);
        else if (state.board[topR][c] !== VOID_CELL) anyTopCols.push([topR, c, state.board[topR][c]]);
      }
    }
    const dragPool = playerCols.length > 0 ? playerCols : anyTopCols;
    let dragMove = null;
    for (const [pr, pc, pieceType] of shuffle(dragPool)) {
      const adjOpen = [pc - 1, pc + 1].filter((ac) => ac >= 0 && ac < COLS && aiEngine.getAvailableRow(state.board, ac) !== -1);
      if (adjOpen.length > 0) {
        const destC = adjOpen[Math.floor(Math.random() * adjOpen.length)];
        const destR = aiEngine.getAvailableRow(state.board, destC);
        dragMove = { fromR: pr, fromC: pc, toR: destR, toC: destC, pieceType };
        break;
      }
    }

    const applyVoidWeaverOutcome = () => {
      picked.forEach(([r, c], idx) => {
        if (state.enchantGrid && state.enchantGrid[r] && state.board[r][c] === EMPTY) {
          state.enchantGrid[r][c] = idx === 0 ? ENCHANT_TYPES.CURSED_SPORE : ENCHANT_TYPES.WEB;
        }
      });
      let draggedMsg = '';
      if (dragMove) {
        const { fromR, fromC, toR, toC, pieceType } = dragMove;
        state.board[fromR][fromC] = EMPTY;
        if (state.enchantGrid && state.enchantGrid[fromR]) {
          state.enchantGrid[fromR][fromC] = ENCHANT_TYPES.WEB;
        }
        applyColumnGravity(fromC);
        const actualDestR = aiEngine.getAvailableRow(state.board, toC);
        if (actualDestR !== -1) {
          state.board[actualDestR][toC] = pieceType || PLAYER;
        }
        rebuildBoardMeshes([fromC, toC]);
        draggedMsg = ` & dragged Col ${fromC + 1} token into Col ${toC + 1}`;
      }
      rebuildEnchantmentRings();
      showToast(`🕸️ Void Weaver spun ${picked.length} Silk Snares${draggedMsg}!`, '🕸️');
      updateHUD();
    };

    if (typeof playBossVoidWeaverVFX === 'function') {
      playBossVoidWeaverVFX(picked, dragMove, applyVoidWeaverOutcome, onComplete);
      return;
    }

    applyVoidWeaverOutcome();
    if (typeof onComplete === 'function') onComplete();
  },

  sovereign_tesseract(onComplete) {
    if (state.isCylinderPhase) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    const intactIndices = getIntactTesseractBoardIndices();
    if (intactIndices.length <= 1) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    // Do not rotate away if either side already connected 4 on this board
    if (aiEngine.findWinningLine(state.board, PLAYER) || aiEngine.findWinningLine(state.board, AI)) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    const nextIdx = getNextIntactTesseractBoardIndex(state.activeTesseractBoardIdx);
    const nextLabel = (state.tesseractBoards[nextIdx] && state.tesseractBoards[nextIdx].label) || `Board ${nextIdx + 1}`;
    triggerFinalBossBoardRotation(
      nextIdx,
      `🌌 Sovereign Tesseract rotated to ${nextLabel} (${intactIndices.length}/4 Intact)!`,
      () => {
        if (typeof onComplete === 'function') {
          onComplete();
        } else if (!state.gameOver && state.turn === PLAYER) {
          state.busy = false;
          updateHUD();
          updateTelemetryBadges();
        }
      }
    );
  }
};

function getIntactTesseractBoardIndices() {
  if (!Array.isArray(state.tesseractBoards)) return [];
  const out = [];
  for (let i = 0; i < state.tesseractBoards.length; i++) {
    if (state.tesseractBoards[i] && !state.tesseractBoards[i].isShattered) {
      out.push(i);
    }
  }
  return out;
}

function getNextIntactTesseractBoardIndex(fromIdx = state.activeTesseractBoardIdx) {
  const intact = getIntactTesseractBoardIndices();
  if (intact.length === 0) return -1;
  if (intact.length === 1) return intact[0];
  for (let step = 1; step <= 4; step++) {
    const cand = ((fromIdx || 0) + step) % 4;
    if (intact.includes(cand)) return cand;
  }
  return intact[0];
}

function countEmptyPlayableCells(boardGrid) {
  let emptyCount = 0;
  const cols = (boardGrid && boardGrid[0]) ? boardGrid[0].length : COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      if (boardGrid[r][c] === EMPTY) emptyCount++;
    }
  }
  return emptyCount;
}

function saveCurrentTesseractBoardState() {
  if (state.isCylinderPhase) return;
  if (!Array.isArray(state.tesseractBoards) || state.tesseractBoards.length < 4) return;
  const idx = state.activeTesseractBoardIdx || 0;
  const entry = state.tesseractBoards[idx];
  if (!entry || entry.isShattered) return;
  if (Array.isArray(state.boardMask) && state.boardMask.length === ROWS) {
    entry.boardMask = state.boardMask.map((row) => row.slice());
  }
  if (state.currentTopology) {
    entry.topology = {
      ...state.currentTopology,
      mask: entry.boardMask ? entry.boardMask.map((row) => row.slice()) : state.currentTopology.mask
    };
  }
  entry.board = state.board.map((row) => row.slice());
  entry.enchantGrid = state.enchantGrid.map((row) => row.slice());
}

function triggerFinalBossBoardRotation(targetIdx, toastMessage, onComplete = null, saveOutgoing = true) {
  if (!Array.isArray(state.tesseractBoards) || state.tesseractBoards.length < 4) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  state.busy = true;
  state.isCarouselRotating = true;
  if (saveOutgoing) {
    saveCurrentTesseractBoardState();
  }
  const nextIdx = ((targetIdx % 4) + 4) % 4;
  const startMs = performance.now();
  const durationMs = 1150;
  let swappedAtMidpoint = false;

  sfx.playBoardFlipWhoosh();
  triggerBoardShake(0.32);
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(0.85);
  }
  if (typeof playBossSovereignTesseractVFX === 'function') {
    playBossSovereignTesseractVFX();
  }
  spawn3DShockwaveRing(2, 3, 0xc084fc, 3.8, 680);

  function stepCarouselRotation() {
    const elapsed = performance.now() - startMs;
    const p = Math.min(1, elapsed / durationMs);

    if (p < 0.5) {
      const t = p / 0.5;
      const easeIn = t * t;
      boardGroup.rotation.y = easeIn * (Math.PI * 0.52);
      boardGroup.position.x = -easeIn * 2.8;
      boardGroup.position.z = -easeIn * 2.4;
    } else {
      if (!swappedAtMidpoint) {
        swappedAtMidpoint = true;
        if (saveOutgoing) {
          saveCurrentTesseractBoardState();
        }
        state.activeTesseractBoardIdx = nextIdx;
        const nextEntry = state.tesseractBoards[nextIdx];

        if (baseMesh) {
          baseMesh.visible = true;
          baseMesh.position.set(0, START_Y - 1.0, 0);
          baseMesh.rotation.set(0, 0, 0);
        }

        if (nextEntry && Array.isArray(nextEntry.boardMask) && nextEntry.boardMask.length === ROWS) {
          state.boardMask = nextEntry.boardMask.map((row) => row.slice());
          if (nextEntry.topology) {
            state.currentTopology = {
              ...nextEntry.topology,
              mask: state.boardMask
            };
          } else if (state.currentTopology) {
            state.currentTopology.mask = state.boardMask;
          }
          rebuild3DBoardGeometry(state.boardMask);
        }

        // Ensure incoming board has ample room (if < 6 empty cells remain, flush it clean!)
        if (nextEntry && countEmptyPlayableCells(nextEntry.board) < 6) {
          nextEntry.board = Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => (state.boardMask[r][c] ? EMPTY : VOID_CELL))
          );
        }

        if (nextEntry) {
          state.board = nextEntry.board.map((row) => row.slice());
          state.enchantGrid = nextEntry.enchantGrid.map((row) => row.slice());
        }
        rebuildEnchantmentRings();
        rebuildBoardMeshes();
        if (typeof updateCavernAesthetics === 'function') {
          updateCavernAesthetics();
        }
        updateHUD();
        updateTelemetryBadges();
        if (toastMessage) {
          showToast(toastMessage, '🌌', 3800);
        }
      }
      const t = (p - 0.5) / 0.5;
      const easeOut = 1 - Math.pow(1 - t, 3);
      boardGroup.rotation.y = -(1 - easeOut) * (Math.PI * 0.52);
      boardGroup.position.x = (1 - easeOut) * 2.8;
      boardGroup.position.z = -(1 - easeOut) * 2.4;
    }

    if (p < 1) {
      requestAnimationFrame(stepCarouselRotation);
    } else {
      boardGroup.rotation.set(0, 0, 0);
      boardGroup.position.set(0, 0, 0);
      state.isCarouselRotating = false;
      updateHUD();
      updateTelemetryBadges();
      if (typeof onComplete === 'function') {
        onComplete();
      } else if (!state.gameOver && state.turn === PLAYER) {
        state.busy = false;
      }
    }
  }

  requestAnimationFrame(stepCarouselRotation);
}

// ============================================================================
// SOVEREIGN TESSERACT REDESIGNED CINEMATIC PHASE SEQUENCES
//   1. Planar Board Shatter & Falling Tokens (Phases 1 & 2)
//   2. Phase 2 One-Time Opener: 50% Token Glow-Shatter + Safe 4D Upheaval Flip
//   3. Phase 3 Transition: Cavern Crumble to Ethereal Plane + 12-Col Cylinder Descent
//   4. Phase 3 Final Victory: Multi-Stage 4D Hypercube & Cylinder Destruction
// ============================================================================
function triggerTesseractPlanarBoardShatter(winLine, shatteredBoardIdx, onComplete) {
  state.busy = true;
  if (Array.isArray(state.tesseractBoards) && state.tesseractBoards[shatteredBoardIdx]) {
    state.tesseractBoards[shatteredBoardIdx].isShattered = true;
  }

  sfx.playBossPhaseShatter();
  if (typeof sfx.playPlanarBoardShatter === 'function') {
    sfx.playPlanarBoardShatter();
  }
  triggerHaptic([65, 35, 95, 35, 85]);
  triggerBoardShake(0.55);
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(1.15);
  }
  if (typeof updateCavernAesthetics === 'function') {
    updateCavernAesthetics();
  }

  if (Array.isArray(winLine)) {
    winLine.forEach(([r, c]) => {
      spawn3DShockwaveRing(r, c, 0xf43f5e, 2.8, 560);
      spawn3DParticleBurst(r, c, 0xfde047, 18, 0.16, 620, 'octa');
    });
  }

  if (typeof playPlanarBoardShatterVFX === 'function') {
    playPlanarBoardShatterVFX(1350);
  }

  // Drop all tokens in tokensGroup to the ground
  tokensGroup.children.forEach((mesh) => {
    const d = mesh.userData;
    if (!d) return;
    d.vfxControlled = false;
    d.targetY = START_Y - 15.0 - Math.random() * 4.0;
    d.velY = -0.07 - Math.random() * 0.15;
    d.rotSpeedX = (Math.random() - 0.5) * 0.28;
  });

  // Animate the board frame struts fracturing and falling apart
  dynamicFrameGroup.children.forEach((strut, idx) => {
    strut.userData = {
      origX: strut.position.x,
      origY: strut.position.y,
      origZ: strut.position.z,
      vx: (strut.position.x * 0.03) + (Math.random() - 0.5) * 0.11,
      vy: 0.04 + (idx % 4) * 0.025,
      vz: (Math.random() - 0.5) * 0.12,
      rx: (Math.random() - 0.5) * 0.24,
      ry: (Math.random() - 0.5) * 0.24,
      rz: (Math.random() - 0.5) * 0.24
    };
  });

  enchantGroup.children.forEach((ring) => {
    ring.visible = false;
  });

  const startMs = performance.now();
  const durationMs = 1320;

  function stepBoardShatter(now) {
    const p = Math.min(1, (now - startMs) / durationMs);
    dynamicFrameGroup.children.forEach((strut) => {
      const u = strut.userData;
      if (!u) return;
      strut.position.x += u.vx;
      strut.position.y += u.vy;
      strut.position.z += u.vz;
      u.vy -= 0.011;
      strut.rotation.x += u.rx;
      strut.rotation.y += u.ry;
      strut.rotation.z += u.rz;
    });

    if (baseMesh) {
      baseMesh.position.y = (START_Y - 1.0) - (p * p) * 12.0;
      baseMesh.rotation.z = p * 0.35;
      baseMesh.rotation.x = p * 0.28;
    }

    if (p < 1) {
      requestAnimationFrame(stepBoardShatter);
    } else {
      clearThreeGroup(dynamicFrameGroup);
      clearThreeGroup(tokensGroup);
      clearThreeGroup(enchantGroup);
      if (baseMesh) {
        baseMesh.position.set(0, START_Y - 1.0, 0);
        baseMesh.rotation.set(0, 0, 0);
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  }

  requestAnimationFrame(stepBoardShatter);
}

function ensurePhase2BoardHasTokensForCombo() {
  let tokenCount = countTokensInPlay(state.board);
  if (tokenCount >= 4) return;

  // Seed a balanced set of dimensional echo tokens if the 4th board had fewer than 4 pieces
  const validCols = getPlayableColumns();
  const seedTypes = [PLAYER, AI, PLAYER, AI, STONE, PLAYER, AI, STONE];
  let idx = 0;
  while (countTokensInPlay(state.board) < 6 && idx < seedTypes.length && validCols.length > 0) {
    const c = validCols[idx % validCols.length];
    const r = aiEngine.getAvailableRow(state.board, c);
    const tType = seedTypes[idx];
    idx++;
    if (r === -1) continue;
    state.board[r][c] = tType;
    if (aiEngine.findWinningLine(state.board, PLAYER) || aiEngine.findWinningLine(state.board, AI)) {
      state.board[r][c] = STONE;
    }
  }
  saveCurrentTesseractBoardState();
  rebuildBoardMeshes();
}

function triggerTesseractPhase2OpenerCombo(onComplete = null) {
  state.busy = true;
  state.tesseractPhase2ComboUsed = true;

  ensurePhase2BoardHasTokensForCombo();

  // Gather all occupied token cells on the final planar board
  const occupiedCells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        occupiedCells.push([r, c]);
      }
    }
  }

  const pickCount = Math.max(1, Math.round(occupiedCells.length * 0.5));
  const chosenToShatter = shuffle(occupiedCells).slice(0, pickCount);

  // Action 1: Summon 3D Sovereign Tesseract Model + 50% Token Growing Glow -> Shatter -> Gravity Drop
  sfx.playBossAlarm();
  if (typeof sfx.playTokenGlowCharge === 'function') {
    sfx.playTokenGlowCharge();
  }
  if (typeof playBossSovereignTesseractVFX === 'function') {
    playBossSovereignTesseractVFX();
  }
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(1.0);
  }

  setStatusBanner(false, `🌌 FINAL PLANAR BOARD (2/5 ❤️): Charging 50% of tokens to shatter...`);
  showToast(
    `🌌 Last Planar Board! Sovereign Tesseract is overloading ${chosenToShatter.length} token(s) to shatter!`,
    '💥',
    4500,
    'border-amber-400/80 text-amber-100'
  );

  const executeTokenShatterAndThenFlip = () => {
    // Shatter the 50% glowing tokens simultaneously
    const affectedColsSet = new Set();
    chosenToShatter.forEach(([r, c]) => {
      state.board[r][c] = EMPTY;
      affectedColsSet.add(c);
      spawn3DShockwaveRing(r, c, 0xf43f5e, 2.1, 460);
      spawn3DParticleBurst(r, c, 0xfde047, 14, 0.14, 520, 'octa');
    });

    onTokenShattered(chosenToShatter.length);
    triggerBoardShake(0.38);
    triggerHaptic([50, 30, 80]);

    // Apply gravity so remaining 50% tokens fall to fill the gaps
    const affectedCols = Array.from(affectedColsSet);
    applyBoardGravity();
    rebuildBoardMeshes(affectedCols);
    sfx.playWoodClack(true);

    // Neutralize any accidental Connect-4 formed purely by the 50% shatter before flipping
    let preFlipAiLine = aiEngine.findWinningLine(state.board, AI);
    while (preFlipAiLine) {
      const [ar, ac] = preFlipAiLine[preFlipAiLine.length - 1];
      state.board[ar][ac] = STONE;
      preFlipAiLine = aiEngine.findWinningLine(state.board, AI);
    }

    // Action 2 (after remaining tokens fall & settle): Summon 3D Tesseract Model + Custom 4D Board Upheaval Flip
    setTimeout(() => {
      if (typeof playBossSovereignTesseractVFX === 'function') {
        playBossSovereignTesseractVFX();
      }
      if (typeof playTesseractUpheavalCageVFX === 'function') {
        playTesseractUpheavalCageVFX(960);
      }
      if (typeof sfx.playTesseractUpheavalFlip === 'function') {
        sfx.playTesseractUpheavalFlip();
      } else {
        sfx.playBoardFlipWhoosh();
      }
      triggerHaptic([45, 30, 75, 30, 55]);
      setStatusBanner(false, `🌌 Tesseract Upheaval! Inverting the final planar board across 4D space...`);

      const BOARD_CENTER_Y = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;
      const flipDuration = 940;
      const flipStart = performance.now();

      function stepTesseractUpheavalFlip(now) {
        const rawP = Math.min(1, (now - flipStart) / flipDuration);
        const ease = rawP < 0.5
          ? 4 * rawP * rawP * rawP
          : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

        // Custom Tesseract-themed 4D diagonal gimbal inversion (distinct from player's Abyssal Upheaval)
        const angleX = ease * Math.PI;
        const gimY = Math.sin(rawP * Math.PI) * (Math.PI * 0.38);
        const gimZ = Math.sin(rawP * Math.PI * 2) * 0.32;

        boardGroup.rotation.set(angleX, gimY, gimZ);
        boardGroup.position.y = BOARD_CENTER_Y * (1 - Math.cos(angleX)) + Math.sin(rawP * Math.PI) * 0.65;
        boardGroup.position.z = -BOARD_CENTER_Y * Math.sin(angleX) - Math.sin(rawP * Math.PI) * 3.1;

        if (rawP < 1) {
          requestAnimationFrame(stepTesseractUpheavalFlip);
          return;
        }

        boardGroup.rotation.set(0, 0, 0);
        boardGroup.position.set(0, 0, 0);

        // Safe Effect of Abyssal Upheaval: invert boardMask, enchantGrid, and column stacks 180 degrees
        const invertedMask = Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const srcR = ROWS - 1 - r;
            return state.boardMask && state.boardMask[srcR]
              ? !!state.boardMask[srcR][c]
              : (state.board[srcR][c] !== VOID_CELL);
          })
        );
        state.boardMask = invertedMask;
        if (state.currentTopology) {
          state.currentTopology.mask = invertedMask;
        }

        state.enchantGrid = Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const srcR = ROWS - 1 - r;
            if (!invertedMask[r][c]) return ENCHANT_TYPES.NONE;
            return (state.enchantGrid[srcR] && state.enchantGrid[srcR][c]) || ENCHANT_TYPES.NONE;
          })
        );

        const nextBoard = Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => (invertedMask[r][c] ? EMPTY : VOID_CELL))
        );
        const dropStartRowsByCol = Array.from({ length: COLS }, () => []);

        for (let c = 0; c < COLS; c++) {
          const playableDestRows = [];
          for (let r = 0; r < ROWS; r++) {
            if (invertedMask[r][c]) playableDestRows.push(r);
          }

          const fallingTokens = [];
          for (let oldR = ROWS - 1; oldR >= 0; oldR--) {
            const cell = state.board[oldR][c];
            if (cell !== EMPTY && cell !== VOID_CELL) {
              fallingTokens.push({ type: cell, startRow: ROWS - 1 - oldR });
            }
          }

          for (let i = 0; i < playableDestRows.length; i++) {
            const destR = playableDestRows[i];
            if (i < fallingTokens.length) {
              nextBoard[destR][c] = fallingTokens[i].type;
              dropStartRowsByCol[c][destR] = fallingTokens[i].startRow;
            } else {
              nextBoard[destR][c] = EMPTY;
            }
          }
        }

        state.board = nextBoard;

        // Safety guard: neutralize any accidental Connect-4 created directly by the boss flip
        let accidentalAiWin = aiEngine.findWinningLine(state.board, AI);
        while (accidentalAiWin) {
          const [ar, ac] = accidentalAiWin[accidentalAiWin.length - 1];
          state.board[ar][ac] = STONE;
          accidentalAiWin = aiEngine.findWinningLine(state.board, AI);
        }
        let accidentalPlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
        while (accidentalPlayerWin) {
          const [pr, pc] = accidentalPlayerWin[accidentalPlayerWin.length - 1];
          state.board[pr][pc] = STONE;
          accidentalPlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
        }

        saveCurrentTesseractBoardState();
        rebuild3DBoardGeometry(state.boardMask);
        rebuildEnchantmentRings();
        rebuildBoardMeshes();

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const mesh = state.meshes[r] && state.meshes[r][c];
            if (mesh) {
              const startR = (dropStartRowsByCol[c] && dropStartRowsByCol[c][r] !== undefined)
                ? dropStartRowsByCol[c][r]
                : r;
              const startY = START_Y + Math.max(r, startR) * CELL_SPACING + 0.55;
              mesh.position.y = Math.max(mesh.userData.targetY + 0.45, startY);
              mesh.userData.velY = -0.02;
            }
          }
        }

        sfx.playWoodClack(true);
        spawn3DShockwaveRing(2, 3, 0xfde047, 3.6, 560);
        showToast(
          '🌌 Phase 2 Dimensional Upheaval! 50% of tokens shattered & the final planar board flipped 180°!',
          '🔄',
          5200,
          'border-purple-400/80 text-purple-100'
        );

        setTimeout(() => {
          state.turn = PLAYER;
          state.busy = false;
          updateHUD();
          updateTelemetryBadges();
          setStatusBanner(true, `🌌 Final Planar Board (2/5 ❤️) • Shatter this board to breach the Tesseract Core!`);
          if (typeof onComplete === 'function') onComplete();
        }, 460);
      }

      requestAnimationFrame(stepTesseractUpheavalFlip);
    }, 780);
  };

  if (typeof playPhase2TokenGlowAndShatterVFX === 'function' && chosenToShatter.length > 0) {
    playPhase2TokenGlowAndShatterVFX(chosenToShatter, 1080, executeTokenShatterAndThenFlip);
  } else {
    setTimeout(executeTokenShatterAndThenFlip, 950);
  }
}


function triggerPhase3VoidFlamePurge(onComplete = null) {
  state.busy = true;

  // Save a pre-burn snapshot so if the player loses in Phase 3 and clicks "Retry Floor",
  // their deck, reserves, and relics are restored for the fresh Floor 15 attempt!
  state._preVoidFlameSnapshot = {
    gambits: Array.isArray(state.gambits) ? [...state.gambits] : [],
    maxGambitSlots: state.maxGambitSlots || 1,
    reservePouch: Array.isArray(state.reservePouch) ? [...state.reservePouch] : [],
    reservePouchUnlocked: !!state.reservePouchUnlocked,
    masterDeck: Array.isArray(state.masterDeck) ? [...state.masterDeck] : [],
    maxMana: state.maxMana || 1,
    handSize: state.handSize || 2
  };

  // If the player's hand is currently empty but they still own cards in drawPile/masterDeck,
  // fan those cards into hand right before the Void Flame strikes so they visibly burn in the UI!
  if (state.hand.length === 0 && (state.drawPile.length > 0 || state.masterDeck.length > 0)) {
    const sourceCards = state.drawPile.length > 0 ? state.drawPile : state.masterDeck;
    state.hand = sourceCards.slice(0, Math.max(2, state.handSize || 3));
  }
  clearActionSelection();
  updateHUD();

  if (typeof sfx.playVoidFlameIncineration === 'function') {
    sfx.playVoidFlameIncineration();
  } else {
    sfx.playBossAlarm();
  }
  if (typeof playBossSovereignTesseractVFX === 'function') {
    playBossSovereignTesseractVFX();
  }
  triggerBoardShake(0.45);
  triggerHaptic([60, 30, 90, 30, 75]);

  // Spawn violet/crimson void fire shockwaves across the 3D cylinder
  for (let c = 0; c < COLS; c += 2) {
    spawn3DShockwaveRing(2, c, 0xa855f7, 2.6, 720);
    spawn3DParticleBurst(2, c, 0xf43f5e, 12, 0.14, 760, 'octa');
  }

  setStatusBanner(false, `🔥 VOID FLAME PURGE! The Sovereign Tesseract is incinerating all Arcane Cards, Reserve Tokens & Relics!`);
  showToast(
    '🔥 VOID FLAME PURGE! All Arcane Cards, Special Reserve Tokens & Relics are burning away!',
    '🔥',
    4500,
    'border-purple-400/90 text-purple-100'
  );

  // Collect all UI elements in the Gambit Strip, Reserve Pouch, and Hand Container to ignite with Void Flames
  const gambitStrip = document.getElementById('gambit-strip');
  const pouchEl = document.getElementById('reserve-pouch-container');
  const handEl = document.getElementById('hand-container');

  const uiTargets = [];
  if (gambitStrip && gambitStrip.children) {
    Array.from(gambitStrip.children).forEach((el) => uiTargets.push({ el, delay: 0 }));
  }
  if (pouchEl && pouchEl.children) {
    Array.from(pouchEl.children).forEach((el) => uiTargets.push({ el, delay: 140 }));
  }
  if (handEl && handEl.children) {
    Array.from(handEl.children).forEach((el, idx) => uiTargets.push({ el, delay: 260 + idx * 75 }));
  }

  uiTargets.forEach(({ el, delay }) => {
    setTimeout(() => {
      if (!el) return;
      el.classList.add('void-flame-incinerating');
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const flameOverlay = document.createElement('div');
        flameOverlay.className = 'void-flame-overlay';
        el.appendChild(flameOverlay);
      }
    }, delay);
  });

  setTimeout(() => {
    state.voidFlamePurged = true;
    state.gambits = [];
    state.maxGambitSlots = 0;
    state.reservePouch = [];
    state.hand = [];
    state.drawPile = [];
    state.discardPile = [];
    state.masterDeck = [];
    state.mana = 0;
    state.maxMana = 0;
    clearActionSelection();
    updateHUD();
    updateTelemetryBadges();

    if (typeof onComplete === 'function') {
      onComplete();
    }
  }, 1750);
}

function triggerPhase3EtherealCylinderTransition() {
  state.busy = true;
  setStatusBanner(false, `🌌 All 4 Planar Boards Shattered (1/5 ❤️)! The subterranean cavern is collapsing into the Ethereal Plane...`);
  showToast(
    '🌌 ALL 4 BOARDS SHATTERED (1/5 ❤️)! The cavern is crumbling into the Ethereal Plane!',
    '🌌',
    5200,
    'border-cyan-400/80 text-cyan-100'
  );

  const startCylinderDescent = () => {
    if (typeof setActiveBoardCols === 'function') {
      setActiveBoardCols(12);
    }
    state.isCylinderPhase = true;
    state.isCylinderLowering = true;
    state.isCylinderRotationPaused = false;
    state.cylinderDropOffsetY = 15.5;
    state.cylinderAngle = 0;

    const cleanFullMask = createGrid(ROWS, 12, true);
    state.boardMask = cleanFullMask;
    state.currentTopology = {
      id: 'ethereal_cylinder',
      name: '12-Col Ethereal Cylinder (Edgeless)',
      icon: (typeof renderC4IconHTML === 'function') ? renderC4IconHTML('bosses', 'sovereign_tesseract', 'c4-item-icon-sm', '12-Col Ethereal Cylinder') : '🪐',
      desc: '12-column rotating cylindrical Connect-4 arena with seamless left/right wrap-around.',
      loreDesc: 'An edgeless 12-column astral cylinder rotating in the heart of the tesseract.',
      isProcedural: true,
      isAsymmetrical: false,
      mask: cleanFullMask
    };

    state.board = createGrid(ROWS, 12, EMPTY);
    state.meshes = createGrid(ROWS, 12, null);

    generateSlotEnchantments();
    rebuild3DBoardGeometry(state.boardMask);
    rebuildEnchantmentRings();
    updateHUD();
    updateTelemetryBadges();

    if (typeof sfx.playCylinderDescentLock === 'function') {
      sfx.playCylinderDescentLock();
    }
    if (typeof playBossSovereignTesseractVFX === 'function') {
      playBossSovereignTesseractVFX();
    }
    setStatusBanner(false, `🪐 A 12-Column Cylindrical Board is lowering over you across the Ethereal Plane...`);

    const descentStart = performance.now();
    const descentDuration = 2200;

    function stepCylinderDescent(now) {
      const p = Math.min(1, (now - descentStart) / descentDuration);
      const easeOut = 1 - Math.pow(1 - p, 3);

      state.cylinderDropOffsetY = 15.5 * (1 - easeOut);
      state.cylinderAngle = (1 - easeOut) * Math.PI * 0.85;

      if (p < 1) {
        requestAnimationFrame(stepCylinderDescent);
      } else {
        state.cylinderDropOffsetY = 0;
        state.isCylinderLowering = false;
        boardGroup.position.set(0, 0, 0);
        boardGroup.rotation.set(0, 0, 0);
        triggerBoardShake(0.36);
        triggerHaptic([50, 30, 75]);

        // Trigger the Void Flame UI Incineration after the cylindrical board has lowered in,
        // burning all Arcane Cards, Reserve Tokens, and Relics before starting the Phase 3 duel!
        triggerPhase3VoidFlamePurge(() => {
          if (typeof bgm !== 'undefined' && bgm && typeof bgm.setMode === 'function') {
            bgm.hasStartedAfterDifficulty = true;
            bgm.isPausedForLevelIntro = false;
            bgm.isPausedForModal = false;
            bgm.setMode('boss5_final');
          }

          state.turn = PLAYER;
          state.busy = false;
          updateHUD();
          updateTelemetryBadges();
          showToast(
            '🪐 FINAL PHASE (1/5 ❤️): 12-Column Rotating Cylinder! All items burned by Void Flame — Pure Connect-4 Duel!',
            '🪐',
            6200,
            'border-amber-300/90 text-amber-100'
          );
          setStatusBanner(true, `🪐 Ethereal Cylinder Active (1/5 ❤️) • Pure Connect-4 Trial — Wait for columns to rotate & Connect 4!`);
        });
      }
    }

    requestAnimationFrame(stepCylinderDescent);
  };

  if (typeof triggerCavernCrumbleToEtherealPlane === 'function') {
    triggerCavernCrumbleToEtherealPlane(startCylinderDescent);
  } else {
    setTimeout(startCylinderDescent, 1500);
  }
}

function triggerSovereignTesseractFinalDeathSequence(winLine, floorData) {
  state.busy = true;
  state.gameOver = true;
  state.bossHp = 0;
  state.isCylinderRotationPaused = true;

  // Stop the Phase 3 boss track immediately before the final destruction cinematic begins
  if (typeof bgm !== 'undefined' && bgm && typeof bgm.stop === 'function') {
    bgm.stop();
  }

  const clearedBossNum = Math.floor(state.floorIdx / 3) + 1;
  state.unlockedShopTier = Math.min(5, Math.max(state.unlockedShopTier || 1, clearedBossNum + 1));
  state.highTierCardsUnlocked = true;

  let philosopherBonus = 0;
  if (hasGambit('alkahest_vial')) {
    let stoneCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === STONE) stoneCount++;
      }
    }
    philosopherBonus = Math.max(3, stoneCount * 2);
    pulseGambitBadgeInHUD('alkahest_vial');
  }

  const baseReward = 7;
  const speedBonus = Math.max(0, state.stability);
  const totalEarned = baseReward + speedBonus + philosopherBonus;
  state.gold += totalEarned;
  state.pendingVictoryPayout = { totalEarned, speedBonus };
  updateHUD();

  // Stage 1 (0.0s - 1.6s): Resonance Overload & Colossal 4D Hypercube Manifestation
  sfx.playBossPhaseShatter();
  triggerHaptic([80, 40, 100, 40, 120]);
  triggerBoardShake(0.55);
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(1.6);
  }
  if (typeof playSovereignFinalDestructionVFX === 'function') {
    playSovereignFinalDestructionVFX(6200);
  }

  if (Array.isArray(winLine)) {
    winLine.forEach(([r, c]) => {
      spawn3DShockwaveRing(r, c, 0xfde047, 3.2, 750);
      spawn3DParticleBurst(r, c, 0xffffff, 22, 0.16, 780, 'octa');
    });
  }

  setStatusBanner(true, `💥 FINAL CONNECT-4 SCORED (0/5 ❤️)! Sovereign Tesseract Core Destabilizing...`);
  showToast(
    '💥 SOVEREIGN TESSERACT BREACHED! Dimensional Cylinder Overload Initiated!',
    '🌌',
    5800,
    'border-amber-300/90 text-amber-100'
  );

  // Stage 2 (1.6s - 3.5s): Sequential 12-Column Chain Detonation & Zero-Gravity Token Freefall
  const totalCols = COLS;
  for (let c = 0; c < totalCols; c++) {
    setTimeout(() => {
      sfx.playShatterCrunch();
      triggerBoardShake(0.32);
      const midR = Math.floor(ROWS / 2);
      const waveColors = [0xfde047, 0xf43f5e, 0x38bdf8, 0xc084fc];
      const colColor = waveColors[c % waveColors.length];
      spawn3DColumnBeam(c, colColor, 0.52, 680, true);
      spawn3DShockwaveRing(midR, c, colColor, 3.0, 620);
      spawn3DParticleBurst(midR, c, 0xfde047, 16, 0.17, 680, 'octa');

      // Launch tokens in column c into cosmic freefall
      for (let r = 0; r < ROWS; r++) {
        const tMesh = state.meshes[r] && state.meshes[r][c];
        if (tMesh && tMesh.userData) {
          const theta = typeof getCylinderColumnAngle === 'function' ? getCylinderColumnAngle(c) : 0;
          tMesh.userData.vfxControlled = false;
          tMesh.userData.freefall = true;
          tMesh.userData.velX = Math.sin(theta) * (0.06 + Math.random() * 0.08);
          tMesh.userData.velZ = -Math.cos(theta) * (0.06 + Math.random() * 0.08);
          tMesh.userData.velY = 0.08 + Math.random() * 0.12;
          tMesh.userData.rotSpeedX = (Math.random() - 0.5) * 0.32;
          tMesh.userData.rotSpeedZ = (Math.random() - 0.5) * 0.32;
        }
      }

      // Hide/fracture this column's frame group
      if (typeof cylinderColFrameGroups !== 'undefined' && cylinderColFrameGroups[c]) {
        cylinderColFrameGroups[c].visible = false;
      }
    }, 1550 + c * 145);
  }

  // Stage 3A (3.4s): Singularity Implosion
  setTimeout(() => {
    clearThreeGroup(dynamicFrameGroup);
    clearThreeGroup(enchantGroup);
    if (typeof sfx.playPlanarBoardShatter === 'function') {
      sfx.playPlanarBoardShatter();
    }
    triggerBoardShake(0.72);
    setStatusBanner(true, `✨ Fourfold Hypercube Imploding into Astral Supernova...`);
  }, 3400);

  // Stage 3B (4.0s): Fourfold Supernova Eruption & Victory Fanfare
  setTimeout(() => {
    clearThreeGroup(tokensGroup);
    if (typeof sfx.playSovereignVictoryFanfare === 'function') {
      sfx.playSovereignVictoryFanfare();
    } else {
      sfx.playResultChime(true);
    }
    triggerHaptic([90, 45, 130, 45, 160]);
    triggerBoardShake(0.85);
    if (typeof triggerCavernBossEnragePulse === 'function') {
      triggerCavernBossEnragePulse(2.0);
    }
    spawnFloatingPop(`🏆 SOVEREIGN TESSERACT VANQUISHED! +$${totalEarned} Gold!`, 'text-amber-300', 6000);
    setStatusBanner(true, `🏆 THE SOVEREIGN TESSERACT IS SHATTERED! Earned +$${totalEarned} Gold!`);
  }, 4000);

  // Stage 4 (6.3s): Open Final Ascension Victory Modal
  setTimeout(() => {
    showGameOverModal(
      true,
      'Subterranean Ascension Mastered!',
      `You shattered all 4 parallel warped boards, survived the Dimensional Upheaval, conquered the 12-Column Ethereal Cylinder, and vanquished The Sovereign Tesseract with $${state.gold} Gold!`
    );
  }, 6300);
}

function triggerAct4MidpointBoardFlush(shouldAdvanceToAI, floorData) {
  sfx.playTrapdoorRelease();
  triggerHaptic([60, 40, 90, 40, 80]);
  triggerBoardShake(0.55);
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(1.25);
  }

  const archId = floorData && floorData.bossArchetype ? floorData.bossArchetype.id : null;
  if (archId === 'void_weaver' && typeof playBossVoidWeaverVFX === 'function') {
    playBossVoidWeaverVFX([[2, 2], [2, 4]], null, null, null);
  } else if (typeof playBossAbyssalLodestoneVFX === 'function') {
    playBossAbyssalLodestoneVFX(3, [], null, null, null);
  }

  for (let c = 0; c < COLS; c++) {
    spawn3DShockwaveRing(0, c, 0x38bdf8, 2.0, 560);
    spawn3DParticleBurst(0, c, 0xf43f5e, 10, 0.14, 560, 'octa');
  }

  tokensGroup.children.forEach((mesh) => {
    const d = mesh.userData;
    if (d) d.vfxControlled = false;
    d.targetY = START_Y - 12.5 - Math.random() * 3.0;
    d.velY = -0.06 - Math.random() * 0.14;
    d.rotSpeedX = (Math.random() - 0.5) * 0.22;
  });

  const startMs = performance.now();
  const flushDuration = 1150;
  function stepBoardShakeTilt() {
    const p = Math.min(1, (performance.now() - startMs) / flushDuration);
    boardGroup.rotation.z = Math.sin(p * Math.PI * 6) * 0.085 * (1 - p);
    boardGroup.position.y = Math.sin(p * Math.PI * 4) * 0.22 * (1 - p);
    if (p < 1) {
      requestAnimationFrame(stepBoardShakeTilt);
    } else {
      boardGroup.rotation.set(0, 0, 0);
      boardGroup.position.set(0, 0, 0);
    }
  }
  requestAnimationFrame(stepBoardShakeTilt);

  spawnFloatingPop('🌪️ MIDPOINT CATACLYSM! Board Shaken Clean!', 'text-cyan-300', 5200);
  showToast(
    `🌪️ HALF-HEALTH CATACLYSM (2/4 ❤️)! ${floorData.boss} shook ALL pieces out of the board for a clean arena!`,
    '🌪️',
    5400,
    'border-cyan-400/80 text-cyan-100'
  );
  setStatusBanner(true, `🌪️ Midpoint Cataclysm (2/4 ❤️)! Shaking all tokens out for a clean board...`);

  setTimeout(() => {
    state.board = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => (state.boardMask[r][c] ? EMPTY : VOID_CELL))
    );
    clearThreeGroup(tokensGroup);
    state.meshes = createGrid(ROWS, COLS, null);
    generateSlotEnchantments();

    if (shouldAdvanceToAI) {
      triggerAITurn();
    } else {
      state.turn = PLAYER;
      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
      setStatusBanner(true, `⚔️ Boss at ${state.bossHp}/${state.bossMaxHp} ❤️ on a Clean Board • Continue Your Turn!`);
    }
  }, 1180);
}

function executeBossAbilityNow(arch, onComplete = null) {
  if (!arch) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  sfx.playBossAlarm();
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(0.75);
  }
  const handler = BOSS_ABILITY_HANDLERS[arch.id];
  if (handler) {
    handler(onComplete);
  } else if (typeof onComplete === 'function') {
    onComplete();
  }
}

function executeRandomizedBossAbility(arch, onComplete = null) {
  const interval = getEffectiveBossInterval(arch);
  if (state.turnNumber % interval !== 0) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  executeBossAbilityNow(arch, onComplete);
}

// ============================================================================
// FLOOR VICTORY, DEFEAT & BOSS CHEST MILESTONES
// ============================================================================
function highlightWinningLine(winLine) {
  if (!winLine) return;
  winLine.forEach(([r, c]) => {
    const m = state.meshes[r] && state.meshes[r][c];
    if (m) m.material = winGlowMat;
  });
}

function handleFloorVictory(winLine) {
  state.busy = true;
  highlightWinningLine(winLine);
  const floorData = getFloorConfig(state.floorIdx);
  const isTesseractBoss = floorData.isBoss && floorData.bossArchetype && floorData.bossArchetype.id === 'sovereign_tesseract';

  // Special Multi-Phase Board-Shattering Logic for Floor 15 Final Boss (The Sovereign Tesseract)
  if (isTesseractBoss) {
    state.lastActionWasDrop = false;

    if (Array.isArray(winLine)) {
      winLine.forEach(([r, c]) => {
        spawn3DShockwaveRing(r, c, 0xfde047, 1.85, 520);
      });
    }
    sfx.playCoinDing();

    if (state.bossHp > 1) {
      const nextRemHp = state.bossHp - 1;
      const shatteredIdx = state.activeTesseractBoardIdx || 0;
      const shatteredLabel = (state.tesseractBoards[shatteredIdx] && state.tesseractBoards[shatteredIdx].label) || `Board ${shatteredIdx + 1}`;
      setStatusBanner(true, `✨ Connect 4 on ${shatteredLabel}! Fracturing dimensional board...`);

      // Give 780ms for the winning token to physically drop into its slot and highlight the 4-in-a-row before shattering the board!
      setTimeout(() => {
        state.bossHp = nextRemHp;
        state.gold += 2;
        const remHp = state.bossHp;

        const hpStrip = document.getElementById('boss-hp-strip');
        if (hpStrip) {
          hpStrip.classList.add('ring-2', 'ring-amber-300', 'scale-110');
          setTimeout(() => hpStrip.classList.remove('ring-2', 'ring-amber-300', 'scale-110'), 700);
        }
        updateHUD();

        spawnFloatingPop(`💥 ${shatteredLabel} Shattered! (${remHp}/${state.bossMaxHp} ❤️ Left) +$2`, 'text-rose-300', 4800);
        setStatusBanner(true, `💥 ${shatteredLabel} Shattered (${remHp}/${state.bossMaxHp} ❤️ Left)! Removing board from rotation...`);

        // If the 4th planar board just shattered (dropping Boss to 1/5 HP), stop the normal boss BGM immediately
        // so the board shatter, cavern crumble, and cylinder descent play out before the Phase 3 track starts!
        if (remHp === 1 && typeof bgm !== 'undefined' && bgm && typeof bgm.stop === 'function') {
          bgm.stop();
        }

        triggerTesseractPlanarBoardShatter(winLine, shatteredIdx, () => {
          const intactIndices = getIntactTesseractBoardIndices();

          // Phase 1 Continues (2 or 3 intact planar boards remain: 4/5 or 3/5 HP)
          if (remHp >= 3 && intactIndices.length >= 2) {
            const nextIdx = getNextIntactTesseractBoardIndex(shatteredIdx);
            const nextLabel = (state.tesseractBoards[nextIdx] && state.tesseractBoards[nextIdx].label) || `Board ${nextIdx + 1}`;
            triggerFinalBossBoardRotation(
              nextIdx,
              `💥 ${shatteredLabel} Destroyed! ${intactIndices.length} Boards Remain — Sliding ${nextLabel} into play!`,
              () => {
                state.turn = PLAYER;
                state.busy = false;
                updateHUD();
                updateTelemetryBadges();
                setStatusBanner(true, `🌌 ${nextLabel} Active (${intactIndices.length}/4 Intact • ${remHp}/${state.bossMaxHp} ❤️) • Your Turn!`);
              },
              false
            );
            return;
          }

          // Phase 2 Begins (3 boards shattered, 1 planar board remains at 2/5 HP -> Trigger One-Time Opener Combo!)
          if (remHp === 2 && intactIndices.length >= 1) {
            const lastIdx = intactIndices[0];
            const lastLabel = (state.tesseractBoards[lastIdx] && state.tesseractBoards[lastIdx].label) || `Board ${lastIdx + 1}`;
            triggerFinalBossBoardRotation(
              lastIdx,
              `🌌 3 Boards Shattered! Only ${lastLabel} Remains — Sovereign Tesseract Unleashes Dimensional Upheaval!`,
              () => {
                triggerTesseractPhase2OpenerCombo();
              },
              false
            );
            return;
          }

          // Phase 3 Transition (All 4 planar boards shattered at 1/5 HP -> Cavern Crumbles & 12-Col Cylinder Lowers!)
          triggerPhase3EtherealCylinderTransition();
        });
      }, 780);
      return;
    }

    // Final Phase 3 Cylinder Beaten (1/5 HP -> 0/5 HP): Let the winning token drop into the cylinder slot (780ms), then cut BGM & launch Final Destruction!
    setStatusBanner(true, `✨ Final Connect 4 Connected! Breaching Sovereign Tesseract Core...`);
    setTimeout(() => {
      triggerSovereignTesseractFinalDeathSequence(winLine, floorData);
    }, 780);
    return;
  }

  // Standard Multi-HP Bosses (Acts I - IV)
  if (floorData.isBoss && state.bossHp > 1) {
    const shouldAdvanceToAI = !!state.lastActionWasDrop;
    state.lastActionWasDrop = false;

    state.bossHp -= 1;
    state.gold += 2;
    sfx.playBossPhaseShatter();
    triggerHaptic([50, 35, 80, 35, 60]);
    triggerBoardShake(0.34);
    if (typeof triggerCavernBossEnragePulse === 'function') {
      triggerCavernBossEnragePulse(0.95);
    }
    if (typeof updateCavernAesthetics === 'function') {
      updateCavernAesthetics();
    }

    winLine.forEach(([r, c]) => {
      spawn3DShockwaveRing(r, c, 0xf43f5e, 2.5, 520);
      spawn3DParticleBurst(r, c, 0xfacc15, 16, 0.14, 540, 'octa');
    });

    let targetCell = null;
    if (state.lastPlayedCell) {
      const [lr, lc] = state.lastPlayedCell;
      targetCell = winLine.find(([r, c]) => r === lr && c === lc);
    }
    if (!targetCell) {
      targetCell = winLine.reduce((best, cur) => (cur[0] >= best[0] ? cur : best), winLine[0]);
    }
    const [stoneR, stoneC] = targetCell;

    const hpStrip = document.getElementById('boss-hp-strip');
    if (hpStrip) {
      hpStrip.classList.add('ring-2', 'ring-amber-300', 'scale-110');
      setTimeout(() => hpStrip.classList.remove('ring-2', 'ring-amber-300', 'scale-110'), 700);
    }

    updateHUD();
    const remHp = state.bossHp;

    // ACT IV BOSS SPECIAL: After 2 hearts of damage (at 2/4 HP), shake all pieces out of the board!
    if (state.bossMaxHp === 4 && remHp === 2) {
      triggerAct4MidpointBoardFlush(shouldAdvanceToAI, floorData);
      return;
    }

    spawnFloatingPop(`💔 -1 Boss HP! (${remHp}/${state.bossMaxHp} ❤️ Left) +$2`, 'text-rose-300', 4800);
    showToast(
      `💥 Depleted 1 Boss HP (${remHp}/${state.bossMaxHp} ❤️ Left)! Your winning piece in Col ${stoneC + 1} turned into Petrified Stone — Battle Continues!`,
      '🪨',
      5000,
      'border-rose-400/80 text-rose-100'
    );
    setStatusBanner(true, `💥 Boss HP Depleted (${remHp}/${state.bossMaxHp} ❤️ Left)! Winning piece calcified to Stone...`);

    setTimeout(() => {
      state.board[stoneR][stoneC] = STONE;
      let extraLine = aiEngine.findWinningLine(state.board, PLAYER);
      while (extraLine) {
        const [er, ec] = extraLine[extraLine.length - 1];
        state.board[er][ec] = STONE;
        extraLine = aiEngine.findWinningLine(state.board, PLAYER);
      }

      sfx.playPetrifiedSeal();
      spawn3DShockwaveRing(stoneR, stoneC, 0xa8a29e, 2.4, 480);
      spawn3DParticleBurst(stoneR, stoneC, 0x78716c, 16, 0.12, 480, 'box');
      rebuildBoardMeshes();

      if (aiEngine.isBoardFull(state.board)) {
        handleDraw();
        return;
      }

      if (shouldAdvanceToAI) {
        triggerAITurn();
      } else {
        state.turn = PLAYER;
        state.busy = false;
        updateHUD();
        updateTelemetryBadges();
        setStatusBanner(true, `⚔️ Boss at ${state.bossHp}/${state.bossMaxHp} ❤️ • Continue Your Turn!`);
      }
    }, 850);
    return;
  }

  if (floorData.isBoss) {
    state.bossHp = 0;
    const clearedBossNum = Math.floor(state.floorIdx / 3) + 1;
    state.unlockedShopTier = Math.min(5, Math.max(state.unlockedShopTier || 1, clearedBossNum + 1));
    if (state.unlockedShopTier >= 3) {
      state.highTierCardsUnlocked = true;
    }
    if (typeof triggerCavernBossEnragePulse === 'function') {
      triggerCavernBossEnragePulse(1.35);
    }
    if (typeof updateCavernAesthetics === 'function') {
      updateCavernAesthetics();
    }
  }
  state.gameOver = true;
  sfx.playResultChime(true);
  triggerHaptic([40, 30, 70]);

  let philosopherBonus = 0;
  if (hasGambit('alkahest_vial')) {
    let stoneCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.board[r][c] === STONE) stoneCount++;
      }
    }
    philosopherBonus = Math.max(3, stoneCount * 2);
    pulseGambitBadgeInHUD('alkahest_vial');
    spawnFloatingPop(`🧪 Alkahest Vial: +$${philosopherBonus} Gold!`, 'text-purple-300', 5000);
  }

  const baseReward = floorData.isBoss ? 7 : 3;
  const speedBonus = Math.max(0, state.stability);
  const totalEarned = baseReward + speedBonus + philosopherBonus;
  state.gold += totalEarned;
  state.pendingVictoryPayout = { totalEarned, speedBonus };
  updateHUD();

  setStatusBanner(true, `🎉 Floor ${floorData.floor} Cleared! Earned +$${totalEarned} Gold!`);

  setTimeout(() => {
    if (state.floorIdx >= TOTAL_FLOORS - 1) {
      showGameOverModal(
        true,
        'Subterranean Ascension Mastered!',
        `You conquered all ${TOTAL_FLOORS} cavern floors, vanquished all 5 multi-phase Bosses across warped procedural topologies, and amassed $${state.gold} Gold!`
      );
      return;
    }

    if (floorData.isBoss) {
      openBossVictoryChest(floorData);
    } else {
      openUndergroundBazaar(totalEarned, speedBonus);
    }
  }, 950);
}

function handleFloorDefeat(aiWinLine) {
  state.gameOver = true;
  state.busy = true;
  highlightWinningLine(aiWinLine);
  sfx.playResultChime(false);
  triggerHaptic([80, 40, 100]);

  const floorData = getFloorConfig(state.floorIdx);
  setStatusBanner(false, `💀 Defeated by ${floorData.boss} on Floor ${floorData.floor}`);

  setTimeout(() => {
    showGameOverModal(
      false,
      `Outmaneuvered on Floor ${floorData.floor}`,
      `${floorData.boss} connected 4 tokens across the ${state.currentTopology ? state.currentTopology.name : 'cavern board'}. Retry this floor or begin a fresh Ascension!`
    );
  }, 950);
}

function handleDraw() {
  const floorData = getFloorConfig(state.floorIdx);
  if (floorData.isBoss && floorData.bossArchetype && floorData.bossArchetype.id === 'sovereign_tesseract') {
    state.board = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => (state.boardMask[r][c] ? EMPTY : VOID_CELL))
    );
    if (state.isCylinderPhase) {
      rebuildBoardMeshes();
      showToast('🪐 Cylinder Full! Ethereal grid flushed clean for final convergence!', '🪐', 4200);
      state.turn = PLAYER;
      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
      return;
    }
    saveCurrentTesseractBoardState();
    const intact = getIntactTesseractBoardIndices();
    if (intact.length <= 1) {
      rebuildBoardMeshes();
      showToast('🌌 Board Full! Final Planar Board flushed clean!', '🌌', 3800);
      state.turn = PLAYER;
      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
      return;
    }
    const nextIdx = getNextIntactTesseractBoardIndex(state.activeTesseractBoardIdx);
    triggerFinalBossBoardRotation(nextIdx, '🌌 Board Full! Tesseract flushed & rotated to next intact Parallel Board!', () => {
      state.turn = PLAYER;
      state.busy = false;
      updateHUD();
      updateTelemetryBadges();
    });
    return;
  }
  state.gameOver = true;
  state.busy = true;
  sfx.playCurseBuzzer();
  setStatusBanner(false, '⚖️ Cavern Grid Stalemate — Board Full!');
  setTimeout(() => {
    showGameOverModal(
      false,
      'Subterranean Stalemate',
      'Every playable slot on this cavern topology has been filled without a Connect 4. Retry the floor to break the deadlock!'
    );
  }, 850);
}
