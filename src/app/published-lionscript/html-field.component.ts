import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, NgZone
} from "@angular/core";
import { LionEngine } from "../engine/io-engine";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'html-field',
    templateUrl: './html-field.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class HTMLFieldComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: string;
    @Input() title: string;
    @Input() html: string = '';
    click = null;
    width = '100%'
    constructor ( private zone:NgZone ) {
        
    }
    
    
    ngOnInit(): void {
        if (this.data != null && this.data.length > 0)
            this.html = this.data;
    }
    ionFunction;


    
    onHtmlClick () {
        if ( this.click ){
            this.click ();
        }
    }


    init(): string {
        if (this.data) {
            if (this.data.ionFunction) {
                this.ionFunction = this.data.ionFunction;
                if ( this.data.html ){
                    this.html = this.data.html;
                }
            } else {
                this.html = this.data;
            }
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }
    setHTML(html) {
        this.html = html;
        this.zone.run (() => {
            // console.log('enabled time travel');
        });
    }
    getHTML () {
        return LionEngine.ionfunctions[this.ionFunction]();
    }
    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
            // console.log(" value " + value);
            this.resolveFunction(value);
        }
    }
}