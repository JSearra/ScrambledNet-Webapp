import { Game } from './game.js';
import { SKILL } from './constants.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // Initial Start
    game.start(SKILL.NORMAL);

    // UI Controls
    document.getElementById('restart-btn').addEventListener('click', () => {
        document.getElementById('ui-overlay').classList.add('hidden');
        game.start(game.currentSkill);
    });

    document.getElementById('skill-novice').addEventListener('click', () => game.start(SKILL.NOVICE));
    document.getElementById('skill-normal').addEventListener('click', () => game.start(SKILL.NORMAL));
    document.getElementById('skill-expert').addEventListener('click', () => game.start(SKILL.EXPERT));
    document.getElementById('skill-master').addEventListener('click', () => game.start(SKILL.MASTER));
    document.getElementById('skill-insane').addEventListener('click', () => game.start(SKILL.INSANE));

    window.addEventListener('resize', () => {
        game.resize();
    });
});
