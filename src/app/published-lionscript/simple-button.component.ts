import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from "./pub-component-listener";



@Component({
    selector: 'simple-button',
    templateUrl: './simple-button.component.html',
    styleUrls: ['./simple-button.component.css']
})
export class SimpleButtonComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = [];
    selected = '';
    disabled = false;
    style = "btn btn-secondary btn-sm"

    constructor(public cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.initData = '';
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
    }
    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
            // console.log ( " value " + value );
            // this.resolveFunction ( value );
        }
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
        this.list = [];
        if (this.data != null) {
            let test = this.data;
            if (LionEngine.ionfunctions[test] != null) {
                this.list.push({ 'label': 'Apply', 'function': LionEngine.ionfunctions[test] })
            } else if (this.data['label'] != null) {
                this.list = [];
                this.list.push(this.data)
            }

            else {
                this.list = this.data;
            }
        }
        return 'init complete';
    }
    append(v: string): void {
        // this.data += v;
    }
    clickButton(button) {
        let button_name = button['label']
        let button_function = LionEngine.ionfunctions[button['function']]
        if (button_function == null)
            button_function = LionEngine.ionfunctions[button['ionfunction']]
        if (button_function == null)
            button_function = LionEngine.ionfunctions[button['ionFunction']]
        if (button_function != null) {
            button_function();
        }
        let disablevalue = button['disableAfterClick']
        if (disablevalue != null)
            this.disabled = disablevalue;
        else
            this.disabled = true;
        this.resolveFunction(button_name);
    }
    getIcon(b) {
        return 'assets/img/icons/png/' + b['icon'];
    }
}