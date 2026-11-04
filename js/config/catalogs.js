// ============================================================================
// CARDS, ROULETTE WEDGES, RESERVES, GAMBITS, ENCHANTS & BOSS POOLS (js/config/catalogs.js)
//   • 31 Playable Arcane Cards across Tiers 1–5 (2 Starter-Only + 29 Shop Cards) + 1 Curse Card
//   • 11 Tactical Reserve Tokens across Tiers 1–5
//   • 16 Synergistic Gambit Relics across Tiers 1–5
//   • 5-Act Shop Tier Gating:
//       - Tier 1: Available from Floor 1 (Act I)
//       - Tier 2: Unlocks after defeating Boss Fight 1 (Floor 3)
//       - Tier 3: Unlocks after defeating Boss Fight 2 (Floor 6)
//       - Tier 4: Unlocks after defeating Boss Fight 3 (Floor 9)
//       - Tier 5: Unlocks after defeating Boss Fight 4 (Floor 12)
// ============================================================================

const CARD_CATALOG = {
  // --------------------------------------------------------------------------
  // TIER 1 ARCANE CARDS (Act I — Available from Floor 1; 2 Starter-Only + 5 Shop)
  // --------------------------------------------------------------------------
  pebble: {
    id: 'pebble',
    name: 'Cavern Pebble Nudge',
    cost: 1,
    price: 4,
    tier: 1,
    starterOnly: true,
    icon: '🪨',
    shortDesc: 'Starter Only: +1 Stability & +$2 Gold.',
    desc: "Humble Starter Technique (Not sold in Bazaar): Reinforce a column's footing to gain +1 Seismic Stability and +$2 Gold."
  },
  oracle_peek: {
    id: 'oracle_peek',
    name: "Oracle's Lantern",
    cost: 0,
    price: 4,
    tier: 1,
    starterOnly: true,
    icon: '🏮',
    shortDesc: '0M Starter Only: Draw 1 card & +1 Stability.',
    desc: 'Guiding Starter Flame (Not sold in Bazaar): costs 0 Mana! Draw 1 card from your deck and restore +1 Seismic Stability.'
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
  petrified: {
    id: 'petrified',
    name: 'Petrified Wood Block',
    cost: 1,
    price: 5,
    tier: 1,
    icon: '🪵',
    shortDesc: 'Drop neutral carved stone stepping-stone blocker.',
    desc: 'Drop a neutral carved stone blocker into a column that blocks 4-in-a-row lines and elevates the column by 1 slot during your turn.'
  },
  jar_of_flies: {
    id: 'jar_of_flies',
    name: 'Suspicious Jar of Cave Flies',
    cost: 1,
    price: 5,
    tier: 1,
    icon: '🪰',
    shortDesc: 'RNG: 50% eat AI piece +$2 / 50% drop Stone!',
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

  // --------------------------------------------------------------------------
  // TIER 2 ARCANE CARDS (Act II — Unlocks after Boss Fight 1, 7 Cards)
  // --------------------------------------------------------------------------
  leech_lancet: {
    id: 'leech_lancet',
    name: "Bloodletter's Lancet",
    cost: 0,
    price: 7,
    tier: 2,
    icon: '💉',
    shortDesc: '0M Pact: -2 Stability -> +1 Mana, Draw 1 & +$2!',
    desc: 'Forbidden surgical bloodletting: costs 0 Mana! Sacrifice -2 Seismic Stability (down to min 1) to immediately gain +1 Mana Crystal, draw 1 Arcane Card, and pocket +$2 Gold!'
  },
  guano_fertilizer: {
    id: 'guano_fertilizer',
    name: 'Volatile Guano Poultice',
    cost: 1,
    price: 7,
    tier: 2,
    icon: '🧪',
    shortDesc: 'Purge Spores & plant Volatile Spice Slot +1 Stab!',
    desc: 'Smear pungent alchemical guano inside a target column: purges any Cursed Spore hazards in that column, enchants the next open slot into a Volatile Spice Slot (+1 Mana & shatters adjacent AI), and restores +1 Seismic Stability!'
  },
  rusty_bear_trap: {
    id: 'rusty_bear_trap',
    name: 'Rusted Bear Trap',
    cost: 1,
    price: 7,
    tier: 2,
    icon: '🪤',
    shortDesc: 'Amputate top AI token +$2 OR rig Web Slot!',
    desc: 'Clamp serrated iron jaws onto a column! If the top token belongs to the AI, it is amputated (shattered) for +$2 Bounty Gold; otherwise, rigs the next empty cell with a Spider Web Slot and grants +1 Stability!'
  },
  tar_bubble: {
    id: 'tar_bubble',
    name: 'Boiling Tar Pitch',
    cost: 1,
    price: 8,
    tier: 2,
    icon: '🛢️',
    shortDesc: 'Drag buried AI token to bottom (or drop Stone +$2) & +1 Stab!',
    desc: 'Bubble viscous black tar beneath a column: drags the highest AI token in that column down to the bottom-most row to float your tokens upward (or coagulates into a Stone Blocker +$2 Gold if no AI token can be sunk) and restores +1 Seismic Stability!'
  },
  tectonic_anchor: {
    id: 'tectonic_anchor',
    name: 'Tectonic Anchor',
    cost: 1,
    price: 8,
    tier: 2,
    icon: '⏳',
    shortDesc: '+3 Stability & Gild/Amplify next slot!',
    desc: 'Reinforce the cavern ceiling for +3 Seismic Stability turns and enchant the next open slot in the target column into a Gilded Slot (or upgrade an existing Gilded Slot into a Wild Amplifier trap)!'
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
  hibachi: {
    id: 'hibachi',
    name: 'Spicy Miso Hibachi Flare',
    cost: 1,
    price: 8,
    tier: 2,
    icon: '🍜',
    shortDesc: 'Shatter top AI token & +2 Stability.',
    desc: 'Sear a column with hibachi fire: shatters the top token if it belongs to the AI and restores +2 Seismic Stability.'
  },

  // --------------------------------------------------------------------------
  // TIER 3 ARCANE CARDS (Act III — Unlocks after Boss Fight 2, 6 Cards)
  // --------------------------------------------------------------------------
  lodestone: {
    id: 'lodestone',
    name: 'Lodestone Polarity',
    cost: 1,
    price: 9,
    tier: 3,
    icon: '🧲',
    shortDesc: 'Float your tokens to top of column stack!',
    desc: 'Magnetically pull all of your Amber and Wild tokens in a column to the top of its stack while sinking AI and Petrified Stone pieces to the bottom!'
  },
  alchemy_crucible: {
    id: 'alchemy_crucible',
    name: 'Alchemical Crucible',
    cost: 1,
    price: 9,
    tier: 3,
    icon: '⚗️',
    shortDesc: 'Shatter top AI/Stone -> +$2 & Wild Slot!',
    desc: 'Dissolve the topmost AI or Petrified Stone blocker in a column! Awards +$2 Gold, triggers shatter synergies, and leaves a glowing Wild Amplifier Slot in its place.'
  },
  guillotine_blade: {
    id: 'guillotine_blade',
    name: 'Weighted Guillotine',
    cost: 1,
    price: 10,
    tier: 3,
    icon: '🪓',
    shortDesc: 'Decapitate tallest AI/Stone col in 3-col span & +$2!',
    desc: 'Drop a weighted executioner blade across the target column and its immediate left/right neighbors: shatters the topmost AI or Stone token in whichever enemy-topped column of those 3 is tallest and mints +$2 Gold!'
  },
  mercury_siphon: {
    id: 'mercury_siphon',
    name: 'Quicksilver Siphon',
    cost: 1,
    price: 10,
    tier: 3,
    icon: '🌡️',
    shortDesc: 'Purify & slide top token into neighbor col +1 Stab!',
    desc: 'Siphon the topmost token of the target column through a liquid mercury tube into the best adjacent open column—purifying any AI or Petrified Stone piece into your Amber Player token—and restore +1 Seismic Stability!'
  },
  mimic_tooth: {
    id: 'mimic_tooth',
    name: 'Ravenous Mimic Tooth',
    cost: 1,
    price: 10,
    tier: 3,
    icon: '🦷',
    shortDesc: 'Devour all Stone in col for +$3 each (or AI + Gild)!',
    desc: 'Unleash a ravenous treasure-mimic fang on a column: devours every Petrified Stone in that column for +$3 Gold each! If no Stone is in the column, chomps the top AI token and spawns a Gilded Slot above it!'
  },
  inversion: {
    id: 'inversion',
    name: 'Gravity Inversion',
    cost: 2,
    price: 10,
    tier: 3,
    icon: '🌀',
    shortDesc: 'Flip all tokens in a column upside down.',
    desc: 'Invert gravity in a target column, flipping the entire vertical stack of tokens upside down.'
  },

  // --------------------------------------------------------------------------
  // TIER 4 ARCANE CARDS (Act IV — Unlocks after Boss Fight 3, 5 Cards)
  // --------------------------------------------------------------------------
  pendulum_scythe: {
    id: 'pendulum_scythe',
    name: 'Swinging Pendulum Scythe',
    cost: 2,
    price: 12,
    tier: 4,
    icon: '⚔️',
    shortDesc: 'Sweep row horizontally -> Shatter 2 AI/Stone!',
    desc: 'Release a dungeon pendulum across the horizontal row of the target column’s top token! Slices across all 7 columns at that row height, shattering up to 2 AI or Stone tokens and compacting their stacks downward!'
  },
  wax_effigy: {
    id: 'wax_effigy',
    name: 'Pins & Wax Effigy',
    cost: 2,
    price: 12,
    tier: 4,
    icon: '🪡',
    shortDesc: 'Steal top AI token in col & hex neighbor Web!',
    desc: 'Pierce a sympathetic wax effigy: corrupts the highest AI token in the target column into your Amber Player Token, and hexes the next open slot of an adjacent column into a Spider Web Slot (+1 Stability)!'
  },
  transmute: {
    id: 'transmute',
    name: 'Surrealist Transmute',
    cost: 2,
    price: 12,
    tier: 4,
    icon: '✨',
    shortDesc: 'Convert top AI/Stone into your color +$2!',
    desc: 'Warp reality to convert the topmost AI or Stone token of a chosen column into your warm amber token and mint +$2 Gold.'
  },
  echo_drop: {
    id: 'echo_drop',
    name: 'Subterranean Echo Drop',
    cost: 2,
    price: 13,
    tier: 4,
    icon: '♊',
    shortDesc: 'Mastery: Drop 2 Player tokens in 1 col!',
    desc: 'High-Tier Mastery: Instantly drop TWO of your amber tokens stacked into the target column!'
  },
  hydraulic_piston: {
    id: 'hydraulic_piston',
    name: 'Steam Hydraulic Piston',
    cost: 2,
    price: 13,
    tier: 4,
    icon: '🔩',
    shortDesc: 'Swap entire col stack with neighbor & +2 Stab!',
    desc: 'Fire a dwarven steam-ram that swaps the entire vertical stack of tokens in the target column with its adjacent neighbor column and reinforces the cavern for +2 Seismic Stability!'
  },

  // --------------------------------------------------------------------------
  // TIER 5 ARCANE CARDS (Act V — Unlocks after Boss Fight 4, 6 Cards)
  // --------------------------------------------------------------------------
  abyssal_upheaval: {
    id: 'abyssal_upheaval',
    name: 'Abyssal Upheaval',
    cost: 2,
    price: 15,
    tier: 5,
    icon: '🔄',
    shortDesc: 'Flip ENTIRE board 180° & invert all cols!',
    desc: 'Physically flip the entire 3D cavern board 180° upside down! Inverts procedural board geometry, Enchanted Slots, and all token stacks.'
  },
  ouroboros_fang: {
    id: 'ouroboros_fang',
    name: 'Ouroboros World-Eater',
    cost: 2,
    price: 15,
    tier: 5,
    icon: '🐍',
    shortDesc: 'Cycle bottom of 3 cols: digest AI/Stone +$2, loop yours to top!',
    desc: 'The eternal serpent devours the base of the target column and its two neighbors! Bottom AI/Stone tokens are digested for +$2 Gold each, while bottom Player/Wild tokens are regurgitated onto the very top of their columns!'
  },
  croupier_jackpot: {
    id: 'croupier_jackpot',
    name: "Croupier's Rigged Jackpot",
    cost: 2,
    price: 15,
    tier: 5,
    icon: '🎰',
    shortDesc: 'Drop Token, Gild 2 slots & +$1 per Enchanted Slot!',
    desc: 'Rig the house table: drops 1 Amber Player Token into the target column, gilds up to 2 open slots above it, and pays out +$1 Gold for EVERY Enchanted Slot currently active across the entire board (min +$3)!'
  },
  brimstone_beam: {
    id: 'brimstone_beam',
    name: 'Sulfuric Brimstone Laser',
    cost: 3,
    price: 16,
    tier: 5,
    icon: '🩸',
    shortDesc: 'Vaporize ALL AI & Stone in a col!',
    desc: 'Fire a subterranean blood-sulfur laser down an entire column! Vaporizes EVERY AI and Petrified Stone token in that column while leaving your Player & Wild tokens untouched!'
  },
  basilisk_gaze: {
    id: 'basilisk_gaze',
    name: 'Petrifying Basilisk Gaze',
    cost: 3,
    price: 16,
    tier: 5,
    icon: '🦎',
    shortDesc: 'Calcify 2 top AI tokens, shatter 1 for +$4 & +3 Stab!',
    desc: 'Sweep the board with a lethal reptilian gaze: calcifies up to 2 topmost AI tokens into Petrified Stone, immediately shatters 1 of them into +$4 Gold, and restores +3 Seismic Stability!'
  },
  seraphim_halo: {
    id: 'seraphim_halo',
    name: 'Six-Winged Seraphim Halo',
    cost: 3,
    price: 17,
    tier: 5,
    icon: '🪽',
    shortDesc: 'Convert col AI/Stone to yours, drop Player token & +3 Stab!',
    desc: 'Blinding Abyssal Benediction: sanctifies the highest AI or Stone blocker in the target column into your Amber Player Token, drops 1 additional Amber Player Token on top of the column, and restores +3 Seismic Stability!'
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
    shortLabel: '+$15 & Midas Eye',
    icon: '👑',
    isCurse: false,
    color: '#d97706',
    accent: '#fde047',
    desc: 'JACKPOT BLESSING! Grants +$15 Gold Coins and +1 Golden Midas Eye Reserve Token!'
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
// OFF-BOARD TACTICAL RESERVE POUCH TOKENS (11 Total across Tiers 1–5)
// ============================================================================
const RESERVE_CATALOG = {
  // TIER 1 (Act I — 3 Reserve Tokens)
  fools_penny: {
    id: 'fools_penny',
    name: "Fool's Counterfeit Penny",
    icon: '💩',
    price: 4,
    tier: 1,
    desc: 'Tier 1 Gamble: Drops your token and flips a crooked coin! 65% chance to mint +$5 Gold & +1 Mana; 35% chance it calcifies into neutral Petrified Stone (+$2 consolation Gold)!'
  },
  loaded_die: {
    id: 'loaded_die',
    name: 'Weighted Bone Die Token',
    icon: '🎲',
    price: 6,
    tier: 1,
    desc: 'Tier 1 High-Roller: Drops your token and rolls a 1d6 on impact! Roll 1–3: +$2 Gold & +1 Stability; Roll 4–5: +$3 Gold & Draw 1 Card; Roll 6 Jackpot: +$4 Gold, +1 Mana, +1 Stability & Draw 1 Card!'
  },
  anvil: {
    id: 'anvil',
    name: 'Heavy Anvil Token',
    icon: '⚓',
    price: 6,
    tier: 1,
    desc: 'Tier 1 Demolition: Drops onto a column topped by an AI or Stone blocker, CRUSHING (shattering) the blocker beneath it and minting +$2 Bounty Gold!'
  },

  // TIER 2 (Act II — Unlocks after Boss Fight 1, 3 Reserve Tokens)
  cave_bat: {
    id: 'cave_bat',
    name: 'Vampire Bat Token',
    icon: '🦇',
    price: 7,
    tier: 2,
    desc: 'Tier 2 Utility: Drops your token and latches onto the AI or Stone blocker directly below, converting it to your color!'
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

  // TIER 3 (Act III — Unlocks after Boss Fight 2, 1 Reserve Token)
  parasite_egg: {
    id: 'parasite_egg',
    name: 'Brood Spider Egg Token',
    icon: '🥚',
    price: 10,
    tier: 3,
    desc: 'Tier 3 Trap-Layer: Drops your token and hatches on impact—spinning Spider Web Enchanted Slots into the next open cells of both adjacent columns and restoring +2 Seismic Stability!'
  },

  // TIER 4 (Act IV — Unlocks after Boss Fight 3, 2 Reserve Tokens)
  powder_keg: {
    id: 'powder_keg',
    name: 'Dwarven Nitro Cask Token',
    icon: '🧨',
    price: 12,
    tier: 4,
    desc: 'Tier 4 Demolition: Drops your token and blasts downward—shattering up to 2 AI or Stone tokens beneath it in the column and minting +$2 Gold per token blasted!'
  },
  quicksilver_glob: {
    id: 'quicksilver_glob',
    name: 'Living Quicksilver Token',
    icon: '💧',
    price: 13,
    tier: 4,
    desc: 'Tier 4 Alchemical Fluid: Drops your Amber Token and slips underneath any AI or Stone blocker directly below to convert it to your color, plus restores +1 Mana & +2 Seismic Stability!'
  },

  // TIER 5 (Act V — Unlocks after Boss Fight 4, 2 Reserve Tokens)
  midas_eye: {
    id: 'midas_eye',
    name: 'Golden Midas Eye Token',
    icon: '👁️‍🗨️',
    price: 15,
    tier: 5,
    desc: 'Tier 5 Powerhouse: Drops your Amber Token, transmutes up to 2 orthogonally adjacent AI/Stone tokens into your color, and enchants the cell above into a Gilded Slot!'
  },
  eclipse_idol: {
    id: 'eclipse_idol',
    name: 'Black Sun Idol Token',
    icon: '🌑',
    price: 16,
    tier: 5,
    desc: 'Tier 5 Totem: Drops your Amber Token, draws 1 Arcane Card, enchants the empty slot above into a Wild Amplifier Slot to bait the AI, and grants +1 Mana & +3 Seismic Stability!'
  }
};

// ============================================================================
// SYNERGISTIC GAMBITS (16 Total across Tiers 1–5)
// ============================================================================
const GAMBIT_CATALOG = {
  // TIER 1 (Act I — 4 Gambits)
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
  plumb_bob: {
    id: 'plumb_bob',
    name: "Geomancer's Brass Plumb",
    icon: '🧭',
    price: 8,
    tier: 1,
    desc: 'Tier 1 Center Axis: Dropping a token into the center column (Col 4) awards +$1 Gold and restores +1 Seismic Stability!'
  },

  // TIER 2 (Act II — Unlocks after Boss Fight 1, 3 Gambits)
  amber_flea: {
    id: 'amber_flea',
    name: 'Prehistoric Amber Flea',
    icon: '🪲',
    price: 8,
    tier: 2,
    desc: 'Tier 2 Resin Specimen: Start every floor with +1 extra Gilded Slot on the board, and claiming a Gilded Slot pays out +$4 Gold instead of +$3!'
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
    price: 9,
    tier: 2,
    desc: 'Tier 2 Distillation: Casting 2 Arcane Cards in the same turn distills +1 Mana Crystal and +$1 Gold (once per turn)!'
  },

  // TIER 3 (Act III — Unlocks after Boss Fight 2, 3 Gambits)
  dali_clock: {
    id: 'dali_clock',
    name: 'Surrealist Dalí Clock',
    icon: '🕰️',
    price: 10,
    tier: 3,
    desc: 'Tier 3 Melting Time: Exclusively unlocks live Grandmaster AI evaluation scores above all 7 columns, and Gravity Inversion, Lodestone Polarity, Transmute, Steam Piston & Abyssal Upheaval cost -1 Mana!'
  },
  echo_bell: {
    id: 'echo_bell',
    name: 'Subterranean Echo Bell',
    icon: '🔔',
    price: 11,
    tier: 3,
    desc: 'Tier 3 Resonance: Deploying a Special Reserve Token triggers its landing effect a second time & grants +$1 Gold!'
  },
  jalapeno_overdrive: {
    id: 'jalapeno_overdrive',
    name: 'Jalapeño Pepperoni Overdrive',
    icon: '🌶️',
    price: 11,
    tier: 3,
    desc: 'Tier 3 Spicy Ignition: Start each floor with +1 Mana. Every 2 tokens shattered converts 1 random AI token into your color!'
  },

  // TIER 4 (Act IV — Unlocks after Boss Fight 3, 3 Gambits)
  obsidian_cat: {
    id: 'obsidian_cat',
    name: 'Obsidian Cat Figurine',
    icon: '🐈‍⬛',
    price: 12,
    tier: 4,
    desc: "Tier 4 Nine Lives: Shatters the AI's winning 4th token once per floor + grants +$2 Gold whenever ANY token is shattered!"
  },
  jeweler_loupe: {
    id: 'jeweler_loupe',
    name: "Master Jeweler's Loupe",
    icon: '🔍',
    price: 13,
    tier: 4,
    desc: 'Tier 4 Appraiser: Draw +1 extra Arcane Card at the start of every floor, and casting any Tier 3+ Arcane Card awards +$2 Gold!'
  },
  crimson_chalice: {
    id: 'crimson_chalice',
    name: 'Crimson Blood Chalice',
    icon: '🍷',
    price: 14,
    tier: 4,
    desc: 'Tier 4 Sanguine Harvest: Whenever ANY token is shattered on the board, restore +1 Seismic Stability and gain +$1 Gold per token shattered!'
  },

  // TIER 5 (Act V — Unlocks after Boss Fight 4, 3 Gambits)
  flywheel_coil: {
    id: 'flywheel_coil',
    name: 'Perpetual Flywheel Coil',
    icon: '⚙️',
    price: 15,
    tier: 5,
    desc: 'Tier 5 Kinetic Overcharge: Every 3rd token you drop onto the board generates +1 Mana Crystal and +$2 Gold!'
  },
  sacred_heart_prism: {
    id: 'sacred_heart_prism',
    name: 'Sacred Prismatic Heart',
    icon: '❤️‍🔥',
    price: 16,
    tier: 5,
    desc: 'Tier 5 Divinity: Start every floor with +1 extra Amplifier Slot on the board and +1 Mana. Landing on ANY Enchanted Slot also draws 1 card and restores +1 Mana!'
  },
  alkahest_vial: {
    id: 'alkahest_vial',
    name: 'Universal Alkahest Vial',
    icon: '🧪',
    price: 16,
    tier: 5,
    desc: 'Tier 5 Universal Solvent: Start every floor with +1 Mana, and clearing a floor dissolves all Petrified Stone on the board for +$2 bonus Gold each (minimum +$3 Gold)!'
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

// Non-Boss Standard Cavern Guardians (Floors 1, 2, 4, 5, 7, 8, 10, 11, 13, 14)
const SENTINEL_NAMES = [
  'Cavern Pebble Scout',
  'Deep Slate Sentinel',
  'Basalt Gatekeeper',
  'Obsidian Patrolman',
  'Subterranean Watcher',
  'Abyssal Vanguard',
  'Astral Rift Warden',
  'Singularity Stalker',
  'Tesseract Prelate',
  'Sovereign Herald'
];

// ============================================================================
// TIERED BOSS ABILITY POOLS BY ACT (Act I -> Act II -> Act III -> Act IV -> Act V)
// ============================================================================
const BOSS_POOLS_BY_ACT = {
  EASY: [
    {
      id: 'spore_queen',
      poolTier: 'EASY',
      poolLabel: 'Act I Boss Pool',
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
      poolLabel: 'Act I Boss Pool',
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
      poolLabel: 'Act II Boss Pool',
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
      poolLabel: 'Act II Boss Pool',
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
      poolLabel: 'Act III Boss Pool',
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
      poolLabel: 'Act III Boss Pool',
      maxHp: 3,
      interval: 2,
      name: 'Tectonic Behemoth',
      icon: '🦖',
      shortTelegraph: 'Quakes -1 Stability & drops Blocker Stone',
      fullRule: 'Every 2 turns, slams the cavern floor—draining -1 extra Seismic Stability and dropping a heavy Petrified Stone blocker!'
    }
  ],
  ACT4: [
    {
      id: 'abyssal_lodestone',
      poolTier: 'ACT4',
      poolLabel: 'Act IV Singularity Boss Pool',
      maxHp: 4,
      name: 'The Abyssal Lodestone',
      icon: '🧲',
      interval: 3,
      shortTelegraph: 'Pulls neighbor tokens into Singularity Col (Flushes board at 2/4 ❤️)',
      fullRule: 'Every 3 turns, triggers a Magnetic Pulse—pulling the top tokens from adjacent columns horizontally into the marked Singularity Column! MIDPOINT CATACLYSM: After taking 2 hearts of damage (at 2/4 ❤️), violently shakes ALL pieces out of the board for a clean arena!'
    },
    {
      id: 'void_weaver',
      poolTier: 'ACT4',
      poolLabel: 'Act IV Singularity Boss Pool',
      maxHp: 4,
      name: 'The Void Weaver',
      icon: '🕸️',
      interval: 3,
      shortTelegraph: 'Spins Cursed Silk snares & drags top Player token (Flushes at 2/4 ❤️)',
      fullRule: 'Every 3 turns, weaves Cursed Spore & Spider Web snares across open slots and drags your highest token laterally into a silk-bound column! MIDPOINT CATACLYSM: After taking 2 hearts of damage (at 2/4 ❤️), violently shakes ALL pieces out of the board for a clean arena!'
    }
  ],
  FINAL: [
    {
      id: 'sovereign_tesseract',
      poolTier: 'FINAL',
      poolLabel: 'Act V Sovereign Final Boss',
      maxHp: 5,
      name: 'The Sovereign Tesseract',
      icon: '🌌',
      interval: 3,
      shortTelegraph: 'Rotates between 4 Parallel Boards in play!',
      fullRule: 'THE FOUR-BOARD CONVERGENCE (5 HP Phases): Commands 4 Parallel Connect-4 Boards in play simultaneously! Every 3 turns (and whenever a Boss HP heart is shattered), rotates the 3D Tesseract Carousel—saving the current board state and sliding the next parallel board into play!'
    }
  ]
};

const BOSS_ARCHETYPES = [
  ...BOSS_POOLS_BY_ACT.EASY,
  ...BOSS_POOLS_BY_ACT.MEDIUM,
  ...BOSS_POOLS_BY_ACT.HARD,
  ...BOSS_POOLS_BY_ACT.ACT4,
  ...BOSS_POOLS_BY_ACT.FINAL
];


// ============================================================================
// BINDING OF ISAAC-STYLE SIMPLIFIED LORE TOOLTIPS (ENRICHMENT TABLE)
// Suggests item effects through atmospheric subterranean lore without dense math
// ============================================================================
const C4_LORE_TOOLTIPS = {
  cards: {
    pebble: {
      loreShortDesc: 'Steady ceiling • Loose coin',
      loreDesc: '“A humble wedge stone.” Bolsters the trembling cavern roof and shakes loose a glint of gold.'
    },
    oracle_peek: {
      loreShortDesc: 'Free light • Draw & steady',
      loreDesc: '“Guiding subterranean flame.” Costs no mana; illuminates your next arcane card and calms the ceiling.'
    },
    loaded_knucklebones: {
      loreShortDesc: 'Free bone roll • Fate decides',
      loreDesc: '“Shaved ivory dice.” Cast for free above a column—low rolls steady the earth, high rolls drop a piece and mint gold.'
    },
    leech_lancet: {
      loreShortDesc: 'Blood price • Mana, card & coin',
      loreDesc: '“Forbidden surgical pact.” Trades cavern stability for an immediate surge of mana, card draw, and two gold coins.'
    },
    petrified: {
      loreShortDesc: 'Drop dead-stone blocker',
      loreDesc: '“Calcified ancient timber.” Seals a slot with neutral stone that blocks lines and elevates the column in one turn.'
    },
    jar_of_flies: {
      loreShortDesc: 'Fickle swarm • Feast or stone',
      loreDesc: '“Buzzing blind accompaniment.” Either devours an exposed rival piece for gold or calcifies into a stone blocker.'
    },
    pickaxe: {
      loreShortDesc: 'Shatter all column stone',
      loreDesc: '“Heavy iron miner’s swing.” Cleaves every petrified stone blocker out of the chosen column.'
    },
    guano_fertilizer: {
      loreShortDesc: 'Purge spores • Plant Spice',
      loreDesc: '“Pungent alchemical poultice.” Cleanses toxic spores from a column and seeds the next slot with fiery Spice.'
    },
    rusty_bear_trap: {
      loreShortDesc: 'Snap top foe or rig Web',
      loreDesc: '“Serrated iron jaws.” Bites off an exposed rival piece for bounty gold, or rigs an empty slot with a spider web.'
    },
    divining_wishbone: {
      loreShortDesc: 'Measure vs. center spire',
      loreDesc: '“Snap for fortune.” Compares column height against the center spire to grant either a free piece drop or bonus coin.'
    },
    tar_bubble: {
      loreShortDesc: 'Sink highest foe to bedrock',
      loreDesc: '“Viscous black pitch.” Drags the column’s highest rival piece down to the very bottom, floating yours upward.'
    },
    tectonic_anchor: {
      loreShortDesc: 'Bolster roof • Gild slot',
      loreDesc: '“Dwarven keystone press.” Heavily reinforces the cavern ceiling and gilds or amplifies the next open slot below.'
    },
    sinkhole_chute: {
      loreShortDesc: 'Flush bottom-row pieces',
      loreDesc: '“Unbolt the cellar.” Shakes the floor and drops random bottom-row tokens out of the board.'
    },
    lodestone: {
      loreShortDesc: 'Float your pieces to top',
      loreDesc: '“Magnetic polarity.” Pulls all of your amber tokens in a column to the top of the stack while sinking the rest.'
    },
    hibachi: {
      loreShortDesc: 'Sear exposed foe • Steady',
      loreDesc: '“Sizzling wok flare.” Incinerates an exposed rival token at the top of the column and steadies the cavern.'
    },
    alchemy_crucible: {
      loreShortDesc: 'Melt blocker -> Wild ring',
      loreDesc: '“Transmuting acid.” Dissolves a column’s top rival or stone blocker into gold and leaves a Wild Amplifier ring behind.'
    },
    guillotine_blade: {
      loreShortDesc: 'Behead tallest foe of 3 cols',
      loreDesc: '“Weighted executioner.” Sweeps a 3-column span and severs the topmost piece of the tallest rival or stone stack.'
    },
    mercury_siphon: {
      loreShortDesc: 'Purify & slide top piece',
      loreDesc: '“Alembic tube.” Siphons a column’s top token into the best adjacent column, purifying rival or stone into your color.'
    },
    mimic_tooth: {
      loreShortDesc: 'Chew column stone into gold',
      loreDesc: '“Ravenous treasure fang.” Devours every stone blocker in a column for rich coin—or chomps the top foe if none exist.'
    },
    inversion: {
      loreShortDesc: 'Flip column upside down',
      loreDesc: '“As above, so below.” Reverses gravity in a single column, flipping its entire token stack upside down.'
    },
    pendulum_scythe: {
      loreShortDesc: 'Reap across horizontal row',
      loreDesc: '“Clockwork crescent.” Swings horizontally across the board to cleave rival and stone tokens at the target height.'
    },
    wax_effigy: {
      loreShortDesc: 'Convert top foe • Hex neighbor',
      loreDesc: '“Sympathetic voodoo.” Turns a column’s highest rival token to your side and spins a web trap next door.'
    },
    transmute: {
      loreShortDesc: 'Turn top blocker into yours',
      loreDesc: '“Philosopher’s touch.” Warps the topmost rival or stone piece in a column into your own amber token.'
    },
    echo_drop: {
      loreShortDesc: 'Drop 2 tokens at once',
      loreDesc: '“Twin tuning forks.” Resonant acoustic waves drop two of your amber tokens stacked into one column.'
    },
    hydraulic_piston: {
      loreShortDesc: 'Swap two neighboring columns',
      loreDesc: '“Dwarven steam-ram.” Pushes the entire vertical stack of a column across to trade places with its neighbor.'
    },
    abyssal_upheaval: {
      loreShortDesc: 'Flip the entire board 180°',
      loreDesc: '“Cataclysmic table-turn.” Physically flips the entire cavern board and every column stack upside down.'
    },
    ouroboros_fang: {
      loreShortDesc: 'Devour 3 bases • Loop yours up',
      loreDesc: '“The eternal serpent.” Swallows the bottom of three columns—digesting foes into gold and regurgitating your pieces on top.'
    },
    croupier_jackpot: {
      loreShortDesc: 'Drop piece • Gild • Ring payout',
      loreDesc: '“The house always wins.” Drops your token, gilds the column above, and pays out coin for every active board ring.'
    },
    brimstone_beam: {
      loreShortDesc: 'Vaporize all foes in column',
      loreDesc: '“Blood-sulfur barrage.” Obliterates every rival and stone piece in an entire column while leaving yours untouched.'
    },
    basilisk_gaze: {
      loreShortDesc: 'Petrify foes & shatter for gold',
      loreDesc: '“Lethal reptilian stare.” Turns exposed rival tokens into stone and shatters one into a shower of gold.'
    },
    seraphim_halo: {
      loreShortDesc: 'Sanctify foe to yours + drop',
      loreDesc: '“Six-winged benediction.” Converts the highest rival or stone piece in the column to your side and drops another piece on top.'
    },
    dead_weight: {
      loreShortDesc: 'Curse • Spend mana to banish',
      loreDesc: '“Hexed burden.” Clutters your hand until you spend mana on any column to pulverize it forever.'
    }
  },

  reserves: {
    fools_penny: {
      loreDesc: '“Heads you win.” Drops your piece and flips a crooked coin—usually minting rich gold and mana, unless it turns to stone.'
    },
    loaded_die: {
      loreDesc: '“High roller’s bone.” Drops your piece and rolls for bonus gold, stability, card draw, or a natural-6 full jackpot.'
    },
    anvil: {
      loreDesc: '“Crushing weight.” Drops onto an exposed rival or stone piece, pulverizing it for bounty gold.'
    },
    cave_bat: {
      loreDesc: '“Vampiric bite.” Drops your piece and latches onto the blocker below, converting it to your color.'
    },
    jalapeno_bomb: {
      loreDesc: '“Spicy demolition.” Drops your piece and detonates in a fiery cross, shattering nearby rival tokens.'
    },
    acid_slug: {
      loreDesc: '“Corrosive trail.” Drops your piece and dissolves every petrified stone in the column into gold coins.'
    },
    parasite_egg: {
      loreDesc: '“Silken brood.” Hatches on impact to spin sticky spider web traps into both neighboring columns.'
    },
    powder_keg: {
      loreDesc: '“Downward blast.” Drops your piece and blows away blockers underneath it for demolition gold.'
    },
    quicksilver_glob: {
      loreDesc: '“Slippery mercury.” Drops your piece and sinks underneath a rival or stone blocker below to convert it.'
    },
    midas_eye: {
      loreDesc: '“Golden touch.” Drops your piece, converts adjacent blockers to your side, and gilds the slot above.'
    },
    eclipse_idol: {
      loreDesc: '“Black sun totem.” Drops your piece, draws a spell, restores mana, and crowns the column with an Amplifier trap.'
    }
  },

  gambits: {
    shrinking_shroom: {
      loreDesc: '“Fun-sized tokens!” Visually shrinks your pieces and squeaks out bonus gold and stability every few drops.'
    },
    lucky_rabbit_paw: {
      loreDesc: '“Lucky charm.” Shores up starting cavern stability each floor and tips a gold coin whenever you cast a cheap spell.'
    },
    butter_crust: {
      loreDesc: '“Edge artisan.” Dropping tokens along the far left or right walls rewards bonus coin and stability.'
    },
    amber_flea: {
      loreDesc: '“Ancient resin.” Spawns an extra Gilded ring on every floor and makes Gilded slots pay out richer gold.'
    },
    plumb_bob: {
      loreDesc: '“True center.” Dropping tokens down the middle spire mints a gold coin and steadies the ceiling.'
    },
    dali_clock: {
      loreDesc: '“Persistence of memory.” Unlocks the AI’s inner column evaluation scores and discounts gravity-warping spells.'
    },
    echo_bell: {
      loreDesc: '“Ringing resonance.” Reserve tokens echo on impact, triggering their landing power a second time.'
    },
    coaster_apex: {
      loreDesc: '“Airtime momentum.” Dropping tokens in ascending left-to-right steps surges with bonus mana and gold.'
    },
    copper_retort: {
      loreDesc: '“Spellweaver’s flask.” Casting two arcane cards in the same turn distills refund mana and coin.'
    },
    obsidian_cat: {
      loreDesc: '“Nine lives.” Claws away the AI’s winning fourth piece once per floor and pays bounty coin on shatters.'
    },
    jalapeno_overdrive: {
      loreDesc: '“Spicy ignition.” Grants extra starting mana, and shattering tokens periodically converts a random foe to your side.'
    },
    jeweler_loupe: {
      loreDesc: '“Master appraiser.” Draws an extra opening card each floor and rewards gold when casting mastery spells.'
    },
    crimson_chalice: {
      loreDesc: '“Blood harvest.” Every token shattered on the board restores ceiling stability and mints gold.'
    },
    flywheel_coil: {
      loreDesc: '“Perpetual motion.” Every third token you drop onto the board sparks a burst of mana and coin.'
    },
    sacred_heart_prism: {
      loreDesc: '“Divine prism.” Spawns extra Amplifier rings, and landing on any enchanted ring draws a card and mana.'
    },
    alkahest_vial: {
      loreDesc: '“Universal solvent.” Grants extra starting mana and dissolves all stone on the board into gold upon floor victory.'
    }
  },

  wheel: {
    jackpot_hoard: 'A royal windfall of gold coins and a Golden Midas Eye token!',
    pickpocket_gremlin: 'A cave gremlin ambushes your pouch and runs off with half your gold!',
    relic_vault: 'Cracks open an ancient vault containing a free Gambit Relic!',
    cave_in_hazard: 'Starts the next floor with falling stone blockers and a weakened ceiling!',
    arcane_surge: 'Charges the next floor with bonus mana and a volatile Jalapeño Bomb!',
    hex_of_abyss: 'Slips a Dead Weight stone curse into your deck and drains next floor’s mana!',
    gilded_blessing: 'Seeds the next cavern floor with three extra golden enchanted rings!',
    ai_headstart: 'The cavern guardian claims a two-token headstart on the next floor!',
    tectonic_reinforce: 'Reinforces the next cavern ceiling with extra turns of stability!'
  },

  bosses: {
    spore_queen: 'Periodically infects empty board slots with mana-draining mycelial spores.',
    chronos_dali: 'Periodically flips the entire token stack upside down in the marked warning column.',
    petrifier_archon: 'Periodically calcifies your highest token in the fullest column into neutral stone.',
    mirror_virtuoso: 'Periodically swaps the colors of two exposed surface tokens across the board.',
    magma_leviathan: 'Periodically melts the bottom-most token of a column, shifting the stack downward.',
    tectonic_behemoth: 'Rapidly quakes the cavern ceiling and drops heavy stone blockers.',
    abyssal_lodestone: '“Living magnetic singularity.” Warps adjacent pieces toward its marked core—and shakes the entire board clean at half health!',
    void_weaver: '“Arachnid of the astral fault.” Spins cursed silk snares across the grid—and shakes the entire board clean at half health!',
    sovereign_tesseract: '“Architect of the fourfold nexus.” Rotates between four parallel Connect-4 boards in play, preserving each board as the carousel turns!'
  }
};

(function applyLoreTooltipsToCatalogs() {
  if (typeof CARD_CATALOG !== 'undefined') {
    for (const [id, data] of Object.entries(C4_LORE_TOOLTIPS.cards)) {
      if (CARD_CATALOG[id]) Object.assign(CARD_CATALOG[id], data);
    }
  }
  if (typeof RESERVE_CATALOG !== 'undefined') {
    for (const [id, data] of Object.entries(C4_LORE_TOOLTIPS.reserves)) {
      if (RESERVE_CATALOG[id]) Object.assign(RESERVE_CATALOG[id], data);
    }
  }
  if (typeof GAMBIT_CATALOG !== 'undefined') {
    for (const [id, data] of Object.entries(C4_LORE_TOOLTIPS.gambits)) {
      if (GAMBIT_CATALOG[id]) Object.assign(GAMBIT_CATALOG[id], data);
    }
  }
  if (typeof ROULETTE_WEDGES !== 'undefined' && Array.isArray(ROULETTE_WEDGES)) {
    ROULETTE_WEDGES.forEach((w) => {
      if (w && C4_LORE_TOOLTIPS.wheel[w.id]) {
        w.loreDesc = C4_LORE_TOOLTIPS.wheel[w.id];
      }
    });
  }
  if (typeof BOSS_ARCHETYPES !== 'undefined' && Array.isArray(BOSS_ARCHETYPES)) {
    BOSS_ARCHETYPES.forEach((b) => {
      if (b && C4_LORE_TOOLTIPS.bosses[b.id]) {
        b.loreRule = C4_LORE_TOOLTIPS.bosses[b.id];
      }
    });
  }
})();


// ============================================================================
// ONE-LINE ISAAC-STYLE SHOP WHISPERS FOR SIMPLIFIED BAZAAR & BOSS CHEST VIEW
// Boiled down to just the brief quoted lore blurb for shop pedestals/rows
// ============================================================================
const C4_SHOP_WHISPERS = {
  cards: {
    pebble: '“A humble wedge stone.”',
    oracle_peek: '“Guiding subterranean flame.”',
    loaded_knucklebones: '“Shaved ivory dice.”',
    leech_lancet: '“Forbidden surgical pact.”',
    petrified: '“Calcified ancient timber.”',
    jar_of_flies: '“Buzzing blind accompaniment.”',
    pickaxe: '“Heavy iron miner’s swing.”',
    guano_fertilizer: '“Pungent alchemical poultice.”',
    rusty_bear_trap: '“Serrated iron jaws.”',
    divining_wishbone: '“Snap for fortune.”',
    tar_bubble: '“Viscous black pitch.”',
    tectonic_anchor: '“Dwarven keystone press.”',
    sinkhole_chute: '“Unbolt the cellar.”',
    lodestone: '“Magnetic polarity.”',
    hibachi: '“Sizzling wok flare.”',
    alchemy_crucible: '“Transmuting acid.”',
    guillotine_blade: '“Weighted executioner.”',
    mercury_siphon: '“Alembic siphon tube.”',
    mimic_tooth: '“Ravenous treasure fang.”',
    inversion: '“As above, so below.”',
    pendulum_scythe: '“Clockwork crescent.”',
    wax_effigy: '“Sympathetic voodoo.”',
    transmute: '“Philosopher’s touch.”',
    echo_drop: '“Twin tuning forks.”',
    hydraulic_piston: '“Dwarven steam-ram.”',
    abyssal_upheaval: '“Cataclysmic table-turn.”',
    ouroboros_fang: '“The eternal serpent.”',
    croupier_jackpot: '“The house always wins.”',
    brimstone_beam: '“Blood-sulfur barrage.”',
    basilisk_gaze: '“Lethal reptilian stare.”',
    seraphim_halo: '“Six-winged benediction.”',
    dead_weight: '“Hexed burden.”'
  },
  reserves: {
    fools_penny: '“Heads you win.”',
    loaded_die: '“High roller’s bone.”',
    anvil: '“Crushing deadweight.”',
    cave_bat: '“Vampiric night-fang.”',
    jalapeno_bomb: '“Spicy core demolition.”',
    acid_slug: '“Corrosive brine trail.”',
    parasite_egg: '“Silken spider clutch.”',
    powder_keg: '“Downward black-powder blast.”',
    quicksilver_glob: '“Slippery liquid metal.”',
    midas_eye: '“All-gilding gaze.”',
    eclipse_idol: '“Black sun totem.”'
  },
  gambits: {
    shrinking_shroom: '“Fun-sized tokens!”',
    lucky_rabbit_paw: '“Charm of the warren.”',
    butter_crust: '“Crispy golden edge.”',
    amber_flea: '“Trapped in golden resin.”',
    plumb_bob: '“True center weight.”',
    dali_clock: '“Persistence of memory.”',
    echo_bell: '“Ringing twin resonance.”',
    coaster_apex: '“Ascending airtime thrill.”',
    copper_retort: '“Spellweaver’s condensing flask.”',
    obsidian_cat: '“Nine lives.”',
    jalapeno_overdrive: '“Heartburn ignition.”',
    jeweler_loupe: '“Master appraiser’s eye.”',
    crimson_chalice: '“Sanguine blood harvest.”',
    flywheel_coil: '“Perpetual kinetic dynamo.”',
    sacred_heart_prism: '“Blessed prismatic radiance.”',
    alkahest_vial: '“Universal stone solvent.”'
  }
};

(function applyShopWhispers() {
  if (typeof CARD_CATALOG !== 'undefined') {
    for (const [id, w] of Object.entries(C4_SHOP_WHISPERS.cards)) {
      if (CARD_CATALOG[id]) CARD_CATALOG[id].shopWhisper = w;
    }
  }
  if (typeof RESERVE_CATALOG !== 'undefined') {
    for (const [id, w] of Object.entries(C4_SHOP_WHISPERS.reserves)) {
      if (RESERVE_CATALOG[id]) RESERVE_CATALOG[id].shopWhisper = w;
    }
  }
  if (typeof GAMBIT_CATALOG !== 'undefined') {
    for (const [id, w] of Object.entries(C4_SHOP_WHISPERS.gambits)) {
      if (GAMBIT_CATALOG[id]) GAMBIT_CATALOG[id].shopWhisper = w;
    }
  }
})();
