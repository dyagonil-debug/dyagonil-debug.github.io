// ============================================================================
// MOBILE TOUCH, POINTER RAYCASTING & DESKTOP KEYBOARD TARGETING (js/ui/input.js)
// ============================================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isPointerDownOnBoard = false;
let downCol = -1;
let pointerMovedSignificantly = false;
let downX = 0;
let downY = 0;

function isColCurrentlyTargetable(col) {
  if (col < 0 || col >= COLS) return false;
  if (typeof state !== 'undefined' && state && state.isCylinderPhase) {
    if (state.isCylinderLowering) return false;
    if (typeof isCylinderColumnInteractive === 'function') {
      return isCylinderColumnInteractive(col);
    }
  }
  return true;
}

function getColumnFromPointerEvent(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const activeHitboxes = columnHitboxes.filter((hb) => hb && hb.userData && isColCurrentlyTargetable(hb.userData.col));
  const hits = raycaster.intersectObjects(activeHitboxes);
  return hits.length > 0 ? hits[0].object.userData.col : -1;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (state.turn !== PLAYER || state.busy || state.gameOver) return;
  downX = e.clientX;
  downY = e.clientY;
  pointerMovedSignificantly = false;

  const col = getColumnFromPointerEvent(e);
  if (col !== -1) {
    isPointerDownOnBoard = true;
    downCol = col;
    if (userSettings.touchDropMode === 'confirm' && state.previewCol !== col) {
      updateColumnPreviewVisual(col);
      downCol = -2;
    } else {
      updateColumnPreviewVisual(col);
    }
  } else {
    isPointerDownOnBoard = false;
  }
});

window.addEventListener('pointermove', (e) => {
  const dx = e.clientX - downX;
  const dy = e.clientY - downY;
  if (Math.abs(dx) + Math.abs(dy) > 10) pointerMovedSignificantly = true;

  if (isPointerDownOnBoard) {
    const col = getColumnFromPointerEvent(e);
    if (col !== -1) updateColumnPreviewVisual(col);
  } else if (e.pointerType === 'mouse' && !e.buttons) {
    const col = getColumnFromPointerEvent(e);
    if (col !== -1) updateColumnPreviewVisual(col);
  }
});

window.addEventListener('pointerup', (e) => {
  if (!isPointerDownOnBoard) return;
  isPointerDownOnBoard = false;

  const releaseCol = getColumnFromPointerEvent(e);
  if (releaseCol === -1) return;

  if (pointerMovedSignificantly || downCol === releaseCol || userSettings.touchDropMode === 'instant') {
    commitColumnAction(releaseCol);
  }
});

// UI Button Listeners
document.getElementById('confirm-drop-btn').addEventListener('click', () => {
  if (state.previewCol !== -1 && isColCurrentlyTargetable(state.previewCol)) {
    commitColumnAction(state.previewCol);
  }
});

document.getElementById('cancel-action-btn').addEventListener('click', clearActionSelection);

document.getElementById('telemetry-btn').addEventListener('click', () => {
  if (!hasGambit('dali_clock') && !state.showTelemetry) {
    showToast('Requires 🕰️ Surrealist Dalí Clock Relic to read AI column scores!', '🕰️');
    return;
  }
  if (hasGambit('dali_clock')) {
    state.telemetryMutedByUser = !state.telemetryMutedByUser;
    updateTelemetryBadges();
    showToast(!state.telemetryMutedByUser ? 'Dalí Clock AI Telemetry: ON' : 'Dalí Clock AI Telemetry: OFF', '🕰️');
  } else {
    state.showTelemetry = !state.showTelemetry;
    updateTelemetryBadges();
    showToast(state.showTelemetry ? 'AI Column Telemetry: ON' : 'AI Column Telemetry: OFF', '👁️');
  }
});

document.getElementById('mute-btn').addEventListener('click', () => {
  const nextMute = !sfx.muted;
  sfx.setMuted(nextMute);
  userSettings.musicEnabled = !nextMute;
  saveUserSettings();
  if (nextMute) bgm.stop();
  else bgm.play();
  showToast(nextMute ? 'Audio & Chiptune Music Muted' : 'Audio & Chiptune Music Active', nextMute ? '🔇' : '🔊');
});

// ============================================================================
// DESKTOP & QA KEYBOARD SHORTCUTS
// ============================================================================
const BLOCKING_MODAL_IDS = [
  'intro-sequence-overlay',
  'floor-intro-overlay',
  'tutorial-overlay',
  'bazaar-modal',
  'roulette-modal',
  'boss-chest-modal',
  'gameover-modal',
  'settings-modal',
  'difficulty-modal',
  'debug-menu-modal',
  'info-sheet-modal'
];

function isAnyBlockingModalOpen() {
  return BLOCKING_MODAL_IDS.some((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    if (id === 'intro-sequence-overlay' && el.style.pointerEvents === 'none') return false;
    return !el.classList.contains('hidden');
  });
}

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  // Escape closes Info Sheet / Settings or cancels an armed Card/Reserve selection
  if (e.key === 'Escape') {
    const infoSheet = document.getElementById('info-sheet-modal');
    if (infoSheet && !infoSheet.classList.contains('hidden')) {
      infoSheet.classList.add('hidden');
      return;
    }
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
      if (typeof closeSettingsModal === 'function') closeSettingsModal();
      else settingsModal.classList.add('hidden');
      return;
    }
    if (state.selectedCardIdx !== null || state.selectedReserveIdx !== null || state.previewCol !== -1) {
      clearActionSelection();
      updateColumnPreviewVisual(-1);
    }
    return;
  }

  if (isAnyBlockingModalOpen() || state.turn !== PLAYER || state.busy || state.gameOver) {
    return;
  }

  // 1. Number Keys 1-9 (and 0 for Col 10): Aim or Drop in Targetable Column
  if (e.key >= '1' && e.key <= '9') {
    const col = parseInt(e.key, 10) - 1;
    if (col < COLS && isColCurrentlyTargetable(col)) {
      e.preventDefault();
      if (userSettings.touchDropMode === 'instant' || state.previewCol === col) {
        commitColumnAction(col);
      } else {
        updateColumnPreviewVisual(col);
      }
      return;
    }
  }

  // 2. ArrowLeft / ArrowRight (or A / D): Step Column Aim across currently targetable columns
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    const isRight = (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D');
    const visibleCols = [];
    for (let c = 0; c < COLS; c++) {
      if (isColCurrentlyTargetable(c)) visibleCols.push(c);
    }
    if (visibleCols.length === 0) return;
    if (state.isCylinderPhase && typeof getCylinderColumnScreenXOrder === 'function') {
      const ordered = getCylinderColumnScreenXOrder(visibleCols);
      const curPos = ordered.indexOf(state.previewCol);
      const nextPos = curPos === -1
        ? Math.floor(ordered.length / 2)
        : (isRight ? Math.min(ordered.length - 1, curPos + 1) : Math.max(0, curPos - 1));
      updateColumnPreviewVisual(ordered[nextPos]);
    } else {
      const nextCol = isRight
        ? ((state.previewCol < 0 || state.previewCol >= COLS - 1) ? 0 : state.previewCol + 1)
        : (state.previewCol <= 0 ? COLS - 1 : state.previewCol - 1);
      updateColumnPreviewVisual(nextCol);
    }
    return;
  }

  // 3. Enter or Space: Confirm Action on Previewed Column
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    let fallbackCol = 3;
    if (state.isCylinderPhase) {
      for (let c = 0; c < COLS; c++) {
        if (isColCurrentlyTargetable(c)) {
          fallbackCol = c;
          break;
        }
      }
    }
    const targetCol = (state.previewCol !== -1 && isColCurrentlyTargetable(state.previewCol))
      ? state.previewCol
      : fallbackCol;
    if (state.previewCol === -1 || !isColCurrentlyTargetable(state.previewCol)) {
      updateColumnPreviewVisual(targetCol);
    } else {
      commitColumnAction(targetCol);
    }
    return;
  }

  // 4. Q, W, E, R, T: Quick-Select Arcane Cards 1-5 in Hand
  const cardHotkeys = ['q', 'w', 'e', 'r', 't'];
  const cardIdx = cardHotkeys.indexOf(e.key.toLowerCase());
  if (cardIdx !== -1 && cardIdx < state.hand.length) {
    e.preventDefault();
    const cardId = state.hand[cardIdx];
    const effCost = getEffectiveCardCost(cardId);
    if (state.mana >= effCost) {
      toggleSelectCard(cardIdx);
    } else {
      showToast('Not enough Mana crystals!', '⚡');
    }
    return;
  }

  // 5. Z, X, C, V: Quick-Select Tactical Reserve Tokens 1-4
  const reserveHotkeys = ['z', 'x', 'c', 'v'];
  const resIdx = reserveHotkeys.indexOf(e.key.toLowerCase());
  if (resIdx !== -1 && resIdx < state.reservePouch.length) {
    e.preventDefault();
    toggleSelectReserveToken(resIdx);
  }
});
