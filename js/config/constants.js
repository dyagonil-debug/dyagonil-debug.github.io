// ============================================================================
// GRID DIMENSIONS, CELL STATES & FLOOR STRUCTURE CONSTANTS (js/config/constants.js)
// ============================================================================
const ROWS = 6;
const BASE_COLS = 7;
const CYLINDER_COLS = 12;
const MAX_COLS = 12;
let COLS = BASE_COLS;
const VOID_CELL = -1;
const EMPTY = 0;
const PLAYER = 1;
const AI = 2;
const STONE = 3;
const WILD = 4;

// 15-Floor / 5-Act Ascension Structure (2 Standard Sentinels -> 1 Boss per Act across 5 Acts)
const TOTAL_FLOORS = 15;
const TOTAL_ACTS = 5;
const MAX_SHOP_TIER = 5;

function setActiveBoardCols(newCols = BASE_COLS) {
  COLS = (newCols === CYLINDER_COLS) ? CYLINDER_COLS : BASE_COLS;
  if (typeof window !== 'undefined') {
    window.COLS = COLS;
    if (window.C4 && window.C4.config) {
      window.C4.config.COLS = COLS;
    }
  }
  if (typeof aiEngine !== 'undefined' && aiEngine && typeof aiEngine.rebuildColOrder === 'function') {
    aiEngine.rebuildColOrder(COLS);
  }
  return COLS;
}

function createGrid(rows = ROWS, cols = COLS, fillValue = EMPTY) {
  return Array.from({ length: rows }, () => Array(cols).fill(fillValue));
}

function isValidFloorIndex(floorIdx) {
  return Number.isInteger(floorIdx) && floorIdx >= 0 && floorIdx < TOTAL_FLOORS;
}

function isBossFloorIndex(floorIdx) {
  // floorIdx is 0-indexed: Floor 3 (idx 2), Floor 6 (idx 5), Floor 9 (idx 8), Floor 12 (idx 11), Floor 15 (idx 14)
  return isValidFloorIndex(floorIdx) && (floorIdx + 1) % 3 === 0;
}

function isPreBossFloorIndex(floorIdx) {
  // Floor 2 (idx 1), Floor 5 (idx 4), Floor 8 (idx 7), Floor 11 (idx 10), Floor 14 (idx 13) precede each Boss fight
  return isValidFloorIndex(floorIdx) && (floorIdx + 1) % 3 === 2;
}
