import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, NgZone
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
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
    constructor ( private zone:NgZone, private sanitizer: DomSanitizer ) {

    }

    // STYLE SURVIVES; SCRIPTS DO NOT.
    //
    // [innerHTML] runs Angular's HTML sanitizer, whose attribute allowlist contains no
    // style, no class, no color and no font element -- so EVERY inline style on the markup
    // these widgets are given was being discarded. The text then inherited whatever color
    // the surrounding card set, which in a modal is white, on a white card: the panel was
    // there and unreadable, and nothing about the markup said why.
    //
    // The content comes from the application's own lionscript modules, the same place its
    // templates come from, so it is trusted the way a template is -- but only after the
    // parts that could execute are taken out of it. Angular's sanitizer is doing two jobs
    // at once, and only one of them was wanted here.
    private scrub(v: any): string {
        let t = ('' + (v == null ? '' : v));
        // Elements that execute or embed, paired and unpaired.
        t = t.replace(/<\s*(script|iframe|object|embed|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
        t = t.replace(/<\s*(script|iframe|object|embed|link|meta|base)\b[^>]*>/gi, '');
        // Handler attributes, which turn an inert-looking element into an executing one.
        t = t.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
        t = t.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
        t = t.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
        // And javascript: wherever a URL is expected.
        t = t.replace(/(href|src|xlink:href)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, '$1=$2#');
        return t;
    }
    safe(v: any): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.scrub(v));
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