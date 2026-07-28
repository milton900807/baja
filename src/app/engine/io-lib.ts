import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpBackend, HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class IoniScriptLib {

    helm_script: string = null;
    solrlib: string = null;
    loaderlib: string = null;
    static http: HttpClient;


    constructor(private httpb: HttpBackend) {

        IoniScriptLib.http = new HttpClient(httpb);
        this.GETFUNCTION('lib', 'core.js').then(r => {
            this.helm_script = r.toString();
        })

        // this.http.get("assets/helm-builder.js").subscribe(res => {
        //     this.helm_script = res.text();
        // });
        // this.http.get("assets/loader.js").subscribe(res => {
        //     this.loaderlib = res.text();
        // });
        // this.http.get("assets/solr-lib.js").subscribe(res => {
        //     this.solrlib = res.text();
        // });
    }

    public getSolrLib(): string {
        return this.solrlib;
    }


    public getHELMScript(): string {
        if (this.loaderlib)
            return this.loaderlib + '\n\n' + this.helm_script;
        else
            return this.helm_script
    }
    async GETFUNCTION(path, rule_name) {
        return (new Promise<Function>((resolve, reject) => {
            let js = { "spath": path.trim(), "rule_name": rule_name.trim() };
            IoniScriptLib.POSTJSON(js, environment.get_helm_rule).then(functionObject => {
                if (functionObject != null) {
                    let src = functionObject['rule_value'];
                    resolve(src);
                }
            });
        }));
    }

    static async POSTJSON(jsonobject, url) {
        // console.log(" t " + JSON.stringify(jsonobject));
        // console.log(" url " + url);
        // console.log(" json " + jsonobject);

        const httpHeaders = new HttpHeaders()
            .append('Content-Type', 'application/json');
        // .append('Access-Control-Allow-Headers', 'Content-Type')
        // .append('Access-Control-Allow-Methods', 'GET');

        if (typeof url === 'string') {


        } else if (typeof url === 'object') {
        }
        return new Promise((resolve, reject) => {
            let fd;
            console.log(' url ' + url);
            this.http.post(url, jsonobject,
                { headers: httpHeaders }
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








