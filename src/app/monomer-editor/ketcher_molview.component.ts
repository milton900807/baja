import {
    OnInit, Input, Output, EventEmitter,
    Component, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core";
import {Observable} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';
import { IMonomer} from "../db/monomerdb";
import { Hit } from "../db/hit";
import { MonomerManager } from "./monomer-manager.component";
import { ApplicationControls } from "./application-controls";

@Component({
    selector: 'molview',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: 
    
//     `

//   <div class="panel panel-danger">
//       <div class="panel panel-info" style="color: #0000CC; border: NONE">
//         <iframe id="ketcher-frame" [src]="set_frame_component()" (lang)="" (innerText)="smilesChange()" [name]="mol"  width="100%" height="520px" scrolling="no" border="2px BLUE" #ketcher_frame>
//         </iframe>
//       </div>
//       </div>
//      `
``,
})
export class KetcherMolview implements OnInit{

    title:string;

    @Input()
    mol:string;
    @Output() structure:EventEmitter<string> = new EventEmitter<string>();
    @Output() substructureof:EventEmitter<Array<string>> = new EventEmitter<Array<string>>();
    frame_component:string;
    @ViewChild('ketcher_frame')
     kecherFrame:ElementRef;
    
    @Input()
    monomer_manager:MonomerManager; 
    @Input()
    app_control:ApplicationControls;


    constructor(private ref:ChangeDetectorRef, private sanitizer:DomSanitizer) {
    }

    set_frame_component():any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(this.frame_component);
    }



    ngOnInit():any {
    }

    public structureChanged():boolean {
        if (this.kecherFrame) {
        }
        return false;
    }

    public getMolfileForCurrentStructure():string {
        var el:HTMLIFrameElement = this.kecherFrame.nativeElement;
        if (el)
            return el.lang;
        else
            return "";
    }

    updateSelectedStructure(ionisMon:IMonomer, msg:string):void {
        if (ionisMon != null ) {
            this.setMolFile(ionisMon);
        }else {
            this.frame_component = "app/ketcher2.0/ketcher.html";
        }
    }

    setMolFile(ion:IMonomer) {

        if ( ion == null || ion.molfile == null || ion.molfile == "")
        {
            this.frame_component = "app/ketcher2.0/ketcher.html";
            return;
        }

        this.title = ion.name;

        var molfile = ion.molfile
        if (molfile == null || (!molfile.trim().endsWith("END"))) {
            molfile = "";
        }
        var el:HTMLIFrameElement = this.kecherFrame.nativeElement;
        var ketcher__:any = el.contentWindow;
        ketcher__.setMolecule(molfile);
    }


    updateSelectedSubstructureList(substructureList:Hit[]):void {
    }

    newMonomer():void {
    }

    private  handleError(error:Response) {
        console.error(error);
        return Observable.call(error.json() || 'Server error');
    }
}
