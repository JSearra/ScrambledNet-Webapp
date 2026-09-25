import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { CellDirection } from '../src/cell';
import { makeBoard, boardCells } from './helpers';

describe('toggleLock', () => {
    it('locks and unlocks cable cells, blocking rotation while locked', () => {
        const board = makeBoard(SKILL.NORMAL, 7, 5);
        const cell = boardCells(board).find(c => c.numDirs() > 0)!;
        expect(board.toggleLock(cell)).toBe(true);
        expect(cell.isLocked).toBe(true);
        expect(board.rotateCell(cell)).toBe(false);
        expect(board.toggleLock(cell)).toBe(true);
        expect(cell.isLocked).toBe(false);
        expect(board.rotateCell(cell)).toBe(true);
    });

    it('ignores free and empty cells', () => {
        const board = makeBoard(SKILL.NORMAL, 7, 5);
        const cell = boardCells(board)[0];
        for (const dirs of [CellDirection.FREE, CellDirection.NONE]) {
            cell.connectedDirs = dirs;
            expect(board.toggleLock(cell)).toBe(false);
            expect(cell.isLocked).toBe(false);
        }
    });

    it('locks by grid position for the keyboard', () => {
        const board = makeBoard(SKILL.NORMAL, 7, 5);
        const cell = boardCells(board).find(c => c.numDirs() > 0)!;
        expect(board.toggleLockAt(cell.xindex, cell.yindex)).toBe(true);
        expect(cell.isLocked).toBe(true);
        expect(board.toggleLockAt(-1, 0)).toBe(false);
    });
});
