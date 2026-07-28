import { IoniScriptManager } from "../engine/io-manager";
import { PubComponentListener } from "./pub-component-listener";

export class PubComponent {
    data: any;
    listener: PubComponentListener;
    resolveFunction;
    title: string;
    init(ionEngine: IoniScriptManager ): string {
        return null;
    }
}
// export interface IonEngine {
//     evalExec(exec_string);  
// }