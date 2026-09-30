import '../style.scss';
import emptyBg from '../assets/empty.png';
import { Game } from './game.js';
import { SKILL } from './constants.js';
import { registerSW } from 'virtual:pwa-register';
import { Skill } from './types.js';
import {
    AUTO_LANGUAGE, DEFAULT_LANGUAGE, availableLanguages, detectLanguage, getLanguage,
    locales, resolveLanguage, setLanguage, t,
} from './i18n.js';

const SETTINGS_KEY = 'scrambledNetSettings';

// --- Language ---
// "auto" follows the device language; anything else is a language the player picked.
let languagePreference = AUTO_LANGUAGE;

function deviceLanguages(): readonly string[] {
    return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function updateLanguageButton() {
    document.getElementById('language-current')!.textContent = t('language.name');
}

function applyLanguagePreference() {
    setLanguage(resolveLanguage(languagePreference, deviceLanguages()));
    updateLanguageButton();
}

// Translate right away (the DOM is parsed when this module runs) so English
// doesn't flash up while the game's images are still loading.
try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof stored.language === 'string') languagePreference = stored.language;
} catch {
    // No or unreadable saved settings: follow the device language
}
applyLanguagePreference();

// PWA Install Prompt Handler
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.classList.remove('hidden');
  }
});

// Register PWA Service Worker
registerSW({
  onNeedRefresh() {},
  onOfflineReady() {},
});

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
    const solveBtn = document.getElementById('ingame-solve-btn')!;
    const ingameSoundToggle = document.getElementById('ingame-setting-sound') as HTMLInputElement;
    const ingameThemeSelect = document.getElementById('ingame-setting-theme') as HTMLSelectElement;

    // Helper to switch screens
    function showScreen(screen: HTMLElement) {
        startScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        screen.classList.remove('hidden');
    }

    // Start Game Logic
    function startGame(skill: Skill) {
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
    // Show in-game menu instead of quitting immediately
    function openIngameMenu() {
        ingameMenuScreen.classList.remove('hidden');

        // Sync In-Game UI with current state
        solveBtn.classList.toggle('hidden', !game.running);
        solveBtn.innerText = game.board.isSolving() ? t('pause.stopSolving') : t('pause.solve');
        ingameSoundToggle.checked = !game.assets.muted;
        ingameThemeSelect.value = game.assets.theme;
    }

    backBtn!.addEventListener('click', openIngameMenu);

    // Win Screen Controls
    playAgainBtn!.addEventListener('click', () => {
        uiOverlay.classList.add('hidden');
        if (game.currentSkill) {
            game.start(game.currentSkill);
        }
    });

    menuBtn!.addEventListener('click', () => {
        uiOverlay.classList.add('hidden');
        stopGame();
    });

    // In-Game Menu Controls

    resumeBtn.addEventListener('click', () => {
        ingameMenuScreen.classList.add('hidden');
    });

    solveBtn.addEventListener('click', () => {
        ingameMenuScreen.classList.add('hidden');
        game.toggleSolve();
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

    // Language Modal
    const languageBtn = document.getElementById('language-btn')!;
    const languageScreen = document.getElementById('language-screen')!;
    const languageList = document.getElementById('language-list')!;
    const languageCloseBtn = document.getElementById('language-close-btn')!;

    function renderLanguageList() {
        const deviceLanguage = detectLanguage(deviceLanguages()) ?? DEFAULT_LANGUAGE;
        const options = [
            {
                code: AUTO_LANGUAGE,
                name: `${t('language.auto')} (${locales[deviceLanguage]['language.name']})`,
                lang: getLanguage(),
            },
            ...availableLanguages().map(({ code, name }) => ({ code, name, lang: code })),
        ];

        languageList.replaceChildren(...options.map(option => {
            const button = document.createElement('button');
            const selected = option.code === languagePreference;
            button.type = 'button';
            button.className = option.code === AUTO_LANGUAGE ? 'language-option language-auto' : 'language-option';
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
            button.lang = option.lang;
            button.dir = 'auto'; // Each name in its own script direction
            button.textContent = option.name;
            button.addEventListener('click', () => {
                languagePreference = option.code;
                applyLanguagePreference();
                saveSettings();
                languageScreen.classList.add('hidden');
            });
            return button;
        }));
    }

    languageBtn.addEventListener('click', () => {
        renderLanguageList();
        languageScreen.classList.remove('hidden');
        languageList.querySelector<HTMLElement>('.selected')?.scrollIntoView({ block: 'nearest' });
    });

    languageCloseBtn.addEventListener('click', () => {
        languageScreen.classList.add('hidden');
    });

    // PWA Install Button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });
    }

    // --- Settings Persistence ---
    function loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
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
            muted: game.assets.muted,
            language: languagePreference
        };
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
