import { Component, OnInit, Input, OnChanges, ViewContainerRef } from '@angular/core';
import { ResultsPageComponent } from './results-page.component';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'raw-results-page',
    templateUrl: './raw-results-page.component.html',
    styleUrls: ['./results-page.component.scss']
})
export class RawResultsPageComponent implements OnInit, ResultsPageComponent {
    @Input()
    results: any[];
    constructor(public viewContainerRef: ViewContainerRef) { }

    init(a:{}): string {
        return null;
    }
    ngOnInit(): void {
    }
    toJSON(ob) {
        return JSON.stringify(ob);
    }

    injectRes(): string {
        return '<b> Hello World </b>';
    }

}


