import { Directive, ViewContainerRef, Input, ComponentFactoryResolver } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
    selector: '[navi]',
})
export class NaviDirective {
    @Input() input_value: string;
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Directive({
    selector: '[folders]',
})
export class FoldersDirective {
    @Input() input_value: string;
    constructor(public viewContainerRef: ViewContainerRef) { }
}



export class INode {
    ichildren = []
    name = '';
    nodes: INode[] = [];
    link = '';
    parentID = '';
    onedriveID = '';
    selectFunctions = [];


    setChildren(children) {
        this.ichildren = children;
    }
    getNodes(): INode[] {
        return this.nodes;
    }
    printTree(): void {
        for (let n of this.nodes) {
            console.log(n.name);
            n.printTree();
        }
    }
    async refresh(client) {
        if (this.onedriveID != null) {
            try {
                let vi = await client.api('/me/drive/items/' + this.onedriveID + '/children').get();
                let values = vi['value']
                for (let v of values) {
                    let vname = v['name']
                    let vid = v['id']
                    let inv: INode = new INode();
                    inv.name = vname;
                    inv.selectFunctions = this.selectFunctions;
                    inv.onedriveID = vid;
                    this.nodes.push(inv);
                }
            } catch (exception) {
                console.log(" exception : " + exception);
            }

        }else {
            console.log ( " one drive has not been found : " + this.onedriveID );
        }
    }
}

