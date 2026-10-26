// ============================================================================
// ANIMATION LOOP, OCCLUSION CULLING & RESPONSIVE RESIZE (js/graphics/loop.js)
// ============================================================================
const clock = new THREE.Clock();
const projVec = new THREE.Vector3();

const OCCLUDING_MODAL_IDS = [
  'bazaar-modal',
  'roulette-modal',
  'boss-chest-modal',
  'difficulty-modal',
  'debug-menu-modal'
];

function isSceneOccludedByModal() {
  for (let i = 0; i < OCCLUDING_MODAL_IDS.length; i++) {
    const el = document.getElementById(OCCLUDING_MODAL_IDS[i]);
    if (el && !el.classList.contains('hidden')) return true;
  }
  return false;
}

function animate() {
  requestAnimationFrame(animate);

  // 1. Always step & render the 2D Physics Roulette Simulator when its modal is open
  const rouletteModal = document.getElementById('roulette-modal');
  if (rouletteModal && !rouletteModal.classList.contains('hidden')) {
    rouletteSim.updatePhysics();
    rouletteSim.render();
  }

  // 2. Pause 3D WebGL rendering & HUD blur overdraw when an opaque modal covers the board
  const occluded = isSceneOccludedByModal();
  document.body.classList.toggle('modal-occluded', occluded);
  if (occluded) {
    return;
  }

  const elapsed = clock.getElapsedTime();

  camState.theta += (camState.targetTheta - camState.theta) * 0.1;
  camState.phi += (camState.targetPhi - camState.phi) * 0.1;

  let shakeX = 0, shakeY = 0;
  if (boardShakeState.intensity > 0.005) {
    shakeX = (Math.random() - 0.5) * boardShakeState.intensity;
    shakeY = (Math.random() - 0.5) * boardShakeState.intensity;
    boardShakeState.intensity *= boardShakeState.decay;
  } else {
    boardShakeState.intensity = 0;
  }

  camera.position.x = camState.baseRadius * Math.sin(camState.phi) * Math.sin(camState.theta) + shakeX;
  camera.position.y = camState.baseRadius * Math.cos(camState.phi) + 0.35 + shakeY;
  camera.position.z = camState.baseRadius * Math.sin(camState.phi) * Math.cos(camState.theta);
  camera.lookAt(shakeX * 0.35, 0.25 + shakeY * 0.35, 0);

  const nowMs = performance.now();
  for (let i = activeVFX.length - 1; i >= 0; i--) {
    const v = activeVFX[i];
    const p = Math.min(1, (nowMs - v.startTime) / v.duration);
    if (v.onUpdate) v.onUpdate(p);
    if (p >= 1) {
      vfxGroup.remove(v.mesh);
      activeVFX.splice(i, 1);
    }
  }

  tokensGroup.children.forEach(mesh => {
    const d = mesh.userData;
    if (mesh.position.y > d.targetY) {
      d.velY -= 0.035;
      mesh.position.y += d.velY;
      if (mesh.position.y <= d.targetY) {
        mesh.position.y = d.targetY;
        if (Math.abs(d.velY) > 0.12) {
          d.velY = -d.velY * 0.26;
        } else {
          d.velY = 0;
        }
      }
    }
  });

  enchantGroup.children.forEach((ring, i) => {
    const s = 1.0 + Math.sin(elapsed * 4.0 + i) * 0.08;
    ring.scale.set(s, s, 1);
  });

  if (ghostToken.visible) {
    ghostToken.rotation.z = elapsed * 1.6;
    ghostMat.opacity = 0.48 + Math.sin(elapsed * 5.5) * 0.18;
  }

  const sArr = sporeGeo.attributes.position.array;
  for (let i = 0; i < sporeCount; i++) {
    sArr[i * 3 + 1] += 0.008;
    if (sArr[i * 3 + 1] > 8) sArr[i * 3 + 1] = -8;
  }
  sporeGeo.attributes.position.needsUpdate = true;

  for (let c = 0; c < COLS; c++) {
    const colX = START_X + c * CELL_SPACING;
    const topY = START_Y + BOARD_H + 0.35;
    projVec.set(colX, topY, 0);
    projVec.project(camera);

    const sx = (projVec.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(projVec.y * 0.5) + 0.5) * window.innerHeight;

    const badge = colBadges[c];
    badge.style.left = `${sx}px`;
    badge.style.top = `${sy}px`;

    const numEl = document.getElementById(`col-num-${c}`);
    if (c === state.previewCol) {
      numEl.className = "text-xs font-mono-code font-bold text-amber-300 scale-125 transition";
    } else {
      numEl.className = "text-[10px] font-mono-code font-bold text-amber-400/75 mt-0.5";
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', updateCameraAspect);
if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(() => updateCameraAspect());
  ro.observe(container);
}
