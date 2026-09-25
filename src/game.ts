import { Board } from './board.js';
import { Assets } from './assets.js';
import { getBoardSize } from './constants.js';
import { Skill } from './types.js';

const LONG_PRESS_TIME = 500;

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D; // or null? "!" assertion if we are sure.
    assets: Assets;
    board: Board;
    running: boolean;
    lastTime: number;
    currentSkill: Skill | null;
    startTime: number;
    selectedCell: { x: number; y: number } | null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.assets = new Assets();
        this.board = new Board(this.assets);
        this.running = false;
        this.lastTime = 0;
        this.currentSkill = null;
        this.startTime = 0;
        this.selectedCell = null;


        // Input handling
        // Handle both mouse and touch
        // Left click rotates, right click toggles the lock
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.handleInput(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleInput(e.clientX, e.clientY, true);
        });

        // Tap rotates on release, a long press toggles the lock instead
        let longPressTimer: number | undefined;
        let longPressed = false;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling and emulated mouse events
            if (e.changedTouches.length === 0) return;
            const touch = e.changedTouches[0];
            longPressed = false;
            clearTimeout(longPressTimer);
            longPressTimer = window.setTimeout(() => {
                longPressed = true;
                this.handleInput(touch.clientX, touch.clientY, true);
            }, LONG_PRESS_TIME);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(longPressTimer);
            if (!longPressed && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.handleInput(touch.clientX, touch.clientY);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchcancel', () => clearTimeout(longPressTimer));

        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    stop() {
        this.running = false;
    }

    // Start the auto-solver, or stop it if it's already running
    toggleSolve() {
        if (!this.running) return;
        if (this.board.isSolving()) this.board.stopSolve();
        else this.board.startSolve(performance.now());
    }

    toggleSound() {
        this.assets.muted = !this.assets.muted;
        return !this.assets.muted;
    }

    async start(skill: Skill) {
        this.currentSkill = skill;
        this.running = false; // Stop current loop

        // ensure assets loaded
        if (this.assets.loaded < 1) { // simpler check
            await this.assets.loadAll();
        }

        // Reset stats
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
        this.assets.playSound('start.ogg');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));

    }

    resize() {
        const container = this.canvas.parentElement!;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        if (this.board && this.board.cellMatrix.length > 0) {
            this.board.setSize(this.canvas.width, this.canvas.height);
        }
    }

    handleInput(clientX: number, clientY: number, lock = false) {
        if (!this.running) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (lock) this.board.lockAtPixel(x, y);
        else this.board.handleInput(x, y);
    }

    handleKeyboard(e: KeyboardEvent) {
        if (!this.running || !this.board) return;

        // Only handle game controls, not settings/menu
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }

        // Initialize selection if null (center of board)
        if (!this.selectedCell) {
            this.selectedCell = {
                x: Math.floor(this.board.gridWidth / 2),
                y: Math.floor(this.board.gridHeight / 2)
            };
        }

        // Arrow key navigation
        if (e.key === 'ArrowUp') {
            this.selectedCell.y = Math.max(0, this.selectedCell.y - 1);
        } else if (e.key === 'ArrowDown') {
            this.selectedCell.y = Math.min(this.board.gridHeight - 1, this.selectedCell.y + 1);
        } else if (e.key === 'ArrowLeft') {
            this.selectedCell.x = Math.max(0, this.selectedCell.x - 1);
        } else if (e.key === 'ArrowRight') {
            this.selectedCell.x = Math.min(this.board.gridWidth - 1, this.selectedCell.x + 1);
        } else if (e.key === ' ' || e.key === 'Enter') {
            this.board.rotateCellAt(this.selectedCell.x, this.selectedCell.y);
        } else if (e.key === 'l' || e.key === 'L') {
            this.board.toggleLockAt(this.selectedCell.x, this.selectedCell.y);
        }
    }

    draw(now = performance.now()) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.board.draw(this.ctx);
        this.board.drawBlips(this.ctx, now);
        
        // Draw selection highlight, or the cell the auto-solver is working on
        const solving = this.board.solvingCell;
        if (solving) {
            this.board.drawSelection(this.ctx, solving.xindex, solving.yindex);
        } else if (this.selectedCell && this.running) {
            this.board.drawSelection(this.ctx, this.selectedCell.x, this.selectedCell.y);
        }
    }

    loop(now: number) {
        if (!this.running) return;

        // const dt = now - this.lastTime;


        const result = this.board.update(now);

        this.draw(now);

        // Update Stats
        const currentTime = Date.now();
        const totalTime = Math.floor((currentTime - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('time-display')!.innerText = timeString;
        document.getElementById('moves-display')!.innerText = this.board.moves.toString();

        if (result === 'WIN') {
            this.assets.playSound('win.ogg');
            this.running = false;

            // Update final stats for overlay
            document.getElementById('message')!.innerText = this.board.solverUsed ? 'Solved!' : 'You Win!';
            document.getElementById('final-time')!.innerText = timeString;
            document.getElementById('final-moves')!.innerText = this.board.moves.toString();

            document.getElementById('ui-overlay')!.classList.remove('hidden');
        }

        this.lastTime = now;
        requestAnimationFrame((t) => this.loop(t));
    }
}
