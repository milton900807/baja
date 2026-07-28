import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'search',
    templateUrl: './search.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SearchComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: any = '';
    @Input() title: string;
    init_text_value = ''

    button_label = "Ok";
    searchListeners = [];

    paths = [];
    



    ngOnInit(): void {
        if (this.data != null) {
            if (this.data['button-label'] != null) {
                this.button_label = this.data['button-label']
            }
            if (this.data['text'] != null) {
                this.init_text_value = this.data['text'];
            }

            

        }
        if ( this.resolveFunction ) 
        {
            this.resolveFunction ( this );
        }
    }
    init(): string {
        return '';
    }
    addActionListener(ac) {
        this.searchListeners.push(ac);
    }
    search(value) {
        for (let sl of this.searchListeners) {
            sl.action('search', value);
        }
    }
    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
            // console.log(" value " + value);
            this.resolveFunction(value);
        }
    }
}