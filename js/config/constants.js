// ============================================================================
// GRID DIMENSIONS, CELL STATES & FLOOR STRUCTURE CONSTANTS (js/config/constants.js)
// ============================================================================
const ROWS = 6;
const COLS = 7;
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

function createGrid(rows = ROWS, cols = COLS, fillValue = EMPTY) {
  return Array.from({ length: rows }, () => Array(cols).fill(fillValue));
}

function isValidFloorIndex(floorIdx) {
  return Number.isInteger(floorIdx) && floorIdx >= 0 && floorIdx < TOTAL_FLOORS;
}

function isBossFloorIndex(floorIdx) {
  // floorIdx is 0-indexed: Floor 3 (idx 2), Floor 6 (idx 5), Floor 9 (idx 8)
  return isValidFloorIndex(floorIdx) && (floorIdx + 1) % 3 === 0;
}

function isPreBossFloorIndex(floorIdx) {
  // Floor 2 (idx 1), Floor 5 (idx 4), Floor 8 (idx 7) precede each Boss fight
  return isValidFloorIndex(floorIdx) && (floorIdx + 1) % 3 === 2;
}
