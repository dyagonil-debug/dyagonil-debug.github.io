// ============================================================================
// RETRO 8-BIT CHIPTUNE SFX ENGINE & HAPTICS (js/audio/sfx.js)
// ============================================================================

// ============================================================================
// 1. RETRO 8-BIT CHIPTUNE SFX ENGINE (NES / GAMEBOY SYNTHESIS)
// ============================================================================
class TactileSFX {
    constructor() {
        this.ctx = null;
        this.muted = !userSettings.sfxEnabled;
        this.noiseBuffer = null;
    }
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        if (this.ctx && !this.noiseBuffer) {
            // Generate 8-bit LFSR-style stepped noise buffer for retro percussion & crunches
            const bufLen = Math.floor(this.ctx.sampleRate * 0.25);
            const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            let hold = 0;
            for (let i = 0; i < bufLen; i++) {
                if (i % 4 === 0) hold = Math.random() * 2 - 1;
                data[i] = hold;
            }
            this.noiseBuffer = buf;
        }
    }
    setMuted(muteVal) {
        this.muted = !!muteVal;
        userSettings.sfxEnabled = !this.muted;
        const iconEl = document.getElementById('mute-icon');
        if (iconEl) {
            iconEl.setAttribute('data-lucide', this.muted ? 'volume-x' : 'volume-2');
            lucide.createIcons();
        }
        saveUserSettings();
        return this.muted;
    }
    toggleMute() {
        return this.setMuted(!this.muted);
    }

    // Helper: Play a stepped 8-bit note sequence on a single oscillator (auto-resumes immediately if needed)
    playSteppedSequence(steps, waveType = 'square', peakGain = 0.14, cutoffHz = 3200) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = waveType;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoffHz, now);

        let cursor = now;
        steps.forEach((st, idx) => {
            osc.frequency.setValueAtTime(st.freq, cursor);
            const stepGain = st.gain !== undefined ? st.gain : peakGain;
            gain.gain.setValueAtTime(stepGain, cursor);
            if (idx === steps.length - 1) {
                gain.gain.exponentialRampToValueAtTime(0.001, cursor + st.dur);
            }
            cursor += st.dur;
        });

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(cursor + 0.01);
    }

    // Helper: 8-bit noise burst for impacts, shatters, and hazards
    playNoiseBurst(duration = 0.06, filterFreq = 1800, peakGain = 0.12, filterType = 'bandpass') {
        if (this.muted) return;
        this.init();
        if (!this.noiseBuffer) return;
        const now = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(peakGain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
        src.stop(now + duration + 0.01);
    }

    // 1. 8-Bit Token Drop & Cavern Slot Thud
    playWoodClack(isPlayer = true) {
        if (this.muted) return;
        const steps = isPlayer
            ? [
                { freq: 587.33, dur: 0.024, gain: 0.14 }, // D5
                { freq: 440.00, dur: 0.026, gain: 0.15 }, // A4
                { freq: 293.66, dur: 0.045, gain: 0.18 }  // D4
              ]
            : [
                { freq: 440.00, dur: 0.024, gain: 0.14 }, // A4
                { freq: 329.63, dur: 0.026, gain: 0.15 }, // E4
                { freq: 220.00, dur: 0.045, gain: 0.18 }  // A3
              ];
        this.playSteppedSequence(steps, 'square', 0.16, 2600);
        this.playNoiseBurst(0.045, isPlayer ? 1400 : 1050, 0.10, 'bandpass');
    }

    // 2. Crisp 8-Bit RPG Cursor Blip
    playHoverTick() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1174.66, dur: 0.012, gain: 0.055 }, // D6
            { freq: 1760.00, dur: 0.016, gain: 0.045 }  // A6
        ], 'square', 0.05, 3800);
    }

    // 3. Classic NES Coin Pickup Chime (B5 -> E6)
    playCoinDing() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 987.77,  dur: 0.055, gain: 0.13 }, // B5
            { freq: 1318.51, dur: 0.210, gain: 0.14 }  // E6
        ], 'square', 0.14, 3600);
    }

    // 4. 8-Bit Arcane Spell Fast Arpeggio Trill (D Dorian)
    playCardChime() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.032, gain: 0.11 }, // D5
            { freq: 698.46,  dur: 0.032, gain: 0.12 }, // F5
            { freq: 880.00,  dur: 0.032, gain: 0.12 }, // A5
            { freq: 1046.50, dur: 0.032, gain: 0.13 }, // C6
            { freq: 1174.66, dur: 0.045, gain: 0.14 }, // D6
            { freq: 1396.91, dur: 0.140, gain: 0.12 }  // F6
        ], 'square', 0.13, 3400);
    }

    // 5. 8-Bit Rock Shatter / Explosion Crunch (Anvil, Tremor, Stalactite, Bomb)
    playShatterCrunch() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 196.00, dur: 0.035, gain: 0.18 },
            { freq: 130.81, dur: 0.045, gain: 0.18 },
            { freq: 87.31,  dur: 0.075, gain: 0.16 },
            { freq: 55.00,  dur: 0.090, gain: 0.14 }
        ], 'triangle', 0.18, 1800);
        this.playNoiseBurst(0.18, 950, 0.18, 'lowpass');
    }

    // 6. 8-Bit Boss Ability Klaxon Warning
    playBossAlarm() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 293.66, dur: 0.055, gain: 0.15 }, // D4
            { freq: 207.65, dur: 0.055, gain: 0.15 }, // G#3 (Tritone)
            { freq: 293.66, dur: 0.055, gain: 0.15 }, // D4
            { freq: 207.65, dur: 0.110, gain: 0.16 }  // G#3
        ], 'sawtooth', 0.15, 2200);
    }

    // 7. 8-Bit Stage Clear Fanfare / Retro Defeat Wah-Wah
    playResultChime(isWin) {
        if (this.muted) return;
        if (isWin) {
            this.playSteppedSequence([
                { freq: 587.33,  dur: 0.075, gain: 0.13 }, // D5
                { freq: 698.46,  dur: 0.075, gain: 0.13 }, // F5
                { freq: 880.00,  dur: 0.075, gain: 0.14 }, // A5
                { freq: 1174.66, dur: 0.140, gain: 0.15 }, // D6
                { freq: 1046.50, dur: 0.080, gain: 0.13 }, // C6
                { freq: 1174.66, dur: 0.340, gain: 0.16 }  // D6
            ], 'square', 0.15, 3400);
            this.playSteppedSequence([
                { freq: 146.83, dur: 0.225, gain: 0.16 }, // D3
                { freq: 220.00, dur: 0.220, gain: 0.16 }, // A3
                { freq: 293.66, dur: 0.340, gain: 0.18 }  // D4
            ], 'triangle', 0.17, 1800);
        } else {
            this.playSteppedSequence([
                { freq: 311.13, dur: 0.11, gain: 0.14 }, // D#4
                { freq: 293.66, dur: 0.11, gain: 0.14 }, // D4
                { freq: 277.18, dur: 0.11, gain: 0.14 }, // C#4
                { freq: 261.63, dur: 0.14, gain: 0.15 }, // C4
                { freq: 196.00, dur: 0.32, gain: 0.16 }  // G3
            ], 'square', 0.15, 2000);
        }
    }

    // 8. 8-Bit Roulette Pocket Click
    playRouletteTick(intensity = 0.5) {
        if (this.muted) return;
        const boost = Math.min(1, intensity);
        const f1 = 784 + boost * 396;
        this.playSteppedSequence([
            { freq: f1,        dur: 0.010, gain: 0.06 + boost * 0.09 },
            { freq: f1 * 0.65, dur: 0.012, gain: 0.04 + boost * 0.06 }
        ], 'square', 0.12, 3200);
    }

    // 9. 8-Bit Brass Deflector Ping
    playFretPing() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1760.00, dur: 0.018, gain: 0.12 }, // A6
            { freq: 2349.32, dur: 0.048, gain: 0.11 }  // D7
        ], 'square', 0.12, 4200);
    }

    // 10. 8-Bit Cursed Hazard Buzzer
    playCurseBuzzer() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 185.00, dur: 0.075, gain: 0.15 }, // F#3
            { freq: 130.81, dur: 0.075, gain: 0.15 }, // C3 (Tritone)
            { freq: 164.81, dur: 0.075, gain: 0.15 }, // E3
            { freq: 110.00, dur: 0.220, gain: 0.16 }  // A2
        ], 'sawtooth', 0.15, 1900);
        this.playNoiseBurst(0.14, 700, 0.10, 'lowpass');
    }

    // 11. Cute 8-Bit Chiptune Logo Twinkle
    playSplashTwinkle() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1174.66, dur: 0.045, gain: 0.12 }, // D6
            { freq: 1479.98, dur: 0.045, gain: 0.13 }, // F#6
            { freq: 1760.00, dur: 0.045, gain: 0.13 }, // A6
            { freq: 2349.32, dur: 0.070, gain: 0.14 }, // D7
            { freq: 1760.00, dur: 0.045, gain: 0.11 }, // A6
            { freq: 2349.32, dur: 0.240, gain: 0.14 }  // D7
        ], 'square', 0.14, 3800);
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.135, gain: 0.13 }, // D5
            { freq: 880.00,  dur: 0.115, gain: 0.13 }, // A5
            { freq: 1174.66, dur: 0.240, gain: 0.14 }  // D6
        ], 'triangle', 0.14, 2400);
    }

    // 12. Animated Title Opener Token Drop Blip
    playTitleTokenDrop(idx = 0) {
        if (this.muted) return;
        const baseNotes = [293.66, 349.23, 440.00, 587.33]; // D4, F4, A4, D5
        const f = baseNotes[idx % baseNotes.length];
        this.playSteppedSequence([
            { freq: f * 1.5, dur: 0.022, gain: 0.13 },
            { freq: f,       dur: 0.055, gain: 0.15 }
        ], 'square', 0.15, 2800);
        this.playNoiseBurst(0.038, 1300 + idx * 200, 0.09, 'bandpass');
    }

    // 13. Animated Title Opener Connect-4 Lock-In Chord & Slam
    playTitleConnectFanfare() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.055, gain: 0.13 }, // D5
            { freq: 880.00,  dur: 0.055, gain: 0.13 }, // A5
            { freq: 1174.66, dur: 0.065, gain: 0.14 }, // D6
            { freq: 1479.98, dur: 0.220, gain: 0.15 }  // F#6
        ], 'square', 0.14, 3500);
        this.playNoiseBurst(0.08, 1100, 0.11, 'lowpass');
    }

    // 14. 8-Bit Board-Wide 180° Upheaval Flip Whoosh & Slam
    playBoardFlipWhoosh() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 196.00, dur: 0.045, gain: 0.13 }, // G3
            { freq: 293.66, dur: 0.045, gain: 0.14 }, // D4
            { freq: 440.00, dur: 0.050, gain: 0.14 }, // A4
            { freq: 587.33, dur: 0.055, gain: 0.15 }, // D5
            { freq: 880.00, dur: 0.065, gain: 0.15 }, // A5
            { freq: 587.33, dur: 0.050, gain: 0.14 }, // D5
            { freq: 392.00, dur: 0.050, gain: 0.14 }, // G4
            { freq: 293.66, dur: 0.085, gain: 0.16 }  // D4
        ], 'square', 0.15, 3200);
        this.playNoiseBurst(0.22, 1200, 0.13, 'bandpass');
    }

    // 15. Cute High-Pitched 8-Bit Squeak (Oddly Shrinking Cave Shroom)
    playTinySqueak() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1567.98, dur: 0.028, gain: 0.12 }, // G6
            { freq: 2093.00, dur: 0.032, gain: 0.13 }, // C7
            { freq: 2637.02, dur: 0.055, gain: 0.13 }  // E7
        ], 'square', 0.13, 4200);
    }

    // 16. 8-Bit Sulfuric Brimstone Laser Roar
    playBrimstoneLaser() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 146.83, dur: 0.050, gain: 0.16 }, // D3
            { freq: 110.00, dur: 0.060, gain: 0.17 }, // A2
            { freq: 73.42,  dur: 0.120, gain: 0.18 }, // D2
            { freq: 98.00,  dur: 0.080, gain: 0.16 }, // G2
            { freq: 65.41,  dur: 0.160, gain: 0.17 }  // C2
        ], 'sawtooth', 0.17, 2400);
        this.playNoiseBurst(0.28, 850, 0.16, 'lowpass');
    }

    // 17. 8-Bit Cave Fly Swarm Buzz (Suspicious Jar of Cave Flies)
    playFlyBuzz(isGood = true) {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 311.13, dur: 0.024, gain: 0.12 },
            { freq: 349.23, dur: 0.024, gain: 0.12 },
            { freq: 311.13, dur: 0.024, gain: 0.12 },
            { freq: 370.00, dur: 0.024, gain: 0.12 },
            { freq: 311.13, dur: 0.030, gain: 0.13 },
            { freq: isGood ? 880.00 : 146.83, dur: 0.085, gain: 0.14 }
        ], 'sawtooth', 0.13, 2800);
    }

    // 18. 8-Bit Cavern Pebble Nudge (Earthy Triangle Knock + Coin Spark)
    playPebbleTamp() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 220.00, dur: 0.030, gain: 0.16 }, // A3
            { freq: 293.66, dur: 0.035, gain: 0.16 }, // D4
            { freq: 587.33, dur: 0.045, gain: 0.13 }, // D5
            { freq: 1174.66, dur: 0.110, gain: 0.13 } // D6
        ], 'triangle', 0.15, 3000);
        this.playNoiseBurst(0.035, 1200, 0.09, 'bandpass');
    }

    // 19. 8-Bit Oracle's Lantern Illumination (Warm Mystical Bell Sweep)
    playOracleLantern() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 523.25,  dur: 0.040, gain: 0.11 }, // C5
            { freq: 659.25,  dur: 0.040, gain: 0.12 }, // E5
            { freq: 783.99,  dur: 0.045, gain: 0.13 }, // G5
            { freq: 987.77,  dur: 0.050, gain: 0.13 }, // B5
            { freq: 1318.51, dur: 0.065, gain: 0.14 }, // E6
            { freq: 1567.98, dur: 0.180, gain: 0.12 }  // G6
        ], 'triangle', 0.13, 3800);
    }

    // 20. 8-Bit Subterranean Tremor Quake (Deep Tectonic Bass Rumble + Rock Crack)
    playTremorQuake() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 110.00, dur: 0.045, gain: 0.18 }, // A2
            { freq: 82.41,  dur: 0.055, gain: 0.18 }, // E2
            { freq: 73.42,  dur: 0.065, gain: 0.18 }, // D2
            { freq: 55.00,  dur: 0.120, gain: 0.16 }  // A1
        ], 'triangle', 0.18, 1400);
        this.playNoiseBurst(0.22, 680, 0.18, 'lowpass');
    }

    // 21. 8-Bit Petrified Wood Block Seal (Hollow Wooden Thump + Stone Lock)
    playPetrifiedSeal() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 329.63, dur: 0.025, gain: 0.15 }, // E4
            { freq: 196.00, dur: 0.038, gain: 0.16 }, // G3
            { freq: 146.83, dur: 0.085, gain: 0.17 }  // D3
        ], 'square', 0.16, 1900);
        this.playNoiseBurst(0.065, 950, 0.12, 'bandpass');
    }

    // 22. 8-Bit Stalactite Strike Whistle & Shatter
    playStalactiteSpear() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1760.00, dur: 0.025, gain: 0.12 }, // A6
            { freq: 1396.91, dur: 0.025, gain: 0.13 }, // F6
            { freq: 1046.50, dur: 0.025, gain: 0.13 }, // C6
            { freq: 783.99,  dur: 0.025, gain: 0.14 }, // G5
            { freq: 523.25,  dur: 0.030, gain: 0.15 }, // C5
            { freq: 130.81,  dur: 0.095, gain: 0.18 }  // C3
        ], 'square', 0.15, 3400);
        this.playNoiseBurst(0.16, 1350, 0.17, 'bandpass');
    }

    // 23. 8-Bit Column Gravity Inversion Vortex (Bi-Directional Sci-Fi Phase Sweep)
    playGravityVortex() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 293.66,  dur: 0.030, gain: 0.12 }, // D4
            { freq: 440.00,  dur: 0.030, gain: 0.13 }, // A4
            { freq: 659.25,  dur: 0.030, gain: 0.13 }, // E5
            { freq: 987.77,  dur: 0.040, gain: 0.14 }, // B5
            { freq: 1318.51, dur: 0.045, gain: 0.14 }, // E6
            { freq: 880.00,  dur: 0.035, gain: 0.13 }, // A5
            { freq: 587.33,  dur: 0.070, gain: 0.14 }  // D5
        ], 'sawtooth', 0.14, 3200);
    }

    // 24. 8-Bit Surrealist Transmute Warp (Dreamy Whole-Tone Shimmer)
    playSurrealTransmute() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 523.25,  dur: 0.032, gain: 0.12 }, // C5
            { freq: 587.33,  dur: 0.032, gain: 0.12 }, // D5
            { freq: 659.25,  dur: 0.032, gain: 0.13 }, // E5
            { freq: 739.99,  dur: 0.032, gain: 0.13 }, // F#5
            { freq: 830.61,  dur: 0.032, gain: 0.13 }, // G#5
            { freq: 932.33,  dur: 0.040, gain: 0.14 }, // A#5
            { freq: 1174.66, dur: 0.160, gain: 0.15 }  // D6
        ], 'square', 0.14, 3600);
    }

    // 25. 8-Bit Spicy Miso Hibachi Flare (Wok Flame Sizzle + Rising Fire Burst)
    playHibachiSizzle() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 349.23, dur: 0.030, gain: 0.13 }, // F4
            { freq: 440.00, dur: 0.030, gain: 0.14 }, // A4
            { freq: 587.33, dur: 0.040, gain: 0.14 }, // D5
            { freq: 880.00, dur: 0.095, gain: 0.15 }  // A5
        ], 'sawtooth', 0.14, 2900);
        this.playNoiseBurst(0.21, 2400, 0.15, 'highpass');
    }

    // 26. 8-Bit Subterranean Echo Drop (Twin Harmonic Octave Double-Thud)
    playEchoTwinDrop() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 440.00,  dur: 0.035, gain: 0.14 }, // A4
            { freq: 293.66,  dur: 0.045, gain: 0.16 }, // D4 (Drop 1)
            { freq: 880.00,  dur: 0.035, gain: 0.14 }, // A5
            { freq: 587.33,  dur: 0.085, gain: 0.17 }  // D5 (Drop 2)
        ], 'square', 0.16, 3200);
        this.playNoiseBurst(0.06, 1500, 0.10, 'bandpass');
    }

    // 27. 8-Bit Dead Weight Curse Banish (Heavy Stone Grind -> Pure Cleansing Chime)
    playCurseBanish() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 130.81,  dur: 0.045, gain: 0.15 }, // C3
            { freq: 146.83,  dur: 0.045, gain: 0.15 }, // D3
            { freq: 587.33,  dur: 0.040, gain: 0.13 }, // D5
            { freq: 880.00,  dur: 0.045, gain: 0.13 }, // A5
            { freq: 1174.66, dur: 0.130, gain: 0.14 }  // D6
        ], 'square', 0.14, 3400);
        this.playNoiseBurst(0.08, 1100, 0.11, 'bandpass');
    }

    // 28. 8-Bit Heavy Anvil Clang (Metallic Blacksmith Ring + Heavy Crush)
    playAnvilClang() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1479.98, dur: 0.018, gain: 0.16 }, // F#6
            { freq: 2217.46, dur: 0.025, gain: 0.15 }, // C#7
            { freq: 110.00,  dur: 0.095, gain: 0.18 }, // A2
            { freq: 73.42,   dur: 0.110, gain: 0.16 }  // D2
        ], 'square', 0.17, 3800);
        this.playNoiseBurst(0.14, 1200, 0.16, 'bandpass');
    }

    // 29. 8-Bit Wild Prismatic Crystal Chord (Sparkling Crystalline Arpeggio)
    playWildPrismatic() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 659.25,  dur: 0.030, gain: 0.12 }, // E5
            { freq: 830.61,  dur: 0.030, gain: 0.13 }, // G#5
            { freq: 987.77,  dur: 0.030, gain: 0.13 }, // B5
            { freq: 1318.51, dur: 0.040, gain: 0.14 }, // E6
            { freq: 1661.22, dur: 0.045, gain: 0.14 }, // G#6
            { freq: 1975.53, dur: 0.160, gain: 0.14 }  // B6
        ], 'square', 0.14, 4200);
    }

    // 30. 8-Bit Jalapeño Core Bomb Detonation
    playJalapenoBlast() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 880.00, dur: 0.022, gain: 0.13 },
            { freq: 440.00, dur: 0.025, gain: 0.15 },
            { freq: 196.00, dur: 0.045, gain: 0.18 },
            { freq: 98.00,  dur: 0.075, gain: 0.18 },
            { freq: 55.00,  dur: 0.120, gain: 0.17 }
        ], 'sawtooth', 0.18, 2200);
        this.playNoiseBurst(0.24, 900, 0.19, 'lowpass');
    }

    // 31. 8-Bit Vampire Bat Echolocation & Bite
    playBatEcholocation() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1975.53, dur: 0.018, gain: 0.12 }, // B6
            { freq: 1318.51, dur: 0.018, gain: 0.11 }, // E6
            { freq: 2093.00, dur: 0.018, gain: 0.12 }, // C7
            { freq: 1396.91, dur: 0.018, gain: 0.11 }, // F6
            { freq: 659.25,  dur: 0.045, gain: 0.14 }, // E5
            { freq: 880.00,  dur: 0.095, gain: 0.14 }  // A5
        ], 'square', 0.13, 4200);
    }

    // 32. 8-Bit Golden Midas Eye Fanfare
    playMidasFanfare() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.040, gain: 0.13 }, // D5
            { freq: 739.99,  dur: 0.040, gain: 0.13 }, // F#5
            { freq: 880.00,  dur: 0.040, gain: 0.14 }, // A5
            { freq: 987.77,  dur: 0.045, gain: 0.14 }, // B5
            { freq: 1174.66, dur: 0.055, gain: 0.15 }, // D6
            { freq: 1479.98, dur: 0.210, gain: 0.15 }  // F#6
        ], 'square', 0.15, 3800);
        this.playSteppedSequence([
            { freq: 293.66, dur: 0.165, gain: 0.15 }, // D4
            { freq: 440.00, dur: 0.265, gain: 0.16 }  // A4
        ], 'triangle', 0.15, 2200);
    }

    // 33. 8-Bit Gambit Activation: Obsidian Cat Nine-Lives Meow & Slash
    playCatMeowSlash(isNineLivesSave = false) {
        if (this.muted) return;
        if (isNineLivesSave) {
            this.playSteppedSequence([
                { freq: 783.99,  dur: 0.035, gain: 0.14 }, // G5
                { freq: 1174.66, dur: 0.045, gain: 0.15 }, // D6
                { freq: 1567.98, dur: 0.055, gain: 0.16 }, // G6
                { freq: 1046.50, dur: 0.050, gain: 0.14 }, // C6
                { freq: 220.00,  dur: 0.090, gain: 0.18 }  // A3
            ], 'square', 0.16, 3800);
            this.playNoiseBurst(0.14, 1600, 0.16, 'bandpass');
        } else {
            this.playSteppedSequence([
                { freq: 880.00,  dur: 0.030, gain: 0.12 },
                { freq: 1174.66, dur: 0.040, gain: 0.13 },
                { freq: 1318.51, dur: 0.095, gain: 0.13 }
            ], 'square', 0.13, 3600);
        }
    }

    // 34. 8-Bit Gambit Activation: Butter-Cheese Golden Crust Sizzle Chime
    playButterCrustChime() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.035, gain: 0.13 }, // D5
            { freq: 739.99,  dur: 0.035, gain: 0.13 }, // F#5
            { freq: 880.00,  dur: 0.045, gain: 0.14 }, // A5
            { freq: 1174.66, dur: 0.110, gain: 0.14 }  // D6
        ], 'triangle', 0.14, 3400);
        this.playNoiseBurst(0.05, 2200, 0.07, 'highpass');
    }

    // 35. 8-Bit Gambit Activation: Coaster Apex Momentum Whoosh & Fanfare
    playCoasterWhoosh() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 392.00,  dur: 0.030, gain: 0.13 }, // G4
            { freq: 493.88,  dur: 0.030, gain: 0.13 }, // B4
            { freq: 587.33,  dur: 0.030, gain: 0.14 }, // D5
            { freq: 783.99,  dur: 0.035, gain: 0.14 }, // G5
            { freq: 987.77,  dur: 0.040, gain: 0.15 }, // B5
            { freq: 1174.66, dur: 0.045, gain: 0.15 }, // D6
            { freq: 1567.98, dur: 0.160, gain: 0.16 }  // G6
        ], 'square', 0.15, 3900);
    }

    // 36. 8-Bit Gambit Activation: Subterranean Echo Bell Resonance Toll
    playEchoBellToll() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 1318.51, dur: 0.055, gain: 0.14 }, // E6
            { freq: 659.25,  dur: 0.045, gain: 0.11 }, // E5
            { freq: 1318.51, dur: 0.140, gain: 0.13 }  // E6
        ], 'triangle', 0.14, 3800);
    }

    // 37. 8-Bit Gambit Activation: Sacred Prismatic Heart Choir Chime
    playSacredHeartChoir() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 523.25,  dur: 0.045, gain: 0.13 }, // C5
            { freq: 659.25,  dur: 0.045, gain: 0.13 }, // E5
            { freq: 783.99,  dur: 0.045, gain: 0.14 }, // G5
            { freq: 1046.50, dur: 0.055, gain: 0.14 }, // C6
            { freq: 1318.51, dur: 0.190, gain: 0.15 }  // E6
        ], 'triangle', 0.14, 3800);
        this.playSteppedSequence([
            { freq: 261.63, dur: 0.180, gain: 0.13 }, // C4
            { freq: 523.25, dur: 0.200, gain: 0.14 }  // C5
        ], 'square', 0.12, 2600);
    }

    // 38. 8-Bit Gambit Activation: Surrealist Dalí Clock Tick-Tock Discount
    playDaliClockTick() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 987.77,  dur: 0.022, gain: 0.11 }, // Tick
            { freq: 659.25,  dur: 0.028, gain: 0.11 }, // Tock
            { freq: 1174.66, dur: 0.060, gain: 0.12 }
        ], 'square', 0.12, 3500);
    }

    // 39. 8-Bit Boss Health Phase Shatter & Board Reset Roar
    playBossPhaseShatter() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.045, gain: 0.15 }, // D5
            { freq: 880.00,  dur: 0.045, gain: 0.15 }, // A5
            { freq: 1174.66, dur: 0.065, gain: 0.16 }, // D6
            { freq: 311.13,  dur: 0.055, gain: 0.16 }, // Eb4
            { freq: 293.66,  dur: 0.055, gain: 0.16 }, // D4
            { freq: 207.65,  dur: 0.160, gain: 0.18 }  // G#3
        ], 'sawtooth', 0.17, 3200);
        this.playNoiseBurst(0.26, 1050, 0.18, 'bandpass');
    }

    // 40. In-Theme Subterranean Level Transition Sound
    playLevelTransitionJingle(floorIdx = 0, isBoss = false, isPreBoss = false) {
        if (this.muted) return;
        if (isBoss) {
            const bossTier = floorIdx >= 8 ? 3 : (floorIdx >= 5 ? 2 : 1);
            const tritoneOrb2 = bossTier === 3 ? 311.13 : (bossTier === 2 ? 415.30 : 311.13);
            this.playSteppedSequence([
                { freq: 293.66,      dur: 0.09, gain: 0.15 },
                { freq: tritoneOrb2, dur: 0.09, gain: 0.15 },
                { freq: 370.00,      dur: 0.09, gain: 0.15 },
                { freq: 440.00,      dur: 0.11, gain: 0.16 },
                { freq: 466.16,      dur: 0.11, gain: 0.16 },
                { freq: 440.00,      dur: 0.10, gain: 0.15 },
                { freq: 293.66,      dur: 0.34, gain: 0.17 }
            ], 'sawtooth', 0.16, 2600);
            this.playSteppedSequence([
                { freq: 146.83, dur: 0.18, gain: 0.17 },
                { freq: 110.00, dur: 0.18, gain: 0.17 },
                { freq: 73.42,  dur: 0.52, gain: 0.18 }
            ], 'triangle', 0.18, 1600);
            this.playNoiseBurst(0.24, 900, 0.14, 'lowpass');
        } else if (isPreBoss) {
            this.playSteppedSequence([
                { freq: 440.00, dur: 0.08, gain: 0.13 },
                { freq: 392.00, dur: 0.08, gain: 0.13 },
                { freq: 349.23, dur: 0.08, gain: 0.14 },
                { freq: 329.63, dur: 0.08, gain: 0.14 },
                { freq: 293.66, dur: 0.12, gain: 0.15 },
                { freq: 440.00, dur: 0.10, gain: 0.14 },
                { freq: 587.33, dur: 0.28, gain: 0.15 }
            ], 'square', 0.14, 3000);
            this.playSteppedSequence([
                { freq: 146.83, dur: 0.32, gain: 0.16 },
                { freq: 220.00, dur: 0.20, gain: 0.16 },
                { freq: 146.83, dur: 0.30, gain: 0.17 }
            ], 'triangle', 0.16, 1800);
            this.playNoiseBurst(0.14, 1200, 0.11, 'bandpass');
        } else {
            this.playSteppedSequence([
                { freq: 880.00, dur: 0.075, gain: 0.12 },
                { freq: 698.46, dur: 0.075, gain: 0.12 },
                { freq: 587.33, dur: 0.075, gain: 0.13 },
                { freq: 440.00, dur: 0.085, gain: 0.13 },
                { freq: 523.25, dur: 0.085, gain: 0.13 },
                { freq: 587.33, dur: 0.300, gain: 0.14 }
            ], 'square', 0.13, 3100);
            this.playSteppedSequence([
                { freq: 293.66, dur: 0.225, gain: 0.15 },
                { freq: 220.00, dur: 0.170, gain: 0.15 },
                { freq: 146.83, dur: 0.320, gain: 0.16 }
            ], 'triangle', 0.16, 1900);
            this.playNoiseBurst(0.10, 1350, 0.09, 'bandpass');
        }
    }

    // 41. Crisp Tactile Mechanical Keyboard Keystroke
    playMechanicalKeystroke() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        const now = this.ctx.currentTime;
        this.playNoiseBurst(0.014, 4600, 0.24, 'bandpass');

        const thockOsc = this.ctx.createOscillator();
        const thockGain = this.ctx.createGain();
        thockOsc.type = 'triangle';
        thockOsc.frequency.setValueAtTime(340, now + 0.004);
        thockOsc.frequency.exponentialRampToValueAtTime(68, now + 0.042);
        thockGain.gain.setValueAtTime(0.28, now + 0.004);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.046);
        thockOsc.connect(thockGain);
        thockGain.connect(this.ctx.destination);
        thockOsc.start(now + 0.004);
        thockOsc.stop(now + 0.05);

        const upOsc = this.ctx.createOscillator();
        const upGain = this.ctx.createGain();
        upOsc.type = 'square';
        upOsc.frequency.setValueAtTime(2100, now + 0.052);
        upOsc.frequency.exponentialRampToValueAtTime(620, now + 0.068);
        upGain.gain.setValueAtTime(0.09, now + 0.052);
        upGain.gain.exponentialRampToValueAtTime(0.001, now + 0.072);
        upOsc.connect(upGain);
        upGain.connect(this.ctx.destination);
        upOsc.start(now + 0.052);
        upOsc.stop(now + 0.075);
    }

    // 42. 8-Bit Subterranean Trapdoor Unbolt & Chute Rumble
    playTrapdoorRelease() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 392.00, dur: 0.025, gain: 0.15 }, // G4
            { freq: 293.66, dur: 0.030, gain: 0.16 }, // D4
            { freq: 196.00, dur: 0.045, gain: 0.17 }, // G3
            { freq: 146.83, dur: 0.060, gain: 0.17 }, // D3
            { freq: 98.00,  dur: 0.110, gain: 0.16 }  // G2
        ], 'triangle', 0.17, 2000);
        this.playNoiseBurst(0.16, 820, 0.15, 'lowpass');
    }

    // 43. 8-Bit Token Hitting the Cavern Floor
    playTokenFloorHit(hitIdx = 0, tokenType = 1) {
        if (this.muted) return;
        const baseFreqs = [261.63, 293.66, 329.63];
        const pitchMult = tokenType === 3 ? 0.78 : (tokenType === 4 ? 1.15 : 1.0);
        const root = baseFreqs[hitIdx % baseFreqs.length] * pitchMult;

        this.playSteppedSequence([
            { freq: root * 1.45, dur: 0.018, gain: 0.15 },
            { freq: root * 0.75, dur: 0.040, gain: 0.18 },
            { freq: root * 0.50, dur: 0.032, gain: 0.06 },
            { freq: root * 1.20, dur: 0.016, gain: 0.12 },
            { freq: root * 0.65, dur: 0.048, gain: 0.13 }
        ], 'square', 0.16, 2600);
        this.playNoiseBurst(0.055, 1150 + hitIdx * 210, 0.14, 'bandpass');
    }

    // 44. Interactive Title Screen Token Toy Note
    playTitleTokenToyNote(idx = 0) {
        if (this.muted) return;
        const notes = [587.33, 698.46, 880.00, 1174.66];
        const root = notes[idx % notes.length];

        this.playSteppedSequence([
            { freq: root * 1.5,  dur: 0.018, gain: 0.11 },
            { freq: root,        dur: 0.095, gain: 0.14 },
            { freq: root * 1.25, dur: 0.045, gain: 0.09 }
        ], 'square', 0.14, 3600);

        this.playSteppedSequence([
            { freq: root * 0.5, dur: 0.14, gain: 0.13 }
        ], 'triangle', 0.13, 2200);
    }

    // 45. 8-Bit Secret Code Unlocked Fanfare
    playDebugUnlockJingle() {
        if (this.muted) return;
        this.playSteppedSequence([
            { freq: 659.25,  dur: 0.055, gain: 0.13 },
            { freq: 783.99,  dur: 0.055, gain: 0.13 },
            { freq: 987.77,  dur: 0.055, gain: 0.14 },
            { freq: 1174.66, dur: 0.055, gain: 0.14 },
            { freq: 1318.51, dur: 0.055, gain: 0.15 },
            { freq: 1567.98, dur: 0.070, gain: 0.15 },
            { freq: 1975.53, dur: 0.240, gain: 0.16 }
        ], 'square', 0.15, 4200);

        this.playSteppedSequence([
            { freq: 329.63, dur: 0.165, gain: 0.14 },
            { freq: 493.88, dur: 0.165, gain: 0.14 },
            { freq: 659.25, dur: 0.310, gain: 0.16 }
        ], 'triangle', 0.15, 2400);
    }

    // 46. 8-Bit Spelunker's Pickaxe Iron-on-Stone Clang & Rock Crumble
    playPickaxeStrike(stoneCount = 1) {
        if (this.muted) return;
        const hits = Math.max(1, Math.min(4, stoneCount));

        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                if (this.muted) return;
                const pitchShift = 1 + i * 0.08;
                this.playSteppedSequence([
                    { freq: 523.25 * pitchShift,  dur: 0.018, gain: 0.12 },
                    { freq: 1975.53 * pitchShift, dur: 0.022, gain: 0.17 },
                    { freq: 2637.02 * pitchShift, dur: 0.030, gain: 0.15 },
                    { freq: 1318.51 * pitchShift, dur: 0.045, gain: 0.12 },
                    { freq: 146.83,               dur: 0.075, gain: 0.17 },
                    { freq: 87.31,                dur: 0.095, gain: 0.15 }
                ], 'square', 0.16, 4000);

                this.playSteppedSequence([
                    { freq: 220.00, dur: 0.035, gain: 0.18 },
                    { freq: 110.00, dur: 0.065, gain: 0.18 },
                    { freq: 65.41,  dur: 0.110, gain: 0.16 }
                ], 'triangle', 0.18, 1600);

                this.playNoiseBurst(0.15, 1450 + i * 220, 0.17, 'bandpass');
            }, i * 75);
        }
    }

    // 47. 8-Bit Tutorial Step Advance Chime
    playTutorialStepBlip(stepIdx = 0, isFinal = false) {
        if (this.muted) return;
        if (isFinal) {
            this.playSteppedSequence([
                { freq: 587.33,  dur: 0.045, gain: 0.13 },
                { freq: 880.00,  dur: 0.045, gain: 0.13 },
                { freq: 1174.66, dur: 0.055, gain: 0.14 },
                { freq: 1479.98, dur: 0.160, gain: 0.15 }
            ], 'square', 0.14, 3600);
        } else {
            const scale = [587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51];
            const root = scale[stepIdx % scale.length];
            this.playSteppedSequence([
                { freq: root,        dur: 0.028, gain: 0.11 },
                { freq: root * 1.25, dur: 0.065, gain: 0.12 }
            ], 'triangle', 0.12, 3400);
        }
    }

    // 48. 8-Bit Tectonic Anchor Keystone Brace & Gilded Lock-In
    playTectonicAnchor(upgradedToAmplifier = false) {
        if (this.muted) return;
        // Phase 1: Heavy dwarven keystone brace slam (sub-bass triangle thud)
        this.playSteppedSequence([
            { freq: 293.66, dur: 0.028, gain: 0.17 }, // D4
            { freq: 196.00, dur: 0.035, gain: 0.18 }, // G3
            { freq: 146.83, dur: 0.075, gain: 0.18 }, // D3 Brace Lock
            { freq: 220.00, dur: 0.120, gain: 0.15 }  // A3
        ], 'triangle', 0.18, 1900);
        this.playNoiseBurst(0.08, 950, 0.14, 'lowpass');

        // Phase 2: Gilded / Amplifier slot crystallization chime (~115ms later)
        setTimeout(() => {
            if (this.muted) return;
            const topNote = upgradedToAmplifier ? 1975.53 : 1479.98; // B6 (Amplifier) vs F#6 (Gilded)
            this.playSteppedSequence([
                { freq: 587.33,  dur: 0.032, gain: 0.13 }, // D5
                { freq: 880.00,  dur: 0.035, gain: 0.14 }, // A5
                { freq: 1174.66, dur: 0.040, gain: 0.14 }, // D6
                { freq: topNote, dur: 0.170, gain: 0.15 }
            ], 'square', 0.14, 3900);
        }, 115);
    }

    // 49. 8-Bit Lodestone Polarity Electromagnetic Hum & Levitation Snap
    playLodestonePolarity() {
        if (this.muted) return;
        // Alternating bipolar magnetic flux pulse sweeping upward to a metallic lock
        this.playSteppedSequence([
            { freq: 220.00,  dur: 0.026, gain: 0.13 }, // A3
            { freq: 329.63,  dur: 0.026, gain: 0.13 }, // E4
            { freq: 293.66,  dur: 0.026, gain: 0.14 }, // D4
            { freq: 440.00,  dur: 0.026, gain: 0.14 }, // A4
            { freq: 587.33,  dur: 0.030, gain: 0.15 }, // D5
            { freq: 880.00,  dur: 0.032, gain: 0.15 }, // A5
            { freq: 1318.51, dur: 0.038, gain: 0.16 }, // E6
            { freq: 1760.00, dur: 0.150, gain: 0.15 }  // A6 Magnetic snap!
        ], 'square', 0.15, 3800);

        // Low electromagnetic triangle hum underneath
        this.playSteppedSequence([
            { freq: 110.00, dur: 0.11, gain: 0.15 }, // A2
            { freq: 146.83, dur: 0.11, gain: 0.15 }, // D3
            { freq: 220.00, dur: 0.16, gain: 0.16 }  // A3
        ], 'triangle', 0.15, 1800);
        this.playNoiseBurst(0.055, 2200, 0.10, 'bandpass');
    }

    // 50. 8-Bit Alchemical Crucible Bubbling Acid Dissolve & Wild Crystal Smelt
    playAlchemyCrucible() {
        if (this.muted) return;
        // Phase 1: Percolating alchemical crucible bubbles + sizzle dissolve
        this.playSteppedSequence([
            { freq: 370.00, dur: 0.024, gain: 0.13 }, // F#4
            { freq: 440.00, dur: 0.024, gain: 0.13 }, // A4
            { freq: 392.00, dur: 0.024, gain: 0.14 }, // G4
            { freq: 523.25, dur: 0.024, gain: 0.14 }, // C5
            { freq: 466.16, dur: 0.024, gain: 0.14 }, // Bb4
            { freq: 659.25, dur: 0.028, gain: 0.15 }  // E5
        ], 'triangle', 0.14, 3200);
        this.playNoiseBurst(0.14, 2600, 0.12, 'highpass');

        // Phase 2: Golden transmutation & Wild Amplifier crystal chime (~150ms later)
        setTimeout(() => {
            if (this.muted) return;
            this.playSteppedSequence([
                { freq: 783.99,  dur: 0.032, gain: 0.14 }, // G5
                { freq: 987.77,  dur: 0.035, gain: 0.14 }, // B5
                { freq: 1174.66, dur: 0.040, gain: 0.15 }, // D6
                { freq: 1567.98, dur: 0.180, gain: 0.15 }  // G6
            ], 'square', 0.15, 4000);
        }, 150);
    }

    // 51. 8-Bit Prismatic Mirror Shard Twin-Octave Reflection Shimmer
    playMirrorShard() {
        if (this.muted) return;
        // Motif 1 (Amber source token): D5 -> F#5 -> A5
        // Motif 2 (Reflected Wild Prismatic octave): D6 -> F#6 -> A6 -> C#7 -> D7
        this.playSteppedSequence([
            { freq: 587.33,  dur: 0.028, gain: 0.13 }, // D5
            { freq: 739.99,  dur: 0.028, gain: 0.13 }, // F#5
            { freq: 880.00,  dur: 0.032, gain: 0.14 }, // A5
            { freq: 1174.66, dur: 0.028, gain: 0.14 }, // D6
            { freq: 1479.98, dur: 0.028, gain: 0.15 }, // F#6
            { freq: 1760.00, dur: 0.032, gain: 0.15 }, // A6
            { freq: 2217.46, dur: 0.038, gain: 0.14 }, // C#7
            { freq: 2349.32, dur: 0.170, gain: 0.15 }  // D7 Prismatic Lock
        ], 'square', 0.15, 4200);

        this.playSteppedSequence([
            { freq: 293.66, dur: 0.090, gain: 0.14 }, // D4
            { freq: 587.33, dur: 0.240, gain: 0.15 }  // D5
        ], 'triangle', 0.14, 2400);
    }
}

const sfx = new TactileSFX();

function triggerHaptic(pattern) {
    if (!userSettings.hapticsEnabled) return;
    try {
        if (navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    } catch (e) {}
}
