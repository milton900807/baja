/**
 * Created by jmilton on 6/2/2016.
 */

import {OnInit, Component, Input, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, ViewChild} from '@angular/core';
import { AppListener, ApplicationControls } from "./application-controls";
import { MonomerManagerListener } from "./monomer-manager-listener";
import { MonomerManager } from "./monomer-manager.component";
import { Hit, StructureClashListener } from "../db/hit";
import { IAttachment, IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerActionObserver } from "./monomer-action-observer";

@Component({
    selector: 'monomer-attribute-editor',
    styleUrls: ['./styles/monomer-editor.css'],
    
    template: `

  <div *ngIf="monomer_manager?.selectedMonomer" class='panel panel-heading' style="color: darkblue; padding: 2px;">










                    <div class="btn-toolbar" role="toolbar" aria-label="..."  style="color: darkblue; padding: 2px;">
                        <button type="button" class="btn btn-default btn-sm" (click)="displayMolfile()">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true" ></span>
                             Show mol file
                        </button>
                        <button type="button" class="btn btn-default btn-sm" (click)="saveSelectedMonomer()">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true" ></span>
                             Overwrite existing monomer
                        </button>
                        </div>



                        





                        <form class="form-inline" role="form">
                              <div class="form-group form-group-sm">

                                        <label *ngIf='monomer_manager?.selectedMonomer.id'> ( {{monomer_manager?.selectedMonomer?.id}} ) </label> > 
                                        <label for="m_id">HELM ID </label>
                                        <label for="m_name"> Name </label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.monomer.name" name="monomer_name" class="form-control" id="m_name" type="text" style="width=300px">
                                        <hr>
                                        <label class="radio-inline"><input type="radio" name="optradio" [checked]="is_monomer_type('Backbone')" (click)="set_monomer_type('Backbone')">Backbone (e.g. sugar, linker)</label>
                                        <label class="radio-inline"><input type="radio" name="optradio" [checked]="is_monomer_type('Branch')" (click)="set_monomer_type('Branch')" > Branch (e.g. base)</label>
                                        <label class="radio-inline"><input type="radio" name="optradio" [checked]="is_monomer_type('Undefined')" (click)="set_monomer_type('Undefined')" > Undefined (e.g. CHEM polymers, endcaps)</label>
                                        <hr>                                        
                                        <label class="radio-inline"><input type="radio" name="POLYradio"  [checked]="is_polymer_type('RNA')" (click)="set_polymer_type('RNA')">RNA (e.g. sugar, linker)</label>
                                        <label class="radio-inline"><input type="radio" name="POLYradio"  [checked]="is_polymer_type('CHEM')"  (click)="set_polymer_type('CHEM')" > CHEM (e.g. endcap, other chemical conjugates)</label>
                                        <label class="radio-inline"><input type="radio" name="POLYradio"  [checked]="is_polymer_type('PEPTIDE')" (click)="set_polymer_type('PEPTIDE')" > PEPTIDE </label>
                                        <hr>
                                        <label for="m_natural_analog"> Natural Analog </label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.monomer.naturalAnalog" name="monomer_natural_analog" class="form-control" id="m_natural_analog" type="text">
                                        <hr>
                                        
                                        <label for="focusedInput">Public status</label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.ispublic" name="is_public" class="form-control" id="focusedInput" type="text">
                                        <br>
                                        
                                        
                                        
                                        <label for="endcapid">End-Cap ID</label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.endcapID" name="endcap_id" class="form-control" id="endcapid" type="text">
                                        <label for="sugar_id">Sugar ID</label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.sugarId" name="sugar_id" class="form-control" id="sugar_id" type="text">
                                                                                <br>

                                        <label for="het_id">Base ID</label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.het_id" name="het_id" class="form-control" id="het_id" type="text">
                                        <label for="linker_id">Linker ID</label>
                                        <input #mid [(ngModel)]="monomer_manager.selectedMonomer.linkerId" name="link_id" class="form-control" id="linker_id" type="text">
                                        
                                         <hr>
                                         
                                         <p>
                                            <b>R-group default attachments:</b>
                                         </p>
                                         <br>

                                        <label for="het_id">R1 attachment</label>
                                        <input #mid [(ngModel)]="attachment1" class="form-control" name="attachment_id_1" id="attachement_point_id1" type="text">
                                        <br>
                                        <label for="het_id">R2 attachment</label>
                                        <input #mid [(ngModel)]="attachment2" class="form-control" name="attachment_id_2" id="attachement_point_id2" type="text">
                                        <br>
                                        <label for="het_id">R3 attachment</label>
                                        <input #mid [(ngModel)]="attachment3" class="form-control" name="attachment_id_3" id="attachement_point_id3" type="text">
                                        <hr>
                                        <label for="primary_citation_label">Primary Citation</label>
                                        <br>
                                        <textarea #mid class="form-control" name="citation_text" rows="5"  cols="100" [(ngModel)]="monomer_manager.selectedMonomer.monomer.primary_citation" type="textarea">
                                        </textarea>
                                        <hr>

                              </div>
                        </form>

                    <div class="btn-toolbar" role="toolbar" aria-label="...">
                        <button type="button" (click)="verify_is_unique()" class="btn btn-secondary">Test structure uniqueness</button>
                        <button type="button" class="btn btn-default btn-sm" (click)="save_as_prompt()">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true" ></span>
                             Save as new monomer
                        </button>
                        <button type="button" class="btn btn-default btn-sm" (click)="saveSelectedMonomer()">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true" ></span>
                             Overwrite existing monomer
                        </button>
                        <button type="button" class="btn btn-default btn-sm" (click)="displayMolfile()">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true" ></span>
                             Show mol file
                        </button>
                    </div>

                        
                        {{ msg }}
                        <br>

                        <div *ngIf="canonical_smiles_hits">
                        {{ canonical_smiles_hits }}
                        </div>




</div>

    `,
    encapsulation: ViewEncapsulation.None

})
export class MonomerAttributeEditor implements OnInit, AppListener, MonomerActionObserver, MonomerManagerListener, StructureClashListener{
    @Input ()
    monomer_manager:MonomerManager = null;

    @Input ()
    monomer_db:MonomerDB;
    @Input ()
    app_control:ApplicationControls;
    msg:string = "";
    attachment1:string;
    attachment2:string;
    attachment3:string;
    smiles_hits:Array<Hit> = new Array<Hit> ();
    canonical_smiles_hits:string = "";
    morgan_fp_hits:string = "";
    molfile:string = "";
    // inputs: ['monomer_db', 'monomer_manager', 'app_control'],




    constructor() {
    }


    close_molfile_display ()
    {
    }


    structures_found  (hits:Hit[]) : void {
        this.smiles_hits = new Array<Hit> ();
        if ( hits.length > 0 ){
            for ( let h of hits ){
                if ( h.hit_type == 'canonical_smiles'){
                    this.canonical_smiles_hits += " " + h.symbol + " ";
                }else if ( h.hit_type == 'topology'){
                        this.msg += " " + h.symbol + " ";
                }else if ( h.hit_type == 'morgan_fingerprint'){
                        this.morgan_fp_hits += " " + h.symbol + " ";
                }
            }
        }
        else{
            this.msg = "This is a unique structure.";
        }


    }



    ngOnInit():any {
        if (this.app_control != null) {
            this.app_control.addListener(this);
        }

        if ( this.monomer_manager != null )
        {
            this.monomer_manager.addListener(this)
            this.monomer_manager.addStructureClashListener ( this );
        }


        // this sucks nned to change but time is kickin my butt right now 
        if ( this.monomer_manager.selectedMonomer != null )
        {
            let alist = this.monomer_manager.selectedMonomer.attachmentList;
            for (let a=0; a<alist.length; a++){
                if ( a == 0 ){
                    this.attachment1 = alist[0].capGroupName;
                }
                if ( a == 1 ){
                    this.attachment2 = alist[1].capGroupName;
                }
                if ( a == 2 ){
                    this.attachment3= alist[2].capGroupName;
                }

            }
        }
    }
    
    is_monomer_type ( v:string ) : boolean {

        if ( v == this.monomer_manager.selectedMonomer.monomerType )
            {
                return true;
            }
            else{
                return false;
            }

    }
    
    is_polymer_type ( v:string ) : boolean {

        if ( v == this.monomer_manager.selectedMonomer.polymerType )
            {
                return true;
            }
            else{
                return false;
            }

    }

    updateSelectedStructure ( ionisMon : IMonomer, msg:string ) : void {
        this.msg = msg;
        this.canonical_smiles_hits="";
        this.morgan_fp_hits = "";
        this.update_attachment_text();

    }
    updateSelectedSubstructureList ( substructureList:Hit[] ): void {
    }


    /**
     *  not proud of this method. but time is not on my side. 
     */
    update_attachment_text(){
        this.attachment1 = '';
        this.attachment2 = '';
        this.attachment3 = '';
        



         if (this.monomer_manager.selectedMonomer==null || this.monomer_manager.selectedMonomer.attachmentList == undefined)
             return;
        var i:number = 0;
        for (let i=0; i<this.monomer_manager.selectedMonomer.attachmentList.length; i++){
            var val:IAttachment = this.monomer_manager.selectedMonomer.attachmentList[i];
            if (i==0){
                this.attachment1 = val.capGroupName;
            }
            else if ( i == 1 ){
                this.attachment2 = val.capGroupName;
            }else if ( i == 2 ){
                this.attachment3 = val.capGroupName;
            }

        }
    }



    set_polymer_type (type:string):void {
        this.monomer_manager.selectedMonomer.polymerType=type
    }

    set_monomer_type(type:string):void {
        this.monomer_manager.selectedMonomer.monomerType=type
        // this.saveSelectedMonomer( this.modal );
    }
    isbondblock ( line:string )  : boolean {
        let sp = line.split (" ");//input.split(/[ ,]+/);
        if ( sp.length == 6 )
        {
            return true;
        }else{
            return false;
        }
    }


    fixMonomer ( molfile: string ) : string {

        var rows = molfile.split('\n');
        let atoms:Array<string> = new Array<string>();
        let atom_block : boolean = false;
        let bond_block : boolean = false;
        let header:Array<string> = new Array<string> ();
        for ( let i = 0; i < rows.length; i++)
        {
            let s = rows[i];
            if ( i < 4 ){
                header.push ( s );
            }
            else if ( i == 4){
                atom_block = true;
            }else if ( this.isbondblock ( s ) ){
                atom_block = false;
                bond_block = true;
            } else {
                bond_block = false;
            }

            if ( atom_block )
            {
                atoms.push ( s );
            }

            if (s.startsWith ("A") ){
                let line_index_set = s.split ( /\s+/ );
                if ( line_index_set.length == 2){
                    if (!isNaN(parseInt ( line_index_set[1] ))){
                        let atom_block_line_index = Number ( line_index_set[1] )-1;
                        let atom_block_line_label = rows[i+1];
                        atoms[atom_block_line_index] = atoms[atom_block_line_index].replace ( 'C', atom_block_line_label );
                    }
                }
            }
        }





        let molfilenew:string = "";
        for ( let i = 0; i < rows.length; i++)
        {
            if ( i < 4 ){
                molfilenew+= header[i] + "\n";
            }else 
            if ( i >= 4 && (i-4) < atoms.length )
            {
                molfilenew+=atoms[i-4] + "\n";
            }
        }
        return molfilenew;
    }


    displayMolfile () : void {
        this.molfile = this.fixMonomer (this.monomer_manager.getMolfileForCurrentStructure());
    }




    saveSelectedMonomer():void {
        this.msg = "Saving...";
        this.canonical_smiles_hits="";
        this.morgan_fp_hits = "";
        let at1 = new IAttachment ("R1-"+this.attachment1)
        let at2 = new IAttachment ("R2-"+this.attachment2)
        let at3 = new IAttachment ("R3-"+this.attachment3)
        this.monomer_manager.selectedMonomer.attachmentList = [];

        if ( this.attachment1 != null && this.attachment1.length > 0) {
            this.monomer_manager.selectedMonomer.attachmentList.push ( new IAttachment ( ("R1-" + this.attachment1 ) ) );
        }
        if ( this.attachment2 != null && this.attachment2.length > 0) {
            this.monomer_manager.selectedMonomer.attachmentList.push ( new IAttachment ( ("R2-" + this.attachment2 ) ) );
        }
        if ( this.attachment3 != null && this.attachment3.length > 0) {
            this.monomer_manager.selectedMonomer.attachmentList.push ( new IAttachment ( ("R3-" + this.attachment3 ) ) );
        }


        this.monomer_manager.saveCurrentStructure();
    }

    action_successful(monomer:IMonomer, msg:string):void {
        this.monomer_manager.setSelectedMonomer(monomer);
        this.monomer_manager.reload(this.monomer_manager.selectedMonomer);
     

         if (this.monomer_manager.selectedMonomer==null || this.monomer_manager.selectedMonomer.attachmentList == undefined)
             return;
        var i:number = 0;
        for (let i=0; i<this.monomer_manager.selectedMonomer.attachmentList.length; i++){
            var val:IAttachment = this.monomer_manager.selectedMonomer.attachmentList[i];
            if (i==0){
                this.attachment1 = val.capGroupName;
            }
            else if ( i == 1 ){
                this.attachment2 = val.capGroupName;
            }else if ( i == 2 ){
                this.attachment3 = val.capGroupName;
            }

        }
    }

    action_failed(monomer:IMonomer):void {
        // this.modal.close();
    }


    deleteMonomer():void {


    }

    newMonomer():void {

        console.log(" reset this panel ");


    }

    verify_is_unique () : void {
        this.msg = "Hits based on topology: ";
        this.canonical_smiles_hits = "Hits based on canonical smiles:  ";
        this.morgan_fp_hits = "Hits based on Morgan Fingerprint: ";
        this.monomer_manager.check_topology_uniqueness ();
        // this.monomer_manager.check_morgan_topology_uniqueness ();
        this.monomer_manager.check_canonical_smiles_uniqueness ();

    }


    cancel_save () : void {
    }
    save_as_prompt( ) : void {

        // this.monomer_manager.check_unique_monomer_id ( );
        this.monomer_manager.check_topology_uniqueness ();
        // this.monomer_manager.check_morgan_topology_uniqueness ();
        // this.monomer_manager.check_canonical_smiles_uniqueness ();

    }


    create_new_monomer ( ) : void {
        // this.monomer_manager.setSelectedMonomer ( this.monomer_manager.createNewMonomer() );   
    }
}
