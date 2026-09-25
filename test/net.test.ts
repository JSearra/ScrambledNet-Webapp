import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { CARDINALS, CellDirection, REVERSE_DIRS } from '../src/cell';
import { Board } from '../src/board';
import { makeBoard, boardCells } from './helpers';

const RUNS = 200;

function bitCount(dirs: number) {
    let n = 0;
    for (const d of CARDINALS) if ((dirs & d) === d) n++;
    return n;
}

function netCells(board: Board) {
    return boardCells(board).filter(c =>
        c.solutionDirs !== CellDirection.FREE && c.solutionDirs !== CellDirection.NONE);
}

describe('createNet', () => {
    it('never creates 4-way crosses when branches = 2', () => {
        for (const skill of [SKILL.NOVICE, SKILL.NORMAL, SKILL.EXPERT]) {
            for (let i = 0; i < RUNS; i++) {
                const board = makeBoard(skill, 8, 6);
                for (const c of netCells(board)) expect(bitCount(c.solutionDirs)).toBeLessThanOrEqual(3);
            }
        }
    });

    it('allows 4-way crosses when branches = 3', () => {
        let crosses = 0;
        for (let i = 0; i < RUNS; i++) {
            crosses += netCells(makeBoard(SKILL.MASTER, 10, 7))
                .filter(c => c.solutionDirs === CellDirection.URDL).length;
        }
        expect(crosses).toBeGreaterThan(0);
    });

    it('builds a single tree reachable from the root, with matching links', () => {
        for (const skill of [SKILL.NORMAL, SKILL.MASTER]) {
            for (let i = 0; i < RUNS; i++) {
                const board = makeBoard(skill, 8, 6);
                const cells = netCells(board);
                let links = 0;
                for (const c of cells) {
                    for (const d of CARDINALS) {
                        if ((c.solutionDirs & d) !== d) continue;
                        const other = c.next(d)!;
                        expect(other).not.toBeNull();
                        expect(other.solutionDirs & REVERSE_DIRS[d]).toBe(REVERSE_DIRS[d]);
                        links++;
                    }
                }
                const seen = new Set([board.rootCell!]);
                const queue = [board.rootCell!];
                while (queue.length) {
                    const c = queue.shift()!;
                    for (const d of CARDINALS) {
                        const other = c.next(d);
                        if ((c.solutionDirs & d) === d && other && !seen.has(other)) {
                            seen.add(other);
                            queue.push(other);
                        }
                    }
                }
                expect(seen.size).toBe(cells.length);
                expect(links / 2).toBe(cells.length - 1);
            }
        }
    });

    it('usually fills at least 85% of the board', () => {
        let good = 0;
        for (let i = 0; i < RUNS; i++) {
            const board = makeBoard(SKILL.NORMAL, 7, 5);
            if (netCells(board).length >= 0.85 * 35) good++;
        }
        expect(good / RUNS).toBeGreaterThan(0.95);
    });

    it('leaves some cells empty, like the original', () => {
        let empty = 0;
        for (let i = 0; i < RUNS; i++) empty += 35 - netCells(makeBoard(SKILL.NORMAL, 7, 5)).length;
        expect(empty).toBeGreaterThan(0);
    });
});
