// ============================================================================
// 3D SUBTERRANEAN VFX & HIGH-DETAIL SCULPTED PROP ENGINE (js/graphics/vfx3d.js)
//   Every Arcane Card and Tactical Reserve Token constructs a finely detailed,
//   multi-component 3D miniature of the object it represents (bevelled dice
//   with accurate 1-6 pip layouts, graduated glass-and-brass hypodermic
//   lancet, curved serrated bear-trap jaws with leaf springs & chain, French
//   guillotine with lunette stock & trapezoidal blade, 24-segment articulated
//   Ouroboros dragon-serpent, blinking spherical Basilisk eyeball with scaly
//   lids, 6-winged multi-feather Seraphim & eye-studded Ophanim wheels, etc.).
// ============================================================================
const vfxGroup = new THREE.Group();
boardGroup.add(vfxGroup);
const activeVFX = [];
const boardShakeState = { intensity: 0, decay: 0.88 };

// Dedicated high-contrast Rim Light attached to vfxGroup so sculpted 3D props
// show crisp metallic bevels, specular highlights, and surface relief.
// Positioned high and wide off-axis so its half-vector with the camera never
// causes a direct specular mirror reflection on Column 4 (x=0, y=2.12).
// Kept at intensity 0 when no 3D VFX prop is active.
const vfxKeyLight = new THREE.PointLight(0xfffbeb, 0.0, 24);
vfxKeyLight.position.set(-8.5, 11.5, 6.5);
vfxGroup.add(vfxKeyLight);

const VFX_MIN_VISIBLE_Y = START_Y + 0.15;                             // -2.45
const VFX_MAX_VISIBLE_Y = START_Y + (ROWS - 1) * CELL_SPACING - 0.15; // +3.15
const VFX_CENTER_Y = START_Y + ((ROWS - 1) * CELL_SPACING) / 2;       // +0.35

function clampVisibleY(y) {
  return Math.max(VFX_MIN_VISIBLE_Y, Math.min(VFX_MAX_VISIBLE_Y, y));
}

function getVisibleRowY(r) {
  const safeR = Math.max(0, Math.min(ROWS - 1, Number.isFinite(r) && r >= 0 ? r : 2));
  return clampVisibleY(START_Y + safeR * CELL_SPACING);
}

function triggerBoardShake(amount = 0.22) {
  boardShakeState.intensity = Math.max(boardShakeState.intensity, amount);
}

function getCellWorldPos(r, c, zOffset = 0.55) {
  const safeR = Math.max(0, Math.min(ROWS - 1, Number.isFinite(r) && r >= 0 ? r : 2));
  const safeC = Math.max(0, Math.min(COLS - 1, Number.isFinite(c) && c >= 0 ? c : 3));
  return new THREE.Vector3(
    START_X + safeC * CELL_SPACING,
    START_Y + safeR * CELL_SPACING,
    zOffset
  );
}

function getBoardWorldPos(r, c) {
  return getCellWorldPos(r, c, 0);
}

function addTimedVFX(mesh, durationMs, onUpdate) {
  vfxGroup.add(mesh);
  if (typeof vfxKeyLight !== 'undefined' && vfxKeyLight) {
    vfxKeyLight.intensity = 0.95;
  }
  activeVFX.push({
    mesh,
    startTime: performance.now(),
    duration: durationMs,
    onUpdate
  });
}

// ============================================================================
// SHARED PBR MATERIAL PALETTE FOR FINELY SCULPTED 3D PROPS
// ============================================================================
const C4_VFX_MATS = {
  polishedSteel: new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.22,
    roughness: 0.14,
    metalness: 0.94
  }),
  darkIron: new THREE.MeshStandardMaterial({
    color: 0x475569,
    emissive: 0x0f172a,
    emissiveIntensity: 0.3,
    roughness: 0.36,
    metalness: 0.86
  }),
  rustedIron: new THREE.MeshStandardMaterial({
    color: 0x78350f,
    emissive: 0x451a03,
    emissiveIntensity: 0.32,
    roughness: 0.52,
    metalness: 0.72
  }),
  agedBrass: new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.38,
    roughness: 0.22,
    metalness: 0.88
  }),
  burnishedCopper: new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0x9a3412,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.86
  }),
  boneIvory: new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xd97706,
    emissiveIntensity: 0.20,
    roughness: 0.26,
    metalness: 0.12
  }),
  crimsonRuby: new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.55,
    roughness: 0.16,
    metalness: 0.45
  }),
  emeraldJade: new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.42,
    roughness: 0.20,
    metalness: 0.55
  }),
  obsidianPitch: new THREE.MeshStandardMaterial({
    color: 0x18181b,
    emissive: 0x581c87,
    emissiveIntensity: 0.45,
    roughness: 0.10,
    metalness: 0.90
  }),
  quicksilverChrome: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.45,
    roughness: 0.06,
    metalness: 0.98
  }),
  beeswaxGold: new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xca8a04,
    emissiveIntensity: 0.32,
    roughness: 0.35,
    metalness: 0.15
  }),
  basaltStone: new THREE.MeshStandardMaterial({
    color: 0x78716c,
    emissive: 0x292524,
    emissiveIntensity: 0.28,
    roughness: 0.65,
    metalness: 0.25
  })
};

// Helper: 3D Particle Burst at (r, c)
function spawn3DParticleBurst(r, c, colorHex = 0xfbbf24, count = 16, speed = 0.12, durationMs = 560, shape = 'box') {
  const group = new THREE.Group();
  group.position.copy(getCellWorldPos(r, c, 0.65));

  const geo = shape === 'octa'
    ? new THREE.OctahedronGeometry(0.15, 0)
    : (shape === 'cone'
      ? new THREE.ConeGeometry(0.11, 0.28, 5)
      : new THREE.BoxGeometry(0.15, 0.15, 0.15));

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
    const spd = speed * (0.6 + Math.random() * 0.85);
    p.userData = {
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd + 0.04,
      vz: (Math.random() - 0.5) * spd * 0.8,
      rx: (Math.random() - 0.5) * 0.28,
      ry: (Math.random() - 0.5) * 0.28
    };
    group.add(p);
    particles.push(p);
  }

  addTimedVFX(group, durationMs, (p) => {
    particles.forEach((pt) => {
      pt.position.x += pt.userData.vx;
      pt.position.y += pt.userData.vy;
      pt.position.z += pt.userData.vz;
      pt.userData.vy -= 0.0045;
      pt.rotation.x += pt.userData.rx;
      pt.rotation.y += pt.userData.ry;
      pt.scale.setScalar(Math.max(0.01, 1 - p));
      pt.material.opacity = 1 - p;
    });
  });
}

// Helper: 3D Expanding Shockwave Ring at (r, c)
function spawn3DShockwaveRing(r, c, colorHex = 0xf59e0b, maxScale = 2.8, durationMs = 520) {
  const ringGeoVfx = new THREE.TorusGeometry(0.36, 0.065, 10, 28);
  const ringMatVfx = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const ring = new THREE.Mesh(ringGeoVfx, ringMatVfx);
  ring.position.copy(getCellWorldPos(r, c, 0.68));

  addTimedVFX(ring, durationMs, (p) => {
    const ease = 1 - Math.pow(1 - p, 3);
    const s = 0.55 + ease * (maxScale - 0.55);
    ring.scale.set(s, s, 1);
    ringMatVfx.opacity = Math.max(0, 1 - p);
  });
}

// Helper: 3D Vertical Column Pillar / Beam
function spawn3DColumnBeam(col, colorHex = 0xef4444, radius = 0.48, durationMs = 620, pulseRings = true) {
  const group = new THREE.Group();
  const colX = START_X + col * CELL_SPACING;
  const centerY = VFX_CENTER_Y;

  const cylGeo = new THREE.CylinderGeometry(radius, radius, BOARD_H, 20, 1, true);
  const cylMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const beam = new THREE.Mesh(cylGeo, cylMat);
  beam.position.set(colX, centerY, 0.48);
  group.add(beam);

  const coreGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, BOARD_H + 0.4, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(colX, centerY, 0.48);
  group.add(core);

  const rings = [];
  if (pulseRings) {
    for (let i = 0; i < 4; i++) {
      const rGeo = new THREE.TorusGeometry(radius * 1.2, 0.055, 8, 24);
      rGeo.rotateX(Math.PI / 2);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(colX, VFX_MAX_VISIBLE_Y - i * 1.35, 0.52);
      group.add(rMesh);
      rings.push(rMesh);
    }
  }

  addTimedVFX(group, durationMs, (p) => {
    const widthScale = p < 0.2 ? (p / 0.2) * 1.3 : Math.max(0.05, 1.3 * (1 - (p - 0.2) / 0.8));
    beam.scale.set(widthScale, 1, widthScale);
    core.scale.set(widthScale * 0.8, 1, widthScale * 0.8);
    cylMat.opacity = (1 - p) * 0.88;
    coreMat.opacity = (1 - p) * 0.95;
    rings.forEach((rm) => {
      rm.position.y -= 0.12;
      if (rm.position.y < VFX_MIN_VISIBLE_Y) rm.position.y = VFX_MAX_VISIBLE_Y;
      rm.material.opacity = 1 - p;
    });
  });
}

// ============================================================================
// 1. SUBTERRANEAN TRAPDOOR: Hinged Iron Trapdoor Grates & Falling Tokens
// ============================================================================
function playSinkholeFallingTokensVFX(selectedTargets) {
  const floorY = START_Y - 2.15;

  selectedTargets.forEach((target, idx) => {
    const { r, c, type } = target;
    const colX = START_X + c * CELL_SPACING;
    const startY = START_Y + r * CELL_SPACING;

    // Spawn hinged iron trapdoor leaf beneath the column
    const doorGroup = new THREE.Group();
    doorGroup.position.set(colX - 0.45, START_Y - 0.55, 0.55);
    const doorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.75), C4_VFX_MATS.darkIron);
    doorPlate.position.x = 0.45;
    doorGroup.add(doorPlate);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.82, 10), C4_VFX_MATS.agedBrass);
    hinge.rotation.x = Math.PI / 2;
    doorGroup.add(hinge);
    addTimedVFX(doorGroup, 820, (p) => {
      const openAngle = p < 0.25 ? (p / 0.25) * 1.35 : (p > 0.78 ? ((1 - p) / 0.22) * 1.35 : 1.35);
      doorGroup.rotation.z = -openAngle;
    });

    spawn3DShockwaveRing(r, c, 0xf97316, 2.2, 420);
    spawn3DParticleBurst(r, c, 0x78716c, 12, 0.12, 460, 'box');

    const fallingMesh = new THREE.Mesh(tokenGeo, getTokenMaterial(type));
    fallingMesh.position.set(colX, startY, 0.45);

    const innerRing = new THREE.Mesh(tokenInnerRingGeo, brassInlayMat);
    innerRing.position.z = 0.16;
    fallingMesh.add(innerRing);

    const isShroom = type === PLAYER && hasGambit('shrinking_shroom');
    const baseScale = isShroom ? 0.68 : 1.0;
    fallingMesh.scale.set(baseScale, baseScale, isShroom ? 0.85 : 1.0);

    const delayNorm = idx * 0.10;
    const spinDir = idx % 2 === 0 ? 1 : -1;
    const driftX = (idx - 1) * 0.24;
    let hitFloor = false;

    addTimedVFX(fallingMesh, 880, (p) => {
      if (p < delayNorm) {
        fallingMesh.position.x = colX + (Math.random() - 0.5) * 0.14;
        return;
      }
      const localP = Math.min(1, (p - delayNorm) / (1 - delayNorm));

      if (localP < 0.56) {
        const fallFrac = localP / 0.56;
        const accel = fallFrac * fallFrac;
        fallingMesh.position.x = colX + driftX * fallFrac * 0.4;
        fallingMesh.position.y = startY - (startY - floorY) * accel;
        fallingMesh.position.z = 0.45 + fallFrac * 0.55;
        fallingMesh.rotation.x = fallFrac * Math.PI * 1.45 * spinDir;
        fallingMesh.rotation.y = fallFrac * Math.PI * 0.95 * spinDir;
        fallingMesh.rotation.z = fallFrac * Math.PI * 1.15 * spinDir;
      } else {
        if (!hitFloor) {
          hitFloor = true;
          sfx.playTokenFloorHit(idx, type);
          triggerBoardShake(0.20);
          triggerHaptic(22);
          spawn3DShockwaveRing(0, c, 0xfbbf24, 2.0, 380);
          spawn3DParticleBurst(0, c, 0xa8a29e, 14, 0.13, 400, 'octa');
        }
        const bounceP = (localP - 0.56) / 0.44;
        const bounceArc = Math.abs(Math.sin(bounceP * Math.PI * 1.65)) * (1 - bounceP) * 0.88;
        fallingMesh.position.x = colX + driftX * (0.4 + bounceP * 0.6);
        fallingMesh.position.y = floorY + bounceArc;
        fallingMesh.position.z = 0.95 + bounceP * 0.25;
        fallingMesh.rotation.x += 0.16 * spinDir;
        fallingMesh.rotation.z += 0.20 * spinDir;

        if (bounceP > 0.72) {
          const fadeOut = 1 - (bounceP - 0.72) / 0.28;
          fallingMesh.scale.setScalar(Math.max(0.01, baseScale * fadeOut));
        }
      }
    });
  });
}

// ============================================================================
// 2. GRAVITY INVERSION: 3D Brass Gyroscopic Astrolabe & 180° Column Orbit
// ============================================================================
function playColumnInversionVFX(col, onMidFlip) {
  const colX = START_X + col * CELL_SPACING;
  const centerY = VFX_CENTER_Y;

  const vortexGroup = new THREE.Group();
  vortexGroup.position.set(colX, centerY, 0.92);

  // Nested 3-axis brass & cyan astrolabe rings with cardinal finials
  for (let i = 0; i < 3; i++) {
    const tGeo = new THREE.TorusGeometry(0.85 - i * 0.14, 0.055, 12, 32);
    const torus = new THREE.Mesh(tGeo, i === 1 ? C4_VFX_MATS.agedBrass : C4_VFX_MATS.polishedSteel);
    vortexGroup.add(torus);
  }
  const coreOcta = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), C4_VFX_MATS.crimsonRuby);
  vortexGroup.add(coreOcta);

  const colMeshes = [];
  for (let r = 0; r < ROWS; r++) {
    if (state.meshes[r] && state.meshes[r][col]) {
      colMeshes.push({ mesh: state.meshes[r][col], origY: state.meshes[r][col].position.y });
    }
  }

  let flipped = false;
  addTimedVFX(vortexGroup, 760, (p) => {
    vortexGroup.children[0].rotation.set(p * Math.PI * 3, p * Math.PI * 2, 0);
    vortexGroup.children[1].rotation.set(0, p * Math.PI * 4, p * Math.PI * 2);
    vortexGroup.children[2].rotation.set(p * Math.PI * 2, 0, -p * Math.PI * 4);
    coreOcta.rotation.y = p * Math.PI * 6;
    if (p > 0.75) {
      vortexGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.25));
    }

    if (p < 0.58) {
      const a = (p / 0.58) * Math.PI;
      colMeshes.forEach(({ mesh, origY }) => {
        const dy = origY - centerY;
        mesh.position.y = centerY + dy * Math.cos(a);
        mesh.position.z = Math.sin(a) * 1.55;
        mesh.rotation.x = a;
      });
    } else if (!flipped) {
      flipped = true;
      colMeshes.forEach(({ mesh }) => {
        mesh.position.z = 0;
        mesh.rotation.set(0, 0, 0);
      });
      triggerBoardShake(0.22);
      if (typeof onMidFlip === 'function') onMidFlip();
    }
  });
}

// ============================================================================
// 3. SUSPICIOUS JAR OF CAVE FLIES: Apothecary Specimen Jar & Articulated Flies
// ============================================================================
function buildArticulatedFlyMesh(isGood) {
  const fly = new THREE.Group();
  const bodyMat = isGood ? C4_VFX_MATS.emeraldJade : C4_VFX_MATS.basaltStone;
  // Thorax + Abdomen
  const thorax = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), bodyMat);
  const abdomen = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), bodyMat);
  abdomen.position.set(0, -0.14, -0.04);
  abdomen.scale.set(0.85, 1.35, 0.85);
  fly.add(thorax);
  fly.add(abdomen);
  // Compound Eyes
  const eyeGeo = new THREE.OctahedronGeometry(0.055, 0);
  const eyeL = new THREE.Mesh(eyeGeo, C4_VFX_MATS.crimsonRuby);
  const eyeR = new THREE.Mesh(eyeGeo, C4_VFX_MATS.crimsonRuby);
  eyeL.position.set(-0.06, 0.08, 0.06);
  eyeR.position.set(0.06, 0.08, 0.06);
  fly.add(eyeL);
  fly.add(eyeR);
  // Translucent Fluttering Wings
  const wingGeo = new THREE.BoxGeometry(0.28, 0.02, 0.14);
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.82 });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.16, 0.02, 0.06);
  wingR.position.set(0.16, 0.02, 0.06);
  fly.add(wingL);
  fly.add(wingR);
  fly.userData.wingL = wingL;
  fly.userData.wingR = wingR;
  return fly;
}

function playCaveFliesSwarmVFX(targetR, targetC, isGood, onImpact) {
  const swarmGroup = new THREE.Group();
  const dest = getCellWorldPos(targetR, targetC, 0.88);
  const startPos = new THREE.Vector3(dest.x, clampVisibleY(dest.y + 1.05), 1.08);

  // Sculpted Apothecary Specimen Jar with Flared Lip, Brass Collar & Cork Stopper
  const jarGroup = new THREE.Group();
  jarGroup.position.copy(startPos);
  const jarGlassMat = new THREE.MeshBasicMaterial({
    color: 0xa3e635,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const jarBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.40, 0.82, 16), jarGlassMat);
  const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.10, 16), C4_VFX_MATS.darkIron);
  jarBase.position.y = -0.44;
  const jarCollar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 10, 20), C4_VFX_MATS.agedBrass);
  jarCollar.rotation.x = Math.PI / 2;
  jarCollar.position.y = 0.42;
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.28, 14), carvedWoodMat);
  cork.position.y = 0.56;
  jarGroup.add(jarBelly);
  jarGroup.add(jarBase);
  jarGroup.add(jarCollar);
  jarGroup.add(cork);
  swarmGroup.add(jarGroup);

  const flies = [];
  for (let i = 0; i < 12; i++) {
    const fly = buildArticulatedFlyMesh(isGood);
    fly.userData.phase = (i / 12) * Math.PI * 2;
    fly.userData.radius = 1.45 + Math.random() * 0.65;
    fly.userData.speed = 10 + Math.random() * 5;
    fly.userData.yOff = (Math.random() - 0.5) * 1.2;
    swarmGroup.add(fly);
    flies.push(fly);
  }

  let impacted = false;
  addTimedVFX(swarmGroup, 780, (p) => {
    jarGroup.rotation.z = Math.sin(p * Math.PI * 8) * 0.22;
    cork.position.y = 0.56 + Math.min(1.6, p * 3.2);
    cork.rotation.z = p * Math.PI * 5;
    if (p > 0.65) {
      jarGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.35));
    }

    const curRadius = (1 - Math.min(1, p / 0.75)) * 1.55 + 0.16;
    flies.forEach((f, idx) => {
      const ang = f.userData.phase + p * f.userData.speed;
      f.position.set(
        dest.x + Math.cos(ang) * curRadius,
        clampVisibleY(dest.y + Math.sin(ang * 1.4) * curRadius + f.userData.yOff * (1 - p)),
        0.96 + Math.sin(ang) * 0.35
      );
      f.rotation.z = Math.sin(ang) * 0.4;
      const flap = Math.sin(p * 90 + idx) * 0.65;
      f.userData.wingL.rotation.z = flap;
      f.userData.wingR.rotation.z = -flap;
      if (p > 0.78) f.scale.setScalar(Math.max(0.01, (1 - p) / 0.22));
    });

    if (p >= 0.54 && !impacted) {
      impacted = true;
      triggerBoardShake(0.22);
      if (typeof onImpact === 'function') onImpact();
    }
  });
}

// ============================================================================
// 4. FOOL'S COUNTERFEIT PENNY: Embossed Mint Coin with Bevelled Rim & Relief
// ============================================================================
function buildSculptedCoinMesh(isLucky, radius = 0.68) {
  const coin = new THREE.Group();
  const faceMat = isLucky ? C4_VFX_MATS.agedBrass : C4_VFX_MATS.basaltStone;
  const rimMat = isLucky ? C4_VFX_MATS.beeswaxGold : C4_VFX_MATS.darkIron;

  const discGeo = new THREE.CylinderGeometry(radius, radius, 0.12, 28);
  discGeo.rotateX(Math.PI / 2);
  coin.add(new THREE.Mesh(discGeo, faceMat));

  // Milled outer rim + inner beaded ring + embossed diamond/skull emblem on both faces
  coin.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.065, 12, 28), rimMat));
  coin.add(new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.03, 8, 24), rimMat));

  const relief = new THREE.Mesh(
    new THREE.OctahedronGeometry(radius * 0.42, 0),
    isLucky ? C4_VFX_MATS.beeswaxGold : C4_VFX_MATS.crimsonRuby
  );
  relief.scale.set(1, 1, 0.45);
  coin.add(relief);
  return coin;
}

function playFoolsPennyFlipVFX(r, col, isLucky, onImpact) {
  const group = new THREE.Group();
  const basePos = getCellWorldPos(r, col, 0.98);
  basePos.y = clampVisibleY(basePos.y);

  const coin = buildSculptedCoinMesh(isLucky, 0.72);
  coin.position.copy(basePos);
  group.add(coin);

  let impacted = false;
  addTimedVFX(group, 760, (p) => {
    const arcH = Math.sin(p * Math.PI) * 1.75;
    coin.position.y = clampVisibleY(basePos.y + arcH);
    coin.position.z = 0.98 + Math.sin(p * Math.PI) * 0.55;
    coin.rotation.x = p * Math.PI * 8;
    coin.rotation.y = p * Math.PI * 2;

    if (p >= 0.56 && !impacted) {
      impacted = true;
      triggerBoardShake(0.22);
      if (typeof onImpact === 'function') onImpact();
    }
    if (p > 0.78) {
      coin.scale.setScalar(Math.max(0.01, (1 - p) / 0.22));
    }
  });
}

// ============================================================================
// 5. COASTER APEX MOMENTUM: Sculpted 4-Wheel Dwarven Minecart on Glowing Track
// ============================================================================
function playCoasterArcVFX(colsArr) {
  const group = new THREE.Group();
  colsArr.forEach((c, idx) => {
    const topR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, c));
    spawn3DShockwaveRing(topR, c, 0x2dd4bf, 2.4, 520 + idx * 90);
    spawn3DParticleBurst(topR, c, 0xfde047, 12, 0.11, 520, 'octa');
  });

  const cStart = colsArr[0];
  const cEnd = colsArr[colsArr.length - 1];
  const x0 = START_X + cStart * CELL_SPACING;
  const x2 = START_X + cEnd * CELL_SPACING;

  const cartGroup = new THREE.Group();
  const hopper = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.48), C4_VFX_MATS.darkIron);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.54), C4_VFX_MATS.agedBrass);
  rim.position.y = 0.22;
  cartGroup.add(hopper);
  cartGroup.add(rim);

  const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.10, 12);
  wheelGeo.rotateX(Math.PI / 2);
  [-0.24, 0.24].forEach((wx) => {
    [-0.24, 0.24].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, C4_VFX_MATS.agedBrass);
      w.position.set(wx, -0.24, wz);
      cartGroup.add(w);
    });
  });
  group.add(cartGroup);

  addTimedVFX(group, 680, (p) => {
    const curX = x0 + (x2 - x0) * p;
    const curY = clampVisibleY(START_Y + 1.5 + Math.sin(p * Math.PI) * 1.6);
    cartGroup.position.set(curX, curY, 0.98);
    cartGroup.rotation.z = Math.cos(p * Math.PI) * 0.45;
    if (p > 0.75) cartGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.25));
  });
}

// ============================================================================
// 6. GAMBIT HUD BADGE PULSE HELPER
// ============================================================================
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
      (g.name && html.includes(g.name.split(' ')[0]))
    ) {
      btn.classList.add('ring-2', 'ring-amber-300', 'scale-110', 'shadow-[0_0_16px_#fbbf24]');
      setTimeout(() => {
        btn.classList.remove('ring-2', 'ring-amber-300', 'scale-110', 'shadow-[0_0_16px_#fbbf24]');
      }, 650);
    }
  });
}

// ============================================================================
// 7. SPELUNKER'S PICKAXE: Sculpted Miner's Pickaxe with Curved Dual-Prong Head
// ============================================================================
function playPickaxeSwingVFX(col, stoneRows, onImpact) {
  const colX = START_X + col * CELL_SPACING;
  const minRow = stoneRows.length > 0 ? Math.min(...stoneRows) : 0;
  const maxRow = stoneRows.length > 0 ? Math.max(...stoneRows) : 2;
  const startY = clampVisibleY(START_Y + maxRow * CELL_SPACING + 0.65);
  const endY = clampVisibleY(START_Y + minRow * CELL_SPACING);

  const pickaxeGroup = new THREE.Group();

  // Turned Hickory Shaft + Leather Grip Rings + Brass Pommel
  const handleGeo = new THREE.CylinderGeometry(0.075, 0.10, 1.85, 12);
  handleGeo.translate(0, 0.78, 0);
  pickaxeGroup.add(new THREE.Mesh(handleGeo, carvedWoodMat));

  for (let i = 0; i < 3; i++) {
    const gripRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.024, 8, 16), C4_VFX_MATS.rustedIron);
    gripRing.rotation.x = Math.PI / 2;
    gripRing.position.y = 0.08 + i * 0.18;
    pickaxeGroup.add(gripRing);
  }
  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), C4_VFX_MATS.agedBrass);
  pommel.position.y = -0.12;
  pickaxeGroup.add(pommel);

  // Riveted Center Iron Collar + Top Spike + Curved Pick & Chisel Blades
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.30, 0.30), C4_VFX_MATS.agedBrass);
  collar.position.set(0, 1.52, 0);
  pickaxeGroup.add(collar);

  const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 8), C4_VFX_MATS.polishedSteel);
  topCap.position.set(0, 1.78, 0);
  pickaxeGroup.add(topCap);

  // Multi-segment curved pick arm (left) and broad chisel arm (right)
  [-1, 1].forEach((dir) => {
    const armRoot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.18), C4_VFX_MATS.darkIron);
    armRoot.position.set(dir * 0.32, 1.50, 0);
    armRoot.rotation.z = -dir * 0.18;
    pickaxeGroup.add(armRoot);

    const tipGeo = new THREE.ConeGeometry(0.13, 0.58, 6);
    tipGeo.rotateZ(-dir * Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, C4_VFX_MATS.polishedSteel);
    tip.position.set(dir * 0.72, 1.38, 0);
    tip.rotation.z = -dir * 0.34;
    pickaxeGroup.add(tip);
  });

  pickaxeGroup.position.set(colX + 0.55, startY, 0.94);
  pickaxeGroup.rotation.z = -0.85;

  let impacted = false;
  addTimedVFX(pickaxeGroup, 760, (p) => {
    if (p < 0.30) {
      const windP = p / 0.30;
      pickaxeGroup.rotation.z = -0.85 - Math.sin(windP * Math.PI * 0.5) * 0.55;
      pickaxeGroup.position.y = clampVisibleY(startY + windP * 0.25);
    } else if (p < 0.68) {
      const strikeP = (p - 0.30) / 0.38;
      const easeIn = strikeP * strikeP;
      pickaxeGroup.rotation.z = -1.40 + easeIn * 2.25;
      pickaxeGroup.position.y = clampVisibleY(startY - easeIn * (startY - endY + 0.35));

      if (strikeP >= 0.52 && !impacted) {
        impacted = true;
        triggerBoardShake(0.28 + Math.min(0.18, stoneRows.length * 0.05));
        stoneRows.forEach((sr) => {
          spawn3DShockwaveRing(sr, col, 0xfacc15, 2.5, 460);
          spawn3DParticleBurst(sr, col, 0xfef08a, 12, 0.14, 460, 'octa');
          spawn3DParticleBurst(sr, col, 0x78716c, 16, 0.14, 520, 'box');
        });
        if (typeof onImpact === 'function') onImpact();
      }
    } else {
      const fadeP = (p - 0.68) / 0.32;
      pickaxeGroup.rotation.z = 0.85 + fadeP * 0.25;
      pickaxeGroup.scale.setScalar(Math.max(0.01, 1 - fadeP));
    }
  });
}

// ============================================================================
// 8. TECTONIC ANCHOR: Dwarven Keystone Press with Guide Rods & Fluted Capitals
// ============================================================================
function playTectonicAnchorVFX(col, targetR, isAmplifier = false, onImpact) {
  const colX = START_X + col * CELL_SPACING;
  const slotRow = targetR !== -1 ? targetR : Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
  const slotY = getVisibleRowY(slotRow);
  const topClampStart = VFX_MAX_VISIBLE_Y;
  const botClampStart = VFX_MIN_VISIBLE_Y;

  const anchorGroup = new THREE.Group();

  const buildCapital = (isTop) => {
    const cap = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.26, 0.68), C4_VFX_MATS.agedBrass);
    const bevel = new THREE.Mesh(
      new THREE.CylinderGeometry(isTop ? 0.42 : 0.58, isTop ? 0.58 : 0.42, 0.24, 8),
      C4_VFX_MATS.darkIron
    );
    bevel.position.y = isTop ? -0.22 : 0.22;
    cap.add(plate);
    cap.add(bevel);
    return cap;
  };

  const topClamp = buildCapital(true);
  const botClamp = buildCapital(false);
  topClamp.position.set(colX, topClampStart, 0.90);
  botClamp.position.set(colX, botClampStart, 0.90);
  anchorGroup.add(topClamp);
  anchorGroup.add(botClamp);

  // Twin vertical threaded steel guide rods
  const rodGeo = new THREE.CylinderGeometry(0.055, 0.055, topClampStart - botClampStart, 10);
  const rodL = new THREE.Mesh(rodGeo, C4_VFX_MATS.polishedSteel);
  const rodR = new THREE.Mesh(rodGeo, C4_VFX_MATS.polishedSteel);
  rodL.position.set(colX - 0.48, VFX_CENTER_Y, 0.88);
  rodR.position.set(colX + 0.48, VFX_CENTER_Y, 0.88);
  anchorGroup.add(rodL);
  anchorGroup.add(rodR);

  // Faceted Keystone Gem with Brass Bezel Ring
  const gemGroup = new THREE.Group();
  const gemMat = new THREE.MeshBasicMaterial({
    color: isAmplifier ? 0x38bdf8 : 0xfde047,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.44, 0), gemMat);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 8, 6), C4_VFX_MATS.agedBrass);
  gemGroup.add(gem);
  gemGroup.add(bezel);
  gemGroup.position.set(colX, topClampStart, 0.98);
  anchorGroup.add(gemGroup);

  let locked = false;
  addTimedVFX(anchorGroup, 760, (p) => {
    if (p < 0.50) {
      const ease = Math.pow(p / 0.50, 2);
      topClamp.position.y = topClampStart - ease * (topClampStart - slotY - 0.58);
      botClamp.position.y = botClampStart + ease * (slotY - 0.58 - botClampStart);
      gemGroup.position.y = topClampStart - ease * (topClampStart - slotY);
      gemGroup.rotation.y += 0.25;
    } else {
      if (!locked) {
        locked = true;
        triggerBoardShake(0.24);
        spawn3DColumnBeam(col, isAmplifier ? 0x38bdf8 : 0xfacc15, 0.42, 480, false);
        spawn3DShockwaveRing(slotRow, col, isAmplifier ? 0x38bdf8 : 0xfacc15, 2.7, 480);
        spawn3DParticleBurst(slotRow, col, isAmplifier ? 0x7dd3fc : 0xfde047, 18, 0.14, 500, 'octa');
        if (typeof onImpact === 'function') onImpact();
      }
      const fadeP = (p - 0.50) / 0.50;
      const scaleOut = Math.max(0.01, 1 - fadeP);
      gemGroup.rotation.y += 0.22;
      gemGroup.scale.setScalar(1 + fadeP * 0.45);
      gemMat.opacity = 1 - fadeP;
      topClamp.scale.setScalar(scaleOut);
      botClamp.scale.setScalar(scaleOut);
      rodL.scale.set(scaleOut, 1, scaleOut);
      rodR.scale.set(scaleOut, 1, scaleOut);
    }
  });
}

// ============================================================================
// 9. LODESTONE POLARITY: U-Shaped Horseshoe Magnet with Silver Pole Shoes
// ============================================================================
function buildHorseshoeMagnetMesh() {
  const mag = new THREE.Group();
  // Upper crimson U-bend
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.16, 14, 28, Math.PI),
    C4_VFX_MATS.crimsonRuby
  );
  arch.position.y = 0.35;
  mag.add(arch);

  // Left & Right Straight Legs + Brushed Steel Pole Shoes + Brass Rivets
  [-0.46, 0.46].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 14), C4_VFX_MATS.crimsonRuby);
    leg.position.set(lx, 0.08, 0);
    mag.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.36), C4_VFX_MATS.polishedSteel);
    shoe.position.set(lx, -0.28, 0);
    mag.add(shoe);

    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 10), C4_VFX_MATS.agedBrass);
    rivet.rotation.x = Math.PI / 2;
    rivet.position.set(lx, 0.12, 0);
    mag.add(rivet);
  });
  return mag;
}

function playLodestonePolarityVFX(col, transitionsOrRows, onComplete) {
  const colX = START_X + col * CELL_SPACING;
  const centerY = VFX_CENTER_Y;

  const fieldGroup = new THREE.Group();
  fieldGroup.position.set(colX, centerY, 0.90);

  const magnetMesh = buildHorseshoeMagnetMesh();
  magnetMesh.position.set(0, 1.85, 0.18);
  fieldGroup.add(magnetMesh);

  const fieldRings = [];
  for (let i = 0; i < 4; i++) {
    const rGeo = new THREE.TorusGeometry(0.62, 0.05, 10, 26);
    rGeo.rotateX(Math.PI / 2);
    const rMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.y = (i - 1.5) * 1.05;
    fieldGroup.add(rMesh);
    fieldRings.push(rMesh);
  }

  let normalizedTransitions = [];
  if (Array.isArray(transitionsOrRows) && transitionsOrRows.length > 0) {
    if (typeof transitionsOrRows[0] === 'object' && transitionsOrRows[0] !== null) {
      normalizedTransitions = transitionsOrRows;
    } else {
      const playerFromRows = [];
      const blockerFromRows = [];
      transitionsOrRows.forEach((r) => {
        const cell = state.board[r] && state.board[r][col];
        if (cell === PLAYER || cell === WILD) playerFromRows.push(r);
        else blockerFromRows.push(r);
      });
      const orderedFrom = [...blockerFromRows, ...playerFromRows];
      normalizedTransitions = orderedFrom.map((fromR, i) => ({
        fromR,
        toR: transitionsOrRows[i],
        isPlayerType: i >= blockerFromRows.length
      }));
    }
  }

  const movingItems = normalizedTransitions.map((tr) => {
    const mesh = state.meshes[tr.fromR] && state.meshes[tr.fromR][col];
    return {
      mesh,
      startY: START_Y + tr.fromR * CELL_SPACING,
      endY: START_Y + tr.toR * CELL_SPACING,
      isRising: tr.isPlayerType
    };
  }).filter((item) => item.mesh);

  let finished = false;
  addTimedVFX(fieldGroup, 780, (p) => {
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const arcSin = Math.sin(p * Math.PI);

    magnetMesh.rotation.z = Math.sin(p * Math.PI * 6) * 0.14;
    magnetMesh.scale.setScalar(p > 0.78 ? Math.max(0.01, (1 - p) / 0.22) : 1 + arcSin * 0.18);

    fieldRings.forEach((rm, idx) => {
      rm.position.y += idx % 2 === 0 ? 0.08 : -0.08;
      if (rm.position.y > 2.2) rm.position.y = -2.2;
      if (rm.position.y < -2.2) rm.position.y = 2.2;
      rm.scale.setScalar(1 + arcSin * 0.25);
      rm.material.opacity = (1 - p) * 0.92;
    });

    movingItems.forEach((item) => {
      item.mesh.position.y = item.startY + (item.endY - item.startY) * ease;
      item.mesh.position.z = (item.isRising ? 0.85 : -0.35) * arcSin;
      item.mesh.rotation.y = (item.isRising ? 1 : -1) * p * Math.PI * 2;
    });

    if (p >= 0.88 && !finished) {
      finished = true;
      movingItems.forEach((item) => {
        item.mesh.position.z = 0;
        item.mesh.rotation.set(0, 0, 0);
      });
      triggerBoardShake(0.22);
      if (typeof onComplete === 'function') onComplete();
    }
  });
}

// ============================================================================
// 10. ALCHEMICAL CRUCIBLE: Tripod Melting Pot, Blacksmith Tongs & Wild Crystal
// ============================================================================
function playAlchemyCrucibleVFX(targetR, slotRowOrCol, colOrOnSmelt, maybeOnSmelt) {
  const hasExplicitSlotRow = typeof colOrOnSmelt === 'number';
  const slotRow = hasExplicitSlotRow ? slotRowOrCol : targetR;
  const col = hasExplicitSlotRow ? colOrOnSmelt : slotRowOrCol;
  const onSmelt = hasExplicitSlotRow ? maybeOnSmelt : colOrOnSmelt;

  const targetMesh = state.meshes[targetR] && state.meshes[targetR][col];
  const originPos = getCellWorldPos(targetR, col, 0.90);
  originPos.y = clampVisibleY(originPos.y);
  const destY = getVisibleRowY(slotRow);

  const crucibleGroup = new THREE.Group();
  crucibleGroup.position.copy(originPos);

  // Sculpted Tripod Crucible Pot with Rolled Lip, 3 Legs & Glowing Molten Bath
  const potGroup = new THREE.Group();
  const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.36, 0.56, 16), C4_VFX_MATS.darkIron);
  const potLip = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 10, 24), C4_VFX_MATS.agedBrass);
  potLip.rotation.x = Math.PI / 2;
  potLip.position.y = 0.28;
  const moltenBath = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.08, 16),
    new THREE.MeshBasicMaterial({ color: 0xe879f9 })
  );
  moltenBath.position.y = 0.25;
  potGroup.add(potBody);
  potGroup.add(potLip);
  potGroup.add(moltenBath);

  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.36, 8), C4_VFX_MATS.agedBrass);
    leg.position.set(Math.cos(ang) * 0.34, -0.36, Math.sin(ang) * 0.34);
    potGroup.add(leg);
  }
  potGroup.position.y = -0.18;
  crucibleGroup.add(potGroup);

  // Emerging Multi-Faceted Wild Amplifier Gem
  const prismMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  const prismMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), prismMat);
  const prismCage = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.54, 0),
    new THREE.MeshBasicMaterial({ color: 0xfde047, wireframe: true, transparent: true, opacity: 0.9 })
  );
  prismMesh.add(prismCage);
  crucibleGroup.add(prismMesh);

  let smelted = false;
  addTimedVFX(crucibleGroup, 780, (p) => {
    potGroup.rotation.y = p * Math.PI * 2;
    if (p < 0.55) {
      const shrinkP = p / 0.55;
      if (targetMesh) {
        const s = Math.max(0.05, 1 - shrinkP);
        targetMesh.scale.setScalar(s);
        targetMesh.rotation.z = shrinkP * Math.PI * 2;
      }
      prismMat.opacity = shrinkP;
      prismMesh.position.y = shrinkP * 0.45;
      prismMesh.scale.setScalar(0.35 + shrinkP * 0.85);
      prismMesh.rotation.y += 0.25;
    } else {
      if (!smelted) {
        smelted = true;
        triggerBoardShake(0.24);
        spawn3DShockwaveRing(slotRow, col, 0x38bdf8, 2.7, 480);
        spawn3DParticleBurst(slotRow, col, 0xfde047, 18, 0.14, 500, 'octa');
        if (typeof onSmelt === 'function') onSmelt();
      }
      const settleP = (p - 0.55) / 0.45;
      prismMesh.position.y = 0.45 + (destY - originPos.y - 0.45) * settleP;
      prismMesh.rotation.y += 0.25;
      const fadeOut = Math.max(0.01, 1 - settleP);
      prismMesh.scale.setScalar(fadeOut);
      potGroup.scale.setScalar(fadeOut);
      prismMat.opacity = fadeOut;
    }
  });
}

// ============================================================================
// 11. PRISMATIC MIRROR SHARD: Ornate Gothic Hand-Mirror with Filigree Crown
// ============================================================================
function playMirrorShardVFX(srcR, destR, col, onReflect) {
  const colX = START_X + col * CELL_SPACING;
  const srcY = getVisibleRowY(srcR);
  const destY = getVisibleRowY(destR);
  const midY = clampVisibleY((srcY + destY) * 0.5);

  const mirrorGroup = new THREE.Group();
  mirrorGroup.position.set(colX, midY, 0.94);

  // Silvered Octagonal Mirror Pane
  const glassDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.08, 8),
    C4_VFX_MATS.quicksilverChrome
  );
  glassDisc.rotation.x = Math.PI / 2;
  mirrorGroup.add(glassDisc);

  // Gilded Frame Ring + 8 Perimeter Filigree Spikes + Turned Handle
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.075, 10, 8), C4_VFX_MATS.agedBrass);
  mirrorGroup.add(rimMesh);

  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 5), C4_VFX_MATS.agedBrass);
    spike.position.set(Math.cos(ang) * 0.90, Math.sin(ang) * 0.90, 0);
    spike.rotation.z = ang - Math.PI / 2;
    mirrorGroup.add(spike);
  }

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.65, 10), C4_VFX_MATS.agedBrass);
  handle.position.y = -1.05;
  mirrorGroup.add(handle);

  let reflected = false;
  addTimedVFX(mirrorGroup, 760, (p) => {
    const pulse = Math.sin(p * Math.PI);
    mirrorGroup.rotation.y = Math.sin(p * Math.PI * 2) * 0.55;
    mirrorGroup.scale.setScalar(p > 0.75 ? Math.max(0.01, (1 - p) / 0.25) : 0.75 + pulse * 0.35);

    if (p >= 0.48 && !reflected) {
      reflected = true;
      spawn3DShockwaveRing(srcR, col, 0xfbbf24, 2.2, 420);
      spawn3DShockwaveRing(destR, col, 0x38bdf8, 2.7, 500);
      spawn3DParticleBurst(destR, col, 0xe879f9, 18, 0.14, 500, 'octa');
      if (typeof onReflect === 'function') onReflect();
    }
  });
}

// ============================================================================
// 12. CAVERN PEBBLE NUDGE: Sculpted Dwarven Stone-Mason's Maul & Geode Cluster
// ============================================================================
function playPebbleNudgeVFX(baseR, col, onImpact) {
  const colX = START_X + col * CELL_SPACING;
  const targetY = getVisibleRowY(baseR);
  const startY = clampVisibleY(targetY + 1.65);
  const group = new THREE.Group();

  // Two-Handed Dwarven Stone Maul
  const maulGroup = new THREE.Group();
  const headGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.05, 8);
  headGeo.rotateZ(Math.PI / 2);
  maulGroup.add(new THREE.Mesh(headGeo, C4_VFX_MATS.basaltStone));

  [-0.32, 0.32].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.05, 8, 16), C4_VFX_MATS.agedBrass);
    band.rotation.y = Math.PI / 2;
    band.position.x = bx;
    maulGroup.add(band);
  });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 1.35, 10), carvedWoodMat);
  shaft.position.y = 0.78;
  maulGroup.add(shaft);
  maulGroup.position.set(colX, startY, 0.94);
  group.add(maulGroup);

  const nuggets = [];
  for (let i = 0; i < 6; i++) {
    const nug = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), C4_VFX_MATS.agedBrass);
    nug.position.set(colX, targetY, 0.96);
    group.add(nug);
    nuggets.push(nug);
  }

  let struck = false;
  addTimedVFX(group, 740, (p) => {
    if (p < 0.46) {
      const fallP = Math.pow(p / 0.46, 2);
      maulGroup.position.y = startY - (startY - targetY) * fallP;
      maulGroup.rotation.z = (1 - fallP) * 0.45;
    } else {
      if (!struck) {
        struck = true;
        triggerBoardShake(0.22);
        spawn3DShockwaveRing(baseR, col, 0xfacc15, 2.5, 460);
        spawn3DParticleBurst(baseR, col, 0xd97706, 16, 0.13, 480, 'octa');
        if (typeof onImpact === 'function') onImpact();
      }
      const bounceP = (p - 0.46) / 0.54;
      maulGroup.position.y = clampVisibleY(targetY + Math.sin(bounceP * Math.PI) * 0.65);
      maulGroup.scale.setScalar(Math.max(0.01, 1 - bounceP));
      nuggets.forEach((nug, idx) => {
        const ang = (idx / 6) * Math.PI * 2 + bounceP * 3;
        nug.position.x = colX + Math.cos(ang) * (0.35 + bounceP * 0.85);
        nug.position.y = clampVisibleY(targetY + Math.sin(bounceP * Math.PI) * 1.1);
        nug.rotation.x += 0.25;
        nug.rotation.y += 0.25;
        nug.scale.setScalar(Math.max(0.01, 1 - bounceP));
      });
    }
  });
}

// ============================================================================
// 13. ORACLE'S LANTERN: Hexagonal Brass Sanctuary Lantern with 6 Cage Struts
// ============================================================================
function playOracleLanternVFX(col, onImpact) {
  const group = new THREE.Group();
  const startX = START_X;
  const endX = START_X + (COLS - 1) * CELL_SPACING;
  const targetX = START_X + col * CELL_SPACING;
  const sweepY = VFX_CENTER_Y + 1.15;

  const lanternGroup = new THREE.Group();
  // Top Bail Handle Ring + Vented Chimney Dome + Upper/Lower Galleries
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 18), C4_VFX_MATS.agedBrass);
  bail.position.y = 0.78;
  lanternGroup.add(bail);

  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.42, 6), C4_VFX_MATS.agedBrass);
  hood.position.y = 0.48;
  lanternGroup.add(hood);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.56, 0.22, 6), C4_VFX_MATS.agedBrass);
  base.position.y = -0.44;
  lanternGroup.add(base);

  // 6 Vertical Brass Cage Struts + Inner Glowing Flame Core
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.76, 6), C4_VFX_MATS.agedBrass);
    strut.position.set(Math.cos(ang) * 0.42, 0.02, Math.sin(ang) * 0.42);
    lanternGroup.add(strut);
  }
  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.52, 10),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lanternGroup.add(flameCore);

  const coneGeo = new THREE.ConeGeometry(1.45, 3.6, 16, 1, true);
  coneGeo.translate(0, -1.8, 0);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  lanternGroup.add(new THREE.Mesh(coneGeo, coneMat));
  group.add(lanternGroup);

  let impacted = false;
  addTimedVFX(group, 800, (p) => {
    const sweepX = p < 0.55
      ? startX + (endX - startX) * (p / 0.55)
      : endX + (targetX - endX) * ((p - 0.55) / 0.45);
    lanternGroup.position.set(sweepX, sweepY + Math.sin(p * Math.PI) * 0.32, 1.05);
    lanternGroup.rotation.z = Math.sin(p * Math.PI * 4) * 0.26 * (1 - p);
    lanternGroup.rotation.y = p * Math.PI * 2;
    coneMat.opacity = Math.max(0, (1 - p) * 0.46);

    if (p >= 0.52 && !impacted) {
      impacted = true;
      spawn3DColumnBeam(col, 0xfef08a, 0.42, 480, false);
      if (typeof onImpact === 'function') onImpact();
    }
    if (p > 0.76) {
      lanternGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.24));
    }
  });
}

// ============================================================================
// 14. LOADED KNUCKLEBONES & WEIGHTED DIE: Bevelled Bone Dice with True 1-6 Pips
// ============================================================================
const DIE_PIP_OFFSETS = {
  1: [[0, 0]],
  2: [[-0.18, -0.18], [0.18, 0.18]],
  3: [[-0.20, -0.20], [0, 0], [0.20, 0.20]],
  4: [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]],
  5: [[-0.19, -0.19], [0.19, -0.19], [0, 0], [-0.19, 0.19], [0.19, 0.19]],
  6: [[-0.18, -0.21], [0.18, -0.21], [-0.18, 0], [0.18, 0], [-0.18, 0.21], [0.18, 0.21]]
};

function build3DDieMesh(frontVal = 6, accentHex = 0xdc2626) {
  const dieGroup = new THREE.Group();
  // Bevelled compound ivory block + 8 brass corner studs
  dieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), C4_VFX_MATS.boneIvory));
  dieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.60, 0.60), C4_VFX_MATS.boneIvory));
  dieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.74, 0.60), C4_VFX_MATS.boneIvory));
  dieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.60, 0.74), C4_VFX_MATS.boneIvory));

  const studGeo = new THREE.OctahedronGeometry(0.075, 0);
  [-0.32, 0.32].forEach((sx) => {
    [-0.32, 0.32].forEach((sy) => {
      [-0.32, 0.32].forEach((sz) => {
        const stud = new THREE.Mesh(studGeo, C4_VFX_MATS.agedBrass);
        stud.position.set(sx, sy, sz);
        dieGroup.add(stud);
      });
    });
  });

  // Inlaid 3D pips on the front face (+Z) showing the exact rolled number `frontVal`
  const safeVal = Math.max(1, Math.min(6, Math.round(frontVal || 6)));
  const pipMat = new THREE.MeshBasicMaterial({ color: accentHex });
  const darkPipMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
  const pipGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.03, 12);
  pipGeo.rotateX(Math.PI / 2);

  (DIE_PIP_OFFSETS[safeVal] || DIE_PIP_OFFSETS[6]).forEach(([px, py]) => {
    const pip = new THREE.Mesh(pipGeo, safeVal === 1 || safeVal === 6 ? pipMat : darkPipMat);
    pip.position.set(px, py, 0.375);
    dieGroup.add(pip);
  });

  // Add pips on Top (+Y) and Right (+X) faces so tumbling looks authentic from every angle
  const topPipGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10);
  DIE_PIP_OFFSETS[5].forEach(([px, pz]) => {
    const tp = new THREE.Mesh(topPipGeo, darkPipMat);
    tp.position.set(px, 0.375, pz);
    dieGroup.add(tp);
  });
  return dieGroup;
}

function playLoadedKnucklebonesVFX(col, d1, d2, onLand) {
  const colX = START_X + col * CELL_SPACING;
  const topR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
  const destY = getVisibleRowY(Math.min(ROWS - 1, topR + 1));
  const startY = VFX_MAX_VISIBLE_Y;

  const group = new THREE.Group();
  const die1 = build3DDieMesh(d1, 0xdc2626);
  const die2 = build3DDieMesh(d2, 0xdc2626);
  group.add(die1);
  group.add(die2);

  let landed = false;
  addTimedVFX(group, 820, (p) => {
    if (p < 0.56) {
      const t = p / 0.56;
      const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 1.25;
      const curY = clampVisibleY(startY - (startY - destY) * t + bounce);
      die1.position.set(colX - 0.52, curY, 1.12);
      die2.position.set(colX + 0.52, curY + 0.12, 1.12);
      // Spin to 0 at t=1 so the front pip faces (d1, d2) lock squarely facing the camera!
      const rem = 1 - t;
      die1.rotation.set(rem * Math.PI * 6, rem * Math.PI * 4, rem * Math.PI * 2);
      die2.rotation.set(-rem * Math.PI * 6, -rem * Math.PI * 4, -rem * Math.PI * 2);
    } else {
      die1.rotation.set(0, 0, 0);
      die2.rotation.set(0, 0, 0);
      if (!landed) {
        landed = true;
        triggerBoardShake(d1 + d2 >= 11 ? 0.28 : 0.18);
        spawn3DShockwaveRing(topR, col, d1 + d2 >= 7 ? 0xfde047 : 0xfacc15, 2.7, 480);
        spawn3DParticleBurst(topR, col, 0xfde047, 18, 0.14, 500, 'octa');
        if (typeof onLand === 'function') onLand();
      }
      if (p > 0.78) {
        const fadeP = (p - 0.78) / 0.22;
        const s = Math.max(0.01, 1 - fadeP);
        die1.scale.setScalar(s);
        die2.scale.setScalar(s);
      }
    }
  });
}

// ============================================================================
// 15. BLOODLETTER'S LANCET: Graduated Glass & Brass Hypodermic Syringe
// ============================================================================
function playBloodletterLancetVFX(col, onExtract) {
  const colX = START_X + col * CELL_SPACING;
  const topR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
  const targetY = getVisibleRowY(topR);
  const startY = clampVisibleY(targetY + 1.45);

  const group = new THREE.Group();
  const syringeGroup = new THREE.Group();

  // Tapered Hollow Steel Needle + Stepped Brass Hub
  const tipGeo = new THREE.ConeGeometry(0.07, 0.78, 12);
  tipGeo.rotateX(Math.PI);
  const tip = new THREE.Mesh(tipGeo, C4_VFX_MATS.polishedSteel);
  syringeGroup.add(tip);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.10, 0.22, 12), C4_VFX_MATS.agedBrass);
  hub.position.y = 0.36;
  syringeGroup.add(hub);

  // Transparent Graduated Glass Barrel + 4 Brass Tick Rings
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.12, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef2f2, transparent: true, opacity: 0.36 })
  );
  barrel.position.y = 1.02;
  syringeGroup.add(barrel);

  for (let i = 0; i < 4; i++) {
    const tick = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.022, 8, 20), C4_VFX_MATS.agedBrass);
    tick.rotation.x = Math.PI / 2;
    tick.position.y = 0.62 + i * 0.26;
    syringeGroup.add(tick);
  }

  // Rising Inner Crimson Blood Fluid Column inside the glass barrel
  const bloodFluid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.96, 14),
    C4_VFX_MATS.crimsonRuby
  );
  bloodFluid.position.y = 0.56;
  bloodFluid.scale.set(1, 0.08, 1);
  syringeGroup.add(bloodFluid);

  // Top Brass Cap + Twin Finger Loops + Moving Plunger Rod & Thumb Ring
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 14), C4_VFX_MATS.agedBrass);
  topCap.position.y = 1.60;
  syringeGroup.add(topCap);

  [-0.38, 0.38].forEach((fx) => {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 8, 16), C4_VFX_MATS.agedBrass);
    loop.position.set(fx, 1.60, 0);
    syringeGroup.add(loop);
  });

  const plungerAssembly = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 10), C4_VFX_MATS.polishedSteel);
  rod.position.y = 0.42;
  const thumbRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.038, 8, 18), C4_VFX_MATS.agedBrass);
  thumbRing.position.y = 0.92;
  plungerAssembly.add(rod);
  plungerAssembly.add(thumbRing);
  plungerAssembly.position.y = 1.15;
  syringeGroup.add(plungerAssembly);

  syringeGroup.position.set(colX, startY, 0.98);
  syringeGroup.rotation.z = -0.22;
  group.add(syringeGroup);

  let extracted = false;
  addTimedVFX(group, 780, (p) => {
    if (p < 0.36) {
      const plungeP = Math.pow(p / 0.36, 2);
      syringeGroup.position.y = startY - (startY - targetY) * plungeP;
    } else {
      if (!extracted) {
        extracted = true;
        triggerBoardShake(0.22);
        spawn3DColumnBeam(col, 0xf43f5e, 0.42, 480, true);
        spawn3DShockwaveRing(topR, col, 0xf43f5e, 2.6, 480);
        if (typeof onExtract === 'function') onExtract();
      }
      const siphonP = (p - 0.36) / 0.64;
      const fillAmt = Math.min(1, siphonP * 1.35);
      bloodFluid.scale.set(1, Math.max(0.08, fillAmt), 1);
      bloodFluid.position.y = 0.52 + fillAmt * 0.48;
      plungerAssembly.position.y = 1.15 + fillAmt * 0.62;
      if (siphonP > 0.68) {
        syringeGroup.scale.setScalar(Math.max(0.01, (1 - siphonP) / 0.32));
      }
    }
  });
}

// ============================================================================
// 16. PETRIFIED WOOD BLOCK: Sculpted Bark-Rimmed Tree Trunk & Iron Clamps
// ============================================================================
function playPetrifiedBlockVFX(r, col, onImpact) {
  const pos = getCellWorldPos(r, col, 0.94);
  pos.y = clampVisibleY(pos.y);
  const group = new THREE.Group();

  // Left & Right Half-Log Cross-Sections with Bark Ridges & Growth Rings
  const leftClamp = new THREE.Group();
  const rightClamp = new THREE.Group();
  const jawGeo = new THREE.BoxGeometry(0.56, 0.96, 0.28);
  leftClamp.add(new THREE.Mesh(jawGeo, C4_VFX_MATS.basaltStone));
  rightClamp.add(new THREE.Mesh(jawGeo, C4_VFX_MATS.basaltStone));

  for (let i = -1; i <= 1; i++) {
    const rivetL = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), C4_VFX_MATS.agedBrass);
    rivetL.position.set(-0.18, i * 0.32, 0.16);
    leftClamp.add(rivetL);
    const rivetR = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), C4_VFX_MATS.agedBrass);
    rivetR.position.set(0.18, i * 0.32, 0.16);
    rightClamp.add(rivetR);
  }
  group.add(leftClamp);
  group.add(rightClamp);

  const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 10, 24), C4_VFX_MATS.agedBrass);
  runeRing.position.copy(pos);
  group.add(runeRing);

  let clamped = false;
  addTimedVFX(group, 740, (p) => {
    if (p < 0.48) {
      const t = Math.pow(p / 0.48, 2);
      const offset = (1 - t) * 1.25 + 0.28;
      leftClamp.position.set(pos.x - offset, pos.y, pos.z);
      rightClamp.position.set(pos.x + offset, pos.y, pos.z);
      runeRing.rotation.z = t * Math.PI * 2;
    } else {
      if (!clamped) {
        clamped = true;
        triggerBoardShake(0.24);
        spawn3DShockwaveRing(r, col, 0xa8a29e, 2.5, 460);
        spawn3DParticleBurst(r, col, 0x78716c, 16, 0.13, 460, 'box');
        if (typeof onImpact === 'function') onImpact();
      }
      const fadeP = (p - 0.48) / 0.52;
      const s = Math.max(0.01, 1 - fadeP);
      leftClamp.scale.setScalar(s);
      rightClamp.scale.setScalar(s);
      runeRing.scale.setScalar(1 + fadeP * 0.6);
    }
  });
}

// ============================================================================
// 17. VOLATILE GUANO POULTICE: Double-Bulb Alchemical Gourd Amphora
// ============================================================================
function playGuanoPoulticeVFX(col, targetR, onImpact) {
  const colX = START_X + col * CELL_SPACING;
  const destRow = targetR !== -1 ? targetR : Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
  const destY = getVisibleRowY(destRow);
  const topY = clampVisibleY(destY + 1.55);

  const group = new THREE.Group();
  const gourd = new THREE.Group();
  // Double-bulbous gourd body + woven brass waist strap + twin handles + spout
  const lowerBulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 2), C4_VFX_MATS.emeraldJade);
  const upperBulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 2), C4_VFX_MATS.emeraldJade);
  upperBulb.position.y = 0.48;
  const waistBelt = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.055, 10, 20), C4_VFX_MATS.agedBrass);
  waistBelt.rotation.x = Math.PI / 2;
  waistBelt.position.y = 0.26;
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.34, 12), C4_VFX_MATS.agedBrass);
  spout.position.y = 0.82;
  gourd.add(lowerBulb);
  gourd.add(upperBulb);
  gourd.add(waistBelt);
  gourd.add(spout);

  [-0.36, 0.36].forEach((hx) => {
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16), C4_VFX_MATS.agedBrass);
    ear.position.set(hx, 0.38, 0);
    gourd.add(ear);
  });

  gourd.position.set(colX + 0.42, topY, 0.98);
  group.add(gourd);

  const globules = [];
  const globGeo = new THREE.OctahedronGeometry(0.16, 1);
  for (let i = 0; i < 14; i++) {
    const gMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xa3e635 : 0xf97316,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const glob = new THREE.Mesh(globGeo, gMat);
    group.add(glob);
    globules.push(glob);
  }

  let impacted = false;
  addTimedVFX(group, 760, (p) => {
    gourd.rotation.z = Math.min(2.15, p * 4.2);
    globules.forEach((g, idx) => {
      const localP = Math.max(0, Math.min(1, (p - idx * 0.03) / 0.65));
      g.position.set(
        colX + Math.sin(localP * Math.PI * 2 + idx) * 0.22,
        clampVisibleY(topY - (topY - destY) * (localP * localP)),
        0.95
      );
      g.rotation.x += 0.22;
      g.material.opacity = 1 - p;
    });
    if (p >= 0.50 && !impacted) {
      impacted = true;
      triggerBoardShake(0.20);
      if (typeof onImpact === 'function') onImpact();
    }
    if (p > 0.72) {
      gourd.scale.setScalar(Math.max(0.01, (1 - p) / 0.28));
    }
  });
}

// ============================================================================
// 18. RUSTED BEAR TRAP: Curved Semicircular Serrated Jaws, Trip-Pan & Springs
// ============================================================================
function playRustyBearTrapVFX(r, col, isSnapKill, onSnap) {
  const pos = getCellWorldPos(Math.max(0, r), col, 0.96);
  pos.y = clampVisibleY(pos.y);
  const group = new THREE.Group();
  group.position.copy(pos);

  // Central Circular Brass Trip-Pan + Crossbar + Side Leaf Springs
  const tripPan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.07, 18),
    isSnapKill ? C4_VFX_MATS.crimsonRuby : C4_VFX_MATS.agedBrass
  );
  tripPan.rotation.x = Math.PI / 2;
  group.add(tripPan);

  const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 0.18), C4_VFX_MATS.rustedIron);
  group.add(baseFrame);

  [-0.78, 0.78].forEach((sx) => {
    const spring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.055, 8, 16, Math.PI),
      C4_VFX_MATS.agedBrass
    );
    spring.position.set(sx, 0, 0);
    spring.rotation.z = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(spring);
  });

  // Two Hinged Semicircular Serrated Steel Jaws (Upper & Lower Curved Half-Arches)
  const buildCurvedSerratedJaw = (isUpper) => {
    const jaw = new THREE.Group();
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.09, 10, 24, Math.PI),
      C4_VFX_MATS.polishedSteel
    );
    if (!isUpper) arch.rotation.z = Math.PI;
    jaw.add(arch);

    const toothGeo = new THREE.ConeGeometry(0.085, 0.28, 5);
    for (let i = 1; i <= 6; i++) {
      const ang = (i / 7) * Math.PI + (isUpper ? 0 : Math.PI);
      const tooth = new THREE.Mesh(toothGeo, C4_VFX_MATS.polishedSteel);
      tooth.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.62, 0.06);
      tooth.rotation.z = ang + Math.PI / 2;
      jaw.add(tooth);
    }
    return jaw;
  };

  const upperJaw = buildCurvedSerratedJaw(true);
  const lowerJaw = buildCurvedSerratedJaw(false);
  group.add(upperJaw);
  group.add(lowerJaw);

  let snapped = false;
  addTimedVFX(group, 760, (p) => {
    if (p < 0.48) {
      const ease = Math.pow(p / 0.48, 3);
      const openScale = 1 - ease * 0.68;
      upperJaw.position.y = (1 - ease) * 0.35;
      lowerJaw.position.y = -(1 - ease) * 0.35;
      upperJaw.rotation.x = -(1 - openScale) * 1.15;
      lowerJaw.rotation.x = (1 - openScale) * 1.15;
    } else {
      if (!snapped) {
        snapped = true;
        triggerBoardShake(isSnapKill ? 0.30 : 0.20);
        spawn3DShockwaveRing(Math.max(0, r), col, isSnapKill ? 0xef4444 : 0xa855f7, 2.7, 460);
        spawn3DParticleBurst(Math.max(0, r), col, isSnapKill ? 0xfacc15 : 0xc084fc, 18, 0.14, 480, 'octa');
        if (typeof onSnap === 'function') onSnap();
      }
      const fadeP = (p - 0.48) / 0.52;
      group.scale.setScalar(Math.max(0.01, 1 - fadeP));
    }
  });
}

// ============================================================================
// 19. SPLIT WISHBONE: Anatomically Curved Multi-Segment Avian Furcula
// ============================================================================
function buildWishboneHalf(dir) {
  const half = new THREE.Group();
  // 4 curved, tapered bone segments + condyle knuckle at the base + central crest tab
  const segCoords = [
    { x: dir * 0.10, y: 0.52, rot: -dir * 0.28, rTop: 0.11, rBot: 0.13, len: 0.44 },
    { x: dir * 0.28, y: 0.18, rot: -dir * 0.48, rTop: 0.12, rBot: 0.10, len: 0.46 },
    { x: dir * 0.44, y: -0.22, rot: -dir * 0.22, rTop: 0.10, rBot: 0.08, len: 0.46 },
    { x: dir * 0.48, y: -0.62, rot: dir * 0.08, rTop: 0.08, rBot: 0.11, len: 0.42 }
  ];
  segCoords.forEach((s) => {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(s.rTop, s.rBot, s.len, 12),
      C4_VFX_MATS.boneIvory
    );
    seg.position.set(s.x, s.y, 0);
    seg.rotation.z = s.rot;
    half.add(seg);
  });
  const knuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), C4_VFX_MATS.boneIvory);
  knuckle.position.set(dir * 0.48, -0.82, 0);
  half.add(knuckle);

  const crestTab = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.36, 10), C4_VFX_MATS.agedBrass);
  crestTab.position.set(dir * 0.04, 0.78, 0);
  half.add(crestTab);
  return half;
}

function playSplitWishboneVFX(col, matchedHeight, onSnap) {
  const xA = START_X + col * CELL_SPACING;
  const xB = START_X + 3 * CELL_SPACING;
  const midX = (xA + xB) * 0.5;
  const topY = VFX_CENTER_Y + 0.45;

  const group = new THREE.Group();
  const leftHalf = buildWishboneHalf(-1);
  const rightHalf = buildWishboneHalf(1);
  group.add(leftHalf);
  group.add(rightHalf);

  let snapped = false;
  addTimedVFX(group, 780, (p) => {
    if (p < 0.52) {
      const pull = p / 0.52;
      const jitter = Math.sin(pull * Math.PI * 14) * 0.06;
      leftHalf.position.set(midX - pull * 0.18, topY + jitter, 1.05);
      rightHalf.position.set(midX + pull * 0.18, topY - jitter, 1.05);
      leftHalf.rotation.z = pull * 0.28;
      rightHalf.rotation.z = -pull * 0.28;
    } else {
      if (!snapped) {
        snapped = true;
        triggerBoardShake(0.24);
        const effR = Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
        spawn3DShockwaveRing(effR, col, 0xfde047, 2.7, 480);
        spawn3DParticleBurst(effR, col, 0xfacc15, 18, 0.14, 500, 'octa');
        if (typeof onSnap === 'function') onSnap();
      }
      const flyP = (p - 0.52) / 0.48;
      leftHalf.position.x -= 0.09;
      rightHalf.position.x += 0.09;
      leftHalf.rotation.z += 0.18;
      rightHalf.rotation.z -= 0.18;
      const s = Math.max(0.01, 1 - flyP);
      leftHalf.scale.setScalar(s);
      rightHalf.scale.setScalar(s);
    }
  });
}

// ============================================================================
// 20. BOILING TAR PITCH: Riveted Tar Cauldron & 3 Articulated Tar Tentacles
// ============================================================================
function playBoilingTarPitchVFX(col, fromR, toR, onSink) {
  const colX = START_X + col * CELL_SPACING;
  const group = new THREE.Group();

  // Riveted Iron Pitch Cauldron with Side Carry Rings & Bubbling Tar Surface
  const cauldron = new THREE.Group();
  cauldron.position.set(colX, VFX_MIN_VISIBLE_Y, 0.94);
  cauldron.add(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.62, 0.44, 18), C4_VFX_MATS.obsidianPitch));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.065, 10, 24), C4_VFX_MATS.darkIron);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  cauldron.add(rim);
  group.add(cauldron);

  // 3 Multi-Jointed Articulated Tar Tentacles (each has 7 sphere joints)
  const tentacles = [];
  const jointGeo = new THREE.OctahedronGeometry(0.18, 1);
  for (let t = 0; t < 3; t++) {
    const joints = [];
    for (let j = 0; j < 7; j++) {
      const jm = new THREE.Mesh(jointGeo, C4_VFX_MATS.obsidianPitch);
      const scale = 1.15 - j * 0.11;
      jm.scale.setScalar(scale);
      group.add(jm);
      joints.push(jm);
    }
    tentacles.push(joints);
  }

  const targetMesh = fromR !== -1 && state.meshes[fromR] ? state.meshes[fromR][col] : null;
  const startY = getVisibleRowY(fromR);
  const endY = getVisibleRowY(toR);

  let sunk = false;
  addTimedVFX(group, 800, (p) => {
    const reachY = p < 0.58
      ? startY - (startY - endY) * Math.pow(p / 0.58, 2)
      : endY;

    tentacles.forEach((joints, tIdx) => {
      const baseAngle = (tIdx - 1) * 0.38;
      joints.forEach((jm, jIdx) => {
        const frac = jIdx / 6;
        const y = VFX_MIN_VISIBLE_Y + (reachY - VFX_MIN_VISIBLE_Y) * frac;
        const wave = Math.sin(p * Math.PI * 5 + jIdx * 0.7 + tIdx) * 0.24 * frac;
        jm.position.set(colX + baseAngle * (1 - frac * 0.5) + wave, clampVisibleY(y), 0.96);
      });
    });

    if (p < 0.58) {
      if (targetMesh) {
        targetMesh.position.y = reachY;
        targetMesh.position.z = 0.65 * Math.sin((p / 0.58) * Math.PI);
      }
    } else {
      if (!sunk) {
        sunk = true;
        triggerBoardShake(0.24);
        spawn3DShockwaveRing(Math.max(0, toR), col, 0xa855f7, 2.6, 480);
        spawn3DParticleBurst(Math.max(0, toR), col, 0xc084fc, 16, 0.13, 480, 'octa');
        if (typeof onSink === 'function') onSink();
      }
      const fadeP = (p - 0.58) / 0.42;
      group.scale.setScalar(Math.max(0.01, 1 - fadeP));
    }
  });
}

// ============================================================================
// 21. SPICY MISO HIBACHI FLARE: Cast-Iron Hibachi Grate, Coals & Skewers
// ============================================================================
function playHibachiFlareVFX(r, col, hasAiTarget, onSear) {
  const colX = START_X + col * CELL_SPACING;
  const targetR = Math.max(0, r);
  const targetY = getVisibleRowY(targetR);

  const group = new THREE.Group();
  const grillGroup = new THREE.Group();
  grillGroup.position.set(colX, VFX_MIN_VISIBLE_Y, 0.94);

  // Cast-iron firebox + brass handles + 5 iron grill bars + glowing embers
  grillGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.36, 0.68), C4_VFX_MATS.darkIron));
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.66, 8), C4_VFX_MATS.polishedSteel);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(i * 0.24, 0.20, 0);
    grillGroup.add(bar);
  }
  [-0.70, 0.70].forEach((hx) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 14), C4_VFX_MATS.agedBrass);
    handle.position.set(hx, 0.06, 0);
    grillGroup.add(handle);
  });
  group.add(grillGroup);

  const flames = [];
  const flameGeo = new THREE.ConeGeometry(0.24, 0.62, 6);
  for (let i = 0; i < 16; i++) {
    const fMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xf97316 : 0xfde047,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const fl = new THREE.Mesh(flameGeo, fMat);
    group.add(fl);
    flames.push(fl);
  }

  let seared = false;
  addTimedVFX(group, 780, (p) => {
    flames.forEach((fl, idx) => {
      const ang = (idx / 16) * Math.PI * 2 + p * Math.PI * 6;
      const rad = 0.46 * (1 - p * 0.35);
      const yPos = clampVisibleY(VFX_MIN_VISIBLE_Y + ((idx / 16 + p * 1.5) % 1) * (targetY - VFX_MIN_VISIBLE_Y + 1.4));
      fl.position.set(colX + Math.cos(ang) * rad, yPos, 0.96 + Math.sin(ang) * 0.28);
      fl.rotation.z = Math.sin(ang) * 0.35;
      fl.material.opacity = 1 - p;
    });
    if (p >= 0.52 && !seared) {
      seared = true;
      triggerBoardShake(hasAiTarget ? 0.26 : 0.18);
      spawn3DColumnBeam(col, 0xf97316, 0.45, 480, true);
      if (hasAiTarget) {
        spawn3DShockwaveRing(targetR, col, 0xef4444, 2.7, 480);
        spawn3DParticleBurst(targetR, col, 0xf97316, 22, 0.15, 520, 'cone');
      }
      if (typeof onSear === 'function') onSear();
    }
    if (p > 0.72) {
      grillGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.28));
    }
  });
}

// ============================================================================
// 22. WEIGHTED GUILLOTINE: French Guillotine with Lunette Stock & Bevel Blade
// ============================================================================
function playGuillotineBladeVFX(col, topR, onChop) {
  const colX = START_X + col * CELL_SPACING;
  const targetY = getVisibleRowY(topR);
  const frameTopY = VFX_MAX_VISIBLE_Y;
  const frameBotY = VFX_MIN_VISIBLE_Y;
  const frameHeight = frameTopY - frameBotY;

  const group = new THREE.Group();

  // Twin Grooved Timber Uprights + Top Crown Crossbeam + Brass Pulley Wheel
  const postGeo = new THREE.BoxGeometry(0.18, frameHeight, 0.26);
  const leftPost = new THREE.Mesh(postGeo, carvedWoodMat);
  const rightPost = new THREE.Mesh(postGeo, carvedWoodMat);
  leftPost.position.set(colX - 0.64, VFX_CENTER_Y, 0.90);
  rightPost.position.set(colX + 0.64, VFX_CENTER_Y, 0.90);
  group.add(leftPost);
  group.add(rightPost);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.28, 0.34), C4_VFX_MATS.agedBrass);
  crossbar.position.set(colX, frameTopY, 0.92);
  group.add(crossbar);

  const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 18), C4_VFX_MATS.agedBrass);
  pulley.position.set(colX, frameTopY - 0.18, 1.02);
  group.add(pulley);

  // Two-Piece Wooden Lunette Neck-Stock at targetY with Circular Head Opening
  const lunette = new THREE.Group();
  lunette.position.set(colX, targetY, 0.92);
  lunette.add(new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 0.18), carvedWoodMat));
  lunette.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 10, 20), C4_VFX_MATS.darkIron));
  group.add(lunette);

  // Weighted Brass Mouton + True Angled Trapezoidal Steel Guillotine Blade
  const bladeAssembly = new THREE.Group();
  const mouton = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.24, 0.22), C4_VFX_MATS.agedBrass);
  mouton.position.y = 0.28;
  bladeAssembly.add(mouton);

  const upperBlade = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.36, 0.08), C4_VFX_MATS.polishedSteel);
  bladeAssembly.add(upperBlade);

  // Steep diagonal bevelled cutting edge along the bottom of the blade
  const bevelEdge = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.26, 0.09),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  bevelEdge.position.set(0, -0.20, 0.01);
  bevelEdge.rotation.z = -0.32;
  bladeAssembly.add(bevelEdge);

  bladeAssembly.position.set(colX, frameTopY - 0.45, 0.98);
  group.add(bladeAssembly);

  let chopped = false;
  addTimedVFX(group, 800, (p) => {
    if (p < 0.50) {
      const fallP = Math.pow(p / 0.50, 3);
      bladeAssembly.position.y = (frameTopY - 0.45) - ((frameTopY - 0.45) - targetY) * fallP;
    } else {
      if (!chopped) {
        chopped = true;
        triggerBoardShake(0.32);
        spawn3DColumnBeam(col, 0xf43f5e, 0.45, 480, true);
        spawn3DShockwaveRing(topR, col, 0xf43f5e, 2.8, 500);
        spawn3DParticleBurst(topR, col, 0xe2e8f0, 20, 0.15, 500, 'box');
        if (typeof onChop === 'function') onChop();
      }
      const fadeP = (p - 0.50) / 0.50;
      const s = Math.max(0.01, 1 - fadeP);
      group.scale.setScalar(s);
    }
  });
}

// ============================================================================
// 23. QUICKSILVER SIPHON: Copper-Ringed Alembic Conduit & Liquid Mercury Stream
// ============================================================================
function playQuicksilverSiphonVFX(srcR, srcCol, destR, destCol, onTransfer) {
  const x0 = START_X + srcCol * CELL_SPACING;
  const y0 = getVisibleRowY(srcR);
  const x1 = START_X + destCol * CELL_SPACING;
  const y1 = getVisibleRowY(destR);
  const peakY = clampVisibleY(Math.max(y0, y1) + 1.45);

  const group = new THREE.Group();

  // 7 Copper Condenser Rings outlining the arched siphon tube
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const rx = x0 + (x1 - x0) * t;
    const ry = clampVisibleY((1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peakY + t * t * y1);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 18), C4_VFX_MATS.burnishedCopper);
    collar.position.set(rx, ry, 0.94);
    collar.rotation.y = Math.PI / 3;
    group.add(collar);
  }

  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 2), C4_VFX_MATS.quicksilverChrome);
  group.add(orb);

  const trailDots = [];
  for (let i = 0; i < 8; i++) {
    const td = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 2), C4_VFX_MATS.quicksilverChrome);
    group.add(td);
    trailDots.push(td);
  }

  let transferred = false;
  addTimedVFX(group, 780, (p) => {
    const t = Math.min(1, p / 0.68);
    const curX = x0 + (x1 - x0) * t;
    const curY = clampVisibleY((1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * peakY + t * t * y1);
    orb.position.set(curX, curY, 0.98);
    orb.rotation.z += 0.25;

    trailDots.forEach((td, idx) => {
      const tp = Math.max(0, t - (idx + 1) * 0.06);
      const tx = x0 + (x1 - x0) * tp;
      const ty = clampVisibleY((1 - tp) * (1 - tp) * y0 + 2 * (1 - tp) * tp * peakY + tp * tp * y1);
      td.position.set(tx, ty, 0.96);
      td.scale.setScalar(Math.max(0.01, (1 - idx * 0.11) * (1 - p)));
    });

    if (p >= 0.68 && !transferred) {
      transferred = true;
      triggerBoardShake(0.22);
      spawn3DShockwaveRing(destR, destCol, 0x38bdf8, 2.6, 480);
      spawn3DParticleBurst(destR, destCol, 0xe2e8f0, 16, 0.13, 480, 'octa');
      if (typeof onTransfer === 'function') onTransfer();
    }
    if (p > 0.72) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.28));
    }
  });
}

// ============================================================================
// 24. RAVENOUS MIMIC TOOTH: Barrel-Vaulted Treasure Chest with Fangs & Tongue
// ============================================================================
function playMimicToothVFX(col, targetRows, onChomp) {
  const colX = START_X + col * CELL_SPACING;
  const focusRow = targetRows.length > 0 ? targetRows[0] : Math.max(0, aiEngine.getTopOccupiedRow(state.board, col));
  const focusY = getVisibleRowY(focusRow);

  const group = new THREE.Group();
  group.position.set(colX, focusY, 0.98);

  // Upper Vaulted Chest Lid + Brass Straps + 2 Glowing Eyes + 7 Upper Ivory Fangs
  const topJaw = new THREE.Group();
  topJaw.add(new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.38, 0.68), carvedWoodMat));
  [-0.48, 0.48].forEach((bx) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.72), C4_VFX_MATS.agedBrass);
    strap.position.x = bx;
    topJaw.add(strap);

    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 1), C4_VFX_MATS.beeswaxGold);
    eye.position.set(bx * 0.65, 0.12, 0.36);
    topJaw.add(eye);
  });

  // Lower Chest Base + Gold Lockplate + Curling Crimson Tongue + 7 Lower Fangs
  const botJaw = new THREE.Group();
  botJaw.add(new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.38, 0.68), carvedWoodMat));
  const lockplate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.72), C4_VFX_MATS.agedBrass);
  botJaw.add(lockplate);

  const tongue = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.11, 8, 16, Math.PI * 0.85),
    C4_VFX_MATS.crimsonRuby
  );
  tongue.position.set(0, 0.22, 0.24);
  botJaw.add(tongue);

  const fangGeo = new THREE.ConeGeometry(0.10, 0.34, 6);
  for (let i = -2.5; i <= 2.5; i += 1) {
    const uf = new THREE.Mesh(fangGeo, C4_VFX_MATS.boneIvory);
    uf.rotation.x = Math.PI;
    uf.position.set(i * 0.21, -0.26, 0.24);
    topJaw.add(uf);

    const lf = new THREE.Mesh(fangGeo, C4_VFX_MATS.boneIvory);
    lf.position.set(i * 0.21, 0.26, 0.24);
    botJaw.add(lf);
  }
  group.add(topJaw);
  group.add(botJaw);

  let chomped = false;
  addTimedVFX(group, 800, (p) => {
    const chompWave = Math.abs(Math.cos(p * Math.PI * 3.5));
    topJaw.position.y = 0.20 + chompWave * 0.52;
    topJaw.rotation.x = -chompWave * 0.45;
    botJaw.position.y = -0.20 - chompWave * 0.52;
    botJaw.rotation.x = chompWave * 0.35;
    tongue.rotation.z = Math.sin(p * Math.PI * 8) * 0.35;

    if (p >= 0.50 && !chomped) {
      chomped = true;
      triggerBoardShake(0.28);
      targetRows.forEach((tr) => {
        spawn3DShockwaveRing(tr, col, 0xfacc15, 2.6, 480);
        spawn3DParticleBurst(tr, col, 0xfde047, 18, 0.14, 500, 'octa');
      });
      if (typeof onChomp === 'function') onChomp();
    }
    if (p > 0.75) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.25));
    }
  });
}

// ============================================================================
// 25. SWINGING PENDULUM SCYTHE: Clockwork Gear Hub & Dual-Bevel Crescent Scythe
// ============================================================================
function playPendulumScytheVFX(targetRow, hitCols, onSlice) {
  const pivotX = 0;
  const pivotY = VFX_MAX_VISIBLE_Y;
  const rowY = getVisibleRowY(targetRow);
  const armLen = Math.max(1.8, pivotY - rowY);

  const group = new THREE.Group();
  const pendulumPivot = new THREE.Group();
  pendulumPivot.position.set(pivotX, pivotY, 0.96);

  // Clockwork Escapement Gear Wheel at Pivot
  const gearRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 10, 20), C4_VFX_MATS.agedBrass);
  pendulumPivot.add(gearRim);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const cog = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.14), C4_VFX_MATS.agedBrass);
    cog.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, 0);
    cog.rotation.z = ang;
    pendulumPivot.add(cog);
  }

  // Riveted Pendulum Shaft + Brass Counterweight Collar
  const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, armLen, 10);
  rodGeo.translate(0, -armLen * 0.5, 0);
  pendulumPivot.add(new THREE.Mesh(rodGeo, C4_VFX_MATS.darkIron));

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.28, 12), C4_VFX_MATS.agedBrass);
  collar.position.set(0, -armLen + 0.35, 0);
  pendulumPivot.add(collar);

  // Dual-Bevelled Crescent Executioner's Blade (Outer Razor Edge + Dark Spine Rib)
  const bladeEdge = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.14, 10, 28, Math.PI * 0.92),
    C4_VFX_MATS.polishedSteel
  );
  bladeEdge.position.set(0, -armLen + 0.42, 0);
  bladeEdge.rotation.z = Math.PI * 1.04;
  pendulumPivot.add(bladeEdge);

  const bladeSpine = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.08, 8, 24, Math.PI * 0.86),
    C4_VFX_MATS.agedBrass
  );
  bladeSpine.position.set(0, -armLen + 0.42, 0.04);
  bladeSpine.rotation.z = Math.PI * 1.07;
  pendulumPivot.add(bladeSpine);

  group.add(pendulumPivot);

  let sliced = false;
  addTimedVFX(group, 820, (p) => {
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    pendulumPivot.rotation.z = -1.15 + ease * 2.30;

    if (p >= 0.48 && !sliced) {
      sliced = true;
      triggerBoardShake(0.30);
      hitCols.forEach((c) => {
        spawn3DShockwaveRing(targetRow, c, 0x2dd4bf, 2.7, 500);
        spawn3DParticleBurst(targetRow, c, 0xe2e8f0, 18, 0.14, 500, 'box');
      });
      if (typeof onSlice === 'function') onSlice();
    }
    if (p > 0.78) {
      pendulumPivot.scale.setScalar(Math.max(0.01, (1 - p) / 0.22));
    }
  });
}

// ============================================================================
// 26. PINS & WAX EFFIGY: Sculpted Voodoo Doll with Button Eyes & Stitched Heart
// ============================================================================
function playWaxEffigyVFX(aiRow, col, neighborCol, onHex) {
  const pos = getCellWorldPos(aiRow, col, 0.98);
  pos.y = clampVisibleY(pos.y);
  const group = new THREE.Group();
  group.position.copy(pos);

  // Sculpted Humanoid Wax Effigy (Head + Button Eyes + Torso + Stitched Heart + 4 Limbs)
  const doll = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.72, 14), C4_VFX_MATS.beeswaxGold);
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.30, 2), C4_VFX_MATS.beeswaxGold);
  head.position.y = 0.58;
  doll.add(torso);
  doll.add(head);

  // Button eyes + crimson heart on chest
  [-0.11, 0.11].forEach((ex) => {
    const btnEye = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 10), C4_VFX_MATS.obsidianPitch);
    btnEye.rotation.x = Math.PI / 2;
    btnEye.position.set(ex, 0.62, 0.26);
    doll.add(btnEye);
  });
  const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 1), C4_VFX_MATS.crimsonRuby);
  heart.position.set(-0.08, 0.12, 0.28);
  doll.add(heart);

  // Outstretched Arms & Legs
  [-1, 1].forEach((dir) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.52, 10), C4_VFX_MATS.beeswaxGold);
    arm.position.set(dir * 0.44, 0.14, 0);
    arm.rotation.z = dir * 1.15;
    doll.add(arm);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.52, 10), C4_VFX_MATS.beeswaxGold);
    leg.position.set(dir * 0.20, -0.52, 0);
    leg.rotation.z = dir * 0.28;
    doll.add(leg);
  });
  group.add(doll);

  // 3 Jewel-Headed Voodoo Needles (Ruby, Sapphire, Amethyst)
  const buildVoodooPin = (headMat, zAngle) => {
    const pin = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.008, 1.15, 8), C4_VFX_MATS.polishedSteel);
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), headMat);
    jewel.position.y = 0.58;
    pin.add(shaft);
    pin.add(jewel);
    pin.rotation.z = zAngle;
    return pin;
  };
  const pin1 = buildVoodooPin(C4_VFX_MATS.crimsonRuby, 0.85);
  const pin2 = buildVoodooPin(C4_VFX_MATS.quicksilverChrome, -0.85);
  const pin3 = buildVoodooPin(C4_VFX_MATS.agedBrass, 0.25);
  group.add(pin1);
  group.add(pin2);
  group.add(pin3);

  let hexed = false;
  addTimedVFX(group, 800, (p) => {
    doll.rotation.y = Math.sin(p * Math.PI * 4) * 0.45;
    if (p < 0.48) {
      const d = (1 - p / 0.48) * 1.05;
      pin1.position.set(-d, d, 0.18);
      pin2.position.set(d, d, 0.18);
      pin3.position.set(0, d * 1.15, 0.22);
    } else {
      if (!hexed) {
        hexed = true;
        triggerBoardShake(0.24);
        spawn3DShockwaveRing(aiRow, col, 0xe879f9, 2.7, 500);
        spawn3DParticleBurst(aiRow, col, 0xfde047, 18, 0.14, 500, 'octa');
        const nr = Math.max(0, aiEngine.getAvailableRow(state.board, neighborCol));
        spawn3DShockwaveRing(nr, neighborCol, 0xa855f7, 2.5, 500);
        if (typeof onHex === 'function') onHex();
      }
      const fadeP = (p - 0.48) / 0.52;
      group.scale.setScalar(Math.max(0.01, 1 - fadeP));
    }
  });
}

// ============================================================================
// 27. SURREALIST TRANSMUTE: 3-Axis Engraved Brass Armillary Sphere
// ============================================================================
function playSurrealTransmuteVFX(topR, col, onWarp) {
  const pos = getCellWorldPos(topR, col, 0.94);
  pos.y = clampVisibleY(pos.y);
  const group = new THREE.Group();
  group.position.copy(pos);

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.065, 12, 32), C4_VFX_MATS.agedBrass);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.055, 12, 32), C4_VFX_MATS.polishedSteel);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.045, 12, 28), C4_VFX_MATS.crimsonRuby);
  group.add(ring1);
  group.add(ring2);
  group.add(ring3);

  const targetMesh = state.meshes[topR] && state.meshes[topR][col];
  let warped = false;

  addTimedVFX(group, 760, (p) => {
    ring1.rotation.set(p * Math.PI * 3, p * Math.PI * 4, 0);
    ring2.rotation.set(0, -p * Math.PI * 5, p * Math.PI * 3);
    ring3.rotation.set(p * Math.PI * 4, 0, -p * Math.PI * 4);

    if (targetMesh && p < 0.52) {
      const twist = Math.sin((p / 0.52) * Math.PI);
      targetMesh.scale.set(1 + twist * 0.45, Math.max(0.25, 1 - twist * 0.7), 1);
      targetMesh.rotation.z = p * Math.PI * 2;
    } else if (!warped) {
      warped = true;
      if (targetMesh) {
        targetMesh.scale.set(1, 1, 1);
        targetMesh.rotation.set(0, 0, 0);
      }
      triggerBoardShake(0.22);
      spawn3DShockwaveRing(topR, col, 0xe879f9, 2.8, 500);
      spawn3DParticleBurst(topR, col, 0xfde047, 18, 0.14, 500, 'octa');
      if (typeof onWarp === 'function') onWarp();
    }
    if (p > 0.72) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.28));
    }
  });
}

// ============================================================================
// 28. SUBTERRANEAN ECHO DROP: Twin U-Shaped 3D Brass Tuning Forks
// ============================================================================
function buildTuningForkMesh() {
  const fork = new THREE.Group();
  // Bottom stem + semicircular U-yoke + twin parallel rectangular tines
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.52, 10), C4_VFX_MATS.agedBrass);
  stem.position.y = -0.62;
  const yoke = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.055, 10, 18, Math.PI),
    C4_VFX_MATS.agedBrass
  );
  yoke.rotation.z = Math.PI;
  yoke.position.y = -0.18;
  fork.add(stem);
  fork.add(yoke);

  [-0.22, 0.22].forEach((tx) => {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 0.11), C4_VFX_MATS.polishedSteel);
    tine.position.set(tx, 0.34, 0);
    fork.add(tine);
  });
  return fork;
}

function playEchoTwinDropVFX(r1, r2, col, onDrop) {
  const colX = START_X + col * CELL_SPACING;
  const midY = getVisibleRowY(r1);

  const group = new THREE.Group();
  const leftFork = buildTuningForkMesh();
  const rightFork = buildTuningForkMesh();
  leftFork.position.set(colX - 0.72, midY, 0.94);
  rightFork.position.set(colX + 0.72, midY, 0.94);
  group.add(leftFork);
  group.add(rightFork);

  spawn3DColumnBeam(col, 0xf59e0b, 0.45, 560, true);

  let dropped = false;
  addTimedVFX(group, 760, (p) => {
    const vib = Math.sin(p * Math.PI * 22) * 0.12 * (1 - p);
    leftFork.position.x = colX - 0.72 + vib;
    rightFork.position.x = colX + 0.72 - vib;
    if (p >= 0.42 && !dropped) {
      dropped = true;
      spawn3DShockwaveRing(r1, col, 0xfbbf24, 2.4, 460);
      if (r2 !== -1) spawn3DShockwaveRing(r2, col, 0xfde047, 2.7, 520);
      if (typeof onDrop === 'function') onDrop();
    }
    const s = Math.max(0.01, 1 - Math.max(0, (p - 0.65) / 0.35));
    leftFork.scale.setScalar(s);
    rightFork.scale.setScalar(s);
  });
}

// ============================================================================
// 29. STEAM HYDRAULIC PISTON: Copper Boilers, Pressure Gauges & Chrome Rams
// ============================================================================
function buildSteamPistonAssembly(dir) {
  const asm = new THREE.Group();
  const boilerGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.15, 16);
  boilerGeo.rotateZ(Math.PI / 2);
  asm.add(new THREE.Mesh(boilerGeo, C4_VFX_MATS.burnishedCopper));

  [-0.42, 0, 0.42].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.045, 8, 20), C4_VFX_MATS.agedBrass);
    band.rotation.y = Math.PI / 2;
    band.position.x = bx;
    asm.add(band);
  });

  // Top Pressure Gauge Dial
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14), C4_VFX_MATS.boneIvory);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0, 0.48, 0.12);
  asm.add(gauge);

  // Telescoping Chrome Rod + Flanged C-Clamp Ram Plate
  const rodGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.85, 12);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, C4_VFX_MATS.polishedSteel);
  rod.position.x = dir * 0.65;
  asm.add(rod);

  const ramPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.92, 0.56), C4_VFX_MATS.agedBrass);
  ramPlate.position.x = dir * 1.05;
  asm.add(ramPlate);
  return asm;
}

function playSteamHydraulicPistonVFX(colA, colB, onSwap) {
  const xA = START_X + colA * CELL_SPACING;
  const xB = START_X + colB * CELL_SPACING;
  const centerY = VFX_CENTER_Y;
  const dir = xB >= xA ? 1 : -1;

  const group = new THREE.Group();
  const pistonA = buildSteamPistonAssembly(dir);
  const pistonB = buildSteamPistonAssembly(-dir);
  pistonA.position.set(xA - dir * 0.55, centerY + 0.65, 0.96);
  pistonB.position.set(xB + dir * 0.55, centerY - 0.65, 0.96);
  group.add(pistonA);
  group.add(pistonB);

  const meshesA = [];
  const meshesB = [];
  for (let r = 0; r < ROWS; r++) {
    if (state.meshes[r] && state.meshes[r][colA]) meshesA.push(state.meshes[r][colA]);
    if (state.meshes[r] && state.meshes[r][colB]) meshesB.push(state.meshes[r][colB]);
  }

  let swapped = false;
  addTimedVFX(group, 820, (p) => {
    if (p < 0.62) {
      const ease = p / 0.62;
      const curXA = xA + (xB - xA) * ease;
      const curXB = xB + (xA - xB) * ease;
      pistonA.position.x = curXA - dir * 0.55;
      pistonB.position.x = curXB + dir * 0.55;
      meshesA.forEach((m) => {
        m.position.x = curXA;
        m.position.z = 0.65 * Math.sin(ease * Math.PI);
      });
      meshesB.forEach((m) => {
        m.position.x = curXB;
        m.position.z = -0.45 * Math.sin(ease * Math.PI);
      });
    } else {
      if (!swapped) {
        swapped = true;
        triggerBoardShake(0.28);
        spawn3DColumnBeam(colA, 0xfbbf24, 0.40, 480, false);
        spawn3DColumnBeam(colB, 0x38bdf8, 0.40, 480, false);
        if (typeof onSwap === 'function') onSwap();
      }
      const fadeP = (p - 0.62) / 0.38;
      pistonA.scale.setScalar(Math.max(0.01, 1 - fadeP));
      pistonB.scale.setScalar(Math.max(0.01, 1 - fadeP));
    }
  });
}

// ============================================================================
// 30. OUROBOROS WORLD-EATER: 24-Segment Articulated Emerald Dragon-Serpent
// ============================================================================
function playOuroborosWorldEaterVFX(col, spanCols, onCycle) {
  const colX = START_X + col * CELL_SPACING;
  const centerY = VFX_CENTER_Y;

  const group = new THREE.Group();
  group.position.set(colX, centerY, 0.98);

  const serpentWheel = new THREE.Group();
  const radius = 1.88;
  const numSegs = 22;

  // 22 Tapered Vertebral Scale Segments + Golden Belly Plates + Spiky Dorsal Fins
  for (let i = 0; i < numSegs; i++) {
    const frac = i / numSegs;
    const ang = frac * Math.PI * 1.88;
    const thickness = 0.34 * (1 - frac * 0.62);

    const segGroup = new THREE.Group();
    segGroup.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
    segGroup.rotation.z = ang + Math.PI / 2;

    const scaleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(thickness * 0.88, thickness, 0.46, 10),
      i % 2 === 0 ? C4_VFX_MATS.emeraldJade : C4_VFX_MATS.agedBrass
    );
    segGroup.add(scaleMesh);

    const dorsalSpike = new THREE.Mesh(
      new THREE.ConeGeometry(thickness * 0.35, thickness * 1.15, 5),
      C4_VFX_MATS.agedBrass
    );
    dorsalSpike.rotation.z = -Math.PI / 2;
    dorsalSpike.position.x = thickness * 1.1;
    segGroup.add(dorsalSpike);

    serpentWheel.add(segGroup);
  }

  // Sculpted Horned Dragon-Serpent Head at angle 0 biting its own tail
  const headGroup = new THREE.Group();
  headGroup.position.set(radius, 0, 0.08);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.48), C4_VFX_MATS.emeraldJade);
  headGroup.add(skull);

  [-0.22, 0.22].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), C4_VFX_MATS.crimsonRuby);
    eye.position.set(ex, 0.12, 0.24);
    headGroup.add(eye);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.48, 6), C4_VFX_MATS.agedBrass);
    horn.position.set(ex * 1.2, -0.28, 0.16);
    horn.rotation.x = -0.45;
    headGroup.add(horn);

    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 5), C4_VFX_MATS.boneIvory);
    fang.position.set(ex * 0.75, 0.42, 0.14);
    headGroup.add(fang);
  });
  serpentWheel.add(headGroup);
  group.add(serpentWheel);

  let cycled = false;
  addTimedVFX(group, 860, (p) => {
    serpentWheel.rotation.z = -p * Math.PI * 3.2;
    if (p >= 0.52 && !cycled) {
      cycled = true;
      triggerBoardShake(0.30);
      spanCols.forEach((c) => {
        spawn3DShockwaveRing(0, c, 0x4ade80, 2.6, 480);
      });
      if (typeof onCycle === 'function') onCycle();
    }
    if (p > 0.75) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.25));
    }
  });
}

// ============================================================================
// 31. CROUPIER'S RIGGED JACKPOT: 3-Reel Slot Machine with Working Pull-Lever
// ============================================================================
function playCroupierJackpotVFX(col, targetR, onJackpot) {
  const colX = START_X + col * CELL_SPACING;
  const reelY = VFX_CENTER_Y + 0.95;

  const group = new THREE.Group();
  const machine = new THREE.Group();
  machine.position.set(colX, reelY, 1.05);

  // Ornate Crimson-and-Brass Cabinet + Arched Marquee Top
  machine.add(new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.04, 0.48), C4_VFX_MATS.crimsonRuby));
  machine.add(new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.16, 0.56), C4_VFX_MATS.agedBrass));
  const marquee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 1.68, 16, 1, false, 0, Math.PI),
    C4_VFX_MATS.agedBrass
  );
  marquee.rotation.z = Math.PI / 2;
  marquee.position.y = 0.52;
  machine.add(marquee);

  // 3 Spinning Ivory Slot Reels with Brass Divider Rings
  const wheels = [];
  for (let i = -1; i <= 1; i++) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16),
      C4_VFX_MATS.boneIvory
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(i * 0.46, 0, 0.16);
    const bar7 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.12), C4_VFX_MATS.crimsonRuby);
    bar7.position.z = 0.38;
    wheel.add(bar7);
    machine.add(wheel);
    wheels.push(wheel);
  }

  // Working Side Pull-Lever on the Right Side
  const leverPivot = new THREE.Group();
  leverPivot.position.set(0.96, -0.15, 0.12);
  const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.85, 10), C4_VFX_MATS.polishedSteel);
  leverArm.position.y = 0.42;
  const leverKnob = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 2), C4_VFX_MATS.crimsonRuby);
  leverKnob.position.y = 0.86;
  leverPivot.add(leverArm);
  leverPivot.add(leverKnob);
  machine.add(leverPivot);
  group.add(machine);

  const coins = [];
  for (let i = 0; i < 16; i++) {
    const cMesh = buildSculptedCoinMesh(true, 0.28);
    cMesh.userData = {
      x: START_X + (i % COLS) * CELL_SPACING + (Math.random() - 0.5) * 0.4,
      yStart: VFX_MAX_VISIBLE_Y - (i % 3) * 0.4,
      rotSpd: 0.25 + Math.random() * 0.2
    };
    group.add(cMesh);
    coins.push(cMesh);
  }

  let jackpotted = false;
  addTimedVFX(group, 860, (p) => {
    // Lever pulls down in first 30% and springs back up!
    leverPivot.rotation.x = p < 0.35 ? Math.sin((p / 0.35) * Math.PI) * 1.45 : 0;
    wheels.forEach((w, idx) => {
      const stopT = 0.45 + idx * 0.12;
      if (p < stopT) {
        w.rotation.x = (p / stopT) * Math.PI * (8 + idx * 2);
      } else {
        w.rotation.x = 0;
      }
    });
    coins.forEach((cm) => {
      cm.position.set(cm.userData.x, clampVisibleY(cm.userData.yStart - p * 5.2), 0.96);
      cm.rotation.x += cm.userData.rotSpd;
      cm.rotation.y += cm.userData.rotSpd;
    });
    if (p >= 0.50 && !jackpotted) {
      jackpotted = true;
      triggerBoardShake(0.26);
      spawn3DColumnBeam(col, 0xfde047, 0.48, 540, true);
      if (typeof onJackpot === 'function') onJackpot();
    }
    if (p > 0.76) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.24));
    }
  });
}

// ============================================================================
// 32. SULFURIC BRIMSTONE LASER: Horned Brimstone Maw & Double-Helix Beam
// ============================================================================
function playBrimstoneLaserVFX(col, vaporizedRows, onVaporize) {
  const colX = START_X + col * CELL_SPACING;
  const sigilY = VFX_MAX_VISIBLE_Y - 0.32;

  const group = new THREE.Group();
  const mawGroup = new THREE.Group();
  mawGroup.position.set(colX, sigilY, 0.98);

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.11, 12, 24), C4_VFX_MATS.obsidianPitch);
  mawGroup.add(outerRing);

  // 4 Curved Obsidian & Bone Horns around the Brimstone Maw
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.68, 8), C4_VFX_MATS.boneIvory);
    horn.position.set(Math.cos(ang) * 0.92, Math.sin(ang) * 0.92, 0.12);
    horn.rotation.z = ang - Math.PI / 2;
    mawGroup.add(horn);
  }

  const innerSigil = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.06, 8, 6), C4_VFX_MATS.crimsonRuby);
  mawGroup.add(innerSigil);
  group.add(mawGroup);

  // Spiraling Double-Helix Energy Nodes down the column
  const helixNodes = [];
  const nodeGeo = new THREE.OctahedronGeometry(0.18, 0);
  for (let i = 0; i < 16; i++) {
    const nm = new THREE.Mesh(
      nodeGeo,
      i % 2 === 0 ? C4_VFX_MATS.crimsonRuby : C4_VFX_MATS.beeswaxGold
    );
    group.add(nm);
    helixNodes.push(nm);
  }

  let fired = false;
  addTimedVFX(group, 840, (p) => {
    mawGroup.rotation.z = p * Math.PI * 3;
    innerSigil.rotation.z = -p * Math.PI * 6;
    helixNodes.forEach((nm, idx) => {
      const frac = idx / 16;
      const ang = frac * Math.PI * 4 + p * Math.PI * 8;
      const y = sigilY - frac * (sigilY - VFX_MIN_VISIBLE_Y);
      nm.position.set(colX + Math.cos(ang) * 0.48, clampVisibleY(y), 0.96 + Math.sin(ang) * 0.35);
      nm.scale.setScalar(p > 0.35 ? Math.max(0.01, 1 - (p - 0.35) / 0.65) : p / 0.35);
    });

    if (p >= 0.42 && !fired) {
      fired = true;
      triggerBoardShake(0.38);
      spawn3DColumnBeam(col, 0xdc2626, 0.64, 620, true);
      vaporizedRows.forEach((rr) => {
        spawn3DParticleBurst(rr, col, 0xef4444, 18, 0.15, 520, 'octa');
        spawn3DShockwaveRing(rr, col, 0xf43f5e, 2.7, 500);
      });
      if (typeof onVaporize === 'function') onVaporize();
    }
    if (p > 0.74) {
      mawGroup.scale.setScalar(Math.max(0.01, (1 - p) / 0.26));
    }
  });
}

// ============================================================================
// 33. PETRIFYING BASILISK GAZE: 3D Spherical Reptilian Eyeball & Scaly Eyelids
// ============================================================================
function playBasiliskGazeVFX(calcifiedTargets, onGaze) {
  const eyeY = VFX_CENTER_Y + 0.95;

  const group = new THREE.Group();
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(0, eyeY, 1.12);

  // Spherical Reptilian Eyeball + Toxic-Green Iris Dome + Vertical Cat-Slit Pupil
  const sclera = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 2), C4_VFX_MATS.beeswaxGold);
  sclera.scale.set(1.15, 0.95, 0.65);
  eyeGroup.add(sclera);

  const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.16, 20), C4_VFX_MATS.emeraldJade);
  iris.rotation.x = Math.PI / 2;
  iris.position.z = 0.55;
  eyeGroup.add(iris);

  const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.18, 0.20), C4_VFX_MATS.obsidianPitch);
  pupil.position.z = 0.62;
  const pupilRim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.24, 0.18), C4_VFX_MATS.crimsonRuby);
  pupilRim.position.z = 0.60;
  eyeGroup.add(pupilRim);
  eyeGroup.add(pupil);

  // Sculpted Upper & Lower Scaly Reptilian Eyelids with Brow Horns
  const upperLid = new THREE.Group();
  const lowerLid = new THREE.Group();
  const lidArchGeo = new THREE.TorusGeometry(0.98, 0.16, 10, 24, Math.PI);
  upperLid.add(new THREE.Mesh(lidArchGeo, C4_VFX_MATS.emeraldJade));
  const botArch = new THREE.Mesh(lidArchGeo, C4_VFX_MATS.emeraldJade);
  botArch.rotation.z = Math.PI;
  lowerLid.add(botArch);

  for (let i = 1; i <= 5; i++) {
    const ang = (i / 6) * Math.PI;
    const browHorn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 5), C4_VFX_MATS.agedBrass);
    browHorn.position.set(Math.cos(ang) * 1.08, Math.sin(ang) * 1.08, 0.08);
    browHorn.rotation.z = ang - Math.PI / 2;
    upperLid.add(browHorn);
  }
  eyeGroup.add(upperLid);
  eyeGroup.add(lowerLid);
  group.add(eyeGroup);

  let glared = false;
  addTimedVFX(group, 860, (p) => {
    const blinkOpen = p < 0.28 ? p / 0.28 : (p > 0.76 ? (1 - p) / 0.24 : 1);
    upperLid.position.y = blinkOpen * 0.28;
    lowerLid.position.y = -blinkOpen * 0.28;
    eyeGroup.scale.set(1, Math.max(0.08, blinkOpen), 1);

    const lookX = Math.sin(p * Math.PI * 3) * 0.24;
    iris.position.x = lookX;
    pupil.position.x = lookX;
    pupilRim.position.x = lookX;

    if (p >= 0.48 && !glared) {
      glared = true;
      triggerBoardShake(0.30);
      calcifiedTargets.forEach(([tr, tc]) => {
        spawn3DColumnBeam(tc, 0xa3e635, 0.45, 500, false);
        spawn3DShockwaveRing(tr, tc, 0xa3e635, 2.7, 500);
        spawn3DParticleBurst(tr, tc, 0xfacc15, 18, 0.14, 500, 'octa');
      });
      if (typeof onGaze === 'function') onGaze();
    }
  });
}

// ============================================================================
// 34. SIX-WINGED SERAPHIM HALO: 6 Multi-Feathered Wings & Ophanim Eye-Wheels
// ============================================================================
function buildFeatheredWingFan(sideDir, vertAngle) {
  const wing = new THREE.Group();
  // Each wing is a fan of 5 graduated primary & secondary feather blades
  for (let f = 0; f < 5; f++) {
    const len = 1.28 - f * 0.14;
    const featherGeo = new THREE.ConeGeometry(0.11, len, 6);
    featherGeo.translate(0, len * 0.5, 0);
    const feather = new THREE.Mesh(
      featherGeo,
      f % 2 === 0 ? C4_VFX_MATS.agedBrass : C4_VFX_MATS.boneIvory
    );
    feather.rotation.z = -sideDir * (0.45 + f * 0.18);
    wing.add(feather);
  }
  wing.rotation.z = vertAngle;
  return wing;
}

function playSeraphimHaloVFX(col, onSanctify) {
  const colX = START_X + col * CELL_SPACING;
  const startY = VFX_MAX_VISIBLE_Y;
  const endY = VFX_CENTER_Y;

  const group = new THREE.Group();
  const seraph = new THREE.Group();
  seraph.position.set(colX, startY, 1.06);

  // Interlocking Eye-Studded Ophanim Wheels + Solar Core
  const wheel1 = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.08, 12, 28), C4_VFX_MATS.agedBrass);
  const wheel2 = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.065, 12, 28), C4_VFX_MATS.polishedSteel);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const eyeGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), C4_VFX_MATS.crimsonRuby);
    eyeGem.position.set(Math.cos(ang) * 0.76, Math.sin(ang) * 0.76, 0.06);
    wheel1.add(eyeGem);
  }
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), C4_VFX_MATS.beeswaxGold);
  seraph.add(wheel1);
  seraph.add(wheel2);
  seraph.add(core);

  // 6 Articulated Multi-Feather Wings (Upper Pair, Middle Pair, Lower Pair)
  const wings = [
    buildFeatheredWingFan(1, 0.55),
    buildFeatheredWingFan(-1, -0.55),
    buildFeatheredWingFan(1, 0.0),
    buildFeatheredWingFan(-1, 0.0),
    buildFeatheredWingFan(1, -0.55),
    buildFeatheredWingFan(-1, 0.55)
  ];
  wings.forEach((w) => seraph.add(w));
  group.add(seraph);

  let sanctified = false;
  addTimedVFX(group, 860, (p) => {
    wheel1.rotation.z = p * Math.PI * 4;
    wheel2.rotation.y = p * Math.PI * 5;
    const flap = Math.sin(p * Math.PI * 6) * 0.25;
    wings.forEach((w, idx) => {
      w.rotation.y = (idx % 2 === 0 ? 1 : -1) * flap;
    });
    seraph.position.y = clampVisibleY(startY - (startY - endY) * Math.min(1, p / 0.52));

    if (p >= 0.50 && !sanctified) {
      sanctified = true;
      triggerBoardShake(0.28);
      spawn3DColumnBeam(col, 0xfde047, 0.52, 560, true);
      if (typeof onSanctify === 'function') onSanctify();
    }
    if (p > 0.74) {
      seraph.scale.setScalar(Math.max(0.01, (1 - p) / 0.26));
    }
  });
}

// ============================================================================
// 35. BESPOKE SCULPTED 3D MODELS FOR ALL 12 TACTICAL RESERVE TOKENS
// ============================================================================
function playReservePropVFX(r, col, colorHex = 0xfacc15, accentHex = 0x38bdf8, propType = 'ring', onImpact) {
  const pos = getCellWorldPos(Math.max(0, r), col, 0.98);
  pos.y = clampVisibleY(pos.y);
  const group = new THREE.Group();
  group.position.copy(pos);

  if (propType === 'anvil') {
    // Authentic Blacksmith Anvil: Stepped Base + Narrow Waist + Flat Face + Conical Horn + Heel
    const baseFoot = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.18, 0.56), C4_VFX_MATS.darkIron);
    baseFoot.position.y = -0.32;
    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.28, 0.42), C4_VFX_MATS.darkIron);
    waist.position.y = -0.10;
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.26, 0.52), C4_VFX_MATS.polishedSteel);
    face.position.y = 0.16;
    const hornGeo = new THREE.ConeGeometry(0.22, 0.62, 12);
    hornGeo.rotateZ(-Math.PI / 2);
    const horn = new THREE.Mesh(hornGeo, C4_VFX_MATS.polishedSteel);
    horn.position.set(0.68, 0.14, 0);
    group.add(baseFoot);
    group.add(waist);
    group.add(face);
    group.add(horn);
  } else if (propType === 'wings') {
    // Sculpted Vampire Bat: Fanged Head, Pointed Ears & 2 Multi-Strut Membrane Wings
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), C4_VFX_MATS.obsidianPitch);
    group.add(body);
    [-0.12, 0.12].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 5), C4_VFX_MATS.obsidianPitch);
      ear.position.set(ex, 0.28, 0);
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), C4_VFX_MATS.crimsonRuby);
      eye.position.set(ex * 0.8, 0.08, 0.22);
      group.add(ear);
      group.add(eye);
    });
    [-1, 1].forEach((dir) => {
      const wing = new THREE.Group();
      for (let s = 0; s < 3; s++) {
        const finger = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.78, 4), C4_VFX_MATS.crimsonRuby);
        finger.position.set(dir * (0.35 + s * 0.18), 0.12 - s * 0.12, 0);
        finger.rotation.z = -dir * (0.85 + s * 0.25);
        wing.add(finger);
      }
      group.add(wing);
    });
  } else if (propType === 'cask') {
    // Dwarven Nitro Barrel / Jalapeño Bomb with Wooden Staves, Brass Hoops & Sparking Fuse
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.82, 16), C4_VFX_MATS.burnishedCopper);
    group.add(barrel);
    [-0.26, 0, 0.26].forEach((hy) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 20), C4_VFX_MATS.agedBrass);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = hy;
      group.add(hoop);
    });
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 8), C4_VFX_MATS.boneIvory);
    fuse.position.set(0, 0.52, 0);
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), C4_VFX_MATS.beeswaxGold);
    spark.position.set(0, 0.70, 0);
    group.add(fuse);
    group.add(spark);
  } else {
    // Crowned Prismatic Relic / Totem with Orbiting Filigree Halo
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 0), C4_VFX_MATS.agedBrass);
    const innerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), C4_VFX_MATS.crimsonRuby);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.06, 12, 28), C4_VFX_MATS.polishedSteel);
    group.add(crystal);
    group.add(innerGem);
    group.add(halo);
  }

  let impacted = false;
  addTimedVFX(group, 740, (p) => {
    group.rotation.y = p * Math.PI * 3;
    group.position.y = clampVisibleY(pos.y + Math.sin(p * Math.PI) * 0.65);
    if (p >= 0.45 && !impacted) {
      impacted = true;
      if (typeof onImpact === 'function') onImpact();
    }
    if (p > 0.72) {
      group.scale.setScalar(Math.max(0.01, (1 - p) / 0.28));
    }
  });
}


// ============================================================================
// 36. BESPOKE SCULPTED 3D CHOREOGRAPHY FOR ALL 9 BOSS SPECIAL ABILITIES
//     Centered directly in front of the active Connect 4 board (VFX_CENTER_Y)
//     at 1.45x–1.55x scale with dedicated PointLight illumination and
//     vfxControlled token mesh locks so animations are unmistakable.
// ============================================================================

function buildBossWarningHalo(colorHex = 0xf43f5e, radius = 1.65) {
  const haloGroup = new THREE.Group();
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.055, 10, 36),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    })
  );
  const innerHex = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.74, 0.04, 8, 6),
    C4_VFX_MATS.agedBrass
  );
  haloGroup.add(outerRing);
  haloGroup.add(innerHex);
  haloGroup.userData = { outerRing, innerHex };
  return haloGroup;
}

// 36A. MYCELIAL SPORE QUEEN: Colossal Bioluminescent Mushroom Cap & Arcing 3D Spore Pods
function playBossSporeQueenVFX(pickedCoords, onInfect, onComplete) {
  const group = new THREE.Group();
  const queenPos = new THREE.Vector3(0, VFX_CENTER_Y + 0.28, 1.28);

  const bossLight = new THREE.PointLight(0x84cc16, 3.2, 14);
  bossLight.position.set(0, VFX_CENTER_Y + 0.85, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0x84cc16, 1.85);
  halo.position.set(0, queenPos.y, 1.02);
  group.add(halo);

  // Sculpted Mycelial Queen Mushroom Cap + Spotted Warts + Pleated Gill Underside + Stalk
  const shroom = new THREE.Group();
  shroom.position.copy(queenPos);

  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.52, 1.22, 16), C4_VFX_MATS.boneIvory);
  stalk.position.y = -0.52;
  shroom.add(stalk);

  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.08, 10, 22), C4_VFX_MATS.agedBrass);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = -0.22;
  shroom.add(collarRing);

  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.32, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    C4_VFX_MATS.emeraldJade
  );
  capDome.scale.set(1.18, 0.82, 0.96);
  shroom.add(capDome);

  const gillPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 0.44, 0.18, 24), C4_VFX_MATS.agedBrass);
  gillPlate.position.y = -0.05;
  shroom.add(gillPlate);

  // Crown & glowing golden spore warts across the cap dome
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const rad = i % 2 === 0 ? 0.82 : 0.46;
    const wart = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), C4_VFX_MATS.beeswaxGold);
    wart.position.set(Math.cos(ang) * rad, 0.52 + (i % 2) * 0.24, Math.sin(ang) * rad * 0.82);
    shroom.add(wart);
  }
  group.add(shroom);

  // Arcing 3D Spore Pods flying from the Queen Cap into each infected board slot
  const targets = (Array.isArray(pickedCoords) && pickedCoords.length > 0) ? pickedCoords : [[2, 2], [2, 4]];
  const pods = targets.map(([tr, tc], idx) => {
    const podGroup = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), C4_VFX_MATS.emeraldJade);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 10, 20), C4_VFX_MATS.beeswaxGold);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 18), C4_VFX_MATS.crimsonRuby);
    ring2.rotation.x = Math.PI / 2;
    podGroup.add(core);
    podGroup.add(ring1);
    podGroup.add(ring2);
    const dest = getCellWorldPos(tr, tc, 1.05);
    podGroup.userData = {
      tr,
      tc,
      destX: dest.x,
      destY: clampVisibleY(dest.y),
      arcOffset: (idx % 2 === 0 ? -1 : 1) * 1.15
    };
    podGroup.position.copy(queenPos);
    group.add(podGroup);
    return podGroup;
  });

  let infected = false;
  addTimedVFX(group, 1420, (p) => {
    halo.userData.outerRing.rotation.z = p * Math.PI * 4;
    halo.userData.innerHex.rotation.z = -p * Math.PI * 6;
    const entranceScale = p < 0.18 ? (0.25 + (p / 0.18) * 0.75) : 1.0;

    shroom.rotation.y = Math.sin(p * Math.PI * 4) * 0.42;
    const pulse = 1 + Math.sin(p * Math.PI * 8) * 0.10;
    capDome.scale.set(1.18 * pulse, 0.82 / pulse, 0.96 * pulse);

    if (p < 0.70) {
      shroom.scale.setScalar(entranceScale);
      const flightP = Math.max(0, (p - 0.16) / 0.54);
      const ease = flightP * flightP * (3 - 2 * flightP);
      pods.forEach((pod) => {
        const d = pod.userData;
        const x = queenPos.x + (d.destX - queenPos.x) * ease + Math.sin(flightP * Math.PI) * d.arcOffset;
        const y = queenPos.y + (d.destY - queenPos.y) * ease + Math.sin(flightP * Math.PI) * 1.05;
        const z = 1.28 + Math.sin(flightP * Math.PI) * 0.65;
        pod.position.set(x, clampVisibleY(y), z);
        pod.rotation.x += 0.22;
        pod.rotation.y += 0.26;
        pod.scale.setScalar(0.55 + Math.sin(flightP * Math.PI) * 0.55);
      });
    } else {
      if (!infected) {
        infected = true;
        if (typeof sfx !== 'undefined' && sfx && typeof sfx.playFlyBuzz === 'function') {
          sfx.playFlyBuzz(false);
        }
        triggerBoardShake(0.32);
        pods.forEach((pod) => {
          pod.visible = false;
          const { tr, tc } = pod.userData;
          spawn3DColumnBeam(tc, 0x84cc16, 0.46, 540, false);
          spawn3DShockwaveRing(tr, tc, 0x84cc16, 3.0, 560);
          spawn3DParticleBurst(tr, tc, 0xa3e635, 22, 0.16, 560, 'octa');
        });
        if (typeof onInfect === 'function') onInfect();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      shroom.scale.setScalar(s);
      halo.scale.setScalar(1 + fadeP * 0.5);
      halo.userData.outerRing.material.opacity = Math.max(0, 1 - fadeP);
      bossLight.intensity = 3.2 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36B. CHRONOS DALÍ WARDEN: Melting Brass Pocket Watch, Gyroscope & 3D Column Stack Spiral
function playBossChronosDaliVFX(col, occupiedRows, onInvert, onComplete) {
  const safeCol = Math.max(0, Math.min(COLS - 1, Number.isFinite(col) ? col : 3));
  const colX = START_X + safeCol * CELL_SPACING;
  const centerY = VFX_CENTER_Y + 0.15;

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0x38bdf8, 3.2, 14);
  bossLight.position.set(colX, centerY + 0.5, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0x38bdf8, 1.85);
  halo.position.set(colX, centerY, 1.02);
  group.add(halo);

  const clockGroup = new THREE.Group();
  clockGroup.position.set(colX, centerY, 1.28);

  // Surrealist Warped Elliptical Brass Pocket Watch Case + Ivory Dial + Crown Bow
  const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.14, 14, 32), C4_VFX_MATS.agedBrass);
  outerBezel.scale.set(1.15, 0.88, 1);
  clockGroup.add(outerBezel);

  const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(1.10, 1.10, 0.10, 28), C4_VFX_MATS.boneIvory);
  dialFace.rotation.x = Math.PI / 2;
  dialFace.scale.set(1.12, 1, 0.86);
  dialFace.position.z = -0.05;
  clockGroup.add(dialFace);

  const crownStem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 12), C4_VFX_MATS.agedBrass);
  crownStem.position.set(0, 1.22, 0);
  const bowRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 10, 20), C4_VFX_MATS.agedBrass);
  bowRing.position.set(0, 1.46, 0);
  clockGroup.add(crownStem);
  clockGroup.add(bowRing);

  // Hour & Minute Hands + Center Ruby Jewel Pivot
  const minuteHand = new THREE.Group();
  const mBlade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.92, 0.08), C4_VFX_MATS.obsidianPitch);
  mBlade.position.y = 0.38;
  minuteHand.add(mBlade);
  minuteHand.position.z = 0.07;

  const hourHand = new THREE.Group();
  const hBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.64, 0.08), C4_VFX_MATS.crimsonRuby);
  hBlade.position.y = 0.24;
  hourHand.add(hBlade);
  hourHand.position.z = 0.09;

  const pivotGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 1), C4_VFX_MATS.agedBrass);
  pivotGem.position.z = 0.14;
  clockGroup.add(minuteHand);
  clockGroup.add(hourHand);
  clockGroup.add(pivotGem);

  // Twin Orbiting Temporal Gyroscope Rings
  const gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.06, 10, 32), C4_VFX_MATS.quicksilverChrome);
  const gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.045, 10, 32), C4_VFX_MATS.agedBrass);
  clockGroup.add(gyroRing1);
  clockGroup.add(gyroRing2);
  group.add(clockGroup);

  // Capture existing token meshes in the column and lock them with vfxControlled = true
  const rowList = Array.isArray(occupiedRows) ? occupiedRows : [];
  const tokenSnapshots = rowList.map((r, i) => {
    const destR = rowList[rowList.length - 1 - i];
    const m = state.meshes[r] && state.meshes[r][safeCol];
    if (m && m.userData) {
      m.userData.vfxControlled = true;
      m.userData.velY = 0;
    }
    return {
      mesh: m,
      startY: START_Y + r * CELL_SPACING,
      endY: START_Y + destR * CELL_SPACING
    };
  });

  let inverted = false;
  addTimedVFX(group, 1420, (p) => {
    halo.userData.outerRing.rotation.z = -p * Math.PI * 5;
    halo.userData.innerHex.rotation.z = p * Math.PI * 7;

    // Melt/warp wobble + rapid counter-clockwise time rewind
    const warp = Math.sin(p * Math.PI * 6) * 0.18;
    const baseScale = p < 0.16 ? (0.25 + (p / 0.16) * 0.75) : 1.0;
    clockGroup.scale.set(baseScale * (1 + warp), baseScale * (1 - warp * 0.7), baseScale);
    minuteHand.rotation.z = -p * Math.PI * 14;
    hourHand.rotation.z = -p * Math.PI * 5;
    gyroRing1.rotation.x = p * Math.PI * 5;
    gyroRing1.rotation.y = p * Math.PI * 4;
    gyroRing2.rotation.y = -p * Math.PI * 6;
    gyroRing2.rotation.z = p * Math.PI * 3;

    if (p < 0.70) {
      const t = Math.max(0, (p - 0.14) / 0.56);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      tokenSnapshots.forEach((snap, idx) => {
        if (!snap.mesh) return;
        const side = idx % 2 === 0 ? 1 : -1;
        snap.mesh.position.y = snap.startY + (snap.endY - snap.startY) * ease;
        snap.mesh.position.x = colX + Math.sin(ease * Math.PI) * 0.68 * side;
        snap.mesh.position.z = Math.sin(ease * Math.PI) * 1.35;
        snap.mesh.rotation.x = ease * Math.PI * 2;
      });
    } else {
      if (!inverted) {
        inverted = true;
        tokenSnapshots.forEach((snap) => {
          if (!snap.mesh) return;
          if (snap.mesh.userData) snap.mesh.userData.vfxControlled = false;
          snap.mesh.position.x = colX;
          snap.mesh.position.z = 0;
          snap.mesh.rotation.set(0, 0, 0);
        });
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playGravityVortex === 'function') sfx.playGravityVortex();
          if (typeof sfx.playDaliClockTick === 'function') sfx.playDaliClockTick();
        }
        triggerBoardShake(0.34);
        spawn3DColumnBeam(safeCol, 0x38bdf8, 0.58, 580, true);
        if (rowList.length > 0) {
          spawn3DShockwaveRing(rowList[0], safeCol, 0xfde047, 2.9, 540);
          spawn3DShockwaveRing(rowList[rowList.length - 1], safeCol, 0x38bdf8, 2.9, 540);
          spawn3DParticleBurst(rowList[rowList.length - 1], safeCol, 0x38bdf8, 20, 0.16, 540, 'octa');
        } else {
          spawn3DShockwaveRing(2, safeCol, 0x38bdf8, 2.9, 540);
        }
        if (typeof onInvert === 'function') onInvert();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      clockGroup.scale.setScalar(s);
      halo.scale.setScalar(1 + fadeP * 0.5);
      halo.userData.outerRing.material.opacity = Math.max(0, 1 - fadeP);
      bossLight.intensity = 3.2 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36C. PETRIFIER ARCHON: Colossal Crowned Obsidian Archon Mask, Twin Chisels & Basalt Cage
function playBossPetrifierArchonVFX(targetRow, targetCol, onPetrify, onComplete) {
  const safeR = Math.max(0, Math.min(ROWS - 1, Number.isFinite(targetRow) && targetRow >= 0 ? targetRow : 0));
  const safeC = Math.max(0, Math.min(COLS - 1, Number.isFinite(targetCol) && targetCol >= 0 ? targetCol : 3));
  const colX = START_X + safeC * CELL_SPACING;
  const targetY = getVisibleRowY(safeR);
  // Keep Archon Mask in the clear central viewport (never hidden behind top HUD!)
  const headY = Math.min(VFX_CENTER_Y + 0.55, Math.max(VFX_MIN_VISIBLE_Y + 1.10, targetY + 0.75));

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0xfbbf24, 3.2, 14);
  bossLight.position.set(colX, headY, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0xfbbf24, 1.75);
  halo.position.set(colX, targetY, 1.02);
  group.add(halo);

  // Sculpted Crowned Obsidian Archon Mask hovering clearly over the board
  const archon = new THREE.Group();
  archon.position.set(colX, headY, 1.30);

  const faceSlab = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.48, 0.58), C4_VFX_MATS.basaltStone);
  archon.add(faceSlab);

  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.30, 0.72), C4_VFX_MATS.obsidianPitch);
  browRidge.position.set(0, 0.38, 0.08);
  archon.add(browRidge);

  [-0.36, 0.36].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), C4_VFX_MATS.crimsonRuby);
    eye.position.set(ex, 0.16, 0.34);
    archon.add(eye);
  });

  // 5-Spire Golden Archon Crown
  for (let i = -2; i <= 2; i++) {
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.62 - Math.abs(i) * 0.08, 6),
      C4_VFX_MATS.agedBrass
    );
    spire.position.set(i * 0.30, 1.02, 0.06);
    archon.add(spire);
  }
  group.add(archon);

  // Twin Crossed Mason Chisels striking inward at (targetRow, targetCol)
  const leftChisel = new THREE.Group();
  const rightChisel = new THREE.Group();
  [leftChisel, rightChisel].forEach((ch, idx) => {
    const dir = idx === 0 ? -1 : 1;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 1.32, 10), C4_VFX_MATS.darkIron);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), C4_VFX_MATS.agedBrass);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.45;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 4), C4_VFX_MATS.polishedSteel);
    tip.rotation.x = Math.PI;
    tip.position.y = -0.82;
    ch.add(shaft);
    ch.add(collar);
    ch.add(tip);
    ch.position.set(colX + dir * 1.35, targetY + 0.65, 1.22);
    ch.rotation.z = dir * 0.82;
    group.add(ch);
  });

  // 8 Jagged Basalt Stalagmite Shards erupting around the target token
  const shardCage = new THREE.Group();
  shardCage.position.set(colX, targetY, 1.15);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.76, 5), C4_VFX_MATS.basaltStone);
    shard.position.set(Math.cos(ang) * 0.58, Math.sin(ang) * 0.58, 0);
    shard.rotation.z = ang + Math.PI / 2;
    shardCage.add(shard);
  }
  group.add(shardCage);

  let petrified = false;
  addTimedVFX(group, 1420, (p) => {
    halo.userData.outerRing.rotation.z = p * Math.PI * 4;
    halo.userData.innerHex.rotation.z = -p * Math.PI * 6;
    archon.position.y = headY + Math.sin(p * Math.PI * 6) * 0.14;

    if (p < 0.68) {
      const windUp = p < 0.28 ? (p / 0.28) : 1;
      const strike = p < 0.28 ? 0 : Math.pow((p - 0.28) / 0.40, 2);
      archon.scale.setScalar(0.3 + windUp * 0.7);
      leftChisel.position.set(colX - (1 - strike) * 1.25 - 0.22, targetY + (1 - strike) * 0.65, 1.22);
      rightChisel.position.set(colX + (1 - strike) * 1.25 + 0.22, targetY + (1 - strike) * 0.65, 1.22);
      shardCage.scale.setScalar(0.25 + strike * 0.95);
      shardCage.rotation.z = strike * Math.PI * 1.5;
    } else {
      if (!petrified) {
        petrified = true;
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playPetrifiedSeal === 'function') sfx.playPetrifiedSeal();
          if (typeof sfx.playAnvilClang === 'function') sfx.playAnvilClang();
        }
        triggerBoardShake(0.38);
        spawn3DColumnBeam(safeC, 0xa8a29e, 0.54, 560, true);
        spawn3DShockwaveRing(safeR, safeC, 0xfbbf24, 3.1, 560);
        spawn3DParticleBurst(safeR, safeC, 0x78716c, 24, 0.17, 560, 'box');
        if (typeof onPetrify === 'function') onPetrify();
      }
      const fadeP = (p - 0.68) / 0.32;
      const s = Math.max(0.01, 1 - fadeP);
      group.scale.setScalar(s);
      bossLight.intensity = 3.2 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36D. MIRROR VIRTUOSO: Twin Baroque Looking-Glasses, Masquerade Crest & 3D Token Swap Arc
function playBossMirrorVirtuosoVFX(pr, pc, ar, ac, onSwap, onComplete) {
  const xP = START_X + pc * CELL_SPACING;
  const yP = getVisibleRowY(pr);
  const xA = START_X + ac * CELL_SPACING;
  const yA = getVisibleRowY(ar);

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0xe879f9, 3.2, 14);
  bossLight.position.set(0, VFX_CENTER_Y + 0.5, 2.65);
  group.add(bossLight);

  const buildBaroqueMirror = (isGoldMask) => {
    const mGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.11, 14, 32), C4_VFX_MATS.agedBrass);
    frame.scale.set(0.90, 1.18, 1);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.08, 28), C4_VFX_MATS.quicksilverChrome);
    glass.rotation.x = Math.PI / 2;
    glass.scale.set(0.88, 1, 1.15);
    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), C4_VFX_MATS.crimsonRuby);
    crown.position.set(0, 1.14, 0.08);
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.74, 0.18),
      isGoldMask ? C4_VFX_MATS.boneIvory : C4_VFX_MATS.obsidianPitch
    );
    mask.position.z = 0.12;
    [-0.16, 0.16].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), C4_VFX_MATS.crimsonRuby);
      eye.position.set(ex, 0.10, 0.22);
      mGroup.add(eye);
    });
    mGroup.add(frame);
    mGroup.add(glass);
    mGroup.add(crown);
    mGroup.add(mask);
    return mGroup;
  };

  const mirrorLeft = buildBaroqueMirror(true);
  const mirrorRight = buildBaroqueMirror(false);
  mirrorLeft.position.set(xP, yP, 1.14);
  mirrorRight.position.set(xA, yA, 1.14);
  group.add(mirrorLeft);
  group.add(mirrorRight);

  // Shimmering Prismatic Diamond Bridge between the two mirrors
  const bridgeShards = [];
  for (let i = 0; i < 10; i++) {
    const sh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.20, 0),
      i % 2 === 0 ? C4_VFX_MATS.quicksilverChrome : C4_VFX_MATS.crimsonRuby
    );
    group.add(sh);
    bridgeShards.push(sh);
  }

  const meshP = state.meshes[pr] && state.meshes[pr][pc];
  const meshA = state.meshes[ar] && state.meshes[ar][ac];
  if (meshP && meshP.userData) {
    meshP.userData.vfxControlled = true;
    meshP.userData.velY = 0;
  }
  if (meshA && meshA.userData) {
    meshA.userData.vfxControlled = true;
    meshA.userData.velY = 0;
  }
  const realYP = START_Y + pr * CELL_SPACING;
  const realYA = START_Y + ar * CELL_SPACING;

  let swapped = false;
  addTimedVFX(group, 1450, (p) => {
    mirrorLeft.rotation.y = Math.sin(p * Math.PI * 5) * 0.52;
    mirrorRight.rotation.y = -Math.sin(p * Math.PI * 5) * 0.52;

    bridgeShards.forEach((sh, idx) => {
      const frac = (idx + 0.5) / 10;
      const bx = xP + (xA - xP) * frac;
      const by = yP + (yA - yP) * frac + Math.sin(frac * Math.PI + p * Math.PI * 8) * 0.62;
      sh.position.set(bx, clampVisibleY(by), 1.32);
      sh.rotation.z += 0.25;
      sh.rotation.y += 0.20;
      sh.scale.setScalar(Math.max(0.05, 1.15 - Math.abs(p - 0.45) * 1.6));
    });

    if (p < 0.70) {
      const t = Math.max(0, (p - 0.14) / 0.56);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const arcLift = Math.sin(ease * Math.PI) * 1.35;
      if (meshP) {
        meshP.position.x = xP + (xA - xP) * ease;
        meshP.position.y = realYP + (realYA - realYP) * ease + arcLift;
        meshP.position.z = Math.sin(ease * Math.PI) * 1.45;
        meshP.rotation.y = ease * Math.PI * 2;
      }
      if (meshA) {
        meshA.position.x = xA + (xP - xA) * ease;
        meshA.position.y = realYA + (realYP - realYA) * ease - arcLift * 0.85;
        meshA.position.z = Math.sin(ease * Math.PI) * 1.25;
        meshA.rotation.y = -ease * Math.PI * 2;
      }
    } else {
      if (!swapped) {
        swapped = true;
        if (meshP) {
          if (meshP.userData) meshP.userData.vfxControlled = false;
          meshP.position.set(xP, realYP, 0);
          meshP.rotation.set(0, 0, 0);
        }
        if (meshA) {
          if (meshA.userData) meshA.userData.vfxControlled = false;
          meshA.position.set(xA, realYA, 0);
          meshA.rotation.set(0, 0, 0);
        }
        if (typeof sfx !== 'undefined' && sfx && typeof sfx.playSurrealTransmute === 'function') {
          sfx.playSurrealTransmute();
        }
        triggerBoardShake(0.32);
        spawn3DColumnBeam(pc, 0xe879f9, 0.48, 540, false);
        spawn3DColumnBeam(ac, 0x38bdf8, 0.48, 540, false);
        spawn3DShockwaveRing(pr, pc, 0xe879f9, 3.0, 540);
        spawn3DShockwaveRing(ar, ac, 0x38bdf8, 3.0, 540);
        spawn3DParticleBurst(pr, pc, 0xfde047, 20, 0.16, 540, 'octa');
        spawn3DParticleBurst(ar, ac, 0xe2e8f0, 20, 0.16, 540, 'octa');
        if (typeof onSwap === 'function') onSwap();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      mirrorLeft.scale.setScalar(s);
      mirrorRight.scale.setScalar(s);
      bossLight.intensity = 3.2 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36E. MAGMA LEVIATHAN: Colossal Horned Molten Dragon Maw & Smooth Column Lava Sink
function playBossMagmaLeviathanVFX(botR, targetCol, onMelt, onComplete) {
  const safeR = Math.max(0, Math.min(ROWS - 1, Number.isFinite(botR) && botR >= 0 ? botR : 0));
  const safeC = Math.max(0, Math.min(COLS - 1, Number.isFinite(targetCol) && targetCol >= 0 ? targetCol : 3));
  const colX = START_X + safeC * CELL_SPACING;
  const botY = getVisibleRowY(safeR);
  const mawBaseY = Math.max(VFX_MIN_VISIBLE_Y + 0.65, botY + 0.25);

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0xf97316, 3.4, 14);
  bossLight.position.set(colX, mawBaseY + 0.6, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0xf97316, 1.80);
  halo.position.set(colX, mawBaseY, 1.02);
  group.add(halo);

  // Sculpted Horned Molten Leviathan Jaws rising over the lower-middle column
  const maw = new THREE.Group();
  maw.position.set(colX, mawBaseY, 1.28);

  const leftJaw = new THREE.Group();
  const rightJaw = new THREE.Group();
  [-1, 1].forEach((dir) => {
    const jawSide = dir === -1 ? leftJaw : rightJaw;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.12, 0.72), C4_VFX_MATS.obsidianPitch);
    plate.position.x = dir * 0.46;
    jawSide.add(plate);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.88, 6), C4_VFX_MATS.crimsonRuby);
    crest.position.set(dir * 0.78, 0.48, 0.14);
    crest.rotation.z = -dir * 0.45;
    jawSide.add(crest);

    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 1), C4_VFX_MATS.beeswaxGold);
    eye.position.set(dir * 0.56, 0.24, 0.42);
    jawSide.add(eye);

    for (let f = -1; f <= 1; f++) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 5), C4_VFX_MATS.boneIvory);
      fang.position.set(dir * 0.22, f * 0.30, 0.32);
      fang.rotation.z = dir * (Math.PI / 2);
      jawSide.add(fang);
    }
    maw.add(jawSide);
  });
  group.add(maw);

  // 20 Swirling Molten Magma Plume Cones erupting up the column
  const plumes = [];
  const plumeGeo = new THREE.ConeGeometry(0.28, 0.74, 6);
  for (let i = 0; i < 20; i++) {
    const pMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xf97316 : 0xef4444,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const pm = new THREE.Mesh(plumeGeo, pMat);
    group.add(pm);
    plumes.push(pm);
  }

  // Capture column token meshes so the bottom token melts and upper tokens smoothly sink
  const colSnapshots = [];
  for (let r = safeR; r < ROWS; r++) {
    const m = state.meshes[r] && state.meshes[r][safeC];
    if (m) {
      if (m.userData) {
        m.userData.vfxControlled = true;
        m.userData.velY = 0;
      }
      colSnapshots.push({
        r,
        mesh: m,
        startY: START_Y + r * CELL_SPACING,
        endY: START_Y + Math.max(0, r - 1) * CELL_SPACING,
        isMeltedBottom: r === safeR
      });
    }
  }

  let melted = false;
  addTimedVFX(group, 1450, (p) => {
    halo.userData.outerRing.rotation.z = p * Math.PI * 5;
    halo.userData.innerHex.rotation.z = -p * Math.PI * 7;

    const bite = p < 0.55 ? Math.sin((p / 0.55) * Math.PI * 0.5) : 1;
    maw.position.y = clampVisibleY((mawBaseY - 0.45) + bite * 0.45);
    leftJaw.rotation.z = -(1 - bite) * 0.58;
    rightJaw.rotation.z = (1 - bite) * 0.58;

    plumes.forEach((pm, idx) => {
      const ang = (idx / 20) * Math.PI * 2 + p * Math.PI * 8;
      const hFrac = ((idx / 20) + p * 2.0) % 1;
      const py = clampVisibleY(VFX_MIN_VISIBLE_Y + hFrac * 4.4);
      pm.position.set(colX + Math.cos(ang) * 0.52, py, 1.15 + Math.sin(ang) * 0.28);
      pm.material.opacity = Math.max(0, 1 - p);
    });

    if (p < 0.70) {
      const sinkP = Math.max(0, (p - 0.25) / 0.45);
      const ease = sinkP * sinkP * (3 - 2 * sinkP);
      colSnapshots.forEach((snap) => {
        if (!snap.mesh) return;
        if (snap.isMeltedBottom) {
          snap.mesh.scale.setScalar(Math.max(0.05, 1 - ease));
          snap.mesh.rotation.z = ease * Math.PI * 2;
        } else {
          snap.mesh.position.y = snap.startY + (snap.endY - snap.startY) * ease;
        }
      });
    } else {
      if (!melted) {
        melted = true;
        colSnapshots.forEach((snap) => {
          if (snap.mesh && snap.mesh.userData) {
            snap.mesh.userData.vfxControlled = false;
          }
          if (snap.mesh) {
            snap.mesh.scale.setScalar(1);
            snap.mesh.rotation.set(0, 0, 0);
          }
        });
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playBrimstoneLaser === 'function') sfx.playBrimstoneLaser();
          if (typeof sfx.playHibachiSizzle === 'function') sfx.playHibachiSizzle();
        }
        triggerBoardShake(0.42);
        spawn3DColumnBeam(safeC, 0xf97316, 0.62, 580, true);
        spawn3DShockwaveRing(safeR, safeC, 0xef4444, 3.2, 560);
        spawn3DParticleBurst(safeR, safeC, 0xfbbf24, 26, 0.18, 560, 'cone');
        if (typeof onMelt === 'function') onMelt();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      maw.scale.setScalar(s);
      halo.scale.setScalar(1 + fadeP * 0.5);
      halo.userData.outerRing.material.opacity = Math.max(0, 1 - fadeP);
      bossLight.intensity = 3.4 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36F. TECTONIC BEHEMOTH: Colossal Chained Basalt War-Fist & Seismic Ceiling Slam
function playBossTectonicBehemothVFX(destR, destCol, onQuake, onComplete) {
  const safeR = Math.max(0, Math.min(ROWS - 1, Number.isFinite(destR) && destR >= 0 ? destR : 0));
  const safeC = Math.max(0, Math.min(COLS - 1, Number.isFinite(destCol) && destCol >= 0 ? destCol : 3));
  const colX = START_X + safeC * CELL_SPACING;
  // Start in the clear upper-middle board (y = +1.55) so it is NEVER hidden behind the top HUD
  const startY = VFX_CENTER_Y + 1.20;
  const endY = getVisibleRowY(safeR);

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0xf59e0b, 3.4, 14);
  bossLight.position.set(colX, VFX_CENTER_Y + 0.5, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0xf59e0b, 1.75);
  halo.position.set(colX, endY, 1.02);
  group.add(halo);

  const fist = new THREE.Group();
  fist.position.set(colX, startY, 1.30);

  // Armored Basalt Gauntlet Core + Molten Core Seam + 4 Brass Knuckle Spikes + Trailing Iron Chain
  const gauntletBlock = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.38, 0.92), C4_VFX_MATS.basaltStone);
  fist.add(gauntletBlock);

  const wristCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.82, 0.46, 14), C4_VFX_MATS.darkIron);
  wristCuff.position.y = 0.84;
  fist.add(wristCuff);

  const magmaCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), C4_VFX_MATS.crimsonRuby);
  magmaCore.position.z = 0.42;
  fist.add(magmaCore);

  for (let k = -1.5; k <= 1.5; k += 1) {
    const knuckleSpike = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.56, 5), C4_VFX_MATS.agedBrass);
    knuckleSpike.rotation.x = Math.PI;
    knuckleSpike.position.set(k * 0.36, -0.88, 0.20);
    fist.add(knuckleSpike);
  }

  for (let l = 1; l <= 3; l++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 8, 18), C4_VFX_MATS.agedBrass);
    link.position.y = 1.08 + l * 0.36;
    link.rotation.y = (l % 2) * (Math.PI / 2);
    fist.add(link);
  }
  group.add(fist);

  let quaked = false;
  addTimedVFX(group, 1450, (p) => {
    halo.userData.outerRing.rotation.z = p * Math.PI * 5;
    halo.userData.innerHex.rotation.z = -p * Math.PI * 7;

    if (p < 0.32) {
      // Dramatic visible hover & wind-up tremor in center-upper board
      const windP = p / 0.32;
      fist.scale.setScalar(0.35 + windP * 0.65);
      fist.position.y = clampVisibleY(startY + Math.sin(windP * Math.PI) * 0.22);
      fist.rotation.z = Math.sin(p * Math.PI * 16) * 0.12;
    } else if (p < 0.66) {
      const slamP = (p - 0.32) / 0.34;
      const fallFrac = slamP * slamP;
      fist.scale.setScalar(1.0);
      fist.position.y = clampVisibleY(startY - (startY - endY) * fallFrac);
      fist.rotation.z = Math.sin(p * Math.PI * 10) * 0.06;
    } else {
      if (!quaked) {
        quaked = true;
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playTremorQuake === 'function') sfx.playTremorQuake();
          if (typeof sfx.playShatterCrunch === 'function') sfx.playShatterCrunch();
        }
        triggerBoardShake(0.46);
        spawn3DColumnBeam(safeC, 0xf59e0b, 0.62, 580, true);
        spawn3DShockwaveRing(safeR, safeC, 0xf97316, 3.3, 580);
        spawn3DParticleBurst(safeR, safeC, 0x78716c, 28, 0.18, 580, 'box');
        for (let c = 0; c < COLS; c += 2) {
          spawn3DShockwaveRing(0, c, 0xfbbf24, 2.1, 460);
        }
        if (typeof onQuake === 'function') onQuake();
      }
      const fadeP = (p - 0.66) / 0.34;
      const s = Math.max(0.01, 1 - fadeP);
      fist.position.y = clampVisibleY(endY + Math.sin(fadeP * Math.PI) * 0.45);
      fist.scale.setScalar(s);
      halo.scale.setScalar(1 + fadeP * 0.5);
      halo.userData.outerRing.material.opacity = Math.max(0, 1 - fadeP);
      bossLight.intensity = 3.4 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36G. ABYSSAL LODESTONE: Colossal Horseshoe Singularity Magnet & 3D Neighbor Token Pull Arcs
function playBossAbyssalLodestoneVFX(mc, pullMoves, condensedStoneCell, onResolve, onComplete) {
  const safeC = Math.max(0, Math.min(COLS - 1, Number.isFinite(mc) ? mc : 3));
  const colX = START_X + safeC * CELL_SPACING;
  const centerY = VFX_CENTER_Y + 0.18;

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0x38bdf8, 3.4, 14);
  bossLight.position.set(colX, centerY + 0.5, 2.65);
  group.add(bossLight);

  const magnet = new THREE.Group();
  magnet.position.set(colX, centerY, 1.30);

  // Giant U-Shaped Astral Horseshoe Magnet + Crimson/Cyan Pole Caps + Spinning Singularity Core
  const uArch = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.24, 14, 28, Math.PI),
    C4_VFX_MATS.darkIron
  );
  uArch.position.y = 0.28;
  magnet.add(uArch);

  [-1.08, 1.08].forEach((px, idx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.78, 14), C4_VFX_MATS.darkIron);
    leg.position.set(px, -0.08, 0);
    const poleCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.34, 14),
      idx === 0 ? C4_VFX_MATS.crimsonRuby : C4_VFX_MATS.quicksilverChrome
    );
    poleCap.position.set(px, -0.58, 0);
    magnet.add(leg);
    magnet.add(poleCap);
  });

  const singularityCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), C4_VFX_MATS.beeswaxGold);
  singularityCore.position.set(0, -0.18, 0.12);
  magnet.add(singularityCore);
  group.add(magnet);

  // 4 Concentric Gravitic Pulse Rings contracting inward toward Singularity Column mc
  const pulseRings = [];
  for (let i = 0; i < 4; i++) {
    const rMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.95 - i * 0.34, 0.055, 10, 32),
      i % 2 === 0 ? C4_VFX_MATS.quicksilverChrome : C4_VFX_MATS.agedBrass
    );
    rMesh.position.set(colX, centerY, 1.08);
    group.add(rMesh);
    pulseRings.push(rMesh);
  }

  // Capture neighbor token meshes being pulled laterally into column mc
  const activePulls = (Array.isArray(pullMoves) ? pullMoves : []).map((mv) => {
    const m = state.meshes[mv.fromR] && state.meshes[mv.fromR][mv.fromC];
    if (m && m.userData) {
      m.userData.vfxControlled = true;
      m.userData.velY = 0;
    }
    return {
      ...mv,
      mesh: m,
      startX: START_X + mv.fromC * CELL_SPACING,
      startY: START_Y + mv.fromR * CELL_SPACING,
      endX: START_X + mv.toC * CELL_SPACING,
      endY: START_Y + mv.toR * CELL_SPACING
    };
  });

  let resolved = false;
  addTimedVFX(group, 1450, (p) => {
    singularityCore.rotation.x += 0.24;
    singularityCore.rotation.y += 0.30;
    magnet.position.y = centerY + Math.sin(p * Math.PI * 6) * 0.16;

    pulseRings.forEach((rm, idx) => {
      const cycle = (p * 2.6 + idx * 0.25) % 1;
      rm.scale.setScalar(1.45 - cycle * 1.05);
      rm.rotation.z = p * Math.PI * (idx % 2 === 0 ? 4 : -4);
    });

    if (p < 0.70) {
      const t = Math.max(0, (p - 0.14) / 0.56);
      const ease = t * t * (3 - 2 * t);
      activePulls.forEach((pl) => {
        if (!pl.mesh) return;
        pl.mesh.position.x = pl.startX + (pl.endX - pl.startX) * ease;
        pl.mesh.position.y = pl.startY + (pl.endY - pl.startY) * ease + Math.sin(ease * Math.PI) * 1.15;
        pl.mesh.position.z = Math.sin(ease * Math.PI) * 1.40;
        pl.mesh.rotation.z = ease * Math.PI * 2;
      });
    } else {
      if (!resolved) {
        resolved = true;
        activePulls.forEach((pl) => {
          if (!pl.mesh) return;
          if (pl.mesh.userData) pl.mesh.userData.vfxControlled = false;
          pl.mesh.position.set(pl.startX, pl.startY, 0);
          pl.mesh.rotation.set(0, 0, 0);
        });
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playGravityVortex === 'function') sfx.playGravityVortex();
          if (typeof sfx.playAnvilClang === 'function') sfx.playAnvilClang();
        }
        triggerBoardShake(0.38);
        spawn3DColumnBeam(safeC, 0x38bdf8, 0.60, 580, true);
        activePulls.forEach((pl) => {
          spawn3DShockwaveRing(pl.toR, pl.toC, 0x38bdf8, 3.0, 540);
          spawn3DParticleBurst(pl.toR, pl.toC, 0xfde047, 20, 0.16, 540, 'octa');
        });
        if (condensedStoneCell) {
          spawn3DShockwaveRing(condensedStoneCell[0], condensedStoneCell[1], 0x38bdf8, 3.0, 540);
          spawn3DParticleBurst(condensedStoneCell[0], condensedStoneCell[1], 0x94a3b8, 20, 0.16, 540, 'box');
        }
        if (typeof onResolve === 'function') onResolve();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      group.scale.setScalar(s);
      bossLight.intensity = 3.4 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36H. ASTRAL VOID WEAVER: Colossal 8-Legged Articulated Arachnid, Silk Snares & Lateral Token Drag
function playBossVoidWeaverVFX(snareCoords, dragMove, onWeave, onComplete) {
  const focusCol = dragMove ? dragMove.fromC : 3;
  const spiderX = START_X + focusCol * CELL_SPACING;
  // Center the spider over the middle board (y = +0.65) so it is NEVER hidden behind the top HUD!
  const spiderBaseY = VFX_CENTER_Y + 0.30;

  const group = new THREE.Group();

  const bossLight = new THREE.PointLight(0xc084fc, 3.4, 14);
  bossLight.position.set(spiderX, spiderBaseY + 0.5, 2.65);
  group.add(bossLight);

  const halo = buildBossWarningHalo(0xc084fc, 1.85);
  halo.position.set(spiderX, spiderBaseY, 1.02);
  group.add(halo);

  const spider = new THREE.Group();
  spider.position.set(spiderX, spiderBaseY, 1.32);

  // Glowing Astral Silk Dragline from Cavern Ceiling
  const silkLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.6, 8),
    C4_VFX_MATS.quicksilverChrome
  );
  silkLine.position.y = 1.45;
  spider.add(silkLine);

  // Sculpted Arachnid Abdomen + Cephalothorax + Crimson Hourglass + 6 Ruby Eyes + 8 Articulated Legs
  const abdomen = new THREE.Mesh(new THREE.OctahedronGeometry(0.78, 2), C4_VFX_MATS.obsidianPitch);
  abdomen.scale.set(0.96, 1.25, 0.82);
  abdomen.position.y = 0.38;
  spider.add(abdomen);

  const hourglass = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), C4_VFX_MATS.crimsonRuby);
  hourglass.position.set(0, 0.38, 0.58);
  spider.add(hourglass);

  const thorax = new THREE.Mesh(new THREE.OctahedronGeometry(0.50, 1), C4_VFX_MATS.obsidianPitch);
  thorax.position.y = -0.36;
  spider.add(thorax);

  for (let e = -1; e <= 1; e++) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.10, 0), C4_VFX_MATS.crimsonRuby);
    eye.position.set(e * 0.19, -0.46, 0.42);
    spider.add(eye);
  }

  const legs = [];
  [-1, 1].forEach((side) => {
    for (let l = 0; l < 4; l++) {
      const legGroup = new THREE.Group();
      const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.96, 8), C4_VFX_MATS.darkIron);
      femur.position.set(side * 0.48, 0.16, 0);
      femur.rotation.z = -side * 1.05;
      const tibia = new THREE.Mesh(new THREE.ConeGeometry(0.065, 1.04, 8), C4_VFX_MATS.agedBrass);
      tibia.position.set(side * 1.02, -0.24, 0.10);
      tibia.rotation.z = side * 2.35;
      legGroup.add(femur);
      legGroup.add(tibia);
      legGroup.position.y = 0.18 - l * 0.24;
      spider.add(legGroup);
      legs.push({ legGroup, side, idx: l });
    }
  });
  group.add(spider);

  // Glowing Silk Web Rosette Pods flying to each snared cell
  const snares = (Array.isArray(snareCoords) ? snareCoords : []).map(([sr, sc]) => {
    const dest = getCellWorldPos(sr, sc, 1.12);
    const webPod = new THREE.Group();
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.055, 8, 18), C4_VFX_MATS.quicksilverChrome);
    const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 6), C4_VFX_MATS.crimsonRuby);
    webPod.add(ringOuter);
    webPod.add(ringInner);
    webPod.userData = { sr, sc, destX: dest.x, destY: clampVisibleY(dest.y) };
    group.add(webPod);
    return webPod;
  });

  const dragMesh = (dragMove && state.meshes[dragMove.fromR])
    ? state.meshes[dragMove.fromR][dragMove.fromC]
    : null;
  if (dragMesh && dragMesh.userData) {
    dragMesh.userData.vfxControlled = true;
    dragMesh.userData.velY = 0;
  }
  const dragStartX = dragMove ? (START_X + dragMove.fromC * CELL_SPACING) : 0;
  const dragStartY = dragMove ? (START_Y + dragMove.fromR * CELL_SPACING) : 0;
  const dragEndX = dragMove ? (START_X + dragMove.toC * CELL_SPACING) : 0;
  const dragEndY = dragMove ? (START_Y + dragMove.toR * CELL_SPACING) : 0;

  let woven = false;
  addTimedVFX(group, 1450, (p) => {
    halo.userData.outerRing.rotation.z = p * Math.PI * 5;
    halo.userData.innerHex.rotation.z = -p * Math.PI * 7;

    spider.position.y = clampVisibleY(spiderBaseY - Math.sin(p * Math.PI * 2) * 0.35);
    legs.forEach(({ legGroup, side, idx }) => {
      legGroup.rotation.z = Math.sin(p * Math.PI * 12 + idx) * 0.28 * side;
    });

    if (p < 0.70) {
      const t = Math.max(0, (p - 0.14) / 0.56);
      const ease = t * t * (3 - 2 * t);
      snares.forEach((wp) => {
        const d = wp.userData;
        wp.position.set(
          spiderX + (d.destX - spiderX) * ease,
          clampVisibleY(spider.position.y + (d.destY - spider.position.y) * ease),
          1.22
        );
        wp.rotation.z = p * Math.PI * 8;
      });
      if (dragMesh && dragMove) {
        dragMesh.position.x = dragStartX + (dragEndX - dragStartX) * ease;
        dragMesh.position.y = dragStartY + (dragEndY - dragStartY) * ease + Math.sin(ease * Math.PI) * 1.10;
        dragMesh.position.z = Math.sin(ease * Math.PI) * 1.38;
        dragMesh.rotation.z = ease * Math.PI * 2;
      }
    } else {
      if (!woven) {
        woven = true;
        if (dragMesh && dragMove) {
          if (dragMesh.userData) dragMesh.userData.vfxControlled = false;
          dragMesh.position.set(dragStartX, dragStartY, 0);
          dragMesh.rotation.set(0, 0, 0);
        }
        if (typeof sfx !== 'undefined' && sfx) {
          if (typeof sfx.playBatEcholocation === 'function') sfx.playBatEcholocation();
          if (typeof sfx.playCurseBuzzer === 'function') sfx.playCurseBuzzer();
        }
        triggerBoardShake(0.36);
        snares.forEach((wp) => {
          wp.visible = false;
          spawn3DShockwaveRing(wp.userData.sr, wp.userData.sc, 0xc084fc, 2.8, 520);
          spawn3DParticleBurst(wp.userData.sr, wp.userData.sc, 0xa855f7, 18, 0.15, 520, 'octa');
        });
        if (dragMove) {
          spawn3DColumnBeam(dragMove.toC, 0xc084fc, 0.52, 540, false);
          spawn3DShockwaveRing(dragMove.fromR, dragMove.fromC, 0xa855f7, 2.7, 520);
          spawn3DShockwaveRing(dragMove.toR, dragMove.toC, 0xc084fc, 3.0, 560);
          spawn3DParticleBurst(dragMove.toR, dragMove.toC, 0xe9d5ff, 22, 0.16, 540, 'octa');
        }
        if (typeof onWeave === 'function') onWeave();
      }
      const fadeP = (p - 0.70) / 0.30;
      const s = Math.max(0.01, 1 - fadeP);
      spider.scale.setScalar(s);
      halo.scale.setScalar(1 + fadeP * 0.5);
      halo.userData.outerRing.material.opacity = Math.max(0, 1 - fadeP);
      bossLight.intensity = 3.4 * s;
    }

    if (p >= 0.98 && typeof onComplete === 'function') {
      const cb = onComplete;
      onComplete = null;
      cb();
    }
  });
}

// 36I. SOVEREIGN TESSERACT: Colossal 4D Hypercube Hologram & Dimensional Strut Projection
function playBossSovereignTesseractVFX() {
  const group = new THREE.Group();
  group.position.set(0, VFX_CENTER_Y + 0.15, 1.34);

  const bossLight = new THREE.PointLight(0xfde047, 3.6, 15);
  bossLight.position.set(0, 0.5, 2.2);
  group.add(bossLight);

  const outerCube = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 2.65, 2.65),
    new THREE.MeshBasicMaterial({ color: 0xfde047, wireframe: true, transparent: true, opacity: 0.92 })
  );
  const innerCube = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 1.42, 1.42),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.98 })
  );
  const coreStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.66, 1), C4_VFX_MATS.beeswaxGold);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.07, 12, 36), C4_VFX_MATS.agedBrass);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.055, 12, 36), C4_VFX_MATS.crimsonRuby);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.045, 10, 36), C4_VFX_MATS.quicksilverChrome);

  group.add(outerCube);
  group.add(innerCube);
  group.add(coreStar);
  group.add(ring1);
  group.add(ring2);
  group.add(ring3);

  addTimedVFX(group, 1200, (p) => {
    outerCube.rotation.set(p * Math.PI * 3.0, p * Math.PI * 4.0, 0);
    innerCube.rotation.set(-p * Math.PI * 4.5, -p * Math.PI * 3.5, p * Math.PI * 2.5);
    coreStar.rotation.y = p * Math.PI * 6;
    ring1.rotation.x = p * Math.PI * 5;
    ring2.rotation.y = -p * Math.PI * 5;
    ring3.rotation.z = p * Math.PI * 4;
    const scaleEnv = p < 0.20 ? (p / 0.20) : (p > 0.76 ? (1 - p) / 0.24 : 1);
    const s = Math.max(0.01, scaleEnv);
    group.scale.setScalar(s);
    bossLight.intensity = 3.6 * s;
  });
}
