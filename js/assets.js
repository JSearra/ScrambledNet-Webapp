export class Assets {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.toLoad = 0;
        this.loaded = 0;
    }

    loadImage(name) {
        this.toLoad++;
        const img = new Image();
        img.src = `assets/images/${name}`;
        img.onload = () => this.loaded++;
        img.onerror = (e) => console.error('Failed to load image', name, e);
        this.images[name] = img;
    }

    loadSound(name) {
        // Use Audio object for simplicity
        this.toLoad++;
        const snd = new Audio(`assets/audio/${name}`);
        snd.oncanplaythrough = () => {
            // We can count it as loaded, but audio sometimes is tricky.
            // For this simple gate, we'll just assume it loads eventually or doesn't block critical render.
            this.loaded++;
        };
        snd.onerror = (e) => console.error('Failed to load sound', name, e);
        this.sounds[name] = snd;
    }

    loadAll() {
        const imageFiles = [
            'background.png', 'background_locked.png', 'empty.png', 'nothing.png',
            'server.png', 'computer1.png', 'computer2.png',
            'cable0001.png', 'cable0010.png', 'cable0011.png', 'cable0100.png',
            'cable0101.png', 'cable0110.png', 'cable0111.png', 'cable1000.png',
            'cable1001.png', 'cable1010.png', 'cable1011.png', 'cable1100.png',
            'cable1101.png', 'cable1110.png', 'cable1111.png'
        ];

        const soundFiles = [
            'click.ogg', 'win.ogg'
        ];

        imageFiles.forEach(f => this.loadImage(f));
        soundFiles.forEach(f => this.loadSound(f));

        return new Promise(resolve => {
            const check = () => {
                // Determine completion. Audio loading can be finicky without user interaction first.
                // We'll trust images are critical.
                if (this.loaded >= imageFiles.length) {
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
        const snd = this.sounds[name];
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(e => console.log('Audio play blocked', e));
        }
    }
}
