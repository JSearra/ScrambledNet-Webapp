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

        // Generate Net
        this.createNet(skill);

        // Save Solution State
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                this.cellMatrix[x][y].solutionDirs = this.cellMatrix[x][y].connectedDirs;
            }
        }

        // Jumble
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                // Random rotation -2 to +1 aka -180, -90, 0, 90?
                const rots = Math.floor(Math.random() * 4) - 2;
                this.cellMatrix[x][y].rotate(rots * 90, 0);
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

    createNet(skill: Skill) {
        // Reset
        for (let x = this.boardStartX; x < this.boardEndX; x++) {
            for (let y = this.boardStartY; y < this.boardEndY; y++) {
                this.cellMatrix[x][y].setDirs(CellDirection.FREE);
                this.cellMatrix[x][y].isRoot = false;
            }
        }

        // Root
        const rootX = Math.floor(Math.random() * this.boardWidth) + this.boardStartX;
        const rootY = Math.floor(Math.random() * this.boardHeight) + this.boardStartY;
        this.rootCell = this.cellMatrix[rootX][rootY];
        this.rootCell.isConnected = true;
        this.rootCell.isRoot = true;

        // Active list of cells that are part of the net and might have free neighbors
        let list = [this.rootCell];

        while (list.length > 0) {
            // Selection Strategy:
            // "Last" (Index = list.length-1) -> Recursive Backtracker (DFS) -> Long winding paths ("Rivers").
            // "Random" -> Prim's Algorithm -> Many short branches ("Blob").
            // We mix them based on desired 'branchiness'.

            // High branches (Master/Insane) -> More Randomness to create difficult branching.
            // Low branches (Novice/Normal) -> More DFS for easier flowing paths.

            const dfsProb = (skill.branches >= 3) ? 0.5 : 0.8;

            let index;
            if (Math.random() < dfsProb) {
                index = list.length - 1;
            } else {
                index = Math.floor(Math.random() * list.length);
            }

            const cell = list[index];
            const freeNeighbours = [];

            for (const d of CARDINALS) {
                const ucell = cell.next(d);
                if (ucell && ucell.connectedDirs === CellDirection.FREE) {
                    freeNeighbours.push({ dir: d, cell: ucell });
                }
            }

            if (freeNeighbours.length === 0) {
                list.splice(index, 1);
            } else {
                const pick = freeNeighbours[Math.floor(Math.random() * freeNeighbours.length)];

                cell.addDir(pick.dir);
                pick.cell.addDir(REVERSE_DIRS[pick.dir]);

                list.push(pick.cell);
            }
        }
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

    handleInput(x: number, y: number) {
        // Find which cell was clicked
        for (let i = 0; i < this.gridWidth; i++) {
            for (let j = 0; j < this.gridHeight; j++) {
                const cell = this.cellMatrix[i][j];
                if (x >= cell.cellLeft && x < cell.cellLeft + cell.cellWidth &&
                    y >= cell.cellTop && y < cell.cellTop + cell.cellHeight) {

                    if (cell.connectedDirs !== CellDirection.NONE &&
                        cell.connectedDirs !== CellDirection.FREE &&
                        !cell.isLocked) {

                        cell.rotate(90, 250);
                        this.assets.playSound('click.ogg');

                        return true;
                    }
                }
            }
        }
        return false;
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

    autoSolve() {
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
        const cell = this.cellMatrix[x][y];
        if (cell.connectedDirs === CellDirection.NONE) {
            return false;
        }
        cell.rotate(90, 250); // 90 degree rotation, 250ms animation
        this.updateConnections();
        return true;
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
