// ============================================================================
// CENTRAL RUN STATE & CONSUMABLE DECK STOCKPILE ENGINE (js/state/gameState.js)
// ============================================================================

// ============================================================================
// 5. RUN STATE & GAMBONANZA PROGRESSION DATA
// ============================================================================
const state = {
    floorIdx: 0,
    gold: 3,
    stability: 15,
    board: [],
    boardMask: [],
    currentTopology: null,
    shuffledTopologyPool: [],
    enchantGrid: [], // Stores ENCHANT_TYPES per (r, c)
    persistentEnchantCount: 1, // Starts humble (1 slot on Floor 1) and scales up!
    meshes: [],
    turn: PLAYER,
    turnNumber: 1,
    busy: false,
    gameOver: false,

    previewCol: -1,
    lastDroppedCols: [], // Tracks ascending Coaster Apex Momentum combo
    shatterCounter: 0,   // Tracks Jalapeño Pepperoni Overdrive
    shroomDropCounter: 0, // Tracks Oddly Shrinking Cave Shroom every-3rd-drop squeak

    // Shuffled Tiered Boss Pool (Act I Easy -> Act II Medium -> Act III Hard) & Multi-Phase Boss Health
    shuffledBossPool: [],
    bossHp: 1,
    bossMaxHp: 1,
    bossMarkedCol: 3,

    // Slowed Progression Unlocks (Earned via Boss Milestones or Bazaar Upgrades)
    maxMana: 1,           // Starts at 1 Mana on Floor 1!
    mana: 1,
    handSize: 2,          // Starts drawing 2 cards on Floor 1!
    maxGambitSlots: 1,    // Starts with 1 Gambit slot capacity (0 equipped)
    reservePouchUnlocked: false, // Unlocks after defeating First Boss (Floor 3) or buying in Bazaar
    highTierCardsUnlocked: false, // Unlocks after Boss 1 / Boss 2

    // Humble Starter Deck (3 simple cards)
    masterDeck: ['pebble', 'petrified', 'oracle_peek', 'sinkhole_chute'],
    drawPile: [],
    hand: [],
    discardPile: [],
    selectedCardIdx: null,

    // Tactical Reserve Pouch (Starts empty; earned mid-run)
    reservePouch: [],
    selectedReserveIdx: null,

    // Active Synergistic Gambits (Starts empty on Floor 1 so relics feel earned!)
    gambits: [],
    catNineLivesUsed: false,

    showTelemetry: true,
    rouletteSpinsThisFloor: 0,
    nextFloorModifiers: {
        bonusMana: 0,
        bonusStability: 0,
        bonusEnchantSlots: 0,
        caveInStones: 0,
        aiHeadstartTokens: 0
    },
    shopItems: [],
    pendingVictoryPayout: { totalEarned: 0, speedBonus: 0 }
};

function initNewRun() {
    activeDebugTopologyOverride = null;
    activeDebugBossOverride = null;
    const diff = getActiveDifficulty();
    state.floorIdx = 0;
    state.gold = diff.startingGold;
    state.persistentEnchantCount = 1 + (diff.extraEnchantedSlots || 0);
    state.maxMana = diff.startingMaxMana;
    state.mana = diff.startingMaxMana;
    state.handSize = diff.startingHandSize || 2;
    state.maxGambitSlots = 1;
    state.reservePouchUnlocked = false;
    state.highTierCardsUnlocked = false;

    // Humble 3-card starter deck; Glowworm Grotto (Easy) starts with Obsidian Cat Figurine
    state.masterDeck = ['pebble', 'petrified', 'oracle_peek', 'sinkhole_chute'];
    state.reservePouch = [];
    state.gambits = diff.starterGambitId ? [diff.starterGambitId] : [];

    // Draw 1 Boss from each difficulty pool: Easy for Fight 1 (F3), Medium for Fight 2 (F6), Hard for Fight 3 (F9)!
    const easyPick = shuffle(BOSS_POOLS_BY_ACT.EASY)[0];
    const mediumPick = shuffle(BOSS_POOLS_BY_ACT.MEDIUM)[0];
    const hardPick = shuffle(BOSS_POOLS_BY_ACT.HARD)[0];
    state.shuffledBossPool = [easyPick, mediumPick, hardPick];
    state.shuffledTopologyPool = shuffle(BOARD_TOPOLOGIES);

    state.nextFloorModifiers = {
        bonusMana: 0,
        bonusStability: 0,
        bonusEnchantSlots: 0,
        caveInStones: 0,
        aiHeadstartTokens: 0
    };
    updateDifficultyUI();
}

function hasGambit(id) {
    return state.gambits.includes(id);
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


// ============================================================================
// ONE-TIME CONSUMABLE CARD INVENTORY & STOCKPILE DECK ENGINE
//   • Duplicate copies of any card are allowed and can be stockpiled into the deck.
//   • Max hand size (state.handSize, up to 5) governs how many cards you can hold at once.
//   • Once a card is cast/consumed, that copy is permanently expended and never replenished.
// ============================================================================
function isStackableCurseCard(cardId) {
    return cardId === 'dead_weight';
}

function countCardCopiesInInventory(cardId) {
    if (!cardId || !Array.isArray(state.masterDeck)) return 0;
    return state.masterDeck.filter(id => id === cardId).length;
}

function addCardToStockpile(cardId) {
    if (!cardId || !CARD_CATALOG[cardId]) return false;
    state.masterDeck.push(cardId);
    return true;
}

function consumeHandCardCopy(handIdx) {
    if (handIdx === null || handIdx === undefined || handIdx < 0 || handIdx >= state.hand.length) return null;
    const [usedCardId] = state.hand.splice(handIdx, 1);
    if (usedCardId && Array.isArray(state.masterDeck)) {
        const masterIdx = state.masterDeck.indexOf(usedCardId);
        if (masterIdx !== -1) {
            state.masterDeck.splice(masterIdx, 1);
        }
    }
    return usedCardId;
}

function drawCards(count) {
    const maxHandCap = Math.min(5, Math.max(1, state.handSize || 2));
    for (let i = 0; i < count; i++) {
        if (state.hand.length >= maxHandCap) break;
        if (state.drawPile.length === 0) break; // Consumable stockpile: no discard reshuffle!
        const cardId = state.drawPile.pop();
        if (cardId) state.hand.push(cardId);
    }
    updateHUD();
}

let activeDebugTopologyOverride = null;
let activeDebugBossOverride = null;
