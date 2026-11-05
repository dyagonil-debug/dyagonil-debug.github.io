// ============================================================================
// 3. GRANDMASTER NEGAMAX AI ENGINE WITH OVERKILL & CYLINDRICAL WRAP-AROUND (js/engine/ai.js)
// ============================================================================

class GrandmasterConnect4AI {
  constructor() {
    this.tt = new Map();
    this.colOrder = [3, 2, 4, 1, 5, 0, 6];
  }

  rebuildColOrder(cols = COLS) {
    if (cols === 12) {
      this.colOrder = [6, 5, 7, 4, 8, 3, 9, 2, 10, 1, 11, 0];
    } else if (cols === 7) {
      this.colOrder = [3, 2, 4, 1, 5, 0, 6];
    } else {
      const mid = Math.floor(cols / 2);
      const order = [mid];
      for (let offset = 1; offset <= cols; offset++) {
        if (mid - offset >= 0) order.push(mid - offset);
        if (mid + offset < cols) order.push(mid + offset);
      }
      this.colOrder = order;
    }
  }

  isCylindricalWrapActive(board = null) {
    if (typeof state !== 'undefined' && state && state.isCylinderPhase) return true;
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    return activeCols === 12;
  }

  getAvailableRow(board, col) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    if (col < 0 || col >= activeCols) return -1;
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
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    if (col < 0 || col >= activeCols) return -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const cell = board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) return r;
    }
    return -1;
  }

  getBottomOccupiedRow(board, col) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    if (col < 0 || col >= activeCols) return -1;
    for (let r = 0; r < ROWS; r++) {
      const cell = board[r][col];
      if (cell !== EMPTY && cell !== VOID_CELL) return r;
    }
    return -1;
  }

  isBoardFull(board) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    for (let c = 0; c < activeCols; c++) {
      if (this.getAvailableRow(board, c) !== -1) return false;
    }
    return true;
  }

  matchesActor(cell, actor) {
    if (cell === VOID_CELL) return false;
    return cell === actor || cell === WILD;
  }

  // Scans all 4 axes for contiguous runs of >= 4 tokens so 5/6/7-in-a-row
  // and simultaneous multi-line Connect-4s are captured for Overkill bonuses.
  // Supports seamless horizontal & diagonal left/right wrap-around in Phase 3 Cylinder mode!
  findAllWinningLines(board, actor) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    const wrap = this.isCylindricalWrapActive(board);
    const lines = [];

    if (!wrap) {
      const dirs = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal /
        [1, -1]  // Diagonal \
      ];

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < activeCols; c++) {
          if (!this.matchesActor(board[r][c], actor)) continue;

          for (const [dr, dc] of dirs) {
            const prevR = r - dr;
            const prevC = c - dc;
            if (
              prevR >= 0 && prevR < ROWS &&
              prevC >= 0 && prevC < activeCols &&
              this.matchesActor(board[prevR][prevC], actor)
            ) {
              continue;
            }

            const run = [[r, c]];
            let nr = r + dr;
            let nc = c + dc;
            while (
              nr >= 0 && nr < ROWS &&
              nc >= 0 && nc < activeCols &&
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

    // CYLINDRICAL WRAP-AROUND MODE (Left/Right Edgeless):
    // 1. Horizontal runs with wrap-around across (c + 1) % activeCols
    for (let r = 0; r < ROWS; r++) {
      let allRowMatch = true;
      for (let c = 0; c < activeCols; c++) {
        if (!this.matchesActor(board[r][c], actor)) {
          allRowMatch = false;
          break;
        }
      }
      if (allRowMatch) {
        lines.push(Array.from({ length: activeCols }, (_, c) => [r, c]));
        continue;
      }

      for (let c = 0; c < activeCols; c++) {
        if (!this.matchesActor(board[r][c], actor)) continue;
        const prevC = (c - 1 + activeCols) % activeCols;
        if (this.matchesActor(board[r][prevC], actor)) continue;

        const run = [[r, c]];
        let step = 1;
        while (step < activeCols) {
          const nc = (c + step) % activeCols;
          if (!this.matchesActor(board[r][nc], actor)) break;
          run.push([r, nc]);
          step++;
        }
        if (run.length >= 4) {
          lines.push(run);
        }
      }
    }

    // 2. Vertical runs (no vertical wrap) & Diagonal runs (with horizontal wrap-around)
    const nonHorizDirs = [
      [1, 0],  // Vertical
      [1, 1],  // Diagonal /
      [1, -1]  // Diagonal \
    ];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < activeCols; c++) {
        if (!this.matchesActor(board[r][c], actor)) continue;

        for (const [dr, dc] of nonHorizDirs) {
          const prevR = r - dr;
          const prevC = dc === 0 ? c : ((c - dc + activeCols) % activeCols);
          if (
            prevR >= 0 && prevR < ROWS &&
            this.matchesActor(board[prevR][prevC], actor)
          ) {
            continue;
          }

          const run = [[r, c]];
          let nr = r + dr;
          let nc = dc === 0 ? c : ((c + dc + activeCols) % activeCols);
          while (
            nr >= 0 && nr < ROWS &&
            this.matchesActor(board[nr][nc], actor)
          ) {
            run.push([nr, nc]);
            nr += dr;
            nc = dc === 0 ? nc : ((nc + dc + activeCols) % activeCols);
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
      line: allCells,
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

    const isEasy = diff && diff.id === 'EASY';
    if (myCount === 4) return 10000;
    if (myCount === 3 && emptyCount === 1) return isEasy ? 55 : 140;
    if (myCount === 2 && emptyCount === 2) return isEasy ? 10 : 24;
    if (oppCount === 3 && emptyCount === 1) return isEasy ? -50 : -165;
    if (oppCount === 2 && emptyCount === 2) return isEasy ? -8 : -28;
    return 0;
  }

  evaluate(board, actor, enchantGrid, diff = null) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    const wrap = this.isCylindricalWrapActive(board);
    const activeDiff = diff || (typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null);
    const centerScale = (activeDiff && typeof activeDiff.centerBiasScale === 'number')
      ? activeDiff.centerBiasScale
      : 1.0;
    const ignoreEnchants = !!(activeDiff && activeDiff.ignoreEnchantSlots);

    let score = 0;

    // On planar 7-col boards, reward center column (Col 4) control;
    // on the 12-col edgeless cylinder, all columns are radially symmetric.
    if (!wrap && activeCols >= 4) {
      const centerCol = Math.floor(activeCols / 2);
      for (let r = 0; r < ROWS; r++) {
        if (board[r][centerCol] === actor) score += Math.round(18 * centerScale);
        else if (board[r][centerCol] !== EMPTY && board[r][centerCol] !== STONE && board[r][centerCol] !== VOID_CELL) {
          score -= Math.round(14 * centerScale);
        }
      }
    }

    if (enchantGrid && !ignoreEnchants && typeof ENCHANT_TYPES !== 'undefined') {
      for (let c = 0; c < activeCols; c++) {
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
    const maxStartCol = wrap ? (activeCols - 1) : (activeCols - 4);

    // Horizontal windows
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= maxStartCol; c++) {
        win[0] = board[r][c];
        win[1] = board[r][(c + 1) % activeCols];
        win[2] = board[r][(c + 2) % activeCols];
        win[3] = board[r][(c + 3) % activeCols];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Vertical windows
    for (let c = 0; c < activeCols; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        win[0] = board[r][c];
        win[1] = board[r + 1][c];
        win[2] = board[r + 2][c];
        win[3] = board[r + 3][c];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Diagonal /
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= maxStartCol; c++) {
        win[0] = board[r][c];
        win[1] = board[r + 1][(c + 1) % activeCols];
        win[2] = board[r + 2][(c + 2) % activeCols];
        win[3] = board[r + 3][(c + 3) % activeCols];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    // Diagonal \
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= maxStartCol; c++) {
        win[0] = board[r][c];
        win[1] = board[r - 1][(c + 1) % activeCols];
        win[2] = board[r - 2][(c + 2) % activeCols];
        win[3] = board[r - 3][(c + 3) % activeCols];
        score += this.scoreWindow(win, actor, activeDiff);
      }
    }
    return score;
  }

  hashBoard(board, actor) {
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    let s = actor + ':';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < activeCols; c++) {
        const v = board[r][c];
        s += (v === VOID_CELL ? 'V' : v);
      }
    }
    return s;
  }

  negamax(board, depth, alpha, beta, actor, enchantGrid, diff = null, moveOrder = null) {
    const opp = actor === AI ? PLAYER : AI;
    if (this.findWinningLine(board, opp)) return -(90000 + depth * 100);
    if (this.isBoardFull(board)) return 0;
    if (depth <= 0) return this.evaluate(board, actor, enchantGrid, diff);

    const key = this.hashBoard(board, actor);
    const cached = this.tt.get(key);
    if (cached && cached.depth >= depth) return cached.score;

    const order = moveOrder || this.colOrder;
    let best = -Infinity;
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      const r = this.getAvailableRow(board, c);
      if (r === -1) continue;

      board[r][c] = actor;
      const val = -this.negamax(board, depth - 1, -beta, -alpha, opp, enchantGrid, diff, order);
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
    const activeCols = (board && board[0]) ? board[0].length : COLS;
    if (!this.colOrder || this.colOrder.length !== activeCols) {
      this.rebuildColOrder(activeCols);
    }

    // On the 12-column cylinder, order columns adjacent to existing tokens first for fast alpha-beta pruning
    // and cap recursive search depth so 12-branch search stays responsive (<80ms)
    let activeOrder = this.colOrder;
    let effSearchDepth = maxDepth;
    if (activeCols > 7) {
      effSearchDepth = Math.min(maxDepth, 5);
      const colActivity = new Array(activeCols).fill(0);
      for (let c = 0; c < activeCols; c++) {
        for (let d = -2; d <= 2; d++) {
          const nc = (c + d + activeCols) % activeCols;
          for (let r = 0; r < ROWS; r++) {
            const cell = board[r][nc];
            if (cell === PLAYER || cell === AI || cell === WILD) {
              colActivity[c] += (d === 0 ? 3 : 2);
            }
          }
        }
      }
      activeOrder = [...this.colOrder].sort((a, b) => colActivity[b] - colActivity[a]);
    }

    const colScores = Array(activeCols).fill(null);
    let bestCol = -1;
    let bestScore = -Infinity;

    const diff = typeof getActiveDifficulty === 'function' ? getActiveDifficulty() : null;
    const curFloorIdx = (typeof state !== 'undefined' && typeof state.floorIdx === 'number') ? state.floorIdx : 0;
    const floorCfg = typeof getFloorConfig === 'function' ? getFloorConfig(curFloorIdx) : null;

    // 1. Check immediate AI 1-move wins
    const missWinRate = (applyDifficultyVariance && floorCfg && typeof floorCfg.floorMissWinRate === 'number')
      ? floorCfg.floorMissWinRate
      : ((applyDifficultyVariance && diff && typeof diff.missWinRate === 'number') ? diff.missWinRate : 0);
    const ignoreImmediateWin = missWinRate > 0 && Math.random() < missWinRate;
    const aiWinningCols = [];

    for (const c of activeOrder) {
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

    // 2. Check immediate 1-move Player threats to block
    const bossBlockPenalty = (floorCfg && typeof floorCfg.floorMissBlockRate === 'number')
      ? floorCfg.floorMissBlockRate
      : 0;
    const didMissBlock = applyDifficultyVariance && bossBlockPenalty > 0 && Math.random() < bossBlockPenalty;

    const playerWinningCols = [];
    for (const c of activeOrder) {
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
    const effEvalNoise = (floorCfg && typeof floorCfg.floorEvalNoise === 'number')
      ? floorCfg.floorEvalNoise
      : (diff ? (diff.evalNoiseRange || 0) : 0);
    const rankedCols = [];
    for (const c of activeOrder) {
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
        Math.max(0, effSearchDepth - 1),
        -Infinity,
        Infinity,
        PLAYER,
        enchantGrid,
        applyDifficultyVariance ? diff : null,
        activeOrder
      ) + webPenalty;
      board[r][c] = EMPTY;

      if (applyDifficultyVariance && effEvalNoise > 0) {
        score += Math.round((Math.random() * 2 - 1) * effEvalNoise);
      }

      colScores[c] = score;
      rankedCols.push({ col: c, score });
      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }

    // 4. Resolve move selection with true missed blocks & floor-scaled blunders
    if (bestScore < 90000 && forcedBlockCol !== -1) {
      bestCol = forcedBlockCol;
    } else if (applyDifficultyVariance && didMissBlock && playerWinningCols.length > 0) {
      const nonBlocking = rankedCols.filter((item) => !playerWinningCols.includes(item.col));
      if (nonBlocking.length > 0) {
        const pick = nonBlocking[Math.floor(Math.random() * nonBlocking.length)];
        bestCol = pick.col;
        bestScore = pick.score;
      }
    } else if (applyDifficultyVariance && bestScore < 50000 && rankedCols.length > 1) {
      let poolCols = rankedCols;
      if (ignoreImmediateWin && aiWinningCols.length > 0) {
        const nonWinning = rankedCols.filter((item) => !aiWinningCols.includes(item.col));
        if (nonWinning.length > 0) poolCols = nonWinning;
      }

      poolCols.sort((a, b) => b.score - a.score);
      bestCol = poolCols[0].col;
      bestScore = poolCols[0].score;

      const isEasy = diff && diff.id === 'EASY';
      const blunderRate = (floorCfg && typeof floorCfg.floorBlunderRate === 'number')
        ? floorCfg.floorBlunderRate
        : 0;

      if (blunderRate > 0 && Math.random() < blunderRate && poolCols.length > 1) {
        if (isEasy) {
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
      for (let c = 0; c < activeCols; c++) {
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
