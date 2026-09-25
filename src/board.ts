import { Cell, CellDirection, CARDINALS, REVERSE_DIRS } from './cell';
import { Assets } from './assets';
import { Skill } from './types.js';

export class Board {
    assets: Assets;
    gridWidth: number;
    gridHeight: number;
    cellMatrix: Cell[][];
    rootCell: Cell | null;
    isConnected: boolean[][];
    connectingCells: Cell[];
    moves: number;
    lastRotatedCell: Cell | null;

    boardWidth: number;
    boardHeight: number;
    boardStartX: number;
    boardStartY: number;
    boardEndX: number;
    boardEndY: number;

    paddingX: number;
    paddingY: number;
    cellWidth: number;
    cellHeight: number;

    constructor(assets: Assets) {
        this.assets = assets;
        this.gridWidth = 10;
        this.gridHeight = 10;
        this.cellMatrix = [];
        this.rootCell = null;
        this.isConnected = [];
        this.connectingCells = [];
        this.moves = 0;
        this.lastRotatedCell = null;

        // Board layout within the grid
        this.boardWidth = 0;
        this.boardHeight = 0;
        this.boardStartX = 0;
        this.boardStartY = 0;
        this.boardEndX = 0;
        this.boardEndY = 0;

        this.paddingX = 0;
        this.paddingY = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
    }

    init(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellMatrix = new Array(gridWidth);
        for (let x = 0; x < gridWidth; x++) {
            this.cellMatrix[x] = new Array(gridHeight);
            for (let y = 0; y < gridHeight; y++) {
                this.cellMatrix[x][y] = new Cell(x, y, this.assets);
            }
        }
        this.isConnected = new Array(gridWidth);
        for (let x = 0; x < gridWidth; x++) this.isConnected[x] = new Array(gridHeight).fill(false);
    }

    setSize(width: number, height: number) {
        // Calculate cell size
        this.cellWidth = Math.floor(width / this.gridWidth);
        this.cellHeight = Math.floor(height / this.gridHeight);

        // Enforce even cell sizes to avoid sub-pixel rendering misalignment during rotation
        if (this.cellWidth % 2 !== 0) this.cellWidth--;
        if (this.cellHeight % 2 !== 0) this.cellHeight--;

        if (this.cellWidth < this.cellHeight) this.cellHeight = this.cellWidth;
        else this.cellWidth = this.cellHeight;

        this.paddingX = Math.floor((width - (this.gridWidth * this.cellWidth)) / 2);
        this.paddingY = Math.floor((height - (this.gridHeight * this.cellHeight)) / 2);

        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                const xPos = x * this.cellWidth + this.paddingX;
                const yPos = y * this.cellHeight + this.paddingY;
                this.cellMatrix[x][y].setGeometry(xPos, yPos, this.cellWidth, this.cellHeight);
            }
        }
    }

    setupBoard(skill: Skill, boardWidth: number, boardHeight: number) {
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;
        this.boardStartX = Math.floor((this.gridWidth - this.boardWidth) / 2);
        this.boardEndX = this.boardStartX + this.boardWidth;
        this.boardStartY = Math.floor((this.gridHeight - this.boardHeight) / 2);
        this.boardEndY = this.boardStartY + this.boardHeight;

        const wrap = skill.wrapped;
        this.moves = 0;
        this.lastRotatedCell = null;

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.cellMatrix[x][y].reset(wrap ? CellDirection.NONE : CellDirection.FREE);

                let u = null, d = null, l = null, r = null;
                // Wrapping logic
                if (wrap || y > this.boardStartY) {
                    u = this.cellMatrix[x][this.decr(y, this.boardStartY, this.boardEndY)];
                }
                if (wrap || y < this.boardEndY - 1) {
                    d = this.cellMatrix[x][this.incr(y, this.boardStartY, this.boardEndY)];
                }
                if (wrap || x > this.boardStartX) {
                    l = this.cellMatrix[this.decr(x, this.boardStartX, this.boardEndX)][y];
                }
                if (wrap || x < this.boardEndX - 1) {
                    r = this.cellMatrix[this.incr(x, this.boardStartX, this.boardEndX)][y];
                }
                this.cellMatrix[x][y].setNeighbours(u, d, l, r);
            }
        }

        // Generate Net, retrying until it covers at least 85% of the board
        const minCells = Math.floor(this.boardWidth * this.boardHeight * 0.85);
        for (let tries = 0; tries < 10 && this.createNet(skill) < minCells; tries++);

        // Save Solution State
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                this.cellMatrix[x][y].solutionDirs = this.cellMatrix[x][y].connectedDirs;
            }
        }

        // Jumble
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                // Turn instantly by 0-3 quarter turns; no animation needed before the first frame
                const cell = this.cellMatrix[x][y];
                const turns = Math.floor(Math.random() * 4);
                for (let i = 0; i < turns; i++) cell.setDirs(cell.rotatedDirs(90));
                cell.isBlind = cell.numDirs() >= skill.blind;
            }
        }

        this.updateConnections();
    }

    decr(val: number, min: number, max: number) {
        val--;
        if (val < min) val = max - 1;
        return val;
    }

    incr(val: number, min: number, max: number) {
        val++;
        if (val >= max) val = min;
        return val;
    }

    // Port of the Java createNet(): each cell gets a single turn to grow 1-2 branches
    // (a third is possible when skill.branches >= 3), or is sent to the back of the queue.
    // This caps the connections per cell by skill and leaves some cells empty.
    // Returns the number of cells in the net.
    createNet(skill: Skill) {
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                this.cellMatrix[x][y].setDirs(CellDirection.FREE);
                this.cellMatrix[x][y].isRoot = false;
            }
        }

        const rootX = Math.floor(Math.random() * this.boardWidth) + this.boardStartX;
        const rootY = Math.floor(Math.random() * this.boardHeight) + this.boardStartY;
        this.rootCell = this.cellMatrix[rootX][rootY];
        this.rootCell.isConnected = true;
        this.rootCell.isRoot = true;

        const list = [this.rootCell];
        if (Math.random() < 0.5) this.addRandomDir(list);

        while (list.length > 0) {
            if (Math.random() < 0.5) {
                this.addRandomDir(list);
                if (Math.random() < 0.5) this.addRandomDir(list);
                if (skill.branches >= 3 && Math.floor(Math.random() * 3) === 0) this.addRandomDir(list);
            } else {
                list.push(list[0]);
            }
            list.shift();
        }

        let cells = 0;
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                if (this.cellMatrix[x][y].connectedDirs !== CellDirection.FREE) cells++;
            }
        }
        return cells;
    }

    // Link the cell at the head of the list to a random free neighbour, and queue that neighbour.
    addRandomDir(list: Cell[]) {
        const cell = list[0];
        const freeNeighbours = [];
        for (const d of CARDINALS) {
            const ucell = cell.next(d);
            if (ucell && ucell.connectedDirs === CellDirection.FREE) {
                freeNeighbours.push({ dir: d, cell: ucell });
            }
        }
        if (freeNeighbours.length === 0) return;

        const pick = freeNeighbours[Math.floor(Math.random() * freeNeighbours.length)];
        cell.addDir(pick.dir);
        pick.cell.addDir(REVERSE_DIRS[pick.dir]);
        list.push(pick.cell);
    }

    updateConnections() {
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.isConnected[x][y] = false;
            }
        }

        let connectingCells: Cell[] = [];

        if (!this.rootCell!.isRotated()) {
            this.isConnected[this.rootCell!.xindex][this.rootCell!.yindex] = true;
            connectingCells.push(this.rootCell!);
        }

        while (connectingCells.length > 0) {
            const cell = connectingCells.shift()!;

            for (const d of CARDINALS) {
                if (this.hasNewConnection(cell, d)) {
                    // Mark connected
                    const other = cell.next(d)!;
                    this.isConnected[other.xindex][other.yindex] = true;
                    connectingCells.push(other);
                }
            }
        }

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.cellMatrix[x][y].isConnected = this.isConnected[x][y];
            }
        }
    }

    hasNewConnection(cell: Cell, dir: number) {
        const other = cell.next(dir);
        if (!other) return false;
        if (this.isConnected[other.xindex][other.yindex]) return false;

        const otherDir = REVERSE_DIRS[dir];
        if (!cell.hasConnection(dir) || !other.hasConnection(otherDir)) return false;

        return true;
    }

    isSolved() {
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                const cell = this.cellMatrix[x][y];
                if (cell.numDirs() === 1 && !cell.isConnected) return false;
            }
        }
        return true;
    }

    cellAtPixel(x: number, y: number): Cell | null {
        if (this.cellWidth <= 0 || this.cellHeight <= 0) return null;
        const gx = Math.floor((x - this.paddingX) / this.cellWidth);
        const gy = Math.floor((y - this.paddingY) / this.cellHeight);
        if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) return null;
        return this.cellMatrix[gx][gy];
    }

    handleInput(x: number, y: number) {
        const cell = this.cellAtPixel(x, y);
        return cell ? this.rotateCell(cell) : false;
    }

    // Rotate a cell clockwise. Repeat taps on the same cell count as a single move,
    // since tapping only turns one way (as in the Java cellClicked()).
    rotateCell(cell: Cell): boolean {
        if (cell.connectedDirs === CellDirection.NONE ||
            cell.connectedDirs === CellDirection.FREE ||
            cell.isLocked) {
            return false;
        }
        cell.rotate(90, 250);
        this.assets.playSound('click.ogg');
        if (cell !== this.lastRotatedCell) {
            this.moves++;
            this.lastRotatedCell = cell;
        }
        this.updateConnections();
        return true;
    }

    update(now: number) {
        let changed = false;
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                if (this.cellMatrix[x][y].doUpdate(now)) {
                    changed = true;
                }
            }
        }

        if (changed) {
            this.updateConnections();
            if (this.isSolved()) {
                this.revealBlind();
                return 'WIN';
            }
        }
        return null;
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (let x = 0; x < this.gridWidth; ++x) {
            for (let y = 0; y < this.gridHeight; ++y) {
                this.cellMatrix[x][y].draw(ctx);
            }
        }
    }

    revealBlind() {
        for (const column of this.cellMatrix) {
            for (const cell of column) cell.isBlind = false;
        }
    }

    autoSolve() {
        this.revealBlind();
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                const cell = this.cellMatrix[x][y];
                cell.connectedDirs = cell.solutionDirs;
                cell.rotateTarget = 0;
                cell.rotateAngle = 0;
            }
        }
        this.updateConnections();
        return "Solved!";
    }

    rotateCellAt(x: number, y: number): boolean {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return false;
        }
        return this.rotateCell(this.cellMatrix[x][y]);
    }

    drawSelection(ctx: CanvasRenderingContext2D, x: number, y: number) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return;
        }
        const cell = this.cellMatrix[x][y];
        if (cell.connectedDirs === CellDirection.NONE) {
            return;
        }
        
        // Draw a highlight border around the selected cell
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            cell.cellLeft | 0,
            cell.cellTop | 0,
            cell.cellWidth | 0,
            cell.cellHeight | 0
        );
    }
}
