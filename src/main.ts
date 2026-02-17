import '../style.scss';
import emptyBg from '../assets/empty.png';
import { Game } from './game.js';
import { SKILL } from './constants.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const game = new Game(canvas);
    // window.game = game; // Not strictly needed, but helpful for debugging

    // UI Elements
    const startScreen = document.getElementById('start-screen')!;
    const gameScreen = document.getElementById('game-screen')!;
    const uiOverlay = document.getElementById('ui-overlay')!;

    // Buttons
    const backBtn = document.getElementById('back-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    // In-Game Menu Controls
    const ingameMenuScreen = document.getElementById('ingame-menu-screen')!;
    const resumeBtn = document.getElementById('ingame-resume-btn')!;
    const quitBtn = document.getElementById('ingame-quit-btn')!;
    const ingameSoundToggle = document.getElementById('ingame-setting-sound') as HTMLInputElement;
    const ingameThemeSelect = document.getElementById('ingame-setting-theme') as HTMLSelectElement;

    // Helper to switch screens
    function showScreen(screen: HTMLElement) {
        startScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        screen.classList.remove('hidden');
    }

    // Start Game Logic
    function startGame(skill: any) {
        showScreen(gameScreen);
        uiOverlay.classList.add('hidden'); // Ensure overlay is hidden
        game.start(skill);
        // Ensure resize happens after layout change
        setTimeout(() => {
            game.resize();
            alignUI();
        }, 50);
    }

    // Stop Game Logic
    function stopGame() {
        game.stop();
        showScreen(startScreen);
    }

    // Difficulty Buttons
    document.getElementById('skill-novice')!.addEventListener('click', () => startGame(SKILL.NOVICE));
    document.getElementById('skill-normal')!.addEventListener('click', () => startGame(SKILL.NORMAL));
    document.getElementById('skill-expert')!.addEventListener('click', () => startGame(SKILL.EXPERT));
    document.getElementById('skill-master')!.addEventListener('click', () => startGame(SKILL.MASTER));
    document.getElementById('skill-insane')!.addEventListener('click', () => startGame(SKILL.INSANE));

    // Game Controls (The "Menu" button during gameplay)
    backBtn!.addEventListener('click', () => {
        // Show in-game menu instead of quitting immediately
        ingameMenuScreen.classList.remove('hidden');
    });

    // Win Screen Controls
    playAgainBtn!.addEventListener('click', () => {
        uiOverlay.classList.add('hidden');
        game.start(game.currentSkill);
    });

    // In-Game Menu Controls
    // In-Game Menu Controls (moved up)

    menuBtn!.addEventListener('click', () => {
        // Show in-game menu instead of quitting immediately
        ingameMenuScreen.classList.remove('hidden');

        // Sync In-Game UI with current state
        ingameSoundToggle.checked = !game.assets.muted;
        ingameThemeSelect.value = game.assets.theme;
    });

    resumeBtn.addEventListener('click', () => {
        ingameMenuScreen.classList.add('hidden');
    });

    // In-Game Settings Listeners
    ingameSoundToggle.addEventListener('change', (e: Event) => {
        game.assets.muted = !(e.target as HTMLInputElement).checked;
        saveSettings();
    });

    ingameThemeSelect.addEventListener('change', (e: Event) => {
        const newTheme = (e.target as HTMLSelectElement).value;
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

    quitBtn.addEventListener('click', () => {
        ingameMenuScreen.classList.add('hidden');
        uiOverlay.classList.add('hidden'); // Also hide the win overlay if it was open (though menu button usually available during gameplay)
        stopGame();
    });

    // Instructions Modal
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsScreen = document.getElementById('instructions-screen')!;
    const instructionsBackBtn = document.getElementById('instructions-back-btn');

    instructionsBtn!.addEventListener('click', () => {
        instructionsScreen.classList.remove('hidden');
    });

    instructionsBackBtn!.addEventListener('click', () => {
        instructionsScreen.classList.add('hidden');
    });

    // Settings Modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsScreen = document.getElementById('settings-screen')!;
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const soundToggle = document.getElementById('setting-sound') as HTMLInputElement;
    const themeSelect = document.getElementById('setting-theme') as HTMLSelectElement;

    settingsBtn!.addEventListener('click', () => {
        settingsScreen.classList.remove('hidden');
        // Sync UI with current state
        soundToggle.checked = !game.assets.muted;
        themeSelect.value = game.assets.theme;
    });

    settingsCloseBtn!.addEventListener('click', () => {
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
    soundToggle.addEventListener('change', (e: Event) => {
        game.assets.muted = !(e.target as HTMLInputElement).checked;
        saveSettings();
    });

    themeSelect.addEventListener('change', (e: Event) => {
        const newTheme = (e.target as HTMLSelectElement).value;
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

    function updateThemeVisuals(theme: string) {
        const gameContainer = document.getElementById('game-container')!;
        if (theme === 'retro') {
            gameContainer.style.backgroundImage = `url('${emptyBg}')`;
            gameContainer.style.backgroundSize = "auto"; // Default tiling size (image size)
        } else {
            // Revert to CSS default or specific modern background
            gameContainer.style.backgroundImage = '';
            gameContainer.style.backgroundSize = '';
        }
    }

    function alignUI() {
        if (window.innerWidth > 600 && game.board) {
            const boardLeft = game.board.paddingX + (game.board.boardStartX * game.board.cellWidth);
            // Add a small buffer or align exactly? The request says "in line with the left border".
            // backBtn is in #bottom-bar which is full width.
            backBtn!.style.marginLeft = `${boardLeft}px`;
        } else {
            backBtn!.style.marginLeft = '';
        }
    }

    window.addEventListener('resize', () => {
        if (!gameScreen.classList.contains('hidden')) {
            game.resize();
            alignUI();
        }
    });

    // Initialize
    loadSettings();
    showScreen(startScreen);
});
