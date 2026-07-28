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
    



<div [fluidHeight] [id]="id" style="min-height: 25px; height: 100%; display: flex; flex-direction: column; width: 100%; padding: 0px; border: NONE;" #container>
  <canvas [fluidHeight] [width]="width" [height]="height" #canvas></canvas>
  
  
  
  
  
  <div *ngIf="editor"
    class="editor-container"
    style="position: absolute; box-shadow: 6px 12px 20px rgba(0, 0, 0, 0.3); border-radius: 8px;"
    [style.left.px]="mx"
    [style.top.px]="my"
    [style.width.px]="mwidth"
    [style.height.px]="mheight">
    <div 
      class="drag-handle"
      (mousedown)="onMouseDown($event)"
      style="width: 100%; height: 30px; background-color: #333; color: white; display: flex; align-items: center; cursor: move; padding: 0px 1px;
         box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.5);">

      <!-- style="width: 100%; height: 30px; background-color: #333; color: white; display: flex; align-items: center; cursor: move; padding: 0px 5px;"> -->
      <span style="flex-grow: 1; text-align: center;"></span>
      <ng-container *ngFor="let button of buttons">
        <button (click)="button.action()" 
                [style.background-color]="button.color" 
                style="color: white; border: none; padding: 2px 8px; font-size: 12px; margin-left: 5px;">
          {{ button.label }}
        </button>
      </ng-container>
    </div>

    <div *ngIf="editorKey" style="display: flex; flex-direction: column;  width: 100%; height: calc(100% - 30px);">
      <text-editor #textEditor [editorOptions]="editorOptions" 
          style="display: flex; flex-direction: column; width: 100%; height: 100%;">
      </text-editor>
    </div>

    <!-- Resize handle -->
    <div class="resize-handle" (mousedown)="onResizeStart($event)" 
        style="position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; background: gray; cursor: se-resize;">
    </div>
</div>

</div>



    `,
    styleUrls: ['./canvas.component.scss']
})
//   height: 100vh; width: 100vw; display: block;
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
        window.addEventListener('mousemove', this.onResizing.bind(this));
        window.addEventListener('mouseup', this.onResizeEnd.bind(this));
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
        window.removeEventListener('mousemove', this.onResizing.bind(this));
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
                this.dblclick = LionEngine.ionfunctions[this.data['dblclick']]``
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
    @ViewChild('canvas') public canvas: ElementRef;
    @ViewChild('container') public container: ElementRef;
    @Input() public width = 900;
    @Input() public height = 1;

    private cx: CanvasRenderingContext2D;

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
        containerE.addEventListener('resize', () => {
            if (containerE.height) {
                this.width = containerE.width;
                this.height = containerE.height;
                // setTimeout(() => {
                //     this.zone.run(() => {
                //     })
                // }, 1000)
            }
        });
        window.dispatchEvent(new Event('resize'));
        if (this.textEditor && this.editor)
            this.textEditor.setEditor(this.editor)
        else if (this.editor) {

            setTimeout(() => {
                // this.textEditor.setEditor(this.editor)

            }, 1000)
        }



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
        }
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
            if (this.mouseUpListener) {
                const rect = canvasEl.getBoundingClientRect();
                canvasEl.focus();


                if (this.mouseUpListener && evt && evt.changedTouches && evt.changedTouches.length > 0 && evt.changedTouches[0]) {
                    if (evt && evt.changedTouches && evt.changedTouches[0].clientX) {
                        const ct = {
                            x: evt.changedTouches[0].clientX - rect.left,
                            y: evt.changedTouches[0].clientY - rect.top
                        };
                        if (ct)
                            this.mouseUpListener(ct.x, ct.y);
                    }
                } else
                    if (this.mouseUpListener && evt && rect && rect.x && rect.y && evt.touches[0]) {
                        const ct = {
                            x: evt.touches[0].clientX - rect.left,
                            y: evt.touches[0].clientY - rect.top
                        };
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

            if (this.mouseDownListener) {
                const rect = canvasEl.getBoundingClientRect();
                canvasEl.focus();

                if (this.mouseMoveListener && evt && rect && rect.x && rect.y && evt.touches[0] && evt.touches[0].clientX) {
                    const ct = {
                        x: evt.touches[0].clientX - rect.left,
                        y: evt.touches[0].clientY - rect.top
                    };
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



            if (this.mouseMoveListener) {
                const rect = canvasEl.getBoundingClientRect();
                if (rect && evt.touches && evt.touches.length > 0) {
                    const ct = {
                        x: evt.touches[0].clientX - rect.left,
                        y: evt.touches[0].clientY - rect.top
                    };
                    this.mouseMoveListener(ct.x, ct.y);
                }

            }
        }, false)


        canvasEl.addEventListener('mousedown', (evt) => {
            // console.log(evt + ' res ' + JSON.stringify(evt));

            evt.preventDefault();    // <-- this

            canvasEl.focus();

            if (this.mouseDownListener) {
                const rect = canvasEl.getBoundingClientRect();
                if (this.mouseMoveListener && evt && evt.x && evt.y) {

                    const ct = {
                        x: evt.x - rect.left,
                        y: evt.y - rect.top
                    };
                    if (ct.y && ct.x)
                        this.mouseDownListener(ct.x, ct.y);
                }
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
            if (this.mouseMoveListener && evt && evt.x && evt.y) {
                const rect = canvasEl.getBoundingClientRect();
                const ct = {
                    x: evt.x - rect.left,
                    y: evt.y - rect.top
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