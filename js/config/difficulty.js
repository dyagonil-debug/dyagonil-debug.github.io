// ============================================================================
// 1.4 THEMED CAVERN DESCENT DIFFICULTY TIERS (js/config/difficulty.js)
// ============================================================================

const DIFFICULTY_STORAGE_KEY = 'c4_subterranean_difficulty';

const DIFFICULTY_TIERS = {
  EASY: {
    id: 'EASY',
    name: 'Glowworm Grotto',
    shortBadge: '🟢 Glowworm',
    fullBadge: '🟢 Glowworm Grotto (Easy)',
    subtitle: 'Explorer Mode • Forgiving',
    badgeClass: 'border-emerald-500/45 bg-emerald-950/70 text-emerald-300',
    cardClass: 'border-emerald-500/45 hover:border-emerald-400 bg-emerald-950/30',
    description:
      'Bioluminescent shallows with rapid +2 Mana/turn recovery, generous card draw (3-card opening hand & 2 cards drawn every odd turn), 25% off Bazaar prices, and a relaxed, forgiving Sentinel AI.',
    startingGold: 8,
    startingMaxMana: 2,
    startingHandSize: 3,
    manaRegenPerTurn: 2,
    manaRegenInterval: 1,
    manaRateLabel: '+2 Mana/T',
    cardsPerTurn: 1,
    bonusDrawEveryNTurns: 2,
    drawRateInterval: 1,
    drawRateLabel: '1–2 Cards/T',
    stabilityOffset: 6,
    bazaarPriceMultiplier: 0.75,
    rerollCost: 3,
    slotExpandCost: 6,
    extraEnchantedSlots: 1,
    bossCooldownOffset: 1,
    preSpawnStones: 0,
    bossHeadstartTokens: 0,
    starterGambitId: 'obsidian_cat',

    // Scaled-Back Easy AI Profile:
    // Caps search depth at D1–D2 across all 9 floors, raises blunder & missed-block rates,
    // reduces Column 4 center bias by 85%, and stops AI from sniping Gilded/Amplifier slots.
    depthByFloor: [1, 1, 1, 1, 1, 2, 1, 2, 2],
    blunderByFloor: [0.55, 0.52, 0.45, 0.48, 0.45, 0.40, 0.42, 0.38, 0.35],
    missBlockByFloor: [0.48, 0.45, 0.38, 0.42, 0.38, 0.32, 0.35, 0.30, 0.25],
    blunderChance: 0.48,
    missBlockChance: 0.40,
    missWinRate: 0.25,
    evalNoiseRange: 180,
    centerBiasScale: 0.15,
    ignoreEnchantSlots: true
  },

  MEDIUM: {
    id: 'MEDIUM',
    name: 'Obsidian Delve',
    shortBadge: '🟡 Obsidian',
    fullBadge: '🟡 Obsidian Delve (Medium)',
    subtitle: 'Spelunker Mode • Balanced',
    badgeClass: 'border-amber-500/45 bg-amber-950/70 text-amber-300',
    cardClass: 'border-amber-500/45 hover:border-amber-400 bg-amber-950/30',
    description:
      'The intended tactical roguelike descent. Steady +1 Mana/turn recovery, 1 card drawn per turn (2-card opening hand), standard Bazaar pricing, and balanced AI scaling.',
    startingGold: 3,
    startingMaxMana: 1,
    startingHandSize: 2,
    manaRegenPerTurn: 1,
    manaRegenInterval: 1,
    manaRateLabel: '+1 Mana/T',
    cardsPerTurn: 1,
    bonusDrawEveryNTurns: 0,
    drawRateInterval: 1,
    drawRateLabel: '1 Card/T',
    stabilityOffset: 0,
    bazaarPriceMultiplier: 1.0,
    rerollCost: 4,
    slotExpandCost: 8,
    extraEnchantedSlots: 0,
    bossCooldownOffset: 0,
    preSpawnStones: 0,
    bossHeadstartTokens: 0,
    starterGambitId: null,
    depthByFloor: [2, 3, 3, 4, 4, 5, 5, 6, 7],
    blunderByFloor: [0.18, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.02, 0.0],
    missBlockByFloor: [0.08, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    blunderChance: 0.10,
    missBlockChance: 0.0,
    missWinRate: 0.0,
    evalNoiseRange: 25,
    centerBiasScale: 1.0,
    ignoreEnchantSlots: false
  },

  HARD: {
    id: 'HARD',
    name: 'Abyssal Cataclysm',
    shortBadge: '🔴 Abyssal',
    fullBadge: '🔴 Abyssal Cataclysm (Hard)',
    subtitle: 'Grandmaster Mode • Ruthless',
    badgeClass: 'border-rose-500/50 bg-rose-950/75 text-rose-300',
    cardClass: 'border-rose-500/50 hover:border-rose-400 bg-rose-950/35',
    description:
      'Unforgiving depths. Throttled Mana recovery (+1 Mana every 2 turns) and scarce card draw (1 card every 2 turns, 1-card opening hand), +35% Bazaar inflation, and a ruthless D5–D8 solver.',
    startingGold: 2,
    startingMaxMana: 1,
    startingHandSize: 1,
    manaRegenPerTurn: 1,
    manaRegenInterval: 2,
    manaRateLabel: '+1M / 2 Turns',
    cardsPerTurn: 1,
    bonusDrawEveryNTurns: 0,
    drawRateInterval: 2,
    drawRateLabel: '1 Card / 2T',
    stabilityOffset: -2,
    bazaarPriceMultiplier: 1.35,
    rerollCost: 6,
    slotExpandCost: 10,
    extraEnchantedSlots: 0,
    bossCooldownOffset: -1,
    preSpawnStones: 1,
    bossHeadstartTokens: 1,
    starterGambitId: null,
    depthByFloor: [4, 5, 5, 6, 6, 7, 7, 8, 8],
    blunderByFloor: [0.04, 0.02, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    missBlockByFloor: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    blunderChance: 0.0,
    missBlockChance: 0.0,
    missWinRate: 0.0,
    evalNoiseRange: 0,
    centerBiasScale: 1.15,
    ignoreEnchantSlots: false
  }
};

function getActiveDifficulty() {
  const key = (typeof state !== 'undefined' && state && state.difficulty && DIFFICULTY_TIERS[state.difficulty])
    ? state.difficulty
    : 'MEDIUM';
  return DIFFICULTY_TIERS[key];
}

function getScaledPrice(basePrice) {
  const diff = getActiveDifficulty();
  return Math.max(1, Math.round(basePrice * (diff.bazaarPriceMultiplier || 1.0)));
}

function getEffectiveBossInterval(arch) {
  const diff = getActiveDifficulty();
  const base = (arch && arch.interval) ? arch.interval : 3;
  return Math.max(2, base + (diff.bossCooldownOffset || 0));
}

function getFloorConfig(floorIdx) {
  const floorNum = floorIdx + 1;
  const isBoss = isBossFloorIndex(floorIdx);
  const isPreBoss = isPreBossFloorIndex(floorIdx);
  const diff = getActiveDifficulty();
  const clampedIdx = Math.max(0, Math.min(floorIdx, TOTAL_FLOORS - 1));
  const depthArr = diff.depthByFloor || [2, 3, 3, 4, 4, 5, 5, 6, 7];
  const blunderArr = diff.blunderByFloor || [0.18, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.02, 0.0];
  const missBlockArr = diff.missBlockByFloor || [0.08, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

  // Disable Boss final-HP phase enrage on Easy mode so Bosses stay approachable
  const isEasy = diff.id === 'EASY';
  const phaseEnrage = (!isEasy && isBoss && typeof state !== 'undefined' && state.bossMaxHp > 1 && state.bossHp === 1) ? 1 : 0;
  const depth = Math.min(8, depthArr[clampedIdx] + phaseEnrage);
  const floorBlunderRate = blunderArr[clampedIdx] * (phaseEnrage ? 0.4 : 1.0);
  const floorMissBlockRate = missBlockArr[clampedIdx] * (phaseEnrage ? 0.0 : 1.0);
  const aiPrecisionPct = Math.round((1 - floorBlunderRate) * 100);

  const rawStability = isBoss ? 13 : (isPreBoss ? 14 : 15);
  const baseStability = Math.max(6, rawStability + (diff.stabilityOffset || 0));

  if (!isBoss) {
    const sentinelIdx = floorIdx - Math.floor(floorIdx / 3);
    const sName = SENTINEL_NAMES[sentinelIdx % SENTINEL_NAMES.length];
    return {
      floor: floorNum,
      isBoss: false,
      isPreBoss,
      maxHp: 1,
      boss: isPreBoss ? `⚔️ ${sName} (Vanguard)` : sName,
      bossArchetype: null,
      depth,
      floorBlunderRate,
      floorMissBlockRate,
      aiPrecisionPct,
      stability: baseStability,
      telegraph: isPreBoss
        ? `Vanguard AI Lv.${floorNum} (D${depth} • ${aiPrecisionPct}% IQ)`
        : `Sentinel AI Lv.${floorNum} (D${depth} • ${aiPrecisionPct}% IQ)`,
      fullRule: isPreBoss
        ? `PRE-BOSS VANGUARD (AI Level ${floorNum}/9 • Negamax Depth ${depth} • ${aiPrecisionPct}% Precision): Guards the Boss chamber on a procedurally carved board topology! Master the warped geometry before the multi-HP Boss fight next floor.`
        : `Standard Cavern Guardian (AI Level ${floorNum}/9 • Negamax Depth ${depth} • ${aiPrecisionPct}% Precision). Fights on a classic 7x6 grid with no special boss countdown ability—use this floor to build Gold economy!`
    };
  } else {
    const bossNumber = Math.floor(floorIdx / 3);
    const defaultPools = [BOSS_POOLS_BY_ACT.EASY[0], BOSS_POOLS_BY_ACT.MEDIUM[0], BOSS_POOLS_BY_ACT.HARD[0]];
    const arch = (state.shuffledBossPool && state.shuffledBossPool[bossNumber])
      ? state.shuffledBossPool[bossNumber]
      : defaultPools[bossNumber % 3];
    const effInterval = getEffectiveBossInterval(arch);
    const maxHp = bossNumber === 0 ? 2 : 3;
    return {
      floor: floorNum,
      isBoss: true,
      isPreBoss: false,
      maxHp,
      boss: `${arch.icon} ${arch.name}`,
      bossArchetype: arch,
      bossInterval: effInterval,
      depth,
      floorBlunderRate,
      floorMissBlockRate,
      aiPrecisionPct,
      stability: baseStability,
      telegraph: arch.shortTelegraph,
      fullRule: `${arch.poolLabel.toUpperCase()} (${maxHp} HP Phases • AI Lv.${floorNum} D${depth} • Trigger every ${effInterval}T): ${arch.fullRule} Each Connect-4 you score depletes 1 Boss HP, calcifies your winning token into neutral Petrified Stone, and continues the battle on the same board until all ${maxHp} HP are depleted!`
    };
  }
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    DIFFICULTY_STORAGE_KEY,
    DIFFICULTY_TIERS,
    getActiveDifficulty,
    getScaledPrice,
    getEffectiveBossInterval,
    getFloorConfig
  });
}
