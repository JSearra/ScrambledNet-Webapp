
export const CellDirection = {
    FREE: 0,
    ___L: 1,
    __D_: 2,
    __DL: 3,
    _R__: 4,
    _R_L: 5,
    _RD_: 6,
    _RDL: 7,
    U___: 8,
    U__L: 9,
    U_D_: 10,
    U_DL: 11,
    UR__: 12,
    UR_L: 13,
    URD_: 14,
    URDL: 15,
    NONE: 16
};

export const IMAGES = {
    [CellDirection.___L]: 'cable0001.png',
    [CellDirection.__D_]: 'cable0010.png',
    [CellDirection.__DL]: 'cable0011.png',
    [CellDirection._R__]: 'cable0100.png',
    [CellDirection._R_L]: 'cable0101.png',
    [CellDirection._RD_]: 'cable0110.png',
    [CellDirection._RDL]: 'cable0111.png',
    [CellDirection.U___]: 'cable1000.png',
    [CellDirection.U__L]: 'cable1001.png',
    [CellDirection.U_D_]: 'cable1010.png',
    [CellDirection.U_DL]: 'cable1011.png',
    [CellDirection.UR__]: 'cable1100.png',
    [CellDirection.UR_L]: 'cable1101.png',
    [CellDirection.URD_]: 'cable1110.png',
    [CellDirection.URDL]: 'cable1111.png'
};

export const CARDINALS = [
    CellDirection.___L,
    CellDirection.__D_,
    CellDirection._R__,
    CellDirection.U___
];

export const REVERSE_DIRS = {
    [CellDirection.U___]: CellDirection.__D_,
    [CellDirection._R__]: CellDirection.___L,
    [CellDirection.__D_]: CellDirection.U___,
    [CellDirection.___L]: CellDirection._R__
};

export class Cell {
    constructor(x, y, assets) {
        this.xindex = x;
        this.yindex = y;
        this.assets = assets;

        this.connectedDirs = CellDirection.NONE;
        this.isConnected = false;
        this.isFullyConnected = false;
        this.isRoot = false;
        this.isLocked = false;
        this.isBlind = false;

        this.solutionDirs = CellDirection.NONE;

        this.rotateTarget = 0;
        this.rotateStart = 0;
        this.rotateAngle = 0;
        this.rotateTime = 0;

        this.cellLeft = 0;
        this.cellTop = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;

        this.nextU = null;
        this.nextD = null;
        this.nextL = null;
        this.nextR = null;
    }

    reset(dir) {
        this.connectedDirs = dir;
        this.isConnected = false;
        this.isFullyConnected = false;
        this.isRoot = false;
        this.isLocked = false;
        this.isBlind = false;
        this.solutionDirs = CellDirection.NONE;
        this.rotateTarget = 0;
        this.rotateAngle = 0;
    }

    setGeometry(left, top, width, height) {
        this.cellLeft = left;
        this.cellTop = top;
        this.cellWidth = width;
        this.cellHeight = height;
    }

    setNeighbours(u, d, l, r) {
        this.nextU = u;
        this.nextD = d;
        this.nextL = l;
        this.nextR = r;
    }

    next(dir) {
        switch (dir) {
            case CellDirection.U___: return this.nextU;
            case CellDirection._R__: return this.nextR;
            case CellDirection.__D_: return this.nextD;
            case CellDirection.___L: return this.nextL;
            default: return null;
        }
    }

    dirs() {
        return this.connectedDirs;
    }

    rotatedDirs(angle) {
        let bits = this.connectedDirs;
        // Logic from Java:
        // if (a == 90) bits = ((bits & 0x01) << 3) | ((bits & 0x0e) >> 1);
        if (angle === 90) {
            bits = ((bits & 0x01) << 3) | ((bits & 0x0e) >> 1);
        } else if (angle === -90) {
            bits = ((bits & 0x08) >> 3) | ((bits & 0x07) << 1);
        } else if (angle === 180 || angle === -180) {
            bits = ((bits & 0x0c) >> 2) | ((bits & 0x03) << 2);
        }
        return bits;
    }

    hasConnection(dir) {
        return !this.isRotated() && (this.connectedDirs & dir) === dir;
    }

    isRotated() {
        return this.rotateTarget !== 0;
    }

    numDirs() {
        if (this.connectedDirs === CellDirection.NONE) return 0;
        let bits = this.connectedDirs;
        let n = 0;
        for (let i = 0; i < 4; ++i) {
            n += bits & 0x01;
            bits >>= 1;
        }
        return n;
    }

    addDir(dir) {
        if ((this.connectedDirs & dir) === dir) return;
        this.connectedDirs |= dir;
    }

    setDirs(dir) {
        this.connectedDirs = dir;
    }

    rotate(angle, time) {
        if (this.rotateTarget === 0) {
            this.rotateStart = performance.now(); // different from System.currentTimeMillis()
            this.rotateAngle = 0;
            this.rotateTime = time;
        }
        this.rotateTarget += angle;
    }

    doUpdate(now) {
        let changed = false;

        if (this.rotateTarget !== 0) {
            this.rotateAngle = ((now - this.rotateStart) / this.rotateTime) * 90;
            if (this.rotateTarget < 0) this.rotateAngle = -this.rotateAngle;

            if (Math.abs(this.rotateAngle) >= 90) {
                if (this.rotateTarget > 0) {
                    this.setDirs(this.rotatedDirs(90));
                    if (this.rotateAngle >= this.rotateTarget) {
                        this.rotateAngle = this.rotateTarget = 0;
                    } else {
                        this.rotateAngle -= 90;
                        this.rotateTarget -= 90;
                        this.rotateStart += this.rotateTime;
                    }
                } else {
                    this.setDirs(this.rotatedDirs(-90));
                    if (this.rotateAngle <= this.rotateTarget) {
                        this.rotateAngle = this.rotateTarget = 0;
                    } else {
                        this.rotateAngle += 90;
                        this.rotateTarget += 90;
                        this.rotateStart += this.rotateTime;
                    }
                }
                changed = true;
            }
        }
        return changed;
    }

    draw(ctx) {
        const sx = this.cellLeft;
        const sy = this.cellTop;
        const w = this.cellWidth;
        const h = this.cellHeight;

        ctx.save();
        ctx.translate(sx + w / 2, sy + h / 2);

        // Draw background
        let bgName = null;
        if (this.connectedDirs === CellDirection.NONE) bgName = 'nothing.png';
        else if (this.isLocked) bgName = 'background_locked.png';
        else if (this.connectedDirs === CellDirection.FREE) bgName = 'empty.png';
        else bgName = 'background.png';

        if (bgName) {
            const img = this.assets.getImage(bgName);
            if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }

        // Draw cable
        // TODO: Grey out if not connected
        // Rotation
        ctx.rotate((this.rotateAngle * Math.PI) / 180);

        if (!this.isBlind && this.connectedDirs !== CellDirection.NONE && this.connectedDirs !== CellDirection.FREE) {
            // We need to fetch the image for the current "base" direction.
            // If we are rotating, we draw the "old" direction rotated by the angle.
            // The logic in doUpdate handles the logical update when angle >= 90.
            const imgName = IMAGES[this.connectedDirs];
            const img = this.assets.getImage(imgName);
            if (img) {
                // Check if we should apply a grey effect filter.
                // Canvas doesn't support easy tinting without offscreen canvas or globalCompositeOperation tricks.
                // For now, let's just draw it. Optionally use globalAlpha for disconnected? 
                if (!this.isConnected && !this.isRoot) {
                    ctx.globalAlpha = 0.5; // Visual cue for disconnected
                }
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
                ctx.globalAlpha = 1.0;
            }
        }

        // Un-rotate for decoration (Server / Terminal) so they stay upright
        ctx.rotate(-(this.rotateAngle * Math.PI) / 180);

        if (this.isRoot) {
            const serverImg = this.assets.getImage('server.png');
            if (serverImg) ctx.drawImage(serverImg, -w / 2, -h / 2, w, h);
        } else if (this.numDirs() === 1) {
            // It's a terminal
            let terminalImg = null;
            if (this.isFullyConnected) terminalImg = this.assets.getImage('computer1.png'); // assuming solved state
            else terminalImg = this.assets.getImage('computer2.png'); // assuming unsolved

            if (!this.isConnected) {
                ctx.globalAlpha = 0.5; // Dim disconnected terminals
            }
            if (terminalImg) ctx.drawImage(terminalImg, -w / 2, -h / 2, w, h);
            ctx.globalAlpha = 1.0;
        }

        // Re-rotate back if we had more to draw, or just let restore() handle it
        // We are done drawing, restore() comes next.

        ctx.restore();
    }
}
