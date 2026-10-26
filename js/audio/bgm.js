// ============================================================================
// RETRO 8-BIT CHIPTUNE SOUNDTRACK ENGINE (CAVERN & BOSS SUITES) (js/audio/bgm.js)
// ============================================================================

// ============================================================================
// 1B. RETRO 8-BIT CHIPTUNE SOUNDTRACK ENGINE (CAVERN & EXTENDED 128-STEP BOSS LOOPS)
// ============================================================================
class SubterraneanChiptuneEngine {
    constructor(sfxInstance) {
        this.sfx = sfxInstance;
        this.isPlaying = false;
        this.isPausedForModal = false;
        this.hasStartedAfterDifficulty = false;
        this.currentMode = 'cavern'; // 'cavern' | 'boss1' | 'boss2' | 'boss3'
        this.stepIndex = 0;
        this.timerId = null;
        this.noiseBuffer = null;

        // 64-step (4-bar) Subterranean Exploration Loop (D Dorian / Natural Minor, 112 BPM)
        this.cavernTrack = {
            bpm: 112,
            cutoff: 2100,
            bassGain: 0.075,
            leadGain: 0.038,
            arpGain: 0.022,
            arpWave: 'square',
            vibratoDepth: 1.008,
            bass: [
                // Section A (Steps 0..31)
                38, null, 38, 50,  38, null, 45, null,
                41, null, 41, 53,  43, null, 45, 48,
                38, null, 38, 50,  38, null, 45, null,
                36, null, 36, 48,  33, null, 36, 37,
                // Section B (Steps 32..63 — Bioluminescent Canopy Lift)
                46, null, 46, 58,  45, null, 52, null,
                41, null, 41, 53,  40, null, 45, 49,
                38, null, 38, 50,  43, null, 43, 55,
                36, null, 40, 43,  33, 37,   40, 37
            ],
            lead: [
                // Section A
                62, null, 65, null, 69, null, 67, 65,
                64, null, 60, null, 62, null, null, null,
                62, null, 65, 67,   69, null, 72, null,
                71, 69,   67, null, 69, null, null, null,
                // Section B
                74, null, 70, null, 69, null, 67, 64,
                65, null, 69, null, 67, 64,   61, null,
                62, 65,   69, null, 71, 67,   62, null,
                64, 67,   72, 71,   69, null, 61, null
            ],
            arp: [
                // Section A
                74, 69, 65, 69,  74, 69, 65, 69,
                72, 69, 65, 69,  72, 67, 64, 67,
                74, 69, 65, 69,  77, 74, 69, 74,
                76, 72, 67, 72,  73, 69, 64, 69,
                // Section B
                74, 70, 65, 70,  76, 69, 64, 69,
                77, 72, 69, 72,  73, 69, 64, 69,
                74, 69, 65, 69,  79, 74, 71, 74,
                76, 72, 67, 72,  73, 69, 64, 61
            ],
            drums: [
                'K', 'H', null, 'H',  'S', 'H', null, 'K',
                'K', 'H', 'K',  'H',  'S', 'H', 'H',  'H',
                'K', 'H', null, 'H',  'S', 'H', null, 'K',
                'K', 'H', 'K',  'H',  'S', 'H', 'S',  'H',
                'K', 'H', null, 'K',  'S', 'H', null, 'K',
                'K', 'H', 'K',  'H',  'S', 'H', 'H',  'S',
                'K', 'H', null, 'H',  'S', 'H', 'K',  'H',
                'K', 'S', 'K',  'H',  'S', 'S', 'K',  'S'
            ]
        };

        // BOSS 1 (Floor 3 — Act I Warden): Extended 128-Step (8-Bar) Suite (D Phrygian Dominant, 148 BPM)
        this.boss1Track = {
            bpm: 148,
            cutoff: 2850,
            bassGain: 0.085,
            leadGain: 0.048,
            arpGain: 0.023,
            arpWave: 'sawtooth',
            vibratoDepth: 1.008,
            bass: [
                38, 38, 50, 38,  39, 39, 51, 39,
                38, 38, 50, 38,  37, 37, 49, 37,
                38, 38, 50, 38,  41, 41, 53, 41,
                39, 39, 38, 38,  37, 37, 33, 37,
                43, 43, 55, 43,  41, 41, 53, 41,
                39, 39, 51, 39,  38, 38, 50, 38,
                40, 40, 52, 40,  41, 41, 53, 41,
                45, 45, 57, 45,  49, 45, 37, 33,
                38, null, null, 38,  50, null, 39, null,
                38, null, null, 38,  49, null, 37, null,
                43, null, null, 43,  55, null, 41, null,
                39, null, 38, null,  37, 37, 45, 37,
                38, 50, 38, 50,  46, 58, 46, 58,
                43, 55, 43, 55,  45, 57, 45, 57,
                39, 51, 38, 50,  37, 49, 36, 48,
                35, 47, 34, 46,  33, 45, 37, 49
            ],
            lead: [
                74, null, 74, 75,  74, 70, 69, 70,
                69, null, 65, null, 62, null, 69, null,
                74, null, 77, 75,  74, 70, 69, 67,
                70, 69,   67, 63,  62, null, 74, null,
                79, null, 77, 75,  74, null, 77, null,
                75, null, 74, 70,  69, null, 74, null,
                76, 74,   73, 74,  77, 75,   74, 70,
                69, null, 73, 76,  81, null, 79, 75,
                74, null, null, 69,  70, null, null, 66,
                67, null, null, 62,  61, null, 69, null,
                79, null, null, 74,  75, null, null, 70,
                69, 70,   69, 66,    69, null, null, null,
                86, 82, 81, 79,  77, 75, 74, 70,
                79, 77, 75, 74,  73, 69, 73, 76,
                77, 75, 74, 70,  75, 74, 70, 67,
                69, 73, 76, 79,  81, null, 73, null
            ],
            arp: [
                62, 69, 74, 75,  62, 69, 74, 75,
                62, 68, 74, 76,  61, 69, 73, 76,
                62, 69, 74, 77,  65, 72, 77, 80,
                63, 70, 75, 79,  61, 67, 73, 76,
                67, 70, 74, 79,  65, 69, 74, 77,
                63, 67, 70, 75,  62, 66, 69, 74,
                64, 67, 70, 76,  65, 69, 74, 77,
                69, 73, 76, 81,  67, 73, 76, 79,
                62, 66, 69, 74,  63, 67, 70, 75,
                62, 66, 69, 74,  61, 64, 67, 73,
                67, 70, 74, 79,  65, 69, 72, 77,
                63, 67, 70, 75,  61, 67, 69, 73,
                62, 69, 74, 81,  70, 74, 77, 82,
                67, 70, 74, 79,  69, 73, 76, 81,
                63, 67, 70, 75,  61, 64, 69, 73,
                62, 68, 71, 74,  61, 67, 73, 81
            ],
            stab: [
                null, null, null, null,  63, null, null, null,
                null, null, null, null,  61, null, null, null,
                null, null, null, null,  65, null, null, null,
                63, null, 62, null,      61, null, 57, null,
                67, null, null, 67,      65, null, null, 65,
                63, null, null, 63,      62, null, null, 62,
                64, null, 64, null,      65, null, 65, null,
                69, null, 67, null,      65, 64,   61, null,
                62, null, null, 62,      66, null, 63, null,
                62, null, null, 62,      61, null, 57, null,
                67, null, null, 67,      65, null, 62, null,
                63, null, 62, null,      61, null, 69, null,
                62, null, 66, null,      70, null, 67, null,
                67, null, 70, null,      69, null, 73, null,
                63, null, 62, null,      61, null, 60, null,
                59, null, 58, null,      57, 61,   64, 69
            ],
            drums: [
                'K', 'H', 'K', 'H',  'S', 'H', 'K', 'H',
                'K', 'K', 'H', 'K',  'S', 'H', 'S', 'H',
                'K', 'H', 'K', 'H',  'S', 'H', 'K', 'H',
                'K', 'S', 'K', 'S',  'S', 'S', 'K', 'S',
                'K', 'H', 'K', 'K',  'S', 'H', 'K', 'S',
                'K', 'H', 'K', 'H',  'S', 'K', 'S', 'H',
                'K', 'K', 'H', 'K',  'S', 'H', 'K', 'H',
                'K', 'S', 'K', 'S',  'K', 'S', 'S', 'S',
                'K', 'H', null, 'K', 'H', 'H', 'S', 'H',
                'K', 'H', null, 'K', 'S', 'H', 'K', 'S',
                'K', 'H', null, 'K', 'H', 'H', 'S', 'H',
                'K', 'S', 'K',  'H', 'S', 'S', 'K', 'S',
                'K', 'K', 'H', 'K',  'S', 'H', 'K', 'S',
                'K', 'K', 'H', 'K',  'S', 'K', 'S', 'H',
                'K', 'S', 'K', 'H',  'K', 'S', 'K', 'H',
                'S', 'S', 'K', 'S',  'K', 'S', 'S', 'S'
            ]
        };

        // BOSS 2 (Floor 6 — Act II Abyssal Overlord): Extended 128-Step (8-Bar) Suite (D Hungarian Minor, 164 BPM)
        this.boss2Track = {
            bpm: 164,
            cutoff: 3250,
            bassGain: 0.092,
            leadGain: 0.052,
            arpGain: 0.025,
            arpWave: 'sawtooth',
            vibratoDepth: 1.012,
            bass: [
                38, 50, 38, 50,  44, 56, 44, 56,
                46, 58, 45, 57,  37, 49, 38, 50,
                38, 50, 38, 50,  41, 53, 44, 56,
                46, 45, 44, 41,  39, 38, 37, 33,
                46, 46, 58, 46,  44, 44, 56, 44,
                45, 45, 57, 45,  38, 38, 50, 38,
                43, 43, 55, 43,  44, 44, 56, 44,
                45, 57, 46, 58,  49, 45, 37, 33,
                38, null, 50, 38, null, 50, 44, 56,
                46, null, 58, 45, null, 57, 37, 49,
                41, null, 53, 44, null, 56, 45, 57,
                38, 41,   44, 45, 46,   44, 37, 33,
                38, 41, 44, 47,  50, 47, 44, 41,
                46, 45, 41, 38,  45, 44, 41, 37,
                38, 44, 50, 56,  58, 57, 56, 53,
                50, 49, 46, 45,  44, 41, 37, 33
            ],
            lead: [
                74, 77, 80, null,  81, 80, 77, 74,
                73, null, 70, 69,  68, 69, 74, null,
                74, 77, 80, 82,    85, 86, 85, 82,
                81, 80, 77, 76,    74, null, 86, null,
                82, null, 81, 80,  77, null, 80, 81,
                73, null, 74, 76,  77, null, 74, null,
                79, 80,   82, 80,  77, 80,   81, 85,
                86, null, 85, 82,  81, null, 73, null,
                74, null, 80, 74,  null, 81, 77, null,
                82, null, 81, 80,  null, 77, 73, null,
                77, null, 80, 81,  null, 85, 86, null,
                88, 86,   85, 82,  81,   80, 77, 73,
                86, 85, 82, 81,  80, 77, 80, 82,
                85, 86, 89, 86,  85, 81, 80, 77,
                74, 77, 80, 81,  82, 85, 86, 89,
                92, 89, 86, 85,  81, 80, 77, 73
            ],
            arp: [
                62, 65, 68, 74,  68, 74, 77, 80,
                62, 68, 71, 77,  61, 67, 70, 73,
                62, 65, 68, 74,  65, 68, 74, 80,
                67, 70, 73, 79,  69, 73, 76, 81,
                70, 74, 77, 82,  68, 71, 74, 80,
                69, 73, 76, 81,  62, 65, 69, 74,
                67, 70, 74, 79,  68, 71, 74, 80,
                69, 73, 76, 81,  73, 76, 79, 85,
                62, 68, 74, 80,  62, 69, 74, 81,
                70, 74, 77, 82,  69, 73, 76, 81,
                65, 68, 74, 77,  68, 71, 74, 80,
                69, 73, 76, 81,  67, 73, 76, 85,
                62, 65, 68, 71,  74, 77, 80, 83,
                86, 83, 80, 77,  74, 71, 68, 65,
                62, 68, 74, 80,  82, 80, 77, 74,
                69, 73, 76, 81,  85, 81, 76, 73
            ],
            stab: [
                57, null, null, 62,  62, null, null, 68,
                67, null, 65, null,  57, null, 62, null,
                57, null, null, 62,  65, null, 68, null,
                70, null, 68, null,  69, 67,   65, 61,
                70, null, 69, null,  68, null, 65, null,
                69, null, 67, null,  65, null, 62, null,
                67, null, 68, null,  70, null, 68, null,
                69, null, 70, null,  73, 69,   67, 61,
                62, null, null, 68,  null, null, 69, 68,
                70, null, null, 69,  null, null, 67, 61,
                65, null, null, 68,  null, null, 69, 73,
                74, 70,   68, 69,    70,   68,   67, 61,
                62, 65, 68, null,    68, 71, 74, null,
                70, 69, 65, null,    69, 68, 65, null,
                62, 68, 74, null,    70, 69, 68, 65,
                69, 67, 65, 64,      61, 64, 67, 73
            ],
            drums: [
                'K', 'K', 'H', 'K',  'S', 'H', 'K', 'S',
                'K', 'H', 'K', 'K',  'S', 'K', 'S', 'H',
                'K', 'K', 'H', 'K',  'S', 'H', 'K', 'S',
                'K', 'S', 'K', 'S',  'K', 'S', 'S', 'S',
                'K', 'H', 'S', 'H',  'K', 'K', 'S', 'H',
                'K', 'H', 'S', 'K',  'K', 'S', 'H', 'S',
                'K', 'H', 'S', 'H',  'K', 'K', 'S', 'H',
                'K', 'S', 'K', 'S',  'S', 'K', 'S', 'S',
                'K', 'H', 'H', 'K',  'H', 'H', 'S', 'K',
                'K', 'H', 'H', 'K',  'H', 'H', 'S', 'S',
                'K', 'H', 'H', 'K',  'H', 'H', 'S', 'K',
                'S', 'K', 'S', 'K',  'S', 'S', 'K', 'S',
                'K', 'K', 'S', 'K',  'K', 'H', 'S', 'K',
                'K', 'K', 'S', 'K',  'S', 'K', 'S', 'S',
                'K', 'K', 'H', 'S',  'K', 'K', 'H', 'S',
                'K', 'S', 'K', 'S',  'K', 'S', 'S', 'S'
            ]
        };

        // BOSS 3 (Floor 9 — Final Subterranean Cataclysm): Extended 128-Step (8-Bar) Suite (D Locrian / Diminished, 180 BPM)
        this.boss3Track = {
            bpm: 180,
            cutoff: 3900,
            bassGain: 0.098,
            leadGain: 0.056,
            arpGain: 0.027,
            arpWave: 'sawtooth',
            vibratoDepth: 1.016,
            bass: [
                26, 38, 50, 38,  39, 51, 44, 56,
                26, 38, 50, 38,  43, 55, 37, 49,
                26, 38, 50, 38,  41, 53, 44, 56,
                46, 44, 43, 39,  38, 37, 33, 26,
                29, 41, 53, 41,  32, 44, 56, 44,
                35, 47, 59, 47,  38, 50, 62, 50,
                39, 51, 38, 50,  37, 49, 36, 48,
                35, 47, 34, 46,  33, 45, 31, 26,
                26, null, 26, null,  44, 43, 39, null,
                26, null, 26, 38,    44, null, 37, null,
                29, null, 29, null,  47, 44, 41, null,
                26, 38,   27, 39,    28, 40, 33, 26,
                38, 50, 46, 58,  44, 56, 45, 57,
                38, 50, 43, 55,  39, 51, 37, 49,
                26, 38, 41, 44,  47, 50, 53, 56,
                59, 56, 53, 50,  45, 37, 33, 26
            ],
            lead: [
                86, 85, 82, 80,  81, 77, 74, 75,
                74, 73, 74, 80,  81, null, 86, 87,
                86, 89, 88, 86,  85, 82, 80, 77,
                80, 79, 77, 75,  74, 81, 86, null,
                77, 80, 83, 86,  80, 83, 86, 89,
                83, 86, 89, 92,  86, 89, 92, 95,
                93, 92, 89, 88,  86, 85, 82, 81,
                80, 79, 77, 76,  73, null, 85, null,
                86, null, 74, null,  80, 79, 75, null,
                86, null, 74, 85,    80, null, 73, null,
                89, null, 77, null,  83, 80, 77, null,
                74, 75,   77, 80,    81, 85, 88, 91,
                93, 89, 86, 81,  92, 88, 84, 80,
                91, 86, 82, 79,  89, 85, 81, 76,
                74, 77, 81, 86,  75, 79, 82, 87,
                88, 89, 92, 93,  98, null, 86, null
            ],
            arp: [
                62, 68, 74, 80,  86, 80, 74, 68,
                63, 69, 75, 81,  87, 81, 75, 69,
                62, 68, 74, 80,  89, 86, 80, 74,
                67, 73, 79, 85,  88, 85, 79, 73,
                65, 68, 71, 74,  68, 71, 74, 77,
                71, 74, 77, 80,  74, 77, 80, 83,
                86, 83, 80, 77,  85, 82, 79, 76,
                83, 80, 77, 74,  73, 76, 81, 85,
                62, 74, 68, 80,  63, 75, 68, 80,
                62, 74, 68, 80,  61, 73, 67, 79,
                65, 77, 71, 83,  68, 80, 74, 86,
                62, 65, 68, 71,  73, 76, 79, 85,
                74, 81, 86, 93,  72, 80, 84, 92,
                70, 79, 82, 91,  69, 76, 81, 88,
                62, 69, 74, 81,  63, 70, 75, 82,
                68, 74, 80, 86,  89, 92, 95, 98
            ],
            stab: [
                62, 62, null, 68,  63, 63, null, 68,
                62, 62, null, 67,  61, null, 69, null,
                62, 62, null, 68,  65, 65, null, 68,
                70, 68, 67,   63,  62, 61,   57, 62,
                65, null, 65, 68,  68, null, 68, 71,
                71, null, 71, 74,  74, null, 74, 77,
                75, null, 74, null, 73, null, 72, null,
                71, null, 70, null, 69, 67,   64, 61,
                62, null, 62, null, 68, 67,   63, null,
                62, null, 62, 68,   68, null, 61, null,
                65, null, 65, null, 71, 68,   65, null,
                62, 63,   64, 65,   66, 67,   69, 73,
                74, null, 70, null, 68, null, 69, null,
                74, null, 67, null, 63, null, 61, null,
                62, 65,   68, 71,   74, 77,   80, 83,
                86, 83,   80, 77,   73, 69,   64, 62
            ],
            drums: [
                'K', 'K', 'S', 'K',  'K', 'S', 'K', 'K',
                'S', 'K', 'K', 'S',  'K', 'S', 'S', 'S',
                'K', 'K', 'S', 'K',  'K', 'S', 'K', 'K',
                'S', 'S', 'K', 'S',  'K', 'S', 'S', 'S',
                'K', 'H', 'S', 'K',  'K', 'H', 'S', 'K',
                'K', 'H', 'S', 'K',  'S', 'K', 'S', 'S',
                'K', 'K', 'S', 'H',  'K', 'K', 'S', 'H',
                'K', 'S', 'K', 'S',  'S', 'S', 'K', 'S',
                'K', 'K', null, 'K', 'S', 'H', 'K', 'S',
                'K', 'K', null, 'K', 'S', 'K', 'S', 'H',
                'K', 'K', null, 'K', 'S', 'H', 'K', 'S',
                'K', 'S', 'K',  'S', 'K', 'S', 'S', 'S',
                'K', 'K', 'S', 'K',  'K', 'K', 'S', 'K',
                'K', 'K', 'S', 'K',  'S', 'K', 'S', 'S',
                'K', 'S', 'K', 'S',  'K', 'S', 'K', 'S',
                'S', 'S', 'S', 'K',  'S', 'S', 'K', 'S'
            ]
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
        return this.currentMode === 'boss1' || this.currentMode === 'boss2' || this.currentMode === 'boss3';
    }

    getActiveTrack() {
        if (this.currentMode === 'boss3') return this.boss3Track;
        if (this.currentMode === 'boss2') return this.boss2Track;
        if (this.currentMode === 'boss1') return this.boss1Track;
        return this.cavernTrack;
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
        if (modeOrFloor === 'boss1' || modeOrFloor === 'boss2' || modeOrFloor === 'boss3' || modeOrFloor === 'cavern') {
            return modeOrFloor;
        }
        if (modeOrFloor === 'boss' || modeOrFloor === true) {
            const fIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 2;
            if (fIdx >= 8) return 'boss3';
            if (fIdx >= 5) return 'boss2';
            return 'boss1';
        }
        return 'cavern';
    }

    setMode(mode) {
        const nextMode = this.resolveModeName(mode);
        if (this.currentMode !== nextMode) {
            this.currentMode = nextMode;
            this.stepIndex = 0;
            if (this.isPlaying && !this.isPausedForModal) {
                this.restartLoopTimer();
            }
        }
    }

    startAfterDifficultySelect(isBossFloor = false) {
        this.hasStartedAfterDifficulty = true;
        this.currentMode = this.resolveModeName(isBossFloor);
        this.isPausedForModal = false;
        if (userSettings.musicEnabled) {
            this.play();
        }
    }

    play() {
        if (!this.hasStartedAfterDifficulty || !userSettings.musicEnabled || this.isPausedForModal || this.isPausedForIntro) {
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
        if (this.hasStartedAfterDifficulty && userSettings.musicEnabled && !this.isPausedForIntro) {
            this.play();
        }
    }

    pauseForLevelIntro(nextMode) {
        this.isPausedForIntro = true;
        if (nextMode) {
            this.currentMode = this.resolveModeName(nextMode);
            this.stepIndex = 0;
        }
        this.stop();
    }

    resumeAfterLevelIntro() {
        this.isPausedForIntro = false;
        if (this.hasStartedAfterDifficulty && userSettings.musicEnabled && !this.isPausedForModal) {
            this.play();
        }
    }

    restartLoopTimer() {
        if (this.timerId) clearInterval(this.timerId);
        const activeTrack = this.getActiveTrack();
        const stepMs = Math.round((60 / activeTrack.bpm / 4) * 1000);
        this.timerId = setInterval(() => this.tickStep(), stepMs);
    }

    tickStep() {
        if (!this.isPlaying || this.isPausedForModal || !userSettings.musicEnabled) {
            return;
        }
        const ctx = this.ctx;
        if (!ctx) return;

        const track = this.getActiveTrack();
        const trackLen = track.bass.length;
        const stepDur = 60 / track.bpm / 4;
        const now = ctx.currentTime;
        const idx = this.stepIndex % trackLen;
        const isBoss = this.isBossMode();

        const sectionIdx = Math.floor(idx / 32);
        const baseCutoff = track.cutoff || 2800;
        const sectionCutoffMod = isBoss
            ? [1.0, 1.14, 0.86, 1.22][sectionIdx % 4]
            : 1.0;
        const effectiveCutoff = Math.min(5200, Math.round(baseCutoff * sectionCutoffMod));

        const bassNote = track.bass[idx];
        if (bassNote) {
            this.playChipTone(
                this.midiToFreq(bassNote),
                'triangle',
                now,
                stepDur * 0.92,
                track.bassGain || 0.08,
                false,
                effectiveCutoff
            );
            if (this.currentMode === 'boss2' || this.currentMode === 'boss3') {
                this.playChipTone(
                    this.midiToFreq(bassNote),
                    'sawtooth',
                    now,
                    stepDur * 0.75,
                    this.currentMode === 'boss3' ? 0.032 : 0.022,
                    false,
                    1100
                );
            }
        }

        const leadNote = track.lead[idx];
        if (leadNote) {
            this.playChipTone(
                this.midiToFreq(leadNote),
                'square',
                now,
                stepDur * 1.65,
                track.leadGain || 0.045,
                true,
                effectiveCutoff,
                track.vibratoDepth || 1.008
            );
        }

        const arpNote = track.arp[idx];
        if (arpNote) {
            this.playChipTone(
                this.midiToFreq(arpNote),
                track.arpWave || (isBoss ? 'sawtooth' : 'square'),
                now,
                stepDur * 0.65,
                track.arpGain || 0.022,
                false,
                effectiveCutoff
            );
        }

        if (track.stab && track.stab[idx]) {
            this.playChipTone(
                this.midiToFreq(track.stab[idx]),
                'sawtooth',
                now,
                stepDur * 0.85,
                this.currentMode === 'boss3' ? 0.034 : (this.currentMode === 'boss2' ? 0.026 : 0.021),
                true,
                effectiveCutoff,
                1.012
            );
        }

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
        } else if (kind === 'S' || kind === 'H') {
            this.ensureNoiseBuffer();
            if (!this.noiseBuffer) return;
            const noise = ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = kind === 'S' ? 'bandpass' : 'highpass';
            filter.frequency.setValueAtTime(kind === 'S' ? (isFinalBoss ? 1650 : 1400) : 5200, startTime);

            const dur = kind === 'S' ? (isFinalBoss ? 0.11 : 0.095) : 0.032;
            const vol = kind === 'S' ? (isFinalBoss ? 0.07 : (isMidBoss ? 0.062 : 0.055)) : 0.024;
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
