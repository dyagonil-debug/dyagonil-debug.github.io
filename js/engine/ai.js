// ============================================================================
// 3. GRANDMASTER NEGAMAX AI ENGINE WITH OVERKILL CHECKER (js/engine/ai.js)
// ============================================================================

class GrandmasterConnect4AI {
  constructor() {
    this.tt = new Map();
    this.colOrder = [3, 2, 4, 1, 5, 0, 6];
  }

  getAvailableRow(board, col) {
    if (col < 0 || col >= COLS) return -1;
    const gravFlipped = typeof state !== 'undefined' && state && state.gravityFlippedTurns > 0;
    if (gravFlipped) {
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === VOID_CELL) continue;
        if (board[r][col] === EMPTY) return r;
      }
      return -1;
    }
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

  // Scans all 4 axes for contiguous runs of >= 4 tokens so 5/6/7-in-a-row
  // and simultaneous multi-line Connect-4s are captured for Overkill bonuses
  findAllWinningLines(board, actor) {
    const dirs = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal /
      [1, -1]  // Diagonal \
    ];
    const lines = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!this.matchesActor(board[r][c], actor)) continue;

        for (const [dr, dc] of dirs) {
          // Only start a run if the preceding cell along this axis is NOT a match
          // (prevents counting a 5-in-a-row as two separate 4-in-a-row sub-segments)
          const prevR = r - dr;
          const prevC = c - dc;
          if (
            prevR >= 0 && prevR < ROWS &&
            prevC >= 0 && prevC < COLS &&
            this.matchesActor(board[prevR][prevC], actor)
          ) {
            continue;
          }

          const run = [[r, c]];
          let nr = r + dr;
          let nc = c + dc;
          while (
            nr >= 0 && nr < ROWS &&
            nc >= 0 && nc < COLS &&
            this.matchesActor(board[nr][nc], actor)
          ) {
            run.push([nr, nc]);
            nr += dr;
            nc += dc;
          }

          if (run.length >= 4) {
            lines.push(run);
          }
        }
      }
    }

    return lines;
  }

  // Full Overkill & Multi-Line Combo Analyzer
  analyzeWinningCombo(board, actor) {
    const lines = this.findAllWinningLines(board, actor);
    if (lines.length === 0) {
      return {
        won: false,
        isOverkill: false,
        line: null,
        lines: [],
        allCells: [],
        lineCount: 0,
        maxLen: 0,
        totalCells: 0,
        extraTokens: 0,
        extraLines: 0,
        overkillCount: 0,
        bonusGold: 0,
        label: ''
      };
    }

    const cellMap = new Map();
    let maxLen = 0;
    let extraTokens = 0;

    lines.forEach((run) => {
      if (run.length > maxLen) maxLen = run.length;
      if (run.length > 4) extraTokens += (run.length - 4);
      run.forEach(([r, c]) => {
        cellMap.set(`${r},${c}`, [r, c]);
      });
    });

    const allCells = Array.from(cellMap.values());
    const extraLines = Math.max(0, lines.length - 1);
    const isOverkill = maxLen > 4 || lines.length > 1 || allCells.length > 4;
    const overkillCount = extraTokens + extraLines * 2;
    const bonusGold = isOverkill ? Math.max(2, extraTokens * 2 + extraLines * 3) : 0;

    let label = 'Connect 4!';
    if (lines.length > 1 && maxLen > 4) {
      label = `OVERKILL! ${lines.length}x Lines (${maxLen}-in-a-Row)!`;
    } else if (lines.length > 1) {
      label = `OVERKILL! ${lines.length}x Simultaneous Connect-4s!`;
    } else if (maxLen > 4) {
      label = `OVERKILL! ${maxLen}-in-a-Row Combo!`;
    }

    return {
      won: true,
      isOverkill,
      line: allCells, // Highlights every cell across all connected winning lines
      primaryLine: lines[0],
      lines,
      allCells,
      lineCount: lines.length,
      maxLen,
      totalCells: allCells.length,
      extraTokens,
      extraLines,
      overkillCount,
      bonusGold,
      label
    };
  }

  hasWinningLine(board, actor) {
    return this.findWinningLine(board, actor) !== null;
  }

  findWinningLine(board, actor) {
    const lines = this.findAllWinningLines(board, actor);
    if (lines.length === 0) return null;
    if (lines.length === 1) return lines[0];

    // If multiple lines or 5+ Overkill occurred simultaneously, return all unique winning cells
    const seen = new Set();
    const merged = [];
    for (const run of lines) {
      for (const [r, c] of run) {
        const key = `${r},${c}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push([r, c]);
        }
      }
    }
    return merged;
  }

  checkWinState(board, preferredWinner = PLAYER) {
    const pCombo = this.analyzeWinningCombo(board, PLAYER);
    const aCombo = this.analyzeWinningCombo(board, AI);

    if (pCombo.won && aCombo.won) {
      return preferredWinner === PLAYER
        ? { winner: PLAYER, line: pCombo.line, combo: pCombo }
        : { winner: AI, line: aCombo.line, combo: aCombo };
    }
    if (pCombo.won) return { winner: PLAYER, line: pCombo.line, combo: pCombo };
    if (aCombo.won) return { winner: AI, line: aCombo.line, combo: aCombo };
    return null;
  }

  scoreWindow(w, actor, diff = null) {
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

    // On Easy mode, soften 2-in-a-row and 3-in-a-row heuristic weights so AI doesn't suffocate setups
    const isEasy = diff && diff.id === 'EASY';
    if (myCount === 4) return 10000;
    if (myCount === 3 && emptyCount === 1) return isEasy ? 55 : 140;
    if (myCount === 2 && emptyCount === 2) return isEasy ? 10 : 24;
    if (oppCount === 3 && emptyCount === 1) return isEasy ? -50 : -165;
    if (oppCount === 2 && emptyCount === 2) return isEasy ? -8 : -28;
    return 0;
  }

  evaluate(board, actor, enchantGrid, diff = null) {
    const activeDiff = diff || (typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null);
    const centerScale = (activeDiff && typeof activeDiff.centerBiasScale === 'number')
      ? activeDiff.centerBiasScale
      : 1.0;
    const ignoreEnchants = !!(activeDiff && activeDiff.ignoreEnchantSlots);

    let score = 0;

    // Center column control preference (scaled down on Easy mode so AI leaves Col 4 open)
    for (let r = 0; r < ROWS; r++) {
      if (board[r][3] === actor) score += Math.round(18 * centerScale);
      else if (board[r][3] !== EMPTY && board[r][3] !== STONE && board[r][3] !== VOID_CELL) {
        score -= Math.round(14 * centerScale);
      }
    }

    // Enchantment awareness (disabled on Easy mode so AI leaves Gold/Amplifier slots for the player)
    if (enchantGrid && !ignoreEnchants && typeof ENCHANT_TYPES !== 'undefined') {
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
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Vertical windows
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        win[0] = board[r][c]; win[1] = board[r + 1][c]; win[2] = board[r + 2][c]; win[3] = board[r + 3][c];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Diagonal /
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        win[0] = board[r][c]; win[1] = board[r + 1][c + 1]; win[2] = board[r + 2][c + 2]; win[3] = board[r + 3][c + 3];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Diagonal \
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        win[0] = board[r][c]; win[1] = board[r - 1][c + 1]; win[2] = board[r - 2][c + 2]; win[3] = board[r - 3][c + 3];
        score += this.scoreWindow(win, actor, activeDiff);
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

  negamax(board, depth, alpha, beta, actor, enchantGrid, diff = null) {
    const opp = actor === AI ? PLAYER : AI;
    if (this.findWinningLine(board, opp)) return -(90000 + depth * 100);
    if (this.isBoardFull(board)) return 0;
    if (depth <= 0) return this.evaluate(board, actor, enchantGrid, diff);

    const key = this.hashBoard(board, actor);
    const cached = this.tt.get(key);
    if (cached && cached.depth >= depth) return cached.score;

    let best = -Infinity;
    for (let i = 0; i < COLS; i++) {
      const c = this.colOrder[i];
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;

      board[r][c] = actor;
      const val = -this.negamax(board, depth - 1, -beta, -alpha, opp, enchantGrid, diff);
      board[r][c] = EMPTY;

      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }

    if (this.tt.size > 40000) this.tt.clear();
    this.tt.set(key, { depth, score: best });
    return best;
  }

  analyzeBoard(board, maxDepth = 4, enchantGrid = null, applyDifficultyVariance = false, isBossFloor = false) {
    this.tt.clear();
    const colScores = Array(COLS).fill(null);
    let bestCol = -1;
    let bestScore = -Infinity;

    const diff = typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null;
    const curFloorIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 0;

    // 1. Check immediate AI 1-move wins (gated by missWinRate on Easy mode)
    const missWinRate = (applyDifficultyVariance && diff && typeof diff.missWinRate === 'number')
      ? diff.missWinRate
      : 0;
    const ignoreImmediateWin = missWinRate > 0 && Math.random() < missWinRate;
    const aiWinningCols = [];

    for (const c of this.colOrder) {
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;
      board[r][c] = AI;
      if (this.findWinningLine(board, AI)) {
        aiWinningCols.push(c);
        if (!ignoreImmediateWin) {
          colScores[c] = 95000;
          if (95000 > bestScore) {
            bestScore = 95000;
            bestCol = c;
          }
        }
      }
      board[r][c] = EMPTY;
    }

    // 2. Check immediate 1-move Player threats to block (now allowed on ALL Easy floors, including Bosses!)
    const missBlockArr = (diff && diff.missBlockByFloor) || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const effMissBlock = missBlockArr[Math.min(curFloorIdx, missBlockArr.length - 1)] ?? (diff ? diff.missBlockChance : 0);
    const bossBlockPenalty = (isBossFloor && diff && diff.id !== 'EASY') ? 0 : effMissBlock;
    const didMissBlock = applyDifficultyVariance && bossBlockPenalty > 0 && Math.random() < bossBlockPenalty;

    const playerWinningCols = [];
    for (const c of this.colOrder) {
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;
      board[r][c] = PLAYER;
      if (this.findWinningLine(board, PLAYER)) {
        playerWinningCols.push(c);
      }
      board[r][c] = EMPTY;
    }

    let forcedBlockCol = -1;
    if (!didMissBlock && bestScore < 90000 && playerWinningCols.length > 0) {
      forcedBlockCol = playerWinningCols[0];
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
        webPenalty = (diff && diff.id === 'EASY') ? -40 : -320;
      }

      board[r][c] = AI;
      let score = -this.negamax(
        board,
        Math.max(0, maxDepth - 1),
        -Infinity,
        Infinity,
        PLAYER,
        enchantGrid,
        applyDifficultyVariance ? diff : null
      ) + webPenalty;
      board[r][c] = EMPTY;

      // Add heuristic evaluation jitter on Easy/Medium so the AI doesn't play robotically
      if (applyDifficultyVariance && diff && diff.evalNoiseRange > 0) {
        score += Math.round((Math.random() * 2 - 1) * diff.evalNoiseRange);
      }

      colScores[c] = score;
      rankedCols.push({ col: c, score });
      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }

    // 4. Resolve move selection with true missed blocks & softer blunders
    if (bestScore < 90000 && forcedBlockCol !== -1) {
      bestCol = forcedBlockCol;
    } else if (applyDifficultyVariance && didMissBlock && playerWinningCols.length > 0) {
      // CRITICAL FIX: When Easy AI rolls to miss a block, Negamax would otherwise still score the
      // non-blocking columns at -90000 and pick the block anyway. Pick a non-blocking column here!
      const nonBlocking = rankedCols.filter((item) => !playerWinningCols.includes(item.col));
      if (nonBlocking.length > 0) {
        const pick = nonBlocking[Math.floor(Math.random() * nonBlocking.length)];
        bestCol = pick.col;
        bestScore = pick.score;
      }
    } else if (applyDifficultyVariance && bestScore < 50000 && rankedCols.length > 1) {
      // Filter out ignored AI winning columns if missWinRate triggered
      let poolCols = rankedCols;
      if (ignoreImmediateWin && aiWinningCols.length > 0) {
        const nonWinning = rankedCols.filter((item) => !aiWinningCols.includes(item.col));
        if (nonWinning.length > 0) poolCols = nonWinning;
      }

      poolCols.sort((a, b) => b.score - a.score);
      bestCol = poolCols[0].col;
      bestScore = poolCols[0].score;

      const blunderArr = (diff && diff.blunderByFloor) || [diff ? diff.blunderChance : 0];
      const baseFloorBlunder = blunderArr[Math.min(curFloorIdx, blunderArr.length - 1)] ?? (diff ? diff.blunderChance : 0);
      const isEasy = diff && diff.id === 'EASY';
      const enrageMult = (!isEasy && isBossFloor && typeof state !== 'undefined' && state.bossMaxHp > 1 && state.bossHp === 1) ? 0.35 : 1.0;
      const blunderRate = (isBossFloor && !isEasy ? baseFloorBlunder * 0.5 : baseFloorBlunder) * enrageMult;

      if (blunderRate > 0 && Math.random() < blunderRate && poolCols.length > 1) {
        if (isEasy) {
          // On Easy, pick from any of the softer playable columns (not just #2)
          const subOptimal = poolCols.slice(1);
          const pick = subOptimal[Math.floor(Math.random() * subOptimal.length)];
          bestCol = pick.col;
          bestScore = pick.score;
        } else {
          const altIdx = Math.min(poolCols.length - 1, Math.random() < 0.78 ? 1 : 2);
          bestCol = poolCols[altIdx].col;
          bestScore = poolCols[altIdx].score;
        }
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

if (typeof window !== 'undefined') {
  Object.assign(window, {
    GrandmasterConnect4AI,
    aiEngine
  });
}
