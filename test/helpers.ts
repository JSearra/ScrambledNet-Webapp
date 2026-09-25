import { Board } from '../src/board';
import { Assets } from '../src/assets';
import { Skill } from '../src/types';

export function stubAssets(sounds: string[] = []): Assets {
    return { playSound: (name: string) => sounds.push(name), getImage: () => null } as unknown as Assets;
}

export function makeBoard(skill: Skill, w: number, h: number, sounds: string[] = []): Board {
    const board = new Board(stubAssets(sounds));
    board.init(w, h);
    board.setupBoard(skill, w, h);
    return board;
}

export function boardCells(board: Board) {
    return board.cellMatrix.flat();
}
