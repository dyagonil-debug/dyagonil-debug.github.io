// ============================================================================
// ANIMATION LOOP, OCCLUSION CULLING, FRAME PACING & RESPONSIVE RESIZE (js/graphics/loop.js)
// ============================================================================
const clock = new THREE.Clock();
let lastFrameElapsed = 0;
let lastRenderedMs = 0;
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

function hasActiveBoardMotion() {
  if (activeVFX.length > 0 || boardShakeState.intensity > 0.005) return true;
  if (typeof state !== 'undefined' && state) {
    if (state.busy || state.isCarouselRotating || state.isCylinderPhase || state.isCavernCrumbling) {
      return true;
    }
  }
  for (let i = 0; i < tokensGroup.children.length; i++) {
    const d = tokensGroup.children[i].userData;
    if (d && (d.freefall || tokensGroup.children[i].position.y > d.targetY || Math.abs(d.velY || 0) > 0.001)) {
      return true;
    }
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

  // 3. Smart Frame-Rate Pacing (prevents 120Hz ProMotion overheat & throttles idle frames in Performance Mode)
  const nowMs = performance.now();
  const perf = typeof isPerformanceMode === 'function' && isPerformanceMode();
  const minIntervalMs = perf
    ? (hasActiveBoardMotion() ? 21.0 : 32.5) // ~45 FPS active / ~30 FPS idle in Performance Mode
    : 15.5;                                  // ~60 FPS cap in Fancy Mode (prevents 120Hz thermal drain)

  if (nowMs - lastRenderedMs < minIntervalMs) {
    return;
  }
  lastRenderedMs = nowMs;

  const elapsed = clock.getElapsedTime();
  const dt = Math.min(0.1, Math.max(0, elapsed - lastFrameElapsed));
  lastFrameElapsed = elapsed;

  camState.theta += (camState.targetTheta - camState.theta) * 0.1;
  camState.phi += (camState.targetPhi - camState.phi) * 0.1;

  let shakeX = 0;
  let shakeY = 0;
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

  // Step active 3D Arcane Card, Reserve Token & Gambit VFX
  for (let i = activeVFX.length - 1; i >= 0; i--) {
    const v = activeVFX[i];
    const p = Math.min(1, (nowMs - v.startTime) / v.duration);
    if (v.onUpdate) v.onUpdate(p);
    if (p >= 1) {
      vfxGroup.remove(v.mesh);
      activeVFX.splice(i, 1);
    }
  }
  if (typeof vfxKeyLight !== 'undefined' && vfxKeyLight) {
    vfxKeyLight.intensity = (!perf && activeVFX.length > 0) ? 0.95 : 0.0;
  }

  tokensGroup.children.forEach((mesh) => {
    const d = mesh.userData;
    if (!d || d.vfxControlled) return;
    if (d.freefall) {
      d.velY -= 0.028;
      mesh.position.x += (d.velX || 0);
      mesh.position.y += d.velY;
      mesh.position.z += (d.velZ || 0);
      if (d.rotSpeedX) mesh.rotation.x += d.rotSpeedX;
      if (d.rotSpeedZ) mesh.rotation.z += d.rotSpeedZ;
      return;
    }
    if (mesh.position.y > d.targetY) {
      d.velY -= 0.035;
      mesh.position.y += d.velY;
      if (d.rotSpeedX) mesh.rotation.x += d.rotSpeedX;
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

  // Pulse Enchanted Slot Rings (throttled in Performance Mode)
  if (!perf || (Math.floor(nowMs / 32) % 2 === 0)) {
    enchantGroup.children.forEach((ring, i) => {
      const s = 1.0 + Math.sin(elapsed * 4.0 + i) * 0.08;
      ring.scale.set(s, s, 1);
    });
  }

  if (ghostToken.visible) {
    ghostToken.rotation.z = elapsed * 1.6;
    ghostMat.opacity = 0.48 + Math.sin(elapsed * 5.5) * 0.18;
  }

  if (typeof updateCavernAnimation === 'function') {
    updateCavernAnimation(elapsed);
  }
  if (typeof updateCylindricalBoardTransforms === 'function') {
    updateCylindricalBoardTransforms(dt);
  }

  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const topY = START_Y + BOARD_H + 0.35 + ((typeof state !== 'undefined' && state && state.cylinderDropOffsetY) || 0);
  const isCyl = typeof state !== 'undefined' && state && !!state.isCylinderPhase;

  for (let c = 0; c < colBadges.length; c++) {
    const badge = colBadges[c];
    if (!badge) continue;
    if (c >= COLS) {
      if (badge._lastDisplay !== 'none') {
        badge.style.display = 'none';
        badge._lastDisplay = 'none';
      }
      continue;
    }
    if (isCyl) {
      if (typeof isCylinderColumnInteractive === 'function' && !isCylinderColumnInteractive(c)) {
        if (badge._lastDisplay !== 'none') {
          badge.style.display = 'none';
          badge._lastDisplay = 'none';
        }
        continue;
      }
      if (badge._lastDisplay !== 'flex') {
        badge.style.display = 'flex';
        badge._lastDisplay = 'flex';
      }
      const pos = getCylinderCellWorldCoords(0, c, 0);
      projVec.set(pos.x, topY, pos.z);
    } else {
      if (badge._lastDisplay !== 'flex') {
        badge.style.display = 'flex';
        badge._lastDisplay = 'flex';
      }
      const colX = START_X + c * CELL_SPACING;
      projVec.set(colX, topY, 0);
    }
    projVec.project(camera);

    const sx = Math.round((projVec.x * 0.5 + 0.5) * winW * 2) / 2;
    const sy = Math.round((-(projVec.y * 0.5) + 0.5) * winH * 2) / 2;

    if (badge._lastSx !== sx || badge._lastSy !== sy) {
      badge.style.left = `${sx}px`;
      badge.style.top = `${sy}px`;
      badge._lastSx = sx;
      badge._lastSy = sy;
    }

    const numEl = (typeof colNumEls !== 'undefined' && colNumEls[c]) || document.getElementById(`col-num-${c}`);
    if (numEl) {
      const isPreview = c === state.previewCol;
      if (numEl._lastPreview !== isPreview) {
        numEl._lastPreview = isPreview;
        numEl.className = isPreview
          ? 'text-xs font-mono-code font-bold text-amber-300 scale-125 transition'
          : 'text-[10px] font-mono-code font-bold text-amber-400/75 mt-0.5';
      }
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', updateCameraAspect);
if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(() => updateCameraAspect());
  ro.observe(container);
}
