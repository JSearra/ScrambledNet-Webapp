import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { CellDirection } from '../src/cell';
import { makeBoard, boardCells } from './helpers';

describe('blind cells', () => {
    it('hides cells with 3+ connections on Insane only', () => {
        let blind = 0;
        for (let i = 0; i < 20; i++) {
            for (const c of boardCells(makeBoard(SKILL.INSANE, 10, 7))) {
                expect(c.isBlind).toBe(c.numDirs() >= 3);
                if (c.isBlind) blind++;
            }
            for (const c of boardCells(makeBoard(SKILL.MASTER, 10, 7))) expect(c.isBlind).toBe(false);
        }
        expect(blind).toBeGreaterThan(0);
    });

    it('reveals every cell once the puzzle is solved', () => {
        const board = makeBoard(SKILL.INSANE, 10, 7);
        const cells = boardCells(board);
        for (const c of cells) c.connectedDirs = c.solutionDirs;
        // Leave one terminal a quarter turn short and let the player finish it.
        const last = cells.find(c => c.numDirs() === 1 && !c.isRoot)!;
        last.connectedDirs = last.rotatedDirs(-90);
        board.updateConnections();
        expect(board.isSolved()).toBe(false);

        last.rotate(90, 250);
        expect(board.update(last.rotateStart + 1000)).toBe('WIN');
        expect(cells.filter(c => c.isBlind)).toHaveLength(0);
        expect(last.connectedDirs).not.toBe(CellDirection.FREE);
    });
});
