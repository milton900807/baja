import {
    Component, Input, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { LionEngine } from '../../../app/engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';

@Component({
    selector: 'base64',
    template: `
        <br><canvas [width]="width" [height]="height" #canvas></canvas><br>
    `,
    styles: ['canvas { border: 0px solid black; }']
})
export class ImageBase64 implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    grid: MGrid;
    background = 'lightGray';
    ymax = 10;
    saveFunction;
    clickFunction;
    listenerFunction;
    image;
    drawText;
    overrideWidth = false;
    overrideHeight = false;
    folder = `iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ9JREFUaIHt1FkKgEAMBNEoHtyb6wV03JJUC12Qr4HAYyAREVvSnLUO3lKqBmxRjOgAlCK6AGWITkAJohuQjiAAqQgKkIYgASkIGvAZoQD4hFABvEYoAV4h1ACPEYqARwhVwG2EMuAWQh0wRCxXuoSmyuVz5fKODKAzgG6K8QlU6vCa/f4HDKAzgM4AOgPoDKAzgM4AOgPoDKAzgM4Auh3nL+VxLv/m3QAAAABJRU5ErkJggg==`
    init(): string {
        if (this.data) {

            if (this.data['height'] != null) {
                this.height = this.data['height']
            }
            if (this.data['drawTextFunction'] != null) {
                this.drawText = LionEngine.ionfunctions[this.data['drawTextFunction']]
            }
            if (this.data['image'] != null) {

                this.folder = this.data['image']
                this.image = new Image();
                if (this.folder.startsWith('data:image')) {
                    this.image.src = this.folder;
                } else {
                    this.image.src = "data:image/png;base64," + this.folder;
                }
            }
            if (this.data['width'] != null) {
                this.overrideWidth = true;
                this.width = this.data['width']
            }
            if (this.data['ymax'] != null) {
                this.overrideHeight = true;
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
        }
        if (!this.image) {
            this.image = new Image();
            if (this.folder.startsWith('data:image')) {
                this.image.src = this.folder;
            } else {
                this.image.src = "data:image/png;base64," + this.folder;
            }
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }
    // a reference to the canvas element from our template
    @ViewChild('canvas') public canvas: ElementRef;
    // setting a width and height for the canvas
    @Input() public width = 200;
    @Input() public height = 100;
    icons = [];
    count = 0;
    private cx: CanvasRenderingContext2D;
    getCount() {
        return this.count;
    }
    public ngAfterViewInit() {
        // get the context
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        // set the width and height
        canvasEl.width = this.width;
        canvasEl.height = this.height;
        this.grid = new MGrid(0, 0, this.width, this.height);
        this.grid.setWidth(this.width);
        this.grid.setHeight(this.height);
        this.grid.setXi(0);
        this.grid.setYi(0);
        // set some default properties about the line
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';
        // we'll implement this method to start capturing mouse events
        this.captureEvents(canvasEl);
        let it = setInterval(() => {
            this.redraw();
        }, 200)
        // setTimeout(() => {
        //     clearInterval(it);
        // }, 6000)
        this.redraw();
    }


    setSize(w, h) {
        this.width = w;
        this.height = h;
    }


    getCTX() {
        return this.cx;
    }

    getCanvas() {
        return this.canvas;
    }

    public getItem(x, y) {
        if (x < this.icons.length) {
            let row = this.icons[x]
            if (y < row.length)
                return row[y]
        }
        return null;
    }


    private captureEvents(canvasEl: HTMLCanvasElement) {
        // this will capture all mousedown events from the canvas element
        fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap((e) => {

                    if (this.clickFunction) {
                        this.clickFunction()
                    }
                    // const rect = canvasEl.getBoundingClientRect();
                    // let x = e["clientX"];
                    // let y = e["clientY"];
                    // let wx = this.grid.Xwc(x - rect.left)
                    // let wy = this.grid.Ywc(y - rect.top)
                    // let xint = Math.floor(wx);
                    // let yint = Math.floor(wy);
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

                // this method we'll implement soon to do the actual drawing
                // this.addIcon();
                this.drawOnCanvas(prevPos, currentPos);
                this.redraw()
            });
    }
    formatFiles() {
        let f = {}
        for (let x = 0; x < this.icons.length; x++) {
            let row = this.icons[x]
            for (let y = 0; y < row.length; y++) {
                let it = row[y]
                f[it['name']] = it['value']
            }
        }
        return f;

    }


    // public add(item) {
    //     this.count++;
    //     let added = false;
    //     if (this.icons.length === 0) {
    //         this.icons.push([item])
    //         added = true;
    //     } else {
    //         for (let x = 0; x < this.icons.length; x++) {
    //             let row = this.icons[x]
    //             if (row == null) {
    //                 row = [];
    //             }
    //             if (row.length < 10) {
    //                 added = true;
    //                 row.push(item)
    //                 this.icons[x] = row;
    //             }
    //         }
    //         if (!added) {
    //             this.icons.push([item]);
    //         }
    //     }
    //     if (this.listenerFunction) {
    //         this.listenerFunction(this.formatFiles());
    //     }
    //     const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    //     this.grid.setXi(0);
    //     this.grid.setYi(0);
    //     this.grid.setWidth(canvasEl.width);
    //     this.grid.setHeight(canvasEl.height);
    //     this.grid.setxmin(0.0)
    //     this.grid.setxmax(10)
    //     this.grid.setymin(0.0);
    //     this.grid.setymax(this.ymax);
    //     this.grid.setInset(0, 0);
    //     this.grid.rescale();

    // }

    // getFile(name) {
    //     for (let x = 0; x < this.icons.length; x++) {
    //         let row = this.icons[x]
    //         for (let y = 0; y < row.length; y++) {
    //             let it = row[y]
    //             if (it['name'] === name) {
    //                 return it;
    //             }
    //         }
    //     }
    //     return null;
    // }

    redraw() {
        this.grid.rescale();
        if (!this.cx) { return; }
        this.cx.clearRect(0, 0, this.width, this.height);

        this.cx.fillStyle = this.background;
        if (this.image) {
            if (!this.overrideWidth)
                this.width = this.image.width;
            if (!this.overrideHeight)
                this.height = this.image.height;
            this.cx.drawImage(this.image, 0, 0);
        }
        if (this.drawText) {
            this.drawText(this.cx)
        }

    }


    private drawOnCanvas(
        prevPos: { x: number, y: number },
        currentPos: { x: number, y: number }
    ) {
        // incase the context is not set
        if (!this.cx) { return; }
        this.cx.beginPath();
        if (prevPos) {
            this.cx.moveTo(prevPos.x, prevPos.y); // from
            this.cx.lineTo(currentPos.x, currentPos.y);
            this.cx.stroke();
        }
    }

    public draw(x: number, y: number, w: number, h: number) {
        if (!this.cx) { return; }

        this.cx.rect(x, y, w, h)
        this.cx.stroke();
    }
    public drawLine(x1: number, y1: number, x2: number, y2: number) {
        if (!this.cx) { return; }

        this.cx.moveTo(x1, y1)
        this.cx.lineTo(x2, y2);
        this.cx.stroke();
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
    xinset = 25;
    yinset = 25;
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