import {OnInit, Component, Input, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import { IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerManagerListener } from "./monomer-manager-listener";
import { MonomerManager } from "./monomer-manager.component";
import { MonomerLoader } from "../db/monomer-loader";
import { MonomerSaver } from "../db/monomer-saver";
import { Hit } from "../db/hit";
import { Observable } from 'rxjs';

@Component({
    selector: 'monomer-group',
    styleUrls: ['./styles/list.css'],
    // inputs: ['monomer_db', 'monomer_manager', 'monomer_type', 'polymer_type', 'searchTerm', 'ispublic', 'canDelete', 'display', 'nameSearchTerm'],
    changeDetection: ChangeDetectionStrategy.Default,
    template: `

         <div *ngIf="display=='symbol'"class='tabContainer' style="width: 90%;">
                      <ul>  
                       <li *ngFor='let monomer of monomer_db?.getMonomers(polymer_type, monomer_type) | monomer_filter : searchTerm ; let i=index'>
                            <div class="btn btn-secondary-outline btn-xs" id={{i}} type="input" (click)="loadAndSelect(monomer)" #inputfield> ({{ monomer.symbol }})
                            </div>

                       </li>
                      </ul>
          </div>
         <div *ngIf="display=='name'" class='tabContainer' style="width: 95%;">
                       <div *ngFor='let monomer of monomer_db?.getMonomers(polymer_type, monomer_type) |  monomer_filter : searchTerm | monomer_name_filter : nameSearchTerm ; let i=index'  style='font-size:xx-small'>
                            <div  id={{i}} type="input" (click)="loadAndSelect(monomer)" #inputfield style='font-size:small; align: left; cursor: pointer'> 
                            {{monomer.name }}, (<font color="BLUE">{{monomer.symbol }}</font> )
                            </div>
                            <hr>

                       </div>
          </div>
          
          <div>

        </div>

          
          
    `,
})
export class MonomerSelectionListComponent implements OnInit, MonomerManagerListener {

    @Input()
    monomer_db:MonomerDB;
    @Input()
    monomer_manager:MonomerManager;
    @Input()
    monomer_type:string;
    @Input()
    polymer_type:string;
    @Input()
    searchTerm:string = "";
    @Input()
    nameSearchTerm:string = "";
    @Input()
    ispublic:string = "*";
    @Input()
    canDelete:boolean = false;
    @Input('name')
    display:string = "name";

    // @ViewChild('modal')
    // modal:Modal;
    // @ViewChild('make_public')
    // public_modal:Modal;


    selectedMonomer:IMonomer;

    constructor(private monomer_loader:MonomerLoader, private monomer_writer:MonomerSaver, private ref:ChangeDetectorRef) {
    }

    ngOnInit():any {
        if (this.monomer_manager != null) {
            this.monomer_manager.addListener(this);
        }

    }


    updateSelectedStructure(ionisMon:IMonomer, msg:string):void {
    }

    updateSelectedSubstructureList(substructureList:Hit[]):void {
    }



    public saveMonomer(monomer:IMonomer):IMonomer {
        this.ref.markForCheck();
        return monomer;
    }

    public loadstructure(value:IMonomer):Observable<IMonomer> {
        return this.monomer_loader.getMonomer(+value.id);
    }

    public loadAndSelect(mon):void {
        this.monomer_manager.setSelectedMonomer ( mon );
        // this.monomer_loader.getMonomer(+value.monomerid).subscribe(mon => this.monomer_manager.setSelectedMonomer(mon));
    }

    public  listMonomers(mon, monomer_type):Array<IMonomer> {
        var ion:Array<IMonomer> = new Array<IMonomer>();
        var index = 0;
        for (var propName in mon) {
            var i:IMonomer = mon[propName]

            if (monomer_type == 'any') {
                ion.push(i);
            } else {
                // var n:Array<number> = this.getids(i, monomer_type);
                // if (n && n.length > 0) {
                //     ion.push(i);
                // }
            }
        }
        return ion;
    }

    removeMonomer():void {
        // this.modal.open();
    }


    cancelModal(model:any):void {
        // this.modal.close();
    }


    delete(model:any):void {
        // this.modal.close();

    }


}
