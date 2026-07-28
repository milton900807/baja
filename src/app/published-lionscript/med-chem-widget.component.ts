import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, IterableDiffers
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { IoniScriptEngine, LionEngine } from "../engine/io-engine";
import { AuthService } from "../onedrive/auth.service";

import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";



@Component({
    selector: 'medchem',
    templateUrl: './med-chem-widget.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class MedChemWidgetComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    displayHTML;
    helm_url = 'http://webeditor.openhelm.org/hwe/examples/App.htm'
    listenerFunction = null;

    @ViewChild('oligo_editor') oligoEditor: ElementRef;



    constructor(private msgraph: AuthService,
        private d: DomSanitizer, private cd: ChangeDetectorRef,
        private _iterableDiffers: IterableDiffers, engine: IoniScriptEngine) {
    }


    ngOnInit(): void {
        this.initData = '';
        let dHTML = '<iframe src="' + this.helm_url + '" width="650px" height="800px" frameborder="0" AllowFraming  allowfullscreen>____</iframe>';
        // let dHTML = this.experiment_id;
        this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);
        let helm = this.data['helm']
        let structure = this.data['structure']
        if (helm == null || helm.length === 0) {
            if (structure != null) {
                if (structure.type === 'siRNA') {
                    let sequence = structure.sequence;
                    let t = `RNA1{`
                    for (let s of sequence) {
                        t += `r(${s})p.`
                    }
                    t = t.substring(0, t.length - 2);
                    t += '}$$$$$'

                    helm = t;
                    // "senseStructure": "m(c)p.r(c)p.m(A)p.r(C)p. m(G)p.r(T)p.m(C)p.r(A)p.m(A)p.m(C)p.m(g)p.r(c)p.m(g)p.r(c)p.m(c)p.r(c)p.m(a)p.r(c)p.m(u)",
                    // "antisenseStructur"m(c)p.r(c)p.m(T)p.r(G)p.m(C)p.r(A)p.m(G)p.r(T)p.m(T)p.m(G)p.m(g)p.r(c)p.m(g)p.r(c)p.m(c)p.r(c)p.m(a)p.r(c)p.m(u)",


                }
            }
        }


        let monomers = this.data['monomers']
        let listener = this.data['listener']
        if (listener != null) {
            this.listenerFunction = LionEngine.ionfunctions[listener]
        }


        let iid = setInterval(() => {




            var el: HTMLIFrameElement = this.oligoEditor.nativeElement;
            var o_editor: any = el.contentWindow;
            if (monomers != null && monomers.length > 0 && o_editor != null && o_editor.setMonomers != null) {

                o_editor.setMonomers(monomers);
                o_editor.setHELM(helm)
                this.listenerFunction(o_editor)
                clearInterval(iid);
            } else {
                // o_editor.setHELM(helm)
                // this.listenerFunction(o_editor)
                // clearInterval(iid);
            }
        }, 100)
        // setTimeout(() => {

        //     var el: HTMLIFrameElement = this.oligoEditor.nativeElement;
        //     var o_editor: any = el.contentWindow;
        //     if (monomers != null)
        //         o_editor.setMonomers(monomers);
        //     o_editor.setHELM(helm)
        //     this.listenerFunction(o_editor)
        // }, 2000)

        setTimeout(() => {
            clearInterval(iid);
        }, 20000)


    }


    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
        }
    }


    updateHELMValue(event): void {


        // this.helm = event;
        // if (this.helm_medchem_window) {
        // this.helm_medchem_window.close();
        // }
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
        // console.log ( " resolving function " );
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