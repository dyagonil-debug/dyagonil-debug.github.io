// ============================================================================
// 3D SUBTERRANEAN VFX & CHOREOGRAPHY ENGINE (js/graphics/vfx3d.js)
// ============================================================================

// ============================================================================
// 4B. 3D SUBTERRANEAN VFX & CHOREOGRAPHY ENGINE (Arcane Cards, Reserve Tokens & Gambits)
// ============================================================================
const vfxGroup = new THREE.Group();
boardGroup.add(vfxGroup);
const activeVFX = [];
const boardShakeState = { intensity: 0, decay: 0.88 };

function triggerBoardShake(amount = 0.22) {
    boardShakeState.intensity = Math.max(boardShakeState.intensity, amount);
}

function getCellWorldPos(r, c, zOffset = 0.42) {
    return new THREE.Vector3(
        START_X + c * CELL_SPACING,
        START_Y + r * CELL_SPACING,
        zOffset
    );
}

function addTimedVFX(mesh, durationMs, onUpdate) {
    vfxGroup.add(mesh);
    activeVFX.push({
        mesh,
        startTime: performance.now(),
        duration: durationMs,
        onUpdate
    });
}

// Helper: 3D Particle Burst at (r, c)
function spawn3DParticleBurst(r, c, colorHex = 0xfbbf24, count = 16, speed = 0.11, durationMs = 520, shape = 'box') {
    const group = new THREE.Group();
    const origin = getCellWorldPos(r, c, 0.45);
    group.position.copy(origin);

    const geo = shape === 'octa'
        ? new THREE.OctahedronGeometry(0.13, 0)
        : (shape === 'cone'
            ? new THREE.ConeGeometry(0.09, 0.24, 5)
            : new THREE.BoxGeometry(0.13, 0.13, 0.13));

    const particles = [];
    for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const p = new THREE.Mesh(geo, mat);
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const spd = speed * (0.55 + Math.random() * 0.85);
        p.userData = {
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd + 0.035,
            vz: (Math.random() - 0.5) * spd * 0.8,
            rx: (Math.random() - 0.5) * 0.25,
            ry: (Math.random() - 0.5) * 0.25
        };
        group.add(p);
        particles.push(p);
    }

    addTimedVFX(group, durationMs, (p) => {
        particles.forEach(pt => {
            pt.position.x += pt.userData.vx;
            pt.position.y += pt.userData.vy;
            pt.position.z += pt.userData.vz;
            pt.userData.vy -= 0.0045; // gravity
            pt.rotation.x += pt.userData.rx;
            pt.rotation.y += pt.userData.ry;
            pt.scale.setScalar(Math.max(0.01, 1 - p));
            pt.material.opacity = 1 - p;
        });
    });
}

// Helper: 3D Expanding Shockwave Ring at (r, c)
function spawn3DShockwaveRing(r, c, colorHex = 0xf59e0b, maxScale = 2.6, durationMs = 460) {
    const ringGeoVfx = new THREE.TorusGeometry(0.32, 0.055, 10, 28);
    const ringMatVfx = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeoVfx, ringMatVfx);
    ring.position.copy(getCellWorldPos(r, c, 0.46));

    addTimedVFX(ring, durationMs, (p) => {
        const ease = 1 - Math.pow(1 - p, 3);
        const s = 0.5 + ease * (maxScale - 0.5);
        ring.scale.set(s, s, 1);
        ringMatVfx.opacity = Math.max(0, 1 - p);
    });
}

// Helper: 3D Vertical Column Pillar / Beam
function spawn3DColumnBeam(col, colorHex = 0xef4444, radius = 0.46, durationMs = 540, pulseRings = true) {
    const group = new THREE.Group();
    const colX = START_X + col * CELL_SPACING;
    const centerY = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;

    const cylGeo = new THREE.CylinderGeometry(radius, radius, BOARD_H + 1.8, 20, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(cylGeo, cylMat);
    beam.position.set(colX, centerY, 0.25);
    group.add(beam);

    // Inner white-hot core cylinder
    const coreGeo = new THREE.CylinderGeometry(radius * 0.42, radius * 0.42, BOARD_H + 2.0, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(colX, centerY, 0.25);
    group.add(core);

    const rings = [];
    if (pulseRings) {
        for (let i = 0; i < 4; i++) {
            const rGeo = new THREE.TorusGeometry(radius * 1.15, 0.045, 8, 24);
            rGeo.rotateX(Math.PI / 2);
            const rMat = new THREE.MeshBasicMaterial({
                color: 0xfde047,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            const rMesh = new THREE.Mesh(rGeo, rMat);
            rMesh.position.set(colX, START_Y + BOARD_H - i * 1.6, 0.25);
            group.add(rMesh);
            rings.push(rMesh);
        }
    }

    addTimedVFX(group, durationMs, (p) => {
        const widthScale = p < 0.2 ? (p / 0.2) * 1.25 : Math.max(0.05, 1.25 * (1 - (p - 0.2) / 0.8));
        beam.scale.set(widthScale, 1, widthScale);
        core.scale.set(widthScale * 0.8, 1, widthScale * 0.8);
        cylMat.opacity = (1 - p) * 0.85;
        coreMat.opacity = (1 - p) * 0.95;
        rings.forEach((rm) => {
            rm.position.y -= 0.14;
            if (rm.position.y < START_Y - 0.5) rm.position.y = START_Y + BOARD_H + 0.5;
            rm.material.opacity = 1 - p;
        });
    });
}

// 1. Stalactite Strike: Plunging 3D Cavern Stalactite Spear from ceiling into (topR, col)
function playStalactiteStrikeVFX(topR, col, onImpact) {
    const colX = START_X + col * CELL_SPACING;
    const targetY = START_Y + topR * CELL_SPACING;
    const startY = START_Y + BOARD_H + 3.2;

    const spearGeo = new THREE.ConeGeometry(0.38, 1.55, 7);
    spearGeo.rotateX(Math.PI);
    const spearMat = new THREE.MeshStandardMaterial({
        color: 0xa8a29e,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.3
    });
    const spear = new THREE.Mesh(spearGeo, spearMat);
    spear.position.set(colX, startY, 0.32);

    let impacted = false;
    addTimedVFX(spear, 340, (p) => {
        if (p < 0.68) {
            const fallP = Math.pow(p / 0.68, 2);
            spear.position.y = startY - (startY - targetY) * fallP;
            spear.rotation.y += 0.25;
        } else {
            if (!impacted) {
                impacted = true;
                triggerBoardShake(0.28);
                spawn3DParticleBurst(topR, col, 0x38bdf8, 18, 0.14, 480, 'octa');
                spawn3DShockwaveRing(topR, col, 0xfde047, 2.4, 420);
                if (onImpact) onImpact();
            }
            const fadeP = (p - 0.68) / 0.32;
            spear.scale.setScalar(Math.max(0.01, 1 - fadeP));
        }
    });
}

// 1B. Subterranean Trapdoor: 3 Tokens Plummeting Out of the Bottom of the Board & Bouncing on the Cavern Floor
function playSinkholeFallingTokensVFX(selectedTargets) {
    const floorY = START_Y - 2.35;

    selectedTargets.forEach((target, idx) => {
        const { r, c, type } = target;
        const colX = START_X + c * CELL_SPACING;
        const startY = START_Y + r * CELL_SPACING;

        spawn3DShockwaveRing(r, c, 0xf97316, 2.0, 380);
        spawn3DParticleBurst(r, c, 0x78716c, 10, 0.11, 420, 'box');

        let mat = playerMat;
        if (type === AI) mat = aiMat;
        else if (type === STONE) mat = stoneMat;
        else if (type === WILD) mat = wildMat;

        const fallingMesh = new THREE.Mesh(tokenGeo, mat);
        fallingMesh.position.set(colX, startY, 0.24);

        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), brassInlayMat);
        innerRing.position.z = 0.16;
        fallingMesh.add(innerRing);

        const baseScale = (type === PLAYER && hasGambit('shrinking_shroom')) ? 0.68 : 1.0;
        fallingMesh.scale.set(baseScale, baseScale, type === PLAYER && hasGambit('shrinking_shroom') ? 0.85 : 1.0);

        const delayNorm = idx * 0.11;
        const spinDir = idx % 2 === 0 ? 1 : -1;
        const driftX = (idx - 1) * 0.22;
        let hitFloor = false;

        addTimedVFX(fallingMesh, 880, (p) => {
            if (p < delayNorm) {
                fallingMesh.position.x = colX + (Math.random() - 0.5) * 0.12;
                return;
            }
            const localP = Math.min(1, (p - delayNorm) / (1 - delayNorm));

            if (localP < 0.56) {
                const fallFrac = localP / 0.56;
                const accel = fallFrac * fallFrac;
                fallingMesh.position.x = colX + driftX * fallFrac * 0.4;
                fallingMesh.position.y = startY - (startY - floorY) * accel;
                fallingMesh.position.z = 0.24 + fallFrac * 0.52;
                fallingMesh.rotation.x = fallFrac * Math.PI * 1.35 * spinDir;
                fallingMesh.rotation.y = fallFrac * Math.PI * 0.85 * spinDir;
                fallingMesh.rotation.z = fallFrac * Math.PI * 1.1 * spinDir;
            } else {
                if (!hitFloor) {
                    hitFloor = true;
                    sfx.playTokenFloorHit(idx, type);
                    triggerBoardShake(0.18);
                    triggerHaptic(22);

                    const floorCellRow = -2;
                    spawn3DShockwaveRing(floorCellRow, c, 0xfbbf24, 1.85, 360);
                    spawn3DParticleBurst(floorCellRow, c, 0xa8a29e, 12, 0.12, 380, 'octa');
                }
                const bounceP = (localP - 0.56) / 0.44;
                const bounceArc = Math.abs(Math.sin(bounceP * Math.PI * 1.65)) * (1 - bounceP) * 0.82;
                fallingMesh.position.x = colX + driftX * (0.4 + bounceP * 0.6);
                fallingMesh.position.y = floorY + bounceArc;
                fallingMesh.position.z = 0.76 + bounceP * 0.25;
                fallingMesh.rotation.x += 0.14 * spinDir;
                fallingMesh.rotation.z += 0.18 * spinDir;

                if (bounceP > 0.72) {
                    const fadeOut = 1 - (bounceP - 0.72) / 0.28;
                    fallingMesh.scale.setScalar(Math.max(0.01, baseScale * fadeOut));
                }
            }
        });
    });
}

// 2. Gravity Inversion: 180-degree 3D Column Vortex Flip
function playColumnInversionVFX(col, onMidFlip) {
    const colX = START_X + col * CELL_SPACING;
    const centerY = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;

    const vortexGroup = new THREE.Group();
    vortexGroup.position.set(colX, centerY, 0.35);
    for (let i = 0; i < 3; i++) {
        const tGeo = new THREE.TorusGeometry(0.54, 0.04, 10, 24);
        const tMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x2dd4bf : 0xa855f7,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const torus = new THREE.Mesh(tGeo, tMat);
        torus.position.y = (i - 1) * 1.5;
        vortexGroup.add(torus);
    }

    const colMeshes = [];
    for (let r = 0; r < ROWS; r++) {
        if (state.meshes[r] && state.meshes[r][col]) {
            colMeshes.push({ mesh: state.meshes[r][col], origY: state.meshes[r][col].position.y });
        }
    }

    let flipped = false;
    addTimedVFX(vortexGroup, 460, (p) => {
        vortexGroup.rotation.z = p * Math.PI * 3;
        vortexGroup.rotation.x = p * Math.PI;
        vortexGroup.children.forEach(c => { c.material.opacity = 1 - p; });

        if (p < 0.55) {
            const a = (p / 0.55) * Math.PI;
            colMeshes.forEach(({ mesh, origY }) => {
                const dy = origY - centerY;
                mesh.position.y = centerY + dy * Math.cos(a);
                mesh.position.z = Math.sin(a) * 1.35;
                mesh.rotation.x = a;
            });
        } else if (!flipped) {
            flipped = true;
            triggerBoardShake(0.16);
            if (onMidFlip) onMidFlip();
        }
    });
}

// 3. Suspicious Jar of Cave Flies: 3D Orbiting Swarm of Cave Flies
function playCaveFliesSwarmVFX(targetR, targetC, isGood) {
    const swarmGroup = new THREE.Group();
    const dest = getCellWorldPos(targetR, targetC, 0.55);
    const flyGeo = new THREE.OctahedronGeometry(0.11, 0);
    const flies = [];

    for (let i = 0; i < 12; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: isGood ? 0xa3e635 : 0x78716c,
            transparent: true,
            opacity: 1.0
        });
        const fly = new THREE.Mesh(flyGeo, mat);
        fly.userData = {
            phase: (i / 12) * Math.PI * 2,
            radius: 1.8 + Math.random() * 0.9,
            speed: 9 + Math.random() * 6,
            yOff: (Math.random() - 0.5) * 1.4
        };
        swarmGroup.add(fly);
        flies.push(fly);
    }

    addTimedVFX(swarmGroup, 580, (p) => {
        const curRadius = (1 - p) * 1.9 + 0.15;
        flies.forEach(f => {
            const ang = f.userData.phase + p * f.userData.speed;
            f.position.set(
                dest.x + Math.cos(ang) * curRadius,
                dest.y + Math.sin(ang * 1.3) * curRadius + f.userData.yOff * (1 - p),
                dest.z + Math.sin(ang) * 0.5
            );
            f.material.opacity = p > 0.8 ? (1 - p) * 5 : 1.0;
        });
    });
}

// 4. Fool's Counterfeit Penny: 3D Spinning Golden Coin Flip above (r, col)
function playFoolsPennyFlipVFX(r, col, isLucky) {
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.09, 24);
    const coinMat = new THREE.MeshStandardMaterial({
        color: isLucky ? 0xfacc15 : 0x78716c,
        emissive: isLucky ? 0xd97706 : 0x292524,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.85
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    const basePos = getCellWorldPos(r, col, 0.65);
    coin.position.copy(basePos);

    addTimedVFX(coin, 560, (p) => {
        const arcH = Math.sin(p * Math.PI) * 1.75;
        coin.position.y = basePos.y + arcH;
        coin.rotation.x = p * Math.PI * 7;
        coin.rotation.z = p * Math.PI * 2;
        if (p > 0.78) {
            coin.scale.setScalar(Math.max(0.01, (1 - p) / 0.22));
        }
    });
}

// 5. Coaster Apex Momentum: 3D Glowing Airtime Track Arc across (c1 -> c2 -> c3)
function playCoasterArcVFX(colsArr) {
    const group = new THREE.Group();
    colsArr.forEach((c, idx) => {
        const topR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, c));
        spawn3DShockwaveRing(topR, c, 0x2dd4bf, 2.2, 480 + idx * 90);
        spawn3DParticleBurst(topR, c, 0xfde047, 10, 0.10, 480, 'octa');
    });

    const cStart = colsArr[0], cEnd = colsArr[colsArr.length - 1];
    const x0 = START_X + cStart * CELL_SPACING;
    const x2 = START_X + cEnd * CELL_SPACING;
    const orbGeo = new THREE.OctahedronGeometry(0.22, 1);
    const orbMat = new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });
    const cartOrb = new THREE.Mesh(orbGeo, orbMat);
    group.add(cartOrb);

    addTimedVFX(group, 560, (p) => {
        const curX = x0 + (x2 - x0) * p;
        const curY = START_Y + 2.2 + Math.sin(p * Math.PI) * 2.4;
        cartOrb.position.set(curX, curY, 0.65);
        cartOrb.rotation.z += 0.25;
        orbMat.opacity = 1 - Math.pow(p, 3);
    });
}

// 6. Gambit HUD Badge Pulse Helper (Supports both SVG <img> Medallions & Raw Emojis!)
function pulseGambitBadgeInHUD(gambitId) {
    const strip = document.getElementById('gambit-strip');
    if (!strip) return;
    const g = GAMBIT_CATALOG[gambitId];
    if (!g) return;
    Array.from(strip.querySelectorAll('button')).forEach((btn) => {
        const html = btn.innerHTML || '';
        const txt = btn.textContent || '';
        if (
            html.includes(gambitId) ||
            (g.rawEmoji && txt.includes(g.rawEmoji)) ||
            (g.icon && txt.includes(g.icon)) ||
            (g.name && html.includes(g.name))
        ) {
            btn.classList.add('ring-2', 'ring-amber-300', 'scale-110', 'shadow-[0_0_16px_#fbbf24]');
            setTimeout(() => {
                btn.classList.remove('ring-2', 'ring-amber-300', 'scale-110', 'shadow-[0_0_16px_#fbbf24]');
            }, 650);
        }
    });
}

// 7. Spelunker's Pickaxe: 3D Swinging Iron Pickaxe & Flint Spark Shatter
function playPickaxeSwingVFX(col, stoneRows, onImpact) {
    const colX = START_X + col * CELL_SPACING;
    const minRow = Math.min(...stoneRows);
    const maxRow = Math.max(...stoneRows);
    const startY = START_Y + maxRow * CELL_SPACING + 0.55;
    const endY = START_Y + minRow * CELL_SPACING;

    const pickaxeGroup = new THREE.Group();

    const handleGeo = new THREE.CylinderGeometry(0.055, 0.07, 1.35, 10);
    handleGeo.translate(0, 0.55, 0);
    const handleMesh = new THREE.Mesh(handleGeo, carvedWoodMat);
    pickaxeGroup.add(handleMesh);

    const ironMat = new THREE.MeshStandardMaterial({
        color: 0xd6d3d1,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.25,
        roughness: 0.25,
        metalness: 0.88
    });

    const prongGeo = new THREE.ConeGeometry(0.12, 0.62, 6);
    prongGeo.rotateZ(Math.PI / 2);

    const leftProng = new THREE.Mesh(prongGeo, ironMat);
    leftProng.position.set(-0.31, 1.15, 0);
    leftProng.rotation.z = 0.18;
    pickaxeGroup.add(leftProng);

    const rightProng = new THREE.Mesh(prongGeo, ironMat);
    rightProng.rotation.y = Math.PI;
    rightProng.position.set(0.31, 1.15, 0);
    rightProng.rotation.z = -0.18;
    pickaxeGroup.add(rightProng);

    const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), brassInlayMat);
    collarMesh.position.set(0, 1.15, 0);
    pickaxeGroup.add(collarMesh);

    pickaxeGroup.position.set(colX + 0.52, startY, 0.58);
    pickaxeGroup.rotation.z = -0.85;

    let impacted = false;
    addTimedVFX(pickaxeGroup, 420, (p) => {
        if (p < 0.28) {
            const windP = p / 0.28;
            pickaxeGroup.rotation.z = -0.85 - Math.sin(windP * Math.PI * 0.5) * 0.45;
            pickaxeGroup.position.y = startY + windP * 0.25;
        } else if (p < 0.68) {
            const strikeP = (p - 0.28) / 0.40;
            const easeIn = strikeP * strikeP;
            pickaxeGroup.rotation.z = -1.30 + easeIn * 2.15;
            pickaxeGroup.position.y = startY - easeIn * (startY - endY + 0.35);

            if (strikeP >= 0.55 && !impacted) {
                impacted = true;
                triggerBoardShake(0.24 + Math.min(0.18, stoneRows.length * 0.05));

                stoneRows.forEach((sr) => {
                    spawn3DShockwaveRing(sr, col, 0xfacc15, 2.25, 420);
                    spawn3DParticleBurst(sr, col, 0xfef08a, 10, 0.14, 420, 'octa');
                    spawn3DParticleBurst(sr, col, 0x78716c, 14, 0.13, 500, 'box');
                });

                if (onImpact) onImpact();
            }
        } else {
            const fadeP = (p - 0.68) / 0.32;
            pickaxeGroup.rotation.z = 0.85 + fadeP * 0.25;
            pickaxeGroup.scale.setScalar(Math.max(0.01, 1 - fadeP));
        }
    });
}

// 8. Tectonic Anchor: 3D Dwarven Keystone Pillar Clamp & Slot Gilding Slam
function playTectonicAnchorVFX(col, targetR, isAmplifier = false) {
    const colX = START_X + col * CELL_SPACING;
    const slotRow = targetR !== -1 ? targetR : Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
    const slotY = START_Y + slotRow * CELL_SPACING;
    const topClampStart = START_Y + BOARD_H + 1.4;
    const botClampStart = START_Y - 1.4;

    const anchorGroup = new THREE.Group();

    // Top & Bottom Dwarven Brass Keystone Clamps
    const clampGeo = new THREE.BoxGeometry(0.92, 0.26, 0.62);
    const clampMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.85
    });
    const topClamp = new THREE.Mesh(clampGeo, clampMat);
    const botClamp = new THREE.Mesh(clampGeo, clampMat);
    topClamp.position.set(colX, topClampStart, 0.36);
    botClamp.position.set(colX, botClampStart, 0.36);
    anchorGroup.add(topClamp);
    anchorGroup.add(botClamp);

    // Central Descending Keystone Gem
    const gemGeo = new THREE.OctahedronGeometry(0.34, 0);
    const gemMat = new THREE.MeshBasicMaterial({
        color: isAmplifier ? 0x38bdf8 : 0xfde047,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(colX, topClampStart, 0.52);
    anchorGroup.add(gem);

    let locked = false;
    addTimedVFX(anchorGroup, 480, (p) => {
        if (p < 0.48) {
            const ease = Math.pow(p / 0.48, 2);
            topClamp.position.y = topClampStart - ease * 0.95;
            botClamp.position.y = botClampStart + ease * 0.95;
            gem.position.y = topClampStart - ease * (topClampStart - slotY);
            gem.rotation.y += 0.28;
            gem.rotation.z += 0.15;
        } else {
            if (!locked) {
                locked = true;
                triggerBoardShake(0.20);
                spawn3DColumnBeam(col, isAmplifier ? 0x38bdf8 : 0xfacc15, 0.38, 420, false);
                spawn3DShockwaveRing(slotRow, col, isAmplifier ? 0x38bdf8 : 0xfacc15, 2.5, 440);
                spawn3DParticleBurst(slotRow, col, isAmplifier ? 0x7dd3fc : 0xfde047, 16, 0.13, 460, 'octa');
            }
            const fadeP = (p - 0.48) / 0.52;
            const scaleOut = Math.max(0.01, 1 - fadeP);
            gem.rotation.y += 0.22;
            gem.scale.setScalar(1 + fadeP * 0.45);
            gemMat.opacity = 1 - fadeP;
            topClamp.scale.set(1, scaleOut, scaleOut);
            botClamp.scale.set(1, scaleOut, scaleOut);
        }
    });
}

// 9. Lodestone Polarity: 3D Bipolar Magnetic Levitation & Blocker Sink Choreography
function playLodestonePolarityVFX(col, transitions, onComplete) {
    const colX = START_X + col * CELL_SPACING;
    const centerY = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;

    // Spawn Bipolar Horseshoe Magnetic Field Rings (Crimson North + Cyan South)
    const fieldGroup = new THREE.Group();
    fieldGroup.position.set(colX, centerY, 0.42);

    const ringCount = 4;
    const fieldRings = [];
    for (let i = 0; i < ringCount; i++) {
        const rGeo = new THREE.TorusGeometry(0.56, 0.045, 10, 26);
        rGeo.rotateX(Math.PI / 2);
        const rMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.y = (i - 1.5) * 1.1;
        fieldGroup.add(rMesh);
        fieldRings.push(rMesh);
    }

    // Track actual token meshes in `col` so Player/Wild tokens visibly float forward & up while AI/Stone sink back & down
    const movingItems = transitions.map((tr) => {
        const mesh = state.meshes[tr.fromR] && state.meshes[tr.fromR][col];
        return {
            mesh,
            startY: START_Y + tr.fromR * CELL_SPACING,
            endY: START_Y + tr.toR * CELL_SPACING,
            isRising: tr.isPlayerType
        };
    }).filter((item) => item.mesh);

    let finished = false;
    addTimedVFX(fieldGroup, 460, (p) => {
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const arcSin = Math.sin(p * Math.PI);

        fieldRings.forEach((rm, idx) => {
            rm.position.y += idx % 2 === 0 ? 0.09 : -0.09;
            if (rm.position.y > 2.4) rm.position.y = -2.4;
            if (rm.position.y < -2.4) rm.position.y = 2.4;
            rm.scale.setScalar(1 + arcSin * 0.22);
            rm.material.opacity = (1 - p) * 0.9;
        });

        movingItems.forEach((item) => {
            item.mesh.position.y = item.startY + (item.endY - item.startY) * ease;
            // Rising Player/Wild tokens arc forward in Z (+0.65); sinking blockers pass behind (-0.35)
            item.mesh.position.z = (item.isRising ? 0.65 : -0.35) * arcSin;
            item.mesh.rotation.y = (item.isRising ? 1 : -1) * p * Math.PI * 2;
        });

        if (p >= 0.92 && !finished) {
            finished = true;
            movingItems.forEach((item) => {
                item.mesh.position.z = 0;
                item.mesh.rotation.set(0, 0, 0);
            });
            triggerBoardShake(0.18);
            if (onComplete) onComplete();
        }
    });
}

// 10. Alchemical Crucible: 3D Bubbling Acid Smelt & Wild Amplifier Crystal Emergence
function playAlchemyCrucibleVFX(targetR, slotRow, col, onSmelt) {
    const targetMesh = state.meshes[targetR] && state.meshes[targetR][col];
    const originPos = getCellWorldPos(targetR, col, 0.45);
    const destY = START_Y + slotRow * CELL_SPACING;

    const crucibleGroup = new THREE.Group();
    crucibleGroup.position.set(originPos.x, originPos.y, 0.45);

    // Swirling Alchemical Vortex Ring
    const vortexGeo = new THREE.TorusGeometry(0.46, 0.055, 10, 24);
    const vortexMat = new THREE.MeshBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });
    const vortexRing = new THREE.Mesh(vortexGeo, vortexMat);
    crucibleGroup.add(vortexRing);

    // Rising Alchemical Bubbles + Emerging Wild Diamond Core
    const bubbleGeo = new THREE.OctahedronGeometry(0.11, 1);
    const bubbles = [];
    for (let i = 0; i < 10; i++) {
        const bMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xfacc15 : 0x38bdf8,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const b = new THREE.Mesh(bubbleGeo, bMat);
        b.userData = {
            angle: (i / 10) * Math.PI * 2,
            rad: 0.18 + Math.random() * 0.26,
            vy: 0.04 + Math.random() * 0.05
        };
        crucibleGroup.add(b);
        bubbles.push(b);
    }

    const prismGeo = new THREE.OctahedronGeometry(0.32, 0);
    const prismMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    crucibleGroup.add(prismMesh);

    let smelted = false;
    addTimedVFX(crucibleGroup, 460, (p) => {
        vortexRing.rotation.z = p * Math.PI * 4;
        vortexRing.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.35);
        vortexMat.opacity = 1 - p;

        bubbles.forEach((b) => {
            b.userData.angle += 0.18;
            b.position.x = Math.cos(b.userData.angle) * b.userData.rad * (1 - p * 0.5);
            b.position.y += b.userData.vy;
            b.position.z = Math.sin(b.userData.angle) * 0.22;
            b.material.opacity = 1 - p;
        });

        if (p < 0.55) {
            const shrinkP = p / 0.55;
            if (targetMesh) {
                const s = Math.max(0.05, 1 - shrinkP);
                targetMesh.scale.setScalar(s);
                targetMesh.rotation.z = shrinkP * Math.PI * 2;
            }
            prismMat.opacity = shrinkP;
            prismMesh.scale.setScalar(0.3 + shrinkP * 0.8);
            prismMesh.rotation.y += 0.25;
        } else {
            if (!smelted) {
                smelted = true;
                triggerBoardShake(0.22);
                spawn3DShockwaveRing(slotRow, col, 0x38bdf8, 2.6, 460);
                spawn3DParticleBurst(slotRow, col, 0xfde047, 18, 0.14, 480, 'octa');
                if (onSmelt) onSmelt();
            }
            const settleP = (p - 0.55) / 0.45;
            prismMesh.position.y = (destY - originPos.y) * settleP;
            prismMesh.rotation.y += 0.25;
            prismMesh.scale.setScalar(Math.max(0.01, 1.1 * (1 - settleP)));
            prismMat.opacity = 1 - settleP;
        }
    });
}

// 11. Prismatic Mirror Shard: 3D Crystalline Mirror Portal Reflection between (srcR, col) and (destR, col)
function playMirrorShardVFX(srcR, destR, col) {
    const colX = START_X + col * CELL_SPACING;
    const srcY = START_Y + srcR * CELL_SPACING;
    const destY = START_Y + destR * CELL_SPACING;
    const midY = (srcY + destY) * 0.5;

    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(colX, midY, 0.48);

    // Floating Crystalline Mirror Plane & Prismatic Rim between the source and cloned tokens
    const glassGeo = new THREE.CylinderGeometry(0.54, 0.54, 0.05, 6);
    const glassMat = new THREE.MeshBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const glassDisc = new THREE.Mesh(glassGeo, glassMat);
    mirrorGroup.add(glassDisc);

    const rimGeo = new THREE.TorusGeometry(0.56, 0.045, 8, 6);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    mirrorGroup.add(rimMesh);

    spawn3DShockwaveRing(srcR, col, 0xfbbf24, 2.0, 380);
    spawn3DShockwaveRing(destR, col, 0x38bdf8, 2.6, 480);
    spawn3DParticleBurst(destR, col, 0xe879f9, 18, 0.13, 500, 'octa');

    addTimedVFX(mirrorGroup, 460, (p) => {
        const pulse = Math.sin(p * Math.PI);
        glassDisc.rotation.y = p * Math.PI * 3;
        rimMesh.rotation.z = -p * Math.PI * 3;
        mirrorGroup.scale.setScalar(0.6 + pulse * 0.65);
        glassMat.opacity = (1 - p) * 0.85;
        rimMat.opacity = (1 - p) * 0.95;
    });
}
