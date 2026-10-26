// ============================================================================
// CORE BOARD MECHANICS, CARD CASTING, RESERVE DROPS & BOSS ABILITIES (js/engine/boardLogic.js)
// ============================================================================

// Triggered whenever ANY token is shattered (cards, bombs, anvils, stalactite collapse)
function onTokenShattered(count = 1) {
    sfx.playShatterCrunch();
    state.shatterCounter += count;
    if (hasGambit('obsidian_cat')) {
        const bonus = count * 2;
        state.gold += bonus;
        sfx.playCatMeowSlash(false);
        pulseGambitBadgeInHUD('obsidian_cat');
        spawnFloatingPop(`🐈‍⬛ Obsidian Cat Gambit: +$${bonus} Gold!`, 'text-amber-300', 5000);
    }
    if (hasGambit('jalapeno_overdrive') && state.shatterCounter >= 2) {
        state.shatterCounter -= 2;
        // Convert 1 random AI token on board to Player color!
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
                "🔥 Jalapeño Overdrive Synergy: Shattered 2 tokens & converted an AI token to your color!",
                "🌶️",
                5500,
                "border-rose-400/70 text-rose-100"
            );
        }
    }
    updateHUD();
}

function startFloorMatch(showIntroScreen = true) {
    const floorData = getFloorConfig(state.floorIdx);
    const topo = getFloorTopology(state.floorIdx);
    state.currentTopology = topo;
    state.boardMask = topo.mask;
    const mods = state.nextFloorModifiers;

    while (tokensGroup.children.length > 0) {
        tokensGroup.remove(tokensGroup.children[0]);
    }

    // Initialize board with VOID_CELL (-1) where carved away, EMPTY (0) where playable
    state.board = Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => (topo.mask[r][c] ? EMPTY : VOID_CELL))
    );
    state.meshes = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    // Rebuild 3D Carved Wood Board & Bedrock Pedestals for this floor's topology
    rebuild3DBoardGeometry(topo.mask);

    state.bossMaxHp = floorData.isBoss ? (floorData.maxHp || 2) : 1;
    state.bossHp = state.bossMaxHp;
    state.turn = PLAYER;
    state.turnNumber = 1;
    state.stability = Math.max(4, floorData.stability + (mods.bonusStability || 0));
    state.busy = false;
    state.gameOver = false;
    state.previewCol = -1;
    state.selectedCardIdx = null;
    state.selectedReserveIdx = null;
    state.catNineLivesUsed = false;
    state.lastDroppedCols = [];
    state.bossMarkedCol = Math.floor(Math.random() * COLS);

    // Determine target chiptune soundtrack mode (Cavern Exploration Loop vs Boss 1 F3 -> Boss 2 F6 -> Boss 3 F9)
    const targetBgmMode = floorData.isBoss
        ? (state.floorIdx >= 8 ? 'boss3' : (state.floorIdx >= 5 ? 'boss2' : 'boss1'))
        : 'cavern';
    if (!showIntroScreen) {
        bgm.setMode(targetBgmMode);
    }

    // Dramatic 3D Cavern Lighting shift on Boss, Pre-Boss Vanguard, and Standard Floors
    if (floorData.isBoss) {
        amberLanternLight.color.setHex(0xf43f5e); // Crimson Boss Glow
        tealBiolumLight.color.setHex(0xa855f7);   // Violet Boss Bioluminescence
        showToast(`💀 BOSS F${floorData.floor}: ${floorData.boss} • Board: ${topo.name}!`, topo.icon);
    } else if (floorData.isPreBoss) {
        amberLanternLight.color.setHex(0xf97316); // Vanguard Molten Amber
        tealBiolumLight.color.setHex(0x38bdf8);   // Vanguard Electric Sky
        showToast(`⚔️ PRE-BOSS VANGUARD • Warped Board: ${topo.name}!`, topo.icon);
    } else {
        amberLanternLight.color.setHex(0xf59e0b);
        tealBiolumLight.color.setHex(0x14b8a6);
    }

    colHighlightMesh.visible = false;
    ghostToken.visible = false;
    document.getElementById('confirm-drop-btn').classList.add('hidden');
    document.getElementById('action-inspector').classList.add('hidden');

    generateSlotEnchantments();

    // Apply Difficulty Tier pre-spawned stones (Abyssal Cataclysm) + Wheel of Fate Cave-In Hazard Stones
    const diff = getActiveDifficulty();
    const totalStartStones = (mods.caveInStones || 0) + (diff.preSpawnStones || 0);
    if (totalStartStones > 0) {
        for (let i = 0; i < totalStartStones; i++) {
            const validCols = [];
            for (let c = 0; c < COLS; c++) {
                if (aiEngine.getAvailableRow(state.board, c) !== -1) validCols.push(c);
            }
            if (validCols.length > 0) {
                const rc = validCols[Math.floor(Math.random() * validCols.length)];
                const rr = aiEngine.getAvailableRow(state.board, rc);
                spawnTokenMesh(rr, rc, STONE);
            }
        }
        if (mods.caveInStones > 0) {
            showToast(`☄️ Cave-In Hazard dropped ${totalStartStones} Petrified Stone(s)!`, "🪨");
        }
    }
    if (false && mods.caveInStones > 0) {
        for (let i = 0; i < mods.caveInStones; i++) {
            const validCols = [];
            for (let c = 0; c < COLS; c++) {
                if (aiEngine.getAvailableRow(state.board, c) !== -1) validCols.push(c);
            }
            if (validCols.length > 0) {
                const rc = validCols[Math.floor(Math.random() * validCols.length)];
                const rr = aiEngine.getAvailableRow(state.board, rc);
                spawnTokenMesh(rr, rc, STONE);
            }
        }
        showToast(`☄️ Cave-In Hazard dropped ${mods.caveInStones} Petrified Stones!`, "🪨");
    }

    // Apply Wheel of Fate AI Headstart Hazard + Abyssal Cataclysm Boss Headstart (Floors 6 & 9)
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
        showToast(`🤖 Opponent Headstart: AI deployed ${dropped} opening token(s)!`, "⚠️");
    }
    if (false && mods.aiHeadstartTokens > 0) {
        const startCols = [2, 4, 3, 1, 5];
        let dropped = 0;
        for (const sc of startCols) {
            if (dropped >= mods.aiHeadstartTokens) break;
            const rr = aiEngine.getAvailableRow(state.board, sc);
            if (rr !== -1) {
                spawnTokenMesh(rr, sc, AI);
                dropped++;
            }
        }
        showToast(`🤖 AI Headstart Curse: Opponent deployed ${dropped} opening tokens!`, "⚠️");
    }

    // Shuffle unspent stockpiled cards into the floor draw pile; draw up to state.handSize
    state.drawPile = shuffle(state.masterDeck.slice());
    state.discardPile = [];
    state.hand = [];
    drawCards(state.handSize);

    state.shroomDropCounter = 0;
    state.mana = Math.max(
        0,
        state.maxMana +
        (hasGambit('jalapeno_overdrive') ? 1 : 0) +
        (hasGambit('sacred_heart_prism') ? 1 : 0) +
        (mods.bonusMana || 0)
    );

    // Reset one-floor Wheel of Fate modifiers after applying
    state.nextFloorModifiers = {
        bonusMana: 0,
        bonusStability: 0,
        bonusEnchantSlots: 0,
        caveInStones: 0,
        aiHeadstartTokens: 0
    };

    updateHUD();
    updateTelemetryBadges();
    setStatusBanner(
        true,
        floorData.isBoss
            ? `⚠️ BOSS (${topo.name}): ${floorData.bossArchetype.shortTelegraph}`
            : (floorData.isPreBoss
                ? `⚔️ Pre-Boss Board: ${topo.name} — Aim carefully!`
                : "Tap or slide across columns to aim • Tap again to drop")
    );

    // Trigger the fade-in / fade-out level intro screen (pauses BGM, plays transition jingle, then resumes BGM)
    if (showIntroScreen) {
        playFloorIntroTransition(floorData, topo, targetBgmMode);
    }
}

// Trigger Slot Enchantment when a token lands on (r, c)
function triggerSlotEnchantment(r, c, actor) {
    const eType = state.enchantGrid[r][c];
    if (!eType) return;

    // Consume the slot enchantment once triggered
    state.enchantGrid[r][c] = ENCHANT_TYPES.NONE;
    rebuildEnchantmentRings();

    if (eType === ENCHANT_TYPES.GILDED) {
        if (actor === PLAYER) {
            state.gold += 3;
            sfx.playCoinDing();
            spawnFloatingPop("🪙 Gilded Slot: +$3 Gold!", "text-amber-300", 5200);
            spawnSlotBonusCallout(
                r, c,
                "🪙",
                "Gilded Slot Triggered!",
                "You gained +$3 Bonus Gold Coins immediately.",
                "border-yellow-400/80",
                "bg-yellow-400 text-stone-950",
                4800
            );
            showToast(
                "Gilded Slot Acquired (Col " + (c + 1) + "): +$3 Bonus Gold added to your pouch!",
                "🪙",
                5500,
                "border-yellow-400/75 text-yellow-100"
            );
        } else {
            spawnSlotBonusCallout(
                r, c,
                "⚠️",
                "AI Claimed Gilded Slot",
                "The opponent denied your +$3 Gold slot in Col " + (c + 1) + ".",
                "border-amber-500/60",
                "bg-amber-500 text-stone-950",
                4500
            );
            showToast("AI looted the Gilded Slot in Col " + (c + 1) + "!", "🪙", 5000);
        }
    } else if (eType === ENCHANT_TYPES.SPICE) {
        if (actor === PLAYER) {
            state.mana += 1;
            let charredMsg = "Restored +1 Mana Crystal!";
            // Char 1 adjacent AI token
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && state.board[nr][nc] === AI) {
                    state.board[nr][nc] = EMPTY;
                    applyColumnGravity(nc);
                    rebuildBoardMeshes();
                    onTokenShattered(1);
                    charredMsg = "+1 Mana Crystal & charred an adjacent AI token!";
                    break;
                }
            }
            spawnFloatingPop("🌶️ Volatile Spice: +1 Mana!", "text-rose-300", 5200);
            spawnSlotBonusCallout(
                r, c,
                "🌶️",
                "Volatile Spice Slot!",
                charredMsg,
                "border-rose-400/85",
                "bg-rose-500 text-white",
                4800
            );
            showToast(
                "Volatile Spice Slot Acquired: " + charredMsg,
                "🔥",
                5500,
                "border-rose-400/75 text-rose-100"
            );
        } else {
            showToast("AI neutralized the Volatile Spice Slot in Col " + (c + 1) + ".", "🌶️", 4800);
        }
    } else if (eType === ENCHANT_TYPES.WEB) {
        if (actor === AI) {
            state.board[r][c] = STONE;
            rebuildBoardMeshes();
            spawnSlotBonusCallout(
                r, c,
                "🕸️",
                "Spider Web Trap Sprung!",
                "AI token in Col " + (c + 1) + " was petrified into neutral stone!",
                "border-purple-400/80",
                "bg-purple-500 text-white",
                4800
            );
            showToast(
                "🕸️ Spider Web Slot petrified the AI's token into neutral blocker stone!",
                "🪵",
                5500,
                "border-purple-400/75 text-purple-100"
            );
        } else {
            state.stability += 1;
            spawnFloatingPop("🕸️ Web Slot: +1 Seismic Stability!", "text-purple-300", 5200);
            spawnSlotBonusCallout(
                r, c,
                "🕸️",
                "Spider Web Slot Reinforced!",
                "Restored +1 Seismic Stability turn (+$1 speed bonus).",
                "border-purple-400/80",
                "bg-purple-500 text-white",
                4800
            );
            showToast(
                "Spider Web Slot Acquired: Reinforced cavern ceiling for +1 Seismic Stability!",
                "🕸️",
                5500,
                "border-purple-400/75 text-purple-100"
            );
        }
    } else if (eType === ENCHANT_TYPES.AMPLIFIER) {
        state.board[r][c] = WILD;
        if (actor === PLAYER) {
            state.gold += 2;
            sfx.playCoinDing();
            spawnFloatingPop("💎 Wild Amplifier: Wild Token +$2 Gold!", "text-sky-300", 5200);
            spawnSlotBonusCallout(
                r, c,
                "💎",
                "Amplifier Slot Activated!",
                "Upgraded into a Wild Prismatic Token (counts for both colors) +$2 Gold!",
                "border-sky-400/85",
                "bg-sky-400 text-stone-950",
                4800
            );
            showToast(
                "💎 Amplifier Slot Acquired: Token upgraded to Wild Prismatic +$2 Bonus Gold!",
                "💎",
                5500,
                "border-sky-400/75 text-sky-100"
            );
        } else {
            spawnSlotBonusCallout(
                r, c,
                "💎",
                "Amplifier Slot Triggered!",
                "Token became a Wild Prismatic Token (usable by both players)!",
                "border-sky-400/80",
                "bg-sky-400 text-stone-950",
                4800
            );
            showToast("💎 Amplifier Slot turned the dropped token into a shared Wild Token!", "💎", 5200);
        }
        rebuildBoardMeshes();
    } else if (eType === ENCHANT_TYPES.CURSED_SPORE) {
        if (actor === PLAYER) {
            if (state.mana > 0) {
                state.mana = Math.max(0, state.mana - 1);
                spawnFloatingPop("🍄 Cursed Spore: Drained -1 Mana!", "text-lime-300", 5200);
                spawnSlotBonusCallout(
                    r, c,
                    "🍄",
                    "Cursed Spore Hazard!",
                    "Mycelial spores drained -1 Mana Crystal from your pool.",
                    "border-lime-400/80",
                    "bg-lime-400 text-stone-950",
                    4800
                );
                showToast(
                    "🍄 Cursed Spore Hazard triggered: Drained -1 Mana Crystal!",
                    "🍄",
                    5500,
                    "border-lime-400/75 text-lime-100"
                );
            } else {
                state.board[r][c] = STONE;
                rebuildBoardMeshes();
                spawnSlotBonusCallout(
                    r, c,
                    "🍄",
                    "Cursed Spore Petrification!",
                    "With 0 Mana remaining, your token was calcified into neutral stone!",
                    "border-lime-400/80",
                    "bg-lime-400 text-stone-950",
                    4800
                );
                showToast(
                    "🍄 Cursed Spore petrified your token into stone (0 Mana to absorb it)!",
                    "🍄",
                    5500,
                    "border-lime-400/75 text-lime-100"
                );
            }
        }
    }
    // Sacred Prismatic Heart Gambit: Landing on ANY beneficial Enchanted Slot also draws 1 card & restores +1 Mana!
    if (actor === PLAYER && eType !== ENCHANT_TYPES.CURSED_SPORE && hasGambit('sacred_heart_prism')) {
        state.mana = Math.min(state.maxMana + 2, state.mana + 1);
        drawCards(1);
        sfx.playSacredHeartChoir();
        pulseGambitBadgeInHUD('sacred_heart_prism');
        spawn3DShockwaveRing(r, c, 0xf43f5e, 2.7, 520);
        spawn3DParticleBurst(r, c, 0xfde047, 16, 0.12, 540, 'octa');
        spawnFloatingPop("❤️‍🔥 Sacred Heart: +1 Mana & +1 Card!", "text-amber-200", 5200);
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
// 8. COLUMN DROP, RESERVE POUCH DEPLOYMENT & GAMBIT TRIGGERS
// ============================================================================
function updateColumnPreviewVisual(col) {
    if (col < 0 || col >= COLS || state.turn !== PLAYER || state.busy || state.gameOver) {
        state.previewCol = -1;
        colHighlightMesh.visible = false;
        ghostToken.visible = false;
        document.getElementById('confirm-drop-btn').classList.add('hidden');
        return;
    }

    if (state.previewCol !== col) sfx.playHoverTick();
    state.previewCol = col;
    const colX = START_X + col * CELL_SPACING;

    colHighlightMesh.position.set(colX, START_Y + (BOARD_H - CELL_SPACING) / 2, 0);
    colHighlightMesh.visible = true;

    const availRow = aiEngine.getAvailableRow(state.board, col);
    if (availRow !== -1 && state.selectedCardIdx === null) {
        ghostToken.position.set(colX, START_Y + availRow * CELL_SPACING, 0);
        ghostToken.visible = true;
    } else {
        ghostToken.visible = false;
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

    // Oddly Shrinking Cave Shroom Gambit (Tiny 3D tokens + every 3rd drop squeaks for +$2 Gold & +1 Stability!)
    if (hasGambit('shrinking_shroom')) {
        state.shroomDropCounter = (state.shroomDropCounter || 0) + 1;
        sfx.playTinySqueak();
        pulseGambitBadgeInHUD('shrinking_shroom');
        spawn3DParticleBurst(landedR, col, 0xa3e635, 8, 0.08, 380, 'octa');
        if (state.shroomDropCounter % 3 === 0) {
            state.gold += 2;
            state.stability += 1;
            spawn3DShockwaveRing(landedR, col, 0x84cc16, 2.3, 460);
            spawnFloatingPop("🍄 Tiny Shroom Squeak: +$2 Gold & +1 Stability!", "text-lime-300", 5000);
            showToast(
                "🍄 Oddly Shrinking Cave Shroom (3rd Mini-Token): Squeaked for +$2 Gold & +1 Seismic Stability!",
                "🍄",
                5000,
                "border-lime-400/75 text-lime-100"
            );
        }
    }

    // Butter-Cheese Golden Crust Gambit (Col 1 or Col 7)
    if (hasGambit('butter_crust') && (col === 0 || col === COLS - 1)) {
        state.gold += 1;
        state.stability += 1;
        sfx.playButterCrustChime();
        pulseGambitBadgeInHUD('butter_crust');
        spawn3DColumnBeam(col, 0xfacc15, 0.34, 420, false);
        spawn3DParticleBurst(landedR, col, 0xfde047, 14, 0.11, 460, 'box');
        spawnFloatingPop("🍕 Golden Crust Gambit: +$1 Gold & +1 Stability!", "text-amber-300", 5000);
        showToast(
            "🍕 Butter-Cheese Golden Crust (Edge Column): Awarded +$1 Gold & +1 Seismic Stability!",
            "🍕",
            5200,
            "border-amber-400/75 text-amber-100"
        );
    }

    // Coaster Apex Momentum Gambit (3 ascending columns in a row)
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
            spawnFloatingPop("🎢 Coaster Apex Combo: +1 Mana & +$2 Gold!", "text-teal-300", 5200);
            showToast(
                `🎢 Coaster Apex Momentum (Cols ${a + 1}→${b + 1}→${c + 1}): Awarded +1 Mana & +$2 Gold!`,
                "🎢",
                5500,
                "border-teal-400/75 text-teal-100"
            );
        }
    }
}

function commitColumnAction(col) {
    if (state.busy || state.gameOver || state.turn !== PLAYER || col < 0 || col >= COLS) return;

    // 1. Cast Selected Arcane Card
    if (state.selectedCardIdx !== null) {
        state.lastActionWasDrop = false;
        castCardOnColumn(state.selectedCardIdx, col);
        return;
    }

    // 2. Deploy Selected Reserve Token OR Standard Token
    state.lastActionWasDrop = true;
    let r = aiEngine.getAvailableRow(state.board, col);
    if (r === -1) {
        showToast("Column is full!", "⚠️");
        return;
    }

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
        handleFloorVictory(winLine);
        return;
    }
    if (aiEngine.isBoardFull(state.board)) {
        handleDraw();
        return;
    }

    triggerAITurn();
}

function executeReserveTokenDrop(r, col, rType) {
    const repeat = hasGambit('echo_bell') ? 2 : 1;
    if (hasGambit('echo_bell')) {
        state.gold += 1;
        sfx.playEchoBellToll();
        pulseGambitBadgeInHUD('echo_bell');
        spawn3DShockwaveRing(r, col, 0xfde047, 2.8, 520);
        spawnFloatingPop("🔔 Echo Bell Resonance: 2x Effect & +$1!", "text-amber-200", 5000);
    }

    if (rType === 'wild') {
        sfx.playWildPrismatic();
        triggerHaptic([20, 25, 35]);
        spawnTokenMesh(r, col, WILD);
        spawn3DShockwaveRing(r, col, 0xe879f9, 2.5, 480);
        spawn3DParticleBurst(r, col, 0x38bdf8, 16, 0.12, 500, 'octa');
        triggerSlotEnchantment(r, col, PLAYER);
        showToast("💎 Wild Prismatic Token deployed!", "💎");
    } else if (rType === 'anvil') {
        sfx.playAnvilClang();
        triggerHaptic([45, 30, 65]);
        triggerBoardShake(0.28);
        spawnTokenMesh(r, col, PLAYER);
        for (let i = 0; i < repeat; i++) {
            const topR = aiEngine.getTopOccupiedRow(state.board, col);
            let belowR = -1;
            for (let rr = topR - 1; rr >= 0; rr--) {
                if (state.board[rr][col] !== VOID_CELL && state.board[rr][col] !== EMPTY) {
                    belowR = rr;
                    break;
                }
            }
            if (topR !== -1 && belowR !== -1) {
                spawn3DParticleBurst(belowR, col, 0x94a3b8, 16, 0.14, 480, 'box');
                spawn3DShockwaveRing(belowR, col, 0xf59e0b, 2.2, 420);
                state.board[belowR][col] = state.board[topR][col];
                state.board[topR][col] = EMPTY;
                applyColumnGravity(col);
                onTokenShattered(1);
            }
        }
        rebuildBoardMeshes();
        const landedR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
        if (!aiEngine.findWinningLine(state.board, PLAYER)) {
            triggerSlotEnchantment(landedR, col, PLAYER);
        }
        showToast("⚓ Heavy Anvil crushed the token beneath it!", "⚓");
    } else if (rType === 'jalapeno_bomb') {
        sfx.playJalapenoBlast();
        triggerHaptic([50, 30, 75]);
        triggerBoardShake(0.32);
        spawnTokenMesh(r, col, PLAYER);
        spawn3DShockwaveRing(r, col, 0xf43f5e, 3.1, 520);
        spawn3DParticleBurst(r, col, 0xf97316, 22, 0.16, 560, 'cone');

        let shattered = 0;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = col + dc;
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
        showToast(`🌶️ Jalapeño Bomb exploded & shattered ${shattered} AI token(s)!`, "💥");
    } else if (rType === 'cave_bat') {
        sfx.playBatEcholocation();
        triggerHaptic([20, 20, 40]);
        spawnTokenMesh(r, col, PLAYER);
        spawn3DShockwaveRing(r, col, 0xa855f7, 2.2, 460);
        let belowR = -1;
        for (let rr = r - 1; rr >= 0; rr--) {
            if (state.board[rr][col] !== VOID_CELL && state.board[rr][col] !== EMPTY) {
                belowR = rr;
                break;
            }
        }
        if (belowR !== -1) {
            state.board[belowR][col] = PLAYER;
            rebuildBoardMeshes();
            spawn3DShockwaveRing(belowR, col, 0xfbbf24, 2.0, 440);
            spawn3DParticleBurst(belowR, col, 0xc084fc, 14, 0.11, 460, 'cone');
            showToast("🦇 Vampire Bat latched onto & converted the token below!", "🦇");
        }
        triggerSlotEnchantment(r, col, PLAYER);
    } else if (rType === 'fools_penny') {
        const luckyRoll = Math.random() < 0.65;
        playFoolsPennyFlipVFX(r, col, luckyRoll);
        if (luckyRoll) {
            spawnTokenMesh(r, col, PLAYER);
            const goldGain = 4 * repeat;
            const manaGain = 1 * repeat;
            state.gold += goldGain;
            state.mana = Math.min(state.maxMana + 2, state.mana + manaGain);
            sfx.playCoinDing();
            spawn3DShockwaveRing(r, col, 0xfacc15, 2.5, 480);
            spawn3DParticleBurst(r, col, 0xfde047, 16, 0.13, 500, 'octa');
            spawnFloatingPop(`💩 Fool's Penny Jackpot: +$${goldGain} & +${manaGain}M!`, "text-amber-300", 5000);
            if (!aiEngine.findWinningLine(state.board, PLAYER)) {
                triggerSlotEnchantment(r, col, PLAYER);
            }
            showToast(`🪙 Fool's Counterfeit Penny passed inspection! Minted +$${goldGain} Gold & +${manaGain} Mana!`, "🪙");
        } else {
            spawnTokenMesh(r, col, STONE);
            state.gold += 1;
            sfx.playCurseBuzzer();
            triggerBoardShake(0.18);
            spawn3DParticleBurst(r, col, 0x78716c, 14, 0.11, 460, 'box');
            spawnFloatingPop("💩 Counterfeit Dud! Turned to Stone (+$1)", "text-stone-300", 5000);
            showToast("💩 BUSTED! Fool's Counterfeit Penny was a dud and petrified into neutral Stone (+$1 consolation)!", "💩");
        }
    } else if (rType === 'midas_eye') {
        sfx.playMidasFanfare();
        triggerHaptic([35, 25, 55, 25, 45]);
        triggerBoardShake(0.24);
        spawnTokenMesh(r, col, WILD);
        spawn3DColumnBeam(col, 0xfacc15, 0.42, 520, true);
        spawn3DShockwaveRing(r, col, 0xfde047, 3.0, 540);
        spawn3DParticleBurst(r, col, 0xfacc15, 22, 0.15, 560, 'octa');

        let converted = 0;
        const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of ortho) {
            const nr = r + dr, nc = col + dc;
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
        for (let upR = r + 1; upR < ROWS; upR++) {
            if (state.board[upR][col] !== VOID_CELL) {
                if (state.board[upR][col] === EMPTY) {
                    state.enchantGrid[upR][col] = ENCHANT_TYPES.GILDED;
                    rebuildEnchantmentRings();
                    spawn3DShockwaveRing(upR, col, 0xfacc15, 1.9, 440);
                }
                break;
            }
        }
        rebuildBoardMeshes();
        if (!aiEngine.findWinningLine(state.board, PLAYER)) {
            triggerSlotEnchantment(r, col, PLAYER);
        }
        showToast(`👁️‍🗨️ Golden Midas Eye deployed Wild, transmuted ${converted} adjacent piece(s), & gilded Col ${col + 1}!`, "👁️‍🗨️");
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

function triggerSinkholeTrapdoor(handIdx, effCost) {
    const totalInPlay = countTokensInPlay(state.board);
    if (totalInPlay < 3) {
        showToast(`Subterranean Trapdoor requires at least 3 tokens in play (${totalInPlay}/3)!`, "🕳️");
        return;
    }

    // Select 3 random tokens starting from the bottom row (r = 0), pulling from higher rows (r = 1, 2, ...) if needed
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
        showToast("Need at least 3 tokens in play!", "⚠️");
        return;
    }

    state.busy = true;
    state.mana -= effCost;
    consumeHandCardCopy(handIdx);
    clearActionSelection();
    updateColumnPreviewVisual(-1);
    updateHUD();

    // Shake the 3D board and play the trapdoor release sound
    sfx.playTrapdoorRelease();
    triggerHaptic([40, 25, 65, 25, 50]);
    triggerBoardShake(0.36);
    setStatusBanner(true, "🕳️ Subterranean Trapdoor opened! 3 bottom tokens falling out...");

    // Hide the 3 original meshes on the board and launch the 3 falling token VFX meshes
    const affectedColsSet = new Set();
    selectedTargets.forEach(({ r, c }) => {
        affectedColsSet.add(c);
        if (state.meshes[r] && state.meshes[r][c]) {
            state.meshes[r][c].visible = false;
        }
    });
    const affectedCols = Array.from(affectedColsSet);

    playSinkholeFallingTokensVFX(selectedTargets);

    // After the 3 tokens drop clear of the bottom frame, shift their columns down
    setTimeout(() => {
        selectedTargets.forEach(({ r, c }) => {
            state.board[r][c] = EMPTY;
        });
        affectedCols.forEach(c => applyColumnGravity(c));
        rebuildBoardMeshes(affectedCols);
        onTokenShattered(selectedTargets.length);

        const colsText = affectedCols.map(c => c + 1).sort((a, b) => a - b).join(', ');
        showToast(
            `🕳️ Subterranean Trapdoor dropped 3 bottom tokens & shifted Col(s) ${colsText} down!`,
            "🕳️"
        );
    }, 280);

    // Resolve post-shift Enchanted Slots and active-player priority Connect-4 checks after floor bounce
    setTimeout(() => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = state.board[r][c];
                if ((cell === PLAYER || cell === AI) && state.enchantGrid[r][c] !== ENCHANT_TYPES.NONE) {
                    triggerSlotEnchantment(r, c, cell);
                }
            }
        }

        const winState = aiEngine.checkWinState(state.board, PLAYER);
        if (winState) {
            if (winState.winner === PLAYER) {
                handleFloorVictory(winState.line);
                return;
            } else {
                handleFloorDefeat(winState.line);
                return;
            }
        }

        state.busy = false;
        updateHUD();
        updateTelemetryBadges();
        setStatusBanner(true, "Columns Shifted! Your Turn • Drag across columns to aim");
    }, 900);
}

function triggerAbyssalBoardFlip(handIdx, effCost) {
    let totalTokens = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (state.board[r][c] !== EMPTY && state.board[r][c] !== VOID_CELL) {
                totalTokens++;
            }
        }
    }
    if (totalTokens === 0) {
        showToast("Place at least 1 token before flipping the board!", "⚠️");
        return;
    }

    state.busy = true;
    state.mana -= effCost;
    consumeHandCardCopy(handIdx);
    clearActionSelection();
    updateColumnPreviewVisual(-1);
    updateHUD();

    sfx.playBoardFlipWhoosh();
    triggerHaptic([35, 30, 65, 30, 45]);
    setStatusBanner(true, "🔄 Abyssal Upheaval! Flipping cavern board 180°...");

    // True vertical center of the 6 rows (r = 0..5): START_Y + 2.5 * CELL_SPACING (= 0.35)
    const BOARD_CENTER_Y = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;
    const flipDuration = 560;
    const startTime = performance.now();

    function stepBoardFlip(now) {
        const rawP = Math.min(1, (now - startTime) / flipDuration);
        const ease = rawP < 0.5
            ? 4 * rawP * rawP * rawP
            : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

        const angle = ease * Math.PI; // 0 -> 180 degrees (PI radians)
        boardGroup.rotation.x = angle;
        // Pivot cleanly around (0, BOARD_CENTER_Y, 0) with a dramatic Z-pullback
        boardGroup.position.y = BOARD_CENTER_Y * (1 - Math.cos(angle));
        boardGroup.position.z = -BOARD_CENTER_Y * Math.sin(angle) - Math.sin(rawP * Math.PI) * 2.5;
        boardGroup.rotation.z = Math.sin(rawP * Math.PI) * 0.21;

        if (rawP < 1) {
            requestAnimationFrame(stepBoardFlip);
            return;
        }

        // Reset 3D group transform and commit the 180° inverted board topology & tokens
        boardGroup.rotation.set(0, 0, 0);
        boardGroup.position.set(0, 0, 0);

        // 1. Invert procedural board topology mask vertically (Row r <-> Row ROWS - 1 - r)
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

        // 2. Invert Enchanted Slot rings vertically so they stay locked to their physical slots
        const invertedEnchants = Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
                const srcR = ROWS - 1 - r;
                if (!invertedMask[r][c]) return ENCHANT_TYPES.NONE;
                return (state.enchantGrid[srcR] && state.enchantGrid[srcR][c]) || ENCHANT_TYPES.NONE;
            })
        );
        state.enchantGrid = invertedEnchants;

        // 3. Invert each column's token stack and record each token's post-flip ceiling row so it visibly falls!
        const nextBoard = Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => (invertedMask[r][c] ? EMPTY : VOID_CELL))
        );
        const dropStartRowsByCol = Array.from({ length: COLS }, () => []);

        for (let c = 0; c < COLS; c++) {
            const playableDestRows = [];
            for (let r = 0; r < ROWS; r++) {
                if (invertedMask[r][c]) playableDestRows.push(r);
            }

            // Reading old column top-to-bottom (oldR = ROWS - 1 down to 0) gives the new bottom-to-top stack order
            const fallingTokens = [];
            for (let oldR = ROWS - 1; oldR >= 0; oldR--) {
                const cell = state.board[oldR][c];
                if (cell !== EMPTY && cell !== VOID_CELL) {
                    const invertedR = ROWS - 1 - oldR;
                    fallingTokens.push({ type: cell, startRow: invertedR });
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

        // 4. Rebuild 3D carved wood beams & obsidian bedrock pedestals for the inverted procedural topology
        rebuild3DBoardGeometry(state.boardMask);
        rebuildEnchantmentRings();
        rebuildBoardMeshes();

        // 5. Position each token mesh at its inverted ceiling position so the animation loop drops it into place
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
        showToast("🔄 Abyssal Upheaval flipped the board 180° & inverted all columns!", "🔄");

        setTimeout(() => {
            // Trigger any Enchanted Slots that newly settled tokens landed on
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = state.board[r][c];
                    if ((cell === PLAYER || cell === AI) && state.enchantGrid[r][c] !== ENCHANT_TYPES.NONE) {
                        triggerSlotEnchantment(r, c, cell);
                    }
                }
            }

            // Active-player priority win check
            const winState = aiEngine.checkWinState(state.board, PLAYER);
            if (winState) {
                if (winState.winner === PLAYER) {
                    handleFloorVictory(winState.line);
                    return;
                } else {
                    handleFloorDefeat(winState.line);
                    return;
                }
            }

            state.busy = false;
            updateHUD();
            updateTelemetryBadges();
            setStatusBanner(true, "Board Inverted! Your Turn • Drag across columns to aim");
        }, 420);
    }

    requestAnimationFrame(stepBoardFlip);
}

function castCardOnColumn(handIdx, col) {
    const cardId = state.hand[handIdx];
    const card = CARD_CATALOG[cardId];
    const effCost = getEffectiveCardCost(cardId);
    if (!card || state.mana < effCost) return;

    // Highlight Surrealist Dalí Clock Gambit if it discounted this spell!
    if (hasGambit('dali_clock') && (cardId === 'inversion' || cardId === 'transmute' || cardId === 'abyssal_upheaval')) {
        sfx.playDaliClockTick();
        pulseGambitBadgeInHUD('dali_clock');
        spawnFloatingPop("🕰️ Dalí Clock: -1 Mana Discount!", "text-teal-300", 4200);
    }

    if (cardId === 'abyssal_upheaval') {
        triggerAbyssalBoardFlip(handIdx, effCost);
        return;
    }

    if (cardId === 'sinkhole_chute') {
        triggerSinkholeTrapdoor(handIdx, effCost);
        return;
    }

    if (cardId === 'pebble') {
        const baseR = Math.max(0, aiEngine.getBottomOccupiedRow(state.board, col));
        state.stability += 1;
        state.gold += 1;
        sfx.playPebbleTamp();
        triggerHaptic(20);
        spawn3DShockwaveRing(baseR, col, 0xfacc15, 2.2, 440);
        spawn3DParticleBurst(baseR, col, 0xd97706, 14, 0.11, 460, 'box');
        spawnFloatingPop("🪨 Pebble +$1 & +1 Stab!", "text-amber-300");
        showToast(`Cavern Pebble reinforced Col ${col + 1} (+1 Stability & +$1)!`, "🪨");
    }
    else if (cardId === 'oracle_peek') {
        state.stability += 1;
        sfx.playOracleLantern();
        triggerHaptic([15, 25, 30]);
        // Golden lantern light wave across all 7 columns!
        for (let cc = 0; cc < COLS; cc++) {
            setTimeout(() => {
                spawn3DShockwaveRing(Math.min(ROWS - 1, 3), cc, 0xfde047, 1.85, 420);
            }, cc * 35);
        }
        spawn3DColumnBeam(col, 0xfef08a, 0.36, 480, false);
        state.mana -= effCost;
        consumeHandCardCopy(handIdx);
        drawCards(1);
        clearActionSelection();
        updateColumnPreviewVisual(-1);
        showToast("🏮 Oracle's Lantern illuminated the cavern, drew 1 card & restored +1 Stability!", "🏮");
        updateHUD();
        updateTelemetryBadges();
        return;
    }
    else if (cardId === 'echo_drop') {
        const r1 = aiEngine.getAvailableRow(state.board, col);
        if (r1 === -1) {
            showToast("Column is full!", "⚠️");
            return;
        }
        sfx.playEchoTwinDrop();
        triggerHaptic([25, 35, 45]);
        spawn3DColumnBeam(col, 0xf59e0b, 0.38, 480, true);
        spawnTokenMesh(r1, col, PLAYER);
        spawn3DShockwaveRing(r1, col, 0xfbbf24, 2.1, 440);
        triggerSlotEnchantment(r1, col, PLAYER);
        const r2 = aiEngine.getAvailableRow(state.board, col);
        if (r2 !== -1) {
            spawnTokenMesh(r2, col, PLAYER);
            if (state.meshes[r2] && state.meshes[r2][col]) {
                state.meshes[r2][col].position.y += CELL_SPACING * 0.85;
            }
            spawn3DShockwaveRing(r2, col, 0xfde047, 2.4, 500);
            triggerSlotEnchantment(r2, col, PLAYER);
        }
        showToast(`♊ Echo Drop stacked 2 tokens in Col ${col + 1}!`, "♊");
    }
    else if (cardId === 'tremor') {
        const botR = aiEngine.getBottomOccupiedRow(state.board, col);
        if (botR === -1) {
            showToast("Column is empty!", "⚠️");
            return;
        }
        sfx.playTremorQuake();
        triggerHaptic([40, 25, 60]);
        triggerBoardShake(0.26);
        spawn3DShockwaveRing(botR, col, 0xf97316, 2.6, 480);
        spawn3DParticleBurst(botR, col, 0xa8a29e, 18, 0.14, 520, 'box');
        state.board[botR][col] = EMPTY;
        applyColumnGravity(col);
        rebuildBoardMeshes([col]);
        onTokenShattered(1);
        showToast(`⛰️ Subterranean Tremor shattered the base of Col ${col + 1}!`, "⛰️");
    }
    else if (cardId === 'petrified') {
        const r = aiEngine.getAvailableRow(state.board, col);
        if (r === -1) {
            showToast("Column is full!", "⚠️");
            return;
        }
        sfx.playPetrifiedSeal();
        triggerHaptic(30);
        spawnTokenMesh(r, col, STONE);
        spawn3DShockwaveRing(r, col, 0xa8a29e, 2.1, 440);
        spawn3DParticleBurst(r, col, 0x78716c, 12, 0.10, 440, 'box');
        showToast(`🪵 Petrified Wood Blocker sealed slot in Col ${col + 1}!`, "🪵");
    }
    else if (cardId === 'pickaxe') {
        const stoneRows = [];
        for (let rr = 0; rr < ROWS; rr++) {
            if (state.board[rr][col] === STONE) {
                stoneRows.push(rr);
            }
        }
        if (stoneRows.length === 0) {
            showToast(`No Petrified Stone tokens in Col ${col + 1} to mine!`, "⛏️");
            return;
        }

        state.busy = true;
        state.mana -= effCost;
        consumeHandCardCopy(handIdx);
        clearActionSelection();
        updateColumnPreviewVisual(-1);
        updateHUD();

        sfx.playPickaxeStrike(stoneRows.length);
        triggerHaptic([30, 20, 55]);

        playPickaxeSwingVFX(col, stoneRows, () => {
            stoneRows.forEach((sr) => {
                state.board[sr][col] = EMPTY;
            });
            applyColumnGravity(col);
            rebuildBoardMeshes([col]);
            onTokenShattered(stoneRows.length);

            // Check if compacted tokens landed on an Enchanted Slot in this column
            for (let rr = 0; rr < ROWS; rr++) {
                const cell = state.board[rr][col];
                if ((cell === PLAYER || cell === AI) && state.enchantGrid[rr][col] !== ENCHANT_TYPES.NONE) {
                    triggerSlotEnchantment(rr, col, cell);
                }
            }

            showToast(
                `⛏️ Spelunker's Pickaxe shattered ${stoneRows.length} Petrified Stone(s) in Col ${col + 1}!`,
                "⛏️"
            );

            const winState = aiEngine.checkWinState(state.board, PLAYER);
            if (winState) {
                if (winState.winner === PLAYER) {
                    handleFloorVictory(winState.line);
                    return;
                } else {
                    handleFloorDefeat(winState.line);
                    return;
                }
            }

            state.busy = false;
            updateHUD();
            updateTelemetryBadges();
        });
        return;
    }
    else if (cardId === 'stalactite') {
        const topR = aiEngine.getTopOccupiedRow(state.board, col);
        if (topR === -1) {
            showToast("Column is empty!", "⚠️");
            return;
        }
        sfx.playStalactiteSpear();
        triggerHaptic([30, 20, 65]);
        state.mana -= effCost;
        consumeHandCardCopy(handIdx);
        clearActionSelection();
        updateColumnPreviewVisual(-1);

        // Animate 3D Stalactite Spear plunging from cavern ceiling into (topR, col)!
        playStalactiteStrikeVFX(topR, col, () => {
            state.board[topR][col] = EMPTY;
            rebuildBoardMeshes();
            onTokenShattered(1);
            showToast(`🗡️ Stalactite Strike impaled & shattered top of Col ${col + 1}!`, "🗡️");
            const winLine = aiEngine.findWinningLine(state.board, PLAYER);
            if (winLine) {
                handleFloorVictory(winLine);
                return;
            }
            updateHUD();
            updateTelemetryBadges();
        });
        return;
    }
    else if (cardId === 'inversion') {
        const occupiedRows = [];
        const stack = [];
        for (let r = 0; r < ROWS; r++) {
            if (state.board[r][col] !== EMPTY && state.board[r][col] !== VOID_CELL) {
                occupiedRows.push(r);
                stack.push(state.board[r][col]);
            }
        }
        if (stack.length < 2) {
            showToast("Need at least 2 tokens to invert!", "⚠️");
            return;
        }
        sfx.playGravityVortex();
        triggerHaptic([25, 30, 45]);
        state.mana -= effCost;
        consumeHandCardCopy(handIdx);
        clearActionSelection();
        updateColumnPreviewVisual(-1);

        // Animate 3D Vortex Flip on the target column before committing the inverted stack!
        playColumnInversionVFX(col, () => {
            stack.reverse();
            for (let i = 0; i < occupiedRows.length; i++) {
                state.board[occupiedRows[i]][col] = stack[i];
            }
            rebuildBoardMeshes([col]);
            showToast(`🌀 Gravity Inversion flipped Col ${col + 1} upside down!`, "🌀");
            const winLine = aiEngine.findWinningLine(state.board, PLAYER);
            if (winLine) {
                handleFloorVictory(winLine);
                return;
            }
            updateHUD();
            updateTelemetryBadges();
        });
        return;
    }
    else if (cardId === 'transmute') {
        const topR = aiEngine.getTopOccupiedRow(state.board, col);
        if (topR === -1 || state.board[topR][col] === PLAYER) {
            showToast("Pick a column topped by an AI or Stone token!", "⚠️");
            return;
        }
        sfx.playSurrealTransmute();
        triggerHaptic([20, 35, 30]);
        state.board[topR][col] = PLAYER;
        state.lastPlayedCell = [topR, col];
        rebuildBoardMeshes();
        spawn3DShockwaveRing(topR, col, 0xe879f9, 2.6, 500);
        spawn3DShockwaveRing(topR, col, 0xfbbf24, 1.9, 420);
        spawn3DParticleBurst(topR, col, 0xfde047, 18, 0.13, 520, 'octa');
        showToast(`✨ Surrealist Transmute warped top of Col ${col + 1} into your Amber token!`, "✨");
    }
    else if (cardId === 'hibachi') {
        const topR = aiEngine.getTopOccupiedRow(state.board, col);
        state.stability += 2;
        sfx.playHibachiSizzle();
        triggerHaptic([35, 25, 50]);
        spawn3DColumnBeam(col, 0xf97316, 0.42, 480, true);
        if (topR !== -1 && state.board[topR][col] === AI) {
            triggerBoardShake(0.22);
            spawn3DShockwaveRing(topR, col, 0xef4444, 2.5, 480);
            spawn3DParticleBurst(topR, col, 0xf97316, 20, 0.14, 520, 'cone');
            state.board[topR][col] = EMPTY;
            rebuildBoardMeshes();
            onTokenShattered(1);
            showToast(`🍜 Hibachi Flare seared AI token in Col ${col + 1} & restored +2 Stability!`, "🔥");
        } else {
            const effectR = topR !== -1 ? topR : 2;
            spawn3DParticleBurst(effectR, col, 0xfbbf24, 14, 0.11, 460, 'cone');
            showToast(`🍜 Hibachi Flare warmed the cavern for +2 Seismic Stability!`, "🍜");
        }
    }
    else if (cardId === 'jar_of_flies') {
        const aiTargets = [];
        for (let rr = 0; rr < ROWS; rr++) {
            for (let cc = 0; cc < COLS; cc++) {
                if (state.board[rr][cc] === AI) aiTargets.push([rr, cc]);
            }
        }
        const goodRoll = Math.random() < 0.50;
        sfx.playFlyBuzz(goodRoll);
        triggerHaptic([15, 15, 20, 15, 35]);

        if (goodRoll && aiTargets.length > 0) {
            const [tr, tc] = aiTargets[Math.floor(Math.random() * aiTargets.length)];
            playCaveFliesSwarmVFX(tr, tc, true);
            spawn3DParticleBurst(tr, tc, 0xa3e635, 16, 0.12, 480, 'octa');
            state.board[tr][tc] = EMPTY;
            applyColumnGravity(tc);
            rebuildBoardMeshes([tc]);
            state.gold += 2;
            onTokenShattered(1);
            spawnFloatingPop("🪰 Good Flies! Ate AI Token & +$2 Gold!", "text-amber-300", 5000);
            showToast(`🪰 BZZT! The Cave Flies devoured an AI token in Col ${tc + 1} and coughed up +$2 Gold!`, "🪰");
        } else if (goodRoll && aiTargets.length === 0) {
            playCaveFliesSwarmVFX(2, col, true);
            state.gold += 2;
            sfx.playCoinDing();
            spawnFloatingPop("🪰 No AI Tokens—Flies found +$2 Gold!", "text-amber-300", 4800);
            showToast("🪰 No AI tokens to eat, so the Cave Flies scavenged +$2 Gold for you!", "🪙");
        } else {
            const availR = aiEngine.getAvailableRow(state.board, col);
            playCaveFliesSwarmVFX(availR !== -1 ? availR : ROWS - 1, col, false);
            if (availR !== -1) {
                spawnTokenMesh(availR, col, STONE);
                spawn3DParticleBurst(availR, col, 0x78716c, 14, 0.11, 460, 'box');
                spawnFloatingPop("🪰 Bad Flies! Dropped Petrified Poop!", "text-stone-400", 5000);
                showToast(`🪰 BACKFIRE! The confused Cave Flies dropped a Petrified Stone into Col ${col + 1}!`, "🪨");
            } else {
                showToast("🪰 The Cave Flies buzzed around Col " + (col + 1) + " harmlessly (Column full)!", "🪰");
            }
        }
    }
    else if (cardId === 'brimstone_beam') {
        let vaporized = 0;
        for (let rr = 0; rr < ROWS; rr++) {
            if (state.board[rr][col] === AI || state.board[rr][col] === STONE) {
                spawn3DParticleBurst(rr, col, 0xef4444, 14, 0.14, 520, 'octa');
                spawn3DShockwaveRing(rr, col, 0xf43f5e, 2.3, 460);
                state.board[rr][col] = EMPTY;
                vaporized++;
            }
        }
        if (vaporized === 0) {
            showToast("Pick a column containing at least 1 AI or Petrified Stone token to vaporize!", "⚠️");
            return;
        }
        sfx.playBrimstoneLaser();
        triggerHaptic([60, 30, 90, 30, 70]);
        triggerBoardShake(0.36);
        spawn3DColumnBeam(col, 0xdc2626, 0.56, 640, true);
        applyColumnGravity(col);
        rebuildBoardMeshes([col]);
        onTokenShattered(vaporized);
        spawnFloatingPop(`🩸 BRIMSTONE! Vaporized ${vaporized} Piece(s)!`, "text-rose-400", 5200);
        showToast(`🩸 Sulfuric Brimstone Laser obliterated ${vaporized} AI/Stone token(s) in Col ${col + 1}!`, "🩸");
    }
    else if (cardId === 'dead_weight') {
        sfx.playCurseBanish();
        triggerHaptic([25, 20, 35]);
        const effR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
        spawn3DShockwaveRing(effR, col, 0xa855f7, 2.4, 480);
        spawn3DParticleBurst(effR, col, 0xe2e8f0, 16, 0.12, 480, 'octa');
        state.mana -= effCost;
        consumeHandCardCopy(handIdx);
        clearActionSelection();
        updateColumnPreviewVisual(-1);
        showToast("🪨 Dead Weight Stone pulverized & permanently banished from your deck!", "✨");
        updateHUD();
        updateTelemetryBadges();
        return;
    }

    state.mana -= effCost;
    consumeHandCardCopy(handIdx);
    clearActionSelection();
    updateColumnPreviewVisual(-1);

    const winLine = aiEngine.findWinningLine(state.board, PLAYER);
    if (winLine) {
        handleFloorVictory(winLine);
        return;
    }
    updateHUD();
    updateTelemetryBadges();
}

// ============================================================================
// 9. AI TURN, TELEGRAPHED BOSS RULES & STALACTITE COLLAPSE
// ============================================================================
function triggerAITurn() {
    state.turn = AI;
    state.busy = true;
    clearActionSelection();
    updateColumnPreviewVisual(-1);
    setStatusBanner(false, "Opponent AI is calculating minimax response...");

    setTimeout(() => {
        if (state.gameOver) return;

        // Active-Player Priority Guard: If Player already formed a 4-in-a-row during their turn, resolve Player Victory immediately
        const prePlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
        if (prePlayerWin) {
            handleFloorVictory(prePlayerWin);
            return;
        }

        const floorData = getFloorConfig(state.floorIdx);
        const decision = aiEngine.analyzeBoard(state.board, floorData.depth, state.enchantGrid, true, floorData.isBoss);
        let col = decision.bestCol;

        if (col === -1) {
            for (let c = 0; c < COLS; c++) {
                if (aiEngine.getAvailableRow(state.board, c) !== -1) { col = c; break; }
            }
        }

        if (col !== -1) {
            const r = aiEngine.getAvailableRow(state.board, col);
            sfx.playWoodClack(false);
            spawnTokenMesh(r, col, AI);
            triggerSlotEnchantment(r, col, AI);
        }

        // Execute Telegraphed Boss Passive Modifiers ONLY on Boss Floors (Every 3rd Floor)
        if (floorData.isBoss && floorData.bossArchetype) {
            executeRandomizedBossAbility(floorData.bossArchetype);
        }

        // If a Boss ability (such as Magma Leviathan shifting a stack or Chronos inverting) aligned 4 for the Player, award Player win!
        const bossShiftPlayerWin = aiEngine.findWinningLine(state.board, PLAYER);
        if (bossShiftPlayerWin) {
            handleFloorVictory(bossShiftPlayerWin);
            return;
        }

        // Check if AI achieved Connect 4
        const aiWin = aiEngine.findWinningLine(state.board, AI);
        if (aiWin) {
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
                showToast("🐈‍⬛ NINE LIVES! Obsidian Cat clawed & shattered the AI's winning 4th token!", "🐈‍⬛");
            } else {
                handleFloorDefeat(aiWin);
                return;
            }
        }

        // Decrement Seismic Stability & Check Anti-Stall Cavern Collapse
        state.stability--;
        if (state.stability <= 0) {
            const validCols = [];
            for (let c = 0; c < COLS; c++) {
                if (aiEngine.getAvailableRow(state.board, c) !== -1) validCols.push(c);
            }
            if (validCols.length > 0) {
                const collapseCol = validCols[Math.floor(Math.random() * validCols.length)];
                const cr = aiEngine.getAvailableRow(state.board, collapseCol);
                spawnTokenMesh(cr, collapseCol, STONE);
                showToast(`🌋 Cavern Collapse dropped Stone in Col ${collapseCol + 1}!`, "🪨");
            }
        }

        if (aiEngine.isBoardFull(state.board)) {
            handleDraw();
            return;
        }

        // Advance to Player Turn: Scale Mana Recovery & Deck Drawing Rates by Difficulty Tier
        state.turn = PLAYER;
        state.turnNumber++;
        state.busy = false;

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

        updateHUD();
        updateTelemetryBadges();
        setStatusBanner(true, "Your Turn • Drag across columns to aim");
    }, 460);
}

function executeRandomizedBossAbility(arch) {
    const interval = getEffectiveBossInterval(arch);
    if (state.turnNumber % interval !== 0) return;
    sfx.playBossAlarm();

    if (arch.id === 'petrifier_archon') {
        // Turns highest Player token in the most-populated column into Petrified Stone
        let bestCol = -1, maxCount = 0, targetRow = -1;
        for (let c = 0; c < COLS; c++) {
            let count = 0, topPlayerR = -1;
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
        if (bestCol !== -1 && targetRow !== -1) {
            state.board[targetRow][bestCol] = STONE;
            rebuildBoardMeshes();
            showToast(`🗿 Petrifier Archon turned your Col ${bestCol + 1} token into Stone!`, "🗿");
        }
    }
    else if (arch.id === 'chronos_dali') {
        // Flips the marked column upside down, then picks a new populated column to mark
        const mc = state.bossMarkedCol;
        const occupiedRows = [];
        const stack = [];
        for (let r = 0; r < ROWS; r++) {
            if (state.board[r][mc] !== EMPTY && state.board[r][mc] !== VOID_CELL) {
                occupiedRows.push(r);
                stack.push(state.board[r][mc]);
            }
        }
        if (stack.length >= 2) {
            stack.reverse();
            for (let i = 0; i < occupiedRows.length; i++) {
                state.board[occupiedRows[i]][mc] = stack[i];
            }
            rebuildBoardMeshes();
            showToast(`🕰️ Chronos Dalí Warden inverted Col ${mc + 1}!`, "🌀");
        }
        // Pick next marked column (prefer columns with tokens)
        const popCols = [];
        for (let c = 0; c < COLS; c++) {
            if (aiEngine.getBottomOccupiedRow(state.board, c) !== -1) popCols.push(c);
        }
        state.bossMarkedCol = popCols.length > 0
            ? popCols[Math.floor(Math.random() * popCols.length)]
            : Math.floor(Math.random() * COLS);
    }
    else if (arch.id === 'magma_leviathan') {
        // Scorches the lowest occupied slot of a populated column, shifting all tokens above it down
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
        if (pool.length > 0) {
            const tc = pool[Math.floor(Math.random() * pool.length)];
            const botR = aiEngine.getBottomOccupiedRow(state.board, tc);
            if (botR !== -1) {
                state.board[botR][tc] = EMPTY;
                applyColumnGravity(tc);
                onTokenShattered(1);
                rebuildBoardMeshes([tc]);
                showToast(`🌋 Magma Leviathan melted the base of Col ${tc + 1} & shifted the stack down!`, "🔥");
            }
        }
    }
    else if (arch.id === 'spore_queen') {
        // Infects 2 empty board cells with Cursed Spore Webs
        const emptyCoords = [];
        for (let r = 0; r < ROWS - 1; r++) {
            for (let c = 0; c < COLS; c++) {
                if (state.board[r][c] === EMPTY && state.enchantGrid[r][c] === ENCHANT_TYPES.NONE) {
                    emptyCoords.push([r, c]);
                }
            }
        }
        const picked = shuffle(emptyCoords).slice(0, 2);
        picked.forEach(([r, c]) => {
            state.enchantGrid[r][c] = ENCHANT_TYPES.CURSED_SPORE;
        });
        if (picked.length > 0) {
            rebuildEnchantmentRings();
            showToast(`🍄 Spore Queen infected ${picked.length} slots with Cursed Spores!`, "🍄");
        }
    }
    else if (arch.id === 'mirror_virtuoso') {
        // Swaps colors of a top Player token and a top AI token
        const playerTops = [], aiTops = [];
        for (let c = 0; c < COLS; c++) {
            const topR = aiEngine.getTopOccupiedRow(state.board, c);
            if (topR !== -1) {
                if (state.board[topR][c] === PLAYER) playerTops.push([topR, c]);
                else if (state.board[topR][c] === AI) aiTops.push([topR, c]);
            }
        }
        if (playerTops.length > 0 && aiTops.length > 0) {
            const [pr, pc] = playerTops[Math.floor(Math.random() * playerTops.length)];
            const [ar, ac] = aiTops[Math.floor(Math.random() * aiTops.length)];
            state.board[pr][pc] = AI;
            state.board[ar][ac] = PLAYER;
            rebuildBoardMeshes();
            showToast(`🎭 Mirror Virtuoso swapped top tokens in Col ${pc + 1} & Col ${ac + 1}!`, "🎭");
        }
    }
    else if (arch.id === 'tectonic_behemoth') {
        // Drains -1 extra Stability and drops a Petrified Stone blocker
        state.stability = Math.max(0, state.stability - 1);
        const openCols = [];
        for (let c = 0; c < COLS; c++) {
            if (aiEngine.getAvailableRow(state.board, c) !== -1) openCols.push(c);
        }
        if (openCols.length > 0) {
            const sc = openCols[Math.floor(Math.random() * openCols.length)];
            const sr = aiEngine.getAvailableRow(state.board, sc);
            spawnTokenMesh(sr, sc, STONE);
            showToast(`🦖 Tectonic Behemoth quaked -1 Stability & dropped Stone in Col ${sc + 1}!`, "🦖");
        }
    }
}

// ============================================================================
// 10. FLOOR VICTORY, DEFEAT, BOSS CHEST MILESTONES & ROULETTE HELPERS
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

    // MULTI-HP BOSS HEALTH SYSTEM: Deplete 1 Boss HP, turn the winning piece into neutral STONE, and continue play on the same board!
    if (floorData.isBoss && state.bossHp > 1) {
        const shouldAdvanceToAI = !!state.lastActionWasDrop;
        state.lastActionWasDrop = false;

        state.bossHp -= 1;
        state.gold += 2; // +$2 Phase Break bounty
        sfx.playBossPhaseShatter();
        triggerHaptic([50, 35, 80, 35, 60]);
        triggerBoardShake(0.34);

        // Spawn 3D shatter bursts along the winning 4-in-a-row line
        winLine.forEach(([r, c]) => {
            spawn3DShockwaveRing(r, c, 0xf43f5e, 2.5, 520);
            spawn3DParticleBurst(r, c, 0xfacc15, 16, 0.14, 540, 'octa');
        });

        // Identify the winning token the player just played (or fallback to the highest token in winLine)
        let targetCell = null;
        if (state.lastPlayedCell) {
            const [lr, lc] = state.lastPlayedCell;
            targetCell = winLine.find(([r, c]) => r === lr && c === lc);
        }
        if (!targetCell) {
            targetCell = winLine.reduce((best, cur) => (cur[0] >= best[0] ? cur : best), winLine[0]);
        }
        const [stoneR, stoneC] = targetCell;

        // Pulse #boss-hp-strip in HUD
        const hpStrip = document.getElementById('boss-hp-strip');
        if (hpStrip) {
            hpStrip.classList.add('ring-2', 'ring-amber-300', 'scale-110');
            setTimeout(() => hpStrip.classList.remove('ring-2', 'ring-amber-300', 'scale-110'), 700);
        }

        updateHUD();
        const remHp = state.bossHp;
        spawnFloatingPop(`💔 -1 Boss HP! (${remHp}/${state.bossMaxHp} ❤️ Left) +$2`, 'text-rose-300', 4800);
        showToast(
            `💥 Depleted 1 Boss HP (${remHp}/${state.bossMaxHp} ❤️ Left)! Your winning piece in Col ${stoneC + 1} turned into Petrified Stone — Battle Continues!`,
            '🪨',
            5000,
            'border-rose-400/80 text-rose-100'
        );
        setStatusBanner(true, `💥 Boss HP Depleted (${remHp}/${state.bossMaxHp} ❤️ Left)! Winning piece calcified to Stone...`);

        setTimeout(() => {
            // Convert the winning piece into neutral Petrified Stone (and break any simultaneous 2nd 4-in-a-row line if present)
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

            // Check if the board is now completely full
            if (aiEngine.isBoardFull(state.board)) {
                handleDraw();
                return;
            }

            // If the Connect-4 came from a standard/reserve token drop, hand turn to the Boss AI;
            // if it came from a mid-turn Card cast (or Boss ability shift), keep the Player's turn active!
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

    // Final HP depleted (or standard Sentinel defeated) -> Floor Cleared!
    if (floorData.isBoss) {
        state.bossHp = 0;
    }
    state.gameOver = true;
    sfx.playResultChime(true);
    triggerHaptic([40, 30, 70]);

    const baseReward = floorData.isBoss ? 7 : 3;
    const speedBonus = Math.max(0, state.stability);
    const totalEarned = baseReward + speedBonus;
    state.gold += totalEarned;
    state.pendingVictoryPayout = { totalEarned, speedBonus };
    updateHUD();

    setStatusBanner(true, `🎉 Floor ${floorData.floor} Cleared! Earned +$${totalEarned} Gold!`);

    setTimeout(() => {
        // Final Floor 9 Victory
        if (state.floorIdx >= TOTAL_FLOORS - 1) {
            showGameOverModal(
                true,
                'Subterranean Ascension Mastered!',
                `You conquered all ${TOTAL_FLOORS} cavern floors, vanquished all 3 multi-phase Bosses across warped procedural topologies, and amassed $${state.gold} Gold!`
            );
            return;
        }

        // Boss Floors (Floor 3 & Floor 6) award a Milestone Power Spike & Boss Relic Chest
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
    state.gameOver = true;
    state.busy = true;
    sfx.playCurseBuzzer();
    setStatusBanner(false, "⚖️ Cavern Grid Stalemate — Board Full!");
    setTimeout(() => {
        showGameOverModal(
            false,
            'Subterranean Stalemate',
            'Every playable slot on this cavern topology has been filled without a Connect 4. Retry the floor to break the deadlock!'
        );
    }, 850);
}
