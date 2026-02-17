import '../style.scss';
import emptyBg from '../assets/empty.png';
import { Game } from './game.js';
import { SKILL } from './constants.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    // window.game = game; // Not strictly needed, but helpful for debugging

    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const uiOverlay = document.getElementById('ui-overlay');

    // Buttons
    const backBtn = document.getElementById('back-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');

    // Helper to switch screens
    function showScreen(screen) {
        startScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        screen.classList.remove('hidden');
    }

    // Start Game Logic
    function startGame(skill) {
        showScreen(gameScreen);
        uiOverlay.classList.add('hidden'); // Ensure overlay is hidden
        game.start(skill);
        // Ensure resize happens after layout change
        setTimeout(() => game.resize(), 50);
    }

    // Stop Game Logic
    function stopGame() {
        game.stop();
        showScreen(startScreen);
    }

    // Difficulty Buttons
    document.getElementById('skill-novice').addEventListener('click', () => startGame(SKILL.NOVICE));
    document.getElementById('skill-normal').addEventListener('click', () => startGame(SKILL.NORMAL));
    document.getElementById('skill-expert').addEventListener('click', () => startGame(SKILL.EXPERT));
    document.getElementById('skill-master').addEventListener('click', () => startGame(SKILL.MASTER));
    document.getElementById('skill-insane').addEventListener('click', () => startGame(SKILL.INSANE));

    // Game Controls
    backBtn.addEventListener('click', () => {
        stopGame();
    });

    // Win Screen Controls
    playAgainBtn.addEventListener('click', () => {
        uiOverlay.classList.add('hidden');
        game.start(game.currentSkill);
    });

    menuBtn.addEventListener('click', () => {
        uiOverlay.classList.add('hidden');
        stopGame();
    });

    // Instructions Modal
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsScreen = document.getElementById('instructions-screen');
    const instructionsBackBtn = document.getElementById('instructions-back-btn');

    instructionsBtn.addEventListener('click', () => {
        instructionsScreen.classList.remove('hidden');
    });

    instructionsBackBtn.addEventListener('click', () => {
        instructionsScreen.classList.add('hidden');
    });

    // Settings Modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsScreen = document.getElementById('settings-screen');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const soundToggle = document.getElementById('setting-sound');
    const themeSelect = document.getElementById('setting-theme');

    settingsBtn.addEventListener('click', () => {
        settingsScreen.classList.remove('hidden');
        // Sync UI with current state
        soundToggle.checked = !game.assets.muted;
        themeSelect.value = game.assets.theme;
    });

    settingsCloseBtn.addEventListener('click', () => {
        settingsScreen.classList.add('hidden');
    });

    // --- Settings Persistence ---
    function loadSettings() {
        try {
            const stored = localStorage.getItem('scrambledNetSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.theme) {
                    game.assets.setTheme(settings.theme);
                    updateThemeVisuals(settings.theme);
                }
                if (typeof settings.muted !== 'undefined') {
                    game.assets.muted = settings.muted;
                }
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    function saveSettings() {
        const settings = {
            theme: game.assets.theme,
            muted: game.assets.muted
        };
        try {
            localStorage.setItem('scrambledNetSettings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }

    // Initialize
    loadSettings();
    showScreen(startScreen);

    // --- Event Listeners Update ---
    soundToggle.addEventListener('change', (e) => {
        game.assets.muted = !e.target.checked;
        saveSettings();
    });

    themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        if (newTheme !== game.assets.theme) {
            game.assets.setTheme(newTheme).then(() => {
                if (!gameScreen.classList.contains('hidden')) {
                    game.draw();
                }
                updateThemeVisuals(newTheme);
                saveSettings(); // Save after successful theme set
                console.log('Theme switched to', newTheme);
            });
        }
    });

    function updateThemeVisuals(theme) {
        const gameContainer = document.getElementById('game-container');
        if (theme === 'retro') {
            gameContainer.style.backgroundImage = `url('${emptyBg}')`;
            gameContainer.style.backgroundSize = "auto"; // Default tiling size (image size)
        } else {
            // Revert to CSS default or specific modern background
            gameContainer.style.backgroundImage = '';
            gameContainer.style.backgroundSize = '';
        }
    }

    window.addEventListener('resize', () => {
        if (!gameScreen.classList.contains('hidden')) {
            game.resize();
        }
    });

    // Initialize
    loadSettings();
    showScreen(startScreen);
});
