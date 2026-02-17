import { Skill } from './types.js';

export const CONSTANTS = {
    CELL_MIN: 40,
    CELL_MAX: 128,
    ANIMATION_DELAY: 20,
    SOLVE_STEP_TIME: 100,
    SOLVE_ROTATE_TIME: 250,
    HIGHLIGHT_TIME: 500,
    ROTATE_DFLT_TIME: 250,
};

export const SKILL: Record<string, Skill> = {
    NOVICE: { label: 'Novice', branches: 2, wrapped: false, blind: 9 },
    NORMAL: { label: 'Normal', branches: 2, wrapped: false, blind: 9 },
    EXPERT: { label: 'Expert', branches: 2, wrapped: false, blind: 9 },
    MASTER: { label: 'Master', branches: 3, wrapped: true, blind: 9 },
    INSANE: { label: 'Insane', branches: 3, wrapped: true, blind: 3 }
};

export const SCREEN_SIZES = {
    // Width/Height for different skill levels
    HUGE: {
        major: 10, minor: 7, // Master/Insane (was 15x9)
        expert_major: 8, expert_minor: 6, // Expert (was 12x8)
        normal_major: 7, normal_minor: 5, // Normal (was 8x6)
        novice_major: 5, novice_minor: 5
    }
};

export function getBoardSize(skillName: string, gridWidth: number, gridHeight: number) {
    let major: number, minor: number;
    if (skillName === 'NOVICE') { major = SCREEN_SIZES.HUGE.novice_major; minor = SCREEN_SIZES.HUGE.novice_minor; }
    else if (skillName === 'NORMAL') { major = SCREEN_SIZES.HUGE.normal_major; minor = SCREEN_SIZES.HUGE.normal_minor; }
    else if (skillName === 'EXPERT') { major = SCREEN_SIZES.HUGE.expert_major; minor = SCREEN_SIZES.HUGE.expert_minor; }
    else { major = SCREEN_SIZES.HUGE.major; minor = SCREEN_SIZES.HUGE.minor; } // Master/Insane

    if (gridWidth > gridHeight) {
        return { width: major, height: minor };
    } else {
        return { width: minor, height: major };
    }
}
