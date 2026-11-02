// ============================================================================
// BINDING OF ISAAC-STYLE DELVER VESSELS & STARTING LOADOUTS (js/config/loadouts.js)
//   • 6 Asymmetrical Playable Delver Vessels ("Who Am I?"):
//       I.   The Spelunker    (Isaac — Balanced Center-Axis Explorer)
//       II.  The Bloodletter  (Judas/Azazel — High-Mana Brimstone Glass Cannon)
//       III. The Croupier     (Cain — High-Gold, Luck, Gilded Slots & Wheel Master)
//       IV.  The Bastion      (Magdalene — High-Stability Stone Fortress & Alchemist)
//       V.   The Chronomancer (Blue Baby/Keeper — Gravity Warper & Spellweaver)
//       VI.  The Paradox      (Eden — Randomized Stats, Relics, Reserves & Deck)
// ============================================================================

const LOADOUT_STORAGE_KEY = 'c4_subterranean_loadout';

const LOADOUT_ORDER = [
  'spelunker',
  'bloodletter',
  'croupier',
  'bastion',
  'chronomancer',
  'paradox'
];

const LOADOUT_CATALOG = {
  spelunker: {
    id: 'spelunker',
    numeral: 'I',
    name: 'The Spelunker',
    shortName: 'Spelunker',
    epithet: 'The Balanced Delver',
    isaacArchetype: 'Balanced All-Rounder',
    icon: '⛏️',
    accentColor: '#fbbf24',
    badgeClass: 'border-amber-500/45 bg-amber-950/75 text-amber-200',
    cardBorderClass: 'border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.22)]',
    pillActiveClass: 'border-amber-300 bg-amber-500/25 text-amber-100 ring-2 ring-amber-400/60',
    lore:
      'Equipped with a balanced mining kit, brass plumb line, and bone die. Reliable across every cavern topology with steady economy and center-column control.',
    passiveName: "Explorer's Equilibrium",
    passiveIcon: '🧭',
    passiveDesc:
      'Your first Bazaar Shop Reroll of each Act (Floors 1, 4 & 7) is FREE ($0), and your first token drop into Center Col 4 on every floor mints +$1 Bonus Gold!',
    // Stat offsets applied on top of the active Difficulty Tier baseline
    goldOffset: 0,
    maxManaOffset: 0,
    handSizeOffset: 0,
    stabilityOffset: 0,
    extraEnchantSlots: 0,
    startingGambitSlots: 1,
    // 1-5 visual pip ratings for the Isaac-style stat bars
    statPips: {
      stability: 3,
      mana: 3,
      hand: 3,
      gold: 3,
      luck: 2,
      relics: 2
    },
    starterGambits: ['plumb_bob'],
    starterReserves: ['loaded_die'],
    starterDeck: ['pebble', 'oracle_peek', 'petrified', 'pickaxe']
  },

  bloodletter: {
    id: 'bloodletter',
    numeral: 'II',
    name: 'The Bloodletter',
    shortName: 'Bloodletter',
    epithet: 'Pact of Brimstone',
    isaacArchetype: 'Glass Cannon Occultist',
    icon: '🩸',
    accentColor: '#f43f5e',
    badgeClass: 'border-rose-500/50 bg-rose-950/80 text-rose-200',
    cardBorderClass: 'border-rose-500/65 shadow-[0_0_38px_rgba(244,63,94,0.28)]',
    pillActiveClass: 'border-rose-400 bg-rose-500/25 text-rose-100 ring-2 ring-rose-400/60',
    lore:
      'Traded cavern stability and coin for forbidden sulfuric firepower. Begins with a Sulfuric Brimstone Laser and +1 Max Mana, but the ceiling is ready to collapse.',
    passiveName: 'Sanguine Harvest',
    passiveIcon: '💉',
    passiveDesc:
      'Starts with +1 Max Mana and lethal Brimstone tools at the cost of -4 Seismic Stability per floor. Shattering ANY token on the board siphons +1 Seismic Stability (up to 2× per turn)!',
    goldOffset: -2,
    maxManaOffset: 1,
    handSizeOffset: 0,
    stabilityOffset: -4,
    extraEnchantSlots: 0,
    startingGambitSlots: 1,
    statPips: {
      stability: 1,
      mana: 5,
      hand: 3,
      gold: 1,
      luck: 2,
      relics: 3
    },
    starterGambits: ['jalapeno_overdrive'],
    starterReserves: ['jalapeno_bomb', 'cave_bat'],
    starterDeck: ['leech_lancet', 'leech_lancet', 'hibachi', 'brimstone_beam']
  },

  croupier: {
    id: 'croupier',
    numeral: 'III',
    name: 'The Croupier',
    shortName: 'Croupier',
    epithet: 'High-Roller Fortune',
    isaacArchetype: 'Luck & Casino Hustler',
    icon: '🎰',
    accentColor: '#10b981',
    badgeClass: 'border-emerald-500/50 bg-emerald-950/80 text-emerald-200',
    cardBorderClass: 'border-emerald-400/65 shadow-[0_0_38px_rgba(16,185,129,0.25)]',
    pillActiveClass: 'border-emerald-300 bg-emerald-500/25 text-emerald-100 ring-2 ring-emerald-400/60',
    lore:
      'An underground Pit Boss who rigs the cavern board with Gilded Slots, loaded dice, and counterfeit coins. Thrives on high-rolling economy and Wheel of Fate spins.',
    passiveName: 'House Edge',
    passiveIcon: '🎡',
    passiveDesc:
      "Starts with +$6 Gold, +2 Enchanted Slots/floor, and 2 Gambit Slots. Grants 2 FREE Spins on the Wheel of Fate every floor (instead of 1), and boosts Fool's Penny jackpot odds to 80%!",
    goldOffset: 6,
    maxManaOffset: 0,
    handSizeOffset: 0,
    stabilityOffset: -2,
    extraEnchantSlots: 2,
    startingGambitSlots: 2,
    statPips: {
      stability: 2,
      mana: 3,
      hand: 3,
      gold: 5,
      luck: 5,
      relics: 4
    },
    starterGambits: ['amber_flea', 'lucky_rabbit_paw'],
    starterReserves: ['fools_penny', 'fools_penny', 'loaded_die'],
    starterDeck: ['loaded_knucklebones', 'loaded_knucklebones', 'divining_wishbone', 'croupier_jackpot']
  },

  bastion: {
    id: 'bastion',
    numeral: 'IV',
    name: 'The Bastion',
    shortName: 'Bastion',
    epithet: 'Tectonic Juggernaut',
    isaacArchetype: 'Fortress Tank & Stone Alchemist',
    icon: '🛡️',
    accentColor: '#38bdf8',
    badgeClass: 'border-sky-500/50 bg-sky-950/80 text-sky-200',
    cardBorderClass: 'border-sky-400/65 shadow-[0_0_38px_rgba(56,189,248,0.25)]',
    pillActiveClass: 'border-sky-300 bg-sky-500/25 text-sky-100 ring-2 ring-sky-400/60',
    lore:
      'An unshakeable Dwarven warden who enters the cavern penniless, but commands +5 Seismic Stability, +1 Hand Size, and the Universal Alkahest Vial to dissolve stone into gold.',
    passiveName: 'Bedrock Fortitude',
    passiveIcon: '🪨',
    passiveDesc:
      'Starts with +5 Seismic Stability every floor and +1 Hand Size, but $0 Starting Gold. Pre-spawns 1 Petrified Stone each floor, and shattering ANY token mints +$1 bonus Gold!',
    goldOffset: -99, // Clamped to $0 start
    maxManaOffset: 0,
    handSizeOffset: 1,
    stabilityOffset: 5,
    extraEnchantSlots: 0,
    startingGambitSlots: 1,
    statPips: {
      stability: 5,
      mana: 3,
      hand: 4,
      gold: 1,
      luck: 2,
      relics: 3
    },
    starterGambits: ['alkahest_vial'],
    starterReserves: ['anvil', 'anvil', 'acid_slug'],
    starterDeck: ['petrified', 'petrified', 'pickaxe', 'tectonic_anchor', 'mimic_tooth']
  },

  chronomancer: {
    id: 'chronomancer',
    numeral: 'V',
    name: 'The Chronomancer',
    shortName: 'Chronomancer',
    epithet: 'Surrealist Savant',
    isaacArchetype: 'Gravity & Combo Tactician',
    icon: '🕰️',
    accentColor: '#c084fc',
    badgeClass: 'border-purple-500/50 bg-purple-950/80 text-purple-200',
    cardBorderClass: 'border-purple-400/65 shadow-[0_0_38px_rgba(192,132,252,0.26)]',
    pillActiveClass: 'border-purple-300 bg-purple-500/25 text-purple-100 ring-2 ring-purple-400/60',
    lore:
      'Bends column polarity, flips gravity stacks, and sees exact Grandmaster AI evaluations from Floor 1. Fragile under pressure, but deadly when chaining discounted spells.',
    passiveName: 'Temporal Weaver',
    passiveIcon: '🌀',
    passiveDesc:
      'Starts with +1 Max Mana, +1 Hand Size, and 2 Relic Slots (Dalí Clock + Copper Retort) at -3 Stability. Casting your first Arcane Card each floor restores +1 Seismic Stability!',
    goldOffset: 1,
    maxManaOffset: 1,
    handSizeOffset: 1,
    stabilityOffset: -3,
    extraEnchantSlots: 1,
    startingGambitSlots: 2,
    statPips: {
      stability: 2,
      mana: 5,
      hand: 4,
      gold: 3,
      luck: 4,
      relics: 4
    },
    starterGambits: ['dali_clock', 'copper_retort'],
    starterReserves: ['quicksilver_glob'],
    starterDeck: ['inversion', 'lodestone', 'mercury_siphon', 'oracle_peek', 'oracle_peek']
  },

  paradox: {
    id: 'paradox',
    numeral: 'VI',
    name: 'The Paradox',
    shortName: 'Paradox',
    epithet: 'Shifting Anomaly',
    isaacArchetype: 'Eden • Randomized Vessel',
    icon: '🎲',
    accentColor: '#e879f9',
    badgeClass: 'border-fuchsia-500/50 bg-fuchsia-950/80 text-fuchsia-200',
    cardBorderClass: 'border-fuchsia-400/65 shadow-[0_0_38px_rgba(232,121,249,0.28)]',
    pillActiveClass: 'border-fuchsia-300 bg-fuchsia-500/25 text-fuchsia-100 ring-2 ring-fuchsia-400/60',
    lore:
      'A shifting rift in the subterranean bedrock. Every run materializes a completely randomized stat profile, 2 random Gambit Relics, 2 Reserve Tokens, and 5 Arcane Cards.',
    passiveName: 'Prismatic Anomaly',
    passiveIcon: '✨',
    passiveDesc:
      'Every seed rolls randomized stats, 2 Relics, 2 Reserves & 5 Cards across all tiers! Plus, at the start of every floor, 1 random Enchanted Slot upgrades into a Wild Amplifier Slot!',
    goldOffset: 0,
    maxManaOffset: 0,
    handSizeOffset: 0,
    stabilityOffset: 0,
    extraEnchantSlots: 1,
    startingGambitSlots: 2,
    statPips: {
      stability: 3,
      mana: 4,
      hand: 4,
      gold: 3,
      luck: 4,
      relics: 4
    },
    starterGambits: [],
    starterReserves: [],
    starterDeck: []
  }
};

// Holds the currently rolled Paradox (Eden) preview/run kit so the player can
// inspect it on the Character Select screen or reroll it on demand.
let activeParadoxRoll = null;

function pickRandomFromArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollParadoxLoadoutSeed() {
  const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seedCode = '';
  for (let i = 0; i < 6; i++) {
    seedCode += codeChars[Math.floor(Math.random() * codeChars.length)];
    if (i === 2) seedCode += '-';
  }

  const goldOffset = Math.floor(Math.random() * 9) - 2;       // -2 to +6
  const maxManaOffset = Math.random() < 0.55 ? 1 : 0;         // +0 or +1
  const handSizeOffset = Math.random() < 0.5 ? 1 : 0;         // +0 or +1
  const stabilityOffset = Math.floor(Math.random() * 8) - 3;  // -3 to +4
  const extraEnchantSlots = Math.floor(Math.random() * 3);    // +0 to +2

  const gambitKeys = typeof GAMBIT_CATALOG !== 'undefined' ? Object.keys(GAMBIT_CATALOG) : ['obsidian_cat', 'amber_flea'];
  const reserveKeys = typeof RESERVE_CATALOG !== 'undefined' ? Object.keys(RESERVE_CATALOG) : ['loaded_die', 'anvil'];
  const cardKeys = typeof CARD_CATALOG !== 'undefined'
    ? Object.keys(CARD_CATALOG).filter((k) => k !== 'dead_weight')
    : ['pebble', 'oracle_peek', 'petrified', 'pickaxe'];

  // Pick 2 distinct random Gambits
  const shuffledGambits = gambitKeys.slice().sort(() => Math.random() - 0.5);
  const starterGambits = shuffledGambits.slice(0, 2);

  // Pick 2 random Reserve Tokens
  const starterReserves = [
    pickRandomFromArray(reserveKeys) || 'loaded_die',
    pickRandomFromArray(reserveKeys) || 'anvil'
  ];

  // Pick 5 random Arcane Cards (at least 2 from Tier 1 so low-mana turns are always playable)
  const tier1Cards = cardKeys.filter((k) => !CARD_CATALOG[k] || (CARD_CATALOG[k].tier || 1) === 1);
  const starterDeck = [
    pickRandomFromArray(tier1Cards) || 'pebble',
    pickRandomFromArray(tier1Cards) || 'oracle_peek',
    pickRandomFromArray(cardKeys) || 'petrified',
    pickRandomFromArray(cardKeys) || 'pickaxe',
    pickRandomFromArray(cardKeys) || 'loaded_knucklebones'
  ];

  activeParadoxRoll = {
    seedCode,
    goldOffset,
    maxManaOffset,
    handSizeOffset,
    stabilityOffset,
    extraEnchantSlots,
    startingGambitSlots: 2,
    starterGambits,
    starterReserves,
    starterDeck,
    statPips: {
      stability: Math.max(1, Math.min(5, 3 + Math.round(stabilityOffset / 2))),
      mana: Math.max(2, Math.min(5, 3 + maxManaOffset * 2)),
      hand: Math.max(2, Math.min(5, 3 + handSizeOffset)),
      gold: Math.max(1, Math.min(5, 3 + Math.round(goldOffset / 2))),
      luck: Math.max(2, Math.min(5, 2 + extraEnchantSlots)),
      relics: 4
    }
  };

  if (typeof state !== 'undefined' && state) {
    state.paradoxRoll = activeParadoxRoll;
  }

  return activeParadoxRoll;
}

function getActiveParadoxRoll() {
  if (typeof state !== 'undefined' && state && state.paradoxRoll && state.paradoxRoll.seedCode) {
    activeParadoxRoll = state.paradoxRoll;
    return activeParadoxRoll;
  }
  if (!activeParadoxRoll) {
    return rollParadoxLoadoutSeed();
  }
  return activeParadoxRoll;
}

function getActiveLoadoutId() {
  if (typeof state !== 'undefined' && state && state.loadoutId && LOADOUT_CATALOG[state.loadoutId]) {
    return state.loadoutId;
  }
  return 'spelunker';
}

function getActiveLoadout() {
  const id = getActiveLoadoutId();
  return LOADOUT_CATALOG[id] || LOADOUT_CATALOG.spelunker;
}

function getResolvedLoadoutKit(loadoutId = getActiveLoadoutId(), diffId = (typeof state !== 'undefined' && state ? state.difficulty : 'MEDIUM')) {
  const baseLoadout = LOADOUT_CATALOG[loadoutId] || LOADOUT_CATALOG.spelunker;
  const diff = (typeof DIFFICULTY_TIERS !== 'undefined' && DIFFICULTY_TIERS[diffId])
    ? DIFFICULTY_TIERS[diffId]
    : (typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : {
        startingGold: 3,
        startingMaxMana: 1,
        startingHandSize: 2,
        stabilityOffset: 0,
        extraEnchantedSlots: 0,
        starterGambitId: null
      });

  const isParadox = baseLoadout.id === 'paradox';
  const source = isParadox ? getActiveParadoxRoll() : baseLoadout;

  const goldOffset = source.goldOffset || 0;
  const maxManaOffset = source.maxManaOffset || 0;
  const handSizeOffset = source.handSizeOffset || 0;
  const stabilityOffset = source.stabilityOffset || 0;
  const extraEnchantSlots = source.extraEnchantSlots || 0;

  // Compute concrete starting values on Floor 1
  const minGold = baseLoadout.id === 'bastion' ? 0 : (isParadox ? 0 : 1);
  const startingGold = baseLoadout.id === 'bastion'
    ? 0
    : Math.max(minGold, (diff.startingGold ?? 3) + goldOffset);

  const startingMaxMana = Math.max(1, Math.min(5, (diff.startingMaxMana ?? 1) + maxManaOffset));
  const startingHandSize = Math.max(1, Math.min(5, (diff.startingHandSize ?? 2) + handSizeOffset));
  const floor1Stability = Math.max(6, 15 + (diff.stabilityOffset || 0) + stabilityOffset);
  const startingEnchantSlots = Math.max(1, 1 + (diff.extraEnchantedSlots || 0) + extraEnchantSlots);

  // Merge starter Gambits (including Easy mode's bonus obsidian_cat if not already present)
  const gambits = Array.isArray(source.starterGambits) ? [...source.starterGambits] : [];
  if (diff.starterGambitId && !gambits.includes(diff.starterGambitId)) {
    gambits.push(diff.starterGambitId);
  }
  const startingGambitSlots = Math.max(source.startingGambitSlots || 1, gambits.length);

  const reserves = Array.isArray(source.starterReserves) ? [...source.starterReserves] : [];
  const deck = Array.isArray(source.starterDeck) && source.starterDeck.length > 0
    ? [...source.starterDeck]
    : ['pebble', 'oracle_peek', 'petrified', 'pickaxe'];

  return {
    loadout: baseLoadout,
    isParadox,
    seedCode: isParadox ? source.seedCode : null,
    goldOffset,
    maxManaOffset,
    handSizeOffset,
    stabilityOffset,
    extraEnchantSlots,
    startingGold,
    startingMaxMana,
    startingHandSize,
    floor1Stability,
    startingEnchantSlots,
    startingGambitSlots,
    gambits,
    reserves,
    deck,
    statPips: source.statPips || baseLoadout.statPips
  };
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    LOADOUT_STORAGE_KEY,
    LOADOUT_ORDER,
    LOADOUT_CATALOG,
    rollParadoxLoadoutSeed,
    getActiveParadoxRoll,
    getActiveLoadoutId,
    getActiveLoadout,
    getResolvedLoadoutKit
  });
}


const LOADOUT_LORE_OVERRIDES = {
  spelunker: {
    loreSummary: 'A steady, well-rounded delver carrying a brass plumb line, bone die, and trusty mining tools.',
    lorePassiveDesc: '“True north.” First shop reroll each Act is free, and your first center-column drop each floor mints bonus gold.'
  },
  bloodletter: {
    loreSummary: 'A fragile occultist who traded ceiling stability and coin for blood-magic and a Brimstone laser.',
    lorePassiveDesc: '“Blood for stone.” Starts with extra mana under a fragile ceiling; shattering pieces siphons stability back.'
  },
  croupier: {
    loreSummary: 'A high-rolling underground pit boss who enters with deep pockets, lucky charms, and rigged dice.',
    lorePassiveDesc: '“House advantage.” Grants two free Wheel of Fate spins per floor and tips counterfeit coin flips in your favor.'
  },
  bastion: {
    loreSummary: 'An unshakeable stone-warden who enters penniless, but commands a massive ceiling and alchemical stone-solvent.',
    lorePassiveDesc: '“Heart of bedrock.” Begins each floor with a stone blocker on the board and mints gold whenever any piece shatters.'
  },
  chronomancer: {
    loreSummary: 'A surrealist time-weaver who bends column gravity, chains spells, and reads the opponent’s mind.',
    lorePassiveDesc: '“Borrowed time.” Discounts spatial-warp spells and steadies the cavern roof on your first spell each floor.'
  },
  paradox: {
    loreSummary: 'A shifting anomaly in the dark—every delve materializes an unpredictable body, relics, and spellbook.',
    lorePassiveDesc: '“Ever-changing vessel.” Rolls random gifts each seed and blesses one board ring per floor into a Wild Amplifier.'
  }
};
for (const [id, data] of Object.entries(LOADOUT_LORE_OVERRIDES)) {
  if (LOADOUT_CATALOG[id]) Object.assign(LOADOUT_CATALOG[id], data);
}
