import { Component, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { OnInit } from "@angular/core";
import {IMonomer } from "../db/monomerdb";
import { MonomerManagerListener } from "./monomer-manager-listener";
import { AppListener, ApplicationControls } from "./application-controls";
import { MonomerManager } from "./monomer-manager.component";
import { Hit } from "../db/hit";
import { MonomerDB } from '../db/MonomerDB.1';

@Component({
    selector: 'monomer-list',
    styleUrls: ['./styles/list.css'],
    changeDetection: ChangeDetectionStrategy.Default,
    template: `

            

            <div class="form-inline" style="padding:2px">
              <label for="email">Filter</label>
              <input id="typeahead-basic" type="text" class="form-control" [(ngModel)]="name_term" />
            </div>



            <div  class="table-responsive" style="padding: 15px;">
            <!--<div class="col-xs-12 col-sm-6 col-md-8">-->
            <select class="form-control" type="input" (change)="updatevalue(selectedvalue)" #selectedvalue>
                  <option value="All">All</option>
                  <option value="Chem">Conjugate and other structures </option>
                  <option value="RNA_BACKBONE" >Sugars and linkers (backbone structures)</option>
                  <option value="Bases">Bases (branch structures) </option>
                  <option value="Peptides">Peptides </option>
            </select>



             <div class="row">
             </div>
             
            <div *ngIf='selectedGroup=="All"' class="row">
                  <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)" (update)="setTerm($event)" (ispublic)="setPub($event)" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" 
                  [searchTerm]="term" 
                  [nameSearchTerm]="name_term" 
                  [ispublic]="ispub"></monomer-group>
            </div>

            <div *ngIf='selectedGroup=="Chem"' class="row">
               <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)"  
               (update)="term = $event" (ispublic)="ispub = $event" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" [polymer_type]="'CHEM'" [searchTerm]="term" 
                    [nameSearchTerm]="name_term" 
                  [ispublic]="ispub"></monomer-group>
            </div>
            <div *ngIf='selectedGroup=="RNA"' class="row">
               <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)"  (update)="term = $event" (ispublic)="ispub = $event" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" [polymer_type]="'RNA'" [searchTerm]="term"
                    [nameSearchTerm]="name_term"                   
                   [ispublic]="ispub"></monomer-group>
            </div>
            <div *ngIf='selectedGroup=="RNA_BACKBONE"' class="row">
               <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)"  (update)="term = $event" (ispublic)="ispub = $event" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" [polymer_type]="'RNA'" [monomer_type]="'backbone'" [searchTerm]="term" 
                    [nameSearchTerm]="name_term" 
                  [ispublic]="ispub"></monomer-group>
            </div>
            
            <div *ngIf='selectedGroup=="Peptides"' class="row">
               <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)"  (update)="term = $event" (ispublic)="ispub = $event" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" [polymer_type]="'PEPTIDE'" [monomer_type]="'backbone'" [searchTerm]="term"
                    [nameSearchTerm]="name_term" 
                   [ispublic]="ispub"></monomer-group>
            </div>
            <div *ngIf='selectedGroup=="Bases"' class="row">
               <filter-monomers [substructureList]="substructureList" (update_name)="setNameTerm($event)"  (update)="term = $event" (ispublic)="ispub = $event" ></filter-monomers>
                  <monomer-group [monomer_db]="monomer_db" [monomer_manager]="monomer_manager" [polymer_type]="'RNA'" [monomer_type]="'branch'" [searchTerm]="term" 
                    [nameSearchTerm]="name_term" 
                  [ispublic]="ispub"></monomer-group>
            </div>
            <div *ngIf='selectedGroup=="NewMonomer"' class="row">
                  <new-monomer [monomer_db]="monomer_db" [monomer_manager]="monomer_manager"
                  monomer_type="any" [app_control]="app_control"></new-monomer>
            </div>
            </div>
    `,
})
export class MonomerListComponent implements OnInit, MonomerManagerListener, AppListener {
    @Input()
    monomer_db: MonomerDB;
    @Input()
    monomer_manager: MonomerManager;
    selectedGroup: string = "All";
    substructureList: Hit[];
    @Input()
    app_control: ApplicationControls;
    ispub: string;
    term: string;
    name_term: string;


    constructor(private ref: ChangeDetectorRef) {

    }
    newMonomer(): void {

    }
    setTerm(event) {
        this.term = event;
        // this.ref.markForCheck();

    }
    setNameTerm(event) {
        this.name_term = event;
        // this.ref.markForCheck();

    }
    setPub(event) {
        this.ispub = event;
        // console.log ( ' is public ' + this.ispub );
        this.ref.markForCheck();

    }


    ngOnInit(): any {
        if (this.monomer_manager) {
            this.monomer_manager.addListener(this)
        }
        if (this.app_control != undefined) {
            this.app_control.addListener(this);
        }

        this.app_control.notifyOfNewMonomerState();
        this.ref.detectChanges();

    }

    updatevalue(elem: HTMLSelectElement): void {
        var selectedval = elem.value;
        this.selectedGroup = selectedval;
        // console.log ( this.selectedGroup + " ___selected " + selectedval);
        if (selectedval == 'NewMonomer') {
            this.app_control.notifyOfNewMonomerState();
        }
        this.ref.detectChanges();
    }

    updateGroup(ngroup: string): void {
        this.selectedGroup = ngroup;
        this.ref.detectChanges();
    }

    select(vl: HTMLSelectElement, $event): void {
        var val = vl.value;
        // console.log( ' value : '+ val );
    }

    updateSelectedStructure(ionisMon: IMonomer, msg: string): void { }
    updateSelectedSubstructureList(substructureList: Hit[]) {
        if ((substructureList != undefined) && substructureList.length > 1) {
            this.substructureList = substructureList;
            this.selectedGroup = 'Substructure';
            this.ref.markForCheck();

        }
    }

}
