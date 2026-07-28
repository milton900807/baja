import {Injectable} from  '@angular/core';
import {Observable} from 'rxjs';
import { IMonomer, IonisMonomer } from "./monomerdb";
import { MonomerActionObserver } from "../monomer-editor/monomer-action-observer";


@Injectable()
export class DownloadData {
    ob:MonomerActionObserver;
    currentMonomer:IMonomer;

    constructor() {
    }

    saveMonomer(monomer:IMonomer, ob:MonomerActionObserver) {
        this.currentMonomer = monomer;
        this.ob = ob;
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(monomer);
        // this._http.post(environment.monomer_lib_save_url, body, {headers: headers}).subscribe(response => this.response(response));
    }

    updateMonomer(monomer:IMonomer, ob:MonomerActionObserver) {
        this.ob = ob;
        this.currentMonomer = monomer;
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(monomer);
        // this._http.post(environment.monomer_lib_save_url, body, {headers: headers}).do(data => console.log('All: ' + JSON.stringify(data))).subscribe(response => this.response(response));
    }

    downloadPub() {
        // this._http.get(environment.monomer_lib_download_public_monomers_url + 'type=public').subscribe((response) => this.descargarArchivo(response));
    }
    downloadPrivate() {
        // this._http.get(environment.monomer_lib_download_public_monomers_url + 'type=private').subscribe((response) => this.descargarArchivo(response));
    }
    downloadAll() {
        // this._http.get(environment.monomer_lib_download_public_monomers_url  + 'type=all').subscribe((response) => this.descargarArchivo(response));
    }
    descargarArchivo(response: Response){
        // var blob = new Blob([response.text()], { type: 'text/sdf' });
        // var url= window.URL.createObjectURL(blob);


       //saveAs ( blob, 'monomer_library.sdf' );
    }

    response(res) {
        console.log(res);
        if (this.ob != null) {
            this.ob.action_successful(this.currentMonomer, "");
        }
    }

    logError(error) {
        console.log(error);
        this.ob.action_failed(this.currentMonomer);
    }


    private  handleError(error:Response) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        this.ob.action_failed(this.currentMonomer);
        console.error(error);
        return Observable.call(error.json() || 'Server error');
    }
}