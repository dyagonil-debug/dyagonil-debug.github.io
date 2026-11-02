// ============================================================================
// CENTRAL RUN STATE & CONSUMABLE DECK STOCKPILE ENGINE (js/state/gameState.js)
// ============================================================================
const STARTER_DECK_IDS = ['pebble', 'petrified', 'oracle_peek', 'pickaxe'];

const state = {
  floorIdx: 0,
  difficulty: 'MEDIUM',
  loadoutId: 'spelunker',
  paradoxRoll: null,
  freeRerollsRemaining: 1,
  firstCol4DropDoneThisFloor: false,
  firstCardCastDoneThisFloor: false,
  bloodletterHealCountThisTurn: 0,
  gold: 3,
  stability: 15,
  board: [],
  boardMask: [],
  currentTopology: null,
  shuffledTopologyPool: [],
  enchantGrid: [], // Stores ENCHANT_TYPES per (r, c)
  persistentEnchantCount: 1, // Starts at 1 slot on Floor 1 and scales up
  meshes: [],
  turn: PLAYER,
  turnNumber: 1,
  busy: false,
  gameOver: false,
  lastActionWasDrop: false,
  lastPlayedCell: null,

  previewCol: -1,
  lastDroppedCols: [],       // Tracks ascending Coaster Apex Momentum combo
  shatterCounter: 0,         // Tracks Jalapeño Pepperoni Overdrive
  shroomDropCounter: 0,      // Tracks Oddly Shrinking Cave Shroom every-3rd-drop squeak
  dynamoDropCounter: 0,      // Tracks Tectonic Mana Dynamo every-3rd-drop overcharge
  cardsCastThisTurn: 0,      // Tracks Alchemical Forge Bellows 2-card spellweaver refund
  bellowsTriggeredThisTurn: false,

  // Shuffled Tiered Boss Pool (Act I Easy -> Act II Medium -> Act III Hard) & Multi-Phase Boss Health
  shuffledBossPool: [],
  bossHp: 1,
  bossMaxHp: 1,
  bossMarkedCol: 3,

  // Progression & Boss-Gated Shop Tier Unlocks
  //   • unlockedShopTier = 1 on Floors 1–3 (Act I before defeating Boss 1)
  //   • unlockedShopTier = 2 unlocked immediately upon defeating Boss 1 (Floor 3)
  //   • unlockedShopTier = 3 unlocked immediately upon defeating Boss 2 (Floor 6)
  unlockedShopTier: 1,
  maxMana: 1,
  mana: 1,
  handSize: 2,
  maxGambitSlots: 1,
  reservePouchUnlocked: false,
  highTierCardsUnlocked: false,

  // Consumable Card Stockpile
  masterDeck: [...STARTER_DECK_IDS],
  drawPile: [],
  hand: [],
  discardPile: [],
  selectedCardIdx: null,

  // Tactical Reserve Pouch
  reservePouch: [],
  selectedReserveIdx: null,

  // Active Synergistic Gambits
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

let activeDebugTopologyOverride = null;
let activeDebugBossOverride = null;

function createDefaultFloorModifiers() {
  return {
    bonusMana: 0,
    bonusStability: 0,
    bonusEnchantSlots: 0,
    caveInStones: 0,
    aiHeadstartTokens: 0
  };
}

function initNewRun() {
  activeDebugTopologyOverride = null;
  activeDebugBossOverride = null;
  const diff = getActiveDifficulty();
  if (!state.loadoutId || (typeof LOADOUT_CATALOG !== 'undefined' && !LOADOUT_CATALOG[state.loadoutId])) {
    state.loadoutId = 'spelunker';
  }
  const kit = (typeof getResolvedLoadoutKit === 'function')
    ? getResolvedLoadoutKit(state.loadoutId, state.difficulty)
    : null;

  state.floorIdx = 0;
  state.gold = kit ? kit.startingGold : diff.startingGold;
  state.persistentEnchantCount = kit ? kit.startingEnchantSlots : (1 + (diff.extraEnchantedSlots || 0));
  state.unlockedShopTier = 1;
  state.maxMana = kit ? kit.startingMaxMana : diff.startingMaxMana;
  state.mana = state.maxMana;
  state.handSize = kit ? kit.startingHandSize : (diff.startingHandSize || 2);
  state.gambits = kit ? [...kit.gambits] : (diff.starterGambitId ? [diff.starterGambitId] : []);
  state.maxGambitSlots = kit ? Math.max(kit.startingGambitSlots || 1, state.gambits.length) : 1;
  state.reservePouch = kit ? [...kit.reserves] : [];
  state.reservePouchUnlocked = state.reservePouch.length > 0;
  state.highTierCardsUnlocked = false;

  state.masterDeck = kit ? [...kit.deck] : [...STARTER_DECK_IDS];
  state.freeRerollsRemaining = state.loadoutId === 'spelunker' ? 1 : 0;
  state.firstCol4DropDoneThisFloor = false;
  state.firstCardCastDoneThisFloor = false;
  state.bloodletterHealCountThisTurn = 0;

  const easyPick = shuffle(BOSS_POOLS_BY_ACT.EASY)[0];
  const mediumPick = shuffle(BOSS_POOLS_BY_ACT.MEDIUM)[0];
  const hardPick = shuffle(BOSS_POOLS_BY_ACT.HARD)[0];
  state.shuffledBossPool = [easyPick, mediumPick, hardPick];
  state.shuffledTopologyPool = shuffle(BOARD_TOPOLOGIES);

  state.nextFloorModifiers = createDefaultFloorModifiers();
  if (typeof updateDifficultyUI === 'function') {
    updateDifficultyUI();
  }
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
// BOSS-GATED SHOP TIER SYSTEM & CONSUMABLE DECK STOCKPILE ENGINE
//   • Act I (Before Boss 1 is defeated): Max Tier = 1
//   • Act II (After Boss 1 on Floor 3 is defeated): Max Tier = 2
//   • Act III (After Boss 2 on Floor 6 is defeated): Max Tier = 3
// ============================================================================
function isStackableCurseCard(cardId) {
  return cardId === 'dead_weight';
}

function playerOwnsCard(cardId) {
  return Array.isArray(state.masterDeck) && state.masterDeck.includes(cardId);
}

function countCardCopiesInInventory(cardId) {
  if (!cardId || !Array.isArray(state.masterDeck)) return 0;
  return state.masterDeck.filter((id) => id === cardId).length;
}

function getExplicitItemTier(entry, fallback = 1) {
  return (entry && typeof entry.tier === 'number') ? entry.tier : fallback;
}

function getMaxAllowedShopTier() {
  // Floor-based floor minimum for mid-run checkpoints or debug jumps:
  // Floors 1-3 (idx 0..2) start at Tier 1; Floors 4-6 (idx 3..5) are post-Boss 1 (Tier 2); Floors 7-9 (idx 6..8) are post-Boss 2 (Tier 3)
  const floorMinTier = state.floorIdx >= 6 ? 3 : (state.floorIdx >= 3 ? 2 : 1);
  const explicitTier = typeof state.unlockedShopTier === 'number' ? state.unlockedShopTier : 1;
  const highTierFlag = state.highTierCardsUnlocked ? 3 : 1;
  return Math.min(3, Math.max(1, floorMinTier, explicitTier, highTierFlag));
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
    if (state.hand.length >= maxHandCap || state.drawPile.length === 0) break;
    const cardId = state.drawPile.pop();
    if (cardId) state.hand.push(cardId);
  }
  if (typeof updateHUD === 'function') {
    updateHUD();
  }
}
