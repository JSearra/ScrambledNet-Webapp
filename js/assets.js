export class Assets {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.toLoad = 0;
        this.loaded = 0;
        this.muted = false;
        this.theme = 'modern'; // Default theme
    }

    setTheme(theme) {
        this.theme = theme;
        // Reload all images with the new theme path
        this.loaded = 0;
        this.toLoad = 0;
        return this.loadAll();
    }

    loadImage(name) {
        this.toLoad++;
        const img = new Image();
        const basePath = this.theme === 'modern' ? 'assets/images/' : 'assets/';
        img.src = `${basePath}${name}`;
        img.onload = () => {
            this.loaded++;
            // console.log('Loaded', name);
        };
        img.onerror = (e) => console.error('Failed to load image', name, e);
        this.images[name] = img;
    }

    loadSound(name) {

        this.toLoad++;
        const snd = new Audio(`assets/audio/${name}`);
        snd.oncanplaythrough = () => {

            this.loaded++;
        };
        snd.onerror = (e) => console.error('Failed to load sound', name, e);
        this.sounds[name] = snd;
    }

    loadAll() {
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

        return new Promise(resolve => {
            const check = () => {

                if (this.toLoad > 0 && this.loaded >= this.toLoad) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }

    getImage(name) {
        return this.images[name];
    }

    playSound(name) {
        if (this.muted) return;
        const snd = this.sounds[name];
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(e => console.log('Audio play blocked', e));
        }
    }
}
