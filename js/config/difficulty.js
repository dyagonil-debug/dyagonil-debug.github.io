// ============================================================================
// THEMED CAVERN DESCENT DIFFICULTY TIERS (js/config/difficulty.js)
//   • Scaled across all 5 Acts (15 Floors: 3 Floors per Act [Sentinel, Vanguard, Boss])
//   • Act I (F1–3) -> Act II (F4–6) -> Act III (F7–9) -> Act IV (F10–12) -> Act V (F13–15)
// ============================================================================
const DIFFICULTY_STORAGE_KEY = 'c4_subterranean_difficulty';

const DIFFICULTY_TIERS = {
  EASY: {
    id: 'EASY',
    name: 'Glowworm Grotto',
    shortBadge: '🟢 Glowworm',
    fullBadge: '🟢 Glowworm Grotto (Easy)',
    subtitle: 'Explorer Mode • Forgiving',
    loreDescription: 'Warm bioluminescent shallows where the caverns are forgiving and the guardians slumber.',
    badgeClass: 'border-emerald-500/45 bg-emerald-950/70 text-emerald-300',
    cardClass: 'border-emerald-500/45 hover:border-emerald-400 bg-emerald-950/30',
    description:
      'Bioluminescent shallows with rapid +2 Mana/turn recovery, generous card draw (3-card opening hand & 2 cards drawn every odd turn), 25% off Bazaar prices, and a relaxed D1–D4 AI across 5 Acts.',
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
    // 5-Act Progression: Act I (D1) -> Act II (D1–2) -> Act III (D2) -> Act IV (D2–3) -> Act V (D3–4)
    depthByFloor:     [1, 1, 1,  1, 1, 2,  2, 2, 2,  2, 2, 3,  3, 3, 4],
    blunderByFloor:   [0.55, 0.52, 0.46,  0.44, 0.40, 0.35,  0.34, 0.30, 0.26,  0.25, 0.22, 0.18,  0.18, 0.15, 0.12],
    missBlockByFloor: [0.48, 0.44, 0.38,  0.36, 0.32, 0.26,  0.25, 0.22, 0.18,  0.16, 0.14, 0.10,  0.10, 0.08, 0.05],
    missWinByFloor:   [0.30, 0.28, 0.24,  0.22, 0.20, 0.16,  0.15, 0.12, 0.10,  0.08, 0.06, 0.04,  0.04, 0.02, 0.00],
    evalNoiseByFloor: [180, 170, 155,  145, 135, 120,  110, 100, 90,  80, 70, 60,  50, 45, 35],
    blunderChance: 0.40,
    missBlockChance: 0.30,
    missWinRate: 0.18,
    evalNoiseRange: 120,
    centerBiasScale: 0.15,
    ignoreEnchantSlots: true
  },

  MEDIUM: {
    id: 'MEDIUM',
    name: 'Obsidian Delve',
    shortBadge: '🟡 Obsidian',
    fullBadge: '🟡 Obsidian Delve (Medium)',
    subtitle: 'Spelunker Mode • Balanced',
    loreDescription: 'Shadowed basalt depths where cunning sentinels test your wits on equal ground.',
    badgeClass: 'border-amber-500/45 bg-amber-950/70 text-amber-300',
    cardClass: 'border-amber-500/45 hover:border-amber-400 bg-amber-950/30',
    description:
      'The intended tactical roguelike descent. Steady +1 Mana/turn recovery, 1 card drawn per turn (2-card opening hand), standard Bazaar pricing, and balanced D2–D7 AI scaling across all 5 Acts.',
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
    // 5-Act Progression: Act I (D2–3) -> Act II (D3–4) -> Act III (D4–5) -> Act IV (D5–6) -> Act V (D6–7, D8 Enraged)
    depthByFloor:     [2, 2, 3,  3, 3, 4,  4, 4, 5,  5, 5, 6,  6, 6, 7],
    blunderByFloor:   [0.22, 0.19, 0.15,  0.14, 0.12, 0.10,  0.09, 0.07, 0.05,  0.05, 0.04, 0.02,  0.02, 0.01, 0.00],
    missBlockByFloor: [0.12, 0.08, 0.04,  0.04, 0.02, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00],
    missWinByFloor:   [0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00],
    evalNoiseByFloor: [40, 36, 30,  26, 22, 18,  15, 12, 10,  8, 6, 4,  3, 2, 0],
    blunderChance: 0.08,
    missBlockChance: 0.0,
    missWinRate: 0.0,
    evalNoiseRange: 18,
    centerBiasScale: 1.0,
    ignoreEnchantSlots: false
  },

  HARD: {
    id: 'HARD',
    name: 'Abyssal Cataclysm',
    shortBadge: '🔴 Abyssal',
    fullBadge: '🔴 Abyssal Cataclysm (Hard)',
    subtitle: 'Grandmaster Mode • Ruthless',
    loreDescription: 'Crushing, lightless chasms ruled by a merciless grandmaster intelligence.',
    badgeClass: 'border-rose-500/50 bg-rose-950/75 text-rose-300',
    cardClass: 'border-rose-500/50 hover:border-rose-400 bg-rose-950/35',
    description:
      'Unforgiving depths. Throttled Mana recovery (+1 Mana every 2 turns) and scarce card draw (1 card every 2 turns, 1-card opening hand), +35% Bazaar inflation, and a ruthless D4–D8 solver across 5 Acts.',
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
    // 5-Act Progression: Act I (D4–5) -> Act II (D5–6) -> Act III (D6–7) -> Act IV (D7–8) -> Act V (D7–8, D9 Enraged)
    depthByFloor:     [4, 4, 5,  5, 5, 6,  6, 6, 7,  7, 7, 8,  8, 8, 8],
    blunderByFloor:   [0.06, 0.05, 0.04,  0.04, 0.03, 0.02,  0.02, 0.01, 0.01,  0.01, 0.00, 0.00,  0.00, 0.00, 0.00],
    missBlockByFloor: [0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00],
    missWinByFloor:   [0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00,  0.00, 0.00, 0.00],
    evalNoiseByFloor: [12, 10, 8,  6, 5, 4,  3, 2, 0,  0, 0, 0,  0, 0, 0],
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

  // Disable Boss final-HP phase enrage on Easy mode so Bosses stay approachable;
  // allow Hard Act IV/V D8 Bosses to enrage up to D9 on their final HP heart!
  const isEasy = diff.id === 'EASY';
  const phaseEnrage = (!isEasy && isBoss && typeof state !== 'undefined' && state.bossMaxHp > 1 && state.bossHp === 1) ? 1 : 0;
  const maxAllowedDepth = diff.id === 'HARD' ? 9 : 8;
  const depth = Math.min(maxAllowedDepth, diff.depthByFloor[clampedIdx] + phaseEnrage);

  const rawBlunder = diff.blunderByFloor[clampedIdx] ?? diff.blunderChance ?? 0;
  const floorBlunderRate = rawBlunder * (phaseEnrage ? 0.35 : 1.0);

  const rawMissBlock = diff.missBlockByFloor[clampedIdx] ?? diff.missBlockChance ?? 0;
  const floorMissBlockRate = (isBoss && !isEasy) ? 0 : (rawMissBlock * (phaseEnrage ? 0.0 : 1.0));

  const rawMissWin = (diff.missWinByFloor && diff.missWinByFloor[clampedIdx] !== undefined)
    ? diff.missWinByFloor[clampedIdx]
    : (diff.missWinRate || 0);
  const floorMissWinRate = phaseEnrage ? 0 : rawMissWin;

  const rawEvalNoise = (diff.evalNoiseByFloor && diff.evalNoiseByFloor[clampedIdx] !== undefined)
    ? diff.evalNoiseByFloor[clampedIdx]
    : (diff.evalNoiseRange || 0);
  const floorEvalNoise = phaseEnrage ? Math.round(rawEvalNoise * 0.5) : rawEvalNoise;

  const aiPrecisionPct = Math.round((1 - floorBlunderRate) * 100);

  const rawStability = isBoss ? 13 : (isPreBoss ? 14 : 15);
  const loadoutKit = (typeof getResolvedLoadoutKit === 'function' && typeof state !== 'undefined' && state)
    ? getResolvedLoadoutKit(state.loadoutId, state.difficulty)
    : null;
  const loadoutStabOffset = loadoutKit ? (loadoutKit.stabilityOffset || 0) : 0;
  const baseStability = Math.max(5, rawStability + (diff.stabilityOffset || 0) + loadoutStabOffset);

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
      floorMissWinRate,
      floorEvalNoise,
      aiPrecisionPct,
      stability: baseStability,
      telegraph: isPreBoss
        ? `Vanguard AI Lv.${floorNum} (D${depth} • ${aiPrecisionPct}% IQ)`
        : `Sentinel AI Lv.${floorNum} (D${depth} • ${aiPrecisionPct}% IQ)`,
      fullRule: isPreBoss
        ? `PRE-BOSS VANGUARD (AI Level ${floorNum}/${TOTAL_FLOORS} • Negamax Depth ${depth} • ${aiPrecisionPct}% Precision): Guards the Boss chamber on a procedurally carved board topology! Master the warped geometry before the multi-HP Boss fight next floor.`
        : `Standard Cavern Guardian (AI Level ${floorNum}/${TOTAL_FLOORS} • Negamax Depth ${depth} • ${aiPrecisionPct}% Precision). Fights on a classic 7x6 grid with no special boss countdown ability—use this floor to build Gold economy!`
    };
  }

  const bossNumber = Math.floor(floorIdx / 3);
  const defaultPools = [
    BOSS_POOLS_BY_ACT.EASY[0],
    BOSS_POOLS_BY_ACT.MEDIUM[0],
    BOSS_POOLS_BY_ACT.HARD[0],
    BOSS_POOLS_BY_ACT.ACT4[0],
    BOSS_POOLS_BY_ACT.FINAL[0]
  ];
  const arch = (state.shuffledBossPool && state.shuffledBossPool[bossNumber])
    ? state.shuffledBossPool[bossNumber]
    : defaultPools[Math.min(defaultPools.length - 1, bossNumber)];
  const effInterval = getEffectiveBossInterval(arch);
  const hpByBossIdx = [2, 3, 3, 4, 5];
  const maxHp = arch.maxHp || hpByBossIdx[Math.min(4, bossNumber)] || 3;

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
    floorMissWinRate,
    floorEvalNoise,
    aiPrecisionPct,
    stability: baseStability,
    telegraph: arch.shortTelegraph,
    fullRule: `${arch.poolLabel.toUpperCase()} (${maxHp} HP Phases • AI Lv.${floorNum} D${depth} • Trigger every ${effInterval}T): ${arch.fullRule} Each Connect-4 you score depletes 1 Boss HP, calcifies your winning token into neutral Petrified Stone, and continues the battle on the same board until all ${maxHp} HP are depleted!`
  };
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
