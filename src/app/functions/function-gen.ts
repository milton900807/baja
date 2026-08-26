import { TrailScriptLib } from "./trail-script-lib";
import { Injectable } from "@angular/core";
import { IoniScriptEngine } from "../engine/io-engine";
import { FunctionUtil } from "./function-util";

@Injectable()
export class FunctionGenerator {

    // expected output: 8
    static STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    static ARGUMENT_NAMES = /([^\s,]+)/g;

    constructor(private ts: TrailScriptLib) {
    }
    // tslint:disable-next-line:member-ordering
    public getFunctionBody(src: string): string {
        let i = src.indexOf('{');
        let l = src.lastIndexOf('}');
        if (i > 0 && l > 0) {
            let v = src.substring(i + 1, l);
            return v.trim();
        }
        return src.trim();
    }
    // tslint:disable-next-line:member-ordering
    public getFunction(src: string): Function {
        src = FunctionUtil.removeComments ( src )

        let args = FunctionGenerator.getArguments(src);
        let src_value = this.getFunctionBody(src);
        let hs = this.ts.getScript();
        if (hs == null) {
            hs = '';
        }
        // console.log(" creating the function with arguments : " + args);
        // let fg = new Function('lion_engine', ...args, hs + '\n\n' + src_value);
        let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        let fg = new AsyncFunction('lion_engine', ...args, hs + '\n\n' + src_value);

        return fg;
    }
    // tslint:disable-next-line:member-ordering
    public static getArguments(src): any[] {
        if ( !src ){
            console.trace ();
            
        }
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
    public static getParamNames(func) {
        var fnStr = func.toString().replace(FunctionGenerator.STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(FunctionGenerator.ARGUMENT_NAMES);
        if (result === null)
            result = [];
        return result;
    }
    // tslint:disable-next-line:member-ordering
    public getFunctionEN(src: string): Function {
        src = FunctionUtil.removeComments ( src )

        let args = FunctionGenerator.getArguments(src);
        let src_value = this.getFunctionBody(src);
        var hs = IoniScriptEngine.helm_script.getHELMScript();
        if (hs == null) {
            hs = '';
        }
        hs ='';

        let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        let fg = new AsyncFunction('lion_engine', ...args, hs + '\n\n' + src_value);

        // let fg = new Function('lion_engine', ...args, hs + '\n\n' + src_value);
        return fg;
    }

    public getLionEngineScript(rule: string) {
        var hs = FunctionUtil.removeComments(IoniScriptEngine.helm_script.getHELMScript());
        if (hs == null || hs.length == 0)
            hs = '';
        let solr_lib = IoniScriptEngine.helm_script.getSolrLib();
        if (solr_lib == null || solr_lib.length == 0) {
            solr_lib = '';
        }
        let mod_rule = this.preProcessScriptForFunctionalParams(rule, null);
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


    parseArguments(p: string): any[] {
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


    public preProcessScriptForFunctionalParams(hr: string, args): string {

        hr = hr.trim();
        if (/^function\b/.test(hr)) {
            let sti = hr.indexOf('{');
            let stf = hr.lastIndexOf('}');
            let hs = hr.substring(sti + 1, stf);
            let af = hr.indexOf('function') + 8;
            let argumentsLine = hr.substring(af, sti);
            let function_arguments = this.parseArguments(argumentsLine);
            console.log(' parsed arguments : ' + function_arguments);
            if (function_arguments == null || function_arguments.length == 0 || args != null) {
                let t = ''
                t += '\n';
                let script = t + hs + "";
                console.log(" script \n " + script);
                return script;
            } else {
                let inputitems = '';
                for (let a of function_arguments) {
                    inputitems += '"' + a + '",';
                }
                inputitems = inputitems.substring(0, inputitems.length - 1);
                debugger;
                let t = 'showInputParamItem ( "input", [' + inputitems + ']).then ( res => {';
                t += '\n';
                for (let a of function_arguments) {
                    t += 'let ' + a + '=res["' + a + '"];\n';
                }
                let script = t + hs + "});";
                console.log(" script \n " + script);
                return script;
            }
        }
        return hr;

    }




}

