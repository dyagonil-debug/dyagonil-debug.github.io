// ============================================================================
// TOASTS, FLOATING BONUS PILLS & 3D-PROJECTED SLOT CALLOUTS (js/ui/notifications.js)
// ============================================================================

function showToast(msg, icon = '✨', durationMs = 4200, highlightClass = 'border-amber-400/50 text-amber-100') {
    const area = document.getElementById('toast-area');
    if (!area) return;
    const effectiveDuration = getConfiguredHoldDuration(durationMs);

    // Keep max 3 active toasts so they remain legible without cluttering the screen
    while (area.children.length >= 3) {
        area.removeChild(area.firstChild);
    }
    const el = document.createElement('div');
    el.className = `cavern-panel toast-fade-transition pointer-events-auto cursor-pointer relative overflow-hidden px-3.5 py-2.5 rounded-2xl border ${highlightClass} text-xs font-medium flex items-center gap-2.5 shadow-2xl w-full`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0) scale(1)';
    el.innerHTML = `
        <span class="text-base shrink-0">${icon}</span>
        <span class="leading-snug flex-1">${msg}</span>
        <button type="button" class="toast-close-btn px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono-code text-slate-300 shrink-0 active:scale-90" title="Dismiss early">✕</button>
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div class="toast-timer-bar h-full bg-amber-400/85" style="width: 100%; transition: width ${effectiveDuration}ms linear;"></div>
        </div>
    `;
    area.appendChild(el);

    let dismissed = false;
    const dismissToastNow = (e) => {
        if (e) e.stopPropagation();
        if (dismissed) return;
        dismissed = true;
        el.classList.add('toast-quick-dismiss');
        setTimeout(() => el.remove(), 190);
    };

    el.addEventListener('click', dismissToastNow);

    const timerBar = el.querySelector('.toast-timer-bar');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (timerBar) timerBar.style.width = '0%';
        });
    });

    setTimeout(() => {
        if (dismissed) return;
        dismissed = true;
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px) scale(0.96)';
        setTimeout(() => el.remove(), 960);
    }, effectiveDuration);
}

function spawnFloatingPop(text, colorClass = 'text-amber-300', durationMs = 4400) {
    if (!userSettings.floatingPopsEnabled) return;
    const effectiveDuration = getConfiguredHoldDuration(durationMs);
    const pop = document.createElement('div');
    pop.className = `floating-pop px-3 py-1 rounded-full bg-stone-950/90 border border-white/15 font-display font-bold text-xs sm:text-sm ${colorClass} shadow-[0_6px_20px_rgba(0,0,0,0.85)]`;
    pop.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
    pop.style.top = '45%';
    pop.style.animationDuration = `${effectiveDuration}ms`;
    pop.textContent = text;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), effectiveDuration + 100);
}

function updateDismissAllCalloutsButton() {
    const btn = document.getElementById('dismiss-all-callouts-btn');
    if (!btn) return;
    const activeCallouts = document.querySelectorAll('.slot-bonus-callout:not(.slot-callout-quick-dismiss)');
    const activeToasts = document.querySelectorAll('#toast-area > div:not(.toast-quick-dismiss)');
    if (activeCallouts.length + activeToasts.length >= 2) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

function dismissAllActiveNotifications() {
    document.querySelectorAll('.slot-bonus-callout').forEach(el => {
        el.classList.add('slot-callout-quick-dismiss');
        setTimeout(() => el.remove(), 190);
    });
    document.querySelectorAll('#toast-area > div').forEach(el => {
        el.classList.add('toast-quick-dismiss');
        setTimeout(() => el.remove(), 190);
    });
    updateDismissAllCalloutsButton();
}

function spawnSlotBonusCallout(r, c, icon, title, subtitle, borderColorClass = 'border-amber-400', badgeBgClass = 'bg-amber-400 text-stone-950', holdMs = 4800) {
    // Respect the player's Enchanted Slot Pop-Out Callouts setting
    if (!userSettings.slotCalloutsEnabled) return;

    const effectiveHoldMs = getConfiguredHoldDuration(holdMs);

    // Project 3D cell coordinate (r, c) into 2D screen coordinates
    const cellVec = new THREE.Vector3(
        START_X + c * CELL_SPACING,
        START_Y + r * CELL_SPACING,
        0.45
    );
    cellVec.project(camera);
    const rawX = (cellVec.x * 0.5 + 0.5) * window.innerWidth;
    const rawY = (-(cellVec.y * 0.5) + 0.5) * window.innerHeight;

    // Clamp within mobile screen bounds so the callout card is never clipped at the edges
    const clampedX = Math.max(140, Math.min(window.innerWidth - 140, rawX));
    const clampedY = Math.max(145, Math.min(window.innerHeight - 215, rawY - 38));

    const callout = document.createElement('div');
    callout.className = `slot-bonus-callout cavern-panel rounded-2xl px-3.5 py-2.5 border-2 ${borderColorClass} shadow-[0_12px_36px_rgba(0,0,0,0.9)] w-68 max-w-[88vw] overflow-hidden select-none`;
    callout.style.left = `${clampedX}px`;
    callout.style.top = `${clampedY}px`;
    callout.style.opacity = '1';

    callout.innerHTML = `
        <div class="flex items-start gap-2.5">
            <div class="w-8 h-8 rounded-xl ${badgeBgClass} flex items-center justify-center text-lg shrink-0 shadow-md">
                ${icon}
            </div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                    <span class="text-[9px] font-mono-code uppercase tracking-widest text-amber-300 font-bold">
                        Slot Bonus Acquired
                    </span>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" class="callout-settings-btn px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-mono-code text-slate-300 active:scale-90" title="Notification Settings">
                            ⚙️
                        </button>
                        <button type="button" class="callout-close-btn px-1.5 py-0.5 rounded bg-white/15 hover:bg-rose-500/40 text-[10px] font-mono-code font-bold text-white active:scale-90" title="Dismiss early">
                            ✕
                        </button>
                    </div>
                </div>
                <div class="font-display font-bold text-xs text-white leading-tight mt-0.5">
                    ${title}
                </div>
                <div class="text-[11px] text-slate-200 leading-snug mt-0.5">
                    ${subtitle}
                </div>
                <div class="text-[9px] font-mono-code text-amber-300/75 mt-1 flex items-center justify-between">
                    <span>Tap card to dismiss</span>
                    <button type="button" class="callout-mute-link underline text-slate-400 hover:text-rose-300">Hide pop-outs</button>
                </div>
            </div>
        </div>
        <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div class="slot-callout-bar h-full ${badgeBgClass}" style="width: 100%; transition: width ${effectiveHoldMs}ms linear;"></div>
        </div>
    `;

    document.body.appendChild(callout);
    updateDismissAllCalloutsButton();

    let dismissed = false;
    const dismissEarly = (e) => {
        if (e) e.stopPropagation();
        if (dismissed) return;
        dismissed = true;
        sfx.playHoverTick();
        callout.classList.add('slot-callout-quick-dismiss');
        setTimeout(() => {
            callout.remove();
            updateDismissAllCalloutsButton();
        }, 190);
    };

    // Tapping anywhere on the callout card or the [✕] button immediately dismisses it
    callout.addEventListener('click', dismissEarly);
    const closeBtn = callout.querySelector('.callout-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', dismissEarly);

    // Quick [⚙️] button opens Settings Modal directly
    const settingsShortcut = callout.querySelector('.callout-settings-btn');
    if (settingsShortcut) {
        settingsShortcut.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissEarly();
            openSettingsModal();
        });
    }

    // Quick "Hide pop-outs" link disables future Enchanted Slot pop-outs immediately
    const muteLink = callout.querySelector('.callout-mute-link');
    if (muteLink) {
        muteLink.addEventListener('click', (e) => {
            e.stopPropagation();
            userSettings.slotCalloutsEnabled = false;
            saveUserSettings();
            dismissAllActiveNotifications();
            showToast("Enchanted Slot Pop-Outs turned OFF (Re-enable anytime in ⚙️ Settings)", "⚙️", 3200);
        });
    }

    const bar = callout.querySelector('.slot-callout-bar');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (bar) bar.style.width = '0%';
        });
    });

    // Hold for configured duration, then slowly fade out over 1.2 seconds
    setTimeout(() => {
        if (dismissed) return;
        dismissed = true;
        callout.style.opacity = '0';
        callout.style.transform = 'translate(-50%, -68%) scale(0.95)';
        setTimeout(() => {
            callout.remove();
            updateDismissAllCalloutsButton();
        }, 1250);
    }, effectiveHoldMs);
}
