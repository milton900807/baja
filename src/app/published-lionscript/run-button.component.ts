import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";

import { PubComponent } from "./pub-component";
import { FunctionUtil } from "../functions/function-util";
import { Runnable } from "./runnable-object";
import { PubComponentListener } from "./pub-component-listener";



@Component({
    selector: 'run-button',
    templateUrl: './simple-button.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class RunButton implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = [];
    function_list = {};
    selected = '';
    disabled = false;
    parent_engine: Runnable;

    constructor(public cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.initData = '';

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
            for (let t of this.data) {
                if (typeof t == 'object') {
                    let na = Object.keys(t)[0];
                    this.list.push(na);
                    this.function_list[na] = t[na];
                } else {
                    this.list.push(t);
                }
            }
        }
        return 'init complete';
    }
    append(v: string): void {
    }
    clickButton(button_name) {
        if (this.function_list[button_name] != null) {
            let action_object = this.function_list[button_name];
            if (typeof action_object == 'object' && 'function' in action_object) {
                console.log(" function is " + action_object['function']);
                let fun = FunctionUtil.getFunctionFromJSONObject(action_object['function']);
                fun();
            } else if (typeof action_object == 'string') {
                let stra = action_object.toString().trim();
                if (stra.startsWith('exec')) {
                    this.parent_engine.run ( stra );
                }
            }
        }

        this.disabled = true;
        this.resolveFunction(button_name);
    }

    exportToCsv(file_name) {
        let keys = Object.keys(this.data[0]);
        var options = {
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalseparator: '.',
            showLabels: true,
            showTitle: false,
            useBom: false,
            headers: keys
        };
        // new Angular2Csv(this.data, file_name, options);
    }
}