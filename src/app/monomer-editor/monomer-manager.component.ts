import { Component} from '@angular/core';
import { IonisMonomer, IMonomer } from "../db/monomerdb";
import { MonomerDB } from '../db/MonomerDB.1';
import { MonomerManagerListener } from "./monomer-manager-listener";
import { StructureClashListener, Hit } from "../db/hit";
import { MolecularViewer } from "./molecular-viewer";
import { environment } from "../../environments/environment";

import { MonomerActionObserver } from "./monomer-action-observer";
import { FunctionUtil } from '../functions/function-util';


@Component({
    selector: 'monomer-manager',
    styleUrls: ['./styles/list.css'],
    template: `
           
    <div>
    {{ msg }}
    </div>


    `,
})
export class MonomerManager implements MonomerActionObserver {

    selectedMonomer: IMonomer;
    listeners: Array<MonomerManagerListener> = new Array<MonomerManagerListener>();
    structure_clash_listeners: Array<StructureClashListener> = new Array<StructureClashListener>();
    substructure_set: Hit[];
    structure_viewer: MolecularViewer;
    // @ViewChild('modal')
    // modal: Modal;
    msg = "";

    constructor(private monomer_db: MonomerDB) {
    }


    addMonomer ( monomer ) {
        this.monomer_db.monomers.push ( monomer )
    }

    getViewerSmiles(): string {
        return this.structure_viewer.getSmiles();
    }
    getMolfileForCurrentStructure(): string {
        return this.structure_viewer.getMolfileForCurrentStructure();
    }

    public setSelectedMonomer(mon: IMonomer): void {
        this.selectedMonomer = mon;
        this.notifyListeners();
    }
    public addListener(_listener: MonomerManagerListener): void {
        this.listeners.push(_listener);
    }
    public setMonomer_db(monomer_db: MonomerDB): void {
        this.monomer_db = monomer_db;
    }
    public saveCurrentStructure(): void {
        this.msg = "Saving...";
        this.selectedMonomer.molfile = this.getMolfileForCurrentStructure();
        this.selectedMonomer.canSMILES = this.getViewerSmiles();
        // this.save_mon.updateMonomer(this.selectedMonomer, this);
    }
    public check_topology_uniqueness(): void {

        this.selectedMonomer.molfile = this.getMolfileForCurrentStructure();
        this.selectedMonomer.canSMILES = this.getViewerSmiles();
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(this.selectedMonomer);
        // FunctionUtil.POSTJSON(body, environment.generate_fingerprint).then(data => this.response(data, body))
    }

    public check_unique_monomer_id(monomer_id: string, polymer_type: string): void {
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');

        let js = {
            "monomer_id": monomer_id,
            "polymerType": polymer_type
        };
        var body = JSON.stringify(js);
        // FunctionUtil.POSTJSON(body, environment.monomer_lib_unique_check).then(data => this.response(data, body))
    }





    public check_morgan_topology_uniqueness(): void {

        this.selectedMonomer.molfile = this.getMolfileForCurrentStructure();
        this.selectedMonomer.canSMILES = this.getViewerSmiles();
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(this.selectedMonomer);
        FunctionUtil.POSTJSON(body, environment.generate_morgan_fingerprint).then(data => this.response(data, body))
    }



    public check_canonical_smiles_uniqueness(): void {
        this.selectedMonomer.molfile = this.getMolfileForCurrentStructure();
        this.selectedMonomer.canSMILES = this.getViewerSmiles();
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(this.selectedMonomer);
        console.log(" curren request is : " + body);
        FunctionUtil.POSTJSON(body, environment.generate_canonical_smiles).then(data => this.search_with_smiles(data))

    }








    unique_check_response(response): void {

        // console.log ( "unique check resp " + JSON.stringify( response ) );

        // let msg = response['_body'];
        if (response != null) {
            var hits: Hit[] = response;
            // [{"hit_type":"topology","symbol":"(CHEM) NH","monomer_id":512},{"hit_type":"topology","symbol":"(CHEM) oh","monomer_id":520},{"hit_type":"topology","symbol":"(PEPTIDE) am","monomer_id":119},{"hit_type":"topology","symbol":"(RNA) me","monomer_id":1006},{"hit_type":"topology","symbol":"(RNA) hn","monomer_id":397}]
            this.structure_clash_listeners.forEach((l) => {
                l.structures_found(hits);
            });
        }
    }

    addStructureClashListener(scl: StructureClashListener): void {
        this.structure_clash_listeners.push(scl);
    }

    search_with_smiles(res): void {

        let str = JSON.stringify(res);
        // console.log ( " str " + str );
        if ("canonical_smiles" in res) {
            console.log(" we have the canonical smeils ");
            let fpo = {};
            fpo['canonical_smiles'] = res['canonical_smiles'];
            var headers = new Headers();
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            FunctionUtil.POSTJSON(fpo, environment.search_by_canonical_smiles).then(data => this.unique_check_response(data))

        }
        else if ("_body" in res) {
            this.msg = 'b-- Failed to run uniqueness algorithm';
        }
        else {
            this.msg = 'Failed to run uniqueness algorithm';
        }
    }


    morgan_response(res, _t) {



        let msg = res['fp'];
        alert(msg);
        let fpo = {};
        fpo['morgan_fingerprint'] = msg;
        var headers = new Headers();


        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        FunctionUtil.POSTJSON(fpo, environment.search_by_morgan_fingerprint).then(data => this.unique_check_response(data))


    }


    response(res, _t) {

        // console.log ( " res " + JSON.stringify ( res ) );

        if ("fp" in res) {
            let fpo = {
                "fingerprint": res["fp"]
            }
            var headers = new Headers();
            headers.append('Content-Type', 'application/x-www-form-urlencoded');
            FunctionUtil.POSTJSON(JSON.stringify(fpo), environment.search_by_fingerprint).then(data => this.unique_check_response(data))


        }
    }






    reload(monomer: IMonomer): void {
        // this.monomer_loader.getMonomer(monomer.monomerid).subscribe(nmon => this.selectedMonomer);
    }

    setStructureViewer(ketc: MolecularViewer): void {
        this.structure_viewer = ketc;
    }

    notifyListeners(): void {
        this.listeners.forEach((l) => {
            l.updateSelectedStructure(this.selectedMonomer, this.msg);
            // l.updateSelectedSubstructureList(this.substructure_set)
        });
    }


    createNewMonomer(): IonisMonomer {
        var m: IonisMonomer = new IonisMonomer();
        m.endcapID = '';
        m.het_id = '';
        m.ispublic = false;
        m.sugarId = '';
        m.monomer = this.getDefaultMonomer();
        return m;
    }

    getDefaultMonomer(): IMonomer {
        var nm: IMonomer = new IMonomer();
        nm.name = '';
        nm.id = 0;
        nm.canSMILES = '';
        nm.molfile = '';
        nm.monomerType = '';
        nm.alternateId = '';
        nm.naturalAnalog = '';
        return nm;
    }

    getNextID(): number {
        var mx: number = 0;
        console.log("loading...");
        for (var i in this.monomer_db) {
            // console.log ( ' i :' + this.monomer_db[i]);
            var currentid: number = this.monomer_db[i].monomerid;
            if (currentid > mx) {
                mx = currentid + 1;
            }
        }
        return mx;
    }

    setMonomer(m: IMonomer) {
        
        console.log ( ' monomer ' + m.alternateId)
        this.setSelectedMonomer(m);

    }

    action_successful(m: IMonomer, msg: string): void {

        this.msg = msg;
        this.setSelectedMonomer(m);

    }
    action_failed(m: IMonomer): void {
        this.setSelectedMonomer(m);

    }


}

