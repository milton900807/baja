import { nFile } from "./trail-script";

export interface FunctionScriptManager {
    POSTFile(file, url: string): Promise<string>;
    getScript(): string;
    setScript(script: string);
    // promptForInput(action: UserInputListener, inputType: string): void;
    showFile(lf: nFile);
    createObject (object_type, config ): Promise<any>;
    log(line: string);
    getIonisFS(): any;
    setIonisFS(jsonObject: any);
    logBlock(id: string): any;
    updateProgress(progress: string): void;

    save(path: string, name: string, type: string, rule: string, input: string, callback: any);

    resetLog();
    displayApp(title, url): Promise<string>; // returns a guid for retreiving any operational data. 
    // displayFeature(title, url): Promise<string>; // returns a guid for retreiving any operational data. 
    showInputItem(title): Promise<string>;
    showInputTextArea(title): Promise<string>;
    showInputParamPair(title, label: string[]): Promise<{}>;
    displaySVG(url, json): Promise<string>;
    showOKPanel(msg: string): Promise<string>;
    updateUI(ui_item_name, item_field, item_value);
    showWidget(js): Promise<{}>;
    setUIObject(obj: any, objectlabel: string, objtype: string);
}

export class UserInputListener {
    setValue(key: string, val: string) { };
}