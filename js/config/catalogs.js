// ============================================================================
// CARDS, ROULETTE WEDGES, RESERVES, GAMBITS, ENCHANTS & BOSS POOLS (js/config/catalogs.js)
//   • 32 Playable Arcane Cards (11 Tier 1, 11 Tier 2, 10 Tier 3) + 1 Curse Card
//   • 12 Tactical Reserve Tokens (4 Tier 1, 4 Tier 2, 4 Tier 3)
//   • 16 Synergistic Gambit Relics (5 Tier 1, 6 Tier 2, 5 Tier 3)
//   • Shop Tier Gating:
//       - Tier 1: Available from Floor 1 (Act I)
//       - Tier 2: Unlocks after defeating Boss Fight 1 (Floor 3)
//       - Tier 3: Unlocks after defeating Boss Fight 2 (Floor 6)
// ============================================================================

const CARD_CATALOG = {
  // --------------------------------------------------------------------------
  // TIER 1 ARCANE CARDS (Act I — Available from Floor 1, 11 Cards)
  // --------------------------------------------------------------------------
  pebble: {
    id: 'pebble',
    name: 'Cavern Pebble Nudge',
    cost: 1,
    price: 4,
    tier: 1,
    icon: '🪨',
    shortDesc: 'T1 Starter: +1 Stability & +$1 Gold.',
    desc: "Humble Starter Technique: Reinforce a column's footing to gain +1 Seismic Stability and +$1 Gold."
  },
  oracle_peek: {
    id: 'oracle_peek',
    name: "Oracle's Lantern",
    cost: 0,
    price: 4,
    tier: 1,
    icon: '🏮',
    shortDesc: '0M Starter: Draw 1 card & +1 Stability.',
    desc: 'Illuminate the cavern: costs 0 Mana! Draw 1 card from your deck and restore +1 Seismic Stability.'
  },
  loaded_knucklebones: {
    id: 'loaded_knucklebones',
    name: 'Loaded Knucklebones',
    cost: 0,
    price: 5,
    tier: 1,
    icon: '🎲',
    shortDesc: '0M Dice Roll (2d6): Gold/Stab or Free Drop!',
    desc: 'Roll 2 carved bone dice above a column for 0 Mana! Roll 2–6: gain +$2 Gold & +1 Stability. Roll 7–10: drop 1 Player token into the column! Roll 11–12: drop 1 Player token AND mint +$3 Gold!'
  },
  leech_lancet: {
    id: 'leech_lancet',
    name: "Bloodletter's Lancet",
    cost: 0,
    price: 5,
    tier: 1,
    icon: '💉',
    shortDesc: '0M Pact: -2 Stability -> +1 Mana, Draw 1 & +$1!',
    desc: 'Forbidden surgical bloodletting: costs 0 Mana! Sacrifice -2 Seismic Stability (down to min 1) to immediately gain +1 Mana Crystal, draw 1 Arcane Card, and pocket +$1 Gold!'
  },
  petrified: {
    id: 'petrified',
    name: 'Petrified Wood Block',
    cost: 1,
    price: 5,
    tier: 1,
    icon: '🪵',
    shortDesc: 'Drop neutral carved stone blocker.',
    desc: 'Drop a neutral carved stone blocker into a column that blocks 4-in-a-row lines.'
  },
  jar_of_flies: {
    id: 'jar_of_flies',
    name: 'Suspicious Jar of Cave Flies',
    cost: 1,
    price: 5,
    tier: 1,
    icon: '🪰',
    shortDesc: 'RNG: 50% eat AI piece / 50% drop Stone!',
    desc: 'Uncork a buzzing jar of blind cave flies! 50% chance they devour a random AI token and cough up +$2 Gold; 50% chance they get confused and drop a neutral Petrified Stone into your chosen column!'
  },
  pickaxe: {
    id: 'pickaxe',
    name: "Spelunker's Pickaxe",
    cost: 1,
    price: 6,
    tier: 1,
    icon: '⛏️',
    shortDesc: 'Shatter ALL Petrified Stone in a col!',
    desc: 'Swing a heavy iron mining pickaxe down a target column! Shatters EVERY neutral Petrified Stone token in that column, compacting remaining tokens downward.'
  },
  guano_fertilizer: {
    id: 'guano_fertilizer',
    name: 'Volatile Guano Poultice',
    cost: 1,
    price: 6,
    tier: 1,
    icon: '🧪',
    shortDesc: 'Purge Spores & plant Volatile Spice Slot +1 Stab!',
    desc: 'Smear pungent alchemical guano inside a target column: purges any Cursed Spore hazards in that column, enchants the next open slot into a Volatile Spice Slot (+1 Mana & shatters adjacent AI), and restores +1 Seismic Stability!'
  },
  rusty_bear_trap: {
    id: 'rusty_bear_trap',
    name: 'Rusted Bear Trap',
    cost: 1,
    price: 6,
    tier: 1,
    icon: '🪤',
    shortDesc: 'Amputate top AI token +$2 OR rig Web Slot!',
    desc: 'Clamp serrated iron jaws onto a column! If the top token belongs to the AI, it is amputated (shattered) for +$2 Bounty Gold; otherwise, rigs the next empty cell with a Spider Web Slot and grants +1 Stability!'
  },
  divining_wishbone: {
    id: 'divining_wishbone',
    name: 'Split Wishbone',
    cost: 1,
    price: 6,
    tier: 1,
    icon: '🦴',
    shortDesc: 'Compare col height vs Col 4 -> Free Drop or +$3!',
    desc: 'Snap a dried wishbone between your chosen column and the center column (Col 4): if their stack heights differ, gain +$3 Gold & +2 Stability; if they match, drop 1 free Player token into your chosen column & gain +$2 Gold!'
  },
  tar_bubble: {
    id: 'tar_bubble',
    name: 'Boiling Tar Pitch',
    cost: 1,
    price: 6,
    tier: 1,
    icon: '🛢️',
    shortDesc: 'Drag top AI token to bottom of col & +1 Stab!',
    desc: 'Bubble viscous black tar beneath a column: drags the highest AI token in that column all the way to the bottom-most row (floating your tokens above it upward by 1 row) and restores +1 Seismic Stability!'
  },

  // --------------------------------------------------------------------------
  // TIER 2 ARCANE CARDS (Act II — Unlocks after Boss Fight 1, 11 Cards)
  // --------------------------------------------------------------------------
  tectonic_anchor: {
    id: 'tectonic_anchor',
    name: 'Tectonic Anchor',
    cost: 1,
    price: 8,
    tier: 2,
    icon: '⏳',
    shortDesc: '+3 Stability & Gild/Amplify next slot!',
    desc: 'Reinforce the cavern ceiling for +3 Seismic Stability turns and enchant the next open slot in the target column into a Gilded Slot (or upgrade an existing Gilded Slot into a Wild Amplifier)!'
  },
  sinkhole_chute: {
    id: 'sinkhole_chute',
    name: 'Subterranean Trapdoor',
    cost: 1,
    price: 8,
    tier: 2,
    icon: '🕳️',
    shortDesc: 'Drop 3 bottom tokens out of board! (Min 3)',
    desc: 'Unbolt a subterranean trapdoor beneath the board! Shakes the cavern and causes 3 random tokens in the bottom rows to fall out of the board, shifting their columns down.'
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
  guillotine_blade: {
    id: 'guillotine_blade',
    name: 'Weighted Guillotine',
    cost: 1,
    price: 9,
    tier: 2,
    icon: '🪓',
    shortDesc: 'Decapitate tallest col in 3-col span & +$2!',
    desc: 'Drop a weighted executioner blade across the target column and its immediate left/right neighbors: shatters the topmost token in whichever of those 3 columns is tallest (prioritizing AI/Stone) and mints +$2 Gold!'
  },
  mercury_siphon: {
    id: 'mercury_siphon',
    name: 'Quicksilver Siphon',
    cost: 1,
    price: 9,
    tier: 2,
    icon: '🌡️',
    shortDesc: 'Slide top token into neighbor col & +1 Stab!',
    desc: 'Siphon the topmost token of the target column through a liquid mercury tube into an adjacent column with open space (converting Petrified Stone into your Player token in the process) and restore +1 Seismic Stability!'
  },
  mimic_tooth: {
    id: 'mimic_tooth',
    name: 'Ravenous Mimic Tooth',
    cost: 1,
    price: 9,
    tier: 2,
    icon: '🦷',
    shortDesc: 'Devour all Stone in col for +$3 each (or AI + Gild)!',
    desc: 'Unleash a ravenous treasure-mimic fang on a column: devours every Petrified Stone in that column for +$3 Gold each! If no Stone is in the column, chomps the top AI token and spawns a Gilded Slot above it!'
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
  pendulum_scythe: {
    id: 'pendulum_scythe',
    name: 'Swinging Pendulum Scythe',
    cost: 2,
    price: 10,
    tier: 2,
    icon: '⚔️',
    shortDesc: 'Sweep row horizontally -> Shatter 2 AI/Stone!',
    desc: 'Release a dungeon pendulum across the horizontal row of the target column’s top token! Slices across all 7 columns at that row height, shattering up to 2 AI or Stone tokens and compacting their stacks downward!'
  },
  wax_effigy: {
    id: 'wax_effigy',
    name: 'Pins & Wax Effigy',
    cost: 2,
    price: 10,
    tier: 2,
    icon: '🪡',
    shortDesc: 'Steal top AI token in col & hex neighbor Web!',
    desc: 'Pierce a sympathetic wax effigy: corrupts the highest AI token in the target column into your Amber Player Token, and hexes the next open slot of an adjacent column into a Spider Web Slot (+1 Stability)!'
  },

  // --------------------------------------------------------------------------
  // TIER 3 ARCANE CARDS (Act III — Unlocks after Boss Fight 2, 10 Cards)
  // --------------------------------------------------------------------------
  transmute: {
    id: 'transmute',
    name: 'Surrealist Transmute',
    cost: 2,
    price: 12,
    tier: 3,
    icon: '✨',
    shortDesc: 'Convert top AI/Stone into your color +$2!',
    desc: 'Warp reality to convert the topmost AI or Stone token of a chosen column into your warm amber token and mint +$2 Gold.'
  },
  echo_drop: {
    id: 'echo_drop',
    name: 'Subterranean Echo Drop',
    cost: 2,
    price: 12,
    tier: 3,
    icon: '♊',
    shortDesc: 'Mastery: Drop 2 Player tokens in 1 col!',
    desc: 'High-Tier Mastery: Instantly drop TWO of your amber tokens stacked into the target column!'
  },
  mirror_shard: {
    id: 'mirror_shard',
    name: 'Prismatic Mirror Shard',
    cost: 2,
    price: 12,
    tier: 3,
    icon: '🪞',
    shortDesc: 'Clone top Player token upward as WILD!',
    desc: 'Reflect your topmost Player or Wild token in a column into the empty space directly above it as a Wild Prismatic Token!'
  },
  hydraulic_piston: {
    id: 'hydraulic_piston',
    name: 'Steam Hydraulic Piston',
    cost: 2,
    price: 12,
    tier: 3,
    icon: '🔩',
    shortDesc: 'Swap entire col stack with neighbor & +2 Stab!',
    desc: 'Fire a dwarven steam-ram that swaps the entire vertical stack of tokens in the target column with its adjacent neighbor column and reinforces the cavern for +2 Seismic Stability!'
  },
  abyssal_upheaval: {
    id: 'abyssal_upheaval',
    name: 'Abyssal Upheaval',
    cost: 2,
    price: 13,
    tier: 3,
    icon: '🔄',
    shortDesc: 'Flip ENTIRE board 180° & invert all cols!',
    desc: 'Physically flip the entire 3D cavern board 180° upside down! Inverts procedural board geometry, Enchanted Slots, and all token stacks.'
  },
  ouroboros_fang: {
    id: 'ouroboros_fang',
    name: 'Ouroboros World-Eater',
    cost: 2,
    price: 13,
    tier: 3,
    icon: '🐍',
    shortDesc: 'Cycle bottom of 3 cols: digest AI/Stone +$2, loop yours to top!',
    desc: 'The eternal serpent devours the base of the target column and its two neighbors! Bottom AI/Stone tokens are digested for +$2 Gold each, while bottom Player/Wild tokens are regurgitated onto the very top of their columns!'
  },
  croupier_jackpot: {
    id: 'croupier_jackpot',
    name: "Croupier's Rigged Jackpot",
    cost: 2,
    price: 13,
    tier: 3,
    icon: '🎰',
    shortDesc: 'Drop WILD, Gild 2 slots & +$1 per Enchanted Slot!',
    desc: 'Rig the house table: drops 1 Wild Prismatic Token into the target column, gilds up to 2 open slots above it, and pays out +$1 Gold for EVERY Enchanted Slot currently active across the entire board!'
  },
  brimstone_beam: {
    id: 'brimstone_beam',
    name: 'Sulfuric Brimstone Laser',
    cost: 3,
    price: 14,
    tier: 3,
    icon: '🩸',
    shortDesc: 'Vaporize ALL AI & Stone in a col!',
    desc: 'Fire a subterranean blood-sulfur laser down an entire column! Vaporizes EVERY AI and Petrified Stone token in that column while leaving your Player & Wild tokens untouched!'
  },
  basilisk_gaze: {
    id: 'basilisk_gaze',
    name: 'Petrifying Basilisk Gaze',
    cost: 3,
    price: 14,
    tier: 3,
    icon: '🦎',
    shortDesc: 'Calcify 2 top AI tokens, shatter 1 for +$4 & +3 Stab!',
    desc: 'Sweep the board with a lethal reptilian gaze: calcifies up to 2 topmost AI tokens into Petrified Stone, immediately shatters 1 of them into +$4 Gold, and restores +3 Seismic Stability!'
  },
  seraphim_halo: {
    id: 'seraphim_halo',
    name: 'Six-Winged Seraphim Halo',
    cost: 3,
    price: 15,
    tier: 3,
    icon: '🪽',
    shortDesc: 'Upgrade col token to WILD, drop Player token & +3 Stab!',
    desc: 'Blinding Abyssal Benediction: sanctifies your highest token in the target column into a Wild Prismatic Token, drops 1 additional Amber Player Token on top of the column, and restores +3 Seismic Stability!'
  },

  // --------------------------------------------------------------------------
  // CURSE CARD (Tier 0 — Injected by Wheel of Fate)
  // --------------------------------------------------------------------------
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
    desc: 'VAULT BLESSING! Unlocks a random unowned Synergistic Gambit Relic from your unlocked tiers (or +$10 Gold if full)!'
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
    desc: "CAVERN BLESSING! Spawns +3 extra Gilded & Amplifier Enchanted Slots on the next floor's board!"
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

// ============================================================================
// OFF-BOARD TACTICAL RESERVE POUCH TOKENS (12 Total: 4× T1, 4× T2, 4× T3)
// ============================================================================
const RESERVE_CATALOG = {
  // TIER 1 (Act I — 4 Reserve Tokens)
  fools_penny: {
    id: 'fools_penny',
    name: "Fool's Counterfeit Penny",
    icon: '💩',
    price: 5,
    tier: 1,
    desc: 'Tier 1 Gamble: Drops your token and flips a crooked coin! 65% chance to mint +$4 Gold & +1 Mana; 35% chance it calcifies into neutral Petrified Stone (+$1 consolation Gold)!'
  },
  loaded_die: {
    id: 'loaded_die',
    name: 'Weighted Bone Die Token',
    icon: '🎲',
    price: 6,
    tier: 1,
    desc: 'Tier 1 High-Roller: Drops your token and rolls a 1d6 on impact! Roll 1–3: +$2 Gold & +1 Stability; Roll 4–5: +$3 Gold & Draw 1 Card; Roll 6: upgrades into a Wild Prismatic Token!'
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

  // TIER 2 (Act II — Unlocks after Boss Fight 1, 4 Reserve Tokens)
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
  acid_slug: {
    id: 'acid_slug',
    name: 'Corrosive Brine Slug Token',
    icon: '🐌',
    price: 9,
    tier: 2,
    desc: 'Tier 2 Dissolver: Drops your token and secretes acidic brine down the column—dissolving ALL Petrified Stone blockers in that column for +$2 Gold each (plus +2 Stability)!'
  },
  parasite_egg: {
    id: 'parasite_egg',
    name: 'Brood Spider Egg Token',
    icon: '🥚',
    price: 10,
    tier: 2,
    desc: 'Tier 2 Trap-Layer: Drops your token and hatches on impact—spinning Spider Web Enchanted Slots into the next open cells of both adjacent columns and restoring +2 Seismic Stability!'
  },

  // TIER 3 (Act III — Unlocks after Boss Fight 2, 4 Reserve Tokens)
  powder_keg: {
    id: 'powder_keg',
    name: 'Dwarven Nitro Cask Token',
    icon: '🧨',
    price: 12,
    tier: 3,
    desc: 'Tier 3 Demolition: Drops your token and blasts downward—shattering up to 2 AI or Stone tokens beneath it in the column and minting +$2 Gold per token blasted!'
  },
  quicksilver_glob: {
    id: 'quicksilver_glob',
    name: 'Living Quicksilver Token',
    icon: '💧',
    price: 13,
    tier: 3,
    desc: 'Tier 3 Alchemical Fluid: Drops a Wild Prismatic Token that slips underneath any AI token directly below to swap places with it, plus restores +1 Mana & +2 Seismic Stability!'
  },
  midas_eye: {
    id: 'midas_eye',
    name: 'Golden Midas Eye Token',
    icon: '👁️‍🗨️',
    price: 13,
    tier: 3,
    desc: 'Tier 3 Powerhouse: Drops a Wild Prismatic Token, transmutes up to 2 orthogonally adjacent AI/Stone tokens into your color, and enchants the cell above into a Gilded Slot!'
  },
  eclipse_idol: {
    id: 'eclipse_idol',
    name: 'Black Sun Idol Token',
    icon: '🌑',
    price: 14,
    tier: 3,
    desc: 'Tier 3 Totem: Drops a Wild Prismatic Token, draws 1 Arcane Card, enchants the empty slot above into a Wild Amplifier Slot, and grants +1 Mana & +3 Seismic Stability!'
  }
};

// ============================================================================
// SYNERGISTIC GAMBITS (16 Total: 5× Tier 1, 6× Tier 2, 5× Tier 3)
// ============================================================================
const GAMBIT_CATALOG = {
  // TIER 1 (Act I — 5 Gambits)
  shrinking_shroom: {
    id: 'shrinking_shroom',
    name: 'Oddly Shrinking Cave Shroom',
    icon: '🍄',
    price: 6,
    tier: 1,
    desc: 'Tier 1 Relic: Visually shrinks your 3D tokens to cute 68% mini-size! Every 3rd token you drop squeaks and awards +$2 Gold & +1 Stability!'
  },
  lucky_rabbit_paw: {
    id: 'lucky_rabbit_paw',
    name: 'Lucky Fossilized Paw',
    icon: '🐾',
    price: 7,
    tier: 1,
    desc: 'Tier 1 Talisman: Start every floor with +2 bonus Seismic Stability, and gain +$1 Gold whenever you cast a 0-Mana or 1-Mana Arcane Card!'
  },
  butter_crust: {
    id: 'butter_crust',
    name: 'Butter-Cheese Golden Crust',
    icon: '🍕',
    price: 8,
    tier: 1,
    desc: 'Tier 1 Edge Artisan: Dropping a token into outer columns (Col 1 or Col 7) awards +$1 Gold and +1 Seismic Stability.'
  },
  amber_flea: {
    id: 'amber_flea',
    name: 'Prehistoric Amber Flea',
    icon: '🪲',
    price: 8,
    tier: 1,
    desc: 'Tier 1 Resin Specimen: Start every floor with +1 extra Gilded Slot on the board, and claiming a Gilded Slot pays out +$4 Gold instead of +$3!'
  },
  plumb_bob: {
    id: 'plumb_bob',
    name: "Geomancer's Brass Plumb",
    icon: '🧭',
    price: 8,
    tier: 1,
    desc: 'Tier 1 Center Axis: Dropping a token into the center column (Col 4) awards +$1 Gold and restores +1 Seismic Stability!'
  },

  // TIER 2 (Act II — Unlocks after Boss Fight 1, 6 Gambits)
  dali_clock: {
    id: 'dali_clock',
    name: 'Surrealist Dalí Clock',
    icon: '🕰️',
    price: 9,
    tier: 2,
    desc: 'Tier 2 Melting Time: Gravity Inversion, Lodestone Polarity, Transmute, Steam Piston & Abyssal Upheaval cost -1 Mana. Reveals exact AI scores above all 7 columns.'
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
  copper_retort: {
    id: 'copper_retort',
    name: 'Copper Retort Flask',
    icon: '🏺',
    price: 10,
    tier: 2,
    desc: 'Tier 2 Distillation: Casting 2 Arcane Cards in the same turn distills +1 Mana Crystal and +$1 Gold (once per turn)!'
  },
  obsidian_cat: {
    id: 'obsidian_cat',
    name: 'Obsidian Cat Figurine',
    icon: '🐈‍⬛',
    price: 11,
    tier: 2,
    desc: "Tier 2 Nine Lives: Shatters the AI's winning 4th token once per floor + grants +$2 Gold whenever ANY token is shattered!"
  },
  jalapeno_overdrive: {
    id: 'jalapeno_overdrive',
    name: 'Jalapeño Pepperoni Overdrive',
    icon: '🌶️',
    price: 11,
    tier: 2,
    desc: 'Tier 2 Spicy Ignition: Start each floor with +1 Mana. Every 2 tokens shattered converts 1 random AI token into your color!'
  },

  // TIER 3 (Act III — Unlocks after Boss Fight 2, 5 Gambits)
  jeweler_loupe: {
    id: 'jeweler_loupe',
    name: "Master Jeweler's Loupe",
    icon: '🔍',
    price: 13,
    tier: 3,
    desc: 'Tier 3 Appraiser: Draw +1 extra Arcane Card at the start of every floor, and casting any Tier 3 Arcane Card awards +$2 Gold!'
  },
  crimson_chalice: {
    id: 'crimson_chalice',
    name: 'Crimson Blood Chalice',
    icon: '🍷',
    price: 14,
    tier: 3,
    desc: 'Tier 3 Sanguine Harvest: Whenever ANY token is shattered on the board, restore +1 Seismic Stability and gain +$1 Gold per token shattered!'
  },
  flywheel_coil: {
    id: 'flywheel_coil',
    name: 'Perpetual Flywheel Coil',
    icon: '⚙️',
    price: 14,
    tier: 3,
    desc: 'Tier 3 Kinetic Overcharge: Every 3rd token you drop onto the board generates +1 Mana Crystal and +$2 Gold!'
  },
  sacred_heart_prism: {
    id: 'sacred_heart_prism',
    name: 'Sacred Prismatic Heart',
    icon: '❤️‍🔥',
    price: 15,
    tier: 3,
    desc: 'Tier 3 Divinity: Start every floor with +1 extra Amplifier Slot on the board and +1 Mana. Landing on ANY Enchanted Slot also draws 1 card and restores +1 Mana!'
  },
  alkahest_vial: {
    id: 'alkahest_vial',
    name: 'Universal Alkahest Vial',
    icon: '🧪',
    price: 15,
    tier: 3,
    desc: 'Tier 3 Universal Solvent: Start every floor with +1 Mana, and clearing a floor dissolves all Petrified Stone on the board for +$2 bonus Gold each (minimum +$3 Gold)!'
  }
};

// Slot Enchantments on the 7x6 Board
const ENCHANT_TYPES = {
  NONE: 0,
  GILDED: 1,      // +$3 Gold when filled (+$4 with Prehistoric Amber Flea)
  SPICE: 2,       // +1 Mana & shatters adjacent AI token
  WEB: 3,         // Converts AI token dropped here into Petrified Stone
  AMPLIFIER: 4,   // Token dropped here becomes a Wild Prismatic Token & triggers +$2
  CURSED_SPORE: 5 // Boss Spore Queen hazard: drains 1 Mana or turns Player token into Stone!
};

// Non-Boss Standard Cavern Guardians (Floors 1, 2, 4, 5, 7, 8)
const SENTINEL_NAMES = [
  'Cavern Pebble Scout',
  'Deep Slate Sentinel',
  'Basalt Gatekeeper',
  'Obsidian Patrolman',
  'Subterranean Watcher',
  'Abyssal Vanguard'
];

// ============================================================================
// TIERED BOSS ABILITY POOLS BY ACT DIFFICULTY (Easy -> Medium -> Hard)
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
      interval: 2,
      name: 'Tectonic Behemoth',
      icon: '🦖',
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
