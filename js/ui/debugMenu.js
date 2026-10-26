// ============================================================================
// SECRET CODE LISTENER & DYAGONIL_OS ROOT DEBUG LAUNCHER (js/ui/debugMenu.js)
// ============================================================================

// ============================================================================
// 13. DYAGONIL SPLASH SCREEN, SECRET DEBUG CODE & ANIMATED TITLE OPENER
// ============================================================================
// Secret code sequence using 0-based token indices:
// 0 = Left Amber | 1 = Teal | 2 = Right Amber | 3 = Purple
const DEBUG_SECRET_SEQUENCE = [1, 3, 0, 2, 3, 1];

let titleTokensInteractive = false;
let secretCodeBuffer = [];
let secretBufferResetTimer = null;

// ============================================================================
// DEBUG MENU STATE, LOADOUT BUILDER & LEVEL LAUNCHER
// ============================================================================
const debugLoadout = {
    floorIdx: 0,
    difficulty: 'MEDIUM',
    topologyOverride: 'AUTO', // 'AUTO' | 'classic_grid' | BOARD_TOPOLOGIES[].id
    bossOverride: 'AUTO',     // 'AUTO' | 'SENTINEL' | BOSS_ARCHETYPES[].id
    gold: 6,
    maxMana: 2,
    handSize: 3,
    persistentEnchantCount: 2,
    gambits: new Set(),
    reserveCounts: {},
    cardCounts: {}
};

// Active single-floor overrides when launched from the Debug Console


// Wrap getFloorTopology & getFloorConfig so Debug overrides work on any floor
const _baseGetFloorTopology = getFloorTopology;
getFloorTopology = function(floorIdx) {
    if (activeDebugTopologyOverride === 'classic_grid') {
        return {
            id: 'classic_grid',
            name: 'Classic 7x6 Cavern Grid',
            icon: '📐',
            desc: 'Standard 42-slot subterranean Connect 4 frame with 0 void cells.',
            isProcedural: false,
            mask: Array.from({ length: ROWS }, () => Array(COLS).fill(true))
        };
    }
    if (activeDebugTopologyOverride && activeDebugTopologyOverride !== 'AUTO') {
        const pick = BOARD_TOPOLOGIES.find(t => t.id === activeDebugTopologyOverride);
        if (pick) {
            return {
                id: pick.id,
                name: pick.name,
                icon: pick.icon,
                desc: pick.desc,
                isProcedural: true,
                mask: pick.buildMask()
            };
        }
    }
    return _baseGetFloorTopology(floorIdx);
};

const _baseGetFloorConfig = getFloorConfig;
getFloorConfig = function(floorIdx) {
    const baseCfg = _baseGetFloorConfig(floorIdx);
    if (!activeDebugBossOverride || activeDebugBossOverride === 'AUTO') {
        return baseCfg;
    }
    if (activeDebugBossOverride === 'SENTINEL') {
        return {
            ...baseCfg,
            isBoss: false,
            maxHp: 1,
            boss: SENTINEL_NAMES[floorIdx % SENTINEL_NAMES.length],
            bossArchetype: null,
            telegraph: `Sentinel AI Lv.${floorIdx + 1} (D${baseCfg.depth} • ${baseCfg.aiPrecisionPct}% IQ)`
        };
    }
    const arch = BOSS_ARCHETYPES.find(b => b.id === activeDebugBossOverride);
    if (!arch) return baseCfg;
    const effInterval = getEffectiveBossInterval(arch);
    return {
        ...baseCfg,
        isBoss: true,
        isPreBoss: false,
        maxHp: arch.maxHp || 2,
        boss: `${arch.icon} ${arch.name}`,
        bossArchetype: arch,
        bossInterval: effInterval,
        telegraph: arch.shortTelegraph,
        fullRule: `${arch.poolLabel.toUpperCase()} (${arch.maxHp || 2} HP Phases • AI Lv.${floorIdx + 1} D${baseCfg.depth} • Trigger every ${effInterval}T): ${arch.fullRule}`
    };
};

function resetDebugLoadoutToDefault() {
    debugLoadout.floorIdx = 0;
    debugLoadout.difficulty = state.difficulty || 'MEDIUM';
    debugLoadout.topologyOverride = 'AUTO';
    debugLoadout.bossOverride = 'AUTO';
    const diff = DIFFICULTY_TIERS[debugLoadout.difficulty] || DIFFICULTY_TIERS.MEDIUM;
    debugLoadout.gold = diff.startingGold;
    debugLoadout.maxMana = diff.startingMaxMana;
    debugLoadout.handSize = diff.startingHandSize || 2;
    debugLoadout.persistentEnchantCount = 1 + (diff.extraEnchantedSlots || 0);

    debugLoadout.gambits = new Set(diff.starterGambitId ? [diff.starterGambitId] : []);
    debugLoadout.reserveCounts = {};
    Object.keys(RESERVE_CATALOG).forEach(k => { debugLoadout.reserveCounts[k] = 0; });

    debugLoadout.cardCounts = {};
    Object.keys(CARD_CATALOG).forEach(k => { debugLoadout.cardCounts[k] = 0; });
    ['pebble', 'petrified', 'oracle_peek', 'sinkhole_chute'].forEach(k => {
        if (CARD_CATALOG[k]) debugLoadout.cardCounts[k] = 1;
    });
}

function applyMaxedSandboxPreset() {
    debugLoadout.gold = 99;
    debugLoadout.maxMana = 5;
    debugLoadout.handSize = 5;
    debugLoadout.persistentEnchantCount = 6;
    debugLoadout.gambits = new Set(['dali_clock', 'echo_bell', 'obsidian_cat', 'coaster_apex', 'sacred_heart_prism']);
    Object.keys(RESERVE_CATALOG).forEach(k => { debugLoadout.reserveCounts[k] = 2; });
    Object.keys(CARD_CATALOG).forEach(k => {
        debugLoadout.cardCounts[k] = (k === 'dead_weight') ? 0 : 2;
    });
}

function clearDebugLoadoutItems() {
    debugLoadout.gambits.clear();
    Object.keys(RESERVE_CATALOG).forEach(k => { debugLoadout.reserveCounts[k] = 0; });
    Object.keys(CARD_CATALOG).forEach(k => { debugLoadout.cardCounts[k] = 0; });
}

function renderDebugMenu() {
    // 1. Floor Grid (F1..F9)
    const floorGrid = document.getElementById('dbg-floor-grid');
    if (floorGrid) {
        floorGrid.innerHTML = '';
        for (let i = 0; i < TOTAL_FLOORS; i++) {
            const isBoss = isBossFloorIndex(i);
            const isPre = isPreBossFloorIndex(i);
            const active = debugLoadout.floorIdx === i;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `py-1.5 rounded-xl font-mono-code text-[10px] font-bold border transition active:scale-95 ${
                active
                    ? (isBoss ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_10px_#f43f5e]' : 'bg-teal-400 text-stone-950 border-teal-200 shadow-md')
                    : (isBoss ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' : (isPre ? 'bg-amber-950/50 text-amber-300 border-amber-500/30' : 'bg-stone-900 text-slate-400 border-white/10'))
            }`;
            btn.textContent = isBoss ? `💀${i + 1}` : (isPre ? `⚔️${i + 1}` : `F${i + 1}`);
            btn.addEventListener('click', () => {
                sfx.playHoverTick();
                debugLoadout.floorIdx = i;
                renderDebugMenu();
            });
            floorGrid.appendChild(btn);
        }
    }

    const fNum = debugLoadout.floorIdx + 1;
    const fType = isBossFloorIndex(debugLoadout.floorIdx)
        ? '💀 Boss Floor'
        : (isPreBossFloorIndex(debugLoadout.floorIdx) ? '⚔️ Pre-Boss Vanguard' : '🛡️ Standard Sentinel');
    const summaryEl = document.getElementById('dbg-floor-summary');
    if (summaryEl) summaryEl.textContent = `Floor ${fNum} of ${TOTAL_FLOORS} • ${fType}`;

    // 2. Difficulty Tier Buttons
    const diffGrid = document.getElementById('dbg-diff-grid');
    if (diffGrid) {
        diffGrid.innerHTML = '';
        Object.values(DIFFICULTY_TIERS).forEach(tier => {
            const active = debugLoadout.difficulty === tier.id;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `py-1.5 px-2 rounded-xl border text-[10px] font-bold transition active:scale-95 ${
                active ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-md' : 'bg-stone-900 text-slate-300 border-white/10'
            }`;
            btn.textContent = tier.shortBadge;
            btn.addEventListener('click', () => {
                sfx.playHoverTick();
                debugLoadout.difficulty = tier.id;
                renderDebugMenu();
            });
            diffGrid.appendChild(btn);
        });
    }

    // 3. Topology & Boss Override Dropdowns
    const topoSelect = document.getElementById('dbg-topo-select');
    if (topoSelect && topoSelect.options.length === 0) {
        topoSelect.innerHTML = `
            <option value="AUTO">🎲 Auto (Floor Default)</option>
            <option value="classic_grid">📐 Classic 7x6 Cavern Grid</option>
            ${BOARD_TOPOLOGIES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
        `;
        topoSelect.addEventListener('change', (e) => {
            sfx.playHoverTick();
            debugLoadout.topologyOverride = e.target.value;
        });
    }
    if (topoSelect) topoSelect.value = debugLoadout.topologyOverride;

    const bossSelect = document.getElementById('dbg-boss-select');
    if (bossSelect && bossSelect.options.length === 0) {
        bossSelect.innerHTML = `
            <option value="AUTO">🎲 Auto (Floor Default)</option>
            <option value="SENTINEL">🛡️ Force Standard Sentinel (No Boss Ability)</option>
            ${BOSS_ARCHETYPES.map(b => `<option value="${b.id}">${b.icon} ${b.name} (${b.maxHp} HP)</option>`).join('')}
        `;
        bossSelect.addEventListener('change', (e) => {
            sfx.playHoverTick();
            debugLoadout.bossOverride = e.target.value;
        });
    }
    if (bossSelect) bossSelect.value = debugLoadout.bossOverride;

    // 4. Stats Readouts
    document.getElementById('dbg-val-gold').textContent = `$${debugLoadout.gold}`;
    document.getElementById('dbg-val-mana').textContent = debugLoadout.maxMana;
    document.getElementById('dbg-val-hand').textContent = debugLoadout.handSize;
    document.getElementById('dbg-val-enchants').textContent = debugLoadout.persistentEnchantCount;

    // 5. Synergistic Gambits Grid
    const gambitsGrid = document.getElementById('dbg-gambits-grid');
    if (gambitsGrid) {
        gambitsGrid.innerHTML = '';
        Object.values(GAMBIT_CATALOG).forEach(g => {
            const equipped = debugLoadout.gambits.has(g.id);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition active:scale-98 ${
                equipped
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-inner'
                    : 'bg-stone-900/80 border-white/10 text-slate-400 opacity-75'
            }`;
            btn.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">${g.icon}</span>
                    <div class="min-w-0">
                        <div class="text-[10px] font-bold text-white truncate">${g.name}</div>
                        <div class="text-[8px] text-slate-400 truncate">Tier ${g.tier} Relic</div>
                    </div>
                </div>
                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${equipped ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-slate-500'}">
                    ${equipped ? 'ON' : 'OFF'}
                </span>
            `;
            btn.addEventListener('click', () => {
                sfx.playHoverTick();
                if (equipped) debugLoadout.gambits.delete(g.id);
                else debugLoadout.gambits.add(g.id);
                renderDebugMenu();
            });
            gambitsGrid.appendChild(btn);
        });
        document.getElementById('dbg-gambit-count').textContent = `${debugLoadout.gambits.size} Equipped`;
    }

    // 6. Tactical Reserve Tokens Grid
    const reservesGrid = document.getElementById('dbg-reserves-grid');
    if (reservesGrid) {
        reservesGrid.innerHTML = '';
        let totalReserves = 0;
        Object.values(RESERVE_CATALOG).forEach(tok => {
            const count = debugLoadout.reserveCounts[tok.id] || 0;
            totalReserves += count;
            const row = document.createElement('div');
            row.className = `p-2 rounded-xl border flex items-center justify-between gap-2 ${
                count > 0 ? 'bg-rose-950/40 border-rose-400/50' : 'bg-stone-900/80 border-white/10'
            }`;
            row.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">${tok.icon}</span>
                    <div class="min-w-0">
                        <div class="text-[10px] font-bold text-white truncate">${tok.name}</div>
                        <div class="text-[8px] text-slate-400">Tier ${tok.tier} Reserve</div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" data-res="${tok.id}" data-delta="-1" class="dbg-res-btn w-5 h-5 rounded bg-white/10 text-white text-xs font-bold active:scale-90">-</button>
                    <span class="w-5 text-center text-[10px] font-bold ${count > 0 ? 'text-rose-300' : 'text-slate-500'}">${count}</span>
                    <button type="button" data-res="${tok.id}" data-delta="1" class="dbg-res-btn w-5 h-5 rounded bg-rose-500/30 text-rose-200 text-xs font-bold active:scale-90">+</button>
                </div>
            `;
            reservesGrid.appendChild(row);
        });
        reservesGrid.querySelectorAll('.dbg-res-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sfx.playHoverTick();
                const id = btn.getAttribute('data-res');
                const d = parseInt(btn.getAttribute('data-delta'), 10);
                debugLoadout.reserveCounts[id] = Math.max(0, Math.min(20, (debugLoadout.reserveCounts[id] || 0) + d));
                renderDebugMenu();
            });
        });
        document.getElementById('dbg-reserve-count').textContent = `${totalReserves} Token(s)`;
    }

    // 7. Arcane Cards Grid
    const cardsGrid = document.getElementById('dbg-cards-grid');
    if (cardsGrid) {
        cardsGrid.innerHTML = '';
        let totalCards = 0;
        Object.values(CARD_CATALOG).forEach(c => {
            const count = debugLoadout.cardCounts[c.id] || 0;
            totalCards += count;
            const row = document.createElement('div');
            row.className = `p-2 rounded-xl border flex items-center justify-between gap-2 ${
                count > 0 ? 'bg-teal-950/45 border-teal-400/50' : 'bg-stone-900/80 border-white/10'
            }`;
            row.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-base shrink-0">${c.icon}</span>
                    <div class="min-w-0">
                        <div class="text-[10px] font-bold text-white truncate">${c.name}</div>
                        <div class="text-[8px] text-slate-400">${c.cost}M • T${c.tier} • ${c.shortDesc}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" data-card="${c.id}" data-delta="-1" class="dbg-card-btn w-5 h-5 rounded bg-white/10 text-white text-xs font-bold active:scale-90">-</button>
                    <span class="w-5 text-center text-[10px] font-bold ${count > 0 ? 'text-teal-300' : 'text-slate-500'}">${count}</span>
                    <button type="button" data-card="${c.id}" data-delta="1" class="dbg-card-btn w-5 h-5 rounded bg-teal-500/30 text-teal-200 text-xs font-bold active:scale-90">+</button>
                </div>
            `;
            cardsGrid.appendChild(row);
        });
        cardsGrid.querySelectorAll('.dbg-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sfx.playHoverTick();
                const id = btn.getAttribute('data-card');
                const d = parseInt(btn.getAttribute('data-delta'), 10);
                debugLoadout.cardCounts[id] = Math.max(0, Math.min(20, (debugLoadout.cardCounts[id] || 0) + d));
                renderDebugMenu();
            });
        });
        document.getElementById('dbg-card-count').textContent = `${totalCards} Card(s)`;
    }
}

function launchDebugRunWithLoadout() {
    sfx.playCardChime();
    triggerHaptic([25, 30, 50]);

    // 1. Apply Difficulty & Reset Base Run State
    state.difficulty = debugLoadout.difficulty;
    try { localStorage.setItem(DIFFICULTY_STORAGE_KEY, state.difficulty); } catch (e) {}
    initNewRun();

    // 2. Apply Target Floor & Arena Overrides
    state.floorIdx = debugLoadout.floorIdx;
    activeDebugTopologyOverride = debugLoadout.topologyOverride;
    activeDebugBossOverride = debugLoadout.bossOverride;

    // 3. Apply Custom Economy & Vessel Capacities
    state.gold = debugLoadout.gold;
    state.maxMana = debugLoadout.maxMana;
    state.handSize = debugLoadout.handSize;
    state.persistentEnchantCount = debugLoadout.persistentEnchantCount;

    // 4. Apply Equipped Synergistic Gambits (auto-expanding slot capacity to fit)
    state.gambits = Array.from(debugLoadout.gambits);
    state.maxGambitSlots = Math.max(1, state.gambits.length);

    // 5. Apply Tactical Reserve Pouch Tokens
    state.reservePouch = [];
    Object.entries(debugLoadout.reserveCounts).forEach(([id, count]) => {
        for (let i = 0; i < count; i++) state.reservePouch.push(id);
    });
    state.reservePouchUnlocked = state.reservePouch.length > 0 || state.floorIdx >= 2;

    // 6. Apply Custom Arcane Card Stockpile
    state.masterDeck = [];
    Object.entries(debugLoadout.cardCounts).forEach(([id, count]) => {
        for (let i = 0; i < count; i++) state.masterDeck.push(id);
    });
    state.highTierCardsUnlocked = true;

    // 7. Dismiss Debug, Intro & Difficulty Overlays and Start the Floor!
    closeDebugMenuModal();
    const introOverlay = document.getElementById('intro-sequence-overlay');
    if (introOverlay) {
        introOverlay.style.opacity = '0';
        introOverlay.style.pointerEvents = 'none';
        setTimeout(() => introOverlay.classList.add('hidden'), 400);
    }
    document.getElementById('difficulty-modal').classList.add('hidden');
    dismissAllActiveNotifications();

    bgm.hasStartedAfterDifficulty = true;
    bgm.isPausedForModal = false;

    startFloorMatch(true);
    showToast(`🛠️ Debug Run Launched: Floor ${state.floorIdx + 1} with Custom Loadout!`, '🚀', 4200);
}

function bindDebugMenuControlsOnce() {
    if (bindDebugMenuControlsOnce.bound) return;
    bindDebugMenuControlsOnce.bound = true;

    resetDebugLoadoutToDefault();

    // Stat steppers
    document.querySelectorAll('.dbg-stat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playHoverTick();
            const stat = btn.getAttribute('data-stat');
            const delta = parseInt(btn.getAttribute('data-delta'), 10);
            if (stat === 'gold') debugLoadout.gold = Math.max(0, Math.min(999, debugLoadout.gold + delta));
            else if (stat === 'maxMana') debugLoadout.maxMana = Math.max(1, Math.min(10, debugLoadout.maxMana + delta));
            else if (stat === 'handSize') debugLoadout.handSize = Math.max(1, Math.min(5, debugLoadout.handSize + delta));
            else if (stat === 'enchants') debugLoadout.persistentEnchantCount = Math.max(0, Math.min(18, debugLoadout.persistentEnchantCount + delta));
            renderDebugMenu();
        });
    });

    // Section quick-actions
    document.getElementById('dbg-gambits-all').addEventListener('click', () => {
        sfx.playHoverTick();
        debugLoadout.gambits = new Set(Object.keys(GAMBIT_CATALOG));
        renderDebugMenu();
    });
    document.getElementById('dbg-gambits-none').addEventListener('click', () => {
        sfx.playHoverTick();
        debugLoadout.gambits.clear();
        renderDebugMenu();
    });
    document.getElementById('dbg-reserves-pack').addEventListener('click', () => {
        sfx.playHoverTick();
        Object.keys(RESERVE_CATALOG).forEach(k => {
            debugLoadout.reserveCounts[k] = (debugLoadout.reserveCounts[k] || 0) + 1;
        });
        renderDebugMenu();
    });
    document.getElementById('dbg-reserves-none').addEventListener('click', () => {
        sfx.playHoverTick();
        Object.keys(RESERVE_CATALOG).forEach(k => { debugLoadout.reserveCounts[k] = 0; });
        renderDebugMenu();
    });
    document.getElementById('dbg-cards-pack').addEventListener('click', () => {
        sfx.playHoverTick();
        Object.keys(CARD_CATALOG).forEach(k => {
            if (k !== 'dead_weight') {
                debugLoadout.cardCounts[k] = (debugLoadout.cardCounts[k] || 0) + 1;
            }
        });
        renderDebugMenu();
    });
    document.getElementById('dbg-cards-none').addEventListener('click', () => {
        sfx.playHoverTick();
        Object.keys(CARD_CATALOG).forEach(k => { debugLoadout.cardCounts[k] = 0; });
        renderDebugMenu();
    });

    // Presets
    document.getElementById('dbg-preset-starter').addEventListener('click', () => {
        sfx.playHoverTick();
        resetDebugLoadoutToDefault();
        renderDebugMenu();
    });
    document.getElementById('dbg-preset-sandbox').addEventListener('click', () => {
        sfx.playCoinDing();
        applyMaxedSandboxPreset();
        renderDebugMenu();
    });
    document.getElementById('dbg-preset-clear').addEventListener('click', () => {
        sfx.playHoverTick();
        clearDebugLoadoutItems();
        renderDebugMenu();
    });

    // Launch CTA
    document.getElementById('dbg-launch-run-btn').addEventListener('click', launchDebugRunWithLoadout);
}

function openDebugMenuModal() {
    bindDebugMenuControlsOnce();
    renderDebugMenu();
    const modal = document.getElementById('debug-menu-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeDebugMenuModal() {
    const modal = document.getElementById('debug-menu-modal');
    if (modal) modal.classList.add('hidden');
}

function enableTitleTokensSecretInteraction() {
    if (titleTokensInteractive) return;
    titleTokensInteractive = true;

    const rippleColors = ['#fbbf24', '#2dd4bf', '#fbbf24', '#e879f9'];

    [0, 1, 2, 3].forEach((tokIdx) => {
        const tokEl = document.getElementById(`title-tok-${tokIdx}`);
        if (!tokEl) return;
        const slotEl = tokEl.parentElement;
        if (slotEl) slotEl.classList.add('slot-interactive');

        const handleTokenTap = (e) => {
            e.stopPropagation();
            if (!titleTokensInteractive) return;

            // 1. Play per-token 8-bit synth note & light haptic pulse
            sfx.playTitleTokenToyNote(tokIdx);
            triggerHaptic(15);

            // 2. Restart elastic boing animation on the tapped token
            tokEl.classList.remove('token-tap-boing');
            void tokEl.offsetWidth; // Force reflow so rapid taps re-trigger cleanly
            tokEl.classList.add('token-tap-boing');

            // 3. Spawn color-matched expanding ripple ring on the token slot
            if (slotEl) {
                const ripple = document.createElement('div');
                ripple.className = 'title-slot-ripple-ring';
                ripple.style.borderColor = rippleColors[tokIdx];
                slotEl.appendChild(ripple);
                setTimeout(() => ripple.remove(), 460);
            }

            // 4. Record tap in rolling secret sequence buffer (resets after 4s of inactivity)
            if (secretBufferResetTimer) clearTimeout(secretBufferResetTimer);
            secretCodeBuffer.push(tokIdx);
            if (secretCodeBuffer.length > DEBUG_SECRET_SEQUENCE.length) {
                secretCodeBuffer.shift();
            }
            secretBufferResetTimer = setTimeout(() => {
                secretCodeBuffer = [];
            }, 4000);

            // 5. Check if the rolling buffer matches DEBUG_SECRET_SEQUENCE
            const isMatch =
                secretCodeBuffer.length === DEBUG_SECRET_SEQUENCE.length &&
                secretCodeBuffer.every((val, i) => val === DEBUG_SECRET_SEQUENCE[i]);

            if (isMatch) {
                secretCodeBuffer = [];
                sfx.playDebugUnlockJingle();
                triggerHaptic([30, 25, 50, 25, 70]);

                // Flash all 4 title tokens in unison before opening the console
                [0, 1, 2, 3].forEach((i) => {
                    const el = document.getElementById(`title-tok-${i}`);
                    if (el) {
                        el.classList.remove('token-tap-boing', 'token-secret-unlocked');
                        void el.offsetWidth;
                        el.classList.add('token-secret-unlocked');
                    }
                });

                setTimeout(() => {
                    openDebugMenuModal();
                }, 380);
            }
        };

        // Attach to slotEl (or tokEl fallback) for generous thumb-friendly hit area
        (slotEl || tokEl).addEventListener('pointerdown', handleTokenTap);
    });

    // Bind close buttons on the Debug Menu Modal
    const closeBtn = document.getElementById('close-debug-menu-btn');
    const doneBtn = document.getElementById('done-debug-menu-btn');
    const modal = document.getElementById('debug-menu-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => { sfx.playHoverTick(); closeDebugMenuModal(); });
    if (doneBtn) doneBtn.addEventListener('click', () => { sfx.playHoverTick(); closeDebugMenuModal(); });
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'debug-menu-modal') {
                sfx.playHoverTick();
                closeDebugMenuModal();
            }
        });
    }
}
