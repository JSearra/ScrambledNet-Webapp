import { Board } from './board.js';
import { Assets } from './assets.js';
import { getBoardSize, CONSTANTS } from './constants.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = new Assets();
        this.board = new Board(this.assets);
        this.running = false;
        this.lastTime = 0;
        this.currentSkill = null;

        // Input handling
        // Handle both mouse and touch
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            // Use the first touch point
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                // Create a fake event-like object or just pass coords
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.board.handleInput(x, y);
            }
        }, { passive: false });
    }

    async start(skill) {
        this.currentSkill = skill;
        this.running = false; // Stop current loop

        // ensure assets loaded
        if (this.assets.loaded < 1) { // simpler check
            await this.assets.loadAll();
        }

        // Reset and Resize
        this.resize();

        // Setup Board
        // Get grid size for skill
        const gridSize = getBoardSize(skill.label.toUpperCase(), 1000, 1000); // 1000 is arbitrary large number to indicate landscape/portrait preference if we knew screen ratio, here we default
        // Actually getBoardSize takes gridWidth/Height which are ints like 10,11. 
        // Wait, SCREEN_SIZES has 17,10 etc.
        // In BoardView.java: FindMaximumGridforScreenSize() sets gridWidth/Height based on screen orientation.
        // here let's just use window aspect ratio
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ratio = w / h;

        // Determine grid dimensions based on skill and aspect ratio
        // SCREEN_SIZES defines major and minor.
        // if Landscape (w > h), width = major, height = minor.

        const size = getBoardSize(skill.label.toUpperCase(), w, h);

        this.board.init(size.width, size.height);

        // resize board geometry to fit screen
        this.board.setSize(this.canvas.width, this.canvas.height);

        // Now calculate active board area
        // Since we initialized the grid to exactly match the board size for this skill,
        // the boardWidth/Height is the same as gridWidth/Height.
        this.board.setupBoard(skill, size.width, size.height);

        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));

        // Update UI
        document.getElementById('message').innerText = "You Win!"; // resetting message, will be hidden
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.board && this.board.cellMatrix.length > 0) {
            this.board.setSize(this.canvas.width, this.canvas.height);
        }
    }

    handleInput(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.board.handleInput(x, y);
    }

    loop(now) {
        if (!this.running) return;

        const dt = now - this.lastTime;
        // this.lastTime = now; // update lastTime at end? No, doUpdate uses 'now'.
        // Java: doUpdate(now).

        const result = this.board.update(now);

        // Draw
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.board.draw(this.ctx);

        if (result === 'WIN') {
            this.assets.playSound('win.ogg');
            this.running = false;
            document.getElementById('ui-overlay').classList.remove('hidden');
        }

        this.lastTime = now;
        requestAnimationFrame((t) => this.loop(t));
    }
}
