import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ComponentFactoryResolver, Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { IoniScriptLib } from './io-lib';
import { IoniScriptManager } from './io-manager';
import { IoniScriptDB } from './io-db';
import { environment } from '../../environments/environment';
import { FunctionUtil } from '../functions/function-util';
import { OAuthSettings } from '../onedrive/oath.settings';
import { IoniScript } from '../published-lionscript/ioniscript';
import { EngineMonitor } from './engine-monitor';
import { PubComponent } from '../published-lionscript/pub-component'
import { WidgetFactory } from '../widget-factory';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, ScatterController, LogarithmicScale, RadialLinearScale, BarController, PolarAreaController } from 'chart.js'
import { Document, HeadingLevel, Paragraph, TextRun, Footer, Packer, Header } from 'docx';
import { createWorker } from 'tesseract.js';
import * as pako from 'pako';
import { Renderer2, RendererFactory2 } from '@angular/core';
import nlp from 'compromise'

@Injectable()
export class IoniScriptEngine {
    static iopath = 'editor';
    static helm_script: IoniScriptLib;
    static root: string;
    public static execLog = [];
    public static threads = [];
    public static le;
    public static app;
    private renderer: Renderer2;

    static setIOPath(path: string): void {
        this.iopath = path;
    }

    constructor(private http: HttpClient,
        private ruledb: IoniScriptDB,
        public helm_script: IoniScriptLib,
        private function_util: FunctionUtil,
        private rendererFactory: RendererFactory2,
        private componentFactoryResolver: ComponentFactoryResolver,
        private zone: NgZone) {
        IoniScriptEngine.helm_script = helm_script;
        this.renderer = this.rendererFactory.createRenderer(null, null);

    }

    public async runR(rule: string, lionScriptManager: IoniScriptManager, resolve_function, ...input: any[]) {
        var function_value = IoniScriptEngine.getLionEngineScriptWithArgs(rule, input);
        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
        let fn = AsyncFunction('lion_engine', 'map', 'resolveScript', function_value);
        return await fn(new LionEngine(this.ruledb, this.http, this.function_util, lionScriptManager, this, this.renderer, this.componentFactoryResolver, this.zone), {}, resolve_function, input);
    }

    public async exec(rule: string, lionScriptManager: IoniScriptManager, resolve_function, input: any[]) {
        var function_value = IoniScriptEngine.getLionEngineScriptWithArgs(rule, input);
        let function_params = IoniScriptEngine.parseArguments(rule);
        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
        let fn = AsyncFunction('lion_engine', 'resolveScript', ...function_params, function_value);
        // debugger;
        return await fn(new LionEngine(this.ruledb, this.http, this.function_util, lionScriptManager, this, this.renderer, this.componentFactoryResolver, this.zone), resolve_function, ...input);
    }


    clearThreads() {
        for (let l of IoniScriptEngine.threads) {
            clearInterval(l);
        }
    }


    public static extractObjectFromSentence(sentence: string): string | null {
        const doc = nlp(sentence);
        const verbs = doc.verbs().out('array');
        if (verbs.length === 0) return null;
        const verbIndex = sentence.indexOf(verbs[0]);
        const afterVerb = sentence.slice(verbIndex + verbs[0].length).trim();
        const afterDoc = nlp(afterVerb);
        const nounPhrase = afterDoc.nouns().out('text');
        return nounPhrase || null;
    }

    public static getLionEngineScript(rule: string) {
        var hs = FunctionUtil.removeComments(IoniScriptEngine.helm_script.getHELMScript());
        if (hs == null || hs.length == 0)
            hs = '';
        let solr_lib = IoniScriptEngine.helm_script.getSolrLib();
        if (solr_lib == null || solr_lib.length == 0) {
            solr_lib = '';
        }
        let mod_rule = IoniScriptEngine.preProcessScriptForFunctionalParams(rule, null);
        let temp = '\n' + hs + "\n" +
            " let io_in=[];" +
            " if ( arguments[3] != null ) {\n" +
            " if ( arguments.length > 3 ) {\n" +
            "       let narguments = [];\n " +
            "       for ( let i = 0; i < arguments[3].length; i++){\n" +
            "           console.log ( ' args ' + arguments[3][i] ); \n" +
            "           if ( arguments[3][i] != null ){narguments.push ( arguments[3][i] );} \n" +
            "         }\n" +
            "       arguments = narguments;\n" +
            "}\n}\n" +
            mod_rule + " \n ";
        return temp;
    }


    public static getLionEngineScriptWithArgs(rule: string, input: any[]) {
        var hs = FunctionUtil.removeComments(IoniScriptEngine.helm_script.getHELMScript());

        if (hs == null || hs.length == 0)
            hs = '';
        let solr_lib = IoniScriptEngine.helm_script.getSolrLib();
        if (solr_lib == null || solr_lib.length == 0) {
            solr_lib = '';
        }
        let mod_rule = IoniScriptEngine.preProcessScriptForFunctionalParams(rule, input);
        let temp = hs +
            "\n" + // uncommented 3.9.2019
            // " let io_in=[];" +
            // " console.log ( 'arguments ' +  (arguments));" +
            // " if ( arguments[3] != null ) {\n" +
            // " if ( arguments.length > 3 ) {\n" +
            // "       let narguments = [];\n " +
            // "       for ( let i = 0; i < arguments[3].length; i++){\n" +
            // "           console.log ( ' args ' + arguments[3][i] ); \n" +
            // "           if ( arguments[3][i] != null ){narguments.push ( arguments[3][i] );} \n" +
            // "         }\n" +
            // "       arguments = narguments;\n" +
            // "}\n}\n" +
            mod_rule + " \n ";
        return temp;
    }


    public static preProcessScriptForFunctionalParams(hr: string, args): string {

        hr = hr.trim();
        if (hr.startsWith('function ')) {
            let sti = hr.indexOf('{');
            let stf = hr.lastIndexOf('}');
            let hs = hr.substring(sti + 1, stf);
            let af = hr.indexOf('function') + 8;
            let argumentsLine = hr.substring(af, sti);
            let function_arguments = this.parseArguments(argumentsLine);
            // console.log(' parsed arguments : ' + function_arguments);
            if (function_arguments == null || function_arguments.length == 0 || args != null) {
                let t = ''
                t += '\n';
                let script = t + hs + "";
                // console.log(" script \n " + script);
                return script;
            } else {
                let inputitems = '';
                for (let a of function_arguments) {
                    inputitems += '"' + a.trim() + '",';
                }
                inputitems = inputitems.substring(0, inputitems.length - 1);
                let t = 'showInputParamItem ( "input", [' + inputitems + ']).then ( res => {';
                t += '\n';
                for (let a of function_arguments) {
                    t += 'let ' + a.trim() + '=res["' + a.trim() + '"];\n';
                }
                let script = t + hs + "});";
                // console.log(" script \n " + script);
                return script;
            }
        }
        return hr;

    }


    // public preProcessScriptForFunctionalParams(hr: string, args): string {
    //     hr = hr.trim();
    //     if (hr.startsWith('function ')) {
    //         let sti = hr.indexOf('{');
    //         let stf = hr.lastIndexOf('}');
    //         let hs = hr.substring(sti + 1, stf);
    //         let af = hr.indexOf('function') + 8;
    //         let argumentsLine = hr.substring(af, sti);
    //         let function_arguments = this.parseArguments(argumentsLine);
    //         let t = ''
    //         t += '\n';
    //         let script = t + hs + "";
    //         console.log(" script \n " + script);
    //         return script;
    //     }
    //     return hr;
    // }

    static parseArgumentsFromFunction(hr: string) {
        hr = hr.trim();
        if (hr.startsWith('function ')) {
            let sti = hr.indexOf('{');
            let stf = hr.lastIndexOf('}');
            let af = hr.indexOf('function') + 8;
            let argumentsLine = hr.substring(af, sti);
            let function_arguments = this.parseArguments(argumentsLine);
            return function_arguments;
        }
        return null;
    }


    static parseArguments(p: string): any[] {
        p = p.trim();
        let i = p.indexOf('(');
        let f = p.indexOf(')');
        p = p.substring(i + 1, f);

        p = p.trim();
        if (p.length == 0) {
            return [];
        }

        let s: string[] = [];
        p = p.trim();
        if (p.length > 0) {
            let sp = p.split(',');
            if (sp != null && sp.length > 0) {
                for (let ssp of sp) {
                    s.push(ssp);
                }
            }
        }
        return s;

    }


    save(path: string, name: string, type: string, rule: string, input: string, callback: any): void {
        debugger;
        if (rule == null || rule.length <= 0) {
            rule = "console.log ( \"Executing " + name + " \");";
        }
        if (path != null && path.length > 0) {
            let r = { "spath": path, "rule_name": name, "rule_type": type, "rule_value": rule };
            if (input != null) {
                if (input != null && input.length > 0 && input.toLowerCase() != "undefined") {
                    r["input_label"] = input;
                }
            }
            var body = JSON.stringify(r);
            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                })
            };
            this.http.post(environment.save_dev_script, body, httpOptions).subscribe(response => callback(response));
        }
    }


    public run(path: string, ruleType: string, rule: string, lionScriptManager: IoniScriptManager, argument_map: {}): any {

        if (rule == null || rule === 'not found') {
            console.log(' Rule not found ' + path + '/' + rule)
            return;
        }
        if (ruleType === 'lionscript' || ruleType === 'ionscript' || ruleType === 'javascript' || ruleType === 'js') {
            if (lionScriptManager != null) {
                let hs = IoniScriptEngine.getLionEngineScript(rule);
                let arg_sequence = [];
                let function_arguments = FunctionUtil.getArguments(rule);
                for (let fun of function_arguments) {
                    let keys = Object.keys(argument_map);
                    for (let k of keys) {
                        if (fun === k) {
                            arg_sequence.push(argument_map[k]);
                        } else {
                            arg_sequence.push("undefined")
                        }
                    }
                }




                // console.log(" args " + arg_sequence);
                let fn = Function('lion_engine', 'map', 'resolveScript', ...function_arguments, hs);
                return fn(new LionEngine(this.ruledb, this.http, this.function_util, lionScriptManager, this, this.renderer, this.componentFactoryResolver, this.zone), {}, {}, arg_sequence);
            }
        }
        else if (ruleType === 'ionmap') {
            console.log(" IOMAP not implemented in viewer ")
        } else if (ruleType === 'py') {

            return new Promise((resolve, reject) => {

                execPy(path, null).then(async (r) => {
                    let prev = null;
                    lionScriptManager.log('Running...')

                    let w: any = await lionScriptManager.showWidget({
                        wid: 'json',
                        data: ''
                    })
                    let host = window['env']['apiUrl'];

                    let index = 0;
                    let c = setInterval(async () => {
                        if (host.endsWith('/')) {
                            host = host.substring(0, host.length - 1)
                        }
                        if (path.startsWith('http') || path.startsWith('https')) {
                            let indexIO = path.indexOf('/ionworks/')
                            if (indexIO > 0) {
                                host = path.substring(0, indexIO) + '/ionworks';
                                path = path.substring(indexIO + 10)
                            } else {
                                let indexIO = path.indexOf('/ionworks_proxy/')
                                if (indexIO > 0) {
                                    host = path.substring(0, indexIO) + '/ionworks_proxy';
                                    path = path.substring(indexIO + 16)
                                }
                            }
                        }

                        let url = host + '/py-out/read?path=' + r['path']
                        console.log(" reading url " + url)


                        let out = await FunctionUtil.GETJSON(url);
                        if (out != null && out['lines'].length > 0) {
                            if (prev == null || prev != out['lines']) {
                                let lines = out['lines']
                                let s = '';
                                for (let l of lines) {
                                    l = decodeURI(l) + '\n'
                                    s += l + '\n'
                                    if (l.startsWith('IONWORKS:RESOLUTION:')) {
                                        let obj = l.substring(20)
                                        try {
                                            let jobj = JSON.parse(obj.trim());
                                            await lionScriptManager.clearWeak();
                                            await lionScriptManager.log(index++ + ' Py complete... ')
                                            let w: any = await lionScriptManager.showWidget({
                                                wid: 'json',
                                                data: JSON.stringify(jobj)
                                            })
                                            if (index > 7)
                                                clearInterval(c)
                                            return resolve(jobj)

                                        } catch (exception) {
                                            console.log(" exception : " + exception);
                                            // resolve({});
                                            // clearInterval(c);
                                        }
                                    }
                                }


                                w.data = s
                                // w.format ();
                                prev = out['lines'];

                            }
                        }
                    }, 200)

                    IoniScriptEngine.threads.push(c);
                    setTimeout(() => {
                        for (c of IoniScriptEngine.threads)
                            clearInterval(c)
                    }, 100000)

                });

            })

        }
    }

    getScript(path): Promise<any> {
        let index = path.lastIndexOf('/')
        let name = path.substring(index + 1);
        path = path.substring(0, index);

        return new Promise((resolve, reject) => {
            this.ruledb.loadRule(path, name).then(ru => {
                if (!ru) {
                    console.log(' Failed to find the path : ' + path + ' name ' + name)
                    resolve({});
                } else {
                    resolve(ru);
                }
            });
        });
    }



    public buildFramework() {
        let s =
        {
            // 'drop-file': new SimpleFileDrop(),
            'test': 'test'
        }
        return s;
    }
}

export class RunStatus {
    id: string;
    status: string;
    msg: string;
}
export interface ProcessListener {
    statusChanged(st: RunStatus): void;
}


export class LionEngine {
    process = {};
    processListeners: Array<ProcessListener> = [];

    static stashed = {}
    // these are references
    static ionfunctions = {};
    static componentRefs = {};
    // Toolbar history per component label + deferred-restore timers, so that clearing a
    // toolbar panel (a "reset") falls back to the previous toolbar instead of nothing.
    static toolbarStack: { [k: string]: any[] } = {};
    static toolbarRestoreTimer: { [k: string]: any } = {};
    // Labels whose "reset" should restore the previous toolbar rather than go blank.
    static restorableToolbarLabels: string[] = ['buttonMenuPanel'];
    static history = [];
    static exec_log = [];
    static events = []
    static server = null;
    static lastHistoryPush = null;
    httpOptions = {
        headers: new HttpHeaders(
            // {'Content-Type': 'application/x-www-form-urlencoded'})
            { 'Content-Type': 'application/json' })
    };
    constructor(private ruledb: IoniScriptDB, private http: HttpClient, private function_util: FunctionUtil,
        private im: IoniScriptManager, private rule_engine: IoniScriptEngine,
        private renderer: Renderer2,
        private componentFactoryResolver: ComponentFactoryResolver,
        private zone: NgZone) {
        this.addProcessListener(im);
        IoniScriptEngine.le = this;

        setTimeout(async () => {
            LionEngine.server = await FunctionUtil.connectSockets();
        }, 3000)

    }



    static saveAsIonFunction(ref: Function) {
        let uuid = FunctionUtil.uuidv4();
        LionEngine.ionfunctions[uuid] = ref;
        return uuid;
    }

    shareObject(ts: any, folderid: string) {
        if (LionEngine.server && folderid) {
            LionEngine.server.updateObject(folderid, ts.uid, ts, this.getUser())
                .subscribe(res => console.log('✅ Update result:', res));
        }
    }


    extractObjectFromSentence(str) {
        return IoniScriptEngine.extractObjectFromSentence(str)
    }

    pushHistory(ts) {
        let binaryData = this.compress(ts)
        const chunkSize = 0x8000; // 32,768 
        let stringData = '';
        for (let i = 0; i < binaryData.length; i += chunkSize) {
            const chunk = binaryData.subarray(i, i + chunkSize);
            stringData += String.fromCharCode.apply(null, chunk);
        }
        LionEngine.history.push(stringData)
        this.trimHistoryStack(LionEngine.history, 200);
        LionEngine.lastHistoryPush = Date.now()
    }

    getLastHistoryPushTime() {
        return LionEngine.lastHistoryPush;
    }

    listenForObjectUpdate(ptid, updateMethod, user) {
        if (LionEngine.server && ptid) {
            LionEngine.server.joinFolder(ptid, user);
            LionEngine.server.onObjectUpdated(updateMethod)
        }
    }
    connectToSharedFolder(ptid, userid) {
        if (LionEngine.server && ptid) {
            // console.log ( " join " + ptid + ' --> ' + this.getUser())
            LionEngine.server.joinFolder(ptid, userid);
        }
    }

    trimHistoryStack(historyStack, maxSize) {
        if (historyStack.length > maxSize) {
            const startIndex = historyStack.length - maxSize;
            historyStack.splice(0, startIndex);
        }
    }
    popHistory() {
        let stringData = LionEngine.history.pop();
        const byteValues = [];
        for (let i = 0; i < stringData.length; i += 0x8000) {
            const chunk = stringData.substring(i, i + 0x8000);
            for (let j = 0; j < chunk.length; j++) {
                byteValues.push(chunk.charCodeAt(j));
            }
        }
        const binaryData = new Uint8Array(byteValues);
        let dst = this.decompress(binaryData);
        return dst;
    }

    compress(stringObj) {
        return pako.deflate(stringObj);
    }
    decompress(stringObj) {
        try {

            const pako_test = pako.inflate(stringObj, { to: 'string' })
            const restored = JSON.parse(pako_test);
            return restored;
        } catch (exception) {
            console.log(" Failed to decompress ")
        }
        return null;
    }
    addEventCommand(scope, comp) {
        const event = `${scope}.${comp}`;
        const duplicates = ['deselect', 'deselect all'];

        if (
            LionEngine.events.length > 0 &&
            LionEngine.events[LionEngine.events.length - 1] === event &&
            duplicates.includes(comp)
        ) {
            // Don't add the event if it's a duplicate in the duplicates list
            return;
        }

        LionEngine.events.push(event);
    }

    getEventCommands() {
        return LionEngine.events;
    }

    resetEventCommands() {
        LionEngine.events = []
    }

    decompressStr(stringObj) {
        try {
            const binaryStr = atob(stringObj);
            // Convert the binary string to a character array
            const charData = binaryStr.split('').map(c => c.charCodeAt(0));
            // Convert the character array to a Uint8Array
            const byteArray = new Uint8Array(charData);
            const decompressed = pako.inflate(byteArray, { to: 'string' });
            return decompressed;
        } catch (exception) {
            console.log(" Failed to decompress ")
        }
        return null;
    }


    async require(lib: string) {
        if (lib === 'Chart') {
            Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, ScatterController, LogarithmicScale, RadialLinearScale, BarController, PolarAreaController);
            return Chart;
        } else if (lib === 'ocr') {
            let ocr_method = (async (image) => {
                logger: m => console.log(m)
                const worker = await createWorker();
                // await worker.loadLanguage('eng');
                // await worker.initialize('eng');
                const { data: { text } } = await worker.recognize(image);
                await worker.terminate();
                return { data: { text } };
            })
            return ocr_method;
        }
        return null;
    }
    save(path: string, name: string, type: string, rule: string, input: string, callback: any) {
        this.im.save(path, name, type, rule, input, callback);
    }
    setComponent(label, compObj: any) {
        let vc = LionEngine.componentRefs[label];
        if (!vc) {
            return;
        }

        // Toolbar history: setting a toolbar cancels any pending restore for this label and
        // records it so a later "reset" (clearComponent) can fall back to the previous one.
        if (LionEngine.restorableToolbarLabels.indexOf(label) >= 0) {
            if (LionEngine.toolbarRestoreTimer[label]) {
                clearTimeout(LionEngine.toolbarRestoreTimer[label]);
                LionEngine.toolbarRestoreTimer[label] = null;
            }
            const st = LionEngine.toolbarStack[label] || (LionEngine.toolbarStack[label] = []);
            if (st[st.length - 1] !== compObj) st.push(compObj);
            if (st.length > 10) st.shift();
        }
        let viewContainerRef = vc.viewContainerRef;

        // Explicitly destroy existing components
        if (vc.components && vc.components.length > 0) {
            vc.components.forEach((componentRef) => {
                if (componentRef && componentRef.destroy) {
                    componentRef.destroy();
                }
            });
        }

        // Clear the container
        viewContainerRef.clear();
        vc.components = [];

        // Load the new component
        let w = this.loadWidget(compObj, null, viewContainerRef);
        let components = [];
        components.push(w);

        // Update the reference
        vc = {
            'viewContainerRef': viewContainerRef,
            'components': components
        };
        LionEngine.componentRefs[label] = vc;

        // Run within Angular's zone after a timeout
        setTimeout(() => {
            this.zone.run(() => {
                // Any additional logic here
            });
        }, 500);
    }
    setStashed(label: string, component) {
        LionEngine.stashed[label] = component;
    }
    getStashed(label: string) {
        return LionEngine.stashed[label];
    }

    // addEventCommand(scope, command) {
    //     const restrictedCommands = [`${scope}.deselect`, `${scope}.tag Column Header`];
    //     const fullCommand = `${scope}.${command.trim()}`;
    //     const lastCommand = LionEngine.eventCommands[LionEngine.eventCommands.length - 1];
    //     if (restrictedCommands.includes(lastCommand) && restrictedCommands.includes(fullCommand)) {
    //         return; // Do not add the new command
    //     }
    //     LionEngine.eventCommands.push(fullCommand);
    // }
    //     resetEventCommands() {
    //     LionEngine.eventCommands = [];
    // }
    // getEventCommands() {
    //     return LionEngine.eventCommands;
    // }

    addComponent(label, compObj: any) {
        let vc = LionEngine.componentRefs[label]
        if (vc.components != null) {
            let components = vc.components;
            let w = this.loadWidget(compObj, null, vc.viewContainerRef);
            components.push(w)
            vc = {
                'viewContainerRef': vc.viewContainerRef,
                'components': components
            }
            LionEngine.componentRefs[label] = vc;
        }
    }
    clearComponent(label) {
        // Split the input string by the specified delimiters into an array.
        const delimiters = /[,;:|\-\/]/; // Regex pattern for comma, colon, semicolon, dash, pipe, and slash
        const labels = label.split(delimiters).map(label => label.trim()).filter(label => label); // Split and trim each label, filter out any empty strings

        // Iterate over each label in the resulting array.
        labels.forEach((label) => {
            let vc = LionEngine.componentRefs[label];
            if (vc) {
                let viewContainerRef = vc.viewContainerRef;
                viewContainerRef.clear(); // Clear the view container reference
                vc.components = []; // Reset the components array
            }

            // For a toolbar panel, a bare clear is a "reset": instead of leaving it blank,
            // restore the PREVIOUS toolbar. Deferred so the common clear-then-setComponent
            // pattern cancels the restore (setComponent clears this timer + sets the new one).
            if (LionEngine.restorableToolbarLabels.indexOf(label) >= 0) {
                const st = LionEngine.toolbarStack[label];
                if (st && st.length > 0) {
                    if (LionEngine.toolbarRestoreTimer[label]) clearTimeout(LionEngine.toolbarRestoreTimer[label]);
                    LionEngine.toolbarRestoreTimer[label] = setTimeout(() => {
                        LionEngine.toolbarRestoreTimer[label] = null;
                        const stack = LionEngine.toolbarStack[label];
                        if (!stack || !stack.length) return;
                        stack.pop();                             // drop the toolbar that was cleared
                        const prev = stack[stack.length - 1];    // the previous toolbar
                        if (prev != null) this.setComponent(label, prev);
                    }, 0);
                }
            }
        });
    }
    getComponent(label, index) {
        let vc = LionEngine.componentRefs[label]
        if (!vc)
            return null;
        let c = vc.components;
        if (c.length > index) {
            return c[index]
        }
        return vc;
    }

    disable() {
        console.log(' disable ')
    }



    loadWidget(wid: {}, resolve, viewContainerRef) {


        if (!wid || !wid['wid']) {
            return null;
        }

        console.log(' wid ' + wid['wid'])
        let type = wid["wid"];
        if (type == null) type = wid["type"];
        let line = wid["input"];
        let title = wid["title"];
        if (line == undefined || line == null) {
            line = wid["data"];
        }
        if (wid['componentRef'] === 'testing') {
            debugger;
        }

        // viewContainerRef.element.nativeElement.set
        let pubcomp = WidgetFactory.createWidget(type);
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            pubcomp
        );
        let componentRef = viewContainerRef.createComponent(componentFactory);
        if (line != undefined) (<PubComponent>componentRef.instance).data = line;
        (<PubComponent>componentRef.instance).resolveFunction = resolve;
        (<PubComponent>componentRef.instance).title = title;
        // this.renderer.setStyle(viewContainerRef.element.nativeElement, 'min-height', '200px');

        (<PubComponent>componentRef.instance).init(null);

        if (wid['refCallback'] != null) {
            LionEngine.ionfunctions[wid['refCallback']](<PubComponent>componentRef.instance);
        }

        setTimeout(() => {
            try {
                if (this.zone)
                    this.zone.run(() => {
                        // (componentRef.instance).resize();

                    })
            } catch (exception) {

            }

        }, 1000)
        return (<PubComponent>componentRef.instance);
    }
    micOff() {

    }




    voiceToText(listener): void {
        this.im.voiceToText(listener);
    }

    static execIon(ionfunctionid, ...arg): any {
        return LionEngine.ionfunctions[ionfunctionid](arg);
    }

    run(path, rule_name, input): Promise<any> {
        let imgf = this.im;
        debugger;

        return new Promise((resolve, reject) => {
            this.ruledb.loadRule(path, rule_name).then(ru => {
                if (!ru) {
                    reject();
                } else {
                    // console.log(JSON.stringify(ru));
                    IoniScriptEngine.execLog.push(path + '/' + rule_name)
                    this.rule_engine.runR(ru["rule_value"], imgf, resolve, input);
                }
            });
        });
    }
    getScript(path): Promise<any> {
        let index = path.lastIndexOf('/')
        let name = path.substring(index + 1);
        path = path.substring(0, index);

        return new Promise((resolve, reject) => {
            this.ruledb.loadRule(path, name).then(ru => {
                if (!ru) {
                    console.log(' Failed to find the path : ' + path + ' name ' + name)
                    resolve({});
                } else {
                    resolve(ru);
                }
            });
        });
    }

    saveScript(category, name, type, script) {
        let input = null;

        // alert(' saveScript ')
        return new Promise((resolve, reject) => {
            var headers = new Headers();
            if (script == null || script.length <= 0) {
                script = "console.log ( \"Executing " + name + " \");";
            }
            headers.append('Content-Type', 'application/x-www-form-urlencoded')
            if (category != null && category.length > 0) {
                let r = { "user_id": category, "rule_name": name, "rule_type": type, "rule_value": script };
                if (input != null) {
                    if (input != null && input.length > 0 && input.toLowerCase() != "undefined") {
                        r["input_label"] = input;
                    }
                }
                let body = JSON.stringify(r);
                const httpHeaders = new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded'
                });
                if (category != null && category.length > 0) {



                    this.http.post(environment.save_dev_script, body, { headers: httpHeaders })
                        .pipe(
                            catchError((error: any): Observable<{}> => {
                                console.log(" failed" + JSON.stringify(error));
                                resolve(error);
                                return null;
                            }))
                        .subscribe(response => {
                            resolve(response);
                            console.log(" " + JSON.stringify(response));
                        });
                }
            }
        })
    }






    getRule(path, rule_name): Promise<any> {
        return new Promise((resolve, reject) => {
            this.ruledb.loadRule(path, rule_name).then(ru => {
                if (!ru) {
                    reject();
                } else {
                    // console.log(JSON.stringify(ru));
                    resolve(async (...params: any[]) => {
                        this.im.resetLog();

                        let hs = IoniScriptEngine.helm_script.getHELMScript();
                        if (hs == null) {
                            hs = '';
                        }
                        let solr_lib = IoniScriptEngine.helm_script.getSolrLib();
                        if (solr_lib == null || solr_lib.length == 0) {

                            solr_lib = '';
                        }

                        var function_value = solr_lib + '\n' + hs + "\n{\n" +
                            " if ( arguments.length > 2 ) {\n" +
                            "       let narguments = [];\n " +
                            "       for ( let i = 2; i < arguments.length; i++){\n" +
                            "           console.log ( ' args ' + arguments[i] ); \n" +
                            "           let paramlist = arguments[i]; \n" +
                            "               for ( let j in paramlist){\n" +
                            "                     narguments.push (paramlist[j]); \n" +
                            "                } \n" +
                            "        } \n" +
                            "       arguments = narguments;\n" +
                            "}\n" +
                            ru["rule_value"] + " \n };";
                        // console.log ( "" + function_value );
                        // this.im.log ( function_value );
                        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
                        let fn = AsyncFunction('lion_engine', 'map', function_value);
                        return await fn(this, {}, params);
                        // return this.rule_engine.run(ru.rule_type, ru.rule_value, null, null, this.im, params);
                    });
                }
            });
        });
    }


    getLog(type) {
        return LionEngine.exec_log;
    }




    getRuleP(path): Promise<any> {

        let li = path.lastIndexOf('/')
        let rule_name = path.substring(li + 1).trim();
        let path_ = path.substring(0, li);
        debugger;


        return new Promise((resolve, reject) => {
            this.ruledb.loadRule(path_, rule_name).then(ru => {
                if (!ru) {
                    reject();
                } else {
                    // console.log(JSON.stringify(ru));
                    resolve(async (...params: any[]) => {
                        this.im.resetLog();

                        let hs = IoniScriptEngine.helm_script.getHELMScript();
                        if (hs == null) {
                            hs = '';
                        }
                        let solr_lib = IoniScriptEngine.helm_script.getSolrLib();
                        if (solr_lib == null || solr_lib.length == 0) {

                            solr_lib = '';
                        }

                        var function_value = solr_lib + '\n' + hs + "\n{\n" +
                            " if ( arguments.length > 2 ) {\n" +
                            "       let narguments = [];\n " +
                            "       for ( let i = 2; i < arguments.length; i++){\n" +
                            "           console.log ( ' args ' + arguments[i] ); \n" +
                            "           let paramlist = arguments[i]; \n" +
                            "               for ( let j in paramlist){\n" +
                            "                     narguments.push (paramlist[j]); \n" +
                            "                } \n" +
                            "        } \n" +
                            "       arguments = narguments;\n" +
                            "}\n" +
                            ru["rule_value"] + " \n };";
                        // console.log ( "" + function_value );
                        // this.im.log ( function_value );
                        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
                        let fn = AsyncFunction('lion_engine', 'map', function_value);
                        return await fn(this, {}, params);
                        // return this.rule_engine.run(ru.rule_type, ru.rule_value, null, null, this.im, params);
                    });
                }
            });
        });
    }





    addProcessListener(listener: ProcessListener): void {
        this.processListeners.push(listener);
    }
    async POST(file, url): Promise<string> {
        let fd;
        console.log(" file" + file);
        await this.im.POSTFile(file, url).then(f => fd = f);
        return fd;
    }

    signUp() {
        IoniScriptEngine.app.signUp();
    }
    login() {
        IoniScriptEngine.app.login();
    }
    public900807() {
        OAuthSettings.access_token = 'public@hts.bio'
        IoniScriptEngine.app.user_id = 'public@hts.bio'
    }

    logout() {
        IoniScriptEngine.app.logout();

    }

    getUser() {
        if (OAuthSettings.access_token != null && OAuthSettings.access_token.trim().length <= 0)
            return null;
        return OAuthSettings.access_token;
    }



    async readUserTempFile(filename) {

        let sp = filename.split('.')
        let filetype = sp[1]
        filename = sp[0]
        let statusObj = {
            user: OAuthSettings.access_token,
            type: filetype,
            name: filename
        }

        let rf = await FunctionUtil.POSTJSON(statusObj, environment.readtempfile)
        const rrf = JSON.parse(rf['content'])
        return rrf;
    }



    async rmUserTempFile(filename) {

        let sp = filename.split('.')
        let filetype = sp[1]
        filename = sp[0]
        let statusObj = {
            user: OAuthSettings.access_token,
            type: filetype,
            name: filename
        }
        let rf = await FunctionUtil.POSTJSON(statusObj, environment.rmtempfile)
        const rrf = JSON.parse(rf['content'])
        return rrf;
    }



    async exec_tab(path, params: any) {
        let urlpathparams = '?';

        if (params) {
            let keys = Object.keys(params);
            for (let k of keys) {
                let va = params[k]
                urlpathparams += k + '=' + va + '&';
            }
        }
        if (urlpathparams.endsWith('&')) {
            urlpathparams = urlpathparams.substring(0, urlpathparams.length - 1);
        }
        let root = IoniScriptEngine.root + '/' + path;
        if (urlpathparams.length > 1) {
            root += urlpathparams;
        }
        if (root.startsWith('/')) {
            root = root.substring(1).trim();
        }
        window.open('/#/app/' + root, '_blank');
    }

    getIonisFS() {
        return this.im.getIonisFS();
    }
    showNavbar(navbarconfig) {
        // return this.im.showNavbar(navbarconfig);
    }
    clearMenu() {
        return this.im.clearMenu();
    }

    showMenu(menuConfig) {
        return this.im.showMenu(menuConfig);
    }

    showFooter(menuConfig) {
        return this.im.showFooter(menuConfig);
    }


    createIonFunction(ref: Function, removeFunction: any) {
        let uuid = FunctionUtil.uuidv4();
        LionEngine.ionfunctions[uuid] = ref;
        return uuid;
    }



    getIonFunction(ref): Function {
        return LionEngine.ionfunctions[ref]
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

    // tslint:disable-next-line:member-ordering
    public static getFunction(src: string): Function {
        src = FunctionUtil.removeComments(src)

        let args = LionEngine.getArguments(src);
        let src_value = LionEngine.getFunctionBody(src);

        let hs = IoniScriptEngine.helm_script.getHELMScript();
        if (hs == null) {
            hs = '';
        }
        // console.log(" creating the function with arguments : " + args);
        // let fg = new Function('lion_engine', ...args, hs + '\n\n' + src_value);
        let AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
        let fg = new AsyncFunction('lion_engine', ...args, hs + '\n\n' + src_value);

        return fg;
    }
    // tslint:disable-next-line:member-ordering
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

    getAccessToken() {
        return OAuthSettings.access_token;
    }

    createObject(object_type, config): Promise<any> {
        return this.im.createObject(object_type, config);
    }


    createIonfunctionFromSrc(src): Function {
        return LionEngine.getFunction(src);
    }
    getLionEngineScriptWithArgs(src) {
        return IoniScriptEngine.getLionEngineScript(src);
    }




    async loadFunction(path) {
        if (!IoniScriptEngine.root) {
            if (!path.endsWith('.js')) {
                path = path + '.js';
            }
            if (FunctionUtil.cache[path.trim()] != null && FunctionUtil.cache_on) {
                return FunctionUtil.cache[path.trim()]
            }
            else
                return await this.function_util.loadFunctionFromDB(path, IoniScriptEngine.helm_script.getHELMScript());
        } else {

            return null;
        }
    }

    bufferFrom(objectstr) {
        return Buffer.from(objectstr);
    }



    async GETFUNCTION(path, rule_name) {
        if (!IoniScriptEngine.root) {
            if (!path.endsWith('.js')) {
                path = path + '.js';
            }
            if (FunctionUtil.cache[path.trim()] != null && FunctionUtil.cache_on) {
                return FunctionUtil.cache[path.trim()]
            }
            else
                return await this.function_util.loadFunctionFromDB(path, '');
        } else {
            if (!path.endsWith('/') && rule_name != undefined && rule_name != null && rule_name.length > 0)
                path += '/';
            if (rule_name != undefined && rule_name.length > 0)
                path += rule_name;


            if (!path.endsWith('.js')) {
                path = path + '.js';
            }

            return null;
        }
    }



    static status = {

    }

    async GETJSON(url, header) {


        // Optional helpers if you want to derive userId from a JWT
        function decodeJwtPayload(token?: string): any | null {
            if (!token || token.split('.').length !== 3) return null;
            try {
                const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                return JSON.parse(atob(payload));
            } catch { return null; }
        }
        function deriveUserIdFromToken(token?: string): string | undefined {
            const p = decodeJwtPayload(token);
            return p?.email || p?.preferred_username || p?.upn || p?.sub;
        }

        // url: string, header?: Record<string,string>, userId?: string
        return new Promise((resolve, reject) => {
            const token = (OAuthSettings as any)?.access_token as string | undefined;

            const userId = token;

            // Build headers (HttpHeaders is immutable — always reassign after set)
            const base = (header ?? {}) as Record<string, string>;

            let head = new HttpHeaders(base).set('Accept', 'application/json');

            if (token) {
                head = head.set('Authorization', `Bearer ${token}`);
            }

            // Prefer explicit header.x-user-id, then passed userId, then derive from token
            const explicitUserId = base['x-user-id'] as string | undefined;
            const effectiveUserId = explicitUserId || (typeof userId !== 'undefined' ? userId : deriveUserIdFromToken(token));

            if (effectiveUserId) {
                head = head.set('x-user-id', effectiveUserId);
            }

            console.log('Request headers:',
                { auth: head.get('Authorization'), xUserId: head.get('x-user-id') });

            let fd: any;

            this.http.get(url, { responseType: 'json', headers: head })
                .pipe(
                    catchError((error: any): Observable<{}> => {
                        console.log('GET failed', error);
                        resolve(error);           // keep your existing resolve-on-error behavior
                        return of({});            // swallow stream with empty object
                    })
                )
                .subscribe(res => {
                    fd = res;
                    resolve(fd ?? {});
                });
        });

    }


    async LOADPDF(url, filepath, user, key) {
        return FunctionUtil.LOADPDF(url, filepath, user, key)
    }




    async GETJSON_(url, header, index) {


        return new Promise((resolve, reject) => {
            let fd;
            if (header != null) {
                let head = new HttpHeaders(header);
                // console.log(" header " + JSON.stringify(header));
                this.http.get(url, { responseType: 'json', headers: head }).pipe(
                    catchError((error: any): Observable<{}> => {
                        console.log(" failed" + JSON.stringify(error));
                        resolve(error);
                        return of({} as {});
                    }
                    )).subscribe(res => {
                        fd = res;
                        if (fd) {
                            // console.log("  fd " + JSON.stringify(fd));
                            resolve(fd);
                        } else {
                            resolve({});
                        }
                    });

            } else {

                this.http.get(url).pipe(
                    catchError(async (error: any) => {
                        console.log(" index " + index);
                        console.log(" failed" + JSON.stringify(error));

                        let v = async () => {
                            setTimeout(async () => {
                                return await this.GETJSON_(url, header, index++)
                            }, 500)
                        }
                        let rw = await v();
                        resolve(rw);
                    }
                    )).subscribe(res => {
                        fd = res;
                        if (fd) {
                            // console.log("  fd " + JSON.stringify(fd));
                            resolve(fd);
                        } else {
                            resolve({});
                        }
                    });
            }
        }
        );
    }





    libs = [];

    async execObject(_code: string, ...args: any[]) {
        let c = _code;
        let str = '';
        let objs = []
        for (let i of args) {
            str += i["name"] + ',';
            objs.push(i['object'])
        }
        if (str.endsWith(',')) {
            str = str.substring(0, str.length - 1)
        }


        for (let lib of this.libs) {
            c = `exec ('${lib['path']}').then ( async (${lib['name']}) => {
        ${c}
      })`
        }
        let code = `function (${str}) { 
                                    ${c} }`
        return this.rule_engine.exec(code, this.im, () => {
        }, objs)
    }

    async exec(path, ...funargs) {
        // Track backend (.py) execs so the canvas can show a "working" signal
        // while any server search is still running (window.__backendWorkCount).
        const __isPyExec = !!(path && typeof path === 'string' && path.endsWith('.py'));
        if (__isPyExec) {
            try { (window as any).__backendWorkCount = (((window as any).__backendWorkCount) || 0) + 1; } catch (e) { }
        }
        let startDate = new Date();
        let seconds = 0;
        let index = 0;
        let engineMonitor = null;

        if (funargs.length > 0) {
            let is_listener = funargs[0];
            if (is_listener && is_listener.constructor && is_listener.constructor.name === 'EngineMonitor') {
                engineMonitor = is_listener;
            }
        }

        let tfunargs = [];
        if (engineMonitor != null && funargs.length > 1) {
            for (let i = 1; i < funargs.length; i++) {
                tfunargs.push(funargs[i]);
            }
            funargs = tfunargs;
        }

        let pr = new Promise(async (resolve, reject) => {
            if (!path || path == null || path.length <= 0) {
                console.log("Path is not valid " + path);
                console.trace();
                return reject();
            }

            let it = path.indexOf('/');
            IoniScriptEngine.execLog.push(path);

            if (path.endsWith('.py')) {
                return execPyPost(path, funargs).then(r => {
                    let prev = null;
                    let waiting = false;
                    let lineindex = 0;
                    let counter = 100;

                    const processLines = async () => {
                        let endDate = new Date();
                        seconds = (endDate.getTime() - startDate.getTime()) / 1000;

                        if (seconds >= 400) {
                            console.log("FAILED TO COMPLETE TIME OUT IS > 10MIN");
                            return;
                        }

                        if (!waiting) {
                            waiting = true;
                            let host = r['host'];
                            if (host.endsWith('/')) {
                                host = host.substring(0, host.length - 1);
                            }
                            let url = host + '/py-out/read?path=' + r['path'] + '&start=' + lineindex;

                            let out = await FunctionUtil.GETJSON(url);
                            if (out && out['lines'] && out['lines'].length > 0) {
                                if (prev == null || prev != out['lines']) {
                                    let lines = out['lines'];
                                    let collectedString = '';
                                    let isResolutionSection = false;

                                    for (let l of lines) {
                                        l = decodeURI(l).trim();


                                        if (l.startsWith('EXIT_CODE:')) {
                                            try {
                                                waiting = false;
                                                console.log(" end sr " + collectedString.substring(collectedString.length - 100))
                                                let jobj = JSON.parse(collectedString.trim());
                                                return resolve(jobj)
                                            } catch (exception) {
                                                // console.log('Failed to parse collected JSON:', exception);
                                                counter = 0;
                                                setTimeout(processLines, counter)

                                            }
                                            return resolve(out);
                                        } else
                                            if (isResolutionSection) {
                                                collectedString += l.trim();
                                            } else
                                                if (l.startsWith('IONWORKS:RESOLUTION:')) {
                                                    isResolutionSection = true;
                                                    collectedString += l.substring(20).trim();
                                                } else if (l.startsWith('IONWORKS:OBJ:')) {
                                                    let obj = l.substring(13);
                                                    try {
                                                        let jobj = JSON.parse(obj);
                                                        engineMonitor.update(jobj);
                                                    } catch (exception) {
                                                        console.log(exception);
                                                        waiting = false;
                                                        setTimeout(processLines, counter);
                                                    }
                                                } else if (l.startsWith('IONWORKS:PROGRESS:')) {
                                                    let progress = l.substring(18);
                                                    if (engineMonitor != null) {
                                                        engineMonitor.setProgress(+progress.trim());
                                                    }
                                                } else if (l.startsWith('IONWORKS:MSG:')) {
                                                    let msg = l.substring(14);
                                                    console.log('msg ' + msg);
                                                    if (engineMonitor != null) {
                                                        engineMonitor.setMSG(msg);
                                                    }

                                                }

                                    }


                                    prev = out['lines'];
                                }
                            }
                            waiting = false;
                        }
                        setTimeout(processLines, counter);
                    };

                    setTimeout(processLines, counter);
                });
            }

            if (it > 0) {
                let root_node = '';
                if (IoniScriptEngine.root) {
                    root_node = IoniScriptEngine.root + '/';
                }
                await this.loadFunction(root_node + path).then(async fun => {
                    if (!fun) {
                        return resolve(null);
                    }
                    let r = await fun(this, ...funargs);
                    if (r != null && r.hasOwnProperty('then')) {
                        r.then(res => resolve(res));
                    } else {
                        resolve(r);
                    }
                });
            } else {
                if (LionEngine.ionfunctions[path] != null) {
                    resolve(LionEngine.execIon(path, funargs));
                } else {
                    reject();
                    return null;
                }
            }
        });

        if (__isPyExec) {
            let __cleared = false;
            const __clear = () => {
                if (__cleared) return;
                __cleared = true;
                try { (window as any).__backendWorkCount = Math.max(0, (((window as any).__backendWorkCount) || 1) - 1); } catch (e) { }
            };
            // Clear when the call settles (either way); plus a safety timeout in
            // case the backend poll never resolves (its own cap is ~400s).
            pr.then(__clear, __clear);
            setTimeout(__clear, 420000);
        }

        return pr;
    }





    async exec_dep(path, ...funargs) {
        let startDate = new Date();
        let seconds = 0;//(endDate.getTime() - startDate.getTime()) / 1000;        let index = 0;
        let engineMonitor: EngineMonitor = null;
        // if the first argument is an engine monitor 
        // then we use it and shift the args over. 
        if (funargs.length > 0) {
            let is_listener = funargs[0]
            if (is_listener && is_listener.constructor && is_listener.constructor.name === 'EngineMonitor') {
                engineMonitor = is_listener;
            }
        }
        let tfunargs = []
        if (engineMonitor != null && funargs.length > 1) {
            for (let i = 1; i < funargs.length; i++) {
                tfunargs.push(funargs[i])
            }
            funargs = tfunargs;
        }


        let pr = new Promise(async (resolve, reject) => {

            if (!path || path == null || path.length <= 0) {
                console.log(" Path is not valid " + path)
                console.trace();
                return reject();
            }
            let it = path.indexOf('/');
            IoniScriptEngine.execLog.push(path);
            if (path.endsWith('.py')) {
                return execPyPost(path, funargs).then(r => {
                    let prev = null;
                    let waiting = false;
                    let index = 0;
                    let previousIndex = 0;
                    let counter = 100;
                    let c = async () => {
                        let endDate = new Date();
                        seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                        if (seconds >= 1000) {
                            console.log(" FAILED TO COMPLETE TIME OUT IS > 10MIN")
                            return;
                        }
                        if (!waiting) {
                            waiting = true;
                            let host = r['host'];
                            if (host.endsWith('/')) {
                                host = host.substring(0, host.length - 1)
                            }
                            let url = host + '/py-out/read?path=' + r['path'] + '&start=' + previousIndex
                            // console.log(index + "reading from host " + host + " reading url " + url)


                            let out = await FunctionUtil.GETJSON(url);



                            if (out && out['lines'] && out['lines'].length > 0) {
                                if (prev == null || prev != out['lines']) {

                                    let lines = out['lines']
                                    previousIndex += lines.length - 1;

                                    let s = '';
                                    for (let l of lines) {
                                        l = decodeURI(l) + '\n'
                                        s += l + '\n'
                                        if (l.startsWith('EXIT_CODE:')) {
                                            // this.showModal({
                                            //     wid: 'text-editor',
                                            //     data: {
                                            //         code: s
                                            //     }

                                            // })
                                            setTimeout(c, counter)
                                            return resolve(out)
                                        } else
                                            if (l.startsWith('IONWORKS:OBJ:')) {
                                                let obj = l.substring(13)
                                                try {
                                                    let jobj = JSON.parse(obj);
                                                    debugger;
                                                    engineMonitor.update(jobj)
                                                } catch (exception) {
                                                    console.log(exception);
                                                    waiting = false;
                                                    setTimeout(c, counter);
                                                }
                                            }
                                            else
                                                if (l.startsWith('IONWORKS:PROGRESS_INTERVAL:')) {
                                                    let interval = l.substring(28)
                                                    if (interval) {

                                                    }


                                                }
                                                else
                                                    if (l.startsWith('IONWORKS:PROGRESS:')) {
                                                        let progress = l.substring(18)
                                                        if (engineMonitor != null) {
                                                            engineMonitor.setProgress(+progress.trim());
                                                        }

                                                    } else
                                                        if (l.startsWith('IONWORKS:MSG:')) {
                                                            let msg = l.substring(14)
                                                            console.log(' msg ' + msg)
                                                            if (engineMonitor != null) {
                                                                engineMonitor.setMSG(msg);
                                                            }
                                                        } else
                                                            if (l.startsWith('IONWORKS:RESOLUTION:')) {
                                                                let obj = l.substring(20)
                                                                obj.trim();

                                                                // console.log(obj)

                                                                // console.log ( ' obj : ' + obj.substring ( 100 ))
                                                                console.log('-------------- obj : ' + obj.substring(obj.trim().length - 100, obj.trim().length))
                                                                try {
                                                                    let jobj = JSON.parse(obj.trim());
                                                                    counter = 0;
                                                                    setTimeout(c, counter)
                                                                    return resolve(jobj)
                                                                } catch (exception) {
                                                                    console.log(exception);
                                                                    waiting = false;
                                                                }
                                                            }
                                    }
                                    if (engineMonitor != null) {
                                        engineMonitor.setRawOutput(s);
                                    }

                                    prev = out['lines'];
                                }
                            } else {
                            }
                            waiting = false;
                        }
                        setTimeout(c, counter);
                    }
                    setTimeout(c, counter);



                });
            }


            if (it > 0) {
                let root_node = '';
                if (IoniScriptEngine.root)
                    root_node = IoniScriptEngine.root + '/';
                await this.loadFunction(root_node + path).then(async fun => {
                    if (!fun) {
                        return resolve(null)
                    }

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
                if (LionEngine.ionfunctions[path] != null) {
                    resolve(LionEngine.execIon(path, funargs))
                }
                else {
                    reject();
                    return null;
                }
            }
        });
        return pr;
    }


    listForCategory(user: string) {
        return new Promise((resolve, reject) => {
            const httpOptions = {
                headers: new HttpHeaders({
                    Authorization: "Bearer " + OAuthSettings.access_token,
                    'Content-Type': 'application/json',
                })
            };

            // this.rules = [];
            if (user != null && user.length > 0) {
                var body = JSON.stringify({ "spath": user });


                console.log(' \t\t ' + body)


                this.http.post(environment.load_script_for_category, body, httpOptions).subscribe(response => {
                    if (response && response.toString().length > 0) {
                        let v = response as IoniScript[];
                        resolve(v)
                        // if ( v && v.length > 0)
                        //     this.setRules ( v )
                    }
                })
            }
        })
    }



    async POSTFile(file, properties, url) {
        return new Promise((resolve, reject) => {
            var h = new HttpHeaders();

            let _responseType = 'json';
            if (properties['responseType'] != null) {
                _responseType = properties['responseType']
            }


            const formData: FormData = new FormData();
            if (file.fileEntry != null && file.fileEntry.isFile) {
                file.fileEntry.file((ffile: File) => {
                    console.log(" file : " + ffile)
                    formData.append('file', ffile, file.relativePath);
                    formData.set('filename', file.relativePath)
                    let keys = Object.keys(properties)
                    for (let k of keys) {
                        formData.set(k, properties[k])
                    }
                    h.append('Content-Type', 'multipart/form-data');
                    if (_responseType === 'blob') {
                        this.http.post(url, formData, { headers: h, responseType: "blob" }).subscribe(res => {
                            resolve(res)
                        });
                    } else {
                        this.http.post(url, formData, { headers: h }).subscribe(res => {
                            resolve(res)
                        });
                    }
                });
            } else {
                let keys = Object.keys(properties)
                for (let k of keys) {
                    formData.set(k, properties[k])
                }
                console.log(" file : " + file)
                formData.append('file', file);
                h.append('Content-Type', 'multipart/form-data');
                if (_responseType === 'blob') {
                    this.http.post(url, formData, { headers: h, responseType: "blob" }).subscribe(res => {
                        // debugger;
                        resolve(res)
                    });
                } else {
                    this.http.post(url, formData, { headers: h }).subscribe(res => {
                        // debugger;
                        resolve(res)
                    });

                }
            }
        });
    }



    async POSTJSON(jsonobject, url) {
        // console.log(" t " + JSON.stringify(jsonobject));
        // console.log(" url " + url);
        // console.log(" json " + jsonobject);
        let post_params = {
            headers: new HttpHeaders(
                { 'Content-Type': 'application/json' })
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

        return new Promise((resolve, reject) => {
            let fd;
            console.log(' ___url ' + url);
            console.log(" http headeri-------------- " + JSON.stringify(post_params));
            let httpHeaders = new HttpHeaders().set('Content-Type', 'application/json');
            if (OAuthSettings?.access_token) {
                httpHeaders = httpHeaders.set('x-user-id', OAuthSettings.access_token);
            }
            this.http.post(url, JSON.stringify(jsonobject),
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


    async FILEBUG(jsonobject, attachment) {
        console.log(jsonobject)
        let post_params = {
            headers: new HttpHeaders(
                { 'Content-Type': 'application/json' })
        };

        return new Promise((resolve, reject) => {
            let fd;
            debugger;
            console.log(" http headeri-------------- " + JSON.stringify(post_params));
            console.log(JSON.stringify(jsonobject));
            let uri = environment.file_bug;
            if (attachment) {
                uri = environment.bug_attachment;
            }
            this.http.post(uri, JSON.stringify(jsonobject),
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
                        console.log(" response " + JSON.stringify(res));
                        resolve(res);
                    }
                });
        });
    }



    async PUTJSON(jsonobject, url) {
        console.log(" t " + JSON.stringify(jsonobject));
        console.log(" url " + url);
        return new Promise((resolve) => {
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
    updateProcess(rs: RunStatus) {
        this.notifyProcessListeners(rs);
    }
    notifyProcessListeners(runstatus: RunStatus) {
        if (this.processListeners.length > 0) {
            for (let li of this.processListeners) {
                li.statusChanged(runstatus);
            }
        }
    }




    async generateDocument(experiment_id, documentObject) {
        return new Promise(async (resolve, reject) => {
            const doc = new Document(
                {

                    sections: [
                        {
                            properties: {

                            },
                            headers: {
                                default: new Header({
                                    children: [new Paragraph(experiment_id + "\tAuthor: " + documentObject.author)],
                                }),
                            },
                            footers: {
                                default: new Footer({
                                    children: [new Paragraph("La Jolla Labs ELN")],
                                }),
                            },

                            children: [
                                new Paragraph({
                                    text: documentObject.title,
                                    heading: HeadingLevel.TITLE,

                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: experiment_id,
                                            style: 'italics'
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "_________________________________________________________________________________",
                                            style: 'italics'
                                        }),
                                    ],
                                }),

                                new Paragraph({
                                    text: documentObject.author,
                                    style: 'italics',
                                    heading: HeadingLevel.HEADING_5,
                                    thematicBreak: true,
                                }),
                                new Paragraph({
                                    text: documentObject.summary
                                }),
                            ],
                        }


                    ],
                    creator: documentObject.author,
                    title: documentObject.title,
                    subject: experiment_id,
                    description: documentObject.summary,
                }
            );
            // doc.addSection();
            let blob = await Packer.toBlob(doc);
            resolve(blob);
        })
    }




    async generate_document(experiment_id, title, summary, author) {
        return new Promise(async (resolve, reject) => {
            // const doc = new Document(
            //     {
            //         creator: author,
            //         title: title,
            //         subject: experiment_id,
            //         description: summary,
            //     }
            // );
            // doc.addSection({
            //     properties: {

            //     },
            //     headers: {
            //         default: new Header({
            //             children: [new Paragraph(experiment_id + "\tAuthor: " + author)],
            //         }),
            //     },
            //     footers: {
            //         default: new Footer({
            //             children: [new Paragraph("La Jolla Labs ELN")],
            //         }),
            //     },

            //     children: [
            //         new Paragraph({
            //             text: title,
            //             heading: HeadingLevel.TITLE,

            //         }),
            //         new Paragraph({
            //             children: [
            //                 new TextRun({
            //                     text: experiment_id,
            //                     style: 'italics'
            //                 }),
            //             ],
            //         }),
            //         new Paragraph({
            //             children: [
            //                 new TextRun({
            //                     text: "_________________________________________________________________________________",
            //                     style: 'italics'
            //                 }),
            //             ],
            //         }),

            //         new Paragraph({
            //             text: author,
            //             style: 'italics',
            //             heading: HeadingLevel.HEADING_5,
            //             thematicBreak: true,
            //         }),
            //         new Paragraph({
            //             text: summary
            //         }),
            //     ],
            // });
            // let blob = await Packer.toBlob();
            // resolve(blob);
        })
    }


    showApp(title, url) {
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
    show(jsonobj): Promise<{}> {
        return this.im.showWidget(jsonobj);
    }
    showModal(jsonobj, width, height): Promise<{}> {
        return this.im.showModal(jsonobj, width, height);
    }
    isModal() {
        return this.im.isModal();
    }
    hideAllModal() {
        return this.im.hideAllModal();
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

            const lf = new LionFile();
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
    removeComponent(index) {
        this.im.removeComponent(index);
    }
    getComponentCount() {
        return this.im.getComponentCount();
    }

    clearLog(): void {
        this.im.resetLog();
    }
    cacheOff(): void {
        FunctionUtil.cache_on = false;
    }
    cacheON(): void {
        FunctionUtil.cache_on = true;
    }

    Log(): void {
        this.im.resetLog();
    }

    log(line: string): void {
        // console.log(line);
        this.im.log(line);
    }


    exportToCsv(data, file_name, separator) {
    }

    /**
     * @param path  
     * @param name 
     */
    load(path, name) {
        return this.ruledb.loadRule(path, name);
    }

}

export class LionFile {
    name: string;
    content: string;

}


function execPy(path: string, args): PromiseLike<{}> {
    return (new Promise((resolve) => {
        let host = window['env']['apiUrl'];
        if (host.endsWith('/')) {
            host = host.substring(0, host.length - 1)
        }

        debugger;
        if (path.startsWith('http://localhost')) {
            let hostindex = path.indexOf('localhost')
            let pathindex = path.indexOf('/', hostindex + 9);
            host = path.substring(0, pathindex)

            path = path.substring(pathindex)
        } else
            if (path.startsWith('http')) {
                let indexIO = path.indexOf('/ionworks/')
                host = path.substring(0, indexIO) + '/ionworks';

                path = path.substring(indexIO + 10)
            }

        if (args != null && args.length > 0) {
            const ids = new StringIdGenerator();
            let sar = '';

            for (let a of args) {
                if (sar.length > 0)
                    sar += '&'
                sar += ids.next() + `=${a}`;
            }

            // console.log ( " exec python "+ host)

            if (path.startsWith('/')) {
                path = path.substring(1).trim();
            }
            let url = host + '/py/' + path + '?args=' + encodeURIComponent(sar.toString())

            FunctionUtil.GETJSON(url).then(functionResultObject => {
                if (functionResultObject != null) {
                    functionResultObject['host'] = host
                    return resolve(functionResultObject);
                }
            });
        } else {
            FunctionUtil.GETJSON(host + '/py/' + path).then(functionResultObject => {
                if (functionResultObject != null) {
                    functionResultObject['host'] = host
                    return resolve(functionResultObject);
                }
            });

        }
        // FunctionUtil.POSTJSON(js, environment.exec_py + '/' + path).then(functionResultObject => {
        //     if (functionResultObject != null) {

        //         // let src = functionObject['rule_value'];
        //         // let f = FunctionUtil.getFunction(src, parentLib);
        //         // resolve(f);
        //     }
        // });
    }));



}



function execPyPost(path: string, args): PromiseLike<{}> {
    return (new Promise((resolve) => {
        let host = window['env']['apiUrl'];
        if (host.endsWith('/')) {
            host = host.substring(0, host.length - 1)
        }


        if (path.startsWith('http://localhost')) {
            let hostindex = path.indexOf('localhost')
            let pathindex = path.indexOf('/', hostindex + 9);
            host = path.substring(0, pathindex)
            path = path.substring(pathindex)
        } else
            if (path.startsWith('http')) {
                let indexIO = path.indexOf('/ionworks/')
                host = path.substring(0, indexIO) + '/ionworks';

                path = path.substring(indexIO + 10)
            }


        let jargs = {}
        if (args != null && args.length > 0) {
            const ids = new StringIdGenerator();
            let sar = '';

            let index = 1;
            for (let a of args) {
                jargs[ids.next()] = a;
                index++;
            }

            // console.log ( " exec python "+ host)

            if (path.startsWith('/')) {
                path = path.substring(1).trim();
            }
            let url = host + '/py/' + path


            FunctionUtil.POSTJSON(jargs, url).then(functionResultObject => {
                if (functionResultObject != null) {
                    functionResultObject['host'] = host
                    return resolve(functionResultObject);
                }
            });
        } else {
            FunctionUtil.GETJSON(host + '/py/' + path).then(functionResultObject => {
                if (functionResultObject != null) {
                    functionResultObject['host'] = host
                    return resolve(functionResultObject);
                }
            });

        }
        // FunctionUtil.POSTJSON(js, environment.exec_py + '/' + path).then(functionResultObject => {
        //     if (functionResultObject != null) {

        //         // let src = functionObject['rule_value'];
        //         // let f = FunctionUtil.getFunction(src, parentLib);
        //         // resolve(f);
        //     }
        // });
    }));



}



class StringIdGenerator {
    private _chars: string;
    private _nextId: number[];
    constructor(chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        this._chars = chars;
        this._nextId = [0];
    }

    next() {
        const r = [];
        for (const char of this._nextId) {
            r.unshift(this._chars[char]);
        }
        this._increment();
        return r.join('');
    }

    _increment() {
        for (let i = 0; i < this._nextId.length; i++) {
            const val = ++this._nextId[i];
            if (val >= this._chars.length) {
                this._nextId[i] = 0;
            } else {
                return;
            }
        }
        this._nextId.push(0);
    }

    *[Symbol.iterator]() {
        while (true) {
            yield this.next();
        }
    }
}