import {
    OnInit,
    Component,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, NgZone
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from "./pub-component-listener";


@Component({
    selector: 'multi-select',
    templateUrl: './multi-select.component.html',
    styles: []
})
export class MultiSelectComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = ['hello', 'world'];
    selected = [];
    actionIonFunction = null;
    statusFunction;
    itemFunction;
    button_label = "Apply"
    model = {};
    resolveFunction;
    values = {};
    padding_top = '2px';
    showButton = true;

    constructor(public cd: ChangeDetectorRef, private zone: NgZone) {
    }
    check(item) {

        this.values[item]=!this.values[item];
        if (!this.showButton && this.actionIonFunction)
            this.actionIonFunction(item, !this.values[item]);
        if (this.itemFunction) {
            this.itemFunction(this.values);
        }
    }

    update(event) {
        this.values[event.target.id] = (event.target.checked)
    }

    ngOnInit(): void {
        this.initData = '';
    }
    apply(value: string) {
    }

    setSelected(item) {
        this.selected = item;
    }


    setLogText(logText): void {
        this.data = logText;
    }
    setVis(): void {
        if (this.visibility == 'Show') {
            this.visibility = "Hide";

        } else {
            this.visibility = "Show";
        }
    }

    init(): string {
        if (this.resolveFunction)
            this.resolveFunction(this);
        if (this.data != null) {
            this.list = this.data['list'];
            for (let l of this.list) {
                this.values[l] = false;
            }
            if (this.data['ionfunction'] != null)
                this.actionIonFunction = LionEngine.ionfunctions[this.data['ionfunction']]
            if (this.data['buttonFunction'] != null)
                this.statusFunction = LionEngine.ionfunctions[this.data['buttonFunction']]
            if (this.data['itemFunction'] != null)
                this.itemFunction = LionEngine.ionfunctions[this.data['itemFunction']]
            if (this.data['ionFunction'] != null)
                this.actionIonFunction = LionEngine.ionfunctions[this.data['ionFunction']]
            if (this.data['button_label'] != null)
                this.button_label = this.data['button_label']
            if (this.data['showButton'] != null)
                this.showButton = this.data['showButton']


            if (this.data['selected'] != null) {
                for (let l of this.list) {
                    for (let sl of this.data['selected']) {
                        if (sl === l) {
                            this.values[l] = true;
                        }
                    }
                }
            }

        }

        setTimeout(() => {
            this.zone.run(() => {

            })

        }, 1000)


        return 'complete';
    }
    append(v: string): void {
        this.data += v;
    }
    submit() {
        let doc = "";
        if (this.actionIonFunction) {
            this.actionIonFunction(this.values);
        }
        if (this.statusFunction) {
            this.statusFunction(this.values)
        }

    }
}