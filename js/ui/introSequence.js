// ============================================================================
// CRT TERMINAL BOOT GATE, DYAGONIL SPLASH, TITLE OPENER & FLOOR INTRO (js/ui/introSequence.js)
// ============================================================================

let activeFloorIntroTimers = [];

// 5-Act Subterranean-to-Cosmic Progression Definitions
const ACT_DEFINITIONS = [
  {
    actNum: 1,
    roman: 'I',
    badge: 'ACT I • THE GLOWWORM GROTTO',
    overline: 'ACT I OF V • DEPTH 100M',
    title: 'THE GLOWWORM GROTTO',
    epigraph: '“Where bioluminescent spores drift through waking stone.”',
    themeClass: 'act-theme-1'
  },
  {
    actNum: 2,
    roman: 'II',
    badge: 'ACT II • THE VITREOUS CATACOMBS',
    overline: 'ACT II OF V • DEPTH 450M',
    title: 'THE VITREOUS CATACOMBS',
    epigraph: '“Halls of black glass and fractured reflections.”',
    themeClass: 'act-theme-2'
  },
  {
    actNum: 3,
    roman: 'III',
    badge: 'ACT III • THE BRIMSTONE CALDERA',
    overline: 'ACT III OF V • DEPTH 1,200M',
    title: 'THE BRIMSTONE CALDERA',
    epigraph: '“The molten mantle where tectonic titans stir.”',
    themeClass: 'act-theme-3'
  },
  {
    actNum: 4,
    roman: 'IV',
    badge: 'ACT IV • THE HORIZON FAULT',
    overline: 'ACT IV OF V • SINGULARITY DEPTH',
    title: 'THE HORIZON FAULT',
    epigraph: '“Gravity bends where the subterranean floor gives way to the void.”',
    themeClass: 'act-theme-4'
  },
  {
    actNum: 5,
    roman: 'V',
    badge: 'ACT V • THE FOURFOLD SANCTUM',
    overline: 'ACT V OF V • BEYOND THE BEDROCK',
    title: 'THE FOURFOLD SANCTUM',
    epigraph: '“Four parallel boards converging at the heart of the tesseract.”',
    themeClass: 'act-theme-5'
  }
];

function syncTitleSavedRunBadge() {
  const pill = document.getElementById('title-saved-run-pill');
  const pillText = document.getElementById('title-saved-run-text');
  if (!pill) return;

  const hasSave =
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.hasSavedRun === 'function' &&
    runPersistence.hasSavedRun();

  if (!hasSave) {
    pill.classList.add('hidden');
    pill.classList.remove('inline-flex');
    return;
  }

  let details = 'CHECKPOINT ACTIVE';
  try {
    const payload = typeof runPersistence.loadRun === 'function' ? runPersistence.loadRun() : null;
    if (payload && payload.summary) {
      const fNum = Math.min(15, Math.max(1, (payload.summary.floorIndex || 0) + 1));
      const lId = payload.summary.loadoutId || 'spelunker';
      const vName = (typeof LOADOUT_CATALOG !== 'undefined' && LOADOUT_CATALOG[lId])
        ? LOADOUT_CATALOG[lId].shortName.toUpperCase()
        : 'DELVER';
      details = `CHECKPOINT READY • FLOOR ${fNum}/15 (${vName})`;
    }
  } catch (_) {}

  if (pillText) pillText.textContent = details;
  pill.classList.remove('hidden');
  pill.classList.add('inline-flex');
}

function playFloorIntroTransition(floorData, topo, targetBgmMode) {
  const overlay = document.getElementById('floor-intro-overlay');
  const actCurtain = document.getElementById('act-intro-curtain');
  const actOverline = document.getElementById('act-curtain-overline');
  const actTitle = document.getElementById('act-curtain-title');
  const actEpigraph = document.getElementById('act-curtain-epigraph');
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
  activeFloorIntroTimers.forEach((t) => clearTimeout(t));
  activeFloorIntroTimers = [];

  // Pause background music and pre-stage the target floor's loop mode
  bgm.pauseForLevelIntro(targetBgmMode);
  state.busy = true;

  // Populate Act & Depth theme details (supports live toggling between Simplified Lore & Detailed Math)
  const actIdx = Math.max(0, Math.min(ACT_DEFINITIONS.length - 1, Math.floor(state.floorIdx / 3)));
  const actDef = ACT_DEFINITIONS[actIdx];

  const SENTINEL_SIMPLE_FLAVOR = [
    'A waking grotto scout guarding a classic 7×6 board. Claim glowing rings and build up Gold!',
    'An unblinking subterranean watchman on an open 7×6 grid. Connect 4 before the ceiling quakes!',
    'A crystalline delver patrolling the catacombs. Stockpile Gold and Mana before the Boss chamber!',
    'An obsidian sentinel standing guard over the caldera. Use enchanted slots to outpace its defense!',
    'A cosmic gatekeeper beyond the bedrock. Outmaneuver its blocks and prepare for the final trials!'
  ];

  const renderIntroCalloutContent = () => {
    const wasCardVisible = card && card.classList.contains('floor-card-visible');
    const simp = typeof isSimplifiedView === 'function' ? isSimplifiedView() : true;
    const topoLabelEl = document.getElementById('floor-intro-topo-label');
    const aiRowEl = document.getElementById('floor-intro-ai-row');
    const viewModeBtn = document.getElementById('floor-intro-view-mode-btn');

    if (viewModeBtn) {
      viewModeBtn.innerHTML = simp ? '🕯️ Lore' : '📐 Math';
      viewModeBtn.className = simp
        ? 'px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono-code font-bold text-emerald-200 active:scale-95 transition shrink-0 pointer-events-auto'
        : 'px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-code font-bold text-amber-200 active:scale-95 transition shrink-0 pointer-events-auto';
    }

    actBadge.textContent = simp ? `ACT ${actDef.roman} • ${actDef.title}` : actDef.badge;
    if (topoLabelEl) {
      topoLabelEl.textContent = simp ? 'ARENA:' : 'BOARD TOPOLOGY:';
    }
    if (aiRowEl) {
      aiRowEl.classList.toggle('hidden', simp);
      aiRowEl.classList.toggle('flex', !simp);
    }

    topoName.innerHTML = `${topo.icon} ${topo.name}`;
    aiStats.textContent = `Lv.${floorData.floor} • Depth ${floorData.depth} (${floorData.aiPrecisionPct}% IQ) • ${floorData.stability}T Stab`;

    if (floorData.isBoss) {
      const arch = floorData.bossArchetype;
      const effInt = typeof getEffectiveBossInterval === 'function' ? getEffectiveBossInterval(arch) : (arch ? arch.interval : 3);
      card.className = 'cavern-panel w-full max-w-sm md:max-w-md lg:max-w-lg rounded-3xl p-6 md:p-7 border-2 border-rose-500/70 text-center space-y-3.5 shadow-[0_0_70px_rgba(244,63,94,0.38)] relative overflow-hidden';
      actBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-[10px] font-mono-code uppercase tracking-[0.16em] text-rose-300 font-bold animate-pulse truncate';
      iconWrap.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/30 to-purple-800/35 border border-rose-400/60 flex items-center justify-center text-4xl shadow-inner mb-2';
      iconWrap.innerHTML = arch ? arch.icon : '💀';
      floorTitle.textContent = simp
        ? `⚠️ ACT ${actDef.roman} BOSS • FLOOR ${floorData.floor}`
        : `⚠️ BOSS FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}`;
      floorTitle.className = 'font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-rose-400';
      bossName.innerHTML = floorData.boss;

      hpRow.classList.remove('hidden');
      hpRow.classList.add('inline-flex');
      if (simp) {
        hpRow.innerHTML = `<span>${'❤️'.repeat(state.bossMaxHp)}</span><span>${state.bossMaxHp} Hearts • Ability Every ${effInt} Turns</span>`;
        const simpleBossRule = (arch && arch.loreRule) ? arch.loreRule : (arch ? arch.fullRule : '');
        ruleDesc.textContent = `⚡ ${simpleBossRule} Connect 4 to shatter each Heart!`;
      } else {
        hpRow.innerHTML = `<span>${'❤️'.repeat(state.bossMaxHp)}</span><span>${state.bossMaxHp} HP PHASES • ${arch ? arch.poolLabel : 'Boss'} • Every ${effInt}T</span>`;
        ruleDesc.textContent = `⚡ ${arch ? arch.fullRule : ''} (${topo.name}: ${topo.desc})`;
      }
    } else if (floorData.isPreBoss) {
      card.className = 'cavern-panel w-full max-w-sm md:max-w-md lg:max-w-lg rounded-3xl p-6 md:p-7 border-2 border-orange-400/60 text-center space-y-3.5 shadow-[0_0_60px_rgba(249,115,22,0.3)] relative overflow-hidden';
      actBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-[10px] font-mono-code uppercase tracking-[0.16em] text-orange-200 font-bold truncate';
      iconWrap.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-700/25 border border-orange-400/50 flex items-center justify-center text-4xl shadow-inner mb-2';
      iconWrap.innerHTML = topo.icon || '⚔️';
      floorTitle.textContent = simp
        ? `⚔️ VANGUARD • FLOOR ${floorData.floor}`
        : `⚔️ VANGUARD FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}`;
      floorTitle.className = 'font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-amber-300';
      bossName.innerHTML = floorData.boss;

      if (simp) {
        hpRow.classList.remove('hidden');
        hpRow.classList.add('inline-flex');
        hpRow.innerHTML = `<span>🧭 Warped Cavern Board • No Boss Ability</span>`;
        ruleDesc.textContent = topo.loreDesc || topo.desc;
      } else {
        hpRow.classList.add('hidden');
        hpRow.classList.remove('inline-flex');
        ruleDesc.textContent = `Warped Pre-Boss Chamber (Negamax D${floorData.depth} • ${floorData.aiPrecisionPct}% Precision): ${topo.desc}`;
      }
    } else {
      card.className = 'cavern-panel w-full max-w-sm md:max-w-md lg:max-w-lg rounded-3xl p-6 md:p-7 border border-amber-400/50 text-center space-y-3.5 shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden';
      actBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono-code uppercase tracking-[0.16em] text-amber-300 font-bold truncate';
      iconWrap.className = 'w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-700/25 border border-amber-400/50 flex items-center justify-center text-4xl shadow-inner mb-2';
      iconWrap.innerHTML = '🛡️';
      const activeVessel = (typeof getActiveLoadout === 'function') ? getActiveLoadout() : null;
      const vesselTag = (activeVessel && floorData.floor === 1) ? ` • ${activeVessel.name.toUpperCase()}` : '';
      floorTitle.textContent = simp
        ? `FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}${vesselTag}`
        : `DESCENDING TO FLOOR ${floorData.floor} OF ${TOTAL_FLOORS}${vesselTag}`;
      floorTitle.className = 'font-mono-code font-bold text-xs uppercase tracking-[0.25em] text-teal-300';
      bossName.innerHTML = floorData.boss;

      if (simp) {
        hpRow.classList.remove('hidden');
        hpRow.classList.add('inline-flex');
        hpRow.innerHTML = `<span>🛡️ Standard Guardian • No Special Ability</span>`;
        ruleDesc.textContent = SENTINEL_SIMPLE_FLAVOR[actIdx] || SENTINEL_SIMPLE_FLAVOR[0];
      } else {
        hpRow.classList.add('hidden');
        hpRow.classList.remove('inline-flex');
        ruleDesc.textContent = `Standard Cavern Sentinel (Negamax D${floorData.depth} • ${floorData.aiPrecisionPct}% Precision • ${floorData.stability}T Stability). Build your Gold economy and claim Enchanted Slots before the Boss chamber!`;
      }
    }

    if ((wasCardVisible || (overlay && overlay.classList.contains('floor-intro-active'))) && card) {
      card.classList.add('floor-card-visible');
    }
  };

  window._refreshActiveFloorIntroCard = renderIntroCalloutContent;
  renderIntroCalloutContent();

  const introModeBtn = document.getElementById('floor-intro-view-mode-btn');
  if (introModeBtn) {
    introModeBtn.onclick = (e) => {
      e.stopPropagation();
      if (typeof toggleSimplifiedViewSetting === 'function') {
        toggleSimplifiedViewSetting();
      } else if (typeof userSettings !== 'undefined' && userSettings) {
        userSettings.simplifiedViewEnabled = !userSettings.simplifiedViewEnabled;
        if (typeof saveUserSettings === 'function') saveUserSettings();
      }
      renderIntroCalloutContent();
    };
  }

  // Reset any inline styles that persistence.js or other modals may have set
  overlay.style.display = '';
  overlay.style.opacity = '';
  overlay.style.pointerEvents = '';
  overlay.classList.remove('hidden', 'floor-intro-fadeout', 'floor-intro-active', 'act-curtain-mode');
  card.classList.remove('hidden', 'floor-card-visible');
  if (actCurtain) {
    actCurtain.classList.add('hidden');
    actCurtain.classList.remove(
      'act-curtain-visible',
      'act-curtain-fadeout',
      'act-theme-1',
      'act-theme-2',
      'act-theme-3',
      'act-theme-4',
      'act-theme-5'
    );
  }

  let finished = false;
  const finishIntroAndResumeBGM = () => {
    if (finished) return;
    finished = true;
    activeFloorIntroTimers.forEach((t) => clearTimeout(t));
    activeFloorIntroTimers = [];
    overlay.onclick = null;

    overlay.classList.remove('floor-intro-active', 'act-curtain-mode');
    overlay.classList.add('floor-intro-fadeout');
    card.classList.remove('floor-card-visible');

    const hideTimer = setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('floor-intro-fadeout');
      if (actCurtain) {
        actCurtain.classList.add('hidden');
        actCurtain.classList.remove('act-curtain-visible', 'act-curtain-fadeout');
      }
      card.classList.remove('hidden');
      if (!state.gameOver && state.turn === PLAYER) {
        state.busy = false;
      }
      bgm.resumeAfterLevelIntro();
      updateHUD();
    }, 560);
    activeFloorIntroTimers.push(hideTimer);
  };

  const revealFloorIntroCard = () => {
    if (finished) return;
    overlay.classList.remove('act-curtain-mode');
    if (actCurtain) {
      actCurtain.classList.add('hidden');
      actCurtain.classList.remove('act-curtain-visible', 'act-curtain-fadeout');
    }
    card.classList.remove('hidden');

    overlay.onclick = (e) => {
      if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('#floor-intro-view-mode-btn')) {
        return;
      }
      sfx.playHoverTick();
      finishIntroAndResumeBGM();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('floor-intro-active');
        card.classList.add('floor-card-visible');
        sfx.playLevelTransitionJingle(state.floorIdx, floorData.isBoss, floorData.isPreBoss);
        triggerHaptic(floorData.isBoss ? [35, 30, 60] : [20, 25]);
      });
    });
  };

  // Show the auto fade-in / fade-out dark Act Title Curtain before the first floor of each Act (Floors 1, 4, 7, 10, 13)
  const isActStartFloor = (state.floorIdx % 3 === 0) && !!actCurtain;
  if (isActStartFloor) {
    if (actOverline) actOverline.textContent = actDef.overline;
    if (actTitle) actTitle.textContent = actDef.title;
    if (actEpigraph) actEpigraph.textContent = actDef.epigraph;

    card.classList.add('hidden');
    overlay.classList.add('act-curtain-mode');
    actCurtain.classList.remove('hidden');
    actCurtain.classList.add(actDef.themeClass);

    let actCurtainFadingOut = false;
    let canSkipActCurtain = false;

    const beginActCurtainFadeOut = () => {
      if (actCurtainFadingOut || finished) return;
      actCurtainFadingOut = true;
      overlay.onclick = null;
      actCurtain.classList.remove('act-curtain-visible');
      actCurtain.classList.add('act-curtain-fadeout');

      const toCardTimer = setTimeout(() => {
        revealFloorIntroCard();
      }, 750);
      activeFloorIntroTimers.push(toCardTimer);
    };

    // 1.0s input guard prevents accidental carry-over taps from skipping the Act title screen
    const guardTimer = setTimeout(() => {
      canSkipActCurtain = true;
    }, 1000);
    activeFloorIntroTimers.push(guardTimer);

    overlay.onclick = () => {
      if (!canSkipActCurtain) return;
      sfx.playHoverTick();
      beginActCurtainFadeOut();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('floor-intro-active');
        actCurtain.classList.add('act-curtain-visible');
        if (typeof sfx.playActCurtainChord === 'function') {
          sfx.playActCurtainChord(actIdx);
        }
        triggerHaptic([25, 40, 25]);
      });
    });

    // 0.75s fade-in + 3.00s full-opacity reading hold = 3.75s before auto fade-out (4.50s total)
    const holdTimer = setTimeout(() => {
      beginActCurtainFadeOut();
    }, 3750);
    activeFloorIntroTimers.push(holdTimer);
  } else {
    revealFloorIntroCard();
  }
}

function runOpeningSplashAndTitleSequence() {
  const overlay = document.getElementById('intro-sequence-overlay');
  const termStage = document.getElementById('terminal-boot-stage');
  const termCard = document.getElementById('terminal-crt-card');
  const termBtn = document.getElementById('terminal-start-app-btn');
  const introFsBtn = document.getElementById('intro-fullscreen-btn');
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
      if (introFsBtn) {
        introFsBtn.style.opacity = '0';
        introFsBtn.style.pointerEvents = 'none';
      }
      setTimeout(() => {
        if (termStage) termStage.classList.add('hidden');
        if (introFsBtn) introFsBtn.classList.add('hidden');
        splashStage.classList.remove('hidden');
        splashStage.classList.add('flex');

        requestAnimationFrame(() => {
          setTimeout(() => {
            splashStage.classList.add('splash-visible');
          }, 60);
        });

        setTimeout(() => {
          logoImg.classList.add('dyagonil-logo-peak');
          ringHalo.classList.add('scale-110', 'border-amber-300/60');
          sfx.playSplashTwinkle();
        }, 1210);

        setTimeout(() => {
          splashStage.classList.remove('splash-visible');
          splashStage.classList.add('splash-fadeout');
        }, 2430);

        setTimeout(() => {
          splashStage.classList.add('hidden');
          if (overlay) overlay.classList.add('title-stage-active');
          syncTitleSavedRunBadge();

          titleStage.classList.remove('hidden');
          titleStage.classList.add('flex');

          // Drop the 4 actual in-game Player tokens into the carved wood & brass slots
          [0, 1, 2, 3].forEach((tokIdx) => {
            setTimeout(() => {
              const tokEl = document.getElementById(`title-tok-${tokIdx}`);
              if (tokEl) {
                tokEl.classList.add('token-landed');
                if (tokEl.parentElement) {
                  tokEl.parentElement.classList.add('slot-token-landed');
                }
              }
              sfx.playTitleTokenDrop(tokIdx);
            }, 160 + tokIdx * 210);
          });

          // Ignite all 4 landed tokens into the in-game 4-in-a-row winGlowMat highlight state
          setTimeout(() => {
            const rackEl = document.getElementById('title-board-rack');
            if (rackEl) rackEl.classList.add('rack-win-active');

            [0, 1, 2, 3].forEach((i) => {
              const t = document.getElementById(`title-tok-${i}`);
              if (t) {
                t.classList.add('token-ignited');
                const slotEl = t.parentElement;
                if (slotEl) {
                  slotEl.classList.add('slot-win-ignited');
                  const wave = document.createElement('div');
                  wave.className = 'title-win-shockwave-ring';
                  slotEl.appendChild(wave);
                  setTimeout(() => wave.remove(), 680);
                }
              }
            });
            document.getElementById('title-Main-Header').classList.add('slam-in');
            sfx.playTitleConnectFanfare();
            triggerHaptic([25, 30, 45]);
          }, 1080);

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

  if (introFsBtn) {
    introFsBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    introFsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.init();
      sfx.playHoverTick();
      triggerHaptic(15);
      if (typeof toggleFullScreenCavernMode === 'function') {
        toggleFullScreenCavernMode();
      }
    });
  }

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


function returnToTitleScreen() {
  // 1. Save mid-run checkpoint if currently in a saveable run
  if (
    typeof runPersistence !== 'undefined' &&
    runPersistence &&
    typeof runPersistence.saveRun === 'function' &&
    !(typeof window !== 'undefined' && window.tutorialActive)
  ) {
    try { runPersistence.saveRun(); } catch (_) {}
  }

  // 2. Clear any floor intro timers & close open gameplay modals
  if (typeof clearFloorIntroAndModalLocks === 'function') {
    clearFloorIntroAndModalLocks();
  }
  if (typeof dismissAllActiveNotifications === 'function') {
    dismissAllActiveNotifications();
  }

  const modalsToHide = [
    'settings-modal',
    'bazaar-modal',
    'boss-chest-modal',
    'roulette-modal',
    'difficulty-modal',
    'info-sheet-modal',
    'gameover-modal',
    'debug-menu-modal',
    'tutorial-overlay'
  ];
  modalsToHide.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // 3. Ensure Stage 0 (Terminal) & Stage 1 (Splash) are hidden, and Stage 2 (Title Screen) is ready
  const termStage = document.getElementById('terminal-boot-stage');
  const splashStage = document.getElementById('dyagonil-splash-stage');
  const titleStage = document.getElementById('title-opener-stage');
  const introOverlay = document.getElementById('intro-sequence-overlay');

  if (termStage) {
    termStage.classList.add('hidden');
    termStage.classList.remove('flex');
  }
  const introFsBtn = document.getElementById('intro-fullscreen-btn');
  if (introFsBtn) {
    introFsBtn.classList.add('hidden');
  }
  if (splashStage) {
    splashStage.classList.add('hidden');
    splashStage.classList.remove('flex', 'splash-visible', 'splash-fadeout');
  }

  if (titleStage) {
    titleStage.style.display = '';
    titleStage.style.opacity = '1';
    titleStage.style.pointerEvents = 'auto';
    titleStage.classList.remove('hidden');
    titleStage.classList.add('flex');
  }

  const rackEl = document.getElementById('title-board-rack');
  if (rackEl) rackEl.classList.add('rack-win-active');

  [0, 1, 2, 3].forEach((i) => {
    const tokEl = document.getElementById(`title-tok-${i}`);
    if (tokEl) {
      tokEl.classList.add('token-landed', 'token-ignited');
      if (tokEl.parentElement) {
        tokEl.parentElement.classList.add('slot-token-landed', 'slot-win-ignited');
      }
    }
  });
  ['title-Main-Header', 'title-Sub-Desc', 'title-Start-Wrap'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('slam-in');
  });

  syncTitleSavedRunBadge();

  if (typeof enableTitleTokensSecretInteraction === 'function') {
    enableTitleTokensSecretInteraction();
  }

  // 4. Reveal #intro-sequence-overlay smoothly & set BGM to cavern theme
  if (introOverlay) {
    introOverlay.style.display = '';
    introOverlay.classList.add('title-stage-active');
    introOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      introOverlay.style.opacity = '1';
      introOverlay.style.pointerEvents = 'auto';
    });
  }

  if (typeof bgm !== 'undefined' && bgm) {
    bgm.isPausedForLevelIntro = false;
    bgm.isPausedForModal = false;
    if (typeof bgm.setMode === 'function') bgm.setMode('cavern');
    if (typeof bgm.resumeFromSettings === 'function') bgm.resumeFromSettings();
  }
}


// Generates the exact procedural carved-wood token texture from scene3d.js (generateCarvedWoodTexture + playerMat)
(function hydrateTitleInGameTokenTexture() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < 128; y++) {
      const sy = y * 4;
      const wave = Math.sin(sy * 0.04) * 16;
      const v = Math.floor(30 + Math.sin(sy * 0.11 + wave * 0.25) * 14);
      // Combine scene3d.js woodTex (v+22, v*0.68, v*0.42) with playerMat (color 0xfbbf24 + emissive 0xd97706 * 0.52)
      const r = Math.min(255, Math.round(124 + (v + 22) * 1.48));
      const g = Math.min(255, Math.round(64 + (v * 0.68) * 1.38));
      const b = Math.min(255, Math.round(6 + (v * 0.42) * 0.55));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, y, 128, 1);
    }

    // Subtle planar top-left amber lantern shading across the flat cylinder cap
    const grad = ctx.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
    grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.04)');
    grad.addColorStop(1, 'rgba(69, 26, 3, 0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const uri = canvas.toDataURL('image/png');
    document.documentElement.style.setProperty('--c4-token-wood-uri', `url("${uri}")`);
  } catch (_) {}
})();
