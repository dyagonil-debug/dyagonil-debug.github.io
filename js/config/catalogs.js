// ============================================================================
// CARDS, ROULETTE WEDGES, RESERVES, GAMBITS, ENCHANTS & BOSS POOLS (js/config/catalogs.js)
// ============================================================================

const CARD_CATALOG = {
    pebble: {
        id: 'pebble',
        name: 'Cavern Pebble Nudge',
        cost: 1,
        price: 5,
        tier: 1,
        icon: '🪨',
        shortDesc: 'Starter: +1 Stability & +$1 Gold on Col.',
        desc: 'Humble Starter Technique: Reinforce a column\'s footing to gain +1 Seismic Stability and +$1 Gold.'
    },
    oracle_peek: {
        id: 'oracle_peek',
        name: 'Oracle\'s Lantern',
        cost: 0,
        price: 5,
        tier: 1,
        icon: '🏮',
        shortDesc: '0M Starter: Draw 1 card & +1 Stability.',
        desc: 'Illuminate the cavern: costs 0 Mana! Draw 1 card from your deck and restore +1 Seismic Stability.'
    },
    petrified: {
        id: 'petrified',
        name: 'Petrified Wood Block',
        cost: 1,
        price: 6,
        tier: 1,
        icon: '🪵',
        shortDesc: 'Drop neutral carved stone blocker.',
        desc: 'Drop a neutral carved stone blocker into a column that blocks 4-in-a-row lines.'
    },
    pickaxe: {
        id: 'pickaxe',
        name: "Spelunker's Pickaxe",
        cost: 1,
        price: 7,
        tier: 1,
        icon: '⛏️',
        shortDesc: 'Shatter ALL Petrified Stone in a col!',
        desc: 'Swing a heavy iron mining pickaxe down a target column! Shatters EVERY neutral Petrified Stone token in that column, compacting remaining tokens downward.'
    },
    tectonic_anchor: {
        id: 'tectonic_anchor',
        name: 'Tectonic Anchor',
        cost: 1,
        price: 7,
        tier: 1,
        icon: '⏳',
        shortDesc: '+3 Stability & Gilds next slot in col!',
        desc: 'Reinforce the cavern ceiling for +3 Seismic Stability turns and enchant the next open slot in the target column into a Gilded Slot (+$3 Gold)!'
    },
    sinkhole_chute: {
        id: 'sinkhole_chute',
        name: 'Subterranean Trapdoor',
        cost: 1,
        price: 8,
        tier: 1,
        icon: '🕳️',
        shortDesc: 'Drop 3 bottom tokens out of board! (Min 3)',
        desc: 'Unbolt a subterranean trapdoor beneath the board! Shakes the cavern and causes 3 random tokens in the bottom row (pulling from higher rows if needed) to fall out of the bottom, shifting their columns down. Unusable if fewer than 3 tokens are in play.'
    },
    lodestone: {
        id: 'lodestone',
        name: 'Lodestone Polarity',
        cost: 1,
        price: 8,
        tier: 2,
        icon: '🧲',
        shortDesc: 'Float your tokens to top of column stack!',
        desc: 'Magnetically pull all of your Amber and Wild tokens in a column to the top of its stack while sinking AI and Petrified Stone pieces to the bottom!'
    },
    alchemy_crucible: {
        id: 'alchemy_crucible',
        name: 'Alchemical Crucible',
        cost: 1,
        price: 9,
        tier: 2,
        icon: '⚗️',
        shortDesc: 'Shatter top AI/Stone -> +$2 & Wild Slot!',
        desc: 'Dissolve the topmost AI or Petrified Stone blocker in a column! Awards +$2 Gold, triggers shatter synergies, and leaves a glowing Wild Amplifier Slot in its place.'
    },
    inversion: {
        id: 'inversion',
        name: 'Gravity Inversion',
        cost: 2,
        price: 9,
        tier: 2,
        icon: '🌀',
        shortDesc: 'Flip all tokens in a column upside down.',
        desc: 'Invert gravity in a target column, flipping the entire vertical stack of tokens upside down.'
    },
    transmute: {
        id: 'transmute',
        name: 'Surrealist Transmute',
        cost: 2,
        price: 11,
        tier: 2,
        icon: '✨',
        shortDesc: 'Convert top token into your color.',
        desc: 'Warp reality to convert the topmost token of a chosen column into your warm amber token.'
    },
    hibachi: {
        id: 'hibachi',
        name: 'Spicy Miso Hibachi Flare',
        cost: 1,
        price: 9,
        tier: 2,
        icon: '🍜',
        shortDesc: 'Shatter top AI token & +2 Stability.',
        desc: 'Sear a column with hibachi fire: shatters the top token if it belongs to the AI and restores +2 Seismic Stability.'
    },
    echo_drop: {
        id: 'echo_drop',
        name: 'Subterranean Echo Drop',
        cost: 2,
        price: 11,
        tier: 2,
        icon: '♊',
        shortDesc: 'High-Tier: Drop 2 Player tokens in 1 col!',
        desc: 'High-Tier Mastery: Instantly drop TWO of your amber tokens stacked into the target column!'
    },
    mirror_shard: {
        id: 'mirror_shard',
        name: 'Prismatic Mirror Shard',
        cost: 2,
        price: 11,
        tier: 2,
        icon: '🪞',
        shortDesc: 'Clone top Player token upward as WILD!',
        desc: 'Reflect your topmost Player or Wild token in a column into the empty space directly above it as a Wild Prismatic Token!'
    },
    abyssal_upheaval: {
        id: 'abyssal_upheaval',
        name: 'Abyssal Upheaval',
        cost: 2,
        price: 11,
        tier: 2,
        icon: '🔄',
        shortDesc: 'Flip ENTIRE board 180° & invert all cols!',
        desc: 'Physically flip the entire 3D cavern board 180° upside down! Inverts procedural board geometry, Enchanted Slots, and all token stacks, causing every piece to plunge into its new inverted position.'
    },
    jar_of_flies: {
        id: 'jar_of_flies',
        name: 'Suspicious Jar of Cave Flies',
        cost: 1,
        price: 5,
        tier: 1,
        icon: '🪰',
        shortDesc: 'Tier 1 RNG: 50% eat AI piece / 50% backfire!',
        desc: 'Tier 1 Jokey Gamble: Uncork a buzzing jar of blind cave flies! 50% chance they devour a random AI token and cough up +$2 Gold; 50% chance they get confused and drop a neutral Petrified Stone into your chosen column!'
    },
    brimstone_beam: {
        id: 'brimstone_beam',
        name: 'Sulfuric Brimstone Laser',
        cost: 3,
        price: 14,
        tier: 3,
        icon: '🩸',
        shortDesc: 'Tier 3: Vaporize ALL AI & Stone in a col!',
        desc: 'Tier 3 Late-Game Mastery: Fire a subterranean blood-sulfur laser down an entire column! Vaporizes EVERY AI and Petrified Stone token in that column while leaving your Player & Wild tokens untouched to compact at the bottom!'
    },
    dead_weight: {
        id: 'dead_weight',
        name: 'Dead Weight Stone',
        cost: 1,
        price: 2,
        tier: 0,
        icon: '🪨',
        shortDesc: 'CURSE: Spend 1M on any col to exhaust.',
        desc: 'Cursed Stone from the Wheel of Fate: clutters your hand! Cast on any column for 1 Mana to permanently banish it from your deck.'
    }
};

// Wheel of Subterranean Fate Pockets (Alternating High-Reward Blessings & High-Risk Curses)
const ROULETTE_WEDGES = [
    {
        id: 'jackpot_hoard',
        name: 'Jackpot Hoard',
        shortLabel: '+$15 & Wild',
        icon: '👑',
        isCurse: false,
        color: '#d97706',
        accent: '#fde047',
        desc: 'JACKPOT BLESSING! Grants +$15 Gold Coins and +1 Wild Prismatic Reserve Token!'
    },
    {
        id: 'pickpocket_gremlin',
        name: 'Pickpocket Gremlin',
        shortLabel: '-50% Gold',
        icon: '👺',
        isCurse: true,
        color: '#881337',
        accent: '#fb7185',
        desc: 'CURSED HAZARD! A subterranean gremlin ambushes your pouch and steals 50% of your current Gold!'
    },
    {
        id: 'relic_vault',
        name: 'Relic Vault',
        shortLabel: 'Free Gambit',
        icon: '🏺',
        isCurse: false,
        color: '#0d9488',
        accent: '#5eead4',
        desc: 'VAULT BLESSING! Unlocks a random unowned Synergistic Gambit Relic (or +$10 Gold if full)!'
    },
    {
        id: 'cave_in_hazard',
        name: 'Cave-In Hazard',
        shortLabel: '3 Stones & -2🌋',
        icon: '☄️',
        isCurse: true,
        color: '#7f1d1d',
        accent: '#f87171',
        desc: 'CURSED HAZARD! Next floor starts with 3 Petrified Stone Blocks dropped into random columns & -2 Seismic Stability!'
    },
    {
        id: 'arcane_surge',
        name: 'Arcane Surge',
        shortLabel: '+1M & Bomb',
        icon: '⚡',
        isCurse: false,
        color: '#059669',
        accent: '#6ee7b7',
        desc: 'ARCANE BLESSING! Grants +1 Starting Mana on the next floor and +1 Jalapeño Core Bomb Token!'
    },
    {
        id: 'hex_of_abyss',
        name: 'Hex of the Abyss',
        shortLabel: 'Curse & -1M',
        icon: '💀',
        isCurse: true,
        color: '#4c1d95',
        accent: '#c4b5fd',
        desc: 'CURSED HAZARD! Injects a "Dead Weight Stone" curse card into your deck and drains -1 Starting Mana next floor!'
    },
    {
        id: 'gilded_blessing',
        name: 'Gilded Blessing',
        shortLabel: '+3 Gold Slots',
        icon: '✨',
        isCurse: false,
        color: '#b45309',
        accent: '#fcd34d',
        desc: 'CAVERN BLESSING! Spawns +3 extra Gilded & Amplifier Enchanted Slots on the next floor\'s board!'
    },
    {
        id: 'ai_headstart',
        name: 'AI Headstart',
        shortLabel: 'AI +2 Tokens',
        icon: '🤖',
        isCurse: true,
        color: '#7c2d12',
        accent: '#fdba74',
        desc: 'CURSED HAZARD! The Grandmaster AI drops 2 immediate tokens at the very start of the next floor!'
    },
    {
        id: 'tectonic_reinforce',
        name: 'Tectonic Shield',
        shortLabel: '+4 Stability',
        icon: '🛡️',
        isCurse: false,
        color: '#1d4ed8',
        accent: '#93c5fd',
        desc: 'TECTONIC BLESSING! Reinforces the cavern ceiling for +4 bonus Seismic Stability turns on the next floor!'
    }
];

// Off-Board Tactical Reserve Pouch Tokens (Tier-Categorized Special Tokens — Rebalanced 2x+ Bazaar Pricing)
const RESERVE_CATALOG = {
    fools_penny: {
        id: 'fools_penny',
        name: "Fool's Counterfeit Penny",
        icon: '💩',
        price: 5,
        tier: 1,
        desc: 'Tier 1 Jokey Gamble: Drops your token and flips a crooked coin! 65% chance to mint +$4 Gold & +1 Mana; 35% chance it is a dud that calcifies into neutral Petrified Stone (refunding +$1 consolation Gold)!'
    },
    anvil: {
        id: 'anvil',
        name: 'Heavy Anvil Token',
        icon: '⚓',
        price: 7,
        tier: 1,
        desc: 'Tier 1 Utility: Drops your token and CRUSHES (shatters) the token directly beneath where it lands!'
    },
    cave_bat: {
        id: 'cave_bat',
        name: 'Vampire Bat Token',
        icon: '🦇',
        price: 7,
        tier: 1,
        desc: 'Tier 1 Utility: Drops your token and latches onto the token directly below, converting it to your color!'
    },
    wild: {
        id: 'wild',
        name: 'Wild Prismatic Token',
        icon: '💎',
        price: 9,
        tier: 2,
        desc: 'Tier 2 Synergy: Counts as BOTH your color and the AI color for completing 4-in-a-row lines!'
    },
    jalapeno_bomb: {
        id: 'jalapeno_bomb',
        name: 'Jalapeño Core Bomb',
        icon: '🌶️',
        price: 9,
        tier: 2,
        desc: 'Tier 2 Synergy: Drops your token and explodes in a 3x3 cross, shattering up to 2 adjacent AI tokens!'
    },
    midas_eye: {
        id: 'midas_eye',
        name: 'Golden Midas Eye Token',
        icon: '👁️‍🗨️',
        price: 13,
        tier: 3,
        desc: 'Tier 3 Late-Game Powerhouse: Drops a Wild Prismatic Token, transmutes up to 2 orthogonally adjacent AI/Stone tokens into your color, and enchants the cell directly above it into a Gilded Slot (+$3)!'
    }
};

// Synergistic Gambits (Up to 5 Active Slots, Build-Around Archetypes — Rebalanced 2x+ Bazaar Pricing)
const GAMBIT_CATALOG = {
    butter_crust: {
        id: 'butter_crust',
        name: 'Butter-Cheese Golden Crust',
        icon: '🍕',
        price: 9,
        tier: 1,
        desc: 'Tier 1 Edge Artisan: Dropping a token into outer columns (Col 1 or Col 7) awards +$1 Gold and +1 Seismic Stability.'
    },
    shrinking_shroom: {
        id: 'shrinking_shroom',
        name: 'Oddly Shrinking Cave Shroom',
        icon: '🍄',
        price: 7,
        tier: 1,
        desc: 'Tier 1 Jokey Relic ("Wait, why am I tiny?!"): Visually shrinks your 3D tokens to cute 68% mini-size! Every 3rd token you drop squeaks in a high-pitched voice and awards +$2 Gold & +1 Stability!'
    },
    dali_clock: {
        id: 'dali_clock',
        name: 'Surrealist Dalí Clock',
        icon: '🕰️',
        price: 9,
        tier: 2,
        desc: 'Tier 2 Melting Time: Gravity Inversion, Lodestone Polarity, Transmute & Abyssal Upheaval cost -1 Mana. Reveals exact AI scores above all 7 columns.'
    },
    echo_bell: {
        id: 'echo_bell',
        name: 'Subterranean Echo Bell',
        icon: '🔔',
        price: 9,
        tier: 2,
        desc: 'Tier 2 Resonance: Deploying a Special Reserve Token triggers its landing effect a second time & grants +$1 Gold!'
    },
    coaster_apex: {
        id: 'coaster_apex',
        name: 'Coaster Apex Momentum',
        icon: '🎢',
        price: 9,
        tier: 2,
        desc: 'Tier 2 Airtime Thrill: Dropping tokens in ascending columns (e.g., Col 2 → 3 → 4) awards +1 Mana & +$2 Gold!'
    },
    obsidian_cat: {
        id: 'obsidian_cat',
        name: 'Obsidian Cat Figurine',
        icon: '🐈‍⬛',
        price: 11,
        tier: 2,
        desc: 'Tier 2 Nine Lives: Shatters the AI\'s winning 4th token once per floor + grants +$2 Gold whenever ANY token is shattered!'
    },
    jalapeno_overdrive: {
        id: 'jalapeno_overdrive',
        name: 'Jalapeño Pepperoni Overdrive',
        icon: '🌶️',
        price: 11,
        tier: 2,
        desc: 'Tier 2 Spicy Ignition: Start each floor with +1 Mana. Every 2 tokens shattered converts 1 random AI token into your color!'
    },
    sacred_heart_prism: {
        id: 'sacred_heart_prism',
        name: 'Sacred Prismatic Heart',
        icon: '❤️‍🔥',
        price: 15,
        tier: 3,
        desc: 'Tier 3 Late-Game Divinity: Start every floor with +1 extra Amplifier Slot on the board and +1 Mana. Landing on ANY Enchanted Slot also draws 1 card and restores +1 Mana!'
    }
};

// Slot Enchantments on the 7x6 Board
const ENCHANT_TYPES = {
    NONE: 0,
    GILDED: 1,     // +$3 Gold when filled
    SPICE: 2,      // +1 Mana & shatters adjacent AI token
    WEB: 3,        // Converts AI token dropped here into Petrified Stone
    AMPLIFIER: 4,  // Token dropped here becomes a Wild Prismatic Token & triggers +$2
    CURSED_SPORE: 5 // Boss Spore Queen hazard: drains 1 Mana or turns Player token into Stone!
};

// Non-Boss Standard Cavern Guardians (Floors 1, 2, 4, 5, 7, 8)
const SENTINEL_NAMES = [
    "Cavern Pebble Scout",
    "Deep Slate Sentinel",
    "Basalt Gatekeeper",
    "Obsidian Patrolman",
    "Subterranean Watcher",
    "Abyssal Vanguard"
];

// ============================================================================
// TIERED BOSS ABILITY POOLS BY ACT DIFFICULTY (Easy -> Medium -> Hard)
//   • EASY POOL (Boss Fight 1 / Floor 3, 2 HP): Spore Queen, Chronos Dalí Warden
//   • MEDIUM POOL (Boss Fight 2 / Floor 6, 3 HP): Petrifier Archon, Mirror Virtuoso
//   • HARD POOL (Boss Fight 3 / Floor 9, 3 HP): Magma Leviathan, Tectonic Behemoth
// ============================================================================
const BOSS_POOLS_BY_ACT = {
    EASY: [
        {
            id: 'spore_queen',
            poolTier: 'EASY',
            poolLabel: 'Act I Easy Boss Pool',
            maxHp: 2,
            name: 'Mycelial Spore Queen',
            icon: '🍄',
            interval: 3,
            shortTelegraph: 'Infects 2 slots with Cursed Spore Webs',
            fullRule: 'Every 3 turns, infects 2 empty board cells with Cursed Green Spores that petrify Player tokens into stone or drain 1 Mana!'
        },
        {
            id: 'chronos_dali',
            poolTier: 'EASY',
            poolLabel: 'Act I Easy Boss Pool',
            maxHp: 2,
            name: 'Chronos Dalí Warden',
            icon: '🕰️',
            interval: 3,
            shortTelegraph: 'Inverts gravity of marked column',
            fullRule: 'Every 3 turns, triggers a Temporal Flip—inverting the entire token stack upside down in the pre-marked warning column!'
        }
    ],
    MEDIUM: [
        {
            id: 'petrifier_archon',
            poolTier: 'MEDIUM',
            poolLabel: 'Act II Medium Boss Pool',
            maxHp: 3,
            name: 'The Petrifier Archon',
            icon: '🗿',
            interval: 3,
            shortTelegraph: 'Petrifies top Player token in fullest col',
            fullRule: 'Every 3 turns, calcifies the highest Player token in the most-populated column into neutral Petrified Stone!'
        },
        {
            id: 'mirror_virtuoso',
            poolTier: 'MEDIUM',
            poolLabel: 'Act II Medium Boss Pool',
            maxHp: 3,
            name: 'The Mirror Virtuoso',
            icon: '🎭',
            interval: 3,
            shortTelegraph: 'Swaps colors of 2 surface tokens',
            fullRule: 'Every 3 turns, warps reflections across the board—swapping the colors of your highest token and an AI surface token!'
        }
    ],
    HARD: [
        {
            id: 'magma_leviathan',
            poolTier: 'HARD',
            poolLabel: 'Act III Hard Boss Pool',
            maxHp: 3,
            name: 'The Magma Leviathan',
            icon: '🌋',
            interval: 3,
            shortTelegraph: 'Scorches bottom token & shifts col down',
            fullRule: 'Every 3 turns, erupts magma across the base of a populated column, shattering its bottom-most token and shifting the stack down!'
        },
        {
            id: 'tectonic_behemoth',
            poolTier: 'HARD',
            poolLabel: 'Act III Hard Boss Pool',
            maxHp: 3,
            name: 'Tectonic Behemoth',
            icon: '🦖',
            interval: 2,
            shortTelegraph: 'Quakes -1 Stability & drops Blocker Stone',
            fullRule: 'Every 2 turns, slams the cavern floor—draining -1 extra Seismic Stability and dropping a heavy Petrified Stone blocker!'
        }
    ]
};

const BOSS_ARCHETYPES = [
    ...BOSS_POOLS_BY_ACT.EASY,
    ...BOSS_POOLS_BY_ACT.MEDIUM,
    ...BOSS_POOLS_BY_ACT.HARD
];
