import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";



@Component({
    selector: 'cmd-line',
    templateUrl: './cmd-line.component.html',
    styleUrls: ['./cmd-line.component.scss']
})
export class CMDLineComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    selectionListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = ['hello', 'world'];
    selected = '';
    apply_button = false;
    cmd = '';
    showButton = false;
    public params = {}
    public search = '';
    private sql = '';
    constructor(public cd: ChangeDetectorRef) {
    }

    setApplyFunction(fun) {
        this.selectionListener = fun;
    }
    ngOnInit(): void {
        this.initData = '';
    }
    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
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

    setText(text) {
        this.cmd = text;
    }
    getText () 
    {
        return this.cmd;
    }



    applyButton(): void {
    }

    init(): string {

        if (this.resolveFunction != null)
            this.resolveFunction(this);

        if (this.data != null) {
            let showButton = this.data['showButton'];
            if (showButton != null) {
                this.showButton = this.data['showButton']
            }

            let initText = this.data ['initText']
            if ( initText != null ){
                this.cmd = initText;
            }


            this.list = this.data['list'];
            if ('sql' in this.data && this.data['sql'] != null) {
                this.sql = this.data['sql'];
                let b = this.data['apply-button'];
                if (b != null) {
                    this.apply_button = b;
                }
                this.params = {
                };
            } else
                if ('url' in this.data && this.data['url'] != null) {
                }
        }

        return 'complete';
    }
    append(v: string): void {
        this.data += v;
    }

    run() {
        if (this.selectionListener != null) {
            console.log(" lsitener is defined ");
            this.selectionListener(this.cmd);
        }
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