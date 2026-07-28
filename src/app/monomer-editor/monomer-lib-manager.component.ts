import { OnInit, Input, Component, ChangeDetectorRef, ChangeDetectionStrategy} from "@angular/core";
import { AppListener, ApplicationControls } from "./application-controls";
import { MonomerManagerListener } from "./monomer-manager-listener";
import { IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerManager } from "./monomer-manager.component";
import { DownloadData } from "../db/download-data";
import { Hit } from "../db/hit";


@Component({
    selector: 'monomer-library-manager',
    styleUrls: ['./styles/list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './monomer-lib-manager.component.html',
})
export class MonomerLibraryManager implements OnInit, AppListener, MonomerManagerListener {
    @Input()
    monomer_db:MonomerDB;
    currentMonomer:IMonomer;
    @Input()
    monomer_manager:MonomerManager;
    appman:ApplicationControls;

    constructor(private downloader:DownloadData, private ref:ChangeDetectorRef) {
        this.appman = new ApplicationControls();
        this.monomer_manager = new MonomerManager(this.monomer_db);
        this.currentMonomer = this.monomer_manager.getDefaultMonomer();
        this.monomer_manager.setSelectedMonomer(this.currentMonomer);
        var intervalId = setInterval(() => {
            if (this.monomer_db) {
                clearInterval(intervalId);
            }
            this.ref.markForCheck();
        }, 1000);
        // this.monomer_loader.getMonomers().subscribe(monomers => this.setMonomerDatabase(monomers));

    }
    newMonomer(): void {
        throw new Error("Method not implemented.");
    }

    ngOnInit():any {
        if (this.appman != undefined) {
            this.appman.addListener(this);
        }



    }
    downloadPublic() : void {
        this.downloader.downloadPub();
    }
    downloadAll() : void {
        this.downloader.downloadAll();
    }
    downloadPrivate() : void {
        this.downloader.downloadPub();
    }

    setMonomerDatabase(mdb:IMonomer[]):void {
        this.monomer_db.monomers = mdb;
        this.monomer_manager.setMonomer_db(this.monomer_db);
        this.ref.markForCheck();

    }



    updateSelectedStructure ( ionisMon : IMonomer, msg:string ) : void{
        this.currentMonomer=ionisMon;

    }
    updateSelectedSubstructureList ( substructureList:Hit[] ) : void{}


}