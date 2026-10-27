// ============================================================================
// GRANDMASTER NEGAMAX AI ENGINE & OVERKILL COMBO ANALYZER (js/engine/ai.js)
// ============================================================================

class GrandmasterConnect4AI {
  constructor() {
    this.tt = new Map();
    this.colOrder = [3, 2, 4, 1, 5, 0, 6];
  }

  getAvailableRow(board, col) {
    if (col < 0 || col >= COLS) return -1;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][col] === VOID_CELL) continue;
      if (board[r][col] === EMPTY) return r;
    }
    return -1;
  }

  getTopOccupiedRow(board, col) {
    if (col < 0 || col >= COLS) return -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const cell = board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) return r;
    }
    return -1;
  }

  getBottomOccupiedRow(board, col) {
    if (col < 0 || col >= COLS) return -1;
    for (let r = 0; r < ROWS; r++) {
      const cell = board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) return r;
    }
    return -1;
  }

  isBoardFull(board) {
    for (let c = 0; c < COLS; c++) {
      if (this.getAvailableRow(board, c) !== -1) return false;
    }
    return true;
  }

  matchesActor(cell, actor) {
    if (cell === VOID_CELL) return false;
    return cell === actor || cell === WILD;
  }

  // Fast zero-allocation boolean check for Negamax search nodes
  hasWinningLine(board, actor) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (
          this.matchesActor(board[r][c], actor) &&
          this.matchesActor(board[r][c + 1], actor) &&
          this.matchesActor(board[r][c + 2], actor) &&
          this.matchesActor(board[r][c + 3], actor)
        ) {
          return true;
        }
      }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        if (
          this.matchesActor(board[r][c], actor) &&
          this.matchesActor(board[r + 1][c], actor) &&
          this.matchesActor(board[r + 2][c], actor) &&
          this.matchesActor(board[r + 3][c], actor)
        ) {
          return true;
        }
      }
    }
    // Diagonal /
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (
          this.matchesActor(board[r][c], actor) &&
          this.matchesActor(board[r + 1][c + 1], actor) &&
          this.matchesActor(board[r + 2][c + 2], actor) &&
          this.matchesActor(board[r + 3][c + 3], actor)
        ) {
          return true;
        }
      }
    }
    // Diagonal \
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (
          this.matchesActor(board[r][c], actor) &&
          this.matchesActor(board[r - 1][c + 1], actor) &&
          this.matchesActor(board[r - 2][c + 2], actor) &&
          this.matchesActor(board[r - 3][c + 3], actor)
        ) {
          return true;
        }
      }
    }
    return null;
  }

  // Scans all 4 axes for maximal contiguous runs (>= 4) to detect Connect-5+ Overkills & Multi-Trap Forks
  analyzeWinningCombo(board, actor) {
    const directions = [
      { dr: 0, dc: 1, name: 'Horizontal' },
      { dr: 1, dc: 0, name: 'Vertical' },
      { dr: 1, dc: 1, name: 'Ascending Diagonal' },
      { dr: -1, dc: 1, name: 'Descending Diagonal' }
    ];

    const lines = [];
    const cellSet = new Set();
    const allCells = [];
    let maxLineLength = 0;

    for (const { dr, dc, name } of directions) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!this.matchesActor(board[r][c], actor)) continue;

          // Only start a maximal line scan if the preceding cell along this axis does NOT match
          const prevR = r - dr;
          const prevC = c - dc;
          if (
            prevR >= 0 &&
            prevR < ROWS &&
            prevC >= 0 &&
            prevC < COLS &&
            this.matchesActor(board[prevR][prevC], actor)
          ) {
            continue;
          }

          const currentLine = [];
          let currR = r;
          let currC = c;
          while (
            currR >= 0 &&
            currR < ROWS &&
            currC >= 0 &&
            currC < COLS &&
            this.matchesActor(board[currR][currC], actor)
          ) {
            currentLine.push([currR, currC]);
            currR += dr;
            currC += dc;
          }

          if (currentLine.length >= 4) {
            lines.push({
              direction: name,
              length: currentLine.length,
              cells: currentLine
            });
            if (currentLine.length > maxLineLength) {
              maxLineLength = currentLine.length;
            }
            for (const [ cellR, cellC ] of currentLine) {
              const key = `${cellR},${cellC}`;
              if (!cellSet.has(key)) {
                cellSet.add(key);
                allCells.push([cellR, cellC]);
              }
            }
          }
        }
      }
    }

    if (lines.length === 0) return null;

    const lineCount = lines.length;
    const isOverkill = maxLineLength >= 5;
    const isMultiTrap = lineCount >= 2;

    let bonusGold = 0;
    let bonusReserveId = null;
    let crushDamage = 1;
    let title = '';
    let subtitle = '';
    let icon = '⚡';

    if (isOverkill && isMultiTrap) {
      bonusGold = 9;
      bonusReserveId = 'wild';
      crushDamage = 3;
      icon = '👑';
      title = `GRANDMASTER CATACLYSM (${lineCount} Lines • Connect-${maxLineLength}!)`;
      subtitle = `+$${bonusGold} Overkill Gold & +1 Wild Prismatic Token!`;
    } else if (lineCount >= 3) {
      bonusGold = 9;
      bonusReserveId = 'wild';
      crushDamage = 3;
      icon = '🔱';
      title = `TRIPLE-TRAP FORK MASTERY (${lineCount} Simultaneous Lines!)`;
      subtitle = `+$${bonusGold} Combo Gold & +1 Wild Prismatic Token!`;
    } else if (isMultiTrap) {
      bonusGold = 5;
      bonusReserveId = 'jalapeno_bomb';
      crushDamage = 2;
      icon = '⚔️';
      title = `TWIN-4 MULTI-TRAP FORK (2 Intersecting Lines!)`;
      subtitle = `+$${bonusGold} Combo Gold & +1 Jalapeño Core Bomb!`;
    } else if (maxLineLength >= 6) {
      bonusGold = 7;
      bonusReserveId = 'wild';
      crushDamage = 2;
      icon = '🌋';
      title = `CONNECT-${maxLineLength} CAVERN OVERKILL!`;
      subtitle = `+$${bonusGold} Overkill Gold & +1 Wild Prismatic Token!`;
    } else if (maxLineLength === 5) {
      bonusGold = 4;
      bonusReserveId = 'anvil';
      crushDamage = 2;
      icon = '💥';
      title = `CONNECT-5 OVERKILL!`;
      subtitle = `+$${bonusGold} Overkill Gold & +1 Heavy Anvil Token!`;
    }

    return {
      lines,
      allCells,
      lineCount,
      maxLineLength,
      isOverkill,
      isMultiTrap,
      bonusGold,
      bonusReserveId,
      crushDamage,
      title,
      subtitle,
      icon
    };
  }

  // Returns all winning coordinates across all completed lines so 5+ Overkills & Twin-4s all glow gold
  findWinningLine(board, actor) {
    if (!this.hasWinningLine(board, actor)) return null;
    const combo = this.analyzeWinningCombo(board, actor);
    return combo ? combo.allCells : null;
  }

  scoreWindow(w, actor) {
    const opp = actor === AI ? PLAYER : AI;
    let myCount = 0, oppCount = 0, emptyCount = 0;
    for (let i = 0; i < 4; i++) {
      const v = w[i];
      if (v === STONE || v === VOID_CELL) return 0;
      if (v === WILD) {
        myCount++;
        oppCount++;
      } else if (v === actor) {
        myCount++;
      } else if (v === opp) {
        oppCount++;
      } else {
        emptyCount++;
      }
    }
    if (myCount > 0 && oppCount > 0 && myCount !== oppCount) return 0;
    if (myCount === 4) return 10000;
    if (myCount === 3 && emptyCount === 1) return 140;
    if (myCount === 2 && emptyCount === 2) return 24;
    if (oppCount === 3 && emptyCount === 1) return -165;
    if (oppCount === 2 && emptyCount === 2) return -28;
    return 0;
  }

  evaluate(board, actor, enchantGrid) {
    let score = 0;
    // Center column control preference
    for (let r = 0; r < ROWS; r++) {
      if (board[r][3] === actor) score += 18;
      else if (board[r][3] !== EMPTY && board[r][3] !== STONE && board[r][3] !== VOID_CELL) score -= 14;
    }

    // Enchantment awareness
    if (enchantGrid) {
      for (let c = 0; c < COLS; c++) {
        const availR = this.getAvailableRow(board, c);
        if (availR !== -1 && enchantGrid[availR] && enchantGrid[availR][c]) {
          const e = enchantGrid[availR][c];
          if (e === ENCHANT_TYPES.GILDED || e === ENCHANT_TYPES.AMPLIFIER) {
            score += (actor === AI ? 10 : -10);
          } else if (e === ENCHANT_TYPES.WEB) {
            score += (actor === AI ? -35 : 20);
          }
        }
      }
    }

    const win = [0, 0, 0, 0];
    // Horizontal windows
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        win[0] = board[r][c]; win[1] = board[r][c + 1]; win[2] = board[r][c + 2]; win[3] = board[r][c + 3];
        score += this.scoreWindow(win, actor);
      }
    }
    // Vertical windows
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        win[0] = board[r][c]; win[1] = board[r + 1][c]; win[2] = board[r + 2][c]; win[3] = board[r + 3][c];
        score += this.scoreWindow(win, actor);
      }
    }
    // Diagonal /
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        win[0] = board[r][c]; win[1] = board[r + 1][c + 1]; win[2] = board[r + 2][c + 2]; win[3] = board[r + 3][c + 3];
        score += this.scoreWindow(win, actor);
      }
    }
    // Diagonal \
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        win[0] = board[r][c]; win[1] = board[r - 1][c + 1]; win[2] = board[r - 2][c + 2]; win[3] = board[r - 3][c + 3];
        score += this.scoreWindow(win, actor);
      }
    }
    return score;
  }

  hashBoard(board, actor) {
    let s = actor + ':';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = board[r][c];
        s += (v === VOID_CELL ? 'V' : v);
      }
    }
    return s;
  }

  negamax(board, depth, alpha, beta, actor, enchantGrid) {
    const opp = actor === AI ? PLAYER : AI;
    if (this.hasWinningLine(board, opp)) return -(90000 + depth * 100);
    if (this.isBoardFull(board)) return 0;
    if (depth <= 0) return this.evaluate(board, actor, enchantGrid);

    const key = this.hashBoard(board, actor);
    const cached = this.tt.get(key);
    if (cached && cached.depth >= depth) return cached.score;

    let best = -Infinity;
    for (let i = 0; i < COLS; i++) {
      const c = this.colOrder[i];
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;

      board[r][c] = actor;
      const val = -this.negamax(board, depth - 1, -beta, -alpha, opp, enchantGrid);
      board[r][c] = EMPTY;

      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }

    if (this.tt.size > 40000) this.tt.clear();
    this.tt.set(key, { depth, score: best });
    return best;
  }

  checkWinState(board, preferredWinner = PLAYER) {
    const pLine = this.findWinningLine(board, PLAYER);
    const aLine = this.findWinningLine(board, AI);
    if (pLine && aLine) {
      return preferredWinner === PLAYER
        ? { winner: PLAYER, line: pLine }
        : { winner: AI, line: aLine };
    }
    if (pLine) return { winner: PLAYER, line: pLine };
    if (aLine) return { winner: AI, line: aLine };
    return null;
  }

  analyzeBoard(board, maxDepth = 4, enchantGrid = null, applyDifficultyVariance = false, isBossFloor = false) {
    this.tt.clear();
    const colScores = Array(COLS).fill(null);
    let bestCol = -1;
    let bestScore = -Infinity;

    // 1. Check immediate AI 1-move win
    for (const c of this.colOrder) {
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;
      board[r][c] = AI;
      if (this.hasWinningLine(board, AI)) {
        colScores[c] = 95000;
        if (95000 > bestScore) { bestScore = 95000; bestCol = c; }
      }
      board[r][c] = EMPTY;
    }

    // 2. Check immediate 1-move Player win to block (using per-floor scaled missBlockRate)
    const diff = getActiveDifficulty();
    const curFloorIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 0;
    const missBlockArr = diff.missBlockByFloor || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const effMissBlock = missBlockArr[Math.min(curFloorIdx, missBlockArr.length - 1)] ?? diff.missBlockChance;
    const shouldBlockImmediate = !(applyDifficultyVariance && effMissBlock > 0 && !isBossFloor && Math.random() < effMissBlock);
    let forcedBlockCol = -1;
    if (shouldBlockImmediate && bestScore < 90000) {
      for (const c of this.colOrder) {
        const r = this.getAvailableRow(board, c);
        if (r === -1) continue;
        board[r][c] = PLAYER;
        if (this.hasWinningLine(board, PLAYER)) {
          forcedBlockCol = c;
          board[r][c] = EMPTY;
          break;
        }
        board[r][c] = EMPTY;
      }
    }

    // 3. Full negamax evaluation per column
    const rankedCols = [];
    for (const c of this.colOrder) {
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;
      if (colScores[c] === 95000) {
        rankedCols.push({ col: c, score: 95000 });
        continue;
      }

      let webPenalty = 0;
      if (enchantGrid && enchantGrid[r] && enchantGrid[r][c] === ENCHANT_TYPES.WEB) {
        webPenalty = -320;
      }

      board[r][c] = AI;
      const score = -this.negamax(board, maxDepth - 1, -Infinity, Infinity, PLAYER, enchantGrid) + webPenalty;
      board[r][c] = EMPTY;

      colScores[c] = score;
      rankedCols.push({ col: c, score });
      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }

    if (bestScore < 90000 && forcedBlockCol !== -1) {
      bestCol = forcedBlockCol;
    } else if (applyDifficultyVariance && bestScore < 50000 && rankedCols.length > 1) {
      rankedCols.sort((a, b) => b.score - a.score);
      const blunderArr = diff.blunderByFloor || [diff.blunderChance];
      const baseFloorBlunder = blunderArr[Math.min(curFloorIdx, blunderArr.length - 1)] ?? diff.blunderChance;
      const enrageMult = (isBossFloor && typeof state !== 'undefined' && state.bossMaxHp > 1 && state.bossHp === 1) ? 0.35 : 1.0;
      const blunderRate = (isBossFloor ? baseFloorBlunder * 0.5 : baseFloorBlunder) * enrageMult;
      if (blunderRate > 0 && Math.random() < blunderRate) {
        const altIdx = Math.min(rankedCols.length - 1, Math.random() < 0.78 ? 1 : 2);
        bestCol = rankedCols[altIdx].col;
        bestScore = rankedCols[altIdx].score;
      }
    }

    if (bestCol === -1) {
      for (let c = 0; c < COLS; c++) {
        if (this.getAvailableRow(board, c) !== -1) {
          bestCol = c;
          bestScore = 0;
          break;
        }
      }
    }

    return { bestCol, bestScore: bestScore === -Infinity ? 0 : bestScore, colScores };
  }
}

const aiEngine = new GrandmasterConnect4AI();

// ============================================================================
// OVERKILL & MULTI-TRAP COMBO REWARDS HOOK
// Automatically wraps handleFloorVictory & openUndergroundBazaar after load
// ============================================================================
(function attachOverkillAndMultiTrapSystem() {
  function playOverkillFanfare() {
    if (typeof sfx === 'undefined' || sfx.muted) return;
    sfx.playSteppedSequence([
      { freq: 587.33, dur: 0.045, gain: 0.14 }, // D5
      { freq: 739.99, dur: 0.045, gain: 0.14 }, // F#5
      { freq: 880.00, dur: 0.045, gain: 0.15 }, // A5
      { freq: 1174.66, dur: 0.055, gain: 0.16 }, // D6
      { freq: 1479.98, dur: 0.065, gain: 0.16 }, // F#6
      { freq: 1760.00, dur: 0.075, gain: 0.17 }, // A6
      { freq: 2349.32, dur: 0.280, gain: 0.18 }  // D7 Overkill Peak
    ], 'square', 0.17, 4200);
  }

  function bindVictoryHooks() {
    if (typeof window.handleFloorVictory !== 'function' || window.handleFloorVictory._overkillHooked) {
      return;
    }

    const origHandleFloorVictory = window.handleFloorVictory;

    window.handleFloorVictory = function (winLine) {
      const combo = aiEngine.analyzeWinningCombo(state.board, PLAYER);
      const fullWinCells = (combo && combo.allCells && combo.allCells.length > 0) ? combo.allCells : winLine;
      state.lastOverkillCombo = null;

      if (combo && (combo.isOverkill || combo.isMultiTrap)) {
        state.lastOverkillCombo = combo;

        // 1. Play 8-Bit Overkill Fanfare, Screen Shake & 3D Shockwaves on all combo cells
        playOverkillFanfare();
        if (typeof triggerBoardShake === 'function') triggerBoardShake(0.34);
        if (typeof triggerHaptic === 'function') triggerHaptic([45, 25, 70, 25, 90]);

        fullWinCells.forEach(([r, c], idx) => {
          setTimeout(() => {
            if (typeof spawn3DShockwaveRing === 'function') {
              spawn3DShockwaveRing(r, c, 0xfde047, 2.7, 520);
            }
            if (typeof spawn3DParticleBurst === 'function') {
              spawn3DParticleBurst(r, c, 0xf59e0b, 14, 0.13, 500, 'octa');
            }
          }, idx * 40);
        });

        // 2. Award Bonus Overkill Gold & Tactical Reserve Token
        state.gold += combo.bonusGold;
        if (combo.bonusReserveId && typeof RESERVE_CATALOG !== 'undefined' && RESERVE_CATALOG[combo.bonusReserveId]) {
          state.reservePouchUnlocked = true;
          state.reservePouch.push(combo.bonusReserveId);
        }

        // 3. Apply Crushing Blow Extra Boss HP Damage on Multi-HP Boss Floors
        let bossCrushText = '';
        if (typeof state.bossHp === 'number' && state.bossHp > 1 && combo.crushDamage > 1) {
          const extraDmg = Math.min(state.bossHp - 1, combo.crushDamage - 1);
          if (extraDmg > 0) {
            state.bossHp -= extraDmg;
            bossCrushText = ` • CRUSHING BLOW (-${extraDmg + 1} Boss HP!)`;
          }
        }

        if (typeof spawnFloatingPop === 'function') {
          spawnFloatingPop(
            `${combo.icon} ${combo.title}: +$${combo.bonusGold} Gold!`,
            'text-amber-200',
            5600
          );
        }
        if (typeof showToast === 'function') {
          showToast(
            `${combo.title}: ${combo.subtitle}${bossCrushText}`,
            combo.icon,
            6000,
            'border-yellow-400/85 text-yellow-100'
          );
        }
      }

      // Invoke original Floor Victory handler with all participating combo cells
      const result = origHandleFloorVictory.call(this, fullWinCells);

      // Include combo bonus in pendingVictoryPayout so Boss Chest -> Bazaar transition preserves it
      if (combo && (combo.isOverkill || combo.isMultiTrap) && state.pendingVictoryPayout) {
        state.pendingVictoryPayout.totalEarned += combo.bonusGold;
        state.pendingVictoryPayout.overkillBonus = combo.bonusGold;
      }

      return result;
    };
    window.handleFloorVictory._overkillHooked = true;

    // Wrap openUndergroundBazaar so the Victory Breakdown Pill shows the Overkill/Combo bonus
    if (typeof window.openUndergroundBazaar === 'function' && !window.openUndergroundBazaar._overkillHooked) {
      const origOpenBazaar = window.openUndergroundBazaar;
      window.openUndergroundBazaar = function (totalEarned, speedBonus) {
        const res = origOpenBazaar.call(this, totalEarned, speedBonus);
        const combo = state.lastOverkillCombo;
        if (combo && (combo.isOverkill || combo.isMultiTrap)) {
          const payoutEl = document.getElementById('bazaar-payout-amount');
          const floorData = typeof getFloorConfig === 'function' ? getFloorConfig(state.floorIdx) : { isBoss: false };
          const baseReward = floorData.isBoss ? 7 : 3;
          if (payoutEl) {
            payoutEl.textContent = `+$${totalEarned} ($${baseReward} Base + $${speedBonus} Speed + $${combo.bonusGold} Combo!)`;
          }
          state.lastOverkillCombo = null;
        }
        return res;
      };
      window.openUndergroundBazaar._overkillHooked = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindVictoryHooks);
  } else {
    bindVictoryHooks();
  }
  window.addEventListener('load', bindVictoryHooks);
})();
