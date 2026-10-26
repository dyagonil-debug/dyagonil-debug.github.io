// ============================================================================
// THREE.JS 3D CAVERN SCENE, CARVED WOOD BOARD & TOKEN MESHES (js/graphics/scene3d.js)
// ============================================================================

// ============================================================================
// 4. THREE.JS 3D BOARD, ENCHANTMENT RINGS & SUBTERRANEAN CAVERN
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
    } else {
        camera.fov = 42;
        camState.baseRadius = 14.2;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

const ambientLight = new THREE.AmbientLight(0xfef3c7, 0.58);
scene.add(ambientLight);

const amberLanternLight = new THREE.PointLight(0xf59e0b, 2.4, 35);
amberLanternLight.position.set(-6, 7, 9);
scene.add(amberLanternLight);

const tealBiolumLight = new THREE.PointLight(0x14b8a6, 2.2, 35);
tealBiolumLight.position.set(6, 6, 8);
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
    roughness: 0.28,
    metalness: 0.8
});

const bedrockPedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b24,
    emissive: 0x0f172a,
    emissiveIntensity: 0.35,
    roughness: 0.82,
    metalness: 0.22
});

// Base Pedestal beneath the entire 7x6 frame
const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W + 1.5, 0.7, 1.6), carvedWoodMat);
baseMesh.position.set(0, START_Y - 1.0, 0);
boardGroup.add(baseMesh);

// Dynamic Frame Group rebuilt per floor topology so VOID_CELLs are visually carved out!
const dynamicFrameGroup = new THREE.Group();
boardGroup.add(dynamicFrameGroup);

// Slot Rings & Enchantment Meshes
const ringGeo = new THREE.TorusGeometry(0.43, 0.032, 10, 28);
const enchantRingGeo = new THREE.TorusGeometry(0.36, 0.055, 12, 28);
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

function rebuild3DBoardGeometry(mask) {
    while (dynamicFrameGroup.children.length > 0) {
        dynamicFrameGroup.remove(dynamicFrameGroup.children[0]);
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = START_X + c * CELL_SPACING;
            const y = START_Y + r * CELL_SPACING;
            const isPlayable = mask[r][c];

            if (isPlayable) {
                // Top & Bottom horizontal carved wood beams for this cell
                const topBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
                topBeam.position.set(x, y + CELL_SPACING * 0.5, 0);
                dynamicFrameGroup.add(topBeam);

                const botBeam = new THREE.Mesh(cellStrutHGeo, carvedWoodMat);
                botBeam.position.set(x, y - CELL_SPACING * 0.5, 0);
                dynamicFrameGroup.add(botBeam);

                // Left & Right vertical carved wood beams for this cell
                const leftBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
                leftBeam.position.set(x - CELL_SPACING * 0.5, y, 0);
                dynamicFrameGroup.add(leftBeam);

                const rightBeam = new THREE.Mesh(cellStrutVGeo, carvedWoodMat);
                rightBeam.position.set(x + CELL_SPACING * 0.5, y, 0);
                dynamicFrameGroup.add(rightBeam);

                // Front & Back Brass Bevel Slot Rings
                const fRing = new THREE.Mesh(ringGeo, brassInlayMat);
                fRing.position.set(x, y, 0.36);
                dynamicFrameGroup.add(fRing);

                const bRing = new THREE.Mesh(ringGeo, brassInlayMat);
                bRing.position.set(x, y, -0.36);
                dynamicFrameGroup.add(bRing);
            } else {
                // Check if there is any playable cell ABOVE this void cell in the same column
                let hasPlayableAbove = false;
                for (let rr = r + 1; rr < ROWS; rr++) {
                    if (mask[rr][c]) { hasPlayableAbove = true; break; }
                }
                // If playable cells exist above this void cell, render an elevated obsidian bedrock pedestal!
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

// Background Stalactites & Floating Cavern Spores
const caveRockMat = new THREE.MeshStandardMaterial({ color: 0x16131d, roughness: 0.9, metalness: 0.05 });
for (let i = 0; i < 14; i++) {
    const h = 3 + Math.random() * 6;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6 + Math.random() * 0.9, h, 7), caveRockMat);
    const isTop = i % 2 === 0;
    cone.position.set((Math.random() - 0.5) * 22, isTop ? 7.5 : -6.5, -4.5 - Math.random() * 8);
    if (isTop) cone.rotation.x = Math.PI;
    scene.add(cone);
}

const sporeCount = 180;
const sporeGeo = new THREE.BufferGeometry();
const sporePos = new Float32Array(sporeCount * 3);
for (let i = 0; i < sporeCount; i++) {
    sporePos[i * 3] = (Math.random() - 0.5) * 22;
    sporePos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    sporePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
}
sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
const sporePoints = new THREE.Points(sporeGeo, new THREE.PointsMaterial({
    color: 0x2dd4bf, size: 0.09, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending
}));
scene.add(sporePoints);

// Hitboxes & Targeting
const columnHitboxes = [];
const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });
for (let c = 0; c < COLS; c++) {
    const x = START_X + c * CELL_SPACING;
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(CELL_SPACING, BOARD_H + 2.5, 1.6), invisibleMat);
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
    map: woodTex, color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.48, roughness: 0.25, metalness: 0.4
});
const aiMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6, emissive: 0x0d9488, emissiveIntensity: 0.65, roughness: 0.2, metalness: 0.7
});
const stoneMat = new THREE.MeshStandardMaterial({
    map: woodTex, color: 0x78716c, emissive: 0x1c1917, emissiveIntensity: 0.2, roughness: 0.88, metalness: 0.08
});
const wildMat = new THREE.MeshStandardMaterial({
    color: 0xe879f9, emissive: 0xc026d3, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.85
});
const winGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xfde047, emissiveIntensity: 1.35, roughness: 0.1, metalness: 0.9
});

const tokensGroup = new THREE.Group();
boardGroup.add(tokensGroup);

// ============================================================================
// 6. BOARD INITIALIZATION & 3D SLOT ENCHANTMENTS
// ============================================================================
function generateSlotEnchantments() {
    while (enchantGroup.children.length > 0) {
        enchantGroup.remove(enchantGroup.children[0]);
    }
    state.enchantGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(ENCHANT_TYPES.NONE));

    const coords = [];
    for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
            if (state.boardMask && !state.boardMask[r][c]) continue;
            if (r === 0 && c === 3) continue;
            coords.push([r, c]);
        }
    }
    // Early floors start with just 1-2 simple enchantments; scales with progression
    const floorBonus = Math.floor(state.floorIdx / 2);
    const totalEnchants = Math.min(18, state.persistentEnchantCount + floorBonus + (state.nextFloorModifiers.bonusEnchantSlots || 0));
    const picked = shuffle(coords).slice(0, totalEnchants);
    // Floors 1-2 focus on Gilded & Spice slots before full complexity
    const types = state.floorIdx < 2
        ? [ENCHANT_TYPES.GILDED, ENCHANT_TYPES.SPICE]
        : [ENCHANT_TYPES.GILDED, ENCHANT_TYPES.SPICE, ENCHANT_TYPES.AMPLIFIER, ENCHANT_TYPES.WEB];

    picked.forEach(([r, c], idx) => {
        const eType = types[idx % types.length];
        state.enchantGrid[r][c] = eType;

        const x = START_X + c * CELL_SPACING;
        const y = START_Y + r * CELL_SPACING;
        const eRing = new THREE.Mesh(enchantRingGeo, enchantMaterials[eType]);
        eRing.position.set(x, y, 0.39);
        enchantGroup.add(eRing);
    });

    // Sacred Prismatic Heart Gambit: Guarantees +1 extra Amplifier Slot on every floor!
    if (hasGambit('sacred_heart_prism')) {
        const remaining = coords.filter(([r, c]) => state.enchantGrid[r][c] === ENCHANT_TYPES.NONE);
        if (remaining.length > 0) {
            const [ar, ac] = remaining[Math.floor(Math.random() * remaining.length)];
            state.enchantGrid[ar][ac] = ENCHANT_TYPES.AMPLIFIER;
            const x = START_X + ac * CELL_SPACING;
            const y = START_Y + ar * CELL_SPACING;
            const eRing = new THREE.Mesh(enchantRingGeo, enchantMaterials[ENCHANT_TYPES.AMPLIFIER]);
            eRing.position.set(x, y, 0.39);
            enchantGroup.add(eRing);
        }
    }
}

function spawnTokenMesh(r, c, type) {
    state.board[r][c] = type;
    if (type === PLAYER || type === WILD) {
        state.lastPlayedCell = [r, c];
    }
    let mat = playerMat;
    if (type === AI) mat = aiMat;
    else if (type === STONE) mat = stoneMat;
    else if (type === WILD) mat = wildMat;

    const mesh = new THREE.Mesh(tokenGeo, mat);
    const targetX = START_X + c * CELL_SPACING;
    const targetY = START_Y + r * CELL_SPACING;

    mesh.position.set(targetX, START_Y + BOARD_H + 1.2, 0);
    mesh.userData = { targetX, targetY, velY: 0, type };

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), brassInlayMat);
    innerRing.position.z = 0.16;
    mesh.add(innerRing);

    // Oddly Shrinking Cave Shroom Gambit: Visually shrinks Player tokens to cute 68% mini-size!
    if (type === PLAYER && hasGambit('shrinking_shroom')) {
        mesh.scale.set(0.68, 0.68, 0.85);
    }

    tokensGroup.add(mesh);
    state.meshes[r][c] = mesh;
}

function rebuildBoardMeshes(dropOffsetCols = null) {
    // Always compact all columns against gravity before building 3D meshes so no piece can ever float!
    applyBoardGravity();

    while (tokensGroup.children.length > 0) {
        tokensGroup.remove(tokensGroup.children[0]);
    }
    state.meshes = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = state.board[r][c];
            if (cell !== EMPTY && cell !== VOID_CELL) {
                let mat = playerMat;
                if (cell === AI) mat = aiMat;
                else if (cell === STONE) mat = stoneMat;
                else if (cell === WILD) mat = wildMat;

                const mesh = new THREE.Mesh(tokenGeo, mat);
                const targetX = START_X + c * CELL_SPACING;
                const targetY = START_Y + r * CELL_SPACING;
                const liftY = (dropOffsetCols && dropOffsetCols.includes(c)) ? CELL_SPACING : 0.28;
                mesh.position.set(targetX, targetY + liftY, 0);
                mesh.userData = { targetX, targetY, velY: 0, type: cell };

                const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), brassInlayMat);
                innerRing.position.z = 0.16;
                mesh.add(innerRing);

                if (cell === PLAYER && hasGambit('shrinking_shroom')) {
                    mesh.scale.set(0.68, 0.68, 0.85);
                }

                tokensGroup.add(mesh);
                state.meshes[r][c] = mesh;
            }
        }
    }
}

function rebuildEnchantmentRings() {
    while (enchantGroup.children.length > 0) {
        enchantGroup.remove(enchantGroup.children[0]);
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const eType = state.enchantGrid[r][c];
            if (eType !== ENCHANT_TYPES.NONE) {
                const x = START_X + c * CELL_SPACING;
                const y = START_Y + r * CELL_SPACING;
                const eRing = new THREE.Mesh(enchantRingGeo, enchantMaterials[eType]);
                eRing.position.set(x, y, 0.39);
                enchantGroup.add(eRing);
            }
        }
    }
}
