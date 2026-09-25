import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { CellDirection } from '../src/cell';
import { makeBoard, boardCells } from './helpers';

function setup() {
    const board = makeBoard(SKILL.NORMAL, 7, 5);
    board.setSize(700, 500);
    const cables = boardCells(board).filter(c => c.numDirs() > 0);
    return { board, a: cables[0], b: cables[1] };
}

describe('rotateCell', () => {
    it('rotates a cable cell and counts a move', () => {
        const { board, a } = setup();
        expect(board.rotateCell(a)).toBe(true);
        expect(a.isRotated()).toBe(true);
        expect(board.moves).toBe(1);
    });

    it('refuses free, empty and locked cells', () => {
        const { board, a } = setup();
        a.isLocked = true;
        expect(board.rotateCell(a)).toBe(false);
        a.isLocked = false;
        for (const dirs of [CellDirection.FREE, CellDirection.NONE]) {
            a.connectedDirs = dirs;
            expect(board.rotateCell(a)).toBe(false);
        }
        expect(board.moves).toBe(0);
    });

    it('counts repeat taps on the same cell as one move', () => {
        const { board, a, b } = setup();
        board.rotateCell(a);
        board.rotateCell(a);
        board.rotateCell(a);
        expect(board.moves).toBe(1);
        board.rotateCell(b);
        board.rotateCell(a);
        expect(board.moves).toBe(3);
    });

    it('resets moves on a new board', () => {
        const { board, a } = setup();
        board.rotateCell(a);
        board.setupBoard(SKILL.NORMAL, 7, 5);
        expect(board.moves).toBe(0);
    });

    it('routes pixel and grid input through the same rules', () => {
        const { board, a } = setup();
        a.isLocked = true;
        expect(board.handleInput(a.cellLeft + 1, a.cellTop + 1)).toBe(false);
        expect(board.rotateCellAt(a.xindex, a.yindex)).toBe(false);
        a.isLocked = false;
        expect(board.handleInput(a.cellLeft + 1, a.cellTop + 1)).toBe(true);
        expect(board.rotateCellAt(a.xindex, a.yindex)).toBe(true);
        expect(board.moves).toBe(1);
        expect(board.handleInput(-5, -5)).toBe(false);
    });
});
