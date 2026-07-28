import {
    OnInit, Input, Output, EventEmitter,
    Component, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core";
import {Observable} from 'rxjs';
//import 'rxjs/Rx';
import { MolecularViewer } from "./molecular-viewer";
import { IonisMonomer } from "../db/monomerdb";
import { Hit } from "../db/hit";
import { MonomerManager } from "./monomer-manager.component";
import { ApplicationControls } from "./application-controls";

@Component({
    selector: 'molecular-viewer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: ``
//     template: `

//   <div class="panel panel-default">
//       <div class="panel panel-info" style="color: #0000CC; border: NONE">
//         <iframe id="ketcher-frame" [src]="frame_component" (lang)="langchange()" (innerText)="smilesChange()" [name]="molfile"  width="100%" height="520px" scrolling="no" border="2px BLUE" #ketcher_frame>
//         </iframe>
//       </div>
//       </div>
//      `,
})
export class MolecularViewerComponent implements OnInit, MolecularViewer {
    @Input()
    molfile:string;
    @Input()
    currentSmiles:string;
    @Output() structure:EventEmitter<string> = new EventEmitter<string>();
    @Output() substructureof:EventEmitter<Array<string>> = new EventEmitter<Array<string>>();
    frame_component:string = "app/ketcher2.0/ketcher.html";
    @ViewChild('ketcher_frame') kecherFrame:ElementRef;

    // inputs: ['currentMonomer', 'monomer_manager', 'app_control'],
    @Input()
    currentMonomer:IonisMonomer;
    @Input() 
    monomer_manager:MonomerManager;
    @Input()
    app_control:ApplicationControls;



    constructor() {
    }


    getSmiles(): string {
        if (this.kecherFrame) {
            var el:HTMLIFrameElement = this.kecherFrame.nativeElement;
            return el.title.toString();
        }
        return '';
    }


    langchange () : any {
        return null;
    }

    ngOnInit():any {
    }

    public structureChanged():boolean {
        if (this.kecherFrame) {
            var el:HTMLIFrameElement = this.kecherFrame.nativeElement;
            if (el) {
                if (el.lang != this.molfile)
                    return true;
            }
        }
        return false;
    }



    public emitStructure():void {
        var cm_mol = this.getMolfileForCurrentStructure();
        this.molfile = cm_mol;
    }


    public getMolfileForCurrentStructure():string {
        var el:HTMLIFrameElement = this.kecherFrame.nativeElement;
        //console.log ( " el : " + el.lang );
        if (el)
            return el.lang;
        else
            return "";
    }


    updateSelectedSubstructureList(substructureList:Hit[]):void {
    }


    smilesChange(ionisMon:IonisMonomer):void {
    }

    private  handleError(error:Response) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        console.error(error);
        return Observable.call(error.json() || 'Server error');
    }
}
