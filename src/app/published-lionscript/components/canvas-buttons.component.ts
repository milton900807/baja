import {
    Component, Input, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { LionEngine } from '../../../app/engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';

@Component({
    selector: 'button-canvas',
    template: `
      <div [id]="cssid" [ngStyle]="{ 'background-color': background }">
        <canvas #buttoncanvas__ [width]="width" [height]="height"></canvas>
      </div>
    `,
    styles: [
        `
        #__canvas_out {
          border: 0.05em solid red;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        canvas {
          padding-left: 5px;
          padding-top: 2px;
          display: block;
        }
      `,
    ],
})
export class CanvasButtonsComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    grid: MGrid;

    // Default background; overridden by data['background'] if provided
    background = 'transparent';

    ymax = 10;
    saveFunction;
    clickFunction;
    listenerFunction;
    cssid = 'undefined';

    // a reference to the canvas element from our template
    @ViewChild('buttoncanvas__') public canvas: ElementRef<HTMLCanvasElement>;
    // setting a width and height for the canvas
    @Input() public width = 800;
    @Input() public height = 100;

    icons: any[] = [];
    count = 0;
    private cx: CanvasRenderingContext2D;
    images: any[] = [];
    mouseover: any = null;
    mousedown: any = null;
    tour: any = null;

    init(): string {
        if (this.data) {
            if (this.data['height'] != null) {
                this.height = this.data['height'];
            }
            if (this.data['width'] != null) {
                this.width = this.data['width'];
            }
            if (this.data['ymax'] != null) {
                this.ymax = this.data['ymax'];
            }
            if (this.data['save'] != null) {
                this.saveFunction = LionEngine.ionfunctions[this.data['save']];
            }
            if (this.data['click'] != null) {
                this.clickFunction = LionEngine.ionfunctions[this.data['click']];
            }
            if (this.data['center']) {
                this.cssid = '__canvas_out';
            }

            if (this.data['listener'] != null) {
                this.listenerFunction = LionEngine.ionfunctions[this.data['listener']];
            }
            if (this.data['buttons']) {
                this.icons = this.data['buttons'];
            }
            if (this.data['background']) {
                this.background = this.data['background'];
            }
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }
    // Theme (orange outline you requested)
    private readonly BTN_ORANGE = 'rgba(83, 83, 83, 0.05)';

    private resetEffects(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = 'lightGray';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    private drawModernButton(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        state: { hover?: boolean; pressed?: boolean } = {},
        opts: {
            stroke?: string;
            fillTop?: string;
            fillBottom?: string;
            textColor?: string;
            font?: string;
            radius?: number;
        } = {}
    ) {
        const hover = !!state.hover;
        const pressed = !!state.pressed;

        const stroke = opts.stroke ?? this.BTN_ORANGE;
        const fillTop = opts.fillTop ?? 'rgba(255,255,255,0.98)';
        const fillBottom = opts.fillBottom ?? 'rgba(245,245,245,0.98)';
        const textColor = opts.textColor ?? 'rgba(25,25,25,0.95)';
        const font = opts.font ?? '600 10px Arial';
        const radius = opts.radius ?? 8;

        // Pressed/hover offsets for depth
        const lift = hover ? -1 : 0;
        const pressInset = pressed ? 1 : 0;

        const bx = x + pressInset;
        const by = y + pressInset + lift;
        const bw = w - pressInset * 2;
        const bh = h - pressInset * 2;

        ctx.save();

        // Shadow (professional feel)
        this.resetEffects(ctx);
        ctx.shadowColor = pressed ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = pressed ? 6 : (hover ? 14 : 10);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = pressed ? 2 : 4;

        // Shape
        this.roundRectPath(ctx, bx, by, bw, bh, radius);

        // Subtle vertical gradient fill
        const grad = ctx.createLinearGradient(0, by, 0, by + bh);
        if (pressed) {
            grad.addColorStop(0, fillBottom);
            grad.addColorStop(1, fillTop);
        } else {
            grad.addColorStop(0, fillTop);
            grad.addColorStop(1, fillBottom);
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Orange outline + a faint inner stroke
        ctx.lineWidth = hover ? 2.2 : 2;
        ctx.strokeStyle = stroke;
        ctx.stroke();

        // Inner highlight stroke (no shadow)
        this.resetEffects(ctx);
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        this.roundRectPath(ctx, bx + 1, by + 1, bw - 2, bh - 2, Math.max(0, radius - 1));
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Text
        ctx.font = font;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // tiny pressed shift for realism
        const ty = pressed ? 0.5 : 0;
        ctx.fillText(label, bx + bw / 2, by + bh / 2 + ty);

        ctx.restore();
    }

    getCount() {
        return this.count;
    }

    highlightButton(label: string) {
        // implement if needed
    }

    public ngAfterViewInit() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
        canvasEl.width = this.width;
        canvasEl.height = this.height;

        this.grid = new MGrid(0, 0, this.width, this.height);
        this.grid.setWidth(this.width);
        this.grid.setHeight(this.height);
        this.grid.setXi(0);
        this.grid.setYi(0);
        this.grid.rescale();

        if (this.data && this.data['grid']) {
            const g = this.data['grid'];
            this.grid.xmin = g.xmin;
            this.grid.xmax = g.xmax;
            this.grid.ymin = g.ymin;
            this.grid.ymax = g.ymax;
            this.grid.xinset = g.xinset;
            this.grid.yinset = g.yinset;
        }

        if (this.data && this.data['tour']) {
            this.tour = this.data['tour'];
        }

        const iid = setInterval(() => {
            this.redraw();
        }, 200);

        setTimeout(() => {
            clearInterval(iid);
        }, 10000);

        canvasEl.addEventListener('mousedown', (evt) => {
            const rect = canvasEl.getBoundingClientRect();
            evt.preventDefault();

            const ct = {
                x: this.grid.Xwc(evt.x - rect.left),
                y: this.grid.Ywc(evt.y - rect.top),
            };

            if (this.icons && this.icons.length > 0) {
                for (const b of this.icons) {
                    if (ct.x > b.x && ct.x < b.x + 1 && ct.y > b.y && ct.y < b.y + 1) {
                        if (b.ionFunction) {
                            this.mousedown = b;
                            LionEngine.ionfunctions[b.ionFunction]();
                        }
                    }
                }
            }
            this.redraw();
        });

        canvasEl.addEventListener('mouseup', () => {
            this.mousedown = null;
        });

        if (this.tour) {
            LionEngine.ionfunctions[this.tour](this, this.icons);
        }

        canvasEl.addEventListener('mousemove', (evt) => {
            const rect = canvasEl.getBoundingClientRect();
            evt.preventDefault();

            const ct = {
                x: this.grid.Xwc(evt.x - rect.left),
                y: this.grid.Ywc(evt.y - rect.top),
            };

            this.mouseover = null;
            for (const b of this.icons) {
                if (ct.x > b.x && ct.x < b.x + 1 && ct.y > b.y && ct.y < b.y + 1) {
                    this.mouseover = b;
                    if (b.mouseOver) {
                        LionEngine.ionfunctions[b.mouseOver]();
                    }
                }
            }

            this.redraw();
        });

        canvasEl.addEventListener('mouseover', (evt) => {
            const rect = canvasEl.getBoundingClientRect();
            evt.preventDefault();
            const ct = {
                x: this.grid.Xwc(evt.x - rect.left),
                y: this.grid.Ywc(evt.y - rect.top),
            };

            this.mouseover = null;
            for (const b of this.icons) {
                if (ct.x > b.x && ct.x < b.x + 1 && ct.y > b.y && ct.y < b.y + 1) {
                    this.mouseover = b;
                    if (b.mouseOver) {
                        LionEngine.ionfunctions[b.mouseOver]();
                    }
                }
            }
        });

        canvasEl.addEventListener('mouseleave', () => {
            this.mousedown = null;
            this.mouseover = null;
            this.redraw();
        });

        this.cx.lineWidth = 1;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';

        this.captureEvents(canvasEl);
        this.redraw();
    }

    setButtons(b: any[]) {
        this.icons = b;
        this.redraw();
    }

    setSize(w: number, h: number) {
        this.width = w;
        this.height = h;
        if (this.canvas) {
            const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
            canvasEl.width = this.width;
            canvasEl.height = this.height;
            this.grid.setWidth(canvasEl.width);
            this.grid.setHeight(canvasEl.height);
            this.grid.rescale();
            this.redraw();
        }
    }

    getCTX() {
        return this.cx;
    }

    getCanvas() {
        return this.canvas;
    }

    public getItem(x: number, y: number) {
        if (this.icons) {
            if (x < this.icons.length) {
                const row = this.icons[x];
                if (row && y < row.length) {
                    return row[y];
                }
            }
        }
        return null;
    }

    private captureEvents(canvasEl: HTMLCanvasElement) {
        this.grid.setWidth(canvasEl.width);
        this.grid.setHeight(canvasEl.height);
        this.grid.rescale();

        fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap((e) => {
                    const rect = canvasEl.getBoundingClientRect();
                    const x = (e as MouseEvent).clientX;
                    const y = (e as MouseEvent).clientY;

                    const wx = this.grid.Xwc(x - rect.left);
                    const wy = this.grid.Ywc(y - rect.top);
                    const xint = Math.floor(wx);
                    const yint = Math.floor(wy);

                    const item = this.getItem(yint, xint);
                    if (this.clickFunction && item != null) {
                        this.clickFunction(item);
                    }

                    return fromEvent(canvasEl, 'mousemove').pipe(
                        takeUntil(fromEvent(canvasEl, 'mouseup')),
                        takeUntil(fromEvent(canvasEl, 'mouseleave')),
                        pairwise()
                    );
                })
            )
            .subscribe(() => {
                // we don't actually draw freehand, so this is effectively a noop
            });

        fromEvent(canvasEl, 'movemove') // NOTE: this looks like a typo; leaving as-is
            .pipe(
                switchMap((e) => {
                    const rect = canvasEl.getBoundingClientRect();
                    const x = (e as MouseEvent).clientX;
                    const y = (e as MouseEvent).clientY;
                    const wx = this.grid.Xwc(x - rect.left);
                    const wy = this.grid.Ywc(y - rect.top);
                    const xint = Math.floor(wx);
                    const yint = Math.floor(wy);
                    const item = this.getItem(yint, xint);
                    this.mouseover = item;

                    return fromEvent(canvasEl, 'mousemove').pipe(
                        takeUntil(fromEvent(canvasEl, 'mouseleave')),
                        pairwise()
                    );
                })
            )
            .subscribe(() => {
                // hover tracking is handled above
            });
    }

    formatFiles() {
        const f: any = {};
        for (let x = 0; x < this.icons.length; x++) {
            const row = this.icons[x];
            for (let y = 0; y < row.length; y++) {
                const it = row[y];
                f[it['name']] = it['value'];
            }
        }
        return f;
    }

    public add(item: any) {
        this.count++;
        let added = false;
        if (this.icons.length === 0) {
            this.icons.push([item]);
            added = true;
        } else {
            for (let x = 0; x < this.icons.length; x++) {
                let row = this.icons[x];
                if (!row) {
                    row = [];
                }
                if (row.length < 10) {
                    added = true;
                    row.push(item);
                    this.icons[x] = row;
                }
            }
            if (!added) {
                this.icons.push([item]);
            }
        }
        if (this.listenerFunction) {
            this.listenerFunction(this.formatFiles());
        }
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.grid.setXi(0);
        this.grid.setYi(0);
        this.grid.setWidth(canvasEl.width);
        this.grid.setHeight(canvasEl.height);
        this.grid.rescale();
        this.redraw();
    }

    getFile(name: string) {
        for (let x = 0; x < this.icons.length; x++) {
            const row = this.icons[x];
            for (let y = 0; y < row.length; y++) {
                const it = row[y];
                if (it['name'] === name) {
                    return it;
                }
            }
        }
        return null;
    }

    redraw() {
        if (!this.canvas) return;

        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d') as CanvasRenderingContext2D;

        this.cx.shadowBlur = 1;
        this.cx.shadowColor = this.background;
        this.grid.xi = 0;
        this.grid.yi = 0;

        this.grid.setHeight(this.height);
        this.grid.setWidth(this.width);
        this.grid.rescale();

        // FULL CANVAS BACKGROUND == this.background
        this.cx.clearRect(0, 0, this.cx.canvas.width, this.cx.canvas.height);
        this.cx.fillStyle = this.background;
        this.cx.fillRect(0, 0, this.width, this.height);

        if (this.icons && this.icons.length > 0) {
            const cellwidth = this.grid.screenWidth(1);
            const cellheight = this.grid.screenHeight(1);
            const pad = 1;

            for (const i of this.icons) {
                const x = i.x;
                const y = i.y;

                const xx = this.grid.X(x);
                const yy = this.grid.Y(y + 1);

                const isHover = i === this.mouseover;
                const isDown = i === this.mousedown;

                // Resolve theme/custom overrides
                const stroke = i.stroke ?? this.BTN_ORANGE;
                const fillTop = i.backgroundTop ?? 'rgba(255,255,255,0.98)';
                const fillBottom = i.backgroundBottom ?? 'rgba(245,245,245,0.98)';
                const textColor = i.textColor ?? 'rgba(20,20,20,0.95)';
                const font = i.font ?? '600 10px Arial';
                const radius = i.radius ?? 8;

                // Ensure image is loaded/cached if icon exists
                let image = i.image;
                if (i.icon && !image) {
                    const img = new Image();
                    img.src = i.icon;
                    img.onload = () => {
                        i.image = img;
                        this.redraw(); // ensures it appears immediately once loaded
                    };
                    image = undefined;
                }

                // ----------------------------
                // Case A: Label (non-click)
                // ----------------------------
                if (i.islabel) {
                    this.resetEffects(this.cx);

                    // Light "tag" style label background (more professional than a raw rect)
                    this.cx.save();
                    this.cx.fillStyle = 'rgba(255, 247, 247, 1)';
                    this.cx.strokeStyle = 'rgba(0,0,0,0.10)';
                    this.cx.lineWidth = 1;

                    this.roundRectPath(
                        this.cx,
                        xx + pad,
                        yy + pad,
                        cellwidth - pad * 2,
                        cellheight - pad * 2,
                        7
                    );
                    this.cx.fill();
                    this.cx.stroke();

                    // Label text
                    this.cx.font = i.font ?? '600 10px Arial';
                    this.cx.fillStyle = i.textColor ?? 'rgba(0,0,0,0.75)';
                    this.cx.textAlign = 'center';
                    this.cx.textBaseline = 'middle';
                    this.cx.fillText(i.label ?? '', xx + cellwidth / 2, yy + cellheight / 2);

                    this.cx.restore();
                    continue;
                }

                // ----------------------------
                // Case B: Custom draw (optional)
                // Give it a consistent "button chrome" unless i.noChrome is true
                // ----------------------------
                if (i.draw) {
                    if (!i.noChrome) {
                        this.drawModernButton(
                            this.cx,
                            xx + pad,
                            yy + pad,
                            cellwidth - pad * 2,
                            cellheight - pad * 2,
                            '', // no label; custom draw will do content
                            { hover: isHover, pressed: isDown },
                            { stroke, fillTop, fillBottom, textColor, font, radius }
                        );
                    }

                    // Make sure custom draw isn't inheriting shadows
                    this.cx.save();
                    this.resetEffects(this.cx);

                    i.draw(this.grid, this.cx, isHover, isDown, image);

                    this.cx.restore();
                    continue;
                }

                // ----------------------------
                // Case C: Icon button
                // ----------------------------
                if (i.icon) {
                    // Draw the professional button container first
                    this.drawModernButton(
                        this.cx,
                        xx + pad,
                        yy + pad,
                        cellwidth - pad * 2,
                        cellheight - pad * 2,
                        '', // no label inside the container
                        { hover: isHover, pressed: isDown },
                        { stroke, fillTop, fillBottom, textColor, font, radius }
                    );

                    // Draw icon centered (no shadow)
                    if (image) {
                        this.cx.save();
                        this.resetEffects(this.cx);

                        // Icon sizing: keep a margin so it looks crisp
                        const innerPad = 1;
                        const iw = cellwidth - (pad * 2) - (innerPad * 2);
                        const ih = cellheight - (pad * 2) - (innerPad * 2);

                        // Center inside the button
                        const ix = xx + pad + innerPad;
                        const iy = yy + pad + innerPad;

                        this.cx.drawImage(image, ix, iy, iw, ih);

                        this.cx.restore();
                    }

                    continue;
                }

                // ----------------------------
                // Case D: Text button (default)
                // ----------------------------
                this.drawModernButton(
                    this.cx,
                    xx + pad,
                    yy + pad,
                    cellwidth - pad * 2,
                    cellheight - pad * 2,
                    i.label ?? '',
                    { hover: isHover, pressed: isDown },
                    { stroke, fillTop, fillBottom, textColor, font, radius }
                );
            }
        }

    }

}// MGrid unchanged
class MGrid {
    xi = 0;
    yi = 0;
    width: number;
    height: number;
    xinset = 0;
    yinset = 0;
    yLength: number;
    xscale = 1;
    yscale = 1;
    xshift = 0;
    yshift = 0;
    xmin = 0;
    ymin = 0;
    xmax = 1;
    ymax = 1;

    constructor(_xi: number, _yi: number, _width: number, _height: number) {
        this.width = _width;
        this.height = _height;
        this.xi = _xi;
        this.yi = _yi;
    }

    setDimension(_width: number, _height: number) {
        this.width = _width;
        this.height = _height;
    }
    setSize(_width: number, _height: number) {
        this.width = _width;
        this.height = _height;
    }

    setBounds(x: number, y: number, w: number, h: number) {
        this.width = w;
        this.height = h;
        this.xi = x;
        this.yi = y;
        this.rescale();
    }

    Xwc(xsc: number) {
        return ((xsc - this.xinset + this.xi) / this.xscale) - this.xshift;
    }

    Ywc(ysc: number) {
        return (this.yLength - ((ysc - this.yinset + this.yi) / this.yscale)) - this.yshift;
    }

    X(xwc: number) {
        const xsc = ((xwc + this.xshift) * this.xscale + this.xinset) + this.xi;
        return Math.round(xsc);
    }

    Y(ywc: number) {
        const ysc = ((this.yLength - (ywc + this.yshift)) * this.yscale + this.yinset) + this.yi;
        return Math.round(ysc);
    }

    worldHeight(screenHeight: number) {
        return (1 / this.yscale) * screenHeight;
    }

    worldWidth(screenWidth: number) {
        return (1 / this.xscale) * screenWidth;
    }

    screenHeight(worldHeight: number) {
        return Math.round(this.yscale * worldHeight);
    }

    screenWidth(worldWidth: number) {
        return Math.round(this.xscale * worldWidth);
    }

    rescale() {
        const xlength = this.xmax - this.xmin;
        const ylength = this.ymax - this.ymin;
        this.__rescale(xlength, ylength);
    }

    __rescale(xAxisLength: number, yAxisLength: number) {
        this.yLength = yAxisLength;
        this.xscale = (this.width - (2 * this.xinset)) / xAxisLength;
        this.yscale = (this.height - (2 * this.yinset)) / yAxisLength;
        this.xshift = -this.xmin;
        this.yshift = -this.ymin;
    }

    rescaleY(ymin: number, ymax: number) {
        this.ymin = ymin;
        this.ymax = ymax;
        this.yLength = this.ymax - this.ymin;
        this.yscale = (this.height - (2 * this.yinset)) / this.yLength;
        this.yshift = -this.ymin;
        return this.yscale;
    }

    rescaleX(xAxisLength: number) {
        this.xscale = (this.width - (2 * this.xinset)) / xAxisLength;
        this.xshift = -this.xmin;
    }

    setxmin(_xmin: number) {
        this.xmin = _xmin;
    }

    setymin(_ymin: number) {
        this.ymin = _ymin;
    }

    setxmax(_xmax: number) {
        this.xmax = _xmax;
    }

    setymax(_ymax: number) {
        this.ymax = _ymax;
    }

    resizeWorld(_xmin: number, _ymin: number, _xmax: number, _ymax: number) {
        this.xmin = _xmin;
        this.ymin = _ymin;
        this.xmax = _xmax;
        this.ymax = _ymax;
    }

    setOrigin(_xmin: number, _ymin: number) {
        this.xmin = _xmin;
        this.ymin = _ymin;
    }

    setInset(_xinset: number, _yinset: number) {
        this.xinset = _xinset;
        this.yinset = _yinset;
    }

    setXInset(_xinset: number) {
        this.xinset = _xinset;
    }

    getXInset() {
        return this.xinset;
    }

    setYInset(_inset: number) {
        this.yinset = _inset;
    }

    getYInset() {
        return this.yinset;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    getxmax() {
        return this.xmax;
    }

    getxmin() {
        return this.xmin;
    }

    getymin() {
        return this.ymin;
    }

    getymax() {
        return this.ymax;
    }

    setHeight(_height: number) {
        this.height = _height;
    }

    setWidth(_width: number) {
        this.width = _width;
    }

    getXi() {
        return this.xi;
    }

    getYi() {
        return this.yi;
    }

    setXi(_xi: number) {
        this.xi = _xi;
    }

    setYi(_yi: number) {
        this.yi = _yi;
    }
}
