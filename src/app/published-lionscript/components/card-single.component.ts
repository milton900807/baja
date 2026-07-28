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



    constructor(private zone:NgZone) {

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
            setTimeout(  () => {
                this.loadWidget(this.wid, (res) => { })
            } , 100);
        }



    }


    async loadWidget(wid: {}, resolve) {
        let type = wid["wid"];
        if (type == null) type = wid["type"];

        let line = wid["input"];
        let title = wid["title"];
        if (line == undefined || line == null) {
            let dataFunction = LionEngine.ionfunctions[wid['data']]
            if (dataFunction) {
                line = await dataFunction();
            } else {
                line = wid['data']
            }
        }

        if (wid['width'] != null) {
            this.width = wid['width']
        }

        if (wid['height'] != null) {
            this.height = wid['height']
        }
        let pubcomp = WidgetFactory.createWidget(type);
        let viewContainerRef = this.compService.viewContainerRef;
        let componentRef = viewContainerRef.createComponent(pubcomp);
        if (line != undefined) (<PubComponent>componentRef.instance).data = line;
        (<PubComponent>componentRef.instance).resolveFunction = resolve;
        (<PubComponent>componentRef.instance).title = title;
        (<PubComponent>componentRef.instance).init(null);
        if (wid["id"] != undefined) {
            if (this.widgets == null) {
                this.widgets = {};
            }
            this.widgets[wid["id"]] = {
                instance: <PubComponent>componentRef.instance,
                wid: type,
            };
        }
        (<PubComponent>componentRef.instance).init(null);

        if (wid['componentRef'] != null) {
            LionEngine.componentRefs[wid['componentRef']] = {
                'viewContainerRef': viewContainerRef,
                'components': [(<PubComponent>componentRef.instance)]
            }
        }

        if (wid['refCallback'] != null) {
         
            
            LionEngine.ionfunctions[wid['refCallback']](<PubComponent>componentRef.instance);
        }

        
        this.zone.run(() => {
        })
        return (<PubComponent>componentRef.instance);
    }


    setSize(w, h) {
        this.width = w;
        this.height = h;
    }


}