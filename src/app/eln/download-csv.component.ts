import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { PubComponent } from "../published-lionscript/pub-component";
import { PubComponentListener } from "../published-lionscript/pub-component-listener";

@Component({
    selector: 'download-csv',
    templateUrl: './download-csv.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class DownloadCSVComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    initData:any;
    @Input() title: string;
    ngOnInit(): void {
    }
    resolveFunction;
    apply(value: string) {
        if ( this.listener )
        {
            this.listener.update ( "value", value );
        }
        if ( value === 'yes'){
            this.exportToCsv ( this.title + 'export.csv');
        }
    }
    init () : string {
        return '';
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