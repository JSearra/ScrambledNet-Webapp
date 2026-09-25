import { describe, it, expect } from 'vitest';
import { SKILL, CONSTANTS } from '../src/constants';
import { Cell } from '../src/cell';
import { Board } from '../src/board';
import { makeBoard, boardCells } from './helpers';

function solvedBoard() {
    const board = makeBoard(SKILL.EXPERT, 8, 6);
    for (const c of boardCells(board)) c.connectedDirs = c.solutionDirs;
    board.updateConnections();
    return board;
}

// Advance blips for n steps and return every cell that received a blip.
function runBlips(board: Board, steps: number) {
    const reached = new Set<Cell>();
    for (let i = 1; i <= steps; i++) {
        board.update(i * CONSTANTS.BLIPS_TIME);
        for (const c of boardCells(board)) if (c.blipsIncoming !== 0) reached.add(c);
    }
    return reached;
}

describe('data blips', () => {
    it('spread from the server to every cell of a connected network', () => {
        const board = solvedBoard();
        const net = boardCells(board).filter(c => c.numDirs() > 0 && !c.isRoot);
        const reached = runBlips(board, 2 * net.length + 12);
        for (const c of net) expect(reached.has(c)).toBe(true);
        expect(reached.has(board.rootCell!)).toBe(false);
    });

    it('only leave the server every 6th step', () => {
        const board = solvedBoard();
        const emitted: number[] = [];
        for (let i = 1; i <= 13; i++) {
            board.update(i * CONSTANTS.BLIPS_TIME);
            if (board.rootCell!.blipsOutgoing !== 0) emitted.push(i);
        }
        expect(emitted).toEqual([1, 7, 13]);
    });

    it('stop at a cable that is turned the wrong way', () => {
        const board = solvedBoard();
        const cut = boardCells(board).find(c => c.numDirs() === 1 && !c.isRoot)!;
        cut.connectedDirs = cut.rotatedDirs(90);
        board.updateConnections();
        const reached = runBlips(board, 200);
        expect(reached.has(cut)).toBe(false);
        expect(reached.size).toBeGreaterThan(0);
    });

    it('are dropped when a cell starts rotating', () => {
        const cell = new Cell(0, 0, null as never);
        cell.blipsIncoming = 1;
        cell.blipsOutgoing = 2;
        cell.rotate(90, 250);
        expect(cell.blipsIncoming).toBe(0);
        expect(cell.blipsOutgoing).toBe(0);
    });
});
