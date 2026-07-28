import { Component, Input, ChangeDetectorRef} from '@angular/core';
import {OnInit} from "@angular/core";
import {  IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerManagerListener } from "./monomer-manager-listener";
import { AppListener, ApplicationControls } from "./application-controls";
import { MonomerManager } from "./monomer-manager.component";
import { Hit } from "../db/hit";
import { MonomerLoader } from "../db/monomer-loader";

@Component({
    selector: 'unit-builder',
    styleUrls: ['./styles/list.css'],

    template: `
            <div  class="table-responsive" style="padding: 15px;">
                <tr>
                    <td>
                    </td>
                </tr>
            </div>
    `,
})
export class UnitBuilder implements OnInit, MonomerManagerListener, AppListener {
    @Input()
    monomer_db:MonomerDB;
    monomer_manager:MonomerManager;
    selectedGroup:string = "Any";
    substructureList:Hit[];
    app_control:ApplicationControls;
    monomer_type:string = "any";
    monomers:IMonomer[];
    unit_text:string;


    constructor(private monomer_loader:MonomerLoader, private ref:ChangeDetectorRef) {
        this.app_control = new ApplicationControls();
        this.monomer_manager = new MonomerManager(this.monomer_db);
        var intervalId = setInterval(() => {
            if (this.monomer_db) {
                clearInterval(intervalId);
                this.ref.markForCheck();
            }
        }, 1000);
        this.monomer_loader.getMonomers().subscribe(monomers => this.setMonomerDatabase(monomers));
    }

    setMonomerDatabase(mdb:IMonomer[]):void {
        if ( !this.monomer_db ){
            this.monomer_db = new MonomerDB ();
        }
        // this.monomer_db.monomers = mdb;
        this.monomer_manager.setMonomer_db(this.monomer_db);
        this.ref.markForCheck();

    }

    newMonomer():void {

    }


    ngOnInit():any {
        if (this.monomer_manager) {
            this.monomer_manager.addListener(this)
        }
        if (this.app_control != undefined) {
            this.app_control.addListener(this);
            this.app_control.notifyOfNewMonomerState();
        }


    }

    updatevalue(elem:HTMLSelectElement):void {
        var selectedval = elem.value;
        this.selectedGroup = selectedval;
        // console.log(this.selectedGroup + " ___selected " + selectedval);
    }

    updateGroup(ngroup:string):void {
        this.selectedGroup = ngroup;
    }

    select(vl:HTMLSelectElement, $event):void {
        var val = vl.value;
        // console.log( ' value : '+ val );
    }

    updateSelectedStructure(ionisMon:IMonomer, msg:string):void {
        // we have the selected ionis monomer


    }

    updateSelectedSubstructureList(substructureList:Hit[]) {
        if ((substructureList != undefined) && substructureList.length > 1) {
            this.substructureList = substructureList;
            this.selectedGroup = 'Substructure';

        }
    }

}
