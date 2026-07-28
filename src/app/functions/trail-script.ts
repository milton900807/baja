import { Injectable, OnInit } from '@angular/core';
import { FunctionGenerator } from './function-gen';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { IoniScriptManager } from '../engine/io-manager';
import { IoniScriptDB } from '../engine/io-db';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { OAuthSettings } from '../onedrive/oath.settings';

@Injectable()
export class TrailScript {

    http: HttpClient;

    httpOptions = {
        // headers: new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded'})
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    process = {};
    constructor(private fg: FunctionGenerator, private ruledb: IoniScriptDB,
        private httpb: HttpBackend, private im: IoniScriptManager) {
        this.http = new HttpClient(httpb)
    }
    async POST(file, url): Promise<string> {
        let fd;
        await this.im.POSTFile(file, url).then(f => fd = f);
        return fd;
    }

    getIonisFS() {
        return this.im.getIonisFS();
    }
    async GETFUNCTION(path, rule_name) {
        return (new Promise<Function>((resolve, reject) => {
            let js = { "user_id": path.trim(), "rule_name": rule_name.trim() };
            this.POSTJSON(js, environment.get_helm_rule).then(functionObject => {
                if (functionObject != null) {
                    let src = functionObject['rule_value'];
                    let f = this.fg.getFunction(src);
                    resolve(f);
                }
            });
        }));
    }


    async GETJSON(url) {
        return new Promise((resolve, reject) => {
            let fd;

            this.http.get(url).pipe(
                catchError((error: any): Observable<{}> => {
                    console.log(" failed" + JSON.stringify(error));
                    resolve(error);
                    return null;
                }
                )).subscribe(res => {
                    fd = res;
                    console.log(" fd " + JSON.stringify(fd));
                    if (fd) {
                        resolve(fd);
                    }
                });
        });
    }

    cache: { [key: string]: any } = {}
    async exec_deprcated(path, ...funargs) {
        let pr = new Promise(async (resolve, reject) => {
            let it = path.indexOf('/');
            if (it > 0) {
                let category = path.substring(0, it);
                let key = path.substring(it + 1);
                await this.GETFUNCTION(category, key).then(async fun => {
                    this.cache[path] = fun;
                    let r = await fun(this, ...funargs);
                    if (r != null && r.hasOwnProperty('then')) {
                        r.then(res => {
                            resolve(res);
                        })
                    } else {
                        resolve(r);
                    }
                });
            } else {
                reject();
                return null;
            }
        });
        return pr;
    }

    async POSTJSON(jsonobject, url) {
        let post_params = {
            headers: httpHeaders
        };
        if (typeof url === 'string') {


        } else if (typeof url === 'object') {
            let ob = url;
            if ('url' in ob) {
                url = ob['url'];
            }
            if ('headers' in ob) {
                let headerstuff = ob['headers'];
                post_params['headers'] = new HttpHeaders(headerstuff)
            }
            if ('responseType' in ob) {
                post_params['responseType'] = ob['responseType']
            }
        }



        let httpHeaders = new HttpHeaders().set('Content-Type', 'application/json');

        if (OAuthSettings?.access_token) {
            httpHeaders = httpHeaders.set('x-user-id', OAuthSettings.access_token);
        }
        post_params = {
            headers: httpHeaders
        };

        return new Promise((resolve, reject) => {
            let fd;
            console.log(' url ' + url);
            console.log(" http headeri-------------- " + JSON.stringify(post_params));
            this.http.post(url, JSON.stringify(jsonobject),
                post_params
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


    async POSTJSON_deprecated(jsonobject, url) {
        console.log(" t " + JSON.stringify(jsonobject));
        console.log(" url " + url);
        return new Promise((resolve, reject) => {
            let fd;
            this.http.post(url, JSON.stringify(jsonobject), this.httpOptions).pipe(
                catchError((error: any): Observable<{}> => {
                    // console.log ( " failed" + err );
                    resolve(error);
                    return null;
                }
                )).subscribe(res => {
                    if (res != null && res['guid'] != null) {
                        fd = res['guid'];
                        console.log(" fd " + fd);
                        if (fd) {
                            resolve(fd);
                        }
                    }
                    else {
                        console.log(" response " + JSON.stringify(res));
                        resolve(res);
                    }
                });
        });
    }


    async PUTJSON(jsonobject, url) {
        console.log(" t " + JSON.stringify(jsonobject));
        console.log(" url " + url);
        return new Promise((resolve, reject) => {
            let fd;
            this.http.put(url, JSON.stringify(jsonobject), this.httpOptions).pipe(
                catchError((error: any): Observable<{}> => {
                    // console.log ( " failed" + err );
                    resolve(error);
                    return null;
                }
                )).subscribe(res => {
                    if (res != null && res['guid'] != null) {
                        fd = res['guid'];
                        console.log(" fd " + fd);
                        if (fd) {
                            resolve(fd);
                        }
                    }
                    else {
                        console.log(" response " + JSON.stringify(res));
                        resolve(res);
                    }
                });
        });
    }



    updateUI(widget_name, field, value) {
        this.im.updateUI(widget_name, field, value);

    }
    showApp(title, url, json_ob) {
        return this.im.displayApp(title, url);
    }

    showInputItem(title): Promise<{}> {
        return this.im.showInputItem(title);
    }


    showWidget(jsonobj): Promise<{}> {
        return this.im.showWidget(jsonobj);
    }
    clearWeak(): Promise<{}> {
        return this.im.clearWeak();
    }


    setUIObject(obj: any, objectname: string, objtype: string) {
        this.im.setUIObject(obj, objectname, objtype);
    }

    showInputTextArea(title): Promise<{}> {
        return this.im.showInputTextArea(title);

    }
    showInputParamItem(title, input_labels: string[]): Promise<{}> {
        return this.im.showInputParamPair(title, input_labels);
    }


    showOKPanel(msg: string): Promise<string> {
        return this.im.showOKPanel(msg);
    }


    showFile(file: { lines: string; filename: string; }): void {
        if (file.lines) {
            const lf = new nFile();
            lf.content = file.lines;
            lf.name = file.filename;
            this.im.showFile(lf);
        }
    }

    displaySVG(url, js) {
        return this.im.displaySVG(url, js);
    }


    updateProgress(progress: string): void {
        this.im.updateProgress(progress);
    }

    clearLog(): void {
        this.im.resetLog();
    }

    resetLog(): void {
        this.im.resetLog();
    }

    log(line: string): void {
        this.im.log(line);
    }


    exportToCsv(data, file_name) {
        let keys = Object.keys(data[0]);
        var options = {
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalseparator: '.',
            showLabels: true,
            showTitle: false,
            useBom: false,
            headers: keys
        };
        // options.fieldSeparator = del;
        // new Angular2Csv(data, file_name, options);
    }
    /**
     * @param path  
     * @param name 
     */
    load(path, name) {
        return this.ruledb.loadRule(path, name);
    }

}
export class nFile {
    name: string;
    content: string;

}


