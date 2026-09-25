import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { CellDirection } from '../src/cell';
import { makeBoard, boardCells } from './helpers';

function setup() {
    const sounds: string[] = [];
    const board = makeBoard(SKILL.NORMAL, 7, 5, sounds);
    sounds.length = 0;
    return { board, sounds, cells: boardCells(board) };
}

describe('sounds', () => {
    it('turns, clicks on refusal, pops on lock', () => {
        const { board, sounds, cells } = setup();
        const cable = cells.find(c => c.numDirs() > 0)!;
        board.rotateCell(cable);
        board.toggleLock(cable);
        board.rotateCell(cable);
        cable.connectedDirs = CellDirection.FREE;
        board.toggleLock(cable);
        expect(sounds).toEqual(['turn.ogg', 'pop.wav', 'click.ogg', 'click.ogg']);
    });

    it('plays connect when a finished rotation joins new cells, win instead when solved', () => {
        const { board, sounds, cells } = setup();
        for (const c of cells) c.connectedDirs = c.solutionDirs;
        // Break one link next to the root: a terminal hanging off a solved cable.
        const term = cells.find(c => c.numDirs() === 1 && !c.isRoot)!;
        const other = cells.find(c => c.numDirs() === 1 && !c.isRoot && c !== term)!;
        term.connectedDirs = term.rotatedDirs(-90);
        other.connectedDirs = other.rotatedDirs(-90);
        board.updateConnections();

        term.rotate(90, 250);
        expect(board.update(term.rotateStart + 300)).toBeNull();
        expect(sounds).toEqual(['connect.ogg']);

        other.rotate(90, 250);
        expect(board.update(other.rotateStart + 300)).toBe('WIN');
        expect(sounds).toEqual(['connect.ogg']); // Game plays win.ogg on WIN
    });

});
