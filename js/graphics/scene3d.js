// ============================================================================
// THREE.JS 3D CAVERN SCENE, CARVED WOOD BOARD & TOKEN MESHES (js/graphics/scene3d.js)
// ============================================================================
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070609, 0.028);

const initW = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 375);
const initH = Math.max(480, window.innerHeight || document.documentElement.clientHeight || 667);

const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 120);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(initW, initH);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
container.appendChild(renderer.domElement);

const camState = {
  baseRadius: 15.0,
  theta: 0.0,
  phi: 1.5,
  targetTheta: 0.0,
  targetPhi: 1.5
};

function updateCameraAspect() {
  const w = Math.max(300, container.clientWidth || window.innerWidth || 375);
  const h = Math.max(400, container.clientHeight || window.innerHeight || 667);
  const aspect = w / h;
  camera.aspect = aspect;

  if (aspect < 0.55) {
    camera.fov = 53;
    camState.baseRadius = 21.8;
  } else if (aspect < 0.72) {
    camera.fov = 49;
    camState.baseRadius = 19.0;
  } else if (aspect < 1.0) {
    camera.fov = 45;
    camState.baseRadius = 16.5;
  } else if (aspect < 1.45) {
    camera.fov = 43;
    camState.baseRadius = 15.6;
  } else {
    camera.fov = 42;
    camState.baseRadius = 16.2;
  }
  if (typeof getEffectiveUiScalePercent === 'function') {
    const pct = getEffectiveUiScalePercent();
    if (pct > 110) {
      camState.baseRadius += ((pct - 110) / 40) * 1.4;
    }
  }
  camera.updateProjectionMatrix();
  const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
  const maxDpr = perf ? 1.0 : 2.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setSize(w, h);
}

const ambientLight = new THREE.AmbientLight(0xfef3c7, 0.58);
scene.add(ambientLight);

const amberLanternLight = new THREE.PointLight(0xf59e0b, 2.1, 42);
amberLanternLight.position.set(-9.5, 10.5, 7.5);
scene.add(amberLanternLight);

const tealBiolumLight = new THREE.PointLight(0x14b8a6, 2.0, 42);
tealBiolumLight.position.set(9.5, 9.8, 7.2);
scene.add(tealBiolumLight);

function generateCarvedWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#26140c';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.04) * 16;
    const v = Math.floor(30 + Math.sin(y * 0.11 + wave * 0.25) * 14);
    ctx.fillStyle = `rgb(${v + 22}, ${Math.floor(v * 0.68)}, ${Math.floor(v * 0.42)})`;
    ctx.fillRect(0, y, 512, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const woodTex = generateCarvedWoodTexture();

const CELL_SPACING = 1.18;
const BOARD_W = COLS * CELL_SPACING;
const BOARD_H = ROWS * CELL_SPACING;
const START_X = -((COLS - 1) * CELL_SPACING) / 2;
const START_Y = -((ROWS - 1) * CELL_SPACING) / 2 + 0.35;

const boardGroup = new THREE.Group();
scene.add(boardGroup);

const carvedWoodMat = new THREE.MeshStandardMaterial({
  map: woodTex,
  color: 0x6b3419,
  roughness: 0.52,
  metalness: 0.12
});

const brassInlayMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  emissive: 0x78350f,
  emissiveIntensity: 0.35,
  roughness: 0.44,
  metalness: 0.58
});

const bedrockPedestalMat = new THREE.MeshStandardMaterial({
  color: 0x1e1b24,
  emissive: 0x0f172a,
  emissiveIntensity: 0.35,
  roughness: 0.82,
  metalness: 0.22
});

const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 1.5, 0.7, 1.6), carvedWoodMat);
baseMesh.position.set(0, START_Y - 1.0, 0);
boardGroup.add(baseMesh);

const dynamicFrameGroup = new THREE.Group();
boardGroup.add(dynamicFrameGroup);

const ringGeo = new THREE.TorusGeometry(0.43, 0.032, 10, 28);
const enchantRingGeo = new THREE.TorusGeometry(0.36, 0.055, 12, 28);
const tokenInnerRingGeo = new THREE.TorusGeometry(0.22, 0.035, 8, 20);
const cellStrutHGeo = new THREE.BoxGeometry(CELL_SPACING + 0.12, 0.12, 0.72);
const cellStrutVGeo = new THREE.BoxGeometry(0.12, CELL_SPACING + 0.12, 0.72);
const bedrockBlockGeo = new THREE.BoxGeometry(CELL_SPACING * 0.92, CELL_SPACING * 0.92, 0.86);
const bedrockCapGeo = new THREE.BoxGeometry(CELL_SPACING * 1.02, 0.16, 0.98);

const enchantMaterials = {
  [ENCHANT_TYPES.GILDED]: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  [ENCHANT_TYPES.SPICE]: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
  [ENCHANT_TYPES.WEB]: new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
  [ENCHANT_TYPES.AMPLIFIER]: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  [ENCHANT_TYPES.CURSED_SPORE]: new THREE.MeshBasicMaterial({ color: 0x84cc16 })
};

const enchantGroup = new THREE.Group();
boardGroup.add(enchantGroup);

function clearThreeGroup(group) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

const CYLINDER_RADIUS = 4.35;
const cylinderColFrameGroups = [];

function getCylinderColumnAngle(col) {
  const totalCols = (typeof CYLINDER_COLS === 'number') ? CYLINDER_COLS : 12;
  const baseAngle = (col / totalCols) * Math.PI * 2;
  const rot = (typeof state !== 'undefined' && state && Number.isFinite(state.cylinderAngle))
    ? state.cylinderAngle
    : 0;
  return baseAngle + rot;
}

function isCylinderColumnVisible(col) {
  if (typeof state !== 'undefined' && state && state.isCylinderLowering && (state.cylinderDropOffsetY || 0) > 3.2) {
    return true;
  }
  return Math.cos(getCylinderColumnAngle(col)) > -0.05;
}

function isCylinderColumnInteractive(col) {
  if (typeof state !== 'undefined' && state && state.isCylinderLowering) return false;
  return Math.cos(getCylinderColumnAngle(col)) > 0.08;
}

function getCylinderColumnScreenXOrder(colsArray) {
  return [...colsArray].sort((a, b) => Math.sin(getCylinderColumnAngle(a)) - Math.sin(getCylinderColumnAngle(b)));
}

function getCylinderCellWorldCoords(r, c, radialInset = 0) {
  const theta = getCylinderColumnAngle(c);
  const rad = CYLINDER_RADIUS - radialInset;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  return {
    x: rad * sinT,
    y: START_Y + r * CELL_SPACING,
    z: -rad * cosT,
    rotY: -theta,
    cosT,
    sinT
  };
}

function rebuild3DBoardGeometry(mask) {
  clearThreeGroup(dynamicFrameGroup);
  cylinderColFrameGroups.length = 0;

  const isCyl = typeof state !== 'undefined' && state && !!state.isCylinderPhase;
  if (baseMesh) {
    baseMesh.visible = !isCyl;
  }

  if (isCyl) {
    const botCrown = new THREE.Mesh(
      new THREE.TorusGeometry(CYLINDER_RADIUS, 0.14, 14, 64),
      brassInlayMat
    );
    botCrown.rotation.x = Math.PI / 2;
    botCrown.position.set(0, START_Y - CELL_SPACING * 0.5 - 0.12, 0);
    dynamicFrameGroup.add(botCrown);

    const topCrown = new THREE.Mesh(
      new THREE.TorusGeometry(CYLINDER_RADIUS, 0.11, 14, 64),
      brassInlayMat
    );
    topCrown.rotation.x = Math.PI / 2;
    topCrown.position.set(0, START_Y + (ROWS - 0.5) * CELL_SPACING + 0.12, 0);
    dynamicFrameGroup.add(topCrown);

    for (let c = 0; c < COLS; c++) {
      const colGroup = new THREE.Group();
      colGroup.userData = { col: c };
      const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
      for (let r = 0; r < ROWS; r++) {
        const y = START_Y + r * CELL_SPACING;
        const topBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
        topBeam.position.set(0, y + CELL_SPACING * 0.5, 0);
        colGroup.add(topBeam);

        if (!perf || r === 0) {
          const botBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
          botBeam.position.set(0, y - CELL_SPACING * 0.5, 0);
          colGroup.add(botBeam);
        }

        const leftBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
        leftBeam.position.set(-CELL_SPACING * 0.5, y, 0);
        colGroup.add(leftBeam);

        if (!perf) {
          const rightBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
          rightBeam.position.set(CELL_SPACING * 0.5, y, 0);
          colGroup.add(rightBeam);
        }

        const fRing = new THREE.Mesh(ringGeo, brassInlayMat);
        fRing.position.set(0, y, 0.36);
        colGroup.add(fRing);

        if (!perf) {
          const bRing = new THREE.Mesh(ringGeo, brassInlayMat);
          bRing.position.set(0, y, -0.36);
          colGroup.add(bRing);
        }
      }
      dynamicFrameGroup.add(colGroup);
      cylinderColFrameGroups.push(colGroup);
    }
    if (typeof updateCylindricalBoardTransforms === 'function') {
      updateCylindricalBoardTransforms(0);
    }
    return;
  }

  const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = START_X + c * CELL_SPACING;
      const y = START_Y + r * CELL_SPACING;
      const isPlayable = mask && mask[r] ? mask[r][c] : true;

      if (isPlayable) {
        const topBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
        topBeam.position.set(x, y + CELL_SPACING * 0.5, 0);
        dynamicFrameGroup.add(topBeam);

        const belowPlayable = r > 0 && (mask && mask[r - 1] ? mask[r - 1][c] : true);
        if (!perf || !belowPlayable) {
          const botBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
          botBeam.position.set(x, y - CELL_SPACING * 0.5, 0);
          dynamicFrameGroup.add(botBeam);
        }

        const leftBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
        leftBeam.position.set(x - CELL_SPACING * 0.5, y, 0);
        dynamicFrameGroup.add(leftBeam);

        const rightPlayable = c + 1 < COLS && (mask && mask[r] ? mask[r][c + 1] : true);
        if (!perf || !rightPlayable) {
          const rightBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
          rightBeam.position.set(x + CELL_SPACING * 0.5, y, 0);
          dynamicFrameGroup.add(rightBeam);
        }

        const fRing = new THREE.Mesh(ringGeo, brassInlayMat);
        fRing.position.set(x, y, 0.36);
        dynamicFrameGroup.add(fRing);

        if (!perf) {
          const bRing = new THREE.Mesh(ringGeo, brassInlayMat);
          bRing.position.set(x, y, -0.36);
          dynamicFrameGroup.add(bRing);
        }
      } else {
        let hasPlayableAbove = false;
        for (let rr = r + 1; rr < ROWS; rr++) {
          if (mask[rr][c]) {
            hasPlayableAbove = true;
            break;
          }
        }
        if (hasPlayableAbove) {
          const rock = new THREE.Mesh(bedrockBlockGeo, bedrockPedestalMat);
          rock.position.set(x, y, 0);
          dynamicFrameGroup.add(rock);

          if (r + 1 < ROWS && mask[r + 1][c]) {
            const shelfCap = new THREE.Mesh(bedrockCapGeo, brassInlayMat);
            shelfCap.position.set(x, y + CELL_SPACING * 0.46, 0);
            dynamicFrameGroup.add(shelfCap);
          }
        }
      }
    }
  }
}

// ============================================================================
// MULTI-LAYERED 3D SUBTERRANEAN CAVERN ARCHITECTURE & OMINOUS BOSS PROGRESSION
//   • Tier 0 (Act I - Pre-Boss 1, Floors 1-3): Bioluminescent Grotto
//   • Tier 1 (Act II - Post-Boss 1, Floors 4-6): Molten Blood-Obsidian Chasm
//   • Tier 2 (Act III - Post-Boss 2, Floors 7-9): Eldritch Abyssal Sanctum
//   • Tier 3 (Final Boss Wounded / Post-Boss 3 Apex): Cataclysmic Void Eclipse
// ============================================================================

function generateStratifiedBasaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#121018';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 3) {
    const ridge = Math.sin(y * 0.055) * 18 + Math.cos(y * 0.14) * 9;
    const shade = Math.max(10, Math.min(64, Math.floor(26 + Math.sin(y * 0.09 + ridge * 0.15) * 14)));
    ctx.fillStyle = `rgb(${shade + 4}, ${shade + 2}, ${shade + 11})`;
    ctx.fillRect(0, y, 512, 3);
  }

  for (let i = 0; i < 42; i++) {
    const cx = (i * 73) % 512;
    const cy = (i * 137) % 512;
    const w = 28 + (i % 5) * 18;
    const h = 2 + (i % 3);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(cx, cy, w, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function generateGlowSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.16)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function generateCavernMistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 128);
  const grad = ctx.createRadialGradient(128, 64, 10, 128, 64, 118);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(canvas);
}

const basaltTex = generateStratifiedBasaltTexture();
const glowSpriteTex = generateGlowSpriteTexture();
const cavernMistTex = generateCavernMistTexture();

// Dedicated Cavern Depth & Rim Lights (positioned behind the board at z < -2.5)
const cavernRimLightLeft = new THREE.PointLight(0x14b8a6, 2.6, 38);
cavernRimLightLeft.position.set(-9.5, 4.5, -5.5);
scene.add(cavernRimLightLeft);

const cavernRimLightRight = new THREE.PointLight(0xf59e0b, 2.6, 38);
cavernRimLightRight.position.set(9.5, 4.5, -5.5);
scene.add(cavernRimLightRight);

const cavernChasmLight = new THREE.PointLight(0x0d9488, 3.2, 42);
cavernChasmLight.position.set(0, -7.2, -5.0);
scene.add(cavernChasmLight);

const cavernVaultLight = new THREE.PointLight(0x38bdf8, 1.8, 45);
cavernVaultLight.position.set(0, 8.8, -10.5);
scene.add(cavernVaultLight);

// Master Cavern Materials (dynamically tinted by updateCavernAesthetics)
const caveRockMat = new THREE.MeshStandardMaterial({
  map: basaltTex,
  color: 0x1e2230,
  emissive: 0x090d16,
  emissiveIntensity: 0.32,
  roughness: 0.84,
  metalness: 0.14
});

const caveDeepWallMat = new THREE.MeshStandardMaterial({
  map: basaltTex,
  color: 0x141722,
  emissive: 0x070a12,
  emissiveIntensity: 0.28,
  roughness: 0.9,
  metalness: 0.08
});

const cavePillarMat = new THREE.MeshStandardMaterial({
  map: basaltTex,
  color: 0x232738,
  emissive: 0x0b111e,
  emissiveIntensity: 0.35,
  roughness: 0.76,
  metalness: 0.22
});

const caveIronMat = new THREE.MeshStandardMaterial({
  color: 0x27272a,
  emissive: 0x09090b,
  emissiveIntensity: 0.25,
  roughness: 0.42,
  metalness: 0.82
});

const caveCrystalMatPrimary = new THREE.MeshStandardMaterial({
  color: 0x2dd4bf,
  emissive: 0x0d9488,
  emissiveIntensity: 0.95,
  roughness: 0.18,
  metalness: 0.35,
  transparent: true,
  opacity: 0.92
});

const caveCrystalMatSecondary = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  emissive: 0xd97706,
  emissiveIntensity: 0.88,
  roughness: 0.2,
  metalness: 0.38,
  transparent: true,
  opacity: 0.92
});

const caveVeinMat = new THREE.MeshBasicMaterial({
  color: 0x2dd4bf,
  transparent: true,
  opacity: 0.36,
  blending: THREE.AdditiveBlending
});

const caveFissureMat = new THREE.MeshBasicMaterial({
  color: 0xf97316,
  transparent: true,
  opacity: 0.22,
  blending: THREE.AdditiveBlending
});

const caveBrazierCoreMat = new THREE.MeshBasicMaterial({
  color: 0xfbbf24,
  transparent: true,
  opacity: 0.92,
  blending: THREE.AdditiveBlending
});

const caveChasmCoreMat = new THREE.MeshBasicMaterial({
  color: 0x0d9488,
  transparent: true,
  opacity: 0.26,
  blending: THREE.AdditiveBlending
});

const caveMistMat = new THREE.MeshBasicMaterial({
  map: cavernMistTex,
  color: 0x14b8a6,
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const cavernEnvGroup = new THREE.Group();
scene.add(cavernEnvGroup);

// Deterministic pseudo-random helper so the cavern architecture is sculptural and balanced
function cavernSeededRand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 1. SUBTERRANEAN ALTAR PEDESTAL & CHASM BRIDGE (Directly beneath the Connect 4 board)
const cavernAltarGroup = new THREE.Group();
cavernEnvGroup.add(cavernAltarGroup);

const altarUpperLedge = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 2.6, 0.55, 2.4), cavePillarMat);
altarUpperLedge.position.set(0, START_Y - 1.55, -0.35);
cavernAltarGroup.add(altarUpperLedge);

const altarDeepPlinth = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 4.2, 1.1, 3.2), caveRockMat);
altarDeepPlinth.position.set(0, START_Y - 2.35, -0.85);
cavernAltarGroup.add(altarDeepPlinth);

// Glowing runic trim channels inlaid into the stone altar beneath the board
const altarRuneMeshes = [];
for (let i = -3; i <= 3; i++) {
  const runeStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.09, 0.08),
    caveVeinMat
  );
  runeStrip.position.set(i * 1.32, START_Y - 1.55, 0.86);
  cavernAltarGroup.add(runeStrip);
  altarRuneMeshes.push(runeStrip);
}

// Twin subterranean bridge buttress piers plunging into the abyss
[-4.2, -1.6, 1.6, 4.2].forEach((px, idx) => {
  const pier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.95, 6.5, 6),
    caveRockMat
  );
  pier.position.set(px, START_Y - 5.8, -1.1 - (idx % 2) * 0.4);
  cavernAltarGroup.add(pier);

  const corbel = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.7, 2.2),
    cavePillarMat
  );
  corbel.position.set(px, START_Y - 2.95, -0.9);
  cavernAltarGroup.add(corbel);
});

// Glowing chasm floor plane deep below the altar bridge
const chasmGlowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 22),
  caveChasmCoreMat
);
chasmGlowPlane.rotation.x = -Math.PI / 2;
chasmGlowPlane.position.set(0, -9.2, -8.5);
cavernEnvGroup.add(chasmGlowPlane);

// 2. FLANKING MEGALITHIC BASALT PILLARS & RIBBED CATHEDRAL VAULT ARCHES
const cavernPillarsGroup = new THREE.Group();
cavernEnvGroup.add(cavernPillarsGroup);
const pillarVeinMeshes = [];

const PILLAR_LAYOUT = [
  { x: -6.8, z: -3.2, r: 0.95, h: 17.5, tiltZ: -0.08 },
  { x:  6.8, z: -3.2, r: 0.95, h: 17.5, tiltZ:  0.08 },
  { x: -9.6, z: -6.8, r: 1.35, h: 20.0, tiltZ: -0.12 },
  { x:  9.6, z: -6.8, r: 1.35, h: 20.0, tiltZ:  0.12 },
  { x: -12.4, z: -11.2, r: 1.75, h: 23.0, tiltZ: -0.15 },
  { x:  12.4, z: -11.2, r: 1.75, h: 23.0, tiltZ:  0.15 }
];

PILLAR_LAYOUT.forEach((p, idx) => {
  const pillarGroup = new THREE.Group();
  pillarGroup.position.set(p.x, 0.2, p.z);
  pillarGroup.rotation.z = p.tiltZ;

  // Lower, middle, and upper segmented basalt shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(p.r * 0.86, p.r * 1.12, p.h, 6),
    cavePillarMat
  );
  shaft.rotation.y = (idx * Math.PI) / 6;
  pillarGroup.add(shaft);

  // Craggy rock collar bands
  [-3.2, 0.4, 4.0].forEach((by, bIdx) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(p.r * 1.08, p.r * 1.16, 0.65, 6),
      caveRockMat
    );
    band.position.y = by;
    band.rotation.y = bIdx * 0.5;
    pillarGroup.add(band);
  });

  // Inward-arching cathedral vault rib at the top of each pillar
  const ribArch = new THREE.Mesh(
    new THREE.BoxGeometry(p.r * 1.3, 4.8, p.r * 1.2),
    caveRockMat
  );
  ribArch.position.set(p.x < 0 ? 1.4 : -1.4, p.h * 0.42, 0);
  ribArch.rotation.z = p.x < 0 ? -0.58 : 0.58;
  pillarGroup.add(ribArch);

  // Glowing mineral/magma/void vein strip along the inner face of the pillar
  const vein = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, p.h * 0.68, 0.14),
    caveVeinMat
  );
  vein.position.set(p.x < 0 ? p.r * 0.82 : -p.r * 0.82, 0.2, p.r * 0.48);
  pillarGroup.add(vein);
  pillarVeinMeshes.push(vein);

  cavernPillarsGroup.add(pillarGroup);
});

// 3. SUSPENDED WROUGHT-IRON LANTERN BRAZIERS (Pendulum swaying in loop.js)
const cavernBraziers = [];
[-5.55, 5.55].forEach((bx, idx) => {
  const pivot = new THREE.Group();
  pivot.position.set(bx, 6.8, -2.85);

  // Multi-link suspension chain
  for (let link = 0; link < 5; link++) {
    const chainSeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.52, 6),
      caveIronMat
    );
    chainSeg.position.y = -0.26 - link * 0.48;
    pivot.add(chainSeg);
  }

  // Iron brazier basket at bottom of chain
  const cageGroup = new THREE.Group();
  cageGroup.position.y = -2.75;
  pivot.add(cageGroup);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.22, 0.38, 7),
    caveIronMat
  );
  cageGroup.add(bowl);

  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 0.26, 7),
    caveIronMat
  );
  cap.position.y = 0.56;
  cageGroup.add(cap);

  for (let strut = 0; strut < 4; strut++) {
    const a = (strut * Math.PI) / 2;
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.58, 5),
      caveIronMat
    );
    bar.position.set(Math.cos(a) * 0.32, 0.26, Math.sin(a) * 0.32);
    cageGroup.add(bar);
  }

  const flameCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 1),
    caveBrazierCoreMat
  );
  flameCore.position.y = 0.24;
  cageGroup.add(flameCore);

  const flameHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 10, 10),
    new THREE.MeshBasicMaterial({
      color: idx === 0 ? 0xf59e0b : 0x2dd4bf,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    })
  );
  flameHalo.position.y = 0.24;
  cageGroup.add(flameHalo);

  cavernEnvGroup.add(pivot);
  cavernBraziers.push({ pivot, flameCore, flameHalo, phase: idx * 2.1, side: idx });
});

// 4. COMPOUND SCULPTED STALACTITE & STALAGMITE SPELEOTHEM FORMATIONS
const cavernSpeleothemGroup = new THREE.Group();
cavernEnvGroup.add(cavernSpeleothemGroup);
const stalactiteDripTips = [];

for (let i = 0; i < 42; i++) {
  const r1 = cavernSeededRand(i * 3 + 1);
  const r2 = cavernSeededRand(i * 3 + 2);
  const r3 = cavernSeededRand(i * 3 + 3);
  const isTop = i % 2 === 0;

  // Keep central foreground clear of the board, populate fuller around edges & deep vault
  let x = (r1 - 0.5) * 28;
  const z = -3.4 - r2 * 15.5;
  if (z > -6.0 && Math.abs(x) < 5.2) {
    x = (x < 0 ? -1 : 1) * (5.4 + r3 * 4.5);
  }

  const h = 2.8 + r3 * 5.8;
  const rad = 0.48 + r1 * 0.85;
  const formGroup = new THREE.Group();
  const baseY = isTop ? (7.4 + r2 * 2.4) : (-6.4 - r2 * 2.2);
  formGroup.position.set(x, baseY, z);
  if (isTop) formGroup.rotation.x = Math.PI;

  const mainCone = new THREE.Mesh(
    new THREE.ConeGeometry(rad, h, 6),
    i % 3 === 0 ? cavePillarMat : caveRockMat
  );
  mainCone.rotation.y = r1 * Math.PI;
  formGroup.add(mainCone);

  // Flanking secondary craggy spurs on each speleothem cluster
  for (let s = 0; s < 2; s++) {
    const spurH = h * (0.45 + s * 0.18);
    const spur = new THREE.Mesh(
      new THREE.ConeGeometry(rad * 0.55, spurH, 5),
      caveRockMat
    );
    const ang = r2 * Math.PI * 2 + s * 2.4;
    spur.position.set(Math.cos(ang) * rad * 0.52, -h * 0.18, Math.sin(ang) * rad * 0.52);
    spur.rotation.z = (s === 0 ? 0.16 : -0.16);
    formGroup.add(spur);
  }

  // Glowing mineral / magma drip-tip on ceiling stalactites
  if (isTop && i % 4 === 0) {
    const tip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      caveVeinMat
    );
    tip.position.y = h * 0.52;
    formGroup.add(tip);
    stalactiteDripTips.push({ mesh: tip, phase: i * 0.7 });
  }

  cavernSpeleothemGroup.add(formGroup);
}

// 5. SUBTERRANEAN BIOLUMINESCENT / CORRUPT CRYSTAL CLUSTERS
const cavernCrystals = [];
const CRYSTAL_LOCATIONS = [
  { x: -5.4, y: -3.2, z: -2.6, scale: 0.95, primary: true,  rotZ: -0.35 },
  { x:  5.4, y: -3.2, z: -2.6, scale: 0.95, primary: false, rotZ:  0.35 },
  { x: -7.6, y: -1.2, z: -4.2, scale: 1.15, primary: true,  rotZ: -0.48 },
  { x:  7.6, y: -1.2, z: -4.2, scale: 1.15, primary: false, rotZ:  0.48 },
  { x: -6.8, y:  3.2, z: -4.5, scale: 0.88, primary: false, rotZ: -0.65 },
  { x:  6.8, y:  3.2, z: -4.5, scale: 0.88, primary: true,  rotZ:  0.65 },
  { x: -9.8, y: -4.4, z: -7.4, scale: 1.45, primary: true,  rotZ: -0.28 },
  { x:  9.8, y: -4.4, z: -7.4, scale: 1.45, primary: false, rotZ:  0.28 },
  { x: -3.2, y: -5.2, z: -5.8, scale: 1.05, primary: false, rotZ:  0.18 },
  { x:  3.2, y: -5.2, z: -5.8, scale: 1.05, primary: true,  rotZ: -0.18 }
];

CRYSTAL_LOCATIONS.forEach((loc, idx) => {
  const cluster = new THREE.Group();
  cluster.position.set(loc.x, loc.y, loc.z);
  cluster.rotation.z = loc.rotZ;
  cluster.scale.setScalar(loc.scale);

  const shardMat = loc.primary ? caveCrystalMatPrimary : caveCrystalMatSecondary;
  const shardAngles = [
    { rx:  0.0,  rz:  0.0,  h: 1.35, r: 0.18 },
    { rx:  0.28, rz:  0.36, h: 0.98, r: 0.14 },
    { rx: -0.24, rz: -0.38, h: 1.05, r: 0.15 },
    { rx:  0.35, rz: -0.22, h: 0.76, r: 0.12 },
    { rx: -0.32, rz:  0.28, h: 0.82, r: 0.12 }
  ];

  shardAngles.forEach((sa) => {
    const shard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, sa.r, sa.h, 6),
      shardMat
    );
    shard.position.y = sa.h * 0.42;
    shard.rotation.set(sa.rx, idx * 0.6, sa.rz);
    cluster.add(shard);
  });

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({
      color: loc.primary ? 0x2dd4bf : 0xfbbf24,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending
    })
  );
  halo.position.y = 0.45;
  cluster.add(halo);

  cavernEnvGroup.add(cluster);
  cavernCrystals.push({ group: cluster, halo, primary: loc.primary, baseScale: loc.scale, phase: idx * 0.85 });
});

// 6. DEEP CAVERN VAULT BACKDROP & TECTONIC FAULT FISSURES
const cavernBackdropGroup = new THREE.Group();
cavernEnvGroup.add(cavernBackdropGroup);
const cavernFissureMeshes = [];

for (let i = 0; i < 9; i++) {
  const bx = (i - 4) * 4.2;
  const bz = -15.5 - Math.abs(i - 4) * 0.65;
  const wallSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 24.0, 2.4),
    caveDeepWallMat
  );
  wallSlab.position.set(bx, 0.5, bz);
  wallSlab.rotation.y = (4 - i) * 0.08;
  wallSlab.rotation.z = Math.sin(i * 1.7) * 0.06;
  cavernBackdropGroup.add(wallSlab);
}

// Branching tectonic fault fissures across the deep cavern wall
const FISSURE_SEGMENTS = [
  { x: -6.2, y:  3.4, z: -13.8, w: 0.16, h: 4.6, rz: -0.42 },
  { x: -4.4, y:  0.8, z: -14.1, w: 0.14, h: 3.8, rz:  0.28 },
  { x: -7.5, y: -1.8, z: -13.6, w: 0.12, h: 3.4, rz:  0.52 },
  { x:  0.0, y:  4.6, z: -14.4, w: 0.18, h: 5.2, rz:  0.18 },
  { x:  1.4, y:  1.2, z: -14.3, w: 0.14, h: 4.2, rz: -0.36 },
  { x: -1.2, y: -2.4, z: -14.2, w: 0.15, h: 4.4, rz:  0.32 },
  { x:  5.8, y:  3.1, z: -13.9, w: 0.16, h: 4.8, rz:  0.38 },
  { x:  4.5, y: -0.6, z: -14.1, w: 0.14, h: 3.9, rz: -0.31 },
  { x:  7.4, y: -2.6, z: -13.7, w: 0.13, h: 3.5, rz: -0.48 },
  { x: -2.8, y: -5.4, z: -11.5, w: 0.22, h: 5.0, rz:  1.15 },
  { x:  2.8, y: -5.4, z: -11.5, w: 0.22, h: 5.0, rz: -1.15 }
];

FISSURE_SEGMENTS.forEach((fs, idx) => {
  const crack = new THREE.Mesh(
    new THREE.BoxGeometry(fs.w, fs.h, 0.12),
    caveFissureMat
  );
  crack.position.set(fs.x, fs.y, fs.z);
  crack.rotation.z = fs.rz;
  cavernBackdropGroup.add(crack);
  cavernFissureMeshes.push({ mesh: crack, baseW: fs.w, phase: idx * 0.55 });
});

// ============================================================================
// 7. BOSS-PROGRESSION EXCLUSIVE OMINOUS STRUCTURES
//    • Act II (Post-Boss 1): Jagged Obsidian Monolith Spikes & Blood Runes
//    • Act III (Post-Boss 2): Awakened Eldritch Watcher Eyes & Void Monoliths
// ============================================================================

// 7A. Post-Boss 1: Jagged Obsidian Spikes & Blood-Rune Pylons
const obsidianSpikesGroup = new THREE.Group();
obsidianSpikesGroup.visible = false;
cavernEnvGroup.add(obsidianSpikesGroup);

const obsidianSpikeMat = new THREE.MeshStandardMaterial({
  color: 0x18090d,
  emissive: 0x881337,
  emissiveIntensity: 0.55,
  roughness: 0.24,
  metalness: 0.78
});

const bloodRuneTipMat = new THREE.MeshBasicMaterial({
  color: 0xf43f5e,
  transparent: true,
  opacity: 0.88,
  blending: THREE.AdditiveBlending
});

const OBSIDIAN_SPIKE_COORDS = [
  { x: -5.8, y: -4.8, z: -3.8, h: 4.6, r: 0.52, rz: -0.28 },
  { x:  5.8, y: -4.8, z: -3.8, h: 4.6, r: 0.52, rz:  0.28 },
  { x: -8.2, y: -4.2, z: -5.6, h: 6.2, r: 0.68, rz: -0.36 },
  { x:  8.2, y: -4.2, z: -5.6, h: 6.2, r: 0.68, rz:  0.36 },
  { x: -6.4, y:  4.8, z: -5.2, h: 4.2, r: 0.46, rz: -2.65 },
  { x:  6.4, y:  4.8, z: -5.2, h: 4.2, r: 0.46, rz:  2.65 },
  { x: -10.6, y: -2.5, z: -8.2, h: 7.4, r: 0.82, rz: -0.22 },
  { x:  10.6, y: -2.5, z: -8.2, h: 7.4, r: 0.82, rz:  0.22 }
];

OBSIDIAN_SPIKE_COORDS.forEach((sp, idx) => {
  const spikeWrap = new THREE.Group();
  spikeWrap.position.set(sp.x, sp.y, sp.z);
  spikeWrap.rotation.z = sp.rz;

  const mainSpike = new THREE.Mesh(
    new THREE.ConeGeometry(sp.r, sp.h, 4),
    obsidianSpikeMat
  );
  mainSpike.rotation.y = idx * 0.8;
  spikeWrap.add(mainSpike);

  const runeRing = new THREE.Mesh(
    new THREE.TorusGeometry(sp.r * 0.68, 0.045, 6, 16),
    bloodRuneTipMat
  );
  runeRing.rotation.x = Math.PI / 2;
  runeRing.position.y = sp.h * 0.18;
  spikeWrap.add(runeRing);

  const tipGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    bloodRuneTipMat
  );
  tipGem.position.y = sp.h * 0.54;
  spikeWrap.add(tipGem);

  obsidianSpikesGroup.add(spikeWrap);
});

// 7B. Post-Boss 2: Awakened Eldritch Watcher Eyes & Levitating Void Monoliths
const eldritchWatchersGroup = new THREE.Group();
eldritchWatchersGroup.visible = false;
cavernEnvGroup.add(eldritchWatchersGroup);

const eldritchEyeScleraMat = new THREE.MeshBasicMaterial({
  color: 0x3b0764,
  transparent: true,
  opacity: 0.92
});

const eldritchEyeIrisMat = new THREE.MeshBasicMaterial({
  color: 0xf43f5e,
  transparent: true,
  opacity: 0.96,
  blending: THREE.AdditiveBlending
});

const eldritchEyePupilMat = new THREE.MeshBasicMaterial({
  color: 0x050208
});

const eldritchWatchers = [];
const WATCHER_COORDS = [
  { x: -7.8, y:  2.2, z: -5.4, scale: 0.92 },
  { x:  7.8, y:  2.2, z: -5.4, scale: 0.92 },
  { x: -4.8, y:  5.3, z: -6.8, scale: 0.78 },
  { x:  4.8, y:  5.3, z: -6.8, scale: 0.78 },
  { x:  0.0, y:  6.4, z: -9.2, scale: 1.35 }
];

WATCHER_COORDS.forEach((wc, idx) => {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(wc.x, wc.y, wc.z);
  eyeGroup.scale.setScalar(wc.scale);

  // Outer eldritch halo ring
  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.04, 8, 24),
    eldritchEyeIrisMat
  );
  eyeGroup.add(auraRing);

  // Eyeball core
  const eyeball = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 14, 14),
    eldritchEyeScleraMat
  );
  eyeball.scale.set(1.25, 0.88, 0.65);
  eyeGroup.add(eyeball);

  // Glowing Iris disc
  const iris = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16),
    eldritchEyeIrisMat
  );
  iris.rotation.x = Math.PI / 2;
  iris.position.z = 0.29;
  eyeGroup.add(iris);

  // Vertical Slit Pupil
  const pupil = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.42, 0.06),
    eldritchEyePupilMat
  );
  pupil.position.z = 0.33;
  eyeGroup.add(pupil);

  // Upper & Lower Eyelids for blinking
  const upperLid = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.46, 0.72),
    caveDeepWallMat
  );
  upperLid.position.set(0, 0.36, 0.08);
  eyeGroup.add(upperLid);

  const lowerLid = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.46, 0.72),
    caveDeepWallMat
  );
  lowerLid.position.set(0, -0.36, 0.08);
  eyeGroup.add(lowerLid);

  eldritchWatchersGroup.add(eyeGroup);
  eldritchWatchers.push({
    group: eyeGroup,
    auraRing,
    iris,
    pupil,
    upperLid,
    lowerLid,
    baseScale: wc.scale,
    phase: idx * 1.65
  });
});

// Levitating Anti-Gravity Void Monoliths & Ophanim Rings (Post-Boss 2)
const voidMonolithsGroup = new THREE.Group();
voidMonolithsGroup.visible = false;
cavernEnvGroup.add(voidMonolithsGroup);

const voidRuneRingMat = new THREE.MeshBasicMaterial({
  color: 0xc084fc,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending
});

const voidMonoliths = [];
const MONOLITH_COORDS = [
  { x: -6.4, y: -0.4, z: -5.2, scale: 0.88 },
  { x:  6.4, y: -0.4, z: -5.2, scale: 0.88 },
  { x: -9.2, y:  1.4, z: -8.6, scale: 1.15 },
  { x:  9.2, y:  1.4, z: -8.6, scale: 1.15 }
];

MONOLITH_COORDS.forEach((mc, idx) => {
  const mGroup = new THREE.Group();
  mGroup.position.set(mc.x, mc.y, mc.z);
  mGroup.scale.setScalar(mc.scale);

  const obelisk = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.62, 0),
    obsidianSpikeMat
  );
  obelisk.scale.set(0.75, 1.85, 0.75);
  mGroup.add(obelisk);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.035, 8, 24),
    voidRuneRingMat
  );
  mGroup.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.028, 8, 24),
    bloodRuneTipMat
  );
  ring2.rotation.x = Math.PI / 3;
  mGroup.add(ring2);

  voidMonolithsGroup.add(mGroup);
  voidMonoliths.push({
    group: mGroup,
    obelisk,
    ring1,
    ring2,
    baseY: mc.y,
    phase: idx * 1.4
  });
});

// 7C. Act IV (Post-Boss 3): Astral Singularity Gyroscopes & Crystalline Silk Web Strands
const act4SingularityGroup = new THREE.Group();
act4SingularityGroup.visible = false;
cavernEnvGroup.add(act4SingularityGroup);

const singularityCyanMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.86,
  blending: THREE.AdditiveBlending
});

const singularityIndigoMat = new THREE.MeshBasicMaterial({
  color: 0x818cf8,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending
});

const singularityGyros = [];
[
  { x: -7.2, y: 3.6, z: -5.8, scale: 1.05 },
  { x:  7.2, y: 3.6, z: -5.8, scale: 1.05 },
  { x:  0.0, y: 5.8, z: -8.4, scale: 1.45 }
].forEach((gLoc, idx) => {
  const gWrap = new THREE.Group();
  gWrap.position.set(gLoc.x, gLoc.y, gLoc.z);
  gWrap.scale.setScalar(gLoc.scale);

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), singularityCyanMat);
  gWrap.add(core);

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 28), singularityCyanMat);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.032, 8, 28), singularityIndigoMat);
  ringB.rotation.x = Math.PI / 3;
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.025, 8, 28), bloodRuneTipMat);
  ringC.rotation.y = Math.PI / 3;

  gWrap.add(ringA);
  gWrap.add(ringB);
  gWrap.add(ringC);

  act4SingularityGroup.add(gWrap);
  singularityGyros.push({ group: gWrap, core, ringA, ringB, ringC, phase: idx * 1.3 });
});

// Crystalline Silk Web Strands spanning the upper cavern vault in Act IV
for (let w = 0; w < 8; w++) {
  const strand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 15.0, 5),
    singularityIndigoMat
  );
  strand.position.set((w - 3.5) * 2.4, 4.2 + (w % 2) * 1.4, -6.5 - (w % 3) * 1.8);
  strand.rotation.z = 0.65 + (w % 3) * 0.35;
  act4SingularityGroup.add(strand);
}

// 7D. Act V (Post-Boss 4 & Final Boss): Sovereign Tesseract Hypercube & 4 Orbiting Phantom Boards
const act5TesseractGroup = new THREE.Group();
act5TesseractGroup.visible = false;
cavernEnvGroup.add(act5TesseractGroup);

const tesseractGoldMat = new THREE.MeshBasicMaterial({
  color: 0xfbbf24,
  transparent: true,
  opacity: 0.88,
  blending: THREE.AdditiveBlending
});

const tesseractCrimsonMat = new THREE.MeshBasicMaterial({
  color: 0xf43f5e,
  transparent: true,
  opacity: 0.72,
  blending: THREE.AdditiveBlending
});

const tesseractShatteredMat = new THREE.MeshBasicMaterial({
  color: 0x334155,
  transparent: true,
  opacity: 0.22
});

const phantomBoards = [];
[
  { x: -8.6, y:  2.4, z: -6.8, idx: 0 },
  { x:  8.6, y:  2.4, z: -6.8, idx: 1 },
  { x: -6.2, y: -3.2, z: -5.4, idx: 2 },
  { x:  6.2, y: -3.2, z: -5.4, idx: 3 }
].forEach((pb) => {
  const pFrame = new THREE.Group();
  pFrame.position.set(pb.x, pb.y, pb.z);

  const outerBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.85, 0.14),
    cavePillarMat
  );
  pFrame.add(outerBox);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.045, 8, 4),
    pb.idx === 0 ? tesseractGoldMat : tesseractCrimsonMat
  );
  rim.rotation.z = Math.PI / 4;
  pFrame.add(rim);

  act5TesseractGroup.add(pFrame);
  phantomBoards.push({ group: pFrame, outerBox, rim, baseX: pb.x, baseY: pb.y, baseZ: pb.z, idx: pb.idx });
});

// 7E. Act V Phase 3 (1/5 HP Final Phase): Ethereal Cosmic 4D Plane (Revealed after Cavern Crumbles)
const etherealPlaneGroup = new THREE.Group();
etherealPlaneGroup.visible = false;
scene.add(etherealPlaneGroup);

const etherealGoldWireMat = new THREE.MeshBasicMaterial({
  color: 0xfde047,
  wireframe: true,
  transparent: true,
  opacity: 0.72,
  blending: THREE.AdditiveBlending
});
const etherealCyanWireMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  wireframe: true,
  transparent: true,
  opacity: 0.68,
  blending: THREE.AdditiveBlending
});
const etherealVioletWireMat = new THREE.MeshBasicMaterial({
  color: 0xc084fc,
  wireframe: true,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending
});

const etherealAstrolabeRings = [];
[
  { radius: 12.2, tube: 0.065, mat: tesseractGoldMat, rx: 0.95, ry: 0.25, speedX: 0.22, speedY: 0.31, speedZ: 0.14 },
  { radius: 16.8, tube: 0.055, mat: etherealCyanWireMat, rx: 1.42, ry: -0.45, speedX: -0.18, speedY: 0.24, speedZ: -0.19 },
  { radius: 21.5, tube: 0.075, mat: etherealVioletWireMat, rx: 0.48, ry: 0.85, speedX: 0.14, speedY: -0.22, speedZ: 0.27 },
  { radius: 9.2,  tube: 0.045, mat: tesseractCrimsonMat, rx: Math.PI / 2, ry: 0, speedX: 0.08, speedY: -0.35, speedZ: 0.12 }
].forEach((cfg) => {
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 12, 72), cfg.mat);
  ringMesh.rotation.set(cfg.rx, cfg.ry, 0);
  etherealPlaneGroup.add(ringMesh);
  etherealAstrolabeRings.push({ mesh: ringMesh, ...cfg });
});

const etherealHypercubes = [];
[
  { x: -11.5, y:  5.2, z: -11.5, scale: 1.35, phase: 0.0 },
  { x:  11.5, y:  5.2, z: -11.5, scale: 1.35, phase: 1.6 },
  { x: -13.0, y: -3.6, z: -10.0, scale: 1.15, phase: 3.1 },
  { x:  13.0, y: -3.6, z: -10.0, scale: 1.15, phase: 4.7 },
  { x:   0.0, y:  7.8, z: -14.5, scale: 1.75, phase: 2.4 },
  { x:   0.0, y: -6.8, z: -13.5, scale: 1.55, phase: 5.2 }
].forEach((hc, idx) => {
  const hGroup = new THREE.Group();
  hGroup.position.set(hc.x, hc.y, hc.z);
  hGroup.scale.setScalar(hc.scale);
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.9, 1.9),
    idx % 2 === 0 ? etherealGoldWireMat : etherealCyanWireMat
  );
  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.0, 1.0),
    etherealVioletWireMat
  );
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    tesseractGoldMat
  );
  hGroup.add(outer);
  hGroup.add(inner);
  hGroup.add(core);
  etherealPlaneGroup.add(hGroup);
  etherealHypercubes.push({ group: hGroup, outer, inner, core, baseY: hc.y, phase: hc.phase });
});

const etherealStarCount = 260;
const etherealStarGeo = new THREE.BufferGeometry();
const etherealStarPositions = new Float32Array(etherealStarCount * 3);
for (let i = 0; i < etherealStarCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 8.5 + Math.random() * 20.0;
  etherealStarPositions[i * 3] = Math.cos(angle) * dist;
  etherealStarPositions[i * 3 + 1] = (Math.random() - 0.5) * 26.0;
  etherealStarPositions[i * 3 + 2] = -Math.abs(Math.sin(angle) * dist) - 2.0;
}
etherealStarGeo.setAttribute('position', new THREE.BufferAttribute(etherealStarPositions, 3));
const etherealStarMat = new THREE.PointsMaterial({
  color: 0xfef08a,
  size: 0.34,
  map: glowSpriteTex,
  transparent: true,
  opacity: 0.88,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const etherealStarField = new THREE.Points(etherealStarGeo, etherealStarMat);
etherealPlaneGroup.add(etherealStarField);

function getAllCavernCrumbleTargets() {
  const compositeGroups = new Set([
    cavernAltarGroup,
    cavernPillarsGroup,
    cavernSpeleothemGroup,
    cavernBackdropGroup,
    obsidianSpikesGroup,
    eldritchWatchersGroup,
    voidMonolithsGroup,
    act4SingularityGroup,
    act5TesseractGroup
  ]);
  const targets = [];
  cavernEnvGroup.children.forEach((child) => {
    if (!child) return;
    if (compositeGroups.has(child) && Array.isArray(child.children) && child.children.length > 0) {
      child.children.forEach((sub) => {
        if (sub) targets.push(sub);
      });
    } else {
      targets.push(child);
    }
  });
  return targets;
}

function resetCavernFromEtherealPlane() {
  if (typeof state !== 'undefined' && state) {
    state.etherealPlaneActive = false;
    state.isCavernCrumbling = false;
  }
  cavernEnvGroup.visible = true;
  cavernEnvGroup.position.set(0, 0, 0);
  cavernEnvGroup.rotation.set(0, 0, 0);
  getAllCavernCrumbleTargets().forEach((item) => {
    if (item && item.userData && item.userData._origCached) {
      item.position.copy(item.userData._origPos);
      item.rotation.copy(item.userData._origRot);
      item.scale.copy(item.userData._origScale);
    }
  });
  phantomBoards.forEach((pb) => {
    pb.outerBox.visible = true;
    pb.outerBox.rotation.set(0, 0, 0);
    pb.group.scale.setScalar(1);
  });
  etherealPlaneGroup.visible = false;
  etherealPlaneGroup.scale.setScalar(1);
}

function triggerCavernCrumbleToEtherealPlane(onComplete = null) {
  if (typeof state !== 'undefined' && state) {
    state.etherealPlaneActive = true;
    state.isCavernCrumbling = true;
  }

  const targets = getAllCavernCrumbleTargets();
  targets.forEach((item, idx) => {
    if (!item.userData) item.userData = {};
    if (!item.userData._origCached) {
      item.userData._origCached = true;
      item.userData._origPos = item.position.clone();
      item.userData._origRot = item.rotation.clone();
      item.userData._origScale = item.scale.clone();
    }
    // Stagger detachment slightly (0.00 -> 0.22) and drop 46 to 62 world units
    // so even the 24-unit-tall deep backdrop walls & cathedral pillars fall 100% below the camera frustum!
    item.userData._crumbleDelay = (idx % 8) * 0.028;
    item.userData._crumbleDropY = 46.0 + (idx % 7) * 2.4;
    item.userData._crumbleDriftX = ((idx % 2 === 0 ? 1 : -1) * (0.6 + (idx % 5) * 0.35));
    item.userData._crumbleDriftZ = -2.5 - (idx % 4) * 1.1;
    item.userData._crumbleRotX = ((idx % 2 === 0 ? 1 : -1) * (0.55 + (idx % 5) * 0.16));
    item.userData._crumbleRotZ = ((idx % 3 === 0 ? 1 : -1) * (0.42 + (idx % 4) * 0.14));
  });

  // Keep cavernEnvGroup visible during the crumble while revealing etherealPlaneGroup behind it
  cavernEnvGroup.visible = true;
  etherealPlaneGroup.visible = true;
  etherealPlaneGroup.scale.setScalar(0.42);

  if (typeof sfx !== 'undefined' && sfx && typeof sfx.playCavernCrumbleToEthereal === 'function') {
    sfx.playCavernCrumbleToEthereal();
  }
  if (typeof triggerBoardShake === 'function') {
    triggerBoardShake(0.68);
  }
  if (typeof triggerCavernBossEnragePulse === 'function') {
    triggerCavernBossEnragePulse(1.45);
  }

  const startMs = performance.now();
  const durationMs = 3650;

  function stepCrumble(now) {
    const p = Math.min(1, (now - startMs) / durationMs);
    const easeOut = 1 - Math.pow(1 - p, 3);

    if (p < 0.78 && Math.random() < 0.38 && typeof triggerBoardShake === 'function') {
      triggerBoardShake(0.30 * (1 - p * 0.75));
    }

    // Smoothly transition fog density down so the Ethereal Plane shines clearly behind the falling rocks
    if (scene.fog) {
      scene.fog.density = 0.025 * (1 - easeOut) + 0.010 * easeOut;
    }

    targets.forEach((item) => {
      if (!item || !item.userData || !item.userData._origCached) return;
      const origPos = item.userData._origPos;
      const origRot = item.userData._origRot;
      const delay = item.userData._crumbleDelay || 0;

      if (p <= delay) {
        // Pre-detachment tectonic shudder
        const tremor = (Math.random() - 0.5) * 0.36;
        item.position.set(origPos.x + tremor, origPos.y + (Math.random() - 0.5) * 0.18, origPos.z);
        return;
      }

      const localP = Math.min(1, (p - delay) / (1 - delay));
      // Accelerating gravity curve (starts moving immediately upon detachment and accelerates downward)
      const fallFactor = 0.22 * localP + 0.78 * localP * localP;
      const jitterX = (Math.random() - 0.5) * 0.22 * (1 - localP);

      item.position.set(
        origPos.x + jitterX + fallFactor * item.userData._crumbleDriftX,
        origPos.y - fallFactor * item.userData._crumbleDropY,
        origPos.z + fallFactor * item.userData._crumbleDriftZ
      );
      item.rotation.set(
        origRot.x + fallFactor * item.userData._crumbleRotX,
        origRot.y,
        origRot.z + fallFactor * item.userData._crumbleRotZ
      );
    });

    etherealPlaneGroup.scale.setScalar(0.42 + 0.58 * easeOut);

    if (p < 1) {
      requestAnimationFrame(stepCrumble);
    } else {
      if (typeof state !== 'undefined' && state) {
        state.isCavernCrumbling = false;
      }
      cavernEnvGroup.visible = false;
      etherealPlaneGroup.scale.setScalar(1.0);
      updateCavernAesthetics();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  }

  requestAnimationFrame(stepCrumble);
}

// 8. VOLUMETRIC SUBTERRANEAN MIST RIBBONS
const cavernMistLayers = [];
for (let i = 0; i < 6; i++) {
  const mistPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(18 + (i % 3) * 6, 4.8 + (i % 2) * 1.8),
    caveMistMat
  );
  const my = -4.6 - (i % 3) * 1.45;
  const mz = -2.8 - i * 2.1;
  const mx = (i % 2 === 0 ? -1 : 1) * (1.8 + (i % 3) * 1.4);
  mistPlane.position.set(mx, my, mz);
  cavernEnvGroup.add(mistPlane);
  cavernMistLayers.push({ mesh: mistPlane, baseX: mx, baseY: my, phase: i * 1.15 });
}

// 9. DUAL LUMINOUS PARTICLE STREAMS (Primary Spores/Embers + Secondary Chasm Wisps/Void Sparks)
const sporeCount = 220;
const sporeGeo = new THREE.BufferGeometry();
const sporePos = new Float32Array(sporeCount * 3);
for (let i = 0; i < sporeCount; i++) {
  sporePos[i * 3] = (cavernSeededRand(i * 5 + 1) - 0.5) * 26;
  sporePos[i * 3 + 1] = (cavernSeededRand(i * 5 + 2) - 0.5) * 18;
  sporePos[i * 3 + 2] = -1.8 - cavernSeededRand(i * 5 + 3) * 13;
}
sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
const sporeMat = new THREE.PointsMaterial({
  map: glowSpriteTex,
  color: 0x2dd4bf,
  size: 0.24,
  transparent: true,
  opacity: 0.68,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const sporePoints = new THREE.Points(sporeGeo, sporeMat);
scene.add(sporePoints);

const abyssalWispCount = 140;
const abyssalWispGeo = new THREE.BufferGeometry();
const abyssalWispPos = new Float32Array(abyssalWispCount * 3);
for (let i = 0; i < abyssalWispCount; i++) {
  abyssalWispPos[i * 3] = (cavernSeededRand(i * 7 + 11) - 0.5) * 24;
  abyssalWispPos[i * 3 + 1] = (cavernSeededRand(i * 7 + 13) - 0.5) * 18;
  abyssalWispPos[i * 3 + 2] = -2.2 - cavernSeededRand(i * 7 + 17) * 12;
}
abyssalWispGeo.setAttribute('position', new THREE.BufferAttribute(abyssalWispPos, 3));
const abyssalWispMat = new THREE.PointsMaterial({
  map: glowSpriteTex,
  color: 0xf59e0b,
  size: 0.19,
  transparent: true,
  opacity: 0.42,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const abyssalWispPoints = new THREE.Points(abyssalWispGeo, abyssalWispMat);
scene.add(abyssalWispPoints);

// ============================================================================
// OMINOUS BOSS PROGRESSION STATE MACHINE & DYNAMIC AESTHETIC CONTROLLER
// ============================================================================
const CAVERN_TIER_PROFILES = [
  // Tier 0: Act I — Bioluminescent Shallows (Pre-Boss 1: Floors 1-3)
  {
    tier: 0,
    name: 'Bioluminescent Shallows',
    fogColor: 0x070810,
    fogDensity: 0.021,
    ambientColor: 0xfef3c7,
    ambientIntensity: 0.58,
    keyLeftColor: 0xf59e0b,
    keyRightColor: 0x14b8a6,
    rimLeftColor: 0x14b8a6,
    rimRightColor: 0xf59e0b,
    chasmColor: 0x0d9488,
    chasmIntensity: 2.8,
    vaultColor: 0x38bdf8,
    rockColor: 0x1e2436,
    rockEmissive: 0x09111e,
    pillarColor: 0x252c40,
    crystalPrimaryColor: 0x2dd4bf,
    crystalPrimaryEmissive: 0x0d9488,
    crystalSecondaryColor: 0xfbbf24,
    crystalSecondaryEmissive: 0xd97706,
    veinColor: 0x2dd4bf,
    veinOpacity: 0.38,
    fissureColor: 0x0ea5e9,
    fissureOpacity: 0.18,
    brazierColor: 0xfbbf24,
    mistColor: 0x14b8a6,
    mistOpacity: 0.15,
    sporeColor: 0x2dd4bf,
    wispColor: 0xfbbf24,
    particleSpeed: 1.0,
    pulseSpeed: 2.2,
    heartbeatMode: false,
    showObsidianSpikes: false,
    showEldritchWatchers: false,
    showVoidMonoliths: false
  },
  // Tier 1: Act II — Molten Blood-Obsidian Chasm (Post-Boss 1: Floors 4-6)
  {
    tier: 1,
    name: 'Molten Obsidian Chasm',
    fogColor: 0x0d0609,
    fogDensity: 0.023,
    ambientColor: 0xfde68a,
    ambientIntensity: 0.48,
    keyLeftColor: 0xf97316,
    keyRightColor: 0xe11d48,
    rimLeftColor: 0xe11d48,
    rimRightColor: 0xf97316,
    chasmColor: 0xe11d48,
    chasmIntensity: 4.2,
    vaultColor: 0xbe123c,
    rockColor: 0x241319,
    rockEmissive: 0x1f070d,
    pillarColor: 0x2b151d,
    crystalPrimaryColor: 0xf43f5e,
    crystalPrimaryEmissive: 0xbe123c,
    crystalSecondaryColor: 0xfb923c,
    crystalSecondaryEmissive: 0xc2410c,
    veinColor: 0xf97316,
    veinOpacity: 0.68,
    fissureColor: 0xf43f5e,
    fissureOpacity: 0.65,
    brazierColor: 0xf43f5e,
    mistColor: 0xe11d48,
    mistOpacity: 0.22,
    sporeColor: 0xf97316,
    wispColor: 0xf43f5e,
    particleSpeed: 1.85,
    pulseSpeed: 3.6,
    heartbeatMode: false,
    showObsidianSpikes: true,
    showEldritchWatchers: false,
    showVoidMonoliths: false
  },
  // Tier 2: Act III — Eldritch Abyssal Sanctum (Post-Boss 2: Floors 7-9)
  {
    tier: 2,
    name: 'Eldritch Abyssal Sanctum',
    fogColor: 0x07030d,
    fogDensity: 0.024,
    ambientColor: 0xe9d5ff,
    ambientIntensity: 0.42,
    keyLeftColor: 0xe11d48,
    keyRightColor: 0xa855f7,
    rimLeftColor: 0x9333ea,
    rimRightColor: 0xe11d48,
    chasmColor: 0x9333ea,
    chasmIntensity: 5.0,
    vaultColor: 0xe11d48,
    rockColor: 0x190e26,
    rockEmissive: 0x160626,
    pillarColor: 0x211132,
    crystalPrimaryColor: 0xc084fc,
    crystalPrimaryEmissive: 0x7e22ce,
    crystalSecondaryColor: 0xf43f5e,
    crystalSecondaryEmissive: 0xbe123c,
    veinColor: 0xc084fc,
    veinOpacity: 0.84,
    fissureColor: 0xe11d48,
    fissureOpacity: 0.85,
    brazierColor: 0xc084fc,
    mistColor: 0x9333ea,
    mistOpacity: 0.26,
    sporeColor: 0xc084fc,
    wispColor: 0xf43f5e,
    particleSpeed: 2.55,
    pulseSpeed: 4.8,
    heartbeatMode: true,
    showObsidianSpikes: true,
    showEldritchWatchers: true,
    showVoidMonoliths: true
  },
  // Tier 3: Act IV — Astral Singularity Rift (Post-Boss 3: Floors 10-12)
  {
    tier: 3,
    name: 'Astral Singularity Rift',
    fogColor: 0x040711,
    fogDensity: 0.024,
    ambientColor: 0xe0f2fe,
    ambientIntensity: 0.40,
    keyLeftColor: 0x38bdf8,
    keyRightColor: 0x818cf8,
    rimLeftColor: 0x06b6d4,
    rimRightColor: 0xf43f5e,
    chasmColor: 0x0284c7,
    chasmIntensity: 5.5,
    vaultColor: 0x6366f1,
    rockColor: 0x0f172a,
    rockEmissive: 0x08142c,
    pillarColor: 0x162038,
    crystalPrimaryColor: 0x38bdf8,
    crystalPrimaryEmissive: 0x0284c7,
    crystalSecondaryColor: 0xf43f5e,
    crystalSecondaryEmissive: 0xe11d48,
    veinColor: 0x38bdf8,
    veinOpacity: 0.90,
    fissureColor: 0x818cf8,
    fissureOpacity: 0.88,
    brazierColor: 0x38bdf8,
    mistColor: 0x0ea5e9,
    mistOpacity: 0.28,
    sporeColor: 0x38bdf8,
    wispColor: 0xc084fc,
    particleSpeed: 2.95,
    pulseSpeed: 5.4,
    heartbeatMode: true,
    showObsidianSpikes: true,
    showEldritchWatchers: true,
    showVoidMonoliths: true,
    showAct4Singularity: true,
    showAct5Tesseract: false
  },
  // Tier 4: Act V — The Sovereign Tesseract Nexus (Post-Boss 4 & Final Boss: Floors 13-15)
  {
    tier: 4,
    name: 'Sovereign Tesseract Nexus',
    fogColor: 0x09020a,
    fogDensity: 0.025,
    ambientColor: 0xfecdd3,
    ambientIntensity: 0.38,
    keyLeftColor: 0xf43f5e,
    keyRightColor: 0xfbbf24,
    rimLeftColor: 0xe11d48,
    rimRightColor: 0xc026d3,
    chasmColor: 0xf43f5e,
    chasmIntensity: 6.4,
    vaultColor: 0xfbbf24,
    rockColor: 0x210918,
    rockEmissive: 0x290516,
    pillarColor: 0x2a0b1e,
    crystalPrimaryColor: 0xf43f5e,
    crystalPrimaryEmissive: 0xe11d48,
    crystalSecondaryColor: 0xfbbf24,
    crystalSecondaryEmissive: 0xd97706,
    veinColor: 0xfbbf24,
    veinOpacity: 0.96,
    fissureColor: 0xf43f5e,
    fissureOpacity: 0.96,
    brazierColor: 0xf43f5e,
    mistColor: 0xbe123c,
    mistOpacity: 0.32,
    sporeColor: 0xfbbf24,
    wispColor: 0xf43f5e,
    particleSpeed: 3.4,
    pulseSpeed: 6.4,
    heartbeatMode: true,
    showObsidianSpikes: true,
    showEldritchWatchers: true,
    showVoidMonoliths: true,
    showAct4Singularity: true,
    showAct5Tesseract: true
  }
];

const cavernAestheticState = {
  currentTier: 0,
  ominousScore: 0.0,
  enragePulse: 0.0,
  lightningFlash: 0.0,
  nextLightningTime: 6.0,
  activeProfile: CAVERN_TIER_PROFILES[0]
};

function computeCavernOminousTier() {
  if (typeof state === 'undefined' || !state) return 0;
  if (typeof state.debugCavernTierOverride === 'number' && state.debugCavernTierOverride >= 0) {
    return Math.min(4, state.debugCavernTierOverride);
  }
  const fIdx = Number.isFinite(state.floorIdx) ? state.floorIdx : 0;
  const shopTier = Number.isFinite(state.unlockedShopTier) ? state.unlockedShopTier : 1;

  // Post-Boss 4 / Act V (Floors 13-15, idx >= 12) or Boss 4 defeated (idx === 11 && bossHp === 0)
  if (fIdx >= 12 || shopTier >= 5 || (fIdx === 11 && state.gameOver && state.bossHp === 0)) {
    return 4;
  }
  // Post-Boss 3 / Act IV (Floors 10-12, idx >= 9) or Boss 3 defeated or Boss 3 final HP phase
  if (fIdx >= 9 || shopTier >= 4 || (fIdx === 8 && state.bossMaxHp > 1 && state.bossHp <= 1)) {
    return 3;
  }
  // Post-Boss 2 / Act III (Floors 7-9, idx >= 6) or Boss 2 defeated
  if (fIdx >= 6 || shopTier >= 3 || (fIdx === 5 && state.gameOver && state.bossHp === 0)) {
    return 2;
  }
  // Post-Boss 1 / Act II (Floors 4-6, idx >= 3) or Boss 1 defeated
  if (fIdx >= 3 || shopTier >= 2 || (fIdx === 2 && state.gameOver && state.bossHp === 0)) {
    return 1;
  }
  return 0;
}

function triggerCavernBossEnragePulse(amount = 0.85) {
  cavernAestheticState.enragePulse = Math.max(cavernAestheticState.enragePulse, amount);
  cavernAestheticState.lightningFlash = Math.max(cavernAestheticState.lightningFlash, amount * 0.9);
}

function updateCavernAesthetics() {
  const tier = computeCavernOminousTier();
  const baseProfile = CAVERN_TIER_PROFILES[tier] || CAVERN_TIER_PROFILES[0];
  cavernAestheticState.currentTier = tier;
  cavernAestheticState.activeProfile = baseProfile;

  const fIdx = (typeof state !== 'undefined' && state && Number.isFinite(state.floorIdx)) ? state.floorIdx : 0;
  const isBoss = typeof isBossFloorIndex === 'function' && isBossFloorIndex(fIdx);
  const isPreBoss = typeof isPreBossFloorIndex === 'function' && isPreBossFloorIndex(fIdx);
  const bossWounded = isBoss && typeof state !== 'undefined' && state.bossMaxHp > 1 && state.bossHp < state.bossMaxHp;

  // Sub-stage escalation on Vanguard & Boss floors
  let keyLeft = baseProfile.keyLeftColor;
  let keyRight = baseProfile.keyRightColor;
  let fissureOp = baseProfile.fissureOpacity;
  let veinOp = baseProfile.veinOpacity;

  if (isPreBoss && tier === 0) {
    keyLeft = 0xf97316;
    keyRight = 0x38bdf8;
    fissureOp = 0.36;
    veinOp = 0.52;
  } else if (isBoss) {
    if (tier === 0) {
      keyLeft = 0xf43f5e;
      keyRight = 0xa855f7;
      fissureOp = 0.54;
      veinOp = 0.68;
    } else if (tier === 1) {
      keyLeft = 0xe11d48;
      keyRight = 0xc026d3;
      fissureOp = 0.82;
      veinOp = 0.82;
    }
  }

  if (bossWounded) {
    fissureOp = Math.min(1.0, fissureOp + 0.18);
    veinOp = Math.min(1.0, veinOp + 0.16);
  }

  if (scene.fog) {
    if (scene.fog.color && typeof scene.fog.color.setHex === 'function') {
      scene.fog.color.setHex(baseProfile.fogColor);
    }
    scene.fog.density = baseProfile.fogDensity;
  }

  if (ambientLight && ambientLight.color && typeof ambientLight.color.setHex === 'function') {
    ambientLight.color.setHex(baseProfile.ambientColor);
    ambientLight.intensity = baseProfile.ambientIntensity;
  }

  amberLanternLight.color.setHex(keyLeft);
  tealBiolumLight.color.setHex(keyRight);
  cavernRimLightLeft.color.setHex(baseProfile.rimLeftColor);
  cavernRimLightRight.color.setHex(baseProfile.rimRightColor);
  cavernChasmLight.color.setHex(baseProfile.chasmColor);
  cavernChasmLight.intensity = baseProfile.chasmIntensity + (isBoss ? 1.1 : 0) + (bossWounded ? 0.9 : 0);
  cavernVaultLight.color.setHex(baseProfile.vaultColor);

  if (caveRockMat.color && typeof caveRockMat.color.setHex === 'function') {
    caveRockMat.color.setHex(baseProfile.rockColor);
    caveRockMat.emissive.setHex(baseProfile.rockEmissive);
    cavePillarMat.color.setHex(baseProfile.pillarColor);
    cavePillarMat.emissive.setHex(baseProfile.rockEmissive);
    caveDeepWallMat.color.setHex(baseProfile.rockColor);
    caveDeepWallMat.emissive.setHex(baseProfile.rockEmissive);

    caveCrystalMatPrimary.color.setHex(baseProfile.crystalPrimaryColor);
    caveCrystalMatPrimary.emissive.setHex(baseProfile.crystalPrimaryEmissive);
    caveCrystalMatSecondary.color.setHex(baseProfile.crystalSecondaryColor);
    caveCrystalMatSecondary.emissive.setHex(baseProfile.crystalSecondaryEmissive);
  }

  caveVeinMat.color.setHex(baseProfile.veinColor);
  caveVeinMat.opacity = veinOp;
  caveFissureMat.color.setHex(baseProfile.fissureColor);
  caveFissureMat.opacity = fissureOp;
  caveBrazierCoreMat.color.setHex(baseProfile.brazierColor);
  caveChasmCoreMat.color.setHex(baseProfile.chasmColor);
  caveChasmCoreMat.opacity = 0.24 + tier * 0.1 + (isBoss ? 0.08 : 0);
  caveMistMat.color.setHex(baseProfile.mistColor);
  caveMistMat.opacity = baseProfile.mistOpacity;

  if (sporeMat.color && typeof sporeMat.color.setHex === 'function') {
    sporeMat.color.setHex(baseProfile.sporeColor);
    abyssalWispMat.color.setHex(baseProfile.wispColor);
  }

  cavernCrystals.forEach((c) => {
    if (c.halo && c.halo.material && c.halo.material.color && typeof c.halo.material.color.setHex === 'function') {
      c.halo.material.color.setHex(c.primary ? baseProfile.crystalPrimaryColor : baseProfile.crystalSecondaryColor);
    }
  });

  // Toggle Boss-Tier Ominous Architecture across all 5 Acts
  const isEthereal = typeof state !== 'undefined' && state && !!state.etherealPlaneActive;
  const isCrumblingNow = typeof state !== 'undefined' && state && !!state.isCavernCrumbling;
  if (isEthereal) {
    cavernEnvGroup.visible = isCrumblingNow;
    etherealPlaneGroup.visible = true;
    if (scene.fog) {
      if (scene.fog.color && typeof scene.fog.color.setHex === 'function') {
        scene.fog.color.setHex(0x050214);
      }
      scene.fog.density = 0.010;
    }
    if (ambientLight && ambientLight.color && typeof ambientLight.color.setHex === 'function') {
      ambientLight.color.setHex(0xe0e7ff);
      ambientLight.intensity = 0.66;
    }
    amberLanternLight.color.setHex(0xfde047);
    tealBiolumLight.color.setHex(0x38bdf8);
    cavernRimLightLeft.color.setHex(0xc084fc);
    cavernRimLightRight.color.setHex(0xfde047);
    cavernChasmLight.color.setHex(0x38bdf8);
    cavernVaultLight.color.setHex(0xfde047);
  } else {
    cavernEnvGroup.visible = true;
    etherealPlaneGroup.visible = false;
    obsidianSpikesGroup.visible = baseProfile.showObsidianSpikes || (isBoss && tier >= 0 && bossWounded);
    eldritchWatchersGroup.visible = baseProfile.showEldritchWatchers || (isBoss && tier >= 1 && bossWounded);
    voidMonolithsGroup.visible = baseProfile.showVoidMonoliths;
    act4SingularityGroup.visible = !!baseProfile.showAct4Singularity || (isBoss && tier === 2 && bossWounded);
    act5TesseractGroup.visible = !!baseProfile.showAct5Tesseract || (isBoss && tier === 3 && bossWounded);
  }

  // Sync HTML body attribute for atmospheric vignette & HUD styling
  if (typeof document !== 'undefined' && document.body) {
    document.body.setAttribute('data-cavern-tier', String(tier));
    document.body.setAttribute('data-cavern-boss', isBoss ? 'true' : 'false');
  }
}

function updateCavernAnimation(elapsed) {
  const prof = cavernAestheticState.activeProfile || CAVERN_TIER_PROFILES[0];
  const tier = cavernAestheticState.currentTier;
  const isCrumblingNow = typeof state !== 'undefined' && state && !!state.isCavernCrumbling;
  if (isCrumblingNow) {
    if (etherealPlaneGroup.visible) {
      etherealAstrolabeRings.forEach((rObj) => {
        rObj.mesh.rotation.x += 0.0035 * rObj.speedX;
        rObj.mesh.rotation.y += 0.0045 * rObj.speedY;
        rObj.mesh.rotation.z += 0.0030 * rObj.speedZ;
      });
      etherealHypercubes.forEach((hc) => {
        hc.group.position.y = hc.baseY + Math.sin(elapsed * 1.4 + hc.phase) * 0.55;
        hc.outer.rotation.set(elapsed * 0.85 + hc.phase, elapsed * 1.1, 0);
        hc.inner.rotation.set(-elapsed * 1.3, -elapsed * 0.95, elapsed * 0.7);
        hc.core.rotation.y = elapsed * 2.4;
      });
    }
    return;
  }

  // Decay any boss HP shatter / enrage surge
  if (cavernAestheticState.enragePulse > 0.005) {
    cavernAestheticState.enragePulse *= 0.94;
  } else {
    cavernAestheticState.enragePulse = 0;
  }

  // Periodic silent abyssal lightning in Tier 2+ or during Boss fights
  if (tier >= 2 && elapsed > cavernAestheticState.nextLightningTime) {
    cavernAestheticState.lightningFlash = 0.65 + (tier === 3 ? 0.35 : 0.0);
    cavernAestheticState.nextLightningTime = elapsed + (tier === 3 ? 2.8 : 5.2) + Math.abs(Math.sin(elapsed * 7.3)) * 3.5;
  }
  if (cavernAestheticState.lightningFlash > 0.01) {
    cavernAestheticState.lightningFlash *= 0.86;
  } else {
    cavernAestheticState.lightningFlash = 0;
  }

  const surge = cavernAestheticState.enragePulse + cavernAestheticState.lightningFlash;

  // 1. Pulse Chasm & Vault Lights
  const heartbeatWave = prof.heartbeatMode
    ? Math.pow(Math.max(0, Math.sin(elapsed * prof.pulseSpeed)), 4) +
      0.65 * Math.pow(Math.max(0, Math.sin(elapsed * prof.pulseSpeed - 0.65)), 6)
    : (0.5 + 0.5 * Math.sin(elapsed * prof.pulseSpeed));

  cavernChasmLight.intensity = prof.chasmIntensity + heartbeatWave * (0.9 + tier * 0.55) + surge * 3.5;
  cavernVaultLight.intensity = 1.6 + heartbeatWave * 0.8 + cavernAestheticState.lightningFlash * 4.2;

  // 2. Sway Suspended Wrought-Iron Braziers
  const swaySpeed = 1.35 + tier * 0.45;
  const swayAmp = 0.055 + tier * 0.028 + cavernAestheticState.enragePulse * 0.09;
  cavernBraziers.forEach((b) => {
    b.pivot.rotation.z = Math.sin(elapsed * swaySpeed + b.phase) * swayAmp;
    b.pivot.rotation.x = Math.cos(elapsed * (swaySpeed * 0.7) + b.phase) * (swayAmp * 0.5);
    const flicker = 0.85 + Math.sin(elapsed * 11.0 + b.phase) * 0.18 + surge * 0.35;
    b.flameCore.scale.setScalar(flicker);
    b.flameCore.rotation.y = elapsed * 2.4;
    b.flameHalo.scale.setScalar(0.95 + heartbeatWave * 0.28);
  });

  // 3. Pulse Crystal Clusters & Stalactite Drip-Tips
  cavernCrystals.forEach((c) => {
    const wave = prof.heartbeatMode
      ? heartbeatWave
      : (0.5 + 0.5 * Math.sin(elapsed * prof.pulseSpeed + c.phase));
    const s = c.baseScale * (1.0 + wave * (0.05 + tier * 0.025) + surge * 0.08);
    c.group.scale.setScalar(s);
    if (c.halo && c.halo.material) {
      c.halo.material.opacity = 0.18 + wave * 0.22 + surge * 0.25;
    }
  });

  stalactiteDripTips.forEach((dt) => {
    const glow = 0.8 + Math.sin(elapsed * 3.8 + dt.phase) * 0.28 + tier * 0.18;
    dt.mesh.scale.setScalar(glow);
  });

  // 4. Pulse Tectonic Fault Fissures
  cavernFissureMeshes.forEach((f) => {
    const fPulse = 1.0 + Math.sin(elapsed * (prof.pulseSpeed * 0.85) + f.phase) * (0.15 + tier * 0.12) + surge * 0.45;
    f.mesh.scale.x = fPulse;
  });

  // 5. Animate Post-Boss 2 Eldritch Watcher Eyes (Blinking + Board Tracking)
  if (eldritchWatchersGroup.visible) {
    const aimX = (typeof state !== 'undefined' && state && state.previewCol >= 0)
      ? ((state.previewCol - 3) * 0.08)
      : Math.sin(elapsed * 0.8) * 0.12;
    eldritchWatchers.forEach((w) => {
      w.auraRing.rotation.z = elapsed * (0.8 + tier * 0.4) + w.phase;
      w.pupil.position.x = aimX;
      w.iris.position.x = aimX * 0.65;

      // Periodic asymmetric blink
      const blinkCycle = (elapsed * (0.55 + (tier === 3 ? 0.25 : 0)) + w.phase) % 4.5;
      const blinkClose = (blinkCycle > 4.15) ? Math.sin(((blinkCycle - 4.15) / 0.35) * Math.PI) : 0;
      w.upperLid.position.y = 0.38 - blinkClose * 0.26;
      w.lowerLid.position.y = -0.38 + blinkClose * 0.26;

      const eyePulse = w.baseScale * (1.0 + heartbeatWave * 0.09 + surge * 0.14);
      w.group.scale.setScalar(eyePulse);
    });
  }

  // 6. Animate Post-Boss 2 Levitating Void Monoliths & Ophanim Rings
  if (voidMonolithsGroup.visible) {
    voidMonoliths.forEach((vm) => {
      vm.group.position.y = vm.baseY + Math.sin(elapsed * 1.6 + vm.phase) * 0.42;
      vm.obelisk.rotation.y = elapsed * 0.65 + vm.phase;
      vm.ring1.rotation.x = elapsed * 1.15 + vm.phase;
      vm.ring1.rotation.y = elapsed * 0.75;
      vm.ring2.rotation.z = -elapsed * 1.35 + vm.phase;
    });
  }

  // 6B. Animate Act IV Singularity Gyroscopes
  if (act4SingularityGroup.visible) {
    singularityGyros.forEach((sg) => {
      sg.core.rotation.y = elapsed * 2.2 + sg.phase;
      sg.ringA.rotation.x = elapsed * 1.6 + sg.phase;
      sg.ringB.rotation.y = -elapsed * 1.9 + sg.phase;
      sg.ringC.rotation.z = elapsed * 1.4 + sg.phase;
    });
  }

  // 6C. Animate Act V Sovereign Tesseract Phantom Boards (highlighting active board & dimming shattered boards)
  if (act5TesseractGroup.visible) {
    const activeB = (typeof state !== 'undefined' && state && Number.isFinite(state.activeTesseractBoardIdx))
      ? state.activeTesseractBoardIdx
      : 0;
    const tBoards = (typeof state !== 'undefined' && state && Array.isArray(state.tesseractBoards))
      ? state.tesseractBoards
      : [];
    phantomBoards.forEach((pb) => {
      const entry = tBoards[pb.idx];
      const isShattered = !!(entry && entry.isShattered);
      const isCurrent = !isShattered && pb.idx === activeB;
      if (isShattered) {
        pb.group.position.y = pb.baseY - 1.1 + Math.sin(elapsed * 0.7 + pb.idx) * 0.08;
        pb.group.rotation.set(0.45, -0.35, 0.52);
        pb.group.scale.setScalar(0.54);
        pb.outerBox.visible = false;
        pb.rim.material = tesseractShatteredMat;
      } else {
        pb.outerBox.visible = true;
        pb.group.rotation.x = 0;
        pb.group.rotation.z = 0;
        pb.group.position.y = pb.baseY + Math.sin(elapsed * 1.8 + pb.idx * 1.5) * 0.36;
        pb.group.rotation.y = Math.sin(elapsed * 0.9 + pb.idx) * 0.32;
        pb.rim.rotation.z = elapsed * (isCurrent ? 1.8 : 0.6) + pb.idx;
        pb.group.scale.setScalar(isCurrent ? 1.18 : 0.86);
        pb.rim.material = isCurrent ? tesseractGoldMat : tesseractCrimsonMat;
      }
    });
  }

  // 6D. Animate Phase 3 Ethereal Cosmic Plane
  if (etherealPlaneGroup.visible) {
    etherealAstrolabeRings.forEach((rObj) => {
      rObj.mesh.rotation.x += 0.0035 * rObj.speedX;
      rObj.mesh.rotation.y += 0.0045 * rObj.speedY;
      rObj.mesh.rotation.z += 0.0030 * rObj.speedZ;
    });
    etherealHypercubes.forEach((hc) => {
      hc.group.position.y = hc.baseY + Math.sin(elapsed * 1.4 + hc.phase) * 0.55;
      hc.outer.rotation.set(elapsed * 0.85 + hc.phase, elapsed * 1.1, 0);
      hc.inner.rotation.set(-elapsed * 1.3, -elapsed * 0.95, elapsed * 0.7);
      hc.core.rotation.y = elapsed * 2.4;
    });
    const eArr = etherealStarGeo.attributes.position.array;
    if (eArr) {
      for (let i = 0; i < etherealStarCount; i++) {
        const i3 = i * 3;
        eArr[i3 + 1] += 0.018;
        if (eArr[i3 + 1] > 13.0) eArr[i3 + 1] = -13.0;
      }
      etherealStarGeo.attributes.position.needsUpdate = true;
    }
  }

  const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
  if (perf) {
    // In Performance Mode, skip mist overdraw planes and throttle spore updates to 1/3 particle count every 2nd tick
    cavernAestheticState._perfTick = ((cavernAestheticState._perfTick || 0) + 1) % 2;
    if (cavernAestheticState._perfTick === 0) {
      const pSpeed = prof.particleSpeed;
      const sArr = sporeGeo.attributes.position.array;
      if (sArr) {
        const activeCount = Math.min(64, sporeCount);
        for (let i = 0; i < activeCount; i++) {
          const idx3 = i * 3;
          sArr[idx3 + 1] += 0.016 * pSpeed;
          if (sArr[idx3 + 1] > 9.0) sArr[idx3 + 1] = -9.0;
        }
        sporeGeo.attributes.position.needsUpdate = true;
      }
    }
    return;
  }

  // 7. Drift Subterranean Mist Layers
  cavernMistLayers.forEach((m) => {
    m.mesh.position.x = m.baseX + Math.sin(elapsed * (0.32 + tier * 0.15) + m.phase) * 1.65;
    m.mesh.position.y = m.baseY + Math.cos(elapsed * 0.45 + m.phase) * 0.28;
  });

  // 8. Step Dual Particle Streams (Bioluminescent Spores -> Volcanic Embers -> Vortex Void Motes)
  const pSpeed = prof.particleSpeed * (1.0 + surge * 0.8);
  const sArr = sporeGeo.attributes.position.array;
  if ( sArr ) {
    for (let i = 0; i < sporeCount; i++) {
      const idx3 = i * 3;
      sArr[idx3 + 1] += 0.009 * pSpeed;
      sArr[idx3] += Math.sin(elapsed * 1.4 + i) * 0.003 * pSpeed;
      if (sArr[idx3 + 1] > 9.0) sArr[idx3 + 1] = -9.0;
    }
    sporeGeo.attributes.position.needsUpdate = true;
  }

  const wArr = abyssalWispGeo.attributes.position.array;
  if ( wArr ) {
    for (let i = 0; i < abyssalWispCount; i++) {
      const idx3 = i * 3;
      wArr[idx3 + 1] += (0.012 + tier * 0.006) * pSpeed;
      wArr[idx3] += Math.cos(elapsed * 1.8 + i * 0.5) * (0.004 + tier * 0.003);
      if (wArr[idx3 + 1] > 9.5) wArr[idx3 + 1] = -9.5;
    }
    abyssalWispGeo.attributes.position.needsUpdate = true;
  }
}

updateCavernAesthetics();

const columnHitboxes = [];
const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });
const TOTAL_HITBOX_COLS = typeof MAX_COLS !== 'undefined' ? MAX_COLS : 12;
for (let c = 0; c < TOTAL_HITBOX_COLS; c++) {
  const x = START_X + c * CELL_SPACING;
  const hitBox = new THREE.Mesh(new THREE.BoxGeometry(CELL_SPACING * 1.12, BOARD_H + 2.5, 1.6), invisibleMat);
  hitBox.position.set(x, START_Y + (BOARD_H - CELL_SPACING) / 2 + 0.3, 0);
  hitBox.userData = { col: c };
  boardGroup.add(hitBox);
  columnHitboxes.push(hitBox);
}

const colHighlightGeo = new THREE.BoxGeometry(CELL_SPACING * 0.88, BOARD_H + 0.2, 0.78);
const colHighlightMat = new THREE.MeshBasicMaterial({
  color: 0xf59e0b, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending
});
const colHighlightMesh = new THREE.Mesh(colHighlightGeo, colHighlightMat);
colHighlightMesh.visible = false;
boardGroup.add(colHighlightMesh);

const tokenGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 28);
tokenGeo.rotateX(Math.PI / 2);

const ghostMat = new THREE.MeshStandardMaterial({
  color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.8, transparent: true, opacity: 0.62
});
const ghostToken = new THREE.Mesh(tokenGeo, ghostMat);
ghostToken.visible = false;
boardGroup.add(ghostToken);

const playerMat = new THREE.MeshStandardMaterial({
  map: woodTex, color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.52, roughness: 0.56, metalness: 0.16
});
const aiMat = new THREE.MeshStandardMaterial({
  color: 0x14b8a6, emissive: 0x0d9488, emissiveIntensity: 0.68, roughness: 0.50, metalness: 0.22
});
const stoneMat = new THREE.MeshStandardMaterial({
  map: woodTex, color: 0x78716c, emissive: 0x1c1917, emissiveIntensity: 0.22, roughness: 0.88, metalness: 0.08
});
const wildMat = new THREE.MeshStandardMaterial({
  color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 0.88, roughness: 0.46, metalness: 0.26
});
const winGlowMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xfde047, emissiveIntensity: 1.35, roughness: 0.1, metalness: 0.9
});

function getTokenMaterial(type) {
  if (type === AI) return aiMat;
  if (type === STONE) return stoneMat;
  if (type === WILD) return wildMat;
  return playerMat;
}

const tokensGroup = new THREE.Group();
boardGroup.add(tokensGroup);

// ============================================================================
// BOARD INITIALIZATION & 3D SLOT ENCHANTMENTS
// ============================================================================
function addEnchantRingMesh(r, c, eType) {
  const mat = enchantMaterials[eType];
  if (!mat) return;
  const eRing = new THREE.Mesh(enchantRingGeo, mat);
  eRing.userData = { row: r, col: c, eType };
  if (typeof state !== 'undefined' && state && state.isCylinderPhase) {
    const pos = getCylinderCellWorldCoords(r, c, 0.39);
    eRing.position.set(pos.x, pos.y, pos.z);
    eRing.rotation.set(0, pos.rotY, 0);
    eRing.visible = isCylinderColumnVisible(c);
  } else {
    eRing.position.set(START_X + c * CELL_SPACING, START_Y + r * CELL_SPACING, 0.39);
    eRing.rotation.set(0, 0, 0);
    eRing.visible = true;
  }
  enchantGroup.add(eRing);
}

function generateSlotEnchantments() {
  clearThreeGroup(enchantGroup);
  state.enchantGrid = createGrid(ROWS, COLS, ENCHANT_TYPES.NONE);

  const coords = [];
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.boardMask && !state.boardMask[r][c]) continue;
      if (r === 0 && c === 3) continue;
      coords.push([r, c]);
    }
  }

  const floorBonus = Math.floor(state.floorIdx / 2);
  const totalEnchants = Math.min(18, state.persistentEnchantCount + floorBonus + (state.nextFloorModifiers.bonusEnchantSlots || 0));
  const picked = shuffle(coords).slice(0, totalEnchants);
  const types = state.floorIdx < 2
    ? [ENCHANT_TYPES.GILDED, ENCHANT_TYPES.SPICE]
    : [ENCHANT_TYPES.GILDED, ENCHANT_TYPES.SPICE, ENCHANT_TYPES.AMPLIFIER, ENCHANT_TYPES.WEB];

  picked.forEach(([r, c], idx) => {
    const eType = types[idx % types.length];
    state.enchantGrid[r][c] = eType;
    addEnchantRingMesh(r, c, eType);
  });

  // Prehistoric Amber Flea Gambit: Guarantees +1 extra Gilded Slot on every floor
  if (hasGambit('amber_flea')) {
    const remainingGilded = coords.filter(([r, c]) => state.enchantGrid[r][c] === ENCHANT_TYPES.NONE);
    if (remainingGilded.length > 0) {
      const [gr, gc] = remainingGilded[Math.floor(Math.random() * remainingGilded.length)];
      state.enchantGrid[gr][gc] = ENCHANT_TYPES.GILDED;
      addEnchantRingMesh(gr, gc, ENCHANT_TYPES.GILDED);
    }
  }

  // Sacred Prismatic Heart Gambit: Guarantees +1 extra Amplifier Slot on every floor
  if (hasGambit('sacred_heart_prism')) {
    const remaining = coords.filter(([r, c]) => state.enchantGrid[r][c] === ENCHANT_TYPES.NONE);
    if (remaining.length > 0) {
      const [ar, ac] = remaining[Math.floor(Math.random() * remaining.length)];
      state.enchantGrid[ar][ac] = ENCHANT_TYPES.AMPLIFIER;
      addEnchantRingMesh(ar, ac, ENCHANT_TYPES.AMPLIFIER);
    }
  }

  // The Paradox Innate Passive (Prismatic Anomaly): Upgrades 1 slot per floor into a Wild Amplifier Slot
  if (typeof state !== 'undefined' && state && state.loadoutId === 'paradox') {
    const nonAmp = coords.filter(([r, c]) => state.enchantGrid[r][c] !== ENCHANT_TYPES.AMPLIFIER);
    if (nonAmp.length > 0) {
      const [pr, pc] = nonAmp[Math.floor(Math.random() * nonAmp.length)];
      state.enchantGrid[pr][pc] = ENCHANT_TYPES.AMPLIFIER;
      rebuildEnchantmentRings();
    }
  }
}

function createTokenMesh(r, c, type, initialY) {
  const mesh = new THREE.Mesh(tokenGeo, getTokenMaterial(type));
  const isCyl = typeof state !== 'undefined' && state && !!state.isCylinderPhase;
  const cylPos = isCyl ? getCylinderCellWorldCoords(r, c, 0) : null;
  const targetX = isCyl ? cylPos.x : (START_X + c * CELL_SPACING);
  const targetZ = isCyl ? cylPos.z : 0;
  const targetY = START_Y + r * CELL_SPACING;

  mesh.position.set(targetX, initialY, targetZ);
  if (isCyl) {
    mesh.rotation.y = cylPos.rotY;
    mesh.visible = isCylinderColumnVisible(c);
  }
  mesh.userData = { row: r, col: c, targetX, targetY, targetZ, velY: 0, type };

  if (!(typeof isPerformanceMode === 'function' && isPerformanceMode())) {
    const innerRing = new THREE.Mesh(tokenInnerRingGeo, brassInlayMat);
    innerRing.position.z = 0.16;
    mesh.add(innerRing);
  }

  if (type === PLAYER && hasGambit('shrinking_shroom')) {
    mesh.scale.set(0.68, 0.68, 0.85);
  }
  return mesh;
}

function spawnTokenMesh(r, c, type) {
  state.board[r][c] = type;
  if (type === PLAYER || type === WILD) {
    state.lastPlayedCell = [r, c];
  }
  const mesh = createTokenMesh(r, c, type, START_Y + BOARD_H + 1.2);
  tokensGroup.add(mesh);
  state.meshes[r][c] = mesh;
}

function rebuildBoardMeshes(dropOffsetCols = null) {
  applyBoardGravity();
  clearThreeGroup(tokensGroup);
  state.meshes = createGrid(ROWS, COLS, null);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell !== EMPTY && cell !== VOID_CELL) {
        const targetY = START_Y + r * CELL_SPACING;
        const liftY = (dropOffsetCols && dropOffsetCols.includes(c)) ? CELL_SPACING : 0.28;
        const mesh = createTokenMesh(r, c, cell, targetY + liftY);
        tokensGroup.add(mesh);
        state.meshes[r][c] = mesh;
      }
    }
  }
}

function rebuildEnchantmentRings() {
  clearThreeGroup(enchantGroup);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const eType = state.enchantGrid[r][c];
      if (eType !== ENCHANT_TYPES.NONE) {
        addEnchantRingMesh(r, c, eType);
      }
    }
  }
}


function updateCylindricalBoardTransforms(dt = 0) {
  if (typeof state === 'undefined' || !state) return;
  if (!state.isCylinderPhase) {
    for (let c = 0; c < columnHitboxes.length; c++) {
      const hb = columnHitboxes[c];
      if (!hb) continue;
      hb.position.set(START_X + c * CELL_SPACING, START_Y + (BOARD_H - CELL_SPACING) / 2 + 0.3, 0);
      hb.rotation.set(0, 0, 0);
    }
    colHighlightMesh.rotation.set(0, 0, 0);
    return;
  }

  if (!state.isCylinderRotationPaused && !state.isCylinderLowering && dt > 0) {
    const speed = Number.isFinite(state.cylinderAutoRotateSpeed) ? state.cylinderAutoRotateSpeed : 0.38;
    state.cylinderAngle = ((state.cylinderAngle || 0) + speed * dt) % (Math.PI * 2);
  }

  const dropOffsetY = Number.isFinite(state.cylinderDropOffsetY) ? state.cylinderDropOffsetY : 0;
  boardGroup.position.y = dropOffsetY;

  for (let c = 0; c < cylinderColFrameGroups.length; c++) {
    const colGrp = cylinderColFrameGroups[c];
    if (!colGrp) continue;
    const pos = getCylinderCellWorldCoords(0, c, 0);
    colGrp.position.set(pos.x, 0, pos.z);
    colGrp.rotation.set(0, pos.rotY, 0);
    colGrp.visible = isCylinderColumnVisible(c);
  }

  for (let c = 0; c < columnHitboxes.length; c++) {
    const hb = columnHitboxes[c];
    if (!hb) continue;
    if (c < COLS) {
      const pos = getCylinderCellWorldCoords(0, c, 0);
      hb.position.set(pos.x, START_Y + (BOARD_H - CELL_SPACING) / 2 + 0.3, pos.z);
      hb.rotation.set(0, pos.rotY, 0);
    }
  }

  enchantGroup.children.forEach((ring) => {
    if (!ring || !ring.userData || typeof ring.userData.col !== 'number') return;
    const { row, col } = ring.userData;
    const pos = getCylinderCellWorldCoords(row, col, 0.39);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.rotation.set(0, pos.rotY, 0);
    ring.visible = isCylinderColumnVisible(col);
  });

  tokensGroup.children.forEach((mesh) => {
    if (!mesh || !mesh.userData || typeof mesh.userData.col !== 'number') return;
    const d = mesh.userData;
    if (d.freefall) {
      mesh.visible = true;
      return;
    }
    const pos = getCylinderCellWorldCoords(d.row, d.col, 0);
    mesh.position.x = pos.x;
    mesh.position.z = pos.z;
    mesh.rotation.y = pos.rotY;
    mesh.visible = isCylinderColumnVisible(d.col) || !!d.vfxControlled;
  });

  if (state.previewCol >= 0 && state.previewCol < COLS) {
    if (!isCylinderColumnInteractive(state.previewCol)) {
      if (typeof updateColumnPreviewVisual === 'function') {
        updateColumnPreviewVisual(-1);
      }
    } else {
      const hPos = getCylinderCellWorldCoords(0, state.previewCol, 0.08);
      colHighlightMesh.position.set(hPos.x, START_Y + (BOARD_H - CELL_SPACING) / 2, hPos.z);
      colHighlightMesh.rotation.set(0, hPos.rotY, 0);
      if (ghostToken.visible && typeof aiEngine !== 'undefined') {
        const availRow = aiEngine.getAvailableRow(state.board, state.previewCol);
        if (availRow !== -1) {
          const gPos = getCylinderCellWorldCoords(availRow, state.previewCol, 0.08);
          ghostToken.position.set(gPos.x, gPos.y, gPos.z);
          ghostToken.rotation.y = gPos.rotY;
        }
      }
    }
  }
}


function applySceneGraphicsQuality() {
  const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
  updateCameraAspect();

  // 1. Toggle secondary PointLights to cut per-pixel PBR shader loop overhead
  if (typeof cavernRimLightLeft !== 'undefined') cavernRimLightLeft.visible = !perf;
  if (typeof cavernRimLightRight !== 'undefined') cavernRimLightRight.visible = !perf;
  if (typeof cavernVaultLight !== 'undefined') cavernVaultLight.visible = !perf;

  // 2. Toggle 6 fullscreen alpha-blended mist planes & secondary wisp particle stream
  if (typeof cavernMistLayers !== 'undefined' && Array.isArray(cavernMistLayers)) {
    cavernMistLayers.forEach((m) => {
      if (m && m.mesh) m.mesh.visible = !perf;
    });
  }
  if (typeof abyssalWispPoints !== 'undefined' && abyssalWispPoints) {
    abyssalWispPoints.visible = !perf;
  }
  if (typeof sporeGeo !== 'undefined' && sporeGeo && typeof sporeGeo.setDrawRange === 'function') {
    sporeGeo.setDrawRange(0, perf ? 64 : sporeCount);
  }

  // 3. Toggle high-draw-call background speleothem clusters (168 meshes) & crystal halo spheres
  if (typeof cavernSpeleothemGroup !== 'undefined' && cavernSpeleothemGroup) {
    cavernSpeleothemGroup.visible = !perf;
  }
  if (typeof cavernCrystals !== 'undefined' && Array.isArray(cavernCrystals)) {
    cavernCrystals.forEach((c) => {
      if (c && c.halo) c.halo.visible = !perf;
    });
  }

  // 4. Boost ambient light slightly in Performance Mode to compensate for disabled rim/vault lights
  if (typeof updateCavernAesthetics === 'function') {
    updateCavernAesthetics();
  }
  if (perf && typeof ambientLight !== 'undefined' && ambientLight) {
    ambientLight.intensity = Math.min(0.85, (ambientLight.intensity || 0.4) + 0.20);
  }

  // 5. Rebuild board frame & token meshes if a board is currently active so draw-call reduction takes effect immediately
  if (typeof state !== 'undefined' && state && Array.isArray(state.boardMask) && state.boardMask.length === ROWS) {
    rebuild3DBoardGeometry(state.boardMask);
    if (Array.isArray(state.board) && state.board.length === ROWS && !state.busy) {
      rebuildBoardMeshes();
    }
  }
}
