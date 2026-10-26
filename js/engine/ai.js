// ============================================================================
// GRANDMASTER NEGAMAX AI ENGINE (ALPHA-BETA & TRANSPOSITION TABLE) (js/engine/ai.js)
// ============================================================================

// ============================================================================
// 3. GRANDMASTER NEGAMAX AI ENGINE WITH ALPHA-BETA & TRANSPOSITION TABLE
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

    findWinningLine(board, actor) {
        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (this.matchesActor(board[r][c], actor) &&
                    this.matchesActor(board[r][c + 1], actor) &&
                    this.matchesActor(board[r][c + 2], actor) &&
                    this.matchesActor(board[r][c + 3], actor)) {
                    return [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]];
                }
            }
        }
        // Vertical
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r <= ROWS - 4; r++) {
                if (this.matchesActor(board[r][c], actor) &&
                    this.matchesActor(board[r + 1][c], actor) &&
                    this.matchesActor(board[r + 2][c], actor) &&
                    this.matchesActor(board[r + 3][c], actor)) {
                    return [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]];
                }
            }
        }
        // Diagonal /
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (this.matchesActor(board[r][c], actor) &&
                    this.matchesActor(board[r + 1][c + 1], actor) &&
                    this.matchesActor(board[r + 2][c + 2], actor) &&
                    this.matchesActor(board[r + 3][c + 3], actor)) {
                    return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
                }
            }
        }
        // Diagonal \
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (this.matchesActor(board[r][c], actor) &&
                    this.matchesActor(board[r - 1][c + 1], actor) &&
                    this.matchesActor(board[r - 2][c + 2], actor) &&
                    this.matchesActor(board[r - 3][c + 3], actor)) {
                    return [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]];
                }
            }
        }
        return null;
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
        if (this.findWinningLine(board, opp)) return -(90000 + depth * 100);
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
            if (this.findWinningLine(board, AI)) {
                colScores[c] = 95000;
                if (95000 > bestScore) { bestScore = 95000; bestCol = c; }
            }
            board[r][c] = EMPTY;
        }

        // 2. Check immediate 1-move Player win to block (using per-floor scaled missBlockRate so AI sharpens every floor!)
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
                if (this.findWinningLine(board, PLAYER)) {
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
