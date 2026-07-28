import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, ComponentFactoryResolver, ViewRef, ViewContainerRef, EmbeddedViewRef
} from "@angular/core";
import { NaviDirective, INode } from './navi.directive';
import { LinkNodeComponent } from './link-node.component';
import { AuthService } from './auth.service';
import { LionEngine } from '../engine/io-engine';


@Component({
    selector: 'simple-node',
    templateUrl: './simple-node.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SimpleNodeComponent implements OnInit, INode {
    ichildren: any[];
    name: string = '---';
    selected = false;
    edit = false;
    nodes: INode[] = [];
    link = '';
    onedriveID = '';
    parentID = '';
    canEditName = false;
    canEditNewNode = false;
    canEditLink = false;
    canAddFolders = false;
    selectFunctions = [];
    expand = true;
    showExpandContract = true;
    @ViewChild(NaviDirective, { static: false })
    private compService: NaviDirective;
    @ViewChild('modal_message', { static: false })
    private modal_message;




    constructor(   private componentFactoryResolver: ComponentFactoryResolver,
        private auth: AuthService ) {
    }


    showConfirmationDialog() {
    }

    async commitConfirmationDialog(value) {
    }
    async expandContract() {
        this.expand = (!this.expand);
        if (this.expand) {
            let client = await this.auth.getClient();
            this.refresh(client);
        }
    }


    addSelectFunction(sel) {
        this.selectFunctions.push(sel)
    }
    notifyListeners() {
        for (let l of this.selectFunctions) {
            LionEngine.ionfunctions[l](this);
        }
    }

    setChildren(children: any): void {
        this.ichildren = children;
    }
    editName() {
        this.edit = true;
    }
    closeEdit() {
        this.edit = false;
        this.save().then(async (r) => {
            let client = await this.auth.getClient();
            this.refresh(client);
        })
    }
    select() {
        this.selected = true;
    }
    deselect() {
        this.selected = false;
    }

    async refresh(client) {
        if (this.onedriveID != null) {
            if (this.nodes != null && this.nodes.length > 0) {
                this.nodes = [];
            }
            try {
                let vi = await client.api('/me/drive/items/' + this.onedriveID + '/children').get();
                let values = vi['value']
                for (let v of values) {
                    let vname = v['name']
                    let vid = v['id']

                    console.log(" value : " + JSON.stringify(v));


                    let inv = {
                        name: vname,
                        onedriveID: vid
                    }
                    this.loadWidget(inv);
                }
                for (let na of this.nodes) {
                    await na.refresh(client);
                }
            } catch (exception) {
                console.log(" exception : " + exception);
            }

        }
    }

    ngOnInit(): void {

    }

    getNodes(): INode[] {
        return this.nodes;
    }

    addNode(node) {
        this.loadWidget(node);
    }
    ngAfterViewInit() {
        if (this.ichildren != null && this.ichildren.length > 0)
            for (let c of this.ichildren) {
                this.addNode(c);
            }
    }

    newNode() {
        let title = ''
        let pubcomp = SimpleNodeComponent;
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        let viewContainerRef = this.compService.viewContainerRef;
        viewContainerRef.clear();
        let componentRef = viewContainerRef.createComponent(componentFactory);
        let inode = (<SimpleNodeComponent>componentRef.instance);
        inode.name = title;
        inode.edit = true;
        inode.parentID = this.onedriveID;
        inode.selectFunctions = this.selectFunctions;
        inode.canAddFolders = this.canAddFolders;
        this.nodes.push(inode);
    }
    newLinkNode() {
        let title = ''
        let pubcomp = LinkNodeComponent;
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        let viewContainerRef = this.compService.viewContainerRef;
        let componentRef = viewContainerRef.createComponent(componentFactory);
        let inode = (<LinkNodeComponent>componentRef.instance);
        inode.name = title;
        inode.parentID = this.onedriveID;
        inode.edit = true;
        this.nodes.push(inode);
    }
    addLinkNode(title, linkType) {
        let pubcomp = LinkNodeComponent;
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        let viewContainerRef = this.compService.viewContainerRef;
        let componentRef = viewContainerRef.createComponent(componentFactory);
        let inode = (<LinkNodeComponent>componentRef.instance);
        inode.name = title;
        // console.log(" parent id : " + this.onedriveID);
        inode.parentID = this.onedriveID;
        inode.edit = false;
        inode.linkType = linkType;
        this.nodes.push(inode);
        inode.save();
    }

    cancel() {
    }
    delete() {
        this.showConfirmationDialog();

    }

    async save() {
        const folderitem = {
            name: this.name,
            folder: {},
            '@microsoft.graph.conflictBehavior': "replace"
        };
        let path = '/me/drive/items/' + this.parentID + '/children'
        let client = await this.auth.getClient();
        let res = await client.api(path).post(folderitem);
        this.onedriveID = res['id']
        console.log(JSON.stringify(res));
        return res;

    }

    printTree() {
        for (let n of this.nodes) {
            n.printTree();
        }
    }

    apply(value: string) {
    }
    // this is the new way and more general way for loading a widget 
    loadWidget(node) {
        let title = node['name']
        let pubcomp;

        if (title != null && title.endsWith('.lnk') || title.endsWith('url')) {
            pubcomp = LinkNodeComponent;
        } else {
            pubcomp = SimpleNodeComponent;
        }

        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        let viewContainerRef = this.compService.viewContainerRef;
        let componentRef = viewContainerRef.createComponent(componentFactory);
        let inode = (<SimpleNodeComponent>componentRef.instance);
        inode.name = title;
        inode.canAddFolders = true;
        inode.parentID = this.onedriveID;
        inode.selectFunctions = this.selectFunctions;
        inode.onedriveID = node.onedriveID;
        inode.setChildren(node['children'])
        this.nodes.push(inode);

    }
}