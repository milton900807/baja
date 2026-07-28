import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class TrailScriptLib {
    lib_script:string = null;
    solrlib:string = null;
    constructor(private http: HttpClient) {
         this.http.get("assets/trail-lib.js", {responseType: 'text'}).subscribe(res => {
            this.lib_script = res;
        });
        this.http.get("assets/solr-lib.js", {responseType: 'text'}).subscribe(res => {
            this.solrlib= res;
        });
    }
    public getSolrLib() : string {
        return this.solrlib;
    }
    public getScript () : string {
       return this.lib_script;
    }
}








