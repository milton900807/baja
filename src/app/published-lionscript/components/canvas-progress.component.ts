import {
    Component, Input, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { LionEngine } from '../../../app/engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';

@Component({
    selector: 'progress-canvas',
    template: `
    <div class="baja-progress-wrap">
      <!-- Newspaper — shown ONLY while the progress bar is loading (progress < 100%). -->
      <div class="baja-news" *ngIf="showNews">
        <div class="baja-news-card">
          <div class="baja-news-head">
            <div class="baja-news-title">The Baja Times</div>
            <div class="baja-news-sub">{{ dateStr }} &nbsp;&bull;&nbsp; Genomics Edition</div>
          </div>
          <div class="baja-news-article" *ngFor="let m of news; let i = index" [class.bordered]="i > 0">
            <div class="baja-news-headline">{{ m }}</div>
          </div>
          <div class="baja-news-foot">loading&hellip;</div>
        </div>
      </div>
      <canvas [width]="width" [height]="height" #buttoncanvas__></canvas>
    </div>
    `,
    styles: [
        'canvas { border: 0px solid black; }',
        '.baja-progress-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }',
        '.baja-news { width: 100%; display: flex; justify-content: center; }',
        `.baja-news-card {
            width: min(560px, 86vw);
            background: #f6f1e3; color: #1a1a1a;
            border: 2px solid #1a1a1a;
            box-shadow: 0 16px 48px rgba(0,0,0,0.42);
            padding: 18px 24px;
            font-family: Georgia, 'Times New Roman', serif;
        }`,
        `.baja-news-head { text-align: center; border-bottom: 4px double #1a1a1a; padding-bottom: 8px; margin-bottom: 12px; }`,
        `.baja-news-title { font-size: 34px; font-weight: 900; letter-spacing: 1px; font-variant: small-caps; line-height: 1; }`,
        `.baja-news-sub { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #555; margin-top: 6px; }`,
        `.baja-news-article.bordered { border-top: 1px solid #cbb6a0; padding-top: 10px; margin-top: 10px; }`,
        `.baja-news-headline { font-size: 17px; font-weight: 700; line-height: 1.3; }`,
        `.baja-news-foot { text-align: center; font-size: 10px; color: #8a8172; margin-top: 14px; border-top: 1px solid #cbb6a0; padding-top: 8px; font-family: system-ui, sans-serif; }`,
    ]
})
export class CanvasProgressComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    grid: MGrid;
    background = 'white';
    ymax = 10;
    // Newspaper — OPT-IN: shows only when data['news'] (array) or data['showNews']=true
    // is passed, so ordinary/inline progress bars are unaffected.
    static DEFAULT_NEWS = [
        'Next week patents from 2020-2026 will be installed',
        'Sept 29 release of liver RNASeq data',
    ];
    news: string[] = CanvasProgressComponent.DEFAULT_NEWS;
    newsEnabled = false;
    dateStr = '';
    saveFunction;
    clickFunction;
    listenerFunction;
    private _sim: any;

    init(): string {
        try {
            this.dateStr = new Date().toLocaleDateString('en-US',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { }
        if (this.data) {
            // Opt-in newspaper: an array of headlines, or showNews:true for defaults.
            const n = this.data['news'] || this.data['newsMessages'];
            if (Array.isArray(n) && n.length) {
                this.news = n.map((x: any) => '' + x);
                this.newsEnabled = true;
            } else if (this.data['showNews']) {
                this.newsEnabled = true;
            }

            if (this.data['height'] != null) {
                this.height = Math.min(35, this.data['height'])   // cap at 35
            }
            if (this.data['width'] != null) {
                this.width = this.data['width']
            }
            if (this.data['ymax'] != null) {
                this.ymax = this.data['ymax']
            }
            if (this.data['save'] != null) {
                this.saveFunction = LionEngine.ionfunctions[this.data['save']]
            }
            if (this.data['click'] != null) {
                this.clickFunction = LionEngine.ionfunctions[this.data['click']]
            }

            if (this.data['listener'] != null) {
                this.listenerFunction = LionEngine.ionfunctions[this.data['listener']]
            }
            if (this.data['progressBar'] != null) {
                LionEngine.ionfunctions[this.data['progressBar']]((status_) => {
                    this.progress = status_ / 100;
                    this.redraw();
                })
            }
            if (this.data['buttons']) {
                this.icons = this.data['buttons']
            }
            // 'save': createIonFunction((id, content) => {
            // }),
            // 'click': createIonFunction((id, content) => {
            // });
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }
    // a reference to the canvas element from our template
    @ViewChild('buttoncanvas__') public canvas: ElementRef;
    // setting a width and height for the canvas
    @Input() public width = 500;
    @Input() public height = 35;   // max height 35
    icons = [];
    count = 0;
    private cx: CanvasRenderingContext2D;
    images = [];
    mouseover = null;
    private _progress = 0;
    private _completeTimer: any = null;
    mousedown = null;

    // The newspaper shows only when enabled AND while loading (progress below 100%).
    get showNews(): boolean {
        return this.newsEnabled
            && (this._progress == null || this._progress < 1)
            && !!(this.news && this.news.length);
    }

    get progress() { return this._progress; }
    set progress(v: number) {
        this._progress = v;
        // 10s after reaching 100% with no further updates, remove the bar.
        if (this._completeTimer) { clearTimeout(this._completeTimer); this._completeTimer = null; }
        if (v != null && v >= 1) {
            this._completeTimer = setTimeout(() => this._removeSelf(), 10000);
        }
    }

    private _removeSelf() {
        this._completeTimer = null;
        // Preferred: clear the progress bar's layout slot (lionscript global).
        try {
            const CL = (window as any).CurrentLayout;
            const panel = (this.data && this.data['panel']) || 'buttonMenuPanel';
            if (CL && typeof CL.clearComponent === 'function') { CL.clearComponent(panel); return; }
        } catch (e) { }
        // Fallback: remove/hide our own host element.
        try {
            const el = this.canvas && this.canvas.nativeElement;
            const host = el && el.closest ? el.closest('progress-canvas') : (el && el.parentElement);
            if (host && host.parentElement) host.parentElement.removeChild(host);
            else if (el && el.parentElement) el.parentElement.style.display = 'none';
        } catch (e) { }
    }



    getCount() {
        return this.count;
    }


    public ngAfterViewInit() {


        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        canvasEl.width = this.width;
        canvasEl.height = this.height;
        this.grid = new MGrid(0, 0, this.width, this.height);
        this.grid.setWidth(this.width);
        this.grid.setHeight(this.height);
        this.grid.setXi(0);
        this.grid.setYi(0);
        this.grid.rescale();

        if (this.data['grid']) {
            let g = this.data['grid']
            this.grid.xmin = g.xmin;
            this.grid.xmax = g.xmax;
            this.grid.ymin = g.ymin;
            this.grid.ymax = g.ymax;
            this.grid.xinset = g.xinset;
            this.grid.yinset = g.yinset;
        } else {
            this.grid.xmin = 0;
            this.grid.xmax = 100;
            this.grid.ymin = 0;
            this.grid.ymax = 1;
        }

        if (this.data['progress']) {
            this.progress = this.data['progress']
        }

        canvasEl.addEventListener('mousedown', (evt) => {
            const rect = canvasEl.getBoundingClientRect();
            evt.preventDefault();    // <-- this

            const ct = {
                x: this.grid.Xwc(evt.x - rect.left),
                y: this.grid.Ywc(evt.y - rect.top)
            };

            for (let b of this.icons) {
                if (ct.x > b.x && ct.x < (b.x + 1)) {
                    if (ct.y > b.y && ct.y < b.y + 1) {
                        // console.log(' ---- '+ b.label)
                        if (b.ionFunction) {
                            this.mousedown = b;
                            LionEngine.ionfunctions[b.ionFunction]()
                        }
                    }

                }
            }
            this.redraw();
        })

        canvasEl.addEventListener('mouseup', (evt) => {
            // this.mouseover = null;
            this.mousedown = null;
        })


        canvasEl.addEventListener('mousemove', (evt) => {
            const rect = canvasEl.getBoundingClientRect();
            evt.preventDefault();    // <-- this

            const ct = {
                x: this.grid.Xwc(evt.x - rect.left),
                y: this.grid.Ywc(evt.y - rect.top)
            };

            for (let b of this.icons) {
                if (ct.x > b.x && ct.x < (b.x + 1)) {
                    if (ct.y > b.y && ct.y < b.y + 1) {
                        console.log(' ---- ' + b.label)
                        this.mouseover = b;
                        if (b.mouseOver) {
                            LionEngine.ionfunctions[b.mouseOver]()
                        }
                    }

                }
            }

            this.redraw();
            // this.redraw();
        })

        canvasEl.addEventListener('mouseleave', (evt) => {

            this.mousedown = null;
            this.mouseover = null;

            this.redraw();
            // this.redraw();
        })



        // canvasEl.addEventListener('mouseup', (evt) => {
        //     const rect = canvasEl.getBoundingClientRect();
        //     const ct = {
        //         x: evt.x - rect.left,
        //         y: evt.y - rect.top
        //     };
        //     // this.redraw();
        // })
        // set some default properties about the line
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';
        // we'll implement this method to start capturing mouse events
        this.captureEvents(canvasEl);
        // make sure the images are loaded before we redraw. 
        setTimeout(() => {
            this.redraw();
        }, 1000)
        // setTimeout(() => {
        //     this.redraw();
        // }, 2000)
        // setTimeout(() => {
        //     this.redraw();
        // }, 5000)
    }


    setSize(w, h) {
        this.width = w;
        this.height = Math.min(35, h);   // cap at 35
    }


    getCTX() {
        return this.cx;
    }

    getCanvas() {
        return this.canvas;
    }

    public getItem(x, y) {
        if (this.icons) {
            if (x < this.icons.length) {
                let row = this.icons[x]
                if (y < row.length)
                    return row[y]
            }
        }
        return null;
    }


    private captureEvents(canvasEl: HTMLCanvasElement) {
        // this will capture all mousedown events from the canvas element

        this.grid.setWidth(canvasEl.width);
        this.grid.setHeight(canvasEl.height);
        this.grid.rescale();

        fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap((e) => {
                    const rect = canvasEl.getBoundingClientRect();
                    let x = e["clientX"];
                    let y = e["clientY"];

                    let wx = this.grid.Xwc(x - rect.left)
                    let wy = this.grid.Ywc(y - rect.top)
                    let xint = Math.floor(wx);
                    let yint = Math.floor(wy);
                    // console.log(' wx ' + xint);
                    // console.log(' wy' + yint);
                    let item = this.getItem(yint, xint);
                    // console.log ( " item " + item );
                    if (this.clickFunction && item != null) {
                        this.clickFunction(item)
                    }
                    // after a mouse down, we'll record all mouse moves
                    return fromEvent(canvasEl, 'mousemove')
                        .pipe(
                            // we'll stop (and unsubscribe) once the user releases the mouse
                            // this will trigger a 'mouseup' event    
                            takeUntil(fromEvent(canvasEl, 'mouseup')),
                            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
                            takeUntil(fromEvent(canvasEl, 'mouseleave')),
                            // pairwise lets us get the previous value to draw a line from
                            // the previous point to the current point    
                            pairwise()
                        )
                })
            )
            .subscribe((res: [MouseEvent, MouseEvent]) => {
                const rect = canvasEl.getBoundingClientRect();

                // previous and current position with the offset
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };
            });



        fromEvent(canvasEl, 'movemove')
            .pipe(
                switchMap((e) => {
                    const rect = canvasEl.getBoundingClientRect();
                    let x = e["clientX"];
                    let y = e["clientY"];
                    let wx = this.grid.Xwc(x - rect.left)
                    let wy = this.grid.Ywc(y - rect.top)
                    let xint = Math.floor(wx);
                    let yint = Math.floor(wy);
                    // console.log(' wx ' + xint);
                    // console.log(' wy' + yint);
                    let item = this.getItem(yint, xint);
                    console.log(" item " + item);
                    return fromEvent(canvasEl, 'mousemove')
                        .pipe(
                            takeUntil(fromEvent(canvasEl, 'mouseleave')),
                            pairwise()
                        )
                })
            )
            .subscribe((res: [MouseEvent, MouseEvent]) => {
                const rect = canvasEl.getBoundingClientRect();
                // previous and current position with the offset
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                let xint = res[0].clientX;
                let yint = res[0].clientY;
                let item = this.getItem(yint, xint);
                // console.log("--> item " + item);
                this.mouseover = item;


                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };
            });






    }
    // --- drop these helpers somewhere in your class/object ---
    _clamp01(v) { return Math.max(0, Math.min(1, v)); }
    _mix(a, b, t) { return a + (b - a) * t; }
    _hypot3(dx, dy, dz) { return Math.sqrt(dx * dx + dy * dy + dz * dz); }

    // minimal sim state holder; you can tweak these knobs
    _initSimIfNeeded(ctx) {
        this._sim = this._sim || {
            N: 64,
            r: 4,
            duration: 240,
            hold: 90,
            pingpong: true,
            colors: ['#66B3FF', '#FFD166', '#EF476F'],
            builtForSize: { w: 0, h: 0 },
            lastTime: 0,
            frame: 0,
            _ema: 0
        };
        // build buffers on first run or size change
        const S = this._sim;
        const W = ctx.canvas.width, H = ctx.canvas.height;
        if (S.x && S.builtForSize.w === W && S.builtForSize.h === H) return;

        const N = S.N | 0;
        S.x = new Float32Array(N); S.y = new Float32Array(N); S.z = new Float32Array(N);
        S.vx = new Float32Array(N); S.vy = new Float32Array(N); S.vz = new Float32Array(N);
        S.x0 = new Float32Array(N); S.y0 = new Float32Array(N); S.z0 = new Float32Array(N);
        S.x1 = new Float32Array(N); S.y1 = new Float32Array(N); S.z1 = new Float32Array(N);
        S.elem = new Uint8Array(N); S.tempScale = new Float32Array(N); S.dragScale = new Float32Array(N);
        S.bonds_i = new Uint32Array(N - 1); S.bonds_j = new Uint32Array(N - 1);
        for (let k = 0; k < N - 1; k++) { S.bonds_i[k] = k; S.bonds_j[k] = k + 1; }
        S.bondBroken = new Uint8Array(S.bonds_i.length);
        S.bondCooldown = new Uint16Array(S.bonds_i.length);
        S.restJitter = new Float32Array(S.bonds_i.length);

        // hbonds (unused visually, but kept)
        const half = Math.floor(N / 2);
        const hb = Math.max(0, half - 1);
        S.hbonds_i = new Uint32Array(hb);
        S.hbonds_j = new Uint32Array(hb);
        for (let i = 0; i < hb; i++) { const j = (S.N - 1) - i; S.hbonds_i[i] = i; S.hbonds_j[i] = j; }
        S.hbondBroken = new Uint8Array(S.hbonds_i.length);
        S.hbondCooldown = new Uint16Array(S.hbonds_i.length);

        // initial + target layouts
        const size = Math.min(W, H) * 0.65;
        const cx = W / 2, cy = H / 2;
        const left = cx - size / 2, right = cx + size / 2;
        const top = cy - size / 2;
        const ZMAX = size * 0.35;
        const randu = () => Math.random() * 2 - 1;
        const spacing = size / (N + 2);

        for (let i = 0; i < N; i++) {
            const t = i / (N - 1);
            const x0 = this._mix(left + spacing, right - spacing, t);
            const arc = Math.sin((t - 0.5) * Math.PI) * (size * 0.10);
            const y0 = cy + arc;
            const z0 = Math.cos((t - 0.5) * Math.PI) * (ZMAX * 0.12);
            S.x0[i] = x0; S.y0[i] = y0; S.z0[i] = z0;
            S.x[i] = x0; S.y[i] = y0; S.z[i] = z0;
            S.elem[i] = i % 3;
            S.tempScale[i] = 0.75 + Math.random() * 1.5;
            S.dragScale[i] = 0.7 + Math.random() * 0.8;
        }
        for (let k = 0; k < S.restJitter.length; k++) {
            S.restJitter[k] = 0.9 + Math.random() * 0.25;
        }

        const vSpacing = size / (Math.floor(N / 2) + 4);
        const gap = Math.max(spacing * 1.2, size * 0.08);
        const xL = cx - gap / 2, xR = cx + gap / 2;
        const yStart = top + vSpacing * 2;
        const halfN = Math.floor(N / 2);
        for (let i = 0; i < halfN; i++) {
            S.x1[i] = xL + 4 * randu(); S.y1[i] = yStart + i * vSpacing + 4 * randu();
            S.z1[i] = -ZMAX * (0.10 + 0.08 * (i / Math.max(1, halfN - 1))) + ZMAX * 0.02 * randu();
        }
        for (let i = halfN; i < N; i++) {
            const j = i - halfN;
            S.x1[i] = xR + 4 * randu(); S.y1[i] = yStart + (halfN - 1 - j) * vSpacing + 4 * randu();
            S.z1[i] = +ZMAX * (0.10 + 0.08 * (j / Math.max(1, halfN - 1))) + ZMAX * 0.02 * randu();
        }
        const bend = vSpacing * 0.9;
        if (halfN - 1 >= 0 && halfN < N) {
            S.x1[halfN - 1] = this._mix(xL, cx, 0.4); S.y1[halfN - 1] -= bend * 0.4; S.z1[halfN - 1] += ZMAX * (0.10 + 0.02 * randu());
            S.x1[halfN] = this._mix(xR, cx, 0.4); S.y1[halfN] -= bend * 0.4; S.z1[halfN] += ZMAX * (0.10 + 0.02 * randu());
        }

        S.builtForSize = { w: W, h: H };
        S.frame = 0;
        S._ema = 0;
    }

    // --- call this each frame BEFORE your redraw(); it advances the sim
    _simStep(ctx) {
        this._initSimIfNeeded(ctx);
        const S = this._sim;

        // time
        const now = performance.now();
        const dtMs = Math.min(50, now - (S.lastTime || now));
        S.lastTime = now;
        const dt = dtMs / 1000;

        // geom
        const W = ctx.canvas.width, H = ctx.canvas.height;
        const size = Math.min(W, H) * 0.65;
        const ZMAX = size * 0.35;

        // fold timing
        const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const dur = S.duration | 0, hold = S.hold | 0;
        let tFold = 0;
        if (S.pingpong) {
            const total = (dur + hold) * 2;
            const f = S.frame % total;
            if (f < dur) tFold = easeInOut(f / dur);
            else if (f < dur + hold) tFold = 1;
            else if (f < 2 * dur + hold) tFold = easeInOut(1 - (f - (dur + hold)) / dur);
            else tFold = 0;
        } else {
            const f = S.frame % (dur + hold);
            tFold = (f < dur) ? easeInOut(f / dur) : 1;
        }

        // dynamics
        const kTarget = 28, kBackbone = 58, zetaBase = 8;
        const restLenBase = Math.min(size / (S.N + 1), 44);

        const AMP = 10, tempMax = 520 * AMP, baseJitter = 90 * AMP;
        const timeWobble = 1 + 0.25 * Math.sin(S.frame * 0.07);
        const tempBase = ((1 - tFold * 0.6) * tempMax + baseJitter) * timeWobble;

        const randu = () => Math.random() * 2 - 1;
        const randn = () => { let s = 0; for (let i = 0; i < 5; i++) s += randu(); if (Math.random() < 0.06) s += 6 * randu(); return s; };

        const pad = 10;
        const xU = S.x0, yU = S.y0, zU = S.z0;
        const xT = S.x1, yT = S.y1, zT = S.z1;

        const N = S.N | 0;
        for (let i = 0; i < N; i++) {
            const xi = S.x[i], yi = S.y[i], zi = S.z[i];
            const tx = this._mix(xU[i], xT[i], tFold);
            const ty = this._mix(yU[i], yT[i], tFold);
            const tz = this._mix(zU[i], zT[i], tFold);

            let fx = kTarget * (tx - xi);
            let fy = kTarget * (ty - yi);
            let fz = kTarget * (tz - zi);

            // neighbors
            if (i > 0 && !S.bondBroken[i - 1]) {
                const j = i - 1;
                const dx = S.x[j] - xi, dy = S.y[j] - yi, dz = S.z[j] - zi;
                const d = this._hypot3(dx, dy, dz) || 1e-6;
                const rest = restLenBase * S.restJitter[i - 1];
                const ext = d - rest;
                const s = kBackbone * ext / d;
                fx += s * dx; fy += s * dy; fz += s * dz;
            }
            if (i + 1 < N && !S.bondBroken[i]) {
                const j = i + 1;
                const dx = S.x[j] - xi, dy = S.y[j] - yi, dz = S.z[j] - zi;
                const d = this._hypot3(dx, dy, dz) || 1e-6;
                const rest = restLenBase * S.restJitter[i];
                const ext = d - rest;
                const s = kBackbone * ext / d;
                fx += s * dx; fy += s * dy; fz += s * dz;
            }

            // viscous drag
            const zeta = zetaBase * S.dragScale[i];
            fx += -zeta * S.vx[i]; fy += -zeta * S.vy[i]; fz += -zeta * S.vz[i];

            // Brownian
            const sigma = tempBase * S.tempScale[i] * Math.sqrt(Math.max(dt, 1 / 1000));
            fx += sigma * randn(); fy += sigma * randn(); fz += sigma * randn();
            if (Math.random() < 0.025) { S.vx[i] += 0.5 * sigma * randu(); S.vy[i] += 0.5 * sigma * randu(); S.vz[i] += 0.5 * sigma * randu(); }

            // integrate
            S.vx[i] += fx * dt; S.vy[i] += fy * dt; S.vz[i] += fz * dt;
            let xn = S.x[i] + S.vx[i] * dt;
            let yn = S.y[i] + S.vy[i] * dt;
            let zn = S.z[i] + S.vz[i] * dt;

            // confine
            if (xn < pad) { xn = pad; S.vx[i] *= -0.25; }
            else if (xn > W - pad) { xn = W - pad; S.vx[i] *= -0.25; }
            if (yn < pad) { yn = pad; S.vy[i] *= -0.25; }
            else if (yn > H - pad) { yn = H - pad; S.vy[i] *= -0.25; }
            if (zn < -ZMAX) { zn = -ZMAX; S.vz[i] *= -0.2; }
            else if (zn > ZMAX) { zn = ZMAX; S.vz[i] *= -0.2; }

            S.x[i] = xn; S.y[i] = yn; S.z[i] = zn;
        }

        // break/heal bonds
        const BREAK_STRETCH = 1.75, HEAL_STRETCH = 1.15, BREAK_COOLDOWN = 45;
        for (let k = 0; k < S.bonds_i.length; k++) {
            const i = S.bonds_i[k], j = S.bonds_j[k];
            const d = this._hypot3(S.x[j] - S.x[i], S.y[j] - S.y[i], S.z[j] - S.z[i]) || 1e-6;
            const rest = restLenBase * S.restJitter[k];
            const stretch = d / rest;

            if (!S.bondBroken[k]) {
                if (stretch >= BREAK_STRETCH) { S.bondBroken[k] = 1; S.bondCooldown[k] = BREAK_COOLDOWN; }
            } else {
                if (S.bondCooldown[k] > 0) S.bondCooldown[k]--;
                else if (stretch <= HEAL_STRETCH) S.bondBroken[k] = 0;
            }
        }

        S.frame++;
    }

    // --- returns a 0..1 progress; call after _simStep()
    _simProgress(_sim: any) {
        const S = this._sim;
        if (!S || !S.x || !S.x1) return 0;

        const N = S.N | 0;
        let acc = 0, cnt = 0;

        // positional alignment (current → target relative to initial)
        for (let i = 0; i < N; i++) {
            const d0 = this._hypot3(S.x0[i] - S.x1[i], S.y0[i] - S.y1[i], S.z0[i] - S.z1[i]) || 1e-6;
            const dc = this._hypot3(S.x[i] - S.x1[i], S.y[i] - S.y1[i], S.z[i] - S.z1[i]);
            const pi = 1 - this._clamp01(dc / d0); // 0..1
            acc += pi; cnt++;
        }
        const posProgress = cnt ? acc / cnt : 0;

        // bond integrity
        let intact = 0, total = S.bonds_i ? S.bonds_i.length : 0;
        if (total) for (let k = 0; k < total; k++) if (!S.bondBroken[k]) intact++;
        const bondProgress = total ? intact / total : 1;

        // combine + EMA smoothing
        const combined = this._clamp01(0.75 * posProgress + 0.25 * bondProgress);
        S._ema = (S._ema == null) ? combined : (0.85 * S._ema + 0.15 * combined);
        return this._clamp01(S._ema);
    }


    // Add these private fields to your class:
    private _animId: number | null = null;
    private _phase = 0;           // spinning phase
    private _lastT = 0;           // last timestamp for smooth delta
    private _spinSpeed = 2.5;     // radians per second
    private _helixHz = 1.75;      // helix cycles across full width (tweak to taste)

    // Call this once to start the loop
    startHelix() {
        if (this._animId != null) return;
        const step = (_t: number) => {
            // 1) update the folding simulation (also builds it lazily on first run)
            if (!this.cx && this.canvas) {
                this.cx = this.canvas.nativeElement.getContext('2d')!;
            }
            if (this.cx) {
                this._simStep(this.cx);         // advance physics once
                this.progress = this._simProgress(this._sim); // 0..1 from sim
            }

            // 2) redraw UI (panel + new progress bar)
            this.redraw();

            this._animId = requestAnimationFrame(step);
        };
        this._animId = requestAnimationFrame(step);
    }

    // Optional: stop the loop (e.g., on destroy)
    stopHelix() {
        if (this._animId != null) cancelAnimationFrame(this._animId);
        this._animId = null;
        this._lastT = 0;
    }

    // ====== REDRAW WITH SPINNING DOUBLE HELIX PROGRESS ======
    redraw() {
        if (!this.cx) {
            if (!this.canvas) return;
            const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
            this.cx = canvasEl.getContext('2d')!;
        }
        const ctx = this.cx;

        // Grid sizing
        this.grid.setHeight(this.height);
        this.grid.setWidth(this.width);
        this.grid.rescale();

        let xi = this.grid.xi;
        const yi = this.grid.yi;
        let gw = this.grid.width;
        const gh = this.grid.height;

        // Shorter, centered progress panel: cap the panel width and center it within the
        // (white) canvas so it doesn't stretch the full slot width.
        const __maxPanelW = 420;
        if (gw > __maxPanelW) {
            xi = xi + (gw - __maxPanelW) / 2;
            gw = __maxPanelW;
        }

        // ---- Helpers ----
        const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
            const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
            ctx.beginPath();
            ctx.moveTo(x + rr, y);
            ctx.arcTo(x + w, y, x + w, y + h, rr);
            ctx.arcTo(x + w, y + h, x, y + h, rr);
            ctx.arcTo(x, y + h, x, y, rr);
            ctx.arcTo(x, y, x + w, y, rr);
            ctx.closePath();
        };

        // ---- Background ----
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        // ---- Raised panel ----
        const radius = Math.min(12, Math.floor(Math.min(gw, gh) * 0.15));

        // Shadow under panel
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        roundRect(xi, yi, gw, gh, radius);

        // White panel with a subtle light gradient (so the aqua→navy fill reads on it).
        const panelGrad = ctx.createLinearGradient(0, yi, 0, yi + gh);
        panelGrad.addColorStop(0, '#ffffff');   // white
        panelGrad.addColorStop(1, '#eef2f6');   // very light grey
        ctx.fillStyle = panelGrad;
        ctx.fill();
        ctx.restore();

        // Top gloss
        ctx.save();
        roundRect(xi, yi, gw, gh, radius);
        ctx.clip();
        const gloss = ctx.createLinearGradient(0, yi, 0, yi + gh * 0.55);
        gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
        gloss.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gloss;
        ctx.fillRect(xi, yi, gw, gh * 0.55);
        ctx.restore();

        // Beveled edge
        ctx.save();
        roundRect(xi + 0.5, yi + 0.5, gw - 1, gh - 1, Math.max(0, radius - 1));
        const edgeGrad = ctx.createLinearGradient(xi, yi, xi + gw, yi + gh);
        edgeGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
        edgeGrad.addColorStop(1, 'rgba(0,0,0,0.20)');
        ctx.lineWidth = 1;
        ctx.strokeStyle = edgeGrad;
        ctx.stroke();
        ctx.restore();

        // Inner rim
        ctx.save();
        roundRect(xi + 1.5, yi + 1.5, gw - 3, gh - 3, Math.max(0, radius - 2));
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(26,163,189,0.55)';
        ctx.stroke();
        ctx.restore();

        // ---- Progress Bar (measured by folding sim) ----
        {
            // Clip to panel interior
            ctx.save();
            roundRect(xi + 2, yi + 2, gw - 4, gh - 4, Math.max(0, radius - 2));
            ctx.clip();

            const trackMargin = Math.max(8, Math.floor(gh * 0.15));
            const barH = Math.max(6, Math.floor(gh * 0.22));
            const barWMax = gw - trackMargin * 2;
            const barX = xi + trackMargin;
            const barY = yi + gh / 2 - barH / 2;
            const rr = Math.min(barH / 2, 10);

            // Track: a faint navy-grey groove on the white panel.
            const trackGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
            trackGrad.addColorStop(0, 'rgba(10,37,64,0.07)');
            trackGrad.addColorStop(1, 'rgba(10,37,64,0.13)');
            ctx.fillStyle = trackGrad;
            roundRect(barX, barY, barWMax, barH, rr); ctx.fill();

            // Fill: a HORIZONTAL gradient across the full track — aqua at the start,
            // deepening to navy at the end — clipped to the filled width, so the bar
            // "starts off aqua and turns navy" as it advances.
            const p = this._clamp01(this.progress || 0);
            if (p > 0) {
                const fillW = Math.max(1, Math.floor(barWMax * p));
                const fillGrad = ctx.createLinearGradient(barX, barY, barX + barWMax, barY);
                fillGrad.addColorStop(0, '#4fd0e6');    // aqua (start)
                fillGrad.addColorStop(0.55, '#1aa3bd'); // teal (mid)
                fillGrad.addColorStop(1, '#0a2540');    // navy (end)
                ctx.fillStyle = fillGrad;
                roundRect(barX, barY, fillW, barH, rr); ctx.fill();

                // subtle gloss
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = 'white';
                roundRect(barX + 2, barY + 2, Math.max(0, fillW - 4), Math.max(1, barH * 0.35), rr - 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // % label — dark navy, readable on the white panel and the aqua/teal fill.
            const label = Math.round(p * 100) + '%';
            ctx.font = `600 ${Math.max(12, Math.floor(gh * 0.18))}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Soft white halo so it stays legible if the fill reaches the center.
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.strokeText(label, xi + gw / 2, yi + gh / 2);
            ctx.fillStyle = '#0a2540';
            ctx.fillText(label, xi + gw / 2, yi + gh / 2);

            ctx.restore();
        }

    }
}



class MGrid {
    /*
     * Initial 'x' screen coordinate
     */
    xi = 0;
    yi = 0;
    /*
     * Width of the graph ( screen coordinates )
     */
    width;
    /*
     * Height of the graph ( screen coordinates )
     */
    height;
    /*
     * Insets ( screen coordinates )
     */
    xinset = 0;
    yinset = 0;
    /*
     * ymax - ymin; (world coordinates )
     */
    yLength;
    /*
     * 'x' coordinate conversion ratio ( sc/wc )
     */
    xscale = 1;
    /*
     * 'y' coordinate conversion ratio ( sc/wc )
     */
    yscale = 1;
    /*
     * The current 'x' world coordinate displacement
     */
    xshift = 0;
    /*
     * The current 'y' world coordinate displacement
     */
    yshift = 0;
    /*
     * xmin ( world coordinates )
     */
    xmin = 0;
    /*
     * ymin ( world coordinates )
     */
    ymin = 0;
    /*
     * xmax (world coordinates )
     */
    xmax = 1;
    /*
     * ymax (world coordinates )
     */
    ymax = 1;

    /**
     * Constructs the Grid with the current shape
     */
    constructor(_xi, _yi, _width, _height) {
        this.width = _width;
        this.height = _height;
        this.xi = _xi;
        this.yi = _yi;
    }




    /**
     * Resizes the screen coordinates to the new dimensions
     */
    setDimension(_width, _height) {
        this.width = _width;
        this.height = _height;
    }
    setSize(_width, _height) {
        this.width = _width;
        this.height = _height;
    }

    /**
     * Reshapes all the screen coordinates
     */
    setBounds(x, y, w, h) {
        this.width = w;
        this.height = h;
        this.xi = x;
        this.yi = y;
        this.rescale();
    }

    /**
     * Converts the 'x' screen coordinate to the corresponding 'x' world
     * coordinate
     */
    Xwc(xsc) {
        let xwc = ((xsc - this.xinset + this.xi) / this.xscale) - this.xshift;
        return xwc;
    }

    /**
     * Converts the 'y' screen coordinate to the corresponding 'y' world
     * coordinate
     */
    Ywc(ysc) {
        let ywc = (this.yLength - ((ysc - this.yinset + this.yi) / this.yscale)) - this.yshift;            // fixed.
        return ywc;
    }

    /**
     * Converts the 'x' world coordinate to the corrsponding 'x' screen
     * coordinate
     */
    X(xwc) {
        let xsc = ((xwc + this.xshift) * this.xscale + this.xinset) + this.xi;
        // console.log ( ' this.xscale ' + this.xscale );
        // console.log ( ' xwc : ' + xwc  + ' -- > ' + xsc );
        return Math.round(xsc);
    }

    /**
     * Converts the 'y' world coordinate to the corresponding 'y' screen
     * coordinate
     */
    Y(ywc) {
        let ysc = ((this.yLength - (ywc + this.yshift)) * this.yscale + this.yinset) + this.yi;
        return Math.round(ysc);
    }

    /**
     * Returns the world height for the screen height
     */
    worldHeight(screenHeight) {
        return (1 / this.yscale) * screenHeight;
    }

    /**
     * Returns the world width for the screen height
     */
    worldWidth(screenWidth) {
        return (1 / this.xscale) * screenWidth;
    }

    /**
     * Returns the screen height for the world height
     */
    screenHeight(worldHeight) {
        return Math.round((this.yscale) * worldHeight);
    }

    /**
     * Returns the screen width for the world widht.
     */
    screenWidth(worldWidth) {
        return Math.round((this.xscale) * worldWidth);
    }

    /**
     * Rescales the grid to current world coordinate values.
     */
    rescale() {
        let xlength = this.xmax - this.xmin;
        let ylength = this.ymax - this.ymin;
        this.__rescale(xlength, ylength);
    }

    /**
     * Rescales the coordinates to the new world ranges.
     */
    __rescale(xAxisLength, yAxisLength) {
        this.yLength = yAxisLength;
        this.xscale = (this.width - (2 * this.xinset)) / (xAxisLength);
        this.yscale = (this.height - (2 * this.yinset)) / (yAxisLength);
        this.xshift = -this.xmin;
        this.yshift = -this.ymin;
        // debugger;
    }

    /**
     * Rescales the y direction
     */
    rescaleY(ymin, ymax) {
        this.ymin = ymin;
        this.ymax = ymax;
        this.yLength = this.ymax - this.ymin;
        this.yscale = (this.height - (2 * this.yinset)) / (this.yLength);
        this.yshift = -this.ymin;
        return this.yscale;
    }

    /**
     * Rescales the x direction
     */
    rescaleX(xAxisLength) {
        this.xscale = (this.width - (2 * this.xinset)) / (xAxisLength);
        this.xshift = -this.xmin;
    }

    /**
     * Sets the new xmin
     */
    setxmin(_xmin) {
        this.xmin = _xmin;
    }

    /**
     * Sets the new ymin
     */
    setymin(_ymin) {
        this.ymin = _ymin;
    }

    /**
     * Sets the new xmax
     */
    setxmax(_xmax) {
        this.xmax = _xmax;
    }

    /**
     * Sets the new ymax
     */
    setymax(_ymax) {
        this.ymax = _ymax;
    }

    resizeWorld(_xmin, _ymin, _xmax, _ymax) {
        this.xmin = _xmin;
        this.ymin = _ymin;
        this.xmax = _xmax;
        this.ymax = _ymax;
    }

    /**
     * Initialize the origin of each axis. This will copy the new values for
     * xmin and ymin respectively.
     */
    setOrigin(_xmin, _ymin) {
        this.xmin = _xmin;
        this.ymin = _ymin;
    }

    setInset(_xinset, _yinset) {
        this.xinset = _xinset;
        this.yinset = _yinset;
    }

    /**
     * Sets the insets
     */
    setXInset(_xinset) {
        this.xinset = _xinset;
    }

    getXInset() {
        return this.xinset;
    }

    setYInset(_inset) {
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

    setHeight(_height) {
        this.height = _height;
    }

    setWidth(_width) {
        this.width = _width;
    }

    getXi() {
        return this.xi;
    }

    getYi() {
        return this.yi;
    }

    setXi(_xi) {
        this.xi = _xi;
    }

    setYi(_yi) {
        this.yi = _yi;
    }

}