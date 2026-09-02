import {
    Component, Input, ElementRef, AfterViewInit, ViewChild, NgZone,
    HostListener,
    OnDestroy,
    ChangeDetectorRef
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { LionEngine } from '../../engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';
import { TextEditorComponent } from './texteditor-component';

@Component({
    selector: 'app-canvas',
    template: `
        <div
            [id]="id"
            class="canvas-shell"
            #container
        >
            <canvas
                class="canvas-surface"
                #canvas
            ></canvas>

            <div
                *ngIf="editor && mwidth > 0 && mheight > 0"
                class="editor-container"
                [style.left.px]="mx"
                [style.top.px]="my"
                [style.width.px]="mwidth"
                [style.height.px]="mheight"
            >
                <div
                    class="drag-handle"
                    (mousedown)="onMouseDown($event)"
                >
                    <span style="flex-grow: 1"></span>

                    <ng-container *ngFor="let button of buttons">
                        <button
                            type="button"
                            (click)="button.action()"
                            [style.background-color]="button.color"
                        >
                            {{ button.label }}
                        </button>
                    </ng-container>
                </div>

                <div
                    *ngIf="editorKey"
                    class="editor-content"
                >
                    <text-editor
                        #textEditor
                        [editorOptions]="editorOptions"
                    ></text-editor>
                </div>

                <div
                    class="resize-handle"
                    (mousedown)="onResizeStart($event)"
                ></div>
            </div>
        </div>
    `,
    styleUrls: ['./canvas.component.scss']
})

export class CanvasComponent implements PubComponent, AfterViewInit, OnDestroy {

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
    mouseLeaveListener;
    pinchListener;
    keydown;
    touchStart;
    touchEnd;
    touchMove;
    dblclick;
    wheelListener;
    _touchStartPt: { x: number; y: number } | null = null;   // single-finger touch start
    _touchNavStarted = false;                                 // drag past threshold -> navigate
    id: string = "canvas"
    canvasListener;
    code: string = '';

    private isDragging: boolean = false;
    private dragOffsetX: number = 0;
    private dragOffsetY: number = 0;

    editor;

    static index = 0;
    editorKey = 1;

    // Inputs for x, y, width, and height
    @Input() mx: number = 120;
    @Input() my: number = 220;
    @Input() mwidth: number = 400;
    @Input() mheight: number = 300;
    editorOptions = {
        automaticLayout: true
    };
    @ViewChild('textEditor') textEditor: TextEditorComponent; // Reference to text-editor component
    @ViewChild('canvas', { static: false })
    public canvas!: ElementRef<HTMLCanvasElement>;

    @ViewChild('container', { static: false })
    public container!: ElementRef<HTMLElement>;

    @Input() public width = 900;
    @Input() public height = 300;

    private resizeObserver?: ResizeObserver;
    private resizeFrame?: number;
    private cx!: CanvasRenderingContext2D | null;

    private readonly MIN_CANVAS_WIDTH = 1;
    private readonly MIN_CANVAS_HEIGHT = 25;


    private readonly boundResizeMove =
        (event: MouseEvent) => this.onResizing(event);

    private readonly boundResizeEnd =
        () => this.onResizeEnd();


    // Array of button configurations
    buttons = [

        {
            label: '▶',
            color: 'gray',
            icon: '',
            action: () => this.executeCode()
        },
        {
            label: '🔍',
            color: 'gray',
            icon: '',
            action: () => this.test()
        },
        {
            label: '📋',
            color: 'gray',
            icon: '',
            action: () => this.newTable()
        }, {
            label: '✕',
            color: 'red',
            icon: '',
            action: () => this.closeEditor()
        },
    ];

    constructor(private zone: NgZone, private elRef: ElementRef, private cdr: ChangeDetectorRef) {


    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();

        this.resizeObserver?.disconnect();

        window.removeEventListener(
            'mousemove',
            this.boundResizeMove
        );

        window.removeEventListener(
            'mouseup',
            this.boundResizeEnd
        );



    }


    newTable() {
    }
    closeEditor() {
    }
    // setEditor(editor) {
    //     if (this.editor.buttons) {
    //         console.log ( " settingthe buttons ")
    //         this.buttons = this.editor.buttons;
    //     }
    //     if (this.textEditor) {
    //         this.textEditor.setEditor(editor)
    //     }
    //     this.mwidth = 500;
    //     this.mheight = 200;
    //     this.cdr.detectChanges();

    //     return this;
    // }




    recognition: any;

    startVoice(): void {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Speech Recognition not supported in this browser.');
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Recognized:', transcript);
        };
        this.recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
        };
        this.recognition.start();
    }



    setEditor(editor) {
        if (editor.x) {
            this.mx = parseInt(editor.x)
        }
        if (editor.y) {
            this.my = parseInt(editor.y)
        }
        this.editor = editor;
        this.editorKey++;
        this.mwidth = 600;
        this.mheight = 400;
        if (editor.buttons) {
            this.buttons = editor.buttons;
        }
        if (this.textEditor) {
            this.textEditor.setEditor(editor)
        }
        this.cdr.detectChanges();
        return this;
    }

    isTextEditorVisible(): boolean {
        if (!this.textEditor) {
            return false; // textEditor is not available in the DOM
        }
        if (this.mheight <= 0) {
            return false;
        }
        return this.textEditor.isTextEditorVisible();
    }


    getEditorText() {
        if (this.textEditor) {
            return this.textEditor.getData();
        }
        return null;
    }
    clearEditorText() {
        if (this.textEditor) {
            this.textEditor.code = '';
        }
    }

    setEditorText(txt) {
        if (this.textEditor) {
            this.textEditor.code = txt;
        }
    }

    hideEditor() {
        this.mheight = 0;
    }


    getTextFieldCoordinates(): { x: number, y: number, w: number, h: number } | null {
        let x = this.mx;
        let y = this.my;
        let w = this.mwidth;
        let h = this.mheight;
        return { x, y, w, h };
    }




    isResizing: boolean = false;
    resizeStartX: number = 0;
    resizeStartY: number = 0;
    resizeStartWidth: number = 0;
    resizeStartHeight: number = 0;

    onResizeStart(event: MouseEvent): void {
        this.isResizing = true;
        this.resizeStartX = event.clientX;
        this.resizeStartY = event.clientY;
        this.resizeStartWidth = this.mwidth;
        this.resizeStartHeight = this.mheight;

        // Add mousemove and mouseup listeners
        window.addEventListener(
            'mousemove',
            this.boundResizeMove
        );

        window.addEventListener(
            'mouseup',
            this.boundResizeEnd
        );




    }



    onResizing(event: MouseEvent): void {
        if (!this.isResizing) return;

        const dx = event.clientX - this.resizeStartX;
        const dy = event.clientY - this.resizeStartY;

        this.mwidth = Math.max(200, this.resizeStartWidth + dx); // Minimum width
        this.mheight = Math.max(150, this.resizeStartHeight + dy); // Minimum height
    }

    onResizeEnd(): void {
        this.isResizing = false;

        // Remove event listeners to prevent memory leaks
        window.removeEventListener(
            'mousemove',
            this.onResizing.bind(this)
        );


        window.removeEventListener('mouseup', this.onResizeEnd.bind(this));
    }

    init(): string {
        if (this.data) {
            if (this.data['mouseListener'])
                this.mouseListener = LionEngine.ionfunctions[this.data['mouseListener']]
            if (this.data['mouseDownListener'])
                this.mouseDownListener = LionEngine.ionfunctions[this.data['mouseDownListener']]
            if (this.data['mouseLeaveListener'])
                this.mouseLeaveListener = LionEngine.ionfunctions[this.data['mouseLeaveListener']]
            if (this.data['mouseUpListener'])
                this.mouseUpListener = LionEngine.ionfunctions[this.data['mouseUpListener']]
            if (this.data['mouseMoveListener'])
                this.mouseMoveListener = LionEngine.ionfunctions[this.data['mouseMoveListener']]
            if (this.data['mouseDragListener'])
                this.mouseDragListener = LionEngine.ionfunctions[this.data['mouseDragListener']]
            if (this.data['pinchListener'])
                this.pinchListener = LionEngine.ionfunctions[this.data['pinchListener']]
            if (this.data['touchstart'])
                this.touchStart = LionEngine.ionfunctions[this.data['touchstart']]
            if (this.data['touchend'])
                this.touchEnd = LionEngine.ionfunctions[this.data['touchend']]
            if (this.data['touchmove'])
                this.touchMove = LionEngine.ionfunctions[this.data['touchmove']]
            if (this.data['keydown'])
                this.keydown = LionEngine.ionfunctions[this.data['keydown']]
            if (this.data['dblclick'])
                this.dblclick = LionEngine.ionfunctions[this.data['dblclick']]
            if (this.data['wheelListener'])
                this.wheelListener = LionEngine.ionfunctions[this.data['wheelListener']]
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


    public ngAfterViewInit() {
        // get the context
        this.mwidth = 0;
        this.mheight = 0;

        let c1 = {
            height: '0px',
            editorOptions: {
                language: 'ljl',
                value: "Enter LJ-script here",
                theme: 'no-border-theme',
                minimap: { enabled: false }, // Disable minimap for cleaner view
                scrollbar: {
                    vertical: 'hidden', // No vertical scrollbar
                    horizontal: 'hidden', // No horizontal scrollbar
                },
                lineNumbers: 'off', // Disable line numbers
                lineDecorationsWidth: 0, // Remove decorations around line numbers
                lineNumbersMinChars: 0, // Minimize space for line numbers (disabled already)
                overviewRulerLanes: 0, // Disable overview ruler
                hideCursorInOverviewRuler: true, // Disable cursor in overview ruler
                folding: false, // Disable folding
                highlightActiveIndentGuide: false, // Disable active indent guide highlight
                renderLineHighlight: 'none', // No line highlight for active line
                renderLineHighlightOnlyWhenFocus: false, // No highlight even when focused
                renderWhitespace: 'none', // Opti
                fontSize: 18,
                automaticLayout: true,
                padding: {
                    top: 20, // Add padding at the top of the text space
                    bottom: 20, // Add padding at the bottom of the text space
                    left: 30,
                    right: 30
                }
            },
            objects: {},
            code: ``,
            buttons: [
            ]
        }

        this.editor = c1;
        this.editorOptions = c1.editorOptions;
        this.cdr.detectChanges();

        const containerE = this.container.nativeElement;
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        this.cx.canvas.setAttribute('tabindex', '0');
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';
        if (this.canvasListener) {
            this.canvasListener(this.cx)
        }
        this.captureEvents(canvasEl);

        const resizeCanvas = () => {
            const rect = containerE.getBoundingClientRect();

            const newWidth = Math.max(1, Math.floor(rect.width));
            const newHeight = Math.max(1, Math.floor(rect.height));

            if (
                canvasEl.width === newWidth &&
                canvasEl.height === newHeight
            ) {
                return;
            }

            this.width = newWidth;
            this.height = newHeight;

            canvasEl.width = newWidth;
            canvasEl.height = newHeight;

            // Resizing a canvas resets its drawing context.
            this.cx = canvasEl.getContext('2d');

            if (this.cx) {
                this.cx.lineWidth = 3;
                this.cx.lineCap = 'round';
                this.cx.strokeStyle = '#000';

                if (this.canvasListener) {
                    this.canvasListener(this.cx);
                }
            }
        };

        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(resizeCanvas);
        });

        this.resizeObserver.observe(containerE);



        // window.requestAnimationFrame(resizeCanvas); window.dispatchEvent(new Event('resize'));

        window.requestAnimationFrame(resizeCanvas);

        if (this.textEditor && this.editor)
            this.textEditor.setEditor(this.editor)
        else if (this.editor) {

            setTimeout(() => {
                // this.textEditor.setEditor(this.editor)

            }, 1000)
        }



    }






    setSize(w: number, h: number): void {
        this.width = Math.max(1, Math.floor(w));
        this.height = Math.max(1, Math.floor(h));

        const canvasElement =
            this.canvas?.nativeElement as HTMLCanvasElement;

        if (!canvasElement) {
            return;
        }

        canvasElement.width = this.width;
        canvasElement.height = this.height;

        this.cx = canvasElement.getContext('2d');

        if (this.cx) {
            this.cx.lineWidth = 3;
            this.cx.lineCap = 'round';
            this.cx.strokeStyle = '#000';
        }
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
        }
    }

    // Convert a client (viewport) point into CANVAS backing-store pixel coordinates — the
    // space everything is drawn in. Scaling by canvas.width/rect.width corrects any CSS
    // display-vs-backing-store size mismatch so events line up with on-canvas objects.
    toCanvasXY(canvasEl: HTMLCanvasElement, clientX: number, clientY: number) {
        const rect = canvasEl.getBoundingClientRect();
        const sx = rect.width ? (canvasEl.width / rect.width) : 1;
        const sy = rect.height ? (canvasEl.height / rect.height) : 1;
        return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
    }

    executeCode() {
        if (this.textEditor) {
            // const code = this.textEditor.getContent(); // Assuming text-editor has a getContent method
            // console.log('Executing code:', code);
        }
    }

    test() {
        // Test method logic
        console.log('Test method called');
        // Add test logic here
    }

    // Mouse down event - start dragging
    onMouseDown(event: MouseEvent): void {
        const editorElement = this.elRef.nativeElement.querySelector('.editor-container');
        const rect = editorElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= 0 && mouseX <= this.width && mouseY >= 0 && mouseY <= this.height) {
            this.isDragging = true;
            this.dragOffsetX = event.clientX - this.mx;
            this.dragOffsetY = event.clientY - this.my;
        }
    }

    onMouseMove(event: MouseEvent): void {
        if (this.isDragging) {
            this.mx = event.clientX - this.dragOffsetX;
            this.my = event.clientY - this.dragOffsetY;
        }
    }

    onMouseUp(): void {
        this.isDragging = false;
    }

    // Add event listeners for mouse events on the window
    @HostListener('window:mousemove', ['$event'])
    onWindowMouseMove(event: MouseEvent): void {
        this.onMouseMove(event);
    }

    @HostListener('window:mouseup')
    onWindowMouseUp(): void {
        this.onMouseUp();
    }

    private captureEvents(canvasEl: HTMLCanvasElement) {

        let scale = true;
        let pinchStart = (evt) => {

        }
        canvasEl.addEventListener('touchend', (evt) => {
            evt.preventDefault();    // <-- this
            canvasEl.focus();

            if (this.touchEnd)
                this.touchEnd(evt);
            this._touchStartPt = null;
            this._touchNavStarted = false;
            if (this.mouseUpListener) {
                const rect = canvasEl.getBoundingClientRect();
                canvasEl.focus();


                if (this.mouseUpListener && evt && evt.changedTouches && evt.changedTouches.length > 0 && evt.changedTouches[0]) {
                    if (evt && evt.changedTouches && evt.changedTouches[0].clientX) {
                        const ct = this.toCanvasXY(canvasEl, evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
                        if (ct)
                            this.mouseUpListener(ct.x, ct.y);
                    }
                } else
                    if (this.mouseUpListener && evt && rect && rect.x && rect.y && evt.touches[0]) {
                        const ct = this.toCanvasXY(canvasEl, evt.touches[0].clientX, evt.touches[0].clientY);
                        if (ct.x && ct.y) {
                            this.mouseUpListener(ct.x, ct.y);
                        }
                    }
            }
        })


        canvasEl.addEventListener('touchstart', (evt) => {
            evt.preventDefault();    // <-- this
            canvasEl.focus();

            if (this.touchStart)
                this.touchStart(evt);

            // Only start a drag/pan for a SINGLE finger. A two-finger touchstart is the
            // beginning of a pinch — starting a pan there breaks the zoom.
            if (this.mouseDownListener && evt.touches && evt.touches.length === 1) {
                const rect = canvasEl.getBoundingClientRect();
                canvasEl.focus();
                const ct = this.toCanvasXY(canvasEl, evt.touches[0].clientX, evt.touches[0].clientY);
                // Record the start so a later touchmove can tell a drag from a stationary tap;
                // navigate/pan is only engaged once movement passes the threshold (see below).
                this._touchStartPt = { x: ct.x, y: ct.y };
                this._touchNavStarted = false;
                if (this.mouseMoveListener && evt && rect && rect.x && rect.y && evt.touches[0] && evt.touches[0].clientX) {
                    this.mouseDownListener(ct.x, ct.y);
                }
            }
        })


        var TargetTouches;

        let send = (e) => {
            e.preventDefault();
            var type = e.type;
            var pageY;
            if (type === 'touchend') {
                if (this.mouseUpListener) {
                    const rect = canvasEl.getBoundingClientRect();
                    if (rect && rect.left) {
                        const ct = {
                            x: e.x - rect.left,
                            y: e.y - rect.top
                        };
                        if (ct)
                            this.mouseUpListener(ct.x, ct.y);
                    }
                }
            }
        }

        ['touchstart', 'touchmove', 'touchend'].forEach(function (e) {
            canvasEl.addEventListener(e, send, false);
        });



        canvasEl.addEventListener('touchend', (evt) => {
            if (this.mouseUpListener) {
                const rect = canvasEl.getBoundingClientRect();

                if (evt && rect && rect.x && rect.y && evt.touches[0] && evt.touches[0].clientX) {

                    const ct = {
                        x: evt.touches[0].clientX - rect.left,
                        y: evt.touches[0].clientY - rect.top
                    };

                    if (ct)
                        this.mouseUpListener(ct.x, ct.y);
                }
            }
        }, false)

        canvasEl.addEventListener('keydown', (evt) => {
            if (this.keydown)
                this.keydown(evt)
        });
        canvasEl.addEventListener('dblclick', (evt) => {
            if (this.dblclick) {
                evt.preventDefault();    // <-- this
                canvasEl.focus();
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
                };
                if (ct.y && ct.x)
                    this.dblclick(ct.x, ct.y)
            }
        });


        canvasEl.addEventListener('wheel', (evt) => {
            evt.preventDefault(); // Prevent the default scroll behavior
            // const deltaY = evt.deltaY;
            if (this.wheelListener) {
                this.wheelListener(evt)
            }
        })


        canvasEl.addEventListener('touchmove', (evt) => {
            if (evt.touches.length === 2 && this.pinchListener) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    xi: evt.touches[0].clientX - rect.left,
                    yi: evt.touches[0].clientY - rect.top,
                    xf: evt.touches[1].clientX - rect.left,
                    yf: evt.touches[1].clientY - rect.top
                };
                this.pinchListener(ct);
            }



            // Single-finger drag = pan. Do NOT pan while two fingers are down — that is a
            // pinch (handled above); panning at the same time makes the two fight.
            if (this.mouseMoveListener && evt.touches && evt.touches.length === 1) {
                const ct = this.toCanvasXY(canvasEl, evt.touches[0].clientX, evt.touches[0].clientY);
                // Engage navigate/pan only once actual drag movement is detected (>~8px from
                // the touch start) — a stationary tap keeps the current mode so it can select.
                if (!this._touchNavStarted && this._touchStartPt) {
                    const dx = ct.x - this._touchStartPt.x, dy = ct.y - this._touchStartPt.y;
                    if ((dx * dx + dy * dy) > 64) this._touchNavStarted = true;
                }
                // Forward the EVENT, and forward it on every move once the drag is under way.
                //
                // This used to hand lionscript the canvas point {x, y}, once, at the moment the
                // threshold was crossed. The pan in flexigraph/graph.js reads evt.touches to get
                // the finger position, and {x, y} has no `touches`, so its length check failed
                // and the pan never ran at all -- a single-finger drag did nothing while pinch
                // (which gets its own listener) worked. It also needs every move, not the first
                // one: the pan is incremental, each step measured against the previous touch.
                if (this._touchNavStarted && this.touchMove) this.touchMove(evt);
                this.mouseMoveListener(ct.x, ct.y);
            }
        }, false)


        canvasEl.addEventListener('mousedown', (evt) => {
            // console.log(evt + ' res ' + JSON.stringify(evt));

            evt.preventDefault();    // <-- this

            canvasEl.focus();

            if (this.mouseDownListener) {
                const rect = canvasEl.getBoundingClientRect();
                if (this.mouseMoveListener && evt && evt.x && evt.y) {

                    // Scale from CSS pixels into CANVAS (backing-store) pixels so the coordinate
                    // matches what is drawn. When the canvas is displayed at a different CSS size
                    // than its backing store (canvas.width !== rect.width), an unscaled offset
                    // drifts — worse toward the right — desyncing clicks from on-canvas objects.
                    const _sx = rect.width ? (canvasEl.width / rect.width) : 1;
                    const _sy = rect.height ? (canvasEl.height / rect.height) : 1;
                    const ct = {
                        x: (evt.x - rect.left) * _sx,
                        y: (evt.y - rect.top) * _sy
                    };
                    if (ct.y && ct.x)
                        this.mouseDownListener(ct.x, ct.y);
                }
            }

        })

        canvasEl.addEventListener('mouseup', (evt) => {
            if (this.mouseUpListener) {
                const rect = canvasEl.getBoundingClientRect();
                const _sx = rect.width ? (canvasEl.width / rect.width) : 1;
                const _sy = rect.height ? (canvasEl.height / rect.height) : 1;
                const ct = {
                    x: (evt.x - rect.left) * _sx,
                    y: (evt.y - rect.top) * _sy
                };

                if (ct)
                    this.mouseUpListener(ct.x, ct.y);
            }
        })


        canvasEl.addEventListener('mousemove', (evt) => {
            if (this.mouseMoveListener && evt && evt.x && evt.y) {
                const rect = canvasEl.getBoundingClientRect();
                const _sx = rect.width ? (canvasEl.width / rect.width) : 1;
                const _sy = rect.height ? (canvasEl.height / rect.height) : 1;
                const ct = {
                    x: (evt.x - rect.left) * _sx,
                    y: (evt.y - rect.top) * _sy
                };

                this.mouseMoveListener(ct.x, ct.y);


            }
        })



        canvasEl.addEventListener('mouseleave', (evt) => {
            if (this.mouseLeaveListener && evt && evt.x && evt.y) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
                };

                this.mouseLeaveListener(ct.x, ct.y);


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
                canvasEl.focus();


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
