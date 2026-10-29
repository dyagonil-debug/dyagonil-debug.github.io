// ============================================================================
// 1.4 CAVERN DESCENT DIFFICULTY TIERS (js/config/difficulty.js)
// ============================================================================

const DIFFICULTY_STORAGE_KEY = 'c4_ascension_difficulty_v1';

const DIFFICULTY_TIERS = {
  EASY: {
    id: 'EASY',
    name: 'Quartz Grotto',
    shortBadge: '🟢 Quartz',
    fullBadge: '🟢 Quartz Grotto (Easy)',
    subtitle: 'Relaxed Sandbox & Deckbuilder Flow',
    description:
      'Forgiving Sentinel AI that overlooks complex setups, leaves the center column open, and ignores Enchanted Slots so you can build wild Gambit & Arcane Card combos.',
    cardClass: 'border-emerald-500/50 bg-emerald-950/35 hover:border-emerald-400',
    badgeClass: 'border-emerald-500/40 bg-emerald-950/70 text-emerald-300',

    // Economy & Vessel Pacing
    startingGold: 10,
    startingMaxMana: 3,
    manaRegenInterval: 2,
    manaRateLabel: '+1 Mana / 2 Turns',
    startingHandSize: 4,
    drawInterval: 2,
    drawRateLabel: 'Draw 1 / 2 Turns',
    stabilityOffset: 6,
    stabilityBonusTurns: 6,
    shopCostDelta: -1,

    // AI Scaling & Mistake Profile (Significantly Scaled Back for Easy Mode)
    aiDepthOffset: -3,             // Drops standard Sentinels to Depth 1
    maxAiDepth: 1,                 // Hard ceiling of Depth 1 on normal floors
    bossMaxAiDepth: 2,             // Prevents Act II/III Bosses from becoming deep solvers
    blunderChance: 0.48,           // 48% chance to pick a sub-optimal playable column
    missBlockRate: 0.42,           // 42% chance to fail to block the player's 3-in-a-row threat
    missWinRate: 0.25,             // 25% chance for AI to overlook its own immediate 4-in-a-row win
    evalNoiseRange: 220,           // Wide heuristic jitter so column preferences vary organically
    centerBiasScale: 0.15,         // 85% reduction in Column 4 magnet so player can claim center
    ignoreEnchantSlots: true,      // AI will not snipe Gilded/Mana/Amplifier slots on Easy
    ignoreDoubleThreatSetup: true  // AI will not pre-block 2-ply split forks on Easy
  },

  MEDIUM: {
    id: 'MEDIUM',
    name: 'Obsidian Delve',
    shortBadge: '🟡 Obsidian',
    fullBadge: '🟡 Obsidian Delve (Medium)',
    subtitle: 'Balanced Roguelike Tactical Challenge',
    description:
      'The intended Subterranean Ascension experience. Sharp Sentinel AI with occasional tactical blind spots, standard Bazaar pricing, and balanced Seismic Stability timers.',
    cardClass: 'border-amber-500/50 bg-amber-950/35 hover:border-amber-400',
    badgeClass: 'border-amber-500/40 bg-amber-950/70 text-amber-300',

    // Economy & Vessel Pacing
    startingGold: 6,
    startingMaxMana: 2,
    manaRegenInterval: 3,
    manaRateLabel: '+1 Mana / 3 Turns',
    startingHandSize: 3,
    drawInterval: 3,
    drawRateLabel: 'Draw 1 / 3 Turns',
    stabilityOffset: 0,
    stabilityBonusTurns: 0,
    shopCostDelta: 0,

    // AI Scaling & Mistake Profile
    aiDepthOffset: 0,
    maxAiDepth: 5,
    bossMaxAiDepth: 6,
    blunderChance: 0.12,
    missBlockRate: 0.06,
    missWinRate: 0.0,
    evalNoiseRange: 30,
    centerBiasScale: 1.0,
    ignoreEnchantSlots: false,
    ignoreDoubleThreatSetup: false
  },

  HARD: {
    id: 'HARD',
    name: 'Abyssal Core',
    shortBadge: '🔴 Abyssal',
    fullBadge: '🔴 Abyssal Core (Hard)',
    subtitle: 'Unforgiving Grandmaster Solver',
    description:
      'Relentless deep-search Negamax AI with zero intentional blunders, aggressive Enchanted Slot denial, tighter Seismic Stability clocks, and steeper Bazaar inflation.',
    cardClass: 'border-rose-500/50 bg-rose-950/35 hover:border-rose-400',
    badgeClass: 'border-rose-500/40 bg-rose-950/70 text-rose-300',

    // Economy & Vessel Pacing
    startingGold: 4,
    startingMaxMana: 2,
    manaRegenInterval: 4,
    manaRateLabel: '+1 Mana / 4 Turns',
    startingHandSize: 3,
    drawInterval: 4,
    drawRateLabel: 'Draw 1 / 4 Turns',
    stabilityOffset: -2,
    stabilityBonusTurns: -2,
    shopCostDelta: 1,

    // AI Scaling & Mistake Profile
    aiDepthOffset: 1,
    maxAiDepth: 7,
    bossMaxAiDepth: 7,
    blunderChance: 0.0,
    missBlockRate: 0.0,
    missWinRate: 0.0,
    evalNoiseRange: 0,
    centerBiasScale: 1.25,
    ignoreEnchantSlots: false,
    ignoreDoubleThreatSetup: false
  }
};

function getActiveDifficulty() {
  const key = (typeof state !== 'undefined' && state && state.difficulty) ? state.difficulty : 'MEDIUM';
  return DIFFICULTY_TIERS[key] || DIFFICULTY_TIERS.MEDIUM;
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    DIFFICULTY_STORAGE_KEY,
    DIFFICULTY_TIERS,
    getActiveDifficulty
  });
}
