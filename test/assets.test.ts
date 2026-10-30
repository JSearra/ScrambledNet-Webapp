import { describe, expect, it } from 'vitest';
import { Assets, BLUEPRINT } from '../src/assets';

describe('Blueprint board', () => {
    it('is used only in light mode with the Modern theme', () => {
        const assets = new Assets();
        expect(assets.blueprint).toBe(false);

        assets.setLightBoard(true);
        expect(assets.blueprint).toBe(true);

        assets.theme = 'retro';
        expect(assets.blueprint).toBe(false);
    });

    it('switches the board colours with it', () => {
        const assets = new Assets();
        expect(assets.boardBackground).toBe('#000');
        expect(assets.selectionColor).toBe('#00ffff');
        expect(assets.disconnectedAlpha).toBe(0.5);
        expect(assets.iconShadow).toBeNull();

        assets.setLightBoard(true);
        expect(assets.boardBackground).toBe(BLUEPRINT.background);
        expect(assets.selectionColor).toBe(BLUEPRINT.selection);
        expect(assets.disconnectedAlpha).toBeLessThan(0.5);
        expect(assets.iconShadow).toBe(BLUEPRINT.iconShadow);
    });
});
