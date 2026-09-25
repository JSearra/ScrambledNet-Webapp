
import { Assets } from './assets';
import { CONSTANTS } from './constants';

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

// Unit offsets of each cardinal direction, for drawing blips along a cable
const DIR_OFFSETS: Record<number, [number, number]> = {
    [CellDirection.___L]: [-1, 0],
    [CellDirection.__D_]: [0, 1],
    [CellDirection._R__]: [1, 0],
    [CellDirection.U___]: [0, -1]
};

// Sprites for data blips: on connected cables, on disconnected (grey) cables, and the server glow
const BLIP_IMAGES = ['blob_14', 'blob_15', 'blob_16', 'blob_17', 'blob_18', 'blob_19', 'blob_20'];
const BLIP_G_IMAGES = BLIP_IMAGES.map(n => n.replace('blob_', 'blob_g_'));
const BLIP_T_IMAGES = ['blip_t01', 'blip_t03', 'blip_t05', 'blip_t07', 'blip_t08', 'blip_t09', 'blip_t10'];
export const BLIP_SPRITES = [...BLIP_IMAGES, ...BLIP_G_IMAGES, ...BLIP_T_IMAGES].map(n => `${n}.png`);

export const REVERSE_DIRS = {
    [CellDirection.U___]: CellDirection.__D_,
    [CellDirection._R__]: CellDirection.___L,
    [CellDirection.__D_]: CellDirection.U___,
    [CellDirection.___L]: CellDirection._R__
};

// Turn a direction bitmask clockwise by the given number of quarter turns (negative = anticlockwise).
export function turnDirs(bits: number, quarters: number) {
    for (let i = ((quarters % 4) + 4) % 4; i > 0; i--) {
        bits = ((bits & 0x01) << 3) | ((bits & 0x0e) >> 1);
    }
    return bits;
}

export class Cell {
    xindex: number;
    yindex: number;
    assets: Assets;

    connectedDirs: number;
    isConnected: boolean;
    isFullyConnected: boolean;
    isRoot: boolean;
    isLocked: boolean;
    isBlind: boolean;

    solutionDirs: number;

    // Data blips, as direction bitmasks: arriving from, leaving towards, and handing on to the next cell
    blipsIncoming: number;
    blipsOutgoing: number;
    blipsTransfer: number;

    rotateTarget: number;
    rotateStart: number;
    rotateAngle: number;
    rotateTime: number;

    cellLeft: number;
    cellTop: number;
    cellWidth: number;
    cellHeight: number;

    nextU: Cell | null;
    nextD: Cell | null;
    nextL: Cell | null;
    nextR: Cell | null;

    constructor(x: number, y: number, assets: Assets) {
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

        this.blipsIncoming = 0;
        this.blipsOutgoing = 0;
        this.blipsTransfer = 0;

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

    reset(dir: number) {
        this.connectedDirs = dir;
        this.isConnected = false;
        this.isFullyConnected = false;
        this.isRoot = false;
        this.isLocked = false;
        this.isBlind = false;
        this.solutionDirs = CellDirection.NONE;
        this.clearBlips();
        this.rotateTarget = 0;
        this.rotateAngle = 0;
    }

    setGeometry(left: number, top: number, width: number, height: number) {
        this.cellLeft = left;
        this.cellTop = top;
        this.cellWidth = width;
        this.cellHeight = height;
    }

    setNeighbours(u: Cell | null, d: Cell | null, l: Cell | null, r: Cell | null) {
        this.nextU = u;
        this.nextD = d;
        this.nextL = l;
        this.nextR = r;
    }

    next(dir: number) {
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

    rotatedDirs(angle: number) {
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

    hasConnection(dir: number) {
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

    addDir(dir: number) {
        if ((this.connectedDirs & dir) === dir) return;
        this.connectedDirs |= dir;
    }

    setDirs(dir: number) {
        this.connectedDirs = dir;
    }

    rotate(angle: number, time: number, now = performance.now()) {
        if (this.rotateTarget === 0) {
            this.rotateStart = now;
            this.rotateAngle = 0;
            this.rotateTime = time;
        }
        this.rotateTarget += angle;
        this.clearBlips();
    }

    clearBlips() {
        this.blipsIncoming = 0;
        this.blipsOutgoing = 0;
        this.blipsTransfer = 0;
    }

    // Accept a blip arriving from direction d, if we have a cable that way.
    setBlip(dir: number) {
        if (this.hasConnection(dir)) this.blipsIncoming |= dir;
    }

    // Move every blip on by half a cell (port of the Java advanceBlips()). Outgoing blips at the
    // cell edge get queued for transfer; incoming blips reaching the centre leave by every other
    // connected side. The server sends new blips down all its cables every BLIPS_EVERY steps.
    advanceBlips(count: number) {
        this.blipsTransfer = 0;
        for (const d of CARDINALS) {
            if ((this.blipsOutgoing & d) !== 0 && this.hasConnection(d)) this.blipsTransfer |= d;
        }
        this.blipsOutgoing = 0;

        if (this.blipsIncoming !== 0) {
            for (const d of CARDINALS) {
                if ((this.blipsIncoming & d) === 0 && this.hasConnection(d)) this.blipsOutgoing |= d;
            }
        }
        this.blipsIncoming = 0;

        if (this.isRoot && count % CONSTANTS.BLIPS_EVERY === 0) {
            for (const d of CARDINALS) {
                if (this.hasConnection(d)) this.blipsOutgoing |= d;
            }
        }
    }

    // Hand blips queued by advanceBlips() over to the neighbouring cells.
    transferBlips() {
        for (const d of CARDINALS) {
            if ((this.blipsTransfer & d) !== 0) this.next(d)?.setBlip(REVERSE_DIRS[d]);
        }
        this.blipsTransfer = 0;
    }

    doUpdate(now: number) {
        let changed = false;

        if (this.rotateTarget !== 0) {
            // rAF timestamps can be slightly earlier than the performance.now() taken in rotate()
            const elapsed = Math.max(0, now - this.rotateStart);
            this.rotateAngle = (elapsed / this.rotateTime) * 90;
            if (this.rotateTarget < 0) this.rotateAngle = -this.rotateAngle;

            // Apply every quarter turn that has completed. A slow frame can finish more than one,
            // so loop rather than dropping the rest of the queued rotation.
            const step = this.rotateTarget > 0 ? 90 : -90;
            while (this.rotateTarget !== 0 && Math.abs(this.rotateAngle) >= 90) {
                this.setDirs(this.rotatedDirs(step));
                this.rotateAngle -= step;
                this.rotateTarget -= step;
                this.rotateStart += this.rotateTime;
                changed = true;
            }
            if (this.rotateTarget === 0) this.rotateAngle = 0;
        }
        return changed;
    }

    draw(ctx: CanvasRenderingContext2D) {
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

    // Draw this cell's data blips (port of the Java doDrawBlips()). This is a separate pass after
    // all cells are drawn, so blips crossing into a neighbour aren't painted over.
    // frac is how far (0-1) the blips are through their current half-cell step.
    drawBlips(ctx: CanvasRenderingContext2D, frac: number) {
        if (this.isBlind) return;
        const n = this.numDirs();
        // Blips run down the cable into a terminal, then light up its screen
        if (this.isRoot || n > 1 || (n === 1 && frac < 0.3)) this.drawBlipSprites(ctx, frac);
        else if (n === 1) this.drawTerminalData(ctx);
    }

    drawBlipSprites(ctx: CanvasRenderingContext2D, frac: number) {
        if (this.blipsIncoming === 0 && this.blipsOutgoing === 0) return;
        const names = this.isRoot ? BLIP_T_IMAGES : this.isConnected ? BLIP_IMAGES : BLIP_G_IMAGES;
        const last = names.length - 1;
        // Incoming blips grow as they reach the centre, outgoing ones shrink as they leave
        const imgIn = this.assets.getImage(`${names[Math.round(last * frac)]}.png`);
        const imgOut = this.assets.getImage(`${names[Math.round(last * (1 - frac))]}.png`);
        const w = this.cellWidth;
        const h = this.cellHeight;

        for (const d of CARDINALS) {
            const [dx, dy] = DIR_OFFSETS[d];
            if ((this.blipsIncoming & d) !== 0 && imgIn) {
                const p = (1 - frac) * w / 2;
                ctx.drawImage(imgIn, this.cellLeft + dx * p, this.cellTop + dy * p, w, h);
            }
            if ((this.blipsOutgoing & d) !== 0 && imgOut) {
                const p = frac * w / 2;
                ctx.drawImage(imgOut, this.cellLeft + dx * p, this.cellTop + dy * p, w, h);
            }
        }
    }

    // Flicker green "data" lines on a terminal's screen while a blip is arriving.
    drawTerminalData(ctx: CanvasRenderingContext2D) {
        if (!this.isConnected || this.blipsIncoming === 0) return;
        const w = this.cellWidth;
        const h = this.cellHeight;
        const step = Math.max(2, h / 32);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = h / 3; y < h * 0.55; y += step) {
            const l = w / 3;
            const r = w / 3 * Math.random() + w / 3;
            ctx.moveTo(this.cellLeft + l, this.cellTop + y);
            ctx.lineTo(this.cellLeft + r, this.cellTop + y);
        }
        ctx.stroke();
    }
}
