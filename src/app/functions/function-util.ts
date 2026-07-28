import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpBackend } from '@angular/common/http';
import { IoniScriptDB } from '../engine/io-db';
import { io, Socket } from 'socket.io-client';
import { OAuthSettings } from '../onedrive/oath.settings';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class FunctionUtil {
    static http: HttpClient;
    static cache: { [key: string]: any } = {}
    static cache_on = true;
    private static connectedObject: any = null;



    constructor(private httpb: HttpBackend, private db: IoniScriptDB) {
        FunctionUtil.http = new HttpClient(httpb);
    }
    static clearCache() {
        FunctionUtil.cache = {};
    }



    public async loadFunctionFromDB(function_path: string, parentLib: string) {
        // console.log(' function path ' + function_path);
        let rule_index = function_path.lastIndexOf('/');
        let rule_name = function_path.substring(rule_index + 1).trim();
        let path = function_path.substring(0, rule_index);
        // console.log(' path ' + path + '/' + rule_name);
        let rule_path = path + '/' + rule_name;





        return (new Promise<Function>(async (resolve) => {
            // FunctionUtil.GETJSON(environment.get_helm_rule).then(functionObject => {
            let js = { "spath": path.trim(), "rule_name": rule_name.trim() };
            let functionObject = await FunctionUtil.POSTJSON(js, environment.get_helm_rule)
            if (functionObject != null) {
                let src = functionObject['rule_value'];
                if (!src) {
                    return resolve(null)
                }
                // if it is a json object then we will turn it into a javascript function that returns the json object
                if (rule_name.toLowerCase().endsWith('.json')) {
                    src = 'return ' + src;
                }
                let f = FunctionUtil.getFunction(src, parentLib);
                FunctionUtil.cache[rule_path] = f;
                resolve(f);
            }

        }));

    }

    public static async GETXT(url) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.ontimeout = function () { alert(" Timed out"); }
            xhr.open("GET", url, true);
            // xhr.responseType = 'text/plain; charset=UTF-8';
            // xhr.responseType = 'text/plain';
            xhr.onload = function () {
                var status = xhr.status;
                if (status == 200) {
                    resolve(xhr.response);
                } else {
                    console.log(" rejecting !" + status);
                    reject(status);
                }
            };
            xhr.send();
        })
    }

    // ✅ New method: Load PDF from backend and return a Blob URL
    public static async LOADPDF(url, filePath: string, user: string, key?: string): Promise<string> {
        const payload = {
            path: filePath,
            user: user,
            key: key || null
        };

        try {
            const blob = await FunctionUtil.http.post(url, payload, {
                responseType: 'blob'
            }).toPromise();

            const blobUrl = URL.createObjectURL(blob);
            return blobUrl;

        } catch (error) {
            console.error("Error loading PDF:", error);
            throw new Error("Failed to load PDF");
        }
    }


    /**
        * Connects to a remote service and returns the connected instance (singleton).
        */
    public static async connectSockets(): Promise<any> {
        if (FunctionUtil.connectedObject) {
            return FunctionUtil.connectedObject;
        }

        // Simulated connection logic – replace this with your actual logic
        return new Promise((resolve, reject) => {
            let host = window['env']['apiUrl'];

            const socket: Socket = io(host);

            // Simulate async connection, e.g., WebSocket, DB, etc.
            setTimeout(() => {
                FunctionUtil.connectedObject = {
                    connected: true,
                    timestamp: new Date(),
                    socket,
                    sendMessage: (msg: string) => console.log("Sending:", msg),
                    updateObject: (folderId: string, objectId: string, state: any, userId: string) => {
                        return FunctionUtil.http.post(`${host}/update-object`, {
                            folderId,
                            objectId,
                            state,
                            userId
                        });
                    },
                    joinFolder: (folderId: string, userId: string) => {
                        socket.emit('joinFolder', { folderId, userId });
                    },
                    onObjectUpdated: (callback: (data: any) => void) => {
                        socket.on('objectUpdated', callback);
                    }
                };
                console.log("✅ Connected to remote system");
                resolve(FunctionUtil.connectedObject);
            }, 1000); // Simulate delay
        });
    }


    public static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    public loadScriptFromDB(function_path: string) {
        let rule_index = function_path.lastIndexOf('/');
        let rule_name = function_path.substring(rule_index + 1).trim();
        let path = function_path.substring(0, rule_index);
        return (new Promise<{}>((resolve) => {

            this.db.loadRule(path, rule_name).then(functionObject => {
                // let js = { "user_id": path.trim(), "rule_name": rule_name.trim() };
                if (functionObject != null) {
                    resolve(functionObject);
                }
            });
        }));
    }


    public static getArguments(src): any[] {
        let t = src.trim();
        let args: any[] = [];
        if (t.startsWith("function")) {
            let s = t.indexOf('(');
            let e = t.indexOf(')');
            let tr = t.substring(s + 1, e);
            let tra = tr.split(',');
            return tra;
        }
        return args;
    }


    public static removeComments(code) {
        const endOfCommentRegex = /\*\/\s*\n/;
        const match = endOfCommentRegex.exec(code);
        if (match) {
            const endIndex = match.index + match[0].length;
            const cleanedCode = code.slice(endIndex);
            return cleanedCode.trim();
        } else {
            return code;
        }
    }

    // tslint:disable-next-line:member-ordering
    public static getFunction(src: string, prefixFunction: string): Function {

        src = FunctionUtil.removeComments(src)


        let args = FunctionUtil.getArguments(src);
        let src_value = FunctionUtil.getFunctionBody(src);
        if (prefixFunction == null) {
            prefixFunction = '';
        } else {
            prefixFunction = FunctionUtil.removeComments(prefixFunction)
        }
        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
        // let fg = new AsyncFunction('lion_engine', ...args, hs + '\n\n' + src_value);
        try {
            let fg = new AsyncFunction('lion_engine', ...args, prefixFunction + '\n\n' + src_value);
            return fg;
        } catch (exception) {
            console.error('An error occurred while executing the code:');
            // console.error('Source code:', src_value);
            console.error('Error message:', exception.message);
            console.error('Stack trace:', exception.stack); // Prints the full stack trace        }
        }
        return null;
    }

    // tslint:disable-next-line:member-ordering
    public static getFunctionBody(src: string): string {
        src = src.trim();
        if (src.startsWith('function')) {
            let i = src.indexOf('{');
            let l = src.lastIndexOf('}');
            if (i > 0 && l > 0) {
                let v = src.substring(i + 1, l);
                if (v != null) {
                    return v.trim();
                } else {
                    return '';
                }

            }
        }
        if (src != null && src.length > 0) {
            return src.trim();
        }
        return src;
    }

    static async GETJSON(url: string, userId?: string): Promise<any> {
        if (!url) throw new Error('Invalid URL');

        // Build headers (HttpHeaders is immutable—always reassign after set)
        let headers = new HttpHeaders().set('Accept', 'application/json');
        if (OAuthSettings?.access_token) {
            headers = headers.set('Authorization', `Bearer ${OAuthSettings.access_token}`);
        }

        // Pass caller’s user id if provided
        if (userId) {
            headers = headers.set('x-user-id', userId);
        }
        try {
            return await firstValueFrom(this.http.get(url, { headers }));
        } catch (error) {
            console.error('GET failed', error);
            throw error; // reject so callers can handle errors
        }
    }


    static async POSTJSON(jsonobject: any, url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!url) {
                console.error("Invalid URL");
                return reject("Invalid URL");
            }

            let httpHeaders = new HttpHeaders().set('Content-Type', 'application/json');

            if (OAuthSettings?.access_token) {
                httpHeaders = httpHeaders.set('x-user-id', OAuthSettings.access_token);
            }

            // Ensure `this.http` is properly bound or passed in from outside
            this.http.post(url, jsonobject, { headers: httpHeaders })
                .pipe(
                    catchError((error: any): Observable<any> => {
                        console.error("POST failed", error);
                        resolve(error); // Return error to resolve instead of reject?
                        return (error); // Ensures observable is returned
                    })
                )
                .subscribe((res: any) => {
                    if (res?.guid) {
                        console.log(" fd", res.guid);
                        resolve(res.guid);
                    } else {
                        resolve(res);
                    }
                });
        });
    }




    static JSONToFunction(json) {
        return JSON.parse(json, function (key, value) {
            if (typeof value === "string" &&
                value.startsWith("/Function(") &&
                value.endsWith(")/")) {
                value = value.substring(10, value.length - 2);
                return eval("(" + value + ")");
            }
            return value;
        });
    }


    static getFunctionFromJSONObject(json): Function {
        if (typeof json === "string") {
            return JSON.parse(json, function (key, value) {
                if (typeof value === "string" &&
                    value.startsWith("/Function(") &&
                    value.endsWith(")/")) {
                    value = value.substring(10, value.length - 2);
                    return eval("(" + value + ")");
                }
                return value;
            });
        }
        return null;
    }
}