import { Injectable } from  '@angular/core';
import { Observable } from 'rxjs';
import { MonomerActionObserver } from "../monomer-editor/monomer-action-observer";
import { IMonomer, IonisMonomer } from "./monomerdb";
import { environment } from "../../environments/environment";

@Injectable()
export class MonomerSaver {
    //private monomer_lib_save_url = 'http://localhost:8180/v1/monomers/save';
    ob:MonomerActionObserver;
    currentMonomer:IMonomer;

    constructor() {
    }

    // saveMonomer ( monomer:IonisMonomer, ob:ActionObserver){
    //     this.currentMonomer = monomer;
    //     this.ob = ob;
    //     var headers = new Headers();
    //     headers.append('Content-Type', 'application/x-www-form-urlencoded');
    //     var body = JSON.stringify(monomer);
    //     this._http.post(URLs.monomer_lib_save_url, body, {headers:headers}).subscribe(response => this.response ( response ));
    // }

    updateMonomer (monomer:IMonomer, ob:MonomerActionObserver){
        this.ob = ob;
        this.currentMonomer = monomer;
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        var body = JSON.stringify(monomer);
        // this._http.post(environment.monomer_lib_save_url, body, {headers:headers})
        // .do(data => console.log('All: ' + JSON.stringify(data)))
        // .subscribe(response => this.response ( response ));
    }

    
    response ( res ){
        console.log ( res );
        let msg = res['_body'];
        var msgv = JSON.parse( msg );
        // alert ( msgv['msg'] );
        if ( 'msg' in msgv ){
            this.ob.action_successful(this.currentMonomer, msgv['msg']);
        }
        else{
            this.ob.action_successful(this.currentMonomer, msg);
        }
    }
    logError ( error )
    {
        console.log ( error );
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