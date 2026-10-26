// ============================================================================
// HUD RENDERING, AI TELEMETRY BADGES & ACTION INSPECTOR (js/ui/hud.js)
// ============================================================================

// Initialize 3D-projected Column Telemetry & Boss Warning DOM Badges
const telemetryLayer = document.getElementById('telemetry-layer');
const colBadges = [];
for (let c = 0; c < COLS; c++) {
    const badge = document.createElement('div');
    badge.className = 'telemetry-tag flex flex-col items-center';
    badge.innerHTML = `
        <div id="col-warn-${c}" class="hidden text-[10px] font-mono-code font-bold text-rose-300 bg-rose-950/90 border border-rose-400/50 px-1 rounded mb-0.5 animate-bounce">⚠️FLIP</div>
        <span id="col-score-${c}" class="px-1.5 py-0.5 rounded-md text-[9px] font-mono-code font-bold bg-stone-950/90 text-slate-300 border border-white/15">0</span>
        <span id="col-num-${c}" class="text-[10px] font-mono-code font-bold text-amber-400/75 mt-0.5">${c + 1}</span>
    `;
    telemetryLayer.appendChild(badge);
    colBadges.push(badge);
}

// ============================================================================
// 7. TELEMETRY & HUD UPDATES
// ============================================================================
function getEffectiveCardCost(cardId) {
    const base = CARD_CATALOG[cardId].cost;
    if (hasGambit('dali_clock') && (cardId === 'inversion' || cardId === 'transmute' || cardId === 'abyssal_upheaval')) {
        return Math.max(0, base - 1);
    }
    return base;
}

function updateTelemetryBadges() {
    const floorData = getFloorConfig(state.floorIdx);
    const analysis = aiEngine.analyzeBoard(state.board, floorData.depth, state.enchantGrid);

    const evalBadge = document.getElementById('eval-summary-badge');
    const norm = Math.max(-99, Math.min(99, Math.round(analysis.bestScore / 15)));
    if (analysis.bestScore > 50000) {
        evalBadge.textContent = "AI WIN";
        evalBadge.className = "text-[8px] font-mono-code text-rose-400 font-bold leading-none mt-0.5";
    } else if (analysis.bestScore < -50000) {
        evalBadge.textContent = "WIN!";
        evalBadge.className = "text-[8px] font-mono-code text-amber-300 font-bold leading-none mt-0.5";
    } else {
        const sign = norm > 0 ? '+' : '';
        evalBadge.textContent = `${sign}${norm}`;
        evalBadge.className = "text-[8px] font-mono-code text-teal-300 leading-none mt-0.5";
    }

    const showScores = state.showTelemetry || hasGambit('dali_clock');
    const isChronosBoss = floorData.isBoss && floorData.bossArchetype && floorData.bossArchetype.id === 'chronos_dali';

    for (let c = 0; c < COLS; c++) {
        const scoreEl = document.getElementById(`col-score-${c}`);
        const warnEl = document.getElementById(`col-warn-${c}`);

        // Show Boss Warning icon if Chronos Dalí Warden is targeting this column
        if (isChronosBoss && c === state.bossMarkedCol) {
            warnEl.classList.remove('hidden');
        } else {
            warnEl.classList.add('hidden');
        }

        const s = analysis.colScores[c];
        if (!showScores) {
            scoreEl.style.display = 'none';
            continue;
        }
        scoreEl.style.display = 'inline-block';

        if (s === null) {
            scoreEl.textContent = 'FULL';
            scoreEl.className = 'px-1.5 py-0.5 rounded-md text-[9px] font-mono-code bg-stone-900/80 text-stone-500 border border-white/5';
        } else if (s > 50000) {
            scoreEl.textContent = 'WIN';
            scoreEl.className = 'px-1.5 py-0.5 rounded-md text-[9px] font-mono-code font-bold bg-rose-950/90 text-rose-300 border border-rose-500/50';
        } else if (s < -50000) {
            scoreEl.textContent = 'RISK';
            scoreEl.className = 'px-1.5 py-0.5 rounded-md text-[9px] font-mono-code font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50';
        } else {
            const val = Math.round(s / 15);
            const sign = val > 0 ? '+' : '';
            const isBest = c === analysis.bestCol;
            scoreEl.textContent = `${sign}${val}`;
            scoreEl.className = isBest
                ? 'px-1.5 py-0.5 rounded-md text-[9px] font-mono-code font-bold bg-teal-950/95 text-teal-300 border border-teal-400'
                : 'px-1.5 py-0.5 rounded-md text-[9px] font-mono-code font-bold bg-stone-950/90 text-slate-300 border border-white/15';
        }
    }
}

function updateHUD() {
    const floorData = getFloorConfig(state.floorIdx);
    const floorBadge = document.getElementById('floor-num-badge');
    floorBadge.textContent = floorData.isBoss ? `💀${floorData.floor}` : (floorData.isPreBoss ? `⚔️${floorData.floor}` : `F${floorData.floor}`);
    document.getElementById('boss-name-label').textContent = floorData.boss;

    // Render Multi-Phase Boss Health Markers (2 HP on Boss 1; 3 HP on Boss 2 & Boss 3)
    const hpStrip = document.getElementById('boss-hp-strip');
    if (hpStrip) {
        if (floorData.isBoss) {
            hpStrip.classList.remove('hidden');
            hpStrip.classList.add('inline-flex');
            let heartsHtml = '';
            for (let h = 0; h < state.bossMaxHp; h++) {
                const isAlive = h < state.bossHp;
                heartsHtml += `<span class="text-[10px] leading-none transition-transform duration-300 ${
                    isAlive ? 'scale-100 drop-shadow-[0_0_4px_#f43f5e]' : 'opacity-40 scale-90 grayscale'
                }">${isAlive ? '❤️' : '🖤'}</span>`;
            }
            heartsHtml += `<span class="text-[9px] font-mono-code font-bold text-rose-200 ml-0.5">${state.bossHp}/${state.bossMaxHp}</span>`;
            hpStrip.innerHTML = heartsHtml;
        } else {
            hpStrip.classList.add('hidden');
            hpStrip.classList.remove('inline-flex');
        }
    }

    const topoEl = document.getElementById('topology-badge');
    if (topoEl && state.currentTopology) {
        topoEl.textContent = `${state.currentTopology.icon} ${state.currentTopology.name}`;
        topoEl.className = state.currentTopology.isProcedural
            ? "text-[9px] font-mono-code text-amber-300 font-semibold truncate"
            : "text-[9px] font-mono-code text-slate-400 truncate";
    }

    // Telegraphed Boss Countdown ONLY on Boss Floors (Every 3rd Floor)
    const teleEl = document.getElementById('boss-telegraph-badge');
    if (!floorData.isBoss) {
        teleEl.textContent = floorData.isPreBoss
            ? `Pre-Boss Vanguard (D${floorData.depth}) • Warped Grid`
            : `Sentinel (Depth ${floorData.depth}) • Classic 7x6 Grid`;
        teleEl.className = floorData.isPreBoss
            ? "text-[10px] font-mono-code text-amber-300 truncate"
            : "text-[10px] font-mono-code text-teal-300 truncate";
    } else {
        const arch = floorData.bossArchetype;
        const interval = getEffectiveBossInterval(arch);
        const rem = interval - ((state.turnNumber - 1) % interval);
        if (arch.id === 'chronos_dali') {
            teleEl.textContent = `⚡ Inverts Col ${state.bossMarkedCol + 1} in ${rem}T`;
        } else {
            teleEl.textContent = `⚡ ${arch.shortTelegraph} (${rem}T)`;
        }
        teleEl.className = "text-[10px] font-mono-code text-rose-300 font-bold truncate animate-pulse";
    }

    // Render Floor Progression Map Pip Bar (Shows 2 Non-Boss Floors -> 1 Boss Floor)
    const pipBar = document.getElementById('floor-pip-bar');
    if (pipBar) {
        pipBar.innerHTML = '';
        for (let i = 0; i < TOTAL_FLOORS; i++) {
            const isBoss = isBossFloorIndex(i);
            const isCurrent = i === state.floorIdx;
            const isCleared = i < state.floorIdx;
            const pip = document.createElement('span');
            pip.className = `px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold shrink-0 transition ${
                isCurrent
                    ? (isBoss ? 'bg-rose-500 text-white shadow-[0_0_8px_#f43f5e]' : 'bg-amber-400 text-stone-950')
                    : isCleared
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : isBoss
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                            : 'bg-stone-900/70 text-slate-500 border border-white/5'
            }`;
            pip.textContent = isBoss ? `💀F${i + 1}` : `F${i + 1}`;
            pipBar.appendChild(pip);
        }
    }

    // Update Next Milestone Indicator Button
    const mileBtn = document.getElementById('milestone-info-btn');
    if (mileBtn) {
        if (state.floorIdx < 2) {
            mileBtn.textContent = "Milestone F3: +1M, +1 Hand & Pouch";
        } else if (state.floorIdx < 5) {
            mileBtn.textContent = "Milestone F6: +1M, 4 Gambits & High Cards";
        } else {
            mileBtn.textContent = "Milestone F9:Ascension Mastery";
        }
    }

    document.getElementById('gold-badge').textContent = `$${state.gold}`;
    const stabEl = document.getElementById('stability-badge');
    stabEl.textContent = state.stability;
    stabEl.className = state.stability <= 4
        ? "font-mono-code font-bold text-xs text-rose-400 animate-pulse"
        : "font-mono-code font-bold text-xs text-orange-300";

    document.getElementById('mana-current').textContent = state.mana;
    document.getElementById('mana-max').textContent = state.maxMana;
    document.getElementById('draw-count').textContent = state.drawPile.length;

    // Render Synergistic Gambits (Up to state.maxGambitSlots unlocked slots)
    const gambitStrip = document.getElementById('gambit-strip');
    gambitStrip.innerHTML = '';
    if (state.gambits.length === 0) {
        const hint = document.createElement('span');
        hint.className = 'text-[10px] font-mono-code text-slate-400 mr-1';
        hint.textContent = `Gambits (0/${state.maxGambitSlots}):`;
        gambitStrip.appendChild(hint);
    }
    state.gambits.forEach(gId => {
        const g = GAMBIT_CATALOG[gId];
        if (!g) return;
        const spentCat = (gId === 'obsidian_cat' && state.catNineLivesUsed);
        const btn = document.createElement('button');
        btn.className = `px-2 py-0.5 rounded-lg border text-xs flex items-center gap-1 shrink-0 active:scale-95 transition ${
            spentCat ? 'bg-stone-900/40 border-white/10 opacity-50' : 'bg-amber-500/15 border-amber-400/35 text-amber-200'
        }`;
        btn.innerHTML = `<span>${g.icon}</span><span class="text-[10px] font-medium">${g.name.split(' ')[0]}</span>`;
        btn.addEventListener('click', () => openGambitSheet(gId));
        gambitStrip.appendChild(btn);
    });
    // Show unlocked empty Gambit slots vs locked slots
    for (let i = state.gambits.length; i < 5; i++) {
        const isUnlocked = i < state.maxGambitSlots;
        const slot = document.createElement('div');
        slot.className = isUnlocked
            ? 'w-6 h-6 rounded-lg border border-dashed border-amber-400/30 flex items-center justify-center text-[9px] text-amber-300/60 shrink-0'
            : 'w-6 h-6 rounded-lg border border-white/5 bg-stone-950/60 flex items-center justify-center text-[9px] text-slate-700 shrink-0';
        slot.textContent = isUnlocked ? '+' : '🔒';
        slot.title = isUnlocked ? 'Unlocked Gambit Slot' : 'Locked Gambit Slot (Defeat Bosses or Upgrade in Bazaar)';
        gambitStrip.appendChild(slot);
    }

    // Render Off-Board Tactical Reserve Token Pouch (Grouped by token type with ×N counter badge)
    const pouchEl = document.getElementById('reserve-pouch-container');
    pouchEl.innerHTML = '';
    if (!state.reservePouchUnlocked && state.reservePouch.length === 0) {
        pouchEl.innerHTML = `<span class="text-[10px] font-mono-code text-slate-500 px-1">🔒 Pouch unlocks Floor 3 Boss</span>`;
    } else if (state.reservePouch.length === 0) {
        pouchEl.innerHTML = `<span class="text-[10px] font-mono-code text-slate-400 px-1">Pouch Ready (0 Tokens)</span>`;
    } else {
        const selectedType = state.selectedReserveIdx !== null ? state.reservePouch[state.selectedReserveIdx] : null;
        const groupedTokens = new Map();
        state.reservePouch.forEach((rId, idx) => {
            if (!RESERVE_CATALOG[rId]) return;
            if (!groupedTokens.has(rId)) {
                groupedTokens.set(rId, { rId, firstIdx: idx, count: 1 });
            } else {
                groupedTokens.get(rId).count += 1;
            }
        });

        groupedTokens.forEach(({ rId, firstIdx, count }) => {
            const tok = RESERVE_CATALOG[rId];
            const isSel = selectedType === rId;
            const pill = document.createElement('button');
            pill.className = `reserve-token-pill px-2 py-1 rounded-xl flex items-center gap-1 shrink-0 active:scale-95 ${
                isSel ? 'token-selected' : ''
            }`;
            const countBadgeHtml = count > 1
                ? `<span class="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-400/25 border border-amber-300/60 font-mono-code font-bold text-[9px] text-amber-200 leading-tight">×${count}</span>`
                : '';
            pill.innerHTML = `<span class="text-xs">${tok.icon}</span><span class="text-[10px] font-display font-bold text-amber-200">${tok.name.split(' ')[0]}</span>${countBadgeHtml}`;
            pill.addEventListener('click', () => {
                if (state.turn !== PLAYER || state.busy) return;
                toggleSelectReserveToken(firstIdx);
            });
            pouchEl.appendChild(pill);
        });
    }

    // Render Scrollable Arcane Card Hand (One-Time Consumables, capped by state.handSize)
    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';

    if (state.hand.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'w-full flex items-center justify-center text-[10px] font-mono-code text-slate-400 py-3 px-2 border border-dashed border-white/10 rounded-xl';
        emptyMsg.textContent = state.drawPile.length > 0
            ? `Hand Empty • ${state.drawPile.length} consumable card(s) left in floor deck (Max Hand: ${state.handSize})`
            : `All stockpiled consumable cards expended • Buy more in the Underground Bazaar!`;
        handContainer.appendChild(emptyMsg);
    } else {
        const totalTokensOnBoard = countTokensInPlay(state.board);
        state.hand.forEach((cardId, idx) => {
            const c = CARD_CATALOG[cardId];
            if (!c) return;
            const effCost = getEffectiveCardCost(cardId);
            const meetsTokenMinimum = (cardId !== 'sinkhole_chute' || totalTokensOnBoard >= 3);
            const affordable = state.mana >= effCost && meetsTokenMinimum && state.turn === PLAYER && !state.busy;
            const selected = state.selectedCardIdx === idx;

            const cardBtn = document.createElement('div');
            cardBtn.className = `arcane-card w-32 sm:w-36 p-2 rounded-xl shrink-0 cursor-pointer flex flex-col justify-between ${
                !affordable ? 'card-disabled' : ''
            } ${selected ? 'card-selected' : ''}`;

            cardBtn.innerHTML = `
                <div class="flex items-center justify-between gap-1">
                    <span class="text-base leading-none">${c.icon}</span>
                    <div class="flex items-center gap-1">
                        <span class="px-1 py-0.2 rounded text-[8px] font-mono-code uppercase bg-rose-500/20 text-rose-200 border border-rose-400/30">1-Use</span>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold ${
                            affordable ? 'bg-amber-400 text-stone-950' : 'bg-stone-700 text-slate-300'
                        }">${effCost}M</span>
                    </div>
                </div>
                <div class="mt-1">
                    <div class="font-display font-bold text-[11px] text-white truncate">${c.name}</div>
                    <p class="text-[9px] text-slate-300 leading-tight mt-0.5 line-clamp-2">${c.shortDesc}</p>
                </div>
            `;

            cardBtn.addEventListener('click', () => {
                if (!affordable) {
                    if (cardId === 'sinkhole_chute' && totalTokensOnBoard < 3) {
                        showToast(`Subterranean Trapdoor requires at least 3 tokens in play (${totalTokensOnBoard}/3)!`, "🕳️");
                    } else {
                        showToast("Not enough Mana crystals!", "⚡");
                    }
                    return;
                }
                toggleSelectCard(idx);
            });

            handContainer.appendChild(cardBtn);
        });
    }
}

function toggleSelectCard(idx) {
    state.selectedReserveIdx = null;
    if (state.selectedCardIdx === idx) {
        clearActionSelection();
    } else {
        state.selectedCardIdx = idx;
        const cardId = state.hand[idx];
        const c = CARD_CATALOG[cardId];
        document.getElementById('inspector-icon').textContent = c.icon;
        document.getElementById('inspector-name').textContent = c.name;
        document.getElementById('inspector-cost').textContent = `${getEffectiveCardCost(cardId)} Mana • 1-Use`;
        document.getElementById('inspector-desc').textContent = c.desc;
        document.getElementById('action-inspector').classList.remove('hidden');

        colHighlightMat.color.setHex(0x2dd4bf);
        if (cardId === 'abyssal_upheaval' || cardId === 'sinkhole_chute') {
            const bannerMsg = cardId === 'sinkhole_chute'
                ? `Tap any column on the board to unbolt ${c.name} (Drops 3 bottom tokens)!`
                : `Tap any column on the board to unleash ${c.name} (180° Board Flip)!`;
            setStatusBanner(true, bannerMsg);
            updateColumnPreviewVisual(state.previewCol !== -1 ? state.previewCol : 3);
        } else {
            setStatusBanner(true, `Tap a column (1-7) to cast ${c.name}`);
            if (state.previewCol !== -1) updateColumnPreviewVisual(state.previewCol);
        }
        updateHUD();
    }
}

function toggleSelectReserveToken(idx) {
    state.selectedCardIdx = null;
    const clickedType = state.reservePouch[idx];
    const currentSelectedType = state.selectedReserveIdx !== null ? state.reservePouch[state.selectedReserveIdx] : null;
    if (state.selectedReserveIdx === idx || (clickedType && clickedType === currentSelectedType)) {
        clearActionSelection();
    } else {
        state.selectedReserveIdx = idx;
        const tok = RESERVE_CATALOG[clickedType];
        const heldCount = state.reservePouch.filter(id => id === clickedType).length;
        document.getElementById('inspector-icon').textContent = tok.icon;
        document.getElementById('inspector-name').textContent = heldCount > 1 ? `${tok.name} (×${heldCount})` : tok.name;
        document.getElementById('inspector-cost').textContent = `Reserve Drop`;
        document.getElementById('inspector-desc').textContent = tok.desc;
        document.getElementById('action-inspector').classList.remove('hidden');

        colHighlightMat.color.setHex(0xf43f5e);
        setStatusBanner(true, `Tap a column to deploy ${tok.name}`);
        updateHUD();
        if (state.previewCol !== -1) updateColumnPreviewVisual(state.previewCol);
    }
}

function clearActionSelection() {
    state.selectedCardIdx = null;
    state.selectedReserveIdx = null;
    document.getElementById('action-inspector').classList.add('hidden');
    colHighlightMat.color.setHex(0xf59e0b);
    setStatusBanner(true, "Tap or slide across columns to aim • Tap again to drop");
    updateHUD();
    if (state.previewCol !== -1) updateColumnPreviewVisual(state.previewCol);
}

function setStatusBanner(isPlayer, msg) {
    document.getElementById('status-text').textContent = msg;
    document.getElementById('status-dot').className = isPlayer
        ? "w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"
        : "w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0";
}
