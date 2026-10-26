// ============================================================================
// WHEEL OF SUBTERRANEAN FATE (2D PHYSICS ROULETTE SIMULATOR) (js/engine/rouletteSim.js)
// ============================================================================

function getRouletteSpinCost() {
    return state.rouletteSpinsThisFloor === 0 ? 0 : state.rouletteSpinsThisFloor * 5;
}

function updateRouletteButtonsUI() {
    const cost = getRouletteSpinCost();
    const openBtn = document.getElementById('open-roulette-btn');
    const chargeBtn = document.getElementById('charge-spin-btn');
    const goldDisp = document.getElementById('roulette-gold-display');
    if (goldDisp) goldDisp.textContent = `$${state.gold}`;
    if (openBtn) {
        openBtn.textContent = cost === 0 ? 'Spin Free!' : `Spin ($${cost})`;
    }
    if (chargeBtn) {
        chargeBtn.textContent = cost === 0
            ? 'Hold to Charge & Spin (FREE)'
            : `Hold to Charge & Spin ($${cost})`;
    }
}

// ============================================================================
// 10B. PHYSICS-BASED ROULETTE WHEEL SIMULATOR ("WHEEL OF SUBTERRANEAN FATE")
// ============================================================================
class SubterraneanRouletteSimulator {
    constructor() {
        this.canvas = document.getElementById('roulette-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.wedges = ROULETTE_WEDGES;
        this.numWedges = this.wedges.length;
        this.arc = (Math.PI * 2) / this.numWedges;

        // Physics state
        this.wheelAngle = 0;
        this.wheelOmega = 0.008; // Gentle idle rotation
        this.isSpinning = false;
        this.isCharging = false;
        this.chargePower = 0;
        this.chargeDir = 1;

        // Ball physics state (polar coordinates relative to wheel center)
        this.ballPhase = 'IDLE'; // 'IDLE' | 'RIM_ORBIT' | 'DROP_DEFLECT' | 'POCKET_BOUNCE' | 'SETTLED'
        this.ballAngle = 0;
        this.ballOmega = 0;
        this.ballRadius = 128;
        this.ballRadialVel = 0;
        this.settledWedgeIndex = 0;
        this.lastFretIndex = -1;
        this.lastDeflectorHitTime = 0;

        // 8 brass canoe-shaped deflectors on the outer bowl track
        this.deflectorAngles = [];
        for (let i = 0; i < 8; i++) {
            this.deflectorAngles.push((i / 8) * Math.PI * 2);
        }

        // Visual particle sparks when ball strikes brass frets
        this.sparks = [];

        this.populateLegend();
        this.bindEvents();
    }

    populateLegend() {
        const grid = document.getElementById('roulette-legend-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.wedges.forEach(w => {
            const pill = document.createElement('div');
            pill.className = `px-1.5 py-1 rounded-lg border flex items-center gap-1 truncate ${
                w.isCurse
                    ? 'bg-rose-950/50 border-rose-500/30 text-rose-200'
                    : 'bg-stone-900/80 border-amber-500/25 text-amber-100'
            }`;
            pill.innerHTML = `<span>${w.icon}</span><span class="truncate font-medium">${w.shortLabel}</span>`;
            grid.appendChild(pill);
        });
    }

    bindEvents() {
        const chargeBtn = document.getElementById('charge-spin-btn');

        const startCharge = (e) => {
            if (e) e.preventDefault();
            if (this.isSpinning) return;
            const cost = getRouletteSpinCost();
            if (state.gold < cost) {
                showToast(`Need $${cost} Gold for an extra spin!`, "🪙");
                return;
            }
            this.isCharging = true;
            this.chargePower = 0.15;
            this.chargeDir = 1;
            sfx.playHoverTick();
        };

        const releaseCharge = (e) => {
            if (e) e.preventDefault();
            if (!this.isCharging) return;
            this.isCharging = false;
            this.launchSpin(this.chargePower);
        };

        chargeBtn.addEventListener('pointerdown', startCharge);
        window.addEventListener('pointerup', releaseCharge);

        // Allow direct swipe/drag on the roulette wheel canvas to launch
        let dragStartAngle = null;
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.isSpinning) return;
            const rect = this.canvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            dragStartAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            startCharge(e);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isCharging || dragStartAngle === null) return;
            const rect = this.canvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const curAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
            const delta = Math.abs(curAngle - dragStartAngle);
            this.chargePower = Math.min(1.0, Math.max(0.25, delta / 1.8));
        });
    }

    launchSpin(power) {
        const cost = getRouletteSpinCost();
        if (state.gold < cost) return;
        if (cost > 0) {
            state.gold -= cost;
            sfx.playCoinDing();
        }
        state.rouletteSpinsThisFloor++;
        updateRouletteButtonsUI();
        renderBazaarStock();
        updateHUD();

        const p = Math.max(0.25, Math.min(1.0, power));
        this.isSpinning = true;
        this.ballPhase = 'RIM_ORBIT';

        // Rotor spins clockwise; silver ball is hurled counter-clockwise along the upper wooden rim
        this.wheelOmega = (0.045 + p * 0.045 + Math.random() * 0.015);
        this.ballAngle = Math.random() * Math.PI * 2;
        this.ballOmega = -(0.22 + p * 0.16 + Math.random() * 0.04);
        this.ballRadius = 136;
        this.ballRadialVel = 0;
        this.lastFretIndex = -1;

        triggerHaptic([25, 40, 20]);
        document.getElementById('roulette-result-title').textContent = "Ball in Orbit...";
        document.getElementById('roulette-result-desc').textContent =
            "Watch the silver ball lose centripetal momentum, strike the brass deflectors, and bounce into a pocket!";
    }

    spawnSparks(x, y, color = '#fde047', count = 7) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1.2 + Math.random() * 2.8;
            this.sparks.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                life: 1.0,
                color
            });
        }
    }

    getWedgeIndexAtAngle(worldAngle) {
        let rel = (worldAngle - this.wheelAngle) % (Math.PI * 2);
        if (rel < 0) rel += Math.PI * 2;
        return Math.floor(rel / this.arc) % this.numWedges;
    }

    updatePhysics() {
        if (this.isCharging) {
            this.chargePower += 0.022 * this.chargeDir;
            if (this.chargePower >= 1.0) { this.chargePower = 1.0; this.chargeDir = -1; }
            if (this.chargePower <= 0.15) { this.chargePower = 0.15; this.chargeDir = 1; }
            const pct = Math.round(this.chargePower * 100);
            document.getElementById('roulette-power-bar').style.width = `${pct}%`;
            document.getElementById('roulette-power-label').textContent = `${pct}%`;
        }

        // Advance wheel rotor angle
        this.wheelAngle = (this.wheelAngle + this.wheelOmega) % (Math.PI * 2);

        if (!this.isSpinning) {
            // Gently idle-spin the rotor and keep the ball resting in its settled pocket
            this.wheelOmega = 0.006;
            if (this.ballPhase === 'SETTLED') {
                this.ballAngle = this.wheelAngle + (this.settledWedgeIndex + 0.5) * this.arc;
                this.ballRadius = 86;
            }
            return;
        }

        // Rotor friction decay
        this.wheelOmega *= 0.996;
        if (this.wheelOmega < 0.006) this.wheelOmega = 0.006;

        // Ball angular progression
        this.ballAngle += this.ballOmega;

        const speed = Math.abs(this.ballOmega);
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // PHASE 1: High-Speed Rim Orbit
        if (this.ballPhase === 'RIM_ORBIT') {
            this.ballOmega *= 0.989;
            // Subtle wooden track rumble tick
            if (Math.random() < speed * 1.4) {
                sfx.playRouletteTick(speed * 1.2);
            }
            // Once centripetal velocity drops below threshold, gravity pulls ball down the sloped apron
            if (speed < 0.115) {
                this.ballPhase = 'DROP_DEFLECT';
                this.ballRadialVel = -0.55;
            }
        }
        // PHASE 2: Sloped Apron Drop & Brass Diamond Deflector Collisions
        else if (this.ballPhase === 'DROP_DEFLECT') {
            this.ballOmega *= 0.985;
            this.ballRadialVel -= 0.048; // Inward gravitational slope pull
            this.ballRadius += this.ballRadialVel;

            // Check collisions with the 8 stationary brass diamond deflectors at radius ~114
            if (this.ballRadius > 107 && this.ballRadius < 121) {
                let normBall = ((this.ballAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                for (let i = 0; i < this.deflectorAngles.length; i++) {
                    const da = this.deflectorAngles[i];
                    const diff = Math.abs(Math.atan2(Math.sin(normBall - da), Math.cos(normBall - da)));
                    const now = performance.now();
                    if (diff < 0.11 && now - this.lastDeflectorHitTime > 90) {
                        this.lastDeflectorHitTime = now;
                        // Chaotic deflection off brass diamond!
                        this.ballRadialVel = 0.65 + Math.random() * 0.5;
                        this.ballOmega = -this.ballOmega * (0.55 + Math.random() * 0.35) + (Math.random() - 0.5) * 0.08;
                        const bx = cx + Math.cos(this.ballAngle) * this.ballRadius;
                        const by = cy + Math.sin(this.ballAngle) * this.ballRadius;
                        this.spawnSparks(bx, by, '#fbbf24', 9);
                        sfx.playFretPing();
                        triggerHaptic(18);
                        break;
                    }
                }
            }

            // Enter the spinning pocket ring (radius <= 96)
            if (this.ballRadius <= 96) {
                this.ballRadius = 96;
                this.ballPhase = 'POCKET_BOUNCE';
                this.ballRadialVel = Math.abs(this.ballRadialVel) * 0.45;
                sfx.playRouletteTick(0.9);
                triggerHaptic(25);
            }
        }
        // PHASE 3: Pocket Fret Bounces & Angular Synchronization with Spinning Rotor
        else if (this.ballPhase === 'POCKET_BOUNCE') {
            // Relative angular velocity between ball and spinning rotor
            let relOmega = this.ballOmega - this.wheelOmega;
            relOmega *= 0.945; // Pocket turret friction
            this.ballOmega = this.wheelOmega + relOmega;

            // Radial bounce between outer pocket wall (96) and inner pocket seat (85)
            this.ballRadialVel -= 0.09;
            this.ballRadius += this.ballRadialVel;
            if (this.ballRadius < 85) {
                this.ballRadius = 85;
                if (Math.abs(this.ballRadialVel) > 0.25) {
                    this.ballRadialVel = -this.ballRadialVel * 0.48;
                } else {
                    this.ballRadialVel = 0;
                }
            } else if (this.ballRadius > 98) {
                this.ballRadius = 98;
                this.ballRadialVel = -Math.abs(this.ballRadialVel) * 0.5;
            }

            // Detect crossing brass fret dividers between pockets
            const curWedge = this.getWedgeIndexAtAngle(this.ballAngle);
            if (this.lastFretIndex !== -1 && curWedge !== this.lastFretIndex) {
                const relSpd = Math.abs(relOmega);
                sfx.playRouletteTick(Math.min(1, relSpd * 8));
                triggerHaptic(12);

                // Update live center badge as ball hops across pockets
                const w = this.wedges[curWedge];
                document.getElementById('roulette-center-icon').textContent = w.icon;
                document.getElementById('roulette-center-label').textContent = w.name;

                // Small physical kick from hitting a brass fret divider
                if (relSpd > 0.018 && Math.random() < 0.45) {
                    this.ballRadialVel = Math.max(this.ballRadialVel, 0.45);
                    const bx = cx + Math.cos(this.ballAngle) * this.ballRadius;
                    const by = cy + Math.sin(this.ballAngle) * this.ballRadius;
                    this.spawnSparks(bx, by, '#fde047', 4);
                }
            }
            this.lastFretIndex = curWedge;

            // Gently pull ball toward the center of the current pocket as relative velocity vanishes
            let relAngle = ((this.ballAngle - this.wheelAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const targetPocketCenter = (curWedge + 0.5) * this.arc;
            const angleErr = targetPocketCenter - relAngle;
            this.ballOmega += angleErr * 0.012;

            // Settle condition
            if (Math.abs(relOmega) < 0.0022 && Math.abs(angleErr) < 0.08 && Math.abs(this.ballRadialVel) < 0.08) {
                this.ballPhase = 'SETTLED';
                this.isSpinning = false;
                this.settledWedgeIndex = curWedge;
                document.getElementById('roulette-power-bar').style.width = '0%';
                document.getElementById('roulette-power-label').textContent = '0%';
                this.onWedgeResolved(this.wedges[curWedge]);
            }
        }
    }

    onWedgeResolved(wedge) {
        document.getElementById('roulette-center-icon').textContent = wedge.icon;
        document.getElementById('roulette-center-label').textContent = wedge.name;

        const box = document.getElementById('roulette-result-box');
        const titleEl = document.getElementById('roulette-result-title');
        const descEl = document.getElementById('roulette-result-desc');

        titleEl.textContent = `${wedge.icon} ${wedge.name}`;
        descEl.textContent = wedge.desc;

        if (wedge.isCurse) {
            box.className = "w-full px-3 py-2.5 rounded-2xl bg-rose-950/70 border border-rose-500/60 text-center space-y-0.5";
            titleEl.className = "font-display font-bold text-xs text-rose-300";
            sfx.playCurseBuzzer();
            triggerHaptic([60, 50, 90]);
        } else {
            box.className = "w-full px-3 py-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 text-center space-y-0.5";
            titleEl.className = "font-display font-bold text-xs text-amber-300";
            sfx.playResultChime(true);
            triggerHaptic([30, 40, 60]);
        }

        // Apply Outcome to Run State
        switch (wedge.id) {
            case 'jackpot_hoard':
                state.gold += 15;
                state.reservePouch.push('wild');
                showToast("👑 JACKPOT! +$15 Gold & +1 Wild Prismatic Token!", "👑");
                break;

            case 'relic_vault': {
                const unowned = Object.keys(GAMBIT_CATALOG).filter(id => !state.gambits.includes(id));
                if (unowned.length > 0 && state.gambits.length < state.maxGambitSlots) {
                    const gId = unowned[Math.floor(Math.random() * unowned.length)];
                    state.gambits.push(gId);
                    showToast(`🏺 Relic Vault unlocked ${GAMBIT_CATALOG[gId].name}!`, GAMBIT_CATALOG[gId].icon);
                } else {
                    state.gold += 10;
                    showToast("🏺 Relic slots full—awarded +$10 Gold!", "🪙");
                }
                break;
            }

            case 'arcane_surge':
                state.nextFloorModifiers.bonusMana += 1;
                state.reservePouch.push('jalapeno_bomb');
                showToast("⚡ Arcane Surge! +1 Starting Mana next floor & +1 Jalapeño Bomb!", "🌶️");
                break;

            case 'gilded_blessing':
                state.nextFloorModifiers.bonusEnchantSlots += 3;
                showToast("✨ Gilded Blessing! +3 Enchanted Board Slots next floor!", "✨");
                break;

            case 'tectonic_reinforce':
                state.nextFloorModifiers.bonusStability += 4;
                showToast("🛡️ Tectonic Shield! +4 Seismic Stability next floor!", "🌋");
                break;

            case 'pickpocket_gremlin': {
                const lost = Math.ceil(state.gold * 0.5);
                state.gold = Math.max(0, state.gold - lost);
                showToast(`👺 Pickpocket Gremlin stole $${lost} Gold!`, "👺");
                break;
            }

            case 'cave_in_hazard':
                state.nextFloorModifiers.caveInStones += 3;
                state.nextFloorModifiers.bonusStability -= 2;
                showToast("☄️ Cave-In Hazard! 3 Stones & -2 Stability next floor!", "🪨");
                break;

            case 'hex_of_abyss': {
                state.nextFloorModifiers.bonusMana -= 1;
                addCardToStockpile('dead_weight');
                const totalCurses = state.masterDeck.filter(id => id === 'dead_weight').length;
                showToast(
                    `💀 Hex of the Abyss! Added Dead Weight Stone (${totalCurses} in deck) & -1 Mana next floor!`,
                    "💀"
                );
                break;
            }

            case 'ai_headstart':
                state.nextFloorModifiers.aiHeadstartTokens += 2;
                showToast("🤖 AI Headstart! Boss drops 2 tokens on Turn 1 next floor!", "🤖");
                break;
        }

        document.getElementById('roulette-bazaar-summary').innerHTML =
            `Last Spin: <strong class="${wedge.isCurse ? 'text-rose-300' : 'text-amber-300'}">${wedge.icon} ${wedge.name}</strong>`;

        updateRouletteButtonsUI();
        renderBazaarStock();
        updateHUD();
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // 1. Outer Carved Mahogany/Obsidian Bowl Rim
        const outerGrad = ctx.createRadialGradient(cx, cy, 118, cx, cy, 158);
        outerGrad.addColorStop(0, '#1c1412');
        outerGrad.addColorStop(0.55, '#432012');
        outerGrad.addColorStop(0.88, '#29130b');
        outerGrad.addColorStop(1, '#120d0e');
        ctx.beginPath();
        ctx.arc(cx, cy, 156, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#b45309';
        ctx.stroke();

        // Ball Track Groove Ring
        ctx.beginPath();
        ctx.arc(cx, cy, 136, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.16)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // 2. Stationary Brass Diamond Deflectors on Sloped Apron (Radius 114)
        this.deflectorAngles.forEach(a => {
            ctx.save();
            ctx.translate(cx + Math.cos(a) * 114, cy + Math.sin(a) * 114);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, 0);
            ctx.lineTo(0, 6);
            ctx.lineTo(-4, 0);
            ctx.closePath();
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        });

        // 3. Spinning Inner Rotor (Pockets, Fret Dividers, Icons)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelAngle);

        for (let i = 0; i < this.numWedges; i++) {
            const wedge = this.wedges[i];
            const a0 = i * this.arc;
            const a1 = a0 + this.arc;

            // Wedge Sector Fill
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 102, a0, a1);
            ctx.closePath();
            ctx.fillStyle = wedge.color;
            ctx.fill();

            // Highlight Settled Wedge
            if (this.ballPhase === 'SETTLED' && this.settledWedgeIndex === i && !this.isSpinning) {
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Pocket Seat Box (Radius 74 to 98)
            ctx.beginPath();
            ctx.arc(0, 0, 96, a0 + 0.04, a1 - 0.04);
            ctx.arc(0, 0, 74, a1 - 0.04, a0 + 0.04, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
            ctx.fill();
            ctx.strokeStyle = wedge.accent;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Brass Fret Divider Pin between pockets
            ctx.beginPath();
            ctx.moveTo(Math.cos(a0) * 48, Math.sin(a0) * 48);
            ctx.lineTo(Math.cos(a0) * 102, Math.sin(a0) * 102);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Fret Pinhead Stud
            ctx.beginPath();
            ctx.arc(Math.cos(a0) * 98, Math.sin(a0) * 98, 2.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fef08a';
            ctx.fill();

            // Wedge Icon & Short Label
            const mid = a0 + this.arc / 2;
            ctx.save();
            ctx.translate(Math.cos(mid) * 63, Math.sin(mid) * 63);
            ctx.rotate(mid + Math.PI / 2);
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(wedge.icon, 0, -3);
            ctx.restore();
        }

        // Rotor Outer Brass Ring
        ctx.beginPath();
        ctx.arc(0, 0, 102, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();

        // 4. Render Sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const sp = this.sparks[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.life -= 0.06;
            if (sp.life <= 0) {
                this.sparks.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 2.2 * sp.life, 0, Math.PI * 2);
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.life;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // 5. Render the Physics Silver/Ivory Roulette Ball
        const bx = cx + Math.cos(this.ballAngle) * this.ballRadius;
        const by = cy + Math.sin(this.ballAngle) * this.ballRadius;

        // Ball Drop Shadow
        ctx.beginPath();
        ctx.arc(bx + 2, by + 3, 7.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        // 3D Metallic Ivory Sphere Shader
        const ballGrad = ctx.createRadialGradient(bx - 2.5, by - 2.5, 1, bx, by, 7.5);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.55, '#e2e8f0');
        ballGrad.addColorStop(1, '#64748b');
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();
    }
}

const rouletteSim = new SubterraneanRouletteSimulator();

document.getElementById('open-roulette-btn').addEventListener('click', () => {
    updateRouletteButtonsUI();
    document.getElementById('roulette-modal').classList.remove('hidden');
});

document.getElementById('close-roulette-btn').addEventListener('click', () => {
    if (rouletteSim.isSpinning) {
        showToast("Wait for the silver ball to settle into a pocket!", "🎡");
        return;
    }
    document.getElementById('roulette-modal').classList.add('hidden');
});

document.getElementById('done-roulette-btn').addEventListener('click', () => {
    if (rouletteSim.isSpinning) {
        showToast("Wait for the silver ball to settle into a pocket!", "🎡");
        return;
    }
    document.getElementById('roulette-modal').classList.add('hidden');
});
