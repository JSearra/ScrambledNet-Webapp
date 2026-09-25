import { describe, it, expect } from 'vitest';
import { SKILL } from '../src/constants';
import { makeBoard, boardCells } from './helpers';

describe('Board setup', () => {
    it('creates a board with a root cell', () => {
        const board = makeBoard(SKILL.NORMAL, 7, 5);
        expect(board.rootCell).not.toBeNull();
        expect(boardCells(board)).toHaveLength(35);
    });
});
