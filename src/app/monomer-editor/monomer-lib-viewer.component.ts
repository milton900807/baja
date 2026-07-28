import {OnInit, Input,  Component, ChangeDetectorRef} from "@angular/core";
import { AppListener, ApplicationControls } from "./application-controls";
import { IonisMonomer, IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerManager } from "./monomer-manager.component";
import { MonomerLoader } from "../db/monomer-loader";
import { Hit } from "../db/hit";

@Component({
    selector: 'monomer-library',
    templateUrl: './monomer-lib-viewer.component.html',
})
export class MonomerLibraryViewer implements OnInit, AppListener {
    // currentMonomer:IonisMonomer;
    @Input()    
    monomer_manager:MonomerManager;
    appman:ApplicationControls;
    mode:string = "library";
    @Input()
    enable_editing:boolean = true;
    @Input()
    monomer_db;

    constructor(private monomer_loader:MonomerLoader, 
        private ref:ChangeDetectorRef){
        this.appman = new ApplicationControls();
    }

    ngOnInit():any {
        if (this.appman != undefined) {
            this.appman.addListener(this);
        }

    }


    setMonomerDatabase(mdb:IMonomer[]):void {
        if ( !this.monomer_db ){
            this.monomer_db = new MonomerDB ();
        }
        this.monomer_db.monomers = mdb;
        this.monomer_manager.setMonomer_db(this.monomer_db);

        for (let l of this.monomer_db.monomers){
            console.log ( ' l ' + l.monomerid);
        }

        this.ref.markForCheck ();
    }

    showSubstructureHits(event:Hit[]):void {
        this.monomer_manager.substructure_set = event;
        this.monomer_manager.notifyListeners();
    }

    structureUpdate(e) { 
        console.log( " evernt " + e )
    }

    public newMonomer():void {
        // var new_ionis_monomer: IMonomer = this.monomer_manager.createNewMonomer();
        // this.monomer_manager.setSelectedMonomer(new_ionis_monomer);
    }

    public refreshList () : void {
        // this.monomer_loader.getMonomers().subscribe(monomers => this.setMonomerDatabase(monomers));
    }

}