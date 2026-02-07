export const CONSTANTS = {
    CELL_MIN: 40,
    CELL_MAX: 128,
    ANIMATION_DELAY: 20,
    SOLVE_STEP_TIME: 100,
    SOLVE_ROTATE_TIME: 250,
    HIGHLIGHT_TIME: 500,
    ROTATE_DFLT_TIME: 250,
};

export const SKILL = {
    NOVICE: { label: 'Novice', branches: 2, wrapped: false, blind: 9 },
    NORMAL: { label: 'Normal', branches: 2, wrapped: false, blind: 9 },
    EXPERT: { label: 'Expert', branches: 2, wrapped: false, blind: 9 },
    MASTER: { label: 'Master', branches: 3, wrapped: true, blind: 9 },
    INSANE: { label: 'Insane', branches: 3, wrapped: true, blind: 3 }
};

export const SCREEN_SIZES = {
    // Width/Height for different skill levels
    HUGE: {
        major: 17, minor: 10, // Master/Insane
        expert_major: 15, expert_minor: 8,
        normal_major: 11, normal_minor: 8,
        novice_major: 10, novice_minor: 8
    }
};

export function getBoardSize(skillName, gridWidth, gridHeight) {
    let major, minor;
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
