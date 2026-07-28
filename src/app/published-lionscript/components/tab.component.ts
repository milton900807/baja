import {
    Component, Input, ElementRef, AfterViewInit, ViewChild, ComponentFactoryResolver
} from '@angular/core';
import { LionEngine } from '../../../app/engine/io-engine';
import { PubComponent } from '../pub-component';
import { PubComponentListener } from '../pub-component-listener';
import { PubDirective } from '../pub.directive';

@Component({
    selector: 'tabs',
    templateUrl: "./tab.component.html",
    styles: [`canvas { border: 0px solid #000; }
    
  
    `]
})
export class TabComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    background = 'white';
    saveFunction;
    clickFunction;
    listenerFunction;
    card_items_list = []
    @ViewChild(PubDirective, { static: false }) compService: PubDirective;
    widgets: {};
    @Input() public width = '100%';
    @Input() public height = '100%';
    count = 0;
    padding = '0px'
    visible = false;
    selected;
    initSelectedTab;
    index = 0;
    overflow = 'hidden'
    tabListener;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) {

    }

    go(item) {
        this.selected = null;
        setTimeout(() => {
            this.selected = item;
        }, 200);
        if ( this.tabListener ) {
            this.tabListener ( item );
        }
    }

    getCards() {
        return this.card_items_list;
    }

    init(): string {



        if (this.data) {

            if ( this.data['overflow']){
                this.overflow = this.data['overlfow']
            }

            if (this.data['height']) {
                this.height = this.data['height']
            }
            if (this.data['width']) {
                this.width = this.data['width']
            }
            if ( this.data['tabListener']){
                this.tabListener = LionEngine.ionfunctions[this.data['tabListener']]
            }

            if (this.data['padding']) {
                this.padding = this.data['padding']
            }

            if (this.data['selectTab']) {
                this.initSelectedTab = this.data['selectTab']
            }


            this.card_items_list = this.data[
                'cards'
            ]

            if (this.initSelectedTab) {
                if (this.card_items_list.length > 0 && this.card_items_list[0].length > 0) {
                    for (let row of this.card_items_list) {
                        for (let cell of row) {
                            if (cell.title.trim().toUpperCase() === this.initSelectedTab.trim().toUpperCase ()) {
                                this.selected = cell;
                            }
                        }
                    }
                }

            } else {
                if (this.card_items_list.length > 0 && this.card_items_list[0].length > 0) {
                    this.selected = this.card_items_list[0][0];
                }
            }

        }

        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }


    getCount() {
        return this.count;
    }


    public ngAfterViewInit() {
        this.visible = true;

    }


    setSize(w, h) {
        this.width = w;
        this.height = h;
    }


}