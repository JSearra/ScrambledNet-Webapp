import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { Cell, CellDirection } from '../src/cell';
import { makeBoard, boardCells } from './helpers';

function rotations(dirs: number) {
    const probe = new Cell(0, 0, null as never);
    probe.connectedDirs = dirs;
    const out = [dirs];
    for (let i = 1; i < 4; i++) {
        probe.connectedDirs = probe.rotatedDirs(90);
        out.push(probe.connectedDirs);
    }
    return out; // index = number of clockwise quarter turns
}

describe('scramble', () => {
    it('leaves no cell mid-rotation and the root connected', () => {
        for (let i = 0; i < 50; i++) {
            const board = makeBoard(SKILL.EXPERT, 8, 6);
            expect(boardCells(board).filter(c => c.isRotated())).toHaveLength(0);
            expect(board.rootCell!.isConnected).toBe(true);
        }
    });

    it('turns each cell to one of the 4 rotations of its solution, all 4 occurring', () => {
        const seen = [0, 0, 0, 0];
        for (let i = 0; i < 50; i++) {
            for (const c of boardCells(makeBoard(SKILL.NORMAL, 7, 5))) {
                if (c.solutionDirs === CellDirection.FREE) continue;
                const rots = rotations(c.solutionDirs);
                expect(rots).toContain(c.connectedDirs);
                // Terminals have 4 distinct rotations, so the turn count is unambiguous.
                if (c.numDirs() === 1) seen[rots.indexOf(c.connectedDirs)]++;
            }
        }
        for (const n of seen) expect(n).toBeGreaterThan(0);
    });
});
