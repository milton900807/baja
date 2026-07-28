import {
    OnInit,
    Component,
     ChangeDetectorRef, Input
} from "@angular/core";
// import { Angular2Csv } from 'angular2-csv';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
@Component({
    selector: 'mtype-ahead',
    templateUrl: './mtype-ahead.component.html',
    styleUrls: ['./mtype-ahead.component.scss']
})
export class MTypeAheadComponent implements OnInit {
    // engine: import("./pub-component").IonEngine;
    selectionListener = null;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    list = ['hello', 'world'];
    selected = '';
    apply_button = false;

    public url = 'http://suggestqueries.google.com/complete/search';
    public params = {}
    public search = '';
    private sql = '';
    private path = null;
    private display_field = null;


    listFunction;
    model: any;

    constructor(public cd: ChangeDetectorRef) {
        this.params = {
            hl: 'en',
            ds: 'yt',
            xhr: 't',
            path: this.path
        };
    }
    setApplyListener(listener) {
        this.selectionListener = listener;
    }
    handleResultSelected(result) {
        this.search = result;
        this.selectionListener(this.search);
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

    applyButton(): void {
        this.apply_button = null;
        console.log(" apply : " + this.search);
        this.selectionListener(this.search);
    }

    getValue() {
        return this.model;
    }

    init(): string {
        let CHARACTER_START_INDEX= 2;

        if (this.resolveFunction)
            this.resolveFunction(this);
        if (this.data != null) {
            this.list = this.data['list'];
            if ( this.data['start']!=null){
                CHARACTER_START_INDEX= this.data['start']
            }
           
        }
        this.listFunction = (text: Observable<string>) => {
            if (text != undefined) {
                return text.pipe(
                    debounceTime(200),
                    distinctUntilChanged(),
                    map(term => term.length < CHARACTER_START_INDEX ? []
                        : this.list.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 100))
                )
            }
            return null;
        }
        if ('api' in this.data && this.data['api'] != null) {
            this.url = this.data['api'];
        }

        if ('path' in this.data && this.data['path'] != null) {
            this.path = this.data['path'];
        }
        if (this.data['display_field'] != null) {
            this.display_field = this.data['display_field'];
        }
        this.params = {
            // hl: 'en',
            // ds: 'yt',
            // xhr: 't',
            path: this.path, 
            return_fields: this.display_field
        };

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