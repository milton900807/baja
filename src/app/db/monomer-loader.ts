import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from "../../environments/environment";
import { IMonomer } from './monomerdb';
import { map } from 'rxjs/operators';

@Injectable()
export class MonomerLoader {
    constructor(private _http: HttpClient) {
    }


    getMonomers(): Observable<IMonomer[]> {
        return this._http.get('', { responseType: 'json' }).pipe(
            map((response: Response) => <IMonomer[]><unknown>response))
    }
    getMonomer(id: number): Observable<IMonomer> {
        return this._http.get('' + "/?id=" + id, { responseType: 'json' }).pipe(
            map((response: Response) => <IMonomer><unknown>response))
    }






    private handleError(error: Response) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        console.error(error);
        return Observable.call(error.json() || 'Server error');
    }
}