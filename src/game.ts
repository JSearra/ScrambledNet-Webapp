import { Board } from './board.js';
import { Assets } from './assets.js';
import { getBoardSize } from './constants.js';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D; // or null? "!" assertion if we are sure.
    assets: Assets;
    board: Board;
    running: boolean;
    lastTime: number;
    currentSkill: any; // Type for skill
    moves: number;
    startTime: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.assets = new Assets();
        this.board = new Board(this.assets);
        this.running = false;
        this.lastTime = 0;
        this.currentSkill = null;
        this.moves = 0;
        this.startTime = 0;


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

    stop() {
        this.running = false;
    }

    toggleSound() {
        this.assets.muted = !this.assets.muted;
        return !this.assets.muted;
    }

    async start(skill: any) {
        this.currentSkill = skill;
        this.running = false; // Stop current loop

        // ensure assets loaded
        if (this.assets.loaded < 1) { // simpler check
            await this.assets.loadAll();
        }

        // Reset stats
        this.moves = 0;
        this.startTime = Date.now();

        // Reset and Resize
        this.resize();

        // Setup Board
        // Get grid size for skill
        // const gridSize = getBoardSize(skill.label.toUpperCase(), 1000, 1000);

        // use window aspect ratio
        const container = this.canvas.parentElement!;
        const w = container.clientWidth;
        const h = container.clientHeight;
        // const ratio = w / h;

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
        document.getElementById('message')!.innerText = "You Win!"; // resetting message, will be hidden
    }

    resize() {
        const container = this.canvas.parentElement!;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        if (this.board && this.board.cellMatrix.length > 0) {
            this.board.setSize(this.canvas.width, this.canvas.height);
        }
    }

    handleInput(e: any) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const validMove = this.board.handleInput(x, y);
        if (validMove && this.running) {
            this.moves++;
        }
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.board.draw(this.ctx);
    }

    loop(now: number) {
        if (!this.running) return;

        // const dt = now - this.lastTime;


        const result = this.board.update(now);

        // Draw
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.board.draw(this.ctx);

        // Update Stats
        const currentTime = Date.now();
        const totalTime = Math.floor((currentTime - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('time-display')!.innerText = timeString;
        document.getElementById('moves-display')!.innerText = this.moves.toString();

        if (result === 'WIN') {
            this.assets.playSound('win.ogg');
            this.running = false;

            // Update final stats for overlay
            document.getElementById('final-time')!.innerText = timeString;
            document.getElementById('final-moves')!.innerText = this.moves.toString();

            document.getElementById('ui-overlay')!.classList.remove('hidden');
        }

        this.lastTime = now;
        requestAnimationFrame((t) => this.loop(t));
    }
}
