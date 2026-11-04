// ============================================================================
// RETRO 8-BIT CHIPTUNE SOUNDTRACK ENGINE (CAVERN, BOSS, BAZAAR & ROULETTE) (js/audio/bgm.js)
// ============================================================================

class SubterraneanChiptuneEngine {
  constructor(sfxInstance) {
    this.sfx = sfxInstance;
    this.isPlaying = false;
    this.isPausedForModal = false;
    this.isPausedForLevelIntro = false;
    this.hasStartedAfterDifficulty = false;
    this.currentMode = 'cavern'; // 'cavern' | 'boss1' | 'boss2' | 'boss3' | 'bazaar' | 'roulette'
    this.isSpinOverdrive = false;
    this.stepIndex = 0;
    this.timerId = null;
    this.noiseBuffer = null;

    // 1. 64-Step (4-Bar) Subterranean Exploration Loop (D Dorian / Natural Minor, 112 BPM)
    this.cavernTrack = {
      bpm: 112,
      cutoff: 2100,
      bassGain: 0.075,
      leadGain: 0.038,
      arpGain: 0.022,
      arpWave: 'square',
      vibratoDepth: 1.008,
      bass: [
        38, null, 38, 50, 38, null, 45, null,
        41, null, 41, 53, 43, null, 45, 48,
        38, null, 38, 50, 38, null, 45, null,
        36, null, 36, 48, 33, null, 36, 37,
        46, null, 46, 58, 45, null, 52, null,
        41, null, 41, 53, 40, null, 45, 49,
        38, null, 38, 50, 43, null, 43, 55,
        36, null, 40, 43, 33, 37, 40, 37
      ],
      lead: [
        62, null, 65, null, 69, null, 67, 65,
        64, null, 60, null, 62, null, null, null,
        62, null, 65, 67, 69, null, 72, null,
        71, 69, 67, null, 69, null, null, null,
        74, null, 70, null, 69, null, 67, 64,
        65, null, 69, null, 67, 64, 61, null,
        62, 65, 69, null, 71, 67, 62, null,
        64, 67, 72, 71, 69, null, 61, null
      ],
      arp: [
        74, 69, 65, 69, 74, 69, 65, 69,
        72, 69, 65, 69, 72, 67, 64, 67,
        74, 69, 65, 69, 77, 74, 69, 74,
        76, 72, 67, 72, 73, 69, 64, 69,
        74, 70, 65, 70, 76, 69, 64, 69,
        77, 72, 69, 72, 73, 69, 64, 69,
        74, 69, 65, 69, 79, 74, 71, 74,
        76, 72, 67, 72, 73, 69, 64, 61
      ],
      drums: [
        'K', 'H', null, 'H', 'S', 'H', null, 'K',
        'K', 'H', 'K', 'H', 'S', 'H', 'H', 'H',
        'K', 'H', null, 'H', 'S', 'H', null, 'K',
        'K', 'H', 'K', 'H', 'S', 'H', 'S', 'H',
        'K', 'H', null, 'K', 'S', 'H', null, 'K',
        'K', 'H', 'K', 'H', 'S', 'H', 'H', 'S',
        'K', 'H', null, 'H', 'S', 'H', 'K', 'H',
        'K', 'S', 'K', 'H', 'S', 'S', 'K', 'S'
      ]
    };

    // 2. BOSS 1 (Floor 3 — Act I Bioluminescent Guardian: "Mycelial Pendulum", D Dorian/Phrygian Groove, 138 BPM)
    this.boss1Track = {
      bpm: 138,
      cutoff: 2750,
      bassGain: 0.088,
      leadGain: 0.048,
      arpGain: 0.024,
      leadWave: 'square',
      arpWave: 'triangle',
      detuneCents: 6,
      vibratoDepth: 1.007,
      bass: [
        38, null, 38, 50, 41, null, 43, 45,
        38, null, 38, 50, 39, null, 36, 38,
        38, null, 41, 50, 43, null, 45, 52,
        46, 45, 43, 41, 39, null, 33, 37,
        43, null, 43, 55, 41, null, 41, 53,
        39, null, 39, 51, 38, null, 45, 50,
        40, null, 43, 52, 41, null, 45, 53,
        45, 43, 41, 39, 38, null, 50, null
      ],
      lead: [
        62, null, 65, 69, 74, null, 72, 69,
        70, 69, 65, null, 62, null, 64, 65,
        62, null, 69, 72, 74, null, 77, 76,
        74, 72, 70, 69, 67, null, 69, null,
        79, null, 77, 74, 76, null, 72, 69,
        75, null, 74, 70, 69, null, 65, 69,
        72, 70, 69, 72, 74, 77, 76, 72,
        74, null, 69, 65, 62, null, null, null
      ],
      arp: [
        62, 65, 69, 74, 65, 69, 72, 76,
        62, 65, 69, 74, 63, 67, 70, 75,
        62, 65, 69, 74, 67, 70, 74, 79,
        70, 67, 63, 62, 61, 64, 69, 73,
        67, 70, 74, 79, 65, 69, 72, 77,
        63, 67, 70, 75, 62, 65, 69, 74,
        64, 67, 72, 76, 65, 69, 74, 77,
        69, 73, 76, 81, 74, 69, 65, 62
      ],
      stab: [
        null, null, 57, null, null, null, 60, null,
        null, null, 57, null, 58, null, 55, null,
        null, null, 57, null, null, null, 62, null,
        63, null, 60, null, 57, null, 52, null,
        62, null, null, 62, 60, null, null, 60,
        58, null, null, 58, 57, null, null, 57,
        59, null, 60, null, 62, null, 64, null,
        61, null, 57, null, 62, null, null, null
      ],
      drums: [
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'H', 'K', 'S', 'K', 'O',
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'S', 'K', 'H', 'S', 'S', 'K', 'O',
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'K', 'S', 'H', 'K', 'O',
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'S', 'K', 'S', 'S', 'S', 'K', 'O'
      ]
    };

    // 3. BOSS 2 (Floor 6 — Act II Molten Obsidian Overlord: "Basalt & Brimstone", E Harmonic Minor, 152 BPM)
    this.boss2Track = {
      bpm: 152,
      cutoff: 3200,
      bassGain: 0.092,
      leadGain: 0.052,
      arpGain: 0.025,
      leadWave: 'sawtooth',
      arpWave: 'square',
      detuneCents: 9,
      vibratoDepth: 1.009,
      bass: [
        40, 52, 40, 52, 43, 55, 47, 59,
        45, 57, 43, 55, 42, 54, 35, 47,
        40, 52, 40, 52, 45, 57, 48, 60,
        47, 59, 46, 58, 47, 42, 39, 35,
        48, 60, 48, 60, 47, 59, 43, 55,
        45, 57, 45, 57, 40, 52, 43, 55,
        42, 54, 45, 57, 47, 59, 51, 63,
        52, 51, 48, 47, 45, 43, 42, 39
      ],
      lead: [
        64, null, 67, 71, 76, null, 75, 71,
        72, null, 69, 64, 66, null, 71, null,
        64, 67, 71, 76, 79, null, 78, 76,
        75, null, 71, 75, 76, null, null, null,
        84, null, 81, 76, 79, null, 76, 71,
        76, 74, 72, 69, 71, null, 76, null,
        78, 76, 75, 78, 79, 78, 76, 75,
        76, null, 71, 67, 64, null, null, null
      ],
      arp: [
        64, 67, 71, 76, 67, 71, 76, 79,
        69, 72, 76, 81, 66, 71, 75, 78,
        64, 67, 71, 76, 69, 72, 76, 81,
        71, 75, 78, 83, 66, 71, 75, 78,
        72, 76, 79, 84, 71, 76, 79, 83,
        69, 72, 76, 81, 64, 67, 71, 76,
        66, 69, 72, 78, 71, 75, 78, 83,
        76, 71, 67, 64, 71, 75, 78, 83
      ],
      stab: [
        64, null, null, 67, 71, null, null, 74,
        72, null, 69, null, 66, null, 71, null,
        64, null, null, 67, 69, null, 72, null,
        71, null, 75, null, 71, 66, 63, 59,
        72, null, 76, null, 71, null, 74, null,
        69, null, 72, null, 67, null, 71, null,
        66, null, 69, null, 71, null, 75, null,
        76, null, 71, 67, 64, null, null, null
      ],
      drums: [
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'S', 'O',
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'S', 'K', 'S', 'K', 'S', 'S', 'O',
        'K', 'K', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'K', 'O',
        'K', 'S', 'K', 'H', 'K', 'S', 'K', 'H',
        'S', 'S', 'K', 'S', 'K', 'S', 'S', 'O'
      ]
    };

    // 4. BOSS 3 (Floor 9 — Act III Eldritch Abyssal Sanctum: "Ophanim Blood-Pulse", C Hungarian Minor, 162 BPM)
    this.boss3Track = {
      bpm: 162,
      cutoff: 3500,
      bassGain: 0.095,
      leadGain: 0.054,
      arpGain: 0.026,
      leadWave: 'sawtooth',
      arpWave: 'sawtooth',
      detuneCents: 11,
      vibratoDepth: 1.011,
      bass: [
        36, 48, 36, 48, 39, 51, 42, 54,
        43, 55, 44, 56, 35, 47, 36, 48,
        36, 48, 39, 51, 42, 54, 43, 55,
        44, 43, 42, 39, 38, 36, 35, 31,
        44, 56, 44, 56, 43, 55, 39, 51,
        42, 54, 42, 54, 43, 55, 35, 47,
        36, 48, 39, 51, 42, 54, 44, 56,
        47, 44, 43, 42, 39, 36, 35, 36
      ],
      lead: [
        72, 75, 78, null, 79, 78, 75, 72,
        71, null, 74, 75, 72, null, 67, null,
        72, 75, 78, 79, 80, null, 83, 80,
        79, 78, 75, 74, 72, null, 84, null,
        80, null, 79, 75, 78, null, 75, 72,
        79, 78, 75, 71, 72, null, 79, null,
        75, 78, 79, 80, 83, 84, 83, 79,
        80, 79, 75, 71, 72, null, null, null
      ],
      arp: [
        60, 63, 66, 72, 63, 66, 72, 75,
        67, 71, 74, 79, 59, 63, 67, 71,
        60, 63, 66, 72, 66, 72, 75, 78,
        68, 72, 75, 80, 67, 71, 74, 79,
        68, 72, 75, 80, 67, 70, 75, 79,
        66, 69, 72, 78, 67, 71, 74, 79,
        60, 63, 66, 72, 68, 72, 75, 80,
        71, 74, 79, 83, 84, 79, 75, 72
      ],
      stab: [
        60, null, 63, null, 66, null, 67, null,
        68, null, 67, null, 59, null, 60, null,
        60, null, 63, null, 66, null, 72, null,
        68, 67, 66, 63, 62, 60, 59, 55,
        68, null, 72, null, 67, null, 70, null,
        66, null, 69, null, 67, null, 71, null,
        60, 63, 66, 68, 71, 74, 75, 79,
        72, null, 67, 63, 60, null, null, null
      ],
      drums: [
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'K', 'S', 'K', 'S', 'O',
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'S', 'K', 'S', 'S', 'S', 'K', 'O',
        'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'S', 'O',
        'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S',
        'S', 'S', 'K', 'S', 'K', 'S', 'S', 'O'
      ]
    };

    // 4B. BOSS 4 (Floor 12 — Act IV Astral Singularity Rift: "Magnetic Horizon", F# Phrygian Dominant, 170 BPM)
    this.boss4Track = {
      bpm: 170,
      cutoff: 3800,
      bassGain: 0.096,
      leadGain: 0.055,
      arpGain: 0.028,
      leadWave: 'square',
      arpWave: 'sawtooth',
      detuneCents: 12,
      vibratoDepth: 1.012,
      bass: [
        42, 54, 42, 54, 43, 55, 46, 58,
        47, 59, 45, 57, 43, 55, 42, 54,
        42, 54, 46, 58, 49, 61, 47, 59,
        45, 57, 43, 55, 42, 49, 46, 42,
        50, 62, 50, 62, 49, 61, 45, 57,
        47, 59, 47, 59, 46, 58, 42, 54,
        43, 55, 45, 57, 47, 59, 49, 61,
        54, 52, 50, 49, 47, 46, 43, 42
      ],
      lead: [
        66, 70, 73, 74, 73, 70, 66, 67,
        70, 73, 76, 74, 73, null, 78, null,
        82, 81, 78, 76, 74, 73, 70, 73,
        74, 76, 74, 73, 70, null, 66, null,
        83, null, 81, 78, 82, null, 78, 73,
        79, 78, 76, 74, 73, null, 78, 81,
        82, 81, 78, 76, 78, 81, 82, 85,
        86, 85, 82, 81, 78, null, null, null
      ],
      arp: [
        66, 70, 73, 78, 70, 73, 78, 82,
        67, 71, 74, 79, 66, 70, 73, 78,
        66, 70, 73, 78, 73, 76, 81, 85,
        71, 74, 78, 83, 70, 73, 78, 82,
        74, 78, 81, 86, 73, 76, 81, 85,
        71, 74, 79, 83, 70, 73, 78, 82,
        67, 71, 74, 79, 69, 73, 76, 81,
        70, 73, 78, 82, 85, 82, 78, 73
      ],
      stab: [
        66, null, 70, null, 67, null, 70, null,
        71, null, 69, null, 67, null, 66, null,
        66, null, 70, null, 73, null, 71, null,
        69, null, 67, null, 66, 70, 73, 78,
        74, null, 78, null, 73, null, 76, null,
        71, null, 74, null, 70, null, 73, null,
        67, 69, 71, 73, 74, 76, 78, 81,
        78, null, 73, 70, 66, null, null, null
      ],
      drums: [
        'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'K', 'O',
        'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H',
        'K', 'S', 'K', 'S', 'S', 'K', 'S', 'O',
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'K', 'S', 'S', 'K', 'O',
        'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S',
        'S', 'S', 'S', 'K', 'S', 'K', 'S', 'O'
      ]
    };

    // 4C. BOSS 5 (Floor 15 — Act V The Sovereign Tesseract: "Fourfold Convergence", D Symphonic Minor, 180 BPM)
    this.boss5Track = {
      bpm: 180,
      cutoff: 4200,
      bassGain: 0.102,
      leadGain: 0.058,
      arpGain: 0.030,
      leadWave: 'sawtooth',
      arpWave: 'square',
      detuneCents: 14,
      vibratoDepth: 1.014,
      bass: [
        38, 50, 38, 50, 41, 53, 45, 57,
        46, 58, 43, 55, 45, 57, 37, 49,
        38, 50, 41, 53, 43, 55, 46, 58,
        45, 57, 49, 61, 50, 45, 41, 38,
        46, 58, 46, 58, 43, 55, 43, 55,
        48, 60, 48, 60, 41, 53, 41, 53,
        46, 58, 44, 56, 45, 57, 49, 61,
        50, 49, 46, 45, 43, 41, 37, 38
      ],
      lead: [
        74, null, 77, 81, 86, null, 85, 81,
        82, 81, 79, 77, 81, null, 73, null,
        74, 77, 81, 82, 85, 86, 88, 86,
        85, 81, 79, 76, 74, null, 86, null,
        89, null, 86, 82, 86, null, 82, 79,
        88, null, 84, 79, 81, null, 77, 72,
        82, 81, 79, 82, 85, 86, 88, 89,
        90, 89, 86, 85, 81, 77, 74, null
      ],
      arp: [
        62, 65, 69, 74, 77, 81, 86, 81,
        70, 74, 79, 82, 69, 73, 76, 81,
        62, 65, 69, 74, 67, 70, 74, 79,
        69, 73, 76, 81, 74, 77, 81, 86,
        70, 74, 77, 82, 67, 70, 74, 79,
        72, 76, 79, 84, 65, 69, 72, 77,
        70, 74, 77, 82, 69, 73, 76, 81,
        74, 77, 81, 86, 90, 86, 81, 74
      ],
      stab: [
        62, 65, 69, 74, 65, 69, 74, 77,
        70, null, 67, null, 69, null, 61, null,
        62, null, 65, null, 67, null, 70, null,
        69, null, 73, null, 74, 69, 65, 62,
        70, null, 74, null, 67, null, 70, null,
        72, null, 76, null, 65, null, 69, null,
        70, 68, 69, 73, 74, 77, 81, 85,
        86, null, 81, 77, 74, null, null, null
      ],
      drums: [
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'O',
        'K', 'H', 'S', 'K', 'S', 'K', 'S', 'O',
        'K', 'K', 'S', 'H', 'K', 'K', 'S', 'O',
        'K', 'S', 'K', 'S', 'S', 'S', 'K', 'O',
        'K', 'K', 'S', 'K', 'K', 'H', 'S', 'O',
        'K', 'K', 'S', 'K', 'S', 'S', 'K', 'O',
        'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S',
        'S', 'S', 'S', 'S', 'K', 'S', 'K', 'O'
      ]
    };

    // 5. UNDERGROUND BAZAAR OUTPOST THEME (64-Step / 4-Bar Loop, 96 BPM, D Dorian Caravan)
    this.bazaarTrack = {
      bpm: 96,
      cutoff: 1850,
      bassGain: 0.072,
      leadGain: 0.036,
      arpGain: 0.020,
      arpWave: 'triangle',
      vibratoDepth: 1.006,
      bass: [
        38, null, 45, null, 50, null, 45, null,
        43, null, 47, null, 50, null, 45, 43,
        46, null, 50, null, 53, null, 50, null,
        45, null, 49, null, 52, null, 45, 37,
        38, null, 45, null, 40, null, 47, null,
        41, null, 48, null, 50, null, 45, null,
        43, null, 46, null, 50, null, 46, null,
        45, null, 52, null, 49, null, 45, 37
      ],
      lead: [
        62, null, 65, 67, 69, null, 71, null,
        69, null, 67, 65, 64, null, null, null,
        70, null, 69, 65, 67, null, 64, null,
        69, null, 67, 64, 61, null, null, null,
        62, null, 65, 69, 74, null, 72, 71,
        69, null, 67, 65, 67, null, 69, null,
        70, 69, 67, 65, 64, null, 67, null,
        61, null, 64, 67, 69, null, null, null
      ],
      arp: [
        74, 69, 65, 69, 77, 74, 69, 74,
        74, 71, 67, 71, 79, 74, 71, 67,
        74, 70, 65, 70, 77, 74, 70, 65,
        73, 69, 64, 69, 76, 73, 69, 64,
        74, 69, 65, 69, 76, 71, 67, 71,
        77, 72, 69, 72, 74, 69, 65, 69,
        74, 70, 67, 70, 79, 74, 70, 67,
        76, 73, 69, 73, 73, 69, 64, 61
      ],
      stab: [
        null, 57, null, null, null, 60, null, null,
        null, 59, null, null, null, 62, null, null,
        null, 58, null, null, null, 62, null, null,
        null, 57, null, null, null, 61, null, null,
        null, 57, null, null, null, 59, null, null,
        null, 60, null, null, null, 62, null, null,
        null, 58, null, null, null, 62, null, null,
        null, 57, null, 61, null, null, null, null
      ],
      drums: [
        'K', null, 'H', null, 'S', null, 'H', null,
        'K', null, 'H', 'K', 'S', null, 'H', null,
        'K', null, 'H', null, 'S', null, 'H', null,
        'K', null, 'H', null, 'S', 'H', 'K', 'H',
        'K', null, 'H', null, 'S', null, 'H', null,
        'K', null, 'H', 'K', 'S', null, 'H', null,
        'K', null, 'H', null, 'S', null, 'H', 'K',
        'K', 'H', 'S', 'H', 'K', 'S', 'H', null
      ]
    };

    // 6. WHEEL OF SUBTERRANEAN FATE THEME (64-Step Loop, 132 BPM -> 156 BPM Spin Overdrive, D Harmonic Minor)
    this.rouletteTrack = {
      bpm: 132,
      spinBpm: 156,
      cutoff: 2950,
      bassGain: 0.084,
      leadGain: 0.046,
      arpGain: 0.025,
      arpWave: 'sawtooth',
      vibratoDepth: 1.010,
      bass: [
        38, 50, 45, 50, 38, 50, 45, 50,
        38, 50, 44, 56, 45, 57, 43, 55,
        43, 55, 50, 55, 44, 56, 50, 56,
        38, 50, 45, 50, 46, 45, 44, 45,
        46, 58, 53, 58, 44, 56, 50, 56,
        45, 57, 49, 57, 52, 57, 49, 45,
        38, 50, 41, 53, 44, 56, 47, 59,
        45, 44, 45, 37, 38, null, 50, null
      ],
      lead: [
        74, null, 73, 74, 77, null, 74, null,
        80, null, 81, 80, 77, null, 74, null,
        79, null, 77, 75, 74, null, 70, null,
        69, 70, 73, 74, 77, null, 81, null,
        82, null, 81, 77, 80, null, 77, 74,
        73, null, 76, 79, 81, null, 85, null,
        86, 85, 82, 81, 80, 77, 74, 73,
        74, null, 81, 85, 86, null, null, null
      ],
      arp: [
        62, 65, 69, 74, 77, 74, 69, 65,
        62, 68, 74, 80, 81, 77, 74, 69,
        67, 70, 74, 79, 80, 74, 70, 68,
        62, 65, 69, 74, 70, 69, 68, 69,
        70, 74, 77, 82, 80, 77, 74, 68,
        69, 73, 76, 81, 85, 81, 76, 73,
        62, 65, 68, 71, 74, 77, 80, 83,
        81, 80, 81, 85, 86, 81, 77, 74
      ],
      stab: [
        62, null, null, 65, null, 69, null, null,
        68, null, null, 69, null, null, 67, null,
        67, null, null, 70, 68, null, null, null,
        62, null, 69, null, 70, 69, 68, 69,
        70, null, null, 74, 68, null, null, null,
        69, null, null, 73, null, 76, null, null,
        62, null, 65, null, 68, null, 71, null,
        69, 68, 69, 73, 74, null, null, null
      ],
      drums: [
        'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'S', 'H',
        'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'S', 'K', 'S', 'K', 'S', 'S', 'S',
        'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'K', 'S', 'H', 'K', 'S', 'H', 'K',
        'K', 'S', 'K', 'S', 'K', 'S', 'K', 'S',
        'K', 'K', 'S', 'S', 'K', null, 'S', null
      ]
    };

    this.tracksByMode = {
      cavern: this.cavernTrack,
      boss1: this.boss1Track,
      boss2: this.boss2Track,
      boss3: this.boss3Track,
      boss4: this.boss4Track,
      boss5: this.boss5Track,
      bazaar: this.bazaarTrack,
      roulette: this.rouletteTrack
    };
  }

  get ctx() {
    this.sfx.init();
    return this.sfx.ctx;
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  isBossMode() {
    return this.currentMode.startsWith('boss');
  }

  getActiveTrack() {
    return this.tracksByMode[this.currentMode] || this.cavernTrack;
  }

  getEffectiveBpm(track) {
    if (this.currentMode === 'roulette' && this.isSpinOverdrive && track.spinBpm) {
      return track.spinBpm;
    }
    return track.bpm || 112;
  }

  ensureNoiseBuffer() {
    const ctx = this.ctx;
    if (!ctx || this.noiseBuffer) return;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let hold = 0;
    for (let i = 0; i < bufferSize; i++) {
      if (i % 3 === 0) hold = Math.random() * 2 - 1;
      data[i] = hold;
    }
    this.noiseBuffer = buffer;
  }

  resolveModeName(modeOrFloor) {
    if (this.tracksByMode[modeOrFloor]) {
      return modeOrFloor;
    }
    if (modeOrFloor === 'boss' || modeOrFloor === true) {
      const fIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 2;
      if (fIdx >= 14) return 'boss5';
      if (fIdx >= 11) return 'boss4';
      if (fIdx >= 8) return 'boss3';
      if (fIdx >= 5) return 'boss2';
      return 'boss1';
    }
    return 'cavern';
  }

  setMode(mode) {
    const nextMode = this.resolveModeName(mode);
    const modeChanged = this.currentMode !== nextMode;
    this.currentMode = nextMode;
    if (modeChanged) {
      this.stepIndex = 0;
      this.isSpinOverdrive = false;
    }
    if (
      this.hasStartedAfterDifficulty &&
      userSettings.musicEnabled &&
      !this.isPausedForModal &&
      !this.isPausedForLevelIntro
    ) {
      if (!this.isPlaying) {
        this.play();
      } else if (modeChanged) {
        this.restartLoopTimer();
      }
    }
  }

  startAfterDifficultySelect(isBossFloor = false) {
    this.hasStartedAfterDifficulty = true;
    this.currentMode = this.resolveModeName(isBossFloor);
    this.isPausedForModal = false;
    this.isPausedForLevelIntro = false;
    if (userSettings.musicEnabled) {
      this.play();
    }
  }

  pauseForLevelIntro(targetBgmMode) {
    if (targetBgmMode !== undefined) {
      this.currentMode = this.resolveModeName(targetBgmMode);
    }
    this.stepIndex = 0;
    this.isSpinOverdrive = false;
    this.isPausedForLevelIntro = true;
    this.stop();
  }

  resumeAfterLevelIntro() {
    this.isPausedForLevelIntro = false;
    this.hasStartedAfterDifficulty = true;
    if (userSettings.musicEnabled && !this.isPausedForModal) {
      this.play();
    }
  }

  play() {
    if (
      !this.hasStartedAfterDifficulty ||
      !userSettings.musicEnabled ||
      this.isPausedForModal ||
      this.isPausedForLevelIntro
    ) {
      return;
    }
    this.sfx.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.restartLoopTimer();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  pauseForSettings() {
    this.isPausedForModal = true;
    this.stop();
  }

  resumeFromSettings() {
    this.isPausedForModal = false;
    if (this.hasStartedAfterDifficulty && userSettings.musicEnabled && !this.isPausedForLevelIntro) {
      this.play();
    }
  }

  restartLoopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    const activeTrack = this.getActiveTrack();
    const bpm = this.getEffectiveBpm(activeTrack);
    const stepMs = Math.round((60 / bpm / 4) * 1000);
    this.timerId = setInterval(() => this.tickStep(), stepMs);
  }

  tickStep() {
    if (
      !this.isPlaying ||
      this.isPausedForModal ||
      this.isPausedForLevelIntro ||
      !userSettings.musicEnabled
    ) {
      return;
    }

    // Dynamic Roulette Spin Overdrive check (132 BPM -> 156 BPM while silver ball is spinning)
    if (this.currentMode === 'roulette' && typeof rouletteSim !== 'undefined') {
      const spinningNow = !!rouletteSim.isSpinning;
      if (spinningNow !== this.isSpinOverdrive) {
        this.isSpinOverdrive = spinningNow;
        this.restartLoopTimer();
      }
    } else if (this.isSpinOverdrive) {
      this.isSpinOverdrive = false;
    }

    const ctx = this.ctx;
    if (!ctx) return;

    const track = this.getActiveTrack();
    const bpm = this.getEffectiveBpm(track);
    const stepDur = 60 / bpm / 4;
    const now = ctx.currentTime;
    const trackLen = (track.bass && track.bass.length) ? track.bass.length : 64;
    const idx = this.stepIndex % trackLen;
    const isBoss = this.isBossMode();

    const pitchShift = (this.currentMode === 'roulette' && this.isSpinOverdrive) ? 2 : 0;
    const cutoffBoost = (this.currentMode === 'roulette' && this.isSpinOverdrive) ? 650 : 0;
    const effectiveCutoff = (track.cutoff || 2400) + cutoffBoost;

    // 1. Triangle Sub-Bass Channel
    const bassNote = track.bass[idx];
    if (bassNote) {
      const bFreq = this.midiToFreq(bassNote + pitchShift);
      this.playChipTone(
        bFreq,
        'triangle',
        now,
        stepDur * 0.92,
        track.bassGain || 0.08,
        false,
        effectiveCutoff
      );
      if (this.currentMode === 'boss2' || this.currentMode === 'boss3' || (this.currentMode === 'roulette' && this.isSpinOverdrive)) {
        this.playChipTone(
          bFreq,
          'sawtooth',
          now,
          stepDur * 0.75,
          this.currentMode === 'boss3' ? 0.032 : 0.022,
          false,
          1100
        );
      }
    }

    // 2. Lead Channel (with detuned dual-oscillator unison on Boss tracks for rich synth presence)
    const leadNote = track.lead[idx];
    if (leadNote) {
      const lFreq = this.midiToFreq(leadNote + pitchShift);
      const lWave = track.leadWave || 'square';
      this.playChipTone(
        lFreq,
        lWave,
        now,
        stepDur * 1.65,
        track.leadGain || 0.045,
        true,
        effectiveCutoff,
        track.vibratoDepth || 1.008
      );
      if (isBoss && track.detuneCents) {
        const detuneRatio = Math.pow(2, track.detuneCents / 1200);
        this.playChipTone(
          lFreq * detuneRatio,
          'square',
          now,
          stepDur * 1.45,
          (track.leadGain || 0.045) * 0.48,
          false,
          effectiveCutoff * 0.9
        );
      }
    }

    // 3. Arpeggio Channel
    const arpNote = track.arp[idx];
    if (arpNote) {
      this.playChipTone(
        this.midiToFreq(arpNote + pitchShift),
        track.arpWave || (isBoss ? 'sawtooth' : 'square'),
        now,
        stepDur * 0.65,
        track.arpGain || 0.022,
        false,
        effectiveCutoff
      );
    }

    // 4. Harmonic Counter-Stab / Shop Organ Channel
    if (track.stab && track.stab[idx]) {
      const stabWave = this.currentMode === 'bazaar' ? 'triangle' : 'sawtooth';
      const stabGain = this.currentMode === 'bazaar'
        ? 0.028
        : (this.currentMode === 'boss3' ? 0.034 : 0.026);
      this.playChipTone(
        this.midiToFreq(track.stab[idx] + pitchShift),
        stabWave,
        now,
        stepDur * (this.currentMode === 'bazaar' ? 1.35 : 0.85),
        stabGain,
        this.currentMode !== 'bazaar',
        effectiveCutoff,
        1.012
      );
    }

    // 5. 8-Bit Percussion Channel
    const drum = track.drums[idx];
    if (drum) {
      this.playChipDrum(drum, now);
    }

    this.stepIndex = (this.stepIndex + 1) % trackLen;
  }

  playChipTone(freq, type, startTime, duration, peakGain, vibrato = false, cutoffHz = 2400, vibratoDepth = 1.008) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    if (vibrato) {
      osc.frequency.setValueAtTime(freq * vibratoDepth, startTime + duration * 0.45);
      osc.frequency.setValueAtTime(freq / vibratoDepth, startTime + duration * 0.72);
      osc.frequency.setValueAtTime(freq, startTime + duration * 0.9);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  playChipDrum(kind, startTime) {
    const ctx = this.ctx;
    const isFinalBoss = this.currentMode === 'boss3';
    const isMidBoss = this.currentMode === 'boss2';
    if (kind === 'K') {
      const osc = ctx.createOscillator();
      const kickVol = isFinalBoss ? 0.14 : (isMidBoss ? 0.125 : 0.11);
      const gain = this.createGainSafe(ctx, kickVol, startTime, 0.085);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isFinalBoss ? 165 : (isMidBoss ? 150 : 135), startTime);
      osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.078);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.09);
    } else if (kind === 'S' || kind === 'H' || kind === 'O') {
      this.ensureNoiseBuffer();
      if (!this.noiseBuffer) return;
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = kind === 'S' ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(kind === 'S' ? (isFinalBoss ? 1650 : 1400) : 5200, startTime);

      const dur = kind === 'S' ? (isFinalBoss ? 0.11 : 0.095) : (kind === 'O' ? 0.14 : 0.032);
      const vol = kind === 'S' ? (isFinalBoss ? 0.07 : (isMidBoss ? 0.062 : 0.055)) : (kind === 'O' ? 0.038 : 0.024);
      const gain = this.createGainSafe(ctx, vol, startTime, dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(startTime);
      noise.stop(startTime + dur);
    }
  }

  createGainSafe(ctx, vol, startTime, dur) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    return gain;
  }
}

const bgm = new SubterraneanChiptuneEngine(sfx);

// Automatically sync BGM mode with Bazaar, Boss Chest & Roulette Modals
(function bindModalBgmTransitions() {
  function syncBgmWithModals() {
    const rouletteModal = document.getElementById('roulette-modal');
    const bazaarModal = document.getElementById('bazaar-modal');
    const bossChestModal = document.getElementById('boss-chest-modal');
    const floorIntroOverlay = document.getElementById('floor-intro-overlay');

    const isRouletteOpen = rouletteModal && !rouletteModal.classList.contains('hidden');
    const isBazaarOpen = bazaarModal && !bazaarModal.classList.contains('hidden');
    const isBossChestOpen = bossChestModal && !bossChestModal.classList.contains('hidden');
    const isFloorIntroOpen = floorIntroOverlay && !floorIntroOverlay.classList.contains('hidden');

    if (isRouletteOpen) {
      bgm.isPausedForLevelIntro = false;
      bgm.setMode('roulette');
    } else if (isBazaarOpen || isBossChestOpen) {
      bgm.isPausedForLevelIntro = false;
      bgm.setMode('bazaar');
    } else if (
      !isFloorIntroOpen &&
      !bgm.isPausedForLevelIntro &&
      (bgm.currentMode === 'bazaar' || bgm.currentMode === 'roulette')
    ) {
      const fIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 0;
      const isBoss = typeof isBossFloorIndex === 'function' ? isBossFloorIndex(fIdx) : ((fIdx + 1) % 3 === 0);
      if (isBoss) {
        bgm.setMode(fIdx >= 14 ? 'boss5' : (fIdx >= 11 ? 'boss4' : (fIdx >= 8 ? 'boss3' : (fIdx >= 5 ? 'boss2' : 'boss1'))));
      } else {
        bgm.setMode('cavern');
      }
    }
  }

  function setupListeners() {
    ['bazaar-modal', 'roulette-modal', 'boss-chest-modal'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        new MutationObserver(syncBgmWithModals).observe(el, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
  } else {
    setupListeners();
  }
})();
