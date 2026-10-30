import { BLIP_SPRITES } from './cell';
// Use Vite's glob import to get all assets with their hashed URLs
const assetFiles = import.meta.glob('../assets/**/*', { eager: true, query: '?url', import: 'default' });

// Light-mode colours for the Modern board ("Blueprint"): pale blue tiles on a
// blue grid with navy cables. Tiles are drawn as plain squares and the white
// cable images are tinted, so no extra artwork is needed.
export const BLUEPRINT = {
    background: '#cfdeea',
    line: '#c4d6e4',
    cable: '#1d3b5a',
    iconShadow: 'rgba(20, 45, 80, 0.3)',
    selection: '#0a7f8e',
};

const BLUEPRINT_TILES: Record<string, string> = {
    'background.png': '#e6f0f7',
    'background_locked.png': '#c9dbe9',
    'empty.png': '#d7e5f0',
    'nothing.png': BLUEPRINT.background,
};

export class Assets {
    images: { [key: string]: HTMLImageElement };
    sounds: { [key: string]: HTMLAudioElement };
    toLoad: number;
    loaded: number;
    muted: boolean;
    theme: string;
    lightBoard: boolean;
    private blueprintImages: Map<string, HTMLCanvasElement>;

    constructor() {
        this.images = {};
        this.sounds = {};
        this.toLoad = 0;
        this.loaded = 0;
        this.muted = false;
        this.theme = 'modern'; // Default theme
        this.lightBoard = false;
        this.blueprintImages = new Map();
    }

    setTheme(theme: string) {
        this.theme = theme;
        // Reload all images with the new theme path
        this.loaded = 0;
        this.toLoad = 0;
        this.blueprintImages.clear();
        return this.loadAll();
    }

    /** Light mode: the Modern board switches to the Blueprint colours. */
    setLightBoard(on: boolean) {
        this.lightBoard = on;
    }

    get blueprint(): boolean {
        return this.lightBoard && this.theme === 'modern';
    }

    get boardBackground(): string {
        return this.blueprint ? BLUEPRINT.background : '#000';
    }

    get selectionColor(): string {
        return this.blueprint ? BLUEPRINT.selection : '#00ffff';
    }

    /** Opacity of cables that aren't connected to the server yet. */
    get disconnectedAlpha(): number {
        return this.blueprint ? 0.35 : 0.5;
    }

    /** Shadow behind the server and terminals, so their white frames show on light tiles. */
    get iconShadow(): string | null {
        return this.blueprint ? BLUEPRINT.iconShadow : null;
    }

    getAssetUrl(path: string) {
        // Resolve the asset path using the glob results
        // path is relative to the project root, e.g., 'assets/images/foo.png'
        // assetFiles keys are relative to this file, e.g., '../assets/images/foo.png'
        const key = `../${path}`;
        const url = assetFiles[key];
        if (!url) {
            console.error(`Asset not found: ${path} (key: ${key})`);
            return path; // Fallback to original path, though it likely won't work if hashed
        }
        return url;
    }

    loadImage(name: string, basePath = this.theme === 'modern' ? 'assets/images/' : 'assets/') {
        this.toLoad++;
        const img = new Image();
        const path = `${basePath}${name}`;
        img.src = this.getAssetUrl(path) as string;

        img.onload = () => {
            this.loaded++;
            // console.log('Loaded', name);
        };
        img.onerror = (e: string | Event) => {
            console.error('Failed to load image', name, e);
            this.loaded++;
        };
        this.images[name] = img;
    }

    loadSound(name: string) {
        this.toLoad++;
        const path = `assets/audio/${name}`;
        const snd = new Audio(this.getAssetUrl(path) as string);

        snd.onloadeddata = () => {
            this.loaded++;
        };
        snd.onerror = (e: string | Event) => {
            console.error('Failed to load sound', name, e);
            this.loaded++;
        };
        this.sounds[name] = snd;
    }

    loadAll(): Promise<void> {
        // Both themes have the same file names
        const imageFiles = [
            'background.png', 'background_locked.png', 'empty.png', 'nothing.png',
            'server.png', 'computer1.png', 'computer2.png',
            'cable0001.png', 'cable0010.png', 'cable0011.png', 'cable0100.png',
            'cable0101.png', 'cable0110.png', 'cable0111.png', 'cable1000.png',
            'cable1001.png', 'cable1010.png', 'cable1011.png', 'cable1100.png',
            'cable1101.png', 'cable1110.png', 'cable1111.png'
        ];


        if (this.theme === 'retro') {
            this.loadImage('game_background.png');
            this.loadImage('splash_bg.jpg');
        } else {

        }



        imageFiles.forEach(f => this.loadImage(f));
        // Data blip sprites only exist in the modern set; both themes use them
        BLIP_SPRITES.forEach(f => this.loadImage(f, 'assets/images/'));


        if (Object.keys(this.sounds).length === 0) {
            const soundFiles = [
                'start.ogg', 'click.ogg', 'turn.ogg', 'connect.ogg', 'pop.wav', 'win.ogg'
            ];
            soundFiles.forEach(f => this.loadSound(f));
        }

        return new Promise<void>(resolve => {
            const start = Date.now();
            const check = () => {
                if (this.toLoad > 0 && this.loaded >= this.toLoad) {
                    resolve();
                } else if (Date.now() - start > 3000) {
                    console.warn('Asset loading timed out, forcing start');
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }

    getImage(name: string): CanvasImageSource | undefined {
        const img = this.images[name];
        if (!this.blueprint || !img) return img;
        return this.blueprintImage(name, img) ?? img;
    }

    // Blueprint versions of the tile backgrounds and cables, made once and cached
    private blueprintImage(name: string, img: HTMLImageElement): HTMLCanvasElement | null {
        const cached = this.blueprintImages.get(name);
        if (cached) return cached;

        const tile = BLUEPRINT_TILES[name];
        if (!tile && !name.startsWith('cable')) return null;
        if (!tile && !(img.complete && img.naturalWidth)) return null; // Not loaded yet

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        if (tile) {
            // A square with a 1px grid line on each edge
            canvas.width = canvas.height = 128;
            ctx.fillStyle = name === 'nothing.png' ? tile : BLUEPRINT.line;
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = tile;
            ctx.fillRect(1, 1, 126, 126);
        } else {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = BLUEPRINT.cable;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        this.blueprintImages.set(name, canvas);
        return canvas;
    }

    playSound(name: string) {
        if (this.muted) return;
        const snd = this.sounds[name];
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(e => console.log('Audio play blocked', e));
        }
    }
}
