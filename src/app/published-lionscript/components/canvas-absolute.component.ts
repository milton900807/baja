import {
    Component, Input, ElementRef, AfterViewInit, ViewChild, NgZone
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';
import { LionEngine } from './../../../app/engine/io-engine';


@Component({
    selector: 'absolute-canvas',
    template: `
      <div  [id]="id" style="overflow:hidden"  #container>
    <b *ngIf="title" > {{title}} </b> <canvas [width]="width" [height]="height" #canvas></canvas><br>
        </div>
    `,
    styles: ['canvas { border: 0px solid lightBlue; padding-top: 0px; position: absolute; left: 0; top: 0; z-index: 1;   }']
})
//   height: 100vh; width: 100vw; display: block;
export class CanvasAbsoluteComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string = '';
    hidden = 'hidden';
    mouseListener;
    mouseDownListener;
    mouseUpListener;
    mouseMoveListener;
    mouseDragListener;
    id: string = "canvas"
    canvasListener;


    constructor(private zone: NgZone) {
    }

    init(): string {
        if (this.data) {
            if (this.data['mouseListener'])
                this.mouseListener = LionEngine.ionfunctions[this.data['mouseListener']]
            if (this.data['mouseDownListener'])
                this.mouseDownListener = LionEngine.ionfunctions[this.data['mouseDownListener']]
            if (this.data['mouseUpListener'])
                this.mouseUpListener = LionEngine.ionfunctions[this.data['mouseUpListener']]
            if (this.data['mouseMoveListener'])
                this.mouseMoveListener = LionEngine.ionfunctions[this.data['mouseMoveListener']]
            if (this.data['mouseDragListener'])
                this.mouseDragListener = LionEngine.ionfunctions[this.data['mouseDragListener']]

            if (this.data['title']) {
                this.title = this.data['title']
            }
            if (this.data['height'])
                this.height = this.data['height']
            if (this.data['width'])
                this.width = this.data['width']

            if (this.data['id']) {
                this.id = this.data['id']
            }
            else {
                this.id = Math.random() + '__'
            }
            if (this.data['canvasListener']) {
                this.canvasListener = LionEngine.ionfunctions[this.data['canvasListener']]
            }


        }




        if (this.resolveFunction) {
            this.resolveFunction(this);
        }

        return '';

    }
    // a reference to the canvas element from our template
    @ViewChild('canvas') public canvas: ElementRef;
    // a reference to the canvas element from our template
    @ViewChild('container') public container: ElementRef;

    // setting a width and height for the canvas
    @Input() public width = 900;
    @Input() public height = 1900;

    private cx: CanvasRenderingContext2D;

    public ngAfterViewInit() {
        // get the context
        const containerE = this.container.nativeElement;
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        // canvasEl.id = this.id;

        // set the width and height
        // canvasEl.width = this.width;
        // canvasEl.height = this.height;

        // set some default properties about the line
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';

        if (this.canvasListener) {
            this.canvasListener(this.cx)
        }

        // we'll implement this method to start capturing mouse events
        this.captureEvents(canvasEl);
        containerE.addEventListener('resize', () => {
            if (containerE.width) {
                this.width = containerE.width;
                canvasEl.width = containerE.width;
                this.height = containerE.height;
                canvasEl.height = containerE.height;
                setTimeout(() => {
                    this.zone.run(() => {
                    })

                }, 1000)
            }

            // const windowHeight = window?.innerHeight;
            // this.height = windowHeight - 70;

        });


        window.dispatchEvent(new Event('resize'));



    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    getContainer() {
        return this.container;
    }

    getCTX() {
        return this.cx;
    }

    getCanvas() {
        return this.canvas;
    }
    getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    private captureEvents(canvasEl: HTMLCanvasElement) {


        canvasEl.addEventListener('mousedown', (evt) => {
            // console.log(evt + ' res ' + JSON.stringify(evt));
            evt.preventDefault();    // <-- this

            if (this.mouseDownListener) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
                };
                this.mouseDownListener(ct.x, ct.y);
            }

        })

        canvasEl.addEventListener('mouseup', (evt) => {
            if (this.mouseUpListener) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
                };

                if (ct)
                    this.mouseUpListener(ct.x, ct.y);
            }
        })

        canvasEl.addEventListener('mousemove', (evt) => {
            if (this.mouseMoveListener) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
                };

                this.mouseMoveListener(ct.x, ct.y);


            }
        })


        // this will capture all mousedown events from the canvas element
        fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap((e) => {
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

                // this method we'll implement soon to do the actual drawing
                let x = res[1]["clientX"];
                let y = res[1]["clientY"];

                let sx = x - rect.left;
                let sy = y - rect.top;
                if (this.mouseListener) {
                    this.mouseListener(sx, sy)
                }
                this.drawOnCanvas(prevPos, currentPos);
            });
    }



    private drawOnCanvas(
        prevPos: { x: number, y: number },
        currentPos: { x: number, y: number }
    ) {
        // // incase the context is not set
        // if (!this.cx) { return; }

        // // start our drawing path
        // this.cx.beginPath();

        // // we're drawing lines so we need a previous position
        // if (prevPos) {
        //     // sets the start point
        //     this.cx.moveTo(prevPos.x, prevPos.y); // from

        //     // draws a line from the start pos until the current position
        //     this.cx.lineTo(currentPos.x, currentPos.y);

        //     // strokes the current path with the styles we set earlier
        // this.cx.stroke();
        // }
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