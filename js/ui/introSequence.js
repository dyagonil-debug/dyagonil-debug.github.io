// ============================================================================
// CRT TERMINAL BOOT GATE, DYAGONIL SPLASH, TITLE OPENER & FLOOR INTRO (js/ui/introSequence.js)
// ============================================================================

let activeFloorIntroTimers = [];

function playFloorIntroTransition(floorData, topo, targetBgmMode) {
    const overlay = document.getElementById('floor-intro-overlay');
    const card = document.getElementById('floor-intro-card');
    const actBadge = document.getElementById('floor-intro-act-badge');
    const iconWrap = document.getElementById('floor-intro-icon-wrap');
    const floorTitle = document.getElementById('floor-intro-floor-title');
    const bossName = document.getElementById('floor-intro-boss-name');
    const hpRow = document.getElementById('floor-intro-hp-row');
    const topoName = document.getElementById('floor-intro-topo-name');
    const aiStats = document.getElementById('floor-intro-ai-stats');
    const ruleDesc = document.getElementById('floor-intro-rule-desc');
    if (!overlay) {
        bgm.setMode(targetBgmMode);
        return;
    }

    // Clear any previous intro timers
    activeFloorIntroTimers.forEach(t => clearTimeout(t));
    activeFloorIntroTimers = [];

    // Pause background music and pre-stage the target floor's loop mode
    bgm.pauseForLevelIntro(targetBgmMode);
    state.busy = true;

    // Populate Act & Depth theme details
    const actNum = Math.floor(state.floorIdx / 3) + 1;
    const actNames = ['ACT I • BIOLUMINESCENT SHALLOWS', 'ACT II • OBSIDIAN CHASM', 'ACT III • ABYSSAL CALDERA'];
    actBadge.textContent = actNames[Math.min(2, actNum - 1)];

    if (floorData.isBoss) {
        card.className = "cavern-panel w-full max-w-sm rounded-3xl p-6 border-2 border-rose-500/70 text-center space-y-3.5 shadow-[0_0_70px_rgba(244,63,94,0.38)] relative overflow-hidden";
        actBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-[10px] font-mono-code uppercase tracking-[0.2em] text-rose-300 font-bold animate-pulse";
        iconWrap.className = "w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/30 to-purple-800/35 border border-rose-400/60 flex items-center justify-center text-4xl shadow-inner mb-2";
        iconWrap.textContent = floorData.bossArchetype ? floorData.bossArchetype.icon : '💀';
        floorTitle.textContent = `⚠️ BOSS FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}`;
        floorTitle.className = "font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-rose-400";
        bossName.textContent = floorData.boss;

        hpRow.classList.remove('hidden');
        hpRow.classList.add('inline-flex');
        hpRow.innerHTML = `<span>${'❤️'.repeat(state.bossMaxHp)}</span><span>${state.bossMaxHp} HP PHASES • ${floorData.bossArchetype.poolLabel}</span>`;
        ruleDesc.textContent = `⚡ ${floorData.bossArchetype.fullRule}`;
    } else if (floorData.isPreBoss) {
        card.className = "cavern-panel w-full max-w-sm rounded-3xl p-6 border-2 border-orange-400/60 text-center space-y-3.5 shadow-[0_0_60px_rgba(249,115,22,0.3)] relative overflow-hidden";
        actBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-[10px] font-mono-code uppercase tracking-[0.2em] text-orange-200 font-bold";
        iconWrap.className = "w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-700/25 border border-orange-400/50 flex items-center justify-center text-4xl shadow-inner mb-2";
        iconWrap.textContent = topo.icon || '⚔️';
        floorTitle.textContent = `⚔️ VANGUARD FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}`;
        floorTitle.className = "font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-amber-300";
        bossName.textContent = floorData.boss;
        hpRow.classList.add('hidden');
        hpRow.classList.remove('inline-flex');
        ruleDesc.textContent = `Warped Pre-Boss Chamber: ${topo.desc}`;
    } else {
        card.className = "cavern-panel w-full max-w-sm rounded-3xl p-6 border border-amber-400/50 text-center space-y-3.5 shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden";
        actBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono-code uppercase tracking-[0.2em] text-amber-300 font-bold";
        iconWrap.className = "w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-700/25 border border-amber-400/50 flex items-center justify-center text-4xl shadow-inner mb-2";
        iconWrap.textContent = '🛡️';
        floorTitle.textContent = `DESCENDING TO FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}`;
        floorTitle.className = "font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-teal-300";
        bossName.textContent = floorData.boss;
        hpRow.classList.add('hidden');
        hpRow.classList.remove('inline-flex');
        ruleDesc.textContent = `Standard Cavern Sentinel. Build your Gold economy and claim Enchanted Slots before the Boss chamber!`;
    }

    topoName.textContent = `${topo.icon} ${topo.name}`;
    aiStats.textContent = `Lv.${floorData.floor} • Depth ${floorData.depth} (${floorData.aiPrecisionPct}% IQ)`;

    // Reset & show overlay for Fade-In
    overlay.classList.remove('hidden', 'floor-intro-fadeout', 'floor-intro-active');

    let finished = false;
    const finishIntroAndResumeBGM = () => {
        if (finished) return;
        finished = true;
        activeFloorIntroTimers.forEach(t => clearTimeout(t));
        activeFloorIntroTimers = [];
        overlay.onclick = null;

        // Trigger Fade-Out
        overlay.classList.remove('floor-intro-active');
        overlay.classList.add('floor-intro-fadeout');

        const hideTimer = setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('floor-intro-fadeout');
            if (!state.gameOver && state.turn === PLAYER) {
                state.busy = false;
            }
            // Resume the chiptune background music once the intro screen fades out!
            bgm.resumeAfterLevelIntro();
            updateHUD();
        }, 560);
        activeFloorIntroTimers.push(hideTimer);
    };

    // Tap anywhere on the intro overlay to dismiss and start the floor
    overlay.onclick = () => {
        sfx.playHoverTick();
        finishIntroAndResumeBGM();
    };

    // Fade in overlay & play in-theme 8-bit level transition sound while BGM is paused
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('floor-intro-active');
            sfx.playLevelTransitionJingle(state.floorIdx, floorData.isBoss, floorData.isPreBoss);
            triggerHaptic(floorData.isBoss ? [35, 30, 60] : [20, 25]);
        });
    });
}

function runOpeningSplashAndTitleSequence() {
    const overlay = document.getElementById('intro-sequence-overlay');
    const termStage = document.getElementById('terminal-boot-stage');
    const termCard = document.getElementById('terminal-crt-card');
    const termBtn = document.getElementById('terminal-start-app-btn');
    const termStatus = document.getElementById('terminal-audio-status');
    const splashStage = document.getElementById('dyagonil-splash-stage');
    const logoImg = document.getElementById('dyagonil-logo-img');
    const ringHalo = document.getElementById('dyagonil-ring-halo');
    const titleStage = document.getElementById('title-opener-stage');
    const startBtn = document.getElementById('title-start-game-btn');

    let appBooted = false;

    const triggerTerminalBoot = (e) => {
        if (appBooted) return;
        appBooted = true;
        if (e) e.stopPropagation();

        // 1. Unlock Web Audio synchronously inside the user's tap/keystroke gesture
        sfx.init();
        if (sfx.ctx && sfx.ctx.state === 'suspended') {
            sfx.ctx.resume().catch(() => {});
        }

        // 2. Play the tactile Mechanical Keyboard Keystroke sound effect + haptic click
        sfx.playMechanicalKeystroke();
        triggerHaptic([18, 25]);

        // 3. Visual depressed keycap feedback & terminal status update
        if (termBtn) termBtn.classList.add('key-pressed');
        if (termStatus) {
            termStatus.textContent = '[ONLINE]';
            termStatus.className = 'text-emerald-400 font-bold';
        }

        // 4. Transition from Terminal Boot Screen into Stage 1: Dyagonil Splash Screen
        setTimeout(() => {
            if (termCard) {
                termCard.style.opacity = '0';
                termCard.style.transform = 'scale(0.96) translateY(-8px)';
            }
            setTimeout(() => {
                if (termStage) termStage.classList.add('hidden');
                splashStage.classList.remove('hidden');
                splashStage.classList.add('flex');

                // Step 1: Fade in Dyagonil Logo & Stylized Alias (duration: 1.15s)
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        splashStage.classList.add('splash-visible');
                    }, 60);
                });

                // Step 2: At full opacity (~1.21s), trigger the cute chiptune twinkle + halo pulse
                setTimeout(() => {
                    logoImg.classList.add('dyagonil-logo-peak');
                    ringHalo.classList.add('scale-110', 'border-amber-300/60');
                    sfx.playSplashTwinkle();
                }, 1210);

                // Step 3: Fade out Dyagonil Splash Screen after holding at full opacity (~2.43s)
                setTimeout(() => {
                    splashStage.classList.remove('splash-visible');
                    splashStage.classList.add('splash-fadeout');
                }, 2430);

                // Step 4: Transition into the Animated Title Opener (~3.43s)
                setTimeout(() => {
                    splashStage.classList.add('hidden');
                    titleStage.classList.remove('hidden');
                    titleStage.classList.add('flex');

                    // Drop each of the 4 Connect-4 title tokens sequentially with chiptune drop SFX
                    [0, 1, 2, 3].forEach((tokIdx) => {
                        setTimeout(() => {
                            const tokEl = document.getElementById(`title-tok-${tokIdx}`);
                            if (tokEl) tokEl.classList.add('token-landed');
                            sfx.playTitleTokenDrop(tokIdx);
                        }, 160 + tokIdx * 210);
                    });

                    // Slam in the CONNECT 4: SUBTERRANEAN ASCENSION title header & ignite the 4 tokens
                    setTimeout(() => {
                        [0, 1, 2, 3].forEach(i => {
                            const t = document.getElementById(`title-tok-${i}`);
                            if (t) t.classList.add('token-ignited');
                        });
                        document.getElementById('title-Main-Header').classList.add('slam-in');
                        sfx.playTitleConnectFanfare();
                        triggerHaptic([25, 30, 45]);
                    }, 1080);

                    // Reveal subtitle description & Start Game button, AND start the Floor 1 Cavern Chiptune Track!
                    setTimeout(() => {
                        document.getElementById('title-Sub-Desc').classList.add('slam-in');
                        document.getElementById('title-Start-Wrap').classList.add('slam-in');
                        bgm.startAfterDifficultySelect(false);
                        enableTitleTokensSecretInteraction();
                    }, 1520);
                }, 3430);
            }, 340);
        }, 140);
    };

    // Bind tap anywhere on the Terminal Boot Gate or pressing Enter / Space
    if (termStage) termStage.addEventListener('pointerdown', triggerTerminalBoot);
    if (termBtn) termBtn.addEventListener('click', triggerTerminalBoot);
    const onTerminalKey = (e) => {
        if (!appBooted && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            window.removeEventListener('keydown', onTerminalKey);
            triggerTerminalBoot(e);
        }
    };
    window.addEventListener('keydown', onTerminalKey);

    // Step 5: Clicking "Start Game" opens the Difficulty Select Screen while keeping the music playing
    startBtn.addEventListener('click', () => {
        sfx.playCardChime();
        triggerHaptic(25);
        if (!bgm.isPlaying) {
            bgm.startAfterDifficultySelect(false);
        }
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        openDifficultyModal(false);
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 660);
    });

    // Step 6: Clicking "How to Play (Tutorial)" stages a typical game board and launches the HUD Tutorial
    const tutorialBtn = document.getElementById('title-tutorial-btn');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            if (!bgm.isPlaying) {
                bgm.startAfterDifficultySelect(false);
            }
            startTutorialSequence();
        });
    }
}
