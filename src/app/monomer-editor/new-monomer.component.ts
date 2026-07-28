import { OnInit,  Component, Input, ChangeDetectorRef, Injectable } from '@angular/core';
import { MonomerManagerListener } from "./monomer-manager-listener";
import { IMonomer } from "../db/monomerdb";
import { MonomerManager } from "./monomer-manager.component";
import { Hit } from "../db/hit";
import { ApplicationControls } from "./application-controls";
import { MonomerLoader } from "../db/monomer-loader";
import { environment } from "../../environments/environment";
import { HttpClient } from '@angular/common/http';
import { MonomerDB } from '../db/MonomerDB.1';



@Injectable()
export class ISearchResults {

    hits: Hit[];
}
@Component({
    selector: 'new-monomer',
    styleUrls: ['./styles/list.css'],
    //changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
       <div class="panel default-color0" style="padding: 2px">
        <p style="padding-left: 20px">
         <button type="button" (click)="validateCurrentStructure()" class="btn btn-primary"> Structure search... </button>
         </p>
        <!--<validate-structure [smiles]="searchTerm"></validate-structure>-->
        <p style="padding: 2px;">
        {{ search_status }}
        </p>
         <!--<div *ngIf="hits.length == 0" style="padding: 5px">-->
            <!--No monomers found with current structure.-->
         <!--</div>-->
         <div *ngIf="hits" class='tabContainer'>
                      <ul>
                       <li *ngFor='let hit of hits; let i=index'>
                            <!--<input type="text" #input>-->
                            <div class="btn btn-secondary-outline btn-xs" id={{i}} type="input" (click)="loadstructure(hit)" #input>
                            ({{hit.hit_type}}) {{hit.symbol}}
                                <div *ngIf="hit.hit_type=='exact'" style="color: red; font-style: italic">
                                    ***Exact match***
                                </div>
                            </div>

                       </li>
                      </ul>
          </div>
          </div>

    `,
})
export class NewMonomerComponent implements OnInit, MonomerManagerListener {
        // inputs: ['monomer_db', 'monomer_manager', 'monomer_type', 'ispublic', 'app_control'],
    @Input()
    monomer_db:MonomerDB;
    @Input()
    monomer_manager:MonomerManager;
    hits:Hit[];
    @Input()
    ispublic:string = "*";
    search_status:string = '';
    @Input()
    app_control:ApplicationControls;

    constructor(private monomer_loader:MonomerLoader, private ref:ChangeDetectorRef, private http:HttpClient) {
    }

    updateSelectedStructure(ionisMon:IMonomer, msg:string):void {

    }

    updateSelectedSubstructureList(substructureList:Hit[]):void {
        //this.monomers = this.listWithSubstructureFilter(substructureList);
        this.ref.markForCheck();
    }

    ngOnInit():any {
        if (this.monomer_db != null) {
            //this.monomers = this.list();
        }
        if (this.monomer_manager != undefined) {
            this.monomer_manager.addListener(this);
        }
    }

    validateCurrentStructure():void {
        var searchTerm = this.monomer_manager.getViewerSmiles();
        if (searchTerm && searchTerm.length > 1) {
            var encoded_smiles = encodeURIComponent(searchTerm);
            var uri:string = environment.substructureurl + "smarts=" + encoded_smiles;
            this.search_status = "Searching..." + encoded_smiles;
            this.http.get(uri).subscribe((response:Response) => (<ISearchResults><unknown>(response.json())))
        }
    }

    setResults(results:ISearchResults) {
        this.search_status = '';
        if (results) {
            this.hits = results.hits;
        }
        this.ref.detectChanges();
    }

    private  handleError(error:Response) {
        this.search_status = error.toString();
        console.error(error);
        return (error.json() || 'Server error');
    }


    public loadstructure(input:Hit):void {
        this.monomer_loader.getMonomer(+input.monomer_id).subscribe(mon => this.monomer_manager.setSelectedMonomer(mon));
    }

    public  list():Array<IMonomer> {

        var ion:Array<IMonomer> = new Array<IMonomer>();
        var index = 0;

        var sub:Hit[] = this.monomer_manager.substructure_set;
        if (sub != undefined && sub.length > 0) {
            for (var propName in this.monomer_db) {
                var i:IMonomer = this.monomer_db[propName];
                for (var ss in sub) {

                    if (sub[ss].symbol == i.alternateId) {
                        ion.push(i);
                    }
                }
            }

            // substructure has come to its end... here.
            //this.monomer_manager.substructure_set=new Array<string>();
        }
        return ion;

    }

    public  listWithSubstructureFilter(sub:Array<Hit>):Array<IMonomer> {
        var ion:Array<IMonomer> = new Array<IMonomer>();
        var index = 0;
        if (sub != undefined && sub.length > 0) {
            for (var propName in this.monomer_db) {
                var i:IMonomer = this.monomer_db[propName];
                for (var ss in sub) {
                    var h:Hit = sub[ss];
                    console.log(h.symbol);
                    if (sub[ss].symbol == i.alternateId) {
                        ion.push(i);
                    }
                }
            }
            // substructure has come to its end... here.
            //this.monomer_manager.substructure_set=new Array<string>();
        }
        return ion;
    }


    public getids(m:IMonomer, type:string):Array<number> {
        var vals:Array<number> = new Array<number>();
        var idstr:string;
        return vals;
    }

}
