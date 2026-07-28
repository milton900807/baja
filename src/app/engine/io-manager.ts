import { IoniScriptFile } from "./lion-file";

export interface IoniScriptManager extends ProcessListener {
    // clearLog();
    POSTFile(file, url: string): Promise<string>;
    getScript(): string;
    setScript(script: string);
    showFile(lf: IoniScriptFile);
    log(line: string);
    getIonisFS(): any;
    getAccessToken () : string;
    setIonisFS(jsonObject: any);
    getAccessToken () : string;
    createObject(object_type, object_config): Promise<any>;
    updateProgress(progress: string): void;
    save(path: string, name: string, type: string, rule: string, input: string, callback : any );
    resetLog();
    removeComponent ( index );
    getComponentCount(): Number;
    voiceToText(listener);
    micOff ();
    displayApp(title, url): Promise<string>; // returns a guid for retreiving any operational data. 
    // displayFeature(title, url): Promise<string>; // returns a guid for retreiving any operational data. 
    showInputItem(title): Promise<{}>;
    showInputTextArea(title): Promise<{}>;
    showMenu(menuconfig): Promise<{}>;
    clearMenu(): Promise<{}>;
    // showNavbar(navbarconfig): Promise<{}>;
    showFooter(menuconfig): Promise<{}>;
    showInputParamPair(title, label: string[]): Promise<{}>;
    displaySVG(url, json): Promise<string>;
    showOKPanel(msg: string): Promise<string>;
    updateUI(ui_item_name, item_field, item_value);
    showWidget(js): Promise<{}>;
    clearWeak(): Promise<{}>;
    showModal(js, width:number, height:number): Promise<{}>;
    isModal (): boolean;
    hideAllModal(): void;
    setUIObject(obj: any, objectlabel: string, objtype: string);
}

export class RunStatus {
    id: string;
    status: string;
    msg: string;
}
export interface ProcessListener {
    statusChanged(st: RunStatus): void;
}

