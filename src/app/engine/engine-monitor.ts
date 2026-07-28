
export class EngineMonitor {
    listenerFunction
    plisteners = [];
    olisteners = [];
    objectUpdateFunction;

    constructor(listenerFunction, objectUpdateFunction) {
        this.listenerFunction = listenerFunction;
        this.objectUpdateFunction = objectUpdateFunction;
    }

    addProgressListener(progressListner) {
        this.plisteners.push(progressListner);
    }

     update(object) {
        if (this.objectUpdateFunction){
            this.objectUpdateFunction(object)
        }
    }

    setRawOutput(line) {
        for (let r of this.olisteners) {
            r(line);
        }
    }
    public setProgress(progress) {
        if (this.plisteners.length > 0) {
            for (let p of this.plisteners) {
                p(progress)
            }
        }

    }
    public setMSG(msg) {
        if (this.listenerFunction) {
            this.listenerFunction(msg);
        }
    }
}