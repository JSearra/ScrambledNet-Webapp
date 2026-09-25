import { describe, it, expect } from 'vitest';
import { Cell, CellDirection } from '../src/cell';

describe('Cell.doUpdate', () => {
    it('does not turn backwards when the frame time is before the rotation start', () => {
        const cell = new Cell(0, 0, null as never);
        cell.connectedDirs = CellDirection.U___;
        cell.rotate(90, 250);
        expect(cell.doUpdate(cell.rotateStart - 8)).toBe(false);
        expect(cell.rotateAngle).toBe(0);
    });

    it('completes a quarter turn after the rotation time', () => {
        const cell = new Cell(0, 0, null as never);
        cell.connectedDirs = CellDirection.U___;
        cell.rotate(90, 250);
        expect(cell.doUpdate(cell.rotateStart + 260)).toBe(true);
        expect(cell.connectedDirs).toBe(CellDirection._R__);
        expect(cell.isRotated()).toBe(false);
    });
});
