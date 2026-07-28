import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input, ComponentFactoryResolver, ViewRef, ViewContainerRef, EmbeddedViewRef
} from "@angular/core";
import { NaviDirective, INode } from './navi.directive';
import { AuthService } from './auth.service';


@Component({
    selector: 'link-node',
    templateUrl: './link-node.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class LinkNodeComponent implements OnInit, INode {
    selectFunctions: any[];
    ichildren: any[];
    name: string = '';
    selected = false;
    edit = false;
    editLink = false;
    nodes: INode[] = [];
    link = '';
    onedriveID = '';
    parentID = '';
    linkType = 'lnk'


    @ViewChild(NaviDirective, { static: false })
    private compService: NaviDirective;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private auth: AuthService) {
    }
    setChildren(children: any): void {
        this.ichildren = children;
    }
    editName() {
        this.edit = true;
    }
    closeEdit() {
        this.edit = false;

    }
    select() {
        this.selected = true;
    }
    deselect() {
        this.selected = false;
    }

    openEditLink() {
        this.editLink = true;
    }
    closeEditLink() {
        this.editLink = false;
    }

    ngOnInit(): void {
    }
    getNodes(): INode[] {
        return this.nodes;
    }
    async refresh() {
        return null;
    }

    addNode(node) {
        // this.loadWidget(node);
    }
    ngAfterViewInit() {
        if (this.ichildren != null && this.ichildren.length > 0)
            for (let c of this.ichildren) {
                this.addNode(c);
            }
    }


    newNode() {
        // let title = ''
        // let pubcomp = SimpleNodeComponent;
        // let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        // let viewContainerRef = this.compService.viewContainerRef;
        // let componentRef = viewContainerRef.createComponent(componentFactory);
        // let inode = (<SimpleNodeComponent>componentRef.instance);
        // inode.name = title;
        // inode.edit = true;
        // this.nodes.push ( inode );
    }

    printTree() {
        for (let n of this.nodes) {
            console.log("NODE : " + n.name);
            n.printTree();
        }
    }

    apply(value: string) {
    }
    // this is the new way and more general way for loading a widget 
    loadWidget(node) {
        // let title = node['name']
        // let pubcomp = SimpleNodeComponent;
        // let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        // let viewContainerRef = this.compService.viewContainerRef;
        // let componentRef = viewContainerRef.createComponent(componentFactory);
        // let inode = (<INode>componentRef.instance);
        // inode.name = title;
        // inode.setChildren(node['children'])
        // this.nodes.push ( inode );
    }

    openSharePointLink() {

    }

    click(item) {

    }


    async save() {

        let fixname = this.name.trim();
        fixname = fixname.replace(/:/g, ' ')
        fixname = fixname.replace(/\)/g, ' ')
        fixname = fixname.replace(/\(/g, ' ')
        fixname = fixname.replace(/'/g, ' ')
        fixname = fixname.replace(/"/g, ' ')
        fixname = fixname.replace(/\//g, ' ')

        let expid_index = fixname.indexOf(' ');
        let expid = fixname.substring(0, expid_index);
        // C:\Users\jmilton\Ionis\ELN - 19-0517
        // let linkobj = await exec('msgraph/create-lnk-file', "C:\\Users\\jmilton\\Ionis\\ELN\ -\ 19-0517\\")
        let client = await this.auth.getClient();
        let me = await client.api('/me').get();
        let username = me['userPrincipalName']
        let usern = username.substring(0, username.indexOf('@'));
        let local = "C:\\Users\\" + usern + "\\Ionis\\ELN\ -\ " + usern + '\\' + expid + '\\';
        let remote = 'https://isispharm.sharepoint.com/sites/ELN/' + usern + '/' + expid;

        let linkstr = local;
        let linkfilepath = '/me/drive/items/' + this.parentID + ':/' + fixname + '.lnk' + ':/content';
        let linkobj = create_lnk_blob(linkstr);

        if (this.linkType === 'url') {
            linkfilepath = '/me/drive/items/' + this.parentID + ':/' + fixname + '.url' + ':/content';
            linkobj = createURLFile(remote);

        }
        // let remote = 'https://isispharm.sharepoint.com/sites/ELN/Jmilton/19-0505'
        // let remote = '%ProgramFiles%\Google\Chrome\Application\chrome.exe" -new-window https://isispharm.sharepoint.com/sites/ELN/' + usern + '/' + expid;
        client.api(linkfilepath).put(linkobj).then(response => {
            this.onedriveID = response['id']
        });
        // const folderitem = {
        //     name: fixname.trim(),
        //     folder: {},
        //     '@microsoft.graph.conflictBehavior': "replace"
        // };
        // let path = '/me/drive/items/' + this.parentID + '/children'
        // let res = await client.api(path).post(folderitem);
        // this.onedriveID = res['id']
        // console.log(JSON.stringify(res));
    }
}

function createURLFile(url) {
    return new Blob(['[{000214A0-0000-0000-C000-000000000046}]\n' +
        'Prop3=19,11\n' +
        '[InternetShortcut]\n' +
        'IDList=\n' +
        'URL=' + url + '\n'], {
        type: 'text/plain'
    })
}



function create_lnk_blob(lnk_target) {
    function hex_to_arr(s) {
        var result = Array(s.length / 2);
        for (var i = 0; i < result.length; ++i) {
            result[i] = +('0x' + s.substr(2 * i, 2));
        }
        return result;
    }

    function str_to_arr(s) {
        var result = Array(s.length);
        for (var i = 0; i < s.length; ++i) {
            var c = s.charCodeAt(i);
            if (c >= 128) {
                throw Error("Only ASCII paths are suppored :-(");
            }
            result[i] = c;
        }
        return result;
    }

    function convert_CLSID_to_DATA(s) {
        var idx = [[6, 2], [4, 2], [2, 2], [0, 2],
        [11, 2], [9, 2], [16, 2], [14, 2],
        [19, 4], [24, 12]];
        var ss = idx.map(function (ii) {
            return s.substr(ii[0], ii[1]);
        });
        return hex_to_arr(ss.join(''));
    }

    function gen_IDLIST(s) {
        var item_size = (0x10000 + s.length + 2).toString(16).substr(1);
        return hex_to_arr(item_size.replace(/(..)(..)/, '$2$1')).concat(s);
    }

    var HeaderSize = [0x4c, 0x00, 0x00, 0x00],
        LinkCLSID = convert_CLSID_to_DATA("00021401-0000-0000-c000-000000000046"),
        LinkFlags = [0x01, 0x01, 0x00, 0x00], // HasLinkTargetIDList ForceNoLinkInfo

        FileAttributes_Directory = [0x10, 0x00, 0x00, 0x00],
        FileAttributes_File = [0x20, 0x00, 0x00, 0x00],

        CreationTime = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        AccessTime = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        WriteTime = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],

        FileSize = [0x00, 0x00, 0x00, 0x00],
        IconIndex = [0x00, 0x00, 0x00, 0x00],
        ShowCommand = [0x01, 0x00, 0x00, 0x00], //SW_SHOWNORMAL
        Hotkey = [0x00, 0x00], // No Hotkey
        Reserved = [0x00, 0x00],
        Reserved2 = [0x00, 0x00, 0x00, 0x00],
        Reserved3 = [0x00, 0x00, 0x00, 0x00],
        TerminalID = [0x00, 0x00],

        CLSID_Computer = convert_CLSID_to_DATA("20d04fe0-3aea-1069-a2d8-08002b30309d"),
        CLSID_Network = convert_CLSID_to_DATA("208d2c60-3aea-1069-a2d7-08002b30309d"),

        PREFIX_LOCAL_ROOT = [0x2f],
        PREFIX_FOLDER = [0x31, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        PREFIX_FILE = [0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        PREFIX_NETWORK_ROOT = [0xc3, 0x01, 0x81],
        PREFIX_NETWORK_PRINTER = [0xc3, 0x02, 0xc1],

        END_OF_STRING = [0x00];

    if (/.*\\+$/.test(lnk_target)) {
        lnk_target = lnk_target.replace(/\\+$/g, '');
        var target_is_folder = true;
    }

    var prefix_root, item_data, target_root, target_leaf;
    if (lnk_target.substr(0, 2) === '\\\\') {
        prefix_root = PREFIX_NETWORK_ROOT;
        item_data = [0x1f, 0x58].concat(CLSID_Network);
        target_root = lnk_target.subtr(lnk_target.lastIndexOf('\\'));
        if (/\\\\.*\\.*/.test(lnk_target)) {
            target_leaf = lnk_target.substr(lnk_target.lastIndexOf('\\') + 1);
        }
        if (target_root === '\\') {
            target_root = lnk_target;
        }
    } else {
        prefix_root = PREFIX_LOCAL_ROOT;
        item_data = [0x1f, 0x50].concat(CLSID_Computer);
        target_root = lnk_target.replace(/\\.*$/, '\\');
        if (/.*\\.*/.test(lnk_target)) {
            target_leaf = lnk_target.replace(/^.*?\\/, '');
        }
    }

    var prefix_of_target, file_attributes;
    if (!target_is_folder) {
        prefix_of_target = PREFIX_FILE;
        file_attributes = FileAttributes_File;
    } else {
        prefix_of_target = PREFIX_FOLDER;
        file_attributes = FileAttributes_Directory;
    }

    target_root = str_to_arr(target_root);
    for (var i = 1; i <= 21; ++i) {
        target_root.push(0);
    }

    var id_list_items = gen_IDLIST(item_data);
    id_list_items = id_list_items.concat(
        gen_IDLIST(prefix_root.concat(target_root, END_OF_STRING)));
    if (target_leaf) {
        target_leaf = str_to_arr(target_leaf);
        id_list_items = id_list_items.concat(
            gen_IDLIST(prefix_of_target.concat(target_leaf, END_OF_STRING)));
    }
    var id_list = gen_IDLIST(id_list_items);

    var data = [].concat(HeaderSize,
        LinkCLSID,
        LinkFlags,
        file_attributes,
        CreationTime,
        AccessTime,
        WriteTime,
        FileSize,
        IconIndex,
        ShowCommand,
        Hotkey,
        Reserved,
        Reserved2,
        Reserved3,
        id_list,
        TerminalID);
    return new Blob([new Uint8Array(data)], { type: 'application/x-ms-shortcut' });
}

// var blob = create_lnk_blob('C:\\Windows\\System32\\Calc.exe');