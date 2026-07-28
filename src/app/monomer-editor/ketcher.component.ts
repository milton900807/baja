import {
    OnInit, Input, Output, EventEmitter,
    Component, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core";
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { MonomerManagerListener } from "./monomer-manager-listener";
import { AppListener, ApplicationControls } from "./application-controls";
import { MolecularViewer } from "./molecular-viewer";
import { MonomerManager } from "./monomer-manager.component";
import { IMonomer } from "../db/monomerdb";
import { Hit } from "../db/hit";
import { HttpClient } from "@angular/common/http";


@Component({
    selector: 'ketcher-2',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `

    <div class="panel panel-info" style="color: #0000CC; border: NONE">
        <iframe id="ketcher-frame" [src]="set_frame_component()" (lang)="langchange()" (innerText)="smilesChange()" width="100%" height="550px" scrolling="no" border="NONE" #ketcher_frame>
        </iframe>
    </div>

     `,
})
export class KetcherComponent implements OnInit, MonomerManagerListener, AppListener, MolecularViewer {
    // ketcher2ref: string =  "./ketcher2.0/ketcher.html";

    title__ = '';

    @Input()
    monomer_manager: MonomerManager;
    currentSmiles: string;
    @Output() structure: EventEmitter<string> = new EventEmitter<string>();
    @Output() substructureof: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();
    frame_component: string;

    @ViewChild('ketcher_frame') kecherFrame: ElementRef;
    @Input() app_control: ApplicationControls;

    selection;


    constructor(private http: HttpClient, private ref: ChangeDetectorRef, private sanitizer: DomSanitizer) {
    }

    set_frame_component(): any {
        // this.frame_component = this.sanitizer.bypassSecurityTrustResourceUrl("ketcher2.0/ketcher.html");
        this.frame_component = "/assets/ketcher/ketcher.html";
        return this.sanitizer.bypassSecurityTrustResourceUrl(this.frame_component);
    }


    getSmiles(): string {
        if (this.kecherFrame) {
            var el: HTMLIFrameElement = this.kecherFrame.nativeElement;
            // smiles is stored in the ketcherframe title
            return el.title.toString();
        }
        return '';
    }
    langchange(): any {
        return null;
    }
    ngOnInit(): any {
        if (this.monomer_manager != null && this.monomer_manager != undefined) {
            this.monomer_manager.addListener(this);
            this.monomer_manager.setStructureViewer(this);
            // this.frame_component = this.sanitizer.bypassSecurityTrustResourceUrl("ketcher2.0/ketcher.html");
        }
        if (this.app_control != undefined) {
            this.app_control.addListener(this);
        }
        // this.ref.detectChanges();
    }
    public structureChanged(): boolean {
        if (this.kecherFrame) {
        }
        return false;
    }
    isbondblock(line: string): boolean {
        let sp = line.split(" ");//input.split(/[ ,]+/);
        if (sp.length == 6) {
            return true;
        } else {
            return false;
        }
    }


    fixMonomer(molfile: string): string {

        var rows = molfile.split('\n');
        let atoms: Array<string> = new Array<string>();
        let atom_block: boolean = false;
        let bond_block: boolean = false;
        let header: Array<string> = new Array<string>();
        for (let i = 0; i < rows.length; i++) {
            let s = rows[i];
            if (i < 4) {
                header.push(s);
            }
            else if (i == 4) {
                atom_block = true;
            } else if (this.isbondblock(s)) {
                atom_block = false;
                bond_block = true;
            } else {
                bond_block = false;
            }

            if (atom_block) {
                atoms.push(s);
            }

            if (s.startsWith("A")) {
                let line_index_set = s.split(/\s+/);
                if (line_index_set.length == 2) {
                    if (!isNaN(parseInt(line_index_set[1]))) {
                        let atom_block_line_index = Number(line_index_set[1]) - 1;
                        let atom_block_line_label = rows[i + 1];
                        atoms[atom_block_line_index] = atoms[atom_block_line_index].replace('C', atom_block_line_label);
                    }
                }
            }
        }





        let molfilenew: string = "";
        for (let i = 0; i < rows.length; i++) {
            if (i < 4) {
                molfilenew += header[i] + "\n";
            } else
                if (i >= 4 && (i - 4) < atoms.length) {
                    molfilenew += atoms[i - 4] + "\n";
                }
        }
        return molfilenew;
    }

    public getMolfileForCurrentStructure(): string {
        var el: HTMLIFrameElement = this.kecherFrame.nativeElement;
        if (el)
            return this.fixMonomer(el.lang);
        else
            return "";
    }

    updateSelectedStructure(ionisMon: IMonomer, msg: string): void {
        // this.selection = ionisMon;
        if (ionisMon != null) {
            this.setMolFile(ionisMon);
        } else {
            // this.frame_component = this.sanitizer.bypassSecurityTrustResourceUrl("app/ketcher2.0/ketcher.html");
        }
    }

    async setMolFile(ion: IMonomer) {
        if (ion == null || ion == null || ion.molfile == null || ion.molfile == "") {
            // this.frame_component = this.sanitizer.bypassSecurityTrustResourceUrl("app/ketcher2.0/ketcher.html");
            return;
        }
        this.title__ = ion.symbol;
        var molfile = ion.molfile
        if (molfile == null || (!molfile.trim().endsWith("END"))) {
            molfile = "";
        }
        var el: HTMLIFrameElement = this.kecherFrame.nativeElement;
        var ketcher__: any = el.contentWindow;
        ketcher__.setMolecule(molfile);
        this.selection = ion;
        console.log(' title ' + this.title__);
    }


    updateSelectedSubstructureList(substructureList: Hit[]): void {
    }

    newMonomer(): void {
    }


    smilesChange() {

    }
}
