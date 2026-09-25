import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { Board } from '../src/board';
import { makeBoard, boardCells } from './helpers';

// Drive the board with a simulated clock until it reports a win (or we give up).
function run(board: Board, start: number, maxMs = 60000) {
    for (let t = start; t < start + maxMs; t += 20) {
        if (board.update(t) === 'WIN') return t;
    }
    return null;
}

function unsolvedBoard(skill = SKILL.EXPERT) {
    for (;;) {
        const board = makeBoard(skill, 8, 6);
        if (!board.isSolved()) return board;
    }
}

describe('auto-solve', () => {
    it('solves a scrambled board without counting moves', () => {
        for (const skill of [SKILL.NOVICE, SKILL.MASTER, SKILL.INSANE]) {
            const board = unsolvedBoard(skill);
            board.startSolve(0);
            expect(board.isSolving()).toBe(true);
            expect(run(board, 0)).not.toBeNull();
            expect(board.moves).toBe(0);
            expect(board.solverUsed).toBe(true);
            expect(board.isSolving()).toBe(false);
            expect(boardCells(board).filter(c => c.isBlind)).toHaveLength(0);
        }
    });

    it('unlocks locked cells and copes with a rotation already in flight', () => {
        const board = unsolvedBoard();
        const cells = boardCells(board).filter(c => c.numDirs() > 0);
        const wrong = cells.filter(c => c.connectedDirs !== c.solutionDirs);
        for (const c of wrong.slice(1, 4)) c.isLocked = true;
        wrong[0].rotate(90, 250, 0);
        board.startSolve(0);
        expect(run(board, 0)).not.toBeNull();
        expect(cells.every(c => c.isConnected)).toBe(true);
        expect(wrong.slice(1, 4).some(c => c.isLocked)).toBe(false);
    });

    it('ignores player input while solving and can be stopped', () => {
        const board = unsolvedBoard();
        const cable = boardCells(board).find(c => c.numDirs() > 0)!;
        board.startSolve(0);
        expect(board.rotateCell(cable)).toBe(false);
        expect(board.toggleLock(cable)).toBe(false);
        board.stopSolve();
        expect(board.isSolving()).toBe(false);
        expect(board.solvingCell).toBeNull();
        expect(board.rotateCell(cable)).toBe(true);
    });

    it('resets the solver flag on a new board', () => {
        const board = unsolvedBoard();
        board.startSolve(0);
        board.setupBoard(SKILL.EXPERT, 8, 6);
        expect(board.isSolving()).toBe(false);
        expect(board.solverUsed).toBe(false);
    });
});
