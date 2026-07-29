import {
    Component, Input, ElementRef, AfterViewInit, ViewChild, ComponentFactoryResolver, NgZone,
    HostListener
} from '@angular/core';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';
import { PubDirective } from '../pub.directive';

@Component({
    selector: 'card',
    templateUrl: "./card.component.html",
    styleUrls: ['./card.component.scss']
})
export class CardComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    background = 'white';
    saveFunction;
    clickFunction;
    listenerFunction;
    card_items_list = [];
    @ViewChild(PubDirective, { static: false }) compService: PubDirective;
    widgets: {};
    @Input() public width = '100%';
    @Input() public height = '100%';
    count = 0;
    padding = '0px';
    border = 'solid 0px green';
    margin = '0px';
    card_padding = '0px';
    padding_left = '0px';
    visible = false;
    padding_top = '0px';

    constructor(private zone: NgZone, private elementRef: ElementRef) { }

    clear() {
        this.card_items_list = [];
    }

    getCards() {
        return this.card_items_list;
    }

    add(component) {
        this.card_items_list.push(component);
    }

    // @HostListener('window:resize', ['$event'])
    // onResize(event?: Event) {
    //     this.zone.run(() => {
    //         this.setSizeToWindow();
    //     });
    // }

    ngAfterViewInit() {
        this.visible = true;
        // this.setSizeToWindow();

        this.zone.run(() => {
        });
    }

    setSize(w: string, h: string): void {
        this.width = w;
        this.height = h;

        const host =
            this.elementRef.nativeElement as HTMLElement;

        host.style.setProperty("display", "flex");
        host.style.setProperty("flex-direction", "column");
        host.style.setProperty("width", w);
        host.style.setProperty("height", h);
        host.style.setProperty("min-width", "0");
        host.style.setProperty("min-height", "0");
        host.style.setProperty("overflow", "hidden");
    }
    setSizeToWindow() {
        const width = `${window.innerWidth}px`;
        const height = `${window.innerHeight}px`;
        this.setSize(width, height);
        setTimeout(() => {
            const width = `${window.innerWidth}px`;
            const height = `${window.innerHeight}px`;
            this.setSize(width, height);

        }, 200)
    }

    init(): string {
        if (this.data) {
            if (this.data['padding']) {
                this.padding = this.data['padding'];
            }
            if (this.data['style.padding-left']) {
                this.padding_left = this.data['style.padding-left'];
            }
            if (this.data['style.padding-top']) {
                this.padding_top = this.data['style.padding-top'];
            }
            if (this.data['card_padding']) {
                this.card_padding = this.data['card_padding'];
            }
            this.card_items_list = this.data['cards'];
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }

    getCount() {
        return this.count;
    }
}
