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

// --- Appearance ---
// "system" follows the device's dark mode setting; "light" and "dark" override it.
// The colours themselves are in style.scss, keyed on data-appearance.
const APPEARANCES = ['system', 'light', 'dark'];
let appearancePreference = 'system';
const prefersLight = window.matchMedia('(prefers-color-scheme: light)');

// Set once the game exists: switches the board between its dark and light colours
let onAppearanceChange = () => {};

function isLight() {
    return appearancePreference === 'light' || (appearancePreference === 'system' && prefersLight.matches);
}

function applyAppearance() {
    const root = document.documentElement;
    if (appearancePreference === 'system') {
        delete root.dataset.appearance;
    } else {
        root.dataset.appearance = appearancePreference;
    }
    // Browser chrome (address bar, PWA title bar) matches the page background
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight() ? '#e9edf1' : '#222222');
    onAppearanceChange();
}

prefersLight.addEventListener('change', applyAppearance);

// Translate and colour right away (the DOM is parsed when this module runs) so
// English or the wrong colours don't flash up while the game's images are still loading.
try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof stored.language === 'string') languagePreference = stored.language;
    if (APPEARANCES.includes(stored.appearance)) appearancePreference = stored.appearance;
} catch {
    // No or unreadable saved settings: follow the device language and dark mode setting
}
applyLanguagePreference();
applyAppearance();

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
    const skillChip = document.getElementById('skill-chip')!;

    // Buttons
    const backBtn = document.getElementById('back-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');

    // In-Game Menu Controls
    const ingameMenuScreen = document.getElementById('ingame-menu-screen')!;
    const resumeBtn = document.getElementById('ingame-resume-btn')!;
    const quitBtn = document.getElementById('ingame-quit-btn')!;
    const solveBtn = document.getElementById('ingame-solve-btn')!;

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
        // data-i18n so the chip follows a language change
        skillChip.dataset.i18n = `skill.${skill.label.toLowerCase()}`;
        skillChip.textContent = t(skillChip.dataset.i18n);
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

    // Light mode with the Modern theme uses the Blueprint board
    function updateBoardStyle() {
        game.assets.setLightBoard(isLight());
        document.documentElement.toggleAttribute('data-blueprint', game.assets.blueprint);
        if (!gameScreen.classList.contains('hidden')) {
            game.draw();
        }
    }
    onAppearanceChange = updateBoardStyle;

    // --- Settings (the Settings screen and the in-game menu share these) ---
    function setTheme(newTheme: string) {
        if (newTheme === game.assets.theme) return;
        game.assets.setTheme(newTheme).then(() => {
            updateBoardStyle();
            updateThemeVisuals(newTheme);
            saveSettings(); // Save after successful theme set
            console.log('Theme switched to', newTheme);
        });
    }

    /** Wire up one panel's controls; returns a function that shows the current settings in it. */
    function bindSettingsPanel(prefix: string) {
        const sound = document.getElementById(`${prefix}-sound`) as HTMLInputElement;
        const themes = document.querySelectorAll<HTMLInputElement>(`input[name="${prefix}-theme"]`);
        const appearances = document.querySelectorAll<HTMLInputElement>(`input[name="${prefix}-appearance"]`);

        sound.addEventListener('change', () => {
            game.assets.muted = !sound.checked;
            saveSettings();
        });
        themes.forEach(input => input.addEventListener('change', () => {
            if (input.checked) setTheme(input.value);
        }));
        appearances.forEach(input => input.addEventListener('change', () => {
            if (!input.checked) return;
            appearancePreference = input.value;
            applyAppearance();
            saveSettings();
        }));

        return () => {
            sound.checked = !game.assets.muted;
            themes.forEach(input => input.checked = input.value === game.assets.theme);
            appearances.forEach(input => input.checked = input.value === appearancePreference);
        };
    }

    const syncIngameSettings = bindSettingsPanel('ingame-setting');
    const syncSettings = bindSettingsPanel('setting');

    // Game Controls (The "Menu" button during gameplay)
    // Show in-game menu instead of quitting immediately
    function openIngameMenu() {
        ingameMenuScreen.classList.remove('hidden');

        // Sync In-Game UI with current state
        solveBtn.classList.toggle('hidden', !game.running);
        solveBtn.querySelector('.label')!.textContent = game.board.isSolving() ? t('pause.stopSolving') : t('pause.solve');
        syncIngameSettings();
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

    quitBtn.addEventListener('click', () => {
        ingameMenuScreen.classList.add('hidden');
        uiOverlay.classList.add('hidden'); // Also hide the win overlay if it was open (though menu button usually available during gameplay)
        stopGame();
    });

    // Instructions Modal
    const instructionsBtn = document.getElementById('instructions-btn');
    const instructionsScreen = document.getElementById('instructions-screen')!;
    const instructionsCloseBtn = document.getElementById('instructions-close-btn');

    instructionsBtn!.addEventListener('click', () => {
        instructionsScreen.classList.remove('hidden');
    });

    instructionsCloseBtn!.addEventListener('click', () => {
        instructionsScreen.classList.add('hidden');
    });

    // Settings Modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsScreen = document.getElementById('settings-screen')!;
    const settingsCloseBtn = document.getElementById('settings-close-btn');

    settingsBtn!.addEventListener('click', () => {
        settingsScreen.classList.remove('hidden');
        syncSettings();
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
            button.className = option.code === AUTO_LANGUAGE ? 'menu-btn language-auto' : 'menu-btn';
            // The language in use is the one cyan button, with a tick
            button.classList.toggle('primary', selected);
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
            button.lang = option.lang;
            button.dir = 'auto'; // Each name in its own script direction
            if (selected) {
                button.insertAdjacentHTML('beforeend',
                    '<svg class="tick" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 6.5l2.6 2.6L10 3.5"/></svg>');
            }
            const name = document.createElement('span');
            name.className = 'label';
            name.textContent = option.name;
            button.append(name);
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
            language: languagePreference,
            appearance: appearancePreference
        };
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }

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
    updateBoardStyle();
    showScreen(startScreen);
});
