// Use Vite's glob import to get all assets with their hashed URLs
const assetFiles = import.meta.glob('../assets/**/*', { eager: true, query: '?url', import: 'default' });

export class Assets {
    images: { [key: string]: HTMLImageElement };
    sounds: { [key: string]: HTMLAudioElement };
    toLoad: number;
    loaded: number;
    muted: boolean;
    theme: string;

    constructor() {
        this.images = {};
        this.sounds = {};
        this.toLoad = 0;
        this.loaded = 0;
        this.muted = false;
        this.theme = 'modern'; // Default theme
    }

    setTheme(theme: string) {
        this.theme = theme;
        // Reload all images with the new theme path
        this.loaded = 0;
        this.toLoad = 0;
        return this.loadAll();
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

    loadImage(name: string) {
        this.toLoad++;
        const img = new Image();
        const basePath = this.theme === 'modern' ? 'assets/images/' : 'assets/';
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


        if (Object.keys(this.sounds).length === 0) {
            const soundFiles = [
                'click.ogg', 'win.ogg'
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

    getImage(name: string) {
        return this.images[name];
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
