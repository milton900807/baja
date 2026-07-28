import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';
import { HttpBackend, HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";


@Injectable()
export class IoniScriptDB {
    static http: any;
    constructor(private httpb: HttpBackend) {
        IoniScriptDB.http = new HttpClient(httpb);
    }
    public loadRule(function_path: string, script_name: string) {
        let js = { "spath": function_path.trim(), "rule_name": script_name.trim() };
        return IoniScriptDB.POSTJSON(js, environment.get_helm_rule);
    }

    public loadDevRule(function_path: string, script_name: string) {
        let js = { "spath": function_path.trim(), "rule_name": script_name.trim() };
        return IoniScriptDB.POSTJSON(js, environment.devEnvironment);
    }




    static async POSTJSON(jsonobject, url) {
        const headers = new HttpHeaders()
        .append('Content-Type', 'application/json');
            if (typeof url === 'string') {
        } else if (typeof url === 'object') {
        }
        return new Promise((resolve, reject) => {
            let fd;
            console.log(' url ' + url);
            this.http.post(url, jsonobject,
                { headers: headers }
            ).pipe(
                catchError((error: any): Observable<{}> => {
                    console.log(" failed" + JSON.stringify(error));
                    resolve(error);
                    return null;
                }))
                .subscribe(res => {
                    if (res != null && res['guid'] != null) {
                        fd = res['guid'];
                        console.log(" fd " + fd);
                        if (fd) {
                            resolve(fd);
                        }
                    }
                    else {
                        // console.log(" response " + JSON.stringify(res));
                        resolve(res);
                    }
                });
        });
    }
}