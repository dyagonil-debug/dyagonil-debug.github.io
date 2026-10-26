// ============================================================================
// INTERACTIVE 9-STEP HUD TUTORIAL SPOTLIGHT ENGINE (js/ui/tutorial.js)
// ============================================================================

// ============================================================================
// 14. INTERACTIVE HUD TUTORIAL SEQUENCE ENGINE
// ============================================================================
const TUTORIAL_STEPS = [
    {
        id: 'board_overview',
        icon: '⛰️',
        title: '3D Cavern Board & Enchanted Slots',
        targetSelector: null, // Uses central 3D board spotlight area
        calloutPosition: 'bottom',
        body: `
            <p>Connect <strong>4 Amber tokens</strong> horizontally, vertically, or diagonally before the Guardian AI connects 4 Teal tokens.</p>
            <p class="text-amber-300/95">✨ <strong>Glowing Enchanted Rings:</strong> Dropping a token into a ringed slot triggers an instant bonus—<strong>Gold (+$3)</strong>, <strong>Spice (+1 Mana &amp; shatter)</strong>, <strong>Web (petrifies AI)</strong>, or <strong>Amplifier (Wild token +$2)</strong>!</p>
        `
    },
    {
        id: 'boss_and_topology',
        icon: '🛡️',
        title: 'Floor Guardian, Boss HP & Topology',
        targetSelector: '#boss-info-btn',
        calloutPosition: 'bottom',
        body: `
            <p>Displays your current <strong>Floor (F1–F9)</strong>, live <strong>AI Evaluation Score</strong>, and active <strong>Board Topology</strong>.</p>
            <p class="text-rose-300/95">❤️ <strong>Multi-HP Bosses (Floors 3, 6 &amp; 9):</strong> Bosses have multiple HP phases and a telegraphed ability timer. Each Connect-4 you score shatters 1 Boss HP and calcifies your winning piece into neutral Stone while the battle continues!</p>
        `
    },
    {
        id: 'economy_and_stability',
        icon: '🌋',
        title: 'Gold Pouch & Seismic Stability Timer',
        targetSelector: ['#gold-badge', '#stability-info-btn'],
        calloutPosition: 'bottom',
        body: `
            <p>🪙 <strong>Gold Coins:</strong> Spent between floors in the Underground Bazaar on Relics, Cards, and Reserve Tokens.</p>
            <p class="text-orange-300/95">🌋 <strong>Seismic Stability:</strong> Decreases by 1 each turn. Winning early awards <strong>+$1 Speed Bonus Gold</strong> per remaining turn! If Stability hits <strong>0</strong>, cavern quakes drop Petrified Stones every round.</p>
        `
    },
    {
        id: 'gambits_and_confirm',
        icon: '🐈‍⬛',
        title: 'Synergistic Gambits & Drop Confirm',
        targetSelector: ['#gambit-strip', '#confirm-drop-btn'],
        calloutPosition: 'bottom',
        body: `
            <p>🏺 <strong>Synergistic Gambits (Left):</strong> Passive relics (up to 5 slots) that grant build-around bonuses—like <em>Obsidian Cat</em> (+$2 per shattered token &amp; a 1-time loss save) or <em>Golden Crust</em> (+$1 &amp; +1 Stability on edge columns).</p>
            <p class="text-amber-300/95">👆 <strong>Confirm Drop Pill (Right):</strong> Slide across columns to aim, then tap the column again or tap this button to drop.</p>
        `
    },
    {
        id: 'act_map_and_milestones',
        icon: '🗺️',
        title: '9-Floor Ascent Map & Milestones',
        targetSelector: ['#floor-pip-bar', '#difficulty-badge', '#milestone-info-btn'],
        calloutPosition: 'bottom',
        body: `
            <p>Track your journey across 3 subterranean Acts: two Sentinel floors followed by a <strong>💀 Boss Floor (F3, F6, F9)</strong>.</p>
            <p class="text-teal-300/95">🏔️ <strong>Boss Milestones:</strong> Vanquishing Floor 3 &amp; Floor 6 Bosses permanently expands your <strong>Max Mana</strong>, <strong>Hand Size</strong>, <strong>Gambit Slots</strong>, and unlocks a free Boss Relic Chest!</p>
        `
    },
    {
        id: 'status_and_slot_legend',
        icon: '✨',
        title: 'Turn Status & Slot Ring Legend',
        targetSelector: '#status-banner',
        calloutPosition: 'bottom',
        body: `
            <p>Shows real-time turn prompts, armed spell instructions, and Boss warnings.</p>
            <p class="text-teal-300/95">Tap the <strong>Slots ?</strong> button on the right at any time during a match to inspect the color legend for all 4 Enchanted Slot ring types.</p>
        `
    },
    {
        id: 'mana_and_telemetry',
        icon: '⚡',
        title: 'Mana Crystals & AI Telemetry Eye',
        targetSelector: ['#mana-current', '#telemetry-btn'],
        calloutPosition: 'top',
        body: `
            <p>⚡ <strong>Mana Pool (Left):</strong> Powers your Arcane Cards and regenerates on your turn. Unspent cards stay in your hand between turns.</p>
            <p class="text-teal-300/95">👁️ <strong>Telemetry Eye (Right):</strong> Toggles the Grandmaster AI's exact minimax column scores (e.g., <strong>+12</strong>, <strong>WIN</strong>, <strong>RISK</strong>) floating above all 7 columns!</p>
        `
    },
    {
        id: 'reserve_token_pouch',
        icon: '🎒',
        title: 'Tactical Reserve Token Pouch',
        targetSelector: '#reserve-pouch-container',
        calloutPosition: 'top',
        body: `
            <p>Stores special off-board tokens like <strong>⚓ Heavy Anvil</strong> (crushes the token below), <strong>💎 Wild Prismatic</strong> (counts for both colors), and <strong>🌶️ Jalapeño Bomb</strong> (3×3 blast).</p>
            <p class="text-rose-300/95">Tap a Reserve Token to arm it, then drop it into a column in place of your normal token!</p>
        `
    },
    {
        id: 'arcane_card_hand',
        icon: '🃏',
        title: 'Consumable Arcane Card Hand',
        targetSelector: '#hand-container',
        calloutPosition: 'top',
        body: `
            <p>One-time consumable spells like <strong>🪨 Cavern Pebble</strong>, <strong>⛏️ Spelunker's Pickaxe</strong> (shatters all Stone in a column), and <strong>🕳️ Subterranean Trapdoor</strong> (drops 3 bottom tokens).</p>
            <p class="text-amber-300/95">💡 <strong>Pro Tip:</strong> Casting Arcane Cards does <strong>not</strong> end your turn—manipulate the board first, then drop your token to score Connect 4!</p>
        `
    }
];

let tutorialActive = false;
let tutorialStepIdx = 0;

function stageTypicalTutorialBoard() {
    // Stage a lively, representative mid-game board & HUD so every highlighted element has real items
    initNewRun();
    state.floorIdx = 0;
    state.gold = 9;
    state.maxMana = 2;
    state.mana = 2;
    state.handSize = 3;
    state.maxGambitSlots = 2;
    state.gambits = ['obsidian_cat', 'butter_crust'];
    state.reservePouchUnlocked = true;
    state.reservePouch = ['anvil', 'wild', 'jalapeno_bomb'];
    state.masterDeck = ['pebble', 'pickaxe', 'sinkhole_chute', 'petrified', 'oracle_peek'];

    startFloorMatch(false);
    state.stability = 12;
    state.hand = ['pebble', 'pickaxe', 'sinkhole_chute'];
    state.drawPile = ['petrified', 'oracle_peek'];

    // Populate a realistic mid-game 3D token arrangement
    while (tokensGroup.children.length > 0) {
        tokensGroup.remove(tokensGroup.children[0]);
    }
    state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    state.meshes = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    const sampleDrops = [
        [0, 3, PLAYER],
        [0, 2, AI],
        [1, 3, PLAYER],
        [0, 4, AI],
        [0, 1, STONE],
        [1, 2, PLAYER],
        [1, 4, AI],
        [0, 5, WILD]
    ];
    sampleDrops.forEach(([r, c, type]) => {
        spawnTokenMesh(r, c, type);
        if (state.meshes[r][c]) {
            state.meshes[r][c].position.y = state.meshes[r][c].userData.targetY;
            state.meshes[r][c].userData.velY = 0;
        }
    });

    // Guarantee all 4 Enchanted Slot Ring colors are visible on the board
    state.enchantGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(ENCHANT_TYPES.NONE));
    state.enchantGrid[2][3] = ENCHANT_TYPES.GILDED;
    state.enchantGrid[2][2] = ENCHANT_TYPES.SPICE;
    state.enchantGrid[1][1] = ENCHANT_TYPES.WEB;
    state.enchantGrid[2][4] = ENCHANT_TYPES.AMPLIFIER;
    rebuildEnchantmentRings();

    // Show column 4 preview & Confirm Drop button so players see how aiming works
    updateHUD();
    updateTelemetryBadges();
    updateColumnPreviewVisual(3);
}

function computeTutorialTargetRect(targetSelector) {
    const pad = 8;
    if (!targetSelector) {
        // Central 3D Cavern Board spotlight region
        const w = Math.min(window.innerWidth * 0.88, 430);
        const h = Math.min(window.innerHeight * 0.42, 330);
        return {
            left: (window.innerWidth - w) / 2,
            top: (window.innerHeight - h) / 2 - 12,
            width: w,
            height: h
        };
    }

    const selectors = Array.isArray(targetSelector) ? targetSelector : [targetSelector];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectors.forEach(sel => {
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
    const step = TUTORIAL_STEPS[tutorialStepIdx];
    if (!step) return;

    const spotlight = document.getElementById('tutorial-spotlight');
    const card = document.getElementById('tutorial-callout-card');
    const iconEl = document.getElementById('tutorial-step-icon');
    const counterEl = document.getElementById('tutorial-step-counter');
    const titleEl = document.getElementById('tutorial-step-title');
    const bodyEl = document.getElementById('tutorial-step-body');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const dotsEl = document.getElementById('tutorial-progress-dots');
    const nextPrompt = document.getElementById('tutorial-next-prompt');

    // Position Spotlight Cutout over the target HUD element(s)
    const rect = computeTutorialTargetRect(step.targetSelector);
    spotlight.style.left = `${rect.left}px`;
    spotlight.style.top = `${rect.top}px`;
    spotlight.style.width = `${rect.width}px`;
    spotlight.style.height = `${rect.height}px`;

    // Populate Explanation Text
    iconEl.textContent = step.icon;
    counterEl.textContent = `HUD TUTORIAL • STEP ${tutorialStepIdx + 1} OF ${TUTORIAL_STEPS.length}`;
    titleEl.textContent = step.title;
    bodyEl.innerHTML = step.body;

    // Toggle Back Button visibility
    prevBtn.style.visibility = tutorialStepIdx === 0 ? 'hidden' : 'visible';

    // Update Progress Dots
    dotsEl.innerHTML = TUTORIAL_STEPS.map((_, i) => `
        <span class="w-1.5 h-1.5 rounded-full transition-all ${
            i === tutorialStepIdx
                ? 'w-4 bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                : (i < tutorialStepIdx ? 'bg-teal-400/70' : 'bg-white/20')
        }"></span>
    `).join('');

    const isLast = tutorialStepIdx === TUTORIAL_STEPS.length - 1;
    nextPrompt.textContent = isLast ? 'Finish & Play →' : 'Tap for Next →';

    // Position Callout Card so it never overlaps the highlighted HUD element
    requestAnimationFrame(() => {
        const cardH = card.offsetHeight || 210;
        const margin = 14;
        if (step.calloutPosition === 'top') {
            const desiredTop = Math.max(16, rect.top - cardH - margin);
            card.style.top = `${desiredTop}px`;
            card.style.bottom = 'auto';
        } else {
            const desiredTop = Math.min(
                window.innerHeight - cardH - 16,
                rect.top + rect.height + margin
            );
            card.style.top = `${Math.max(16, desiredTop)}px`;
            card.style.bottom = 'auto';
        }
    });
}

function startTutorialSequence() {
    sfx.playCardChime();
    triggerHaptic([20, 25]);

    const introOverlay = document.getElementById('intro-sequence-overlay');
    if (introOverlay) {
        introOverlay.style.opacity = '0';
        introOverlay.style.pointerEvents = 'none';
        setTimeout(() => introOverlay.classList.add('hidden'), 420);
    }

    stageTypicalTutorialBoard();
    tutorialActive = true;
    tutorialStepIdx = 0;

    const tutOverlay = document.getElementById('tutorial-overlay');
    tutOverlay.classList.remove('hidden');
    renderTutorialStep();
}

function advanceTutorialStep() {
    if (!tutorialActive) return;
    if (tutorialStepIdx < TUTORIAL_STEPS.length - 1) {
        tutorialStepIdx++;
        sfx.playTutorialStepBlip(tutorialStepIdx, false);
        triggerHaptic(15);
        renderTutorialStep();
    } else {
        sfx.playTutorialStepBlip(tutorialStepIdx, true);
        triggerHaptic([25, 30, 45]);
        finishTutorialSequence(false);
    }
}

function stepBackTutorial() {
    if (!tutorialActive || tutorialStepIdx <= 0) return;
    tutorialStepIdx--;
    sfx.playHoverTick();
    triggerHaptic(12);
    renderTutorialStep();
}

function finishTutorialSequence(returnToTitle = false) {
    tutorialActive = false;
    document.getElementById('tutorial-overlay').classList.add('hidden');

    // Reset the demonstration board back to a clean Floor 1 state
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

// Bind Tutorial Overlay tap-to-advance, Back, Skip, and Resize listeners
(function bindTutorialEvents() {
    const tutOverlay = document.getElementById('tutorial-overlay');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const skipBtn = document.getElementById('tutorial-skip-btn');

    if (tutOverlay) {
        tutOverlay.addEventListener('click', (e) => {
            if (e.target.closest('#tutorial-prev-btn') || e.target.closest('#tutorial-skip-btn')) {
                return;
            }
            advanceTutorialStep();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stepBackTutorial();
        });
    }
    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sfx.playHoverTick();
            finishTutorialSequence(true);
        });
    }
    window.addEventListener('resize', () => {
        if (tutorialActive) renderTutorialStep();
    });
})();
