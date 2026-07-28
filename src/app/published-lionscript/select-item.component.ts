import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";

import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";
// import { Angular2Csv } from "angular2-csv";



@Component({
    selector: 'select-item',
    templateUrl: './select-item.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SelectItemComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = ['hello', 'world'];
    selected = '';


    constructor(public cd: ChangeDetectorRef) {
        // let n = 0;
        // setInterval(() => {
        // this.cd.detectChanges();
        // this.data += ' ' + n++;
        // }, 1000);
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

setSelected ( item ) {
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
        this.resolveFunction(this);
        if (this.data != null) {
            this.list = this.data['list'];
        }
        return 'complete';
    }
    append(v: string): void {
        this.data += v;
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