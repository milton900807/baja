import {
    Component, Input, ElementRef, AfterViewInit, ViewChild, ComponentFactoryResolver, NgZone
} from '@angular/core';
import { LionEngine } from '../../../app/engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';
import { PubDirective } from '../pub.directive';
import { WidgetFactory } from '../../widget-factory';

@Component({
    selector: 'card-single',
    templateUrl: "./card-single.component.html",
    styleUrls: ['./card-single.component.scss']
})
export class CardSingleComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    background = 'white';
    saveFunction;
    clickFunction;
    listenerFunction;
    @ViewChild(PubDirective, { static: false }) compService: PubDirective;
    widgets: {};
    @Input() public width = 800;
    @Input() public height = 800;
    icons = [];
    count = 0;
    sub_title = '';
    body = '';
    styleborder = false;


    @Input() public wid = ''



    constructor(private zone: NgZone, private elementRef: ElementRef) {

    }



    private stretchCanvasToCard(
        componentRef: any
    ): void {
        const canvasHost =
            componentRef.location.nativeElement as HTMLElement;

        const cardSingleHost =
            this.elementRef.nativeElement as HTMLElement;

        const cardSingleContainer =
            canvasHost.parentElement as HTMLElement;

        const cardItem =
            cardSingleHost.closest(".card-item") as HTMLElement;

        const cardRow =
            cardSingleHost.closest(".card-row") as HTMLElement;

        /*
         * Last row consumes the remaining card-container height.
         */
        if (cardRow) {
            cardRow.style.setProperty(
                "flex",
                "1 1 auto",
                "important"
            );
            cardRow.style.setProperty(
                "display",
                "flex",
                "important"
            );
            cardRow.style.setProperty(
                "flex-direction",
                "column",
                "important"
            );
            cardRow.style.setProperty(
                "width",
                "100%",
                "important"
            );
            cardRow.style.setProperty(
                "min-height",
                "0",
                "important"
            );
        }

        /*
         * Card item fills the stretched row.
         */
        if (cardItem) {
            cardItem.style.setProperty(
                "flex",
                "1 1 auto",
                "important"
            );
            cardItem.style.setProperty(
                "display",
                "flex",
                "important"
            );
            cardItem.style.setProperty(
                "flex-direction",
                "column",
                "important"
            );
            cardItem.style.setProperty(
                "align-self",
                "stretch",
                "important"
            );
            cardItem.style.setProperty(
                "width",
                "100%",
                "important"
            );
            cardItem.style.setProperty(
                "min-height",
                "0",
                "important"
            );
            cardItem.style.setProperty(
                "overflow",
                "hidden",
                "important"
            );
        }

        /*
         * <card-single> fills the card item.
         */
        cardSingleHost.style.setProperty(
            "flex",
            "1 1 auto",
            "important"
        );
        cardSingleHost.style.setProperty(
            "display",
            "flex",
            "important"
        );
        cardSingleHost.style.setProperty(
            "flex-direction",
            "column",
            "important"
        );
        cardSingleHost.style.setProperty(
            "align-self",
            "stretch",
            "important"
        );
        cardSingleHost.style.setProperty(
            "width",
            "100%",
            "important"
        );
        cardSingleHost.style.setProperty(
            "min-height",
            "0",
            "important"
        );
        cardSingleHost.style.setProperty(
            "overflow",
            "hidden",
            "important"
        );

        /*
         * Internal wrapper containing the ng-template.
         */
        if (cardSingleContainer) {
            cardSingleContainer.style.setProperty(
                "flex",
                "1 1 auto",
                "important"
            );
            cardSingleContainer.style.setProperty(
                "display",
                "flex",
                "important"
            );
            cardSingleContainer.style.setProperty(
                "flex-direction",
                "column",
                "important"
            );
            cardSingleContainer.style.setProperty(
                "width",
                "100%",
                "important"
            );
            cardSingleContainer.style.setProperty(
                "min-height",
                "0",
                "important"
            );
            cardSingleContainer.style.setProperty(
                "overflow",
                "hidden",
                "important"
            );
        }

        /*
         * Dynamically generated <app-canvas>.
         */
        canvasHost.style.setProperty(
            "flex",
            "1 1 auto",
            "important"
        );
        canvasHost.style.setProperty(
            "display",
            "flex",
            "important"
        );
        canvasHost.style.setProperty(
            "flex-direction",
            "column",
            "important"
        );
        canvasHost.style.setProperty(
            "align-self",
            "stretch",
            "important"
        );
        canvasHost.style.setProperty(
            "width",
            "100%",
            "important"
        );
        canvasHost.style.setProperty(
            "height",
            "100%",
            "important"
        );
        canvasHost.style.setProperty(
            "min-width",
            "0",
            "important"
        );
        canvasHost.style.setProperty(
            "min-height",
            "0",
            "important"
        );
        canvasHost.style.setProperty(
            "overflow",
            "hidden",
            "important"
        );

        /*
         * Resize the actual HTML canvas after layout completes.
         */
        window.requestAnimationFrame(() => {
            const rect =
                canvasHost.getBoundingClientRect();

            const instance = componentRef.instance as any;

            if (
                rect.width > 0 &&
                rect.height > 0 &&
                typeof instance.setSize === "function"
            ) {
                instance.setSize(
                    rect.width,
                    rect.height
                );
            }
        });
    }
    exec(args) {

    }

    getComponent() {
        return this.compService;
    }

    init(): string {

        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }


    getCount() {
        return this.count;
    }


    public ngAfterViewInit() {
        if (this.wid) {
            setTimeout(() => {
                this.loadWidget(this.wid, (res) => { })
            }, 100);
        }



    }

    async loadWidget(wid: any, resolve: any): Promise<PubComponent> {
        let type = wid["wid"];

        if (type == null) {
            type = wid["type"];
        }

        let line = wid["input"];
        const title = wid["title"];

        /*
         * Resolve the widget data.
         */
        if (line == null) {
            const dataFunction = LionEngine.ionfunctions[wid["data"]];

            if (dataFunction) {
                line = await dataFunction();
            } else {
                line = wid["data"];
            }
        }

        /*
         * Apply card-single dimensions, when explicitly supplied.
         */
        if (wid["width"] != null) {
            this.width = wid["width"];
        }

        if (wid["height"] != null) {
            this.height = wid["height"];
        }

        /*
         * Create the dynamic component.
         */
        const pubcomp = WidgetFactory.createWidget(type);
        const viewContainerRef = this.compService.viewContainerRef;
        const componentRef = viewContainerRef.createComponent(pubcomp);

        const instance = componentRef.instance as PubComponent;
        const generatedHost =
            componentRef.location.nativeElement as HTMLElement;

        /*
         * Supply the component inputs before calling init().
         */
        if (line != null) {
            instance.data = line;
        }

        instance.resolveFunction = resolve;
        instance.title = title;

        /*
         * Initialize exactly once.
         */
        instance.init(null);

        /*
         * Only app-canvas in the final card of the final row should stretch.
         *
         * This intentionally excludes button-canvas and every canvas located
         * in an earlier row.
         */
        const cardItem =
            generatedHost.closest(".card-item") as HTMLElement | null;

        const cardRow =
            generatedHost.closest(".card-row") as HTMLElement | null;

        const isAppCanvas =
            generatedHost.matches("app-canvas");

        const isLastCard =
            cardItem?.matches(".card-item:last-child") === true;

        const isLastRow =
            cardRow?.matches(".card-row:last-child") === true;

        const shouldStretch =
            isAppCanvas &&
            isLastCard &&
            isLastRow;

        if (shouldStretch) {
            /*
             * Wait until Angular has inserted and rendered the component.
             */
            requestAnimationFrame(() => {
                this.stretchCanvasToCard(componentRef);
            });
        }

        /*
         * Save widgets that have an ID.
         */
        if (wid["id"] != null) {
            if (this.widgets == null) {
                this.widgets = {};
            }

            this.widgets[wid["id"]] = {
                instance,
                wid: type
            };
        }

        /*
         * Save named component references.
         */
        if (wid["componentRef"] != null) {
            LionEngine.componentRefs[wid["componentRef"]] = {
                viewContainerRef,
                components: [instance]
            };
        }

        /*
         * Execute the component reference callback.
         */
        if (wid["refCallback"] != null) {
            const refCallback =
                LionEngine.ionfunctions[wid["refCallback"]];

            if (refCallback) {
                refCallback(instance);
            }
        }

        /*
         * Ensure Angular processes changes made by initialization.
         */
        this.zone.run(() => { });

        return instance;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }


}