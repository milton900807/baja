import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { LionEngine } from '../engine/io-engine';
import { IoniScriptManager } from '../engine/io-manager';
import { FunctionUtil } from '../functions/function-util';
import { AuthService } from '../onedrive/auth.service';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { FileElement } from './model/element';
import { FileService } from './service/file.service';



@Component({
  selector: 'folder-browser',
  templateUrl: './folder-browser.component.html',
  styleUrls: ['./folder-browser.component.css']
})
export class FileBrowserComponent implements OnInit, PubComponent {
  public fileElements: Observable<FileElement[]>;
  pathFunction: any;

  constructor(public fileService: FileService, private msgraph: AuthService) { }
  data: any;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  path = '';
  @Input()
  mode = '';
  root;
  rootElement;
  @Output()
  fileSelected = new EventEmitter<FileElement>();
  @Output()
  currentPathE = new EventEmitter<String>();
  currentRoot: FileElement;
  currentPath: string;
  canNavigateUp = false;
  listenerFunction;
  library = null;
  height = `100%`;
  width = '100%';
  backgroundcolor = 'white';
  folderAddedPath;
  filterFunction;
  folderDialogFunction;
  folderPath;
  fileclickFunction;
  rootPath;
  canAddFolder = false;
  canWriteListenerFunction;
  columns = 5;


  init(ionEngine: IoniScriptManager): string {
    if (this.data['path']) {
      this.path = this.data['path']
    }

    if (this.path && this.path.startsWith('/drives')) {
      let libendindex = this.path.indexOf('/', 8);
      let bus = this.path.substring(7, libendindex)
      this.library = bus.trim();
    }


    if (this.data['height'] != null)
      this.height = this.data['height']

    if (this.data['folderpath'] != null)
      this.folderPath = this.data['folderpath']

    if (this.data['root']) {
      this.rootPath = this.data['root']
    }
    if (this.data['ionfunction.openfile']) {
      this.listenerFunction = LionEngine.ionfunctions[this.data['ionfunction.openfile']]
    }
    if (this.data['ionfunction.canWriteToFolder']) {
      this.canWriteListenerFunction = LionEngine.ionfunctions[this.data['ionfunction.canWriteToFolder']]
    }
    if (this.data['ionfunction.fileClick']) {
      this.fileclickFunction = LionEngine.ionfunctions[this.data['ionfunction.fileClick']]
    }
    if (this.data['ionfunction.path']) {
      this.pathFunction = LionEngine.ionfunctions[this.data['ionfunction.path']]
    }
    if (this.data["ionfunction.folderadded"]) {
      // ionfunction.folderadded
      this.folderAddedPath = LionEngine.ionfunctions[this.data['ionfunction.folderadded']]
    }
    if (this.data["filterFunction"]) {
      this.filterFunction = LionEngine.ionfunctions[this.data['filterFunction']]
    }
    if (this.data["columns"]) {
      this.columns = this.data['columns']
    }
    if (this.data['folderDialogFunction']) {
      this.folderDialogFunction = LionEngine.ionfunctions[this.data['folderDialogFunction']]
    }

    return '';
  }
  async ngOnInit() {
    if (this.rootPath) {
      let client = await this.msgraph.getClient();
      this.root = await client.api(this.rootPath).get();
      this.rootElement = this.fileService.add({ id: this.root.id, name: this.root['name'], isFolder: true, parent: 'root' });
      await this.load(this.root, this.rootElement)
      this.updateFileElementQuery();
      // this.navigateToFolder(this.rootElement)
      let p = await client.api(this.path).get();

      try {
        let foldername = '.t'
        let new_exp_dir = {
          "name": foldername,
          "folder": {
          },
          "@microsoft.graph.conflictBehavior": "replace"
        }
        let folder = await client.api(`/drives/${this.root.parentReference.driveId}/items/${this.root.id}/children`)
          .post(new_exp_dir)
        this.canAddFolder = true;
        let folder_del = await client.api(`/drives/${this.root.parentReference.driveId}/items/${folder.id}`).delete();

        if (this.canWriteListenerFunction)
          this.canWriteListenerFunction(this.canAddFolder)



      } catch (exception) {

        this.canAddFolder = false;
        if (this.canWriteListenerFunction)
          this.canWriteListenerFunction(this.canAddFolder)


      }

      let pElement = this.fileService.add({ id: p.id, name: p['name'], isFolder: true, parent: p.id });
      // await this.load(p, pElement)
      this.updateFileElementQuery();
      this.navigateToFolder(pElement)
      // this.currentPath = this.root['name'];
    } else {
      let client = await this.msgraph.getClient();
      this.root = await client.api(this.path).get();

      try {
        let foldername = 't'
        let new_exp_dir = {
          "name": foldername,
          "folder": {
          },
          "@microsoft.graph.conflictBehavior": "replace"
        }
        let folder = await client.api(`/drives/${this.root.parentReference.driveId}/items/${this.root.id}/children`)
          .post(new_exp_dir);
        let folder_del = await client.api(`/drives/${this.root.parentReference.driveId}/items/${folder.id}`).delete();
        this.canAddFolder = true;
      } catch (exception) {
        this.canAddFolder = false;
      }


      if (this.canWriteListenerFunction)
        this.canWriteListenerFunction(this.canAddFolder)

      this.rootElement = this.fileService.add({ id: this.root.id, name: this.root['name'], isFolder: true, parent: 'root' });
      await this.load(this.root, this.rootElement)
      this.updateFileElementQuery();
      this.navigateToFolder(this.rootElement)
    }
  }





  async load(parent, parentNode) {
    let client = await this.msgraph.getClient();
    if (!parent || !parent['id']) {
    }
    // console.log(" ------------ loading ---------------------------- ")
    let child_path = `/me/drive/items/${parent['id']}/children`
    if (this.library) {
      child_path = `/drives/${this.library}/items/${parent['id']}/children`
    }
    let fol = await client.api(child_path).get();
    let nodes = fol['value'];
    for (let n of nodes) {
      if (this.filterFunction && this.filterFunction(n)) {
        if (n['folder']) {
          let pnode = await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: true, parent: parentNode.id });
        } else {
          await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: false, parent: parentNode.id });
        }
      } else {
        if (n['folder']) {
          let pnode = await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: true, parent: parentNode.id });
        } else {
          await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: false, parent: parentNode.id });
        }
      }
    }


    // let c = this.currentPath.substring(0, this.currentPath.length - 1)
    let fol1 = await client.api(`/drives/${this.library}/items/${this.root.id}`).get();
    this.folderPath = `/drives${this.library}/items/${this.root.id}`



    if (this.pathFunction)
      this.pathFunction(parent, nodes);

    this.updateFileElementQuery();
  }

  async addFolder(folder: { name: string, _id: string }) {
    if (this.folderAddedPath) {

      if (folder.name != null && folder.name.length > 0) {
        folder.name = folder.name.trim();
      }

      this.folderAddedPath(folder);
      this.canNavigateUp = true;
      let client = await this.msgraph.getClient();
      if (this.currentPath != null && this.currentPath.length > 0) {
        this.currentPath = this.currentPath.trim();



        let c = this.currentPath.substring(0, this.currentPath.length - 1)
        let fol1 = await client.api(`/drives/${this.library}/root:/${c}`).get();






        // let fol = await client.api(`/drives${this.library}/items/${fol1.id}/children`).get();
        // let parentNode = await client.api(`/drives/${this.library}/items/${fol1.parentReference.id}`).get();
        // debugger;
        // let nodes = fol['value'];
        // for (let n of nodes) {
        //   if (n['folder']) {
        //     let pnode = await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: true, parent: fol.id });
        //   } else {
        //     await this.fileService.add({ id: n['id'], "name": n['name'], isFolder: false, parent: fol.id });
        //   }
        // }
        // this.currentPath = this.pushToPath(this.currentPath, parentNode.name);
        this.currentPathE.emit(this.currentPath)
        this.canNavigateUp = true;
        this.load(fol1, fol1)
        // this.fileElements = this.fileService.update(this.currentRoot ? this.currentRoot.id : 'root');

        // this.updateFileElementQuery();
        // this.currentPathE.emit(this.currentPath)
        // this.canNavigateUp = true;
        // console.log('navigate element ' + JSON.stringify(element));
        // if (!element.id) {
        //   return;
        // }
        // let client = await this.msgraph.getClient();
        // let navigation_path = `/me/drive/items/${element.id}`;
        // if (this.library) {
        //   navigation_path = `/drives${this.library}/items/${element.id}`;
        // }
        // let fol = await client.api(navigation_path).get();
        // await this.load(fol, element);

      } else {

        this.folderPath = this.folderPath.trim();

        console.log(" folder path " + this.folderPath)
        let fol1 = await client.api(this.folderPath).get();
        this.canNavigateUp = true;
        this.load(fol1, fol1)
      }

    }
  }

  removeElement(element: FileElement) {
    // console.log(" removing element " + element.id);
    this.fileService.delete(element.id);
    this.updateFileElementQuery();
  }




  /**
   * 
   * @param file  @deprecated
   */
  async openFile(file) {
    let client = await this.msgraph.getClient();
    this.root = await client.api(this.path).get();
    let open_path = `/me/drive/items/${file.element.id}`;
    if (this.library) {
      open_path = `/drives/${this.library}/items/${file.element.id}`
    }
    let fol = await client.api(open_path).get();
    let url = fol['@microsoft.graph.downloadUrl']
    // let json = await FunctionUtil.GETJSON(url)
    let txt = await FunctionUtil.GETXT(url);
    if (this.listenerFunction) {
      this.listenerFunction(file, txt);
    }
    console.log(" file : " + JSON.stringify(txt));
  }


  fileClick(element: FileElement) {
    this.fileSelected.emit(element);
    this.currentPathE.emit(this.currentPath)
    // console.log(" file : " + JSON.stringify(element));
    // console.log(" file : " + this.currentPath);
    if (this.pathFunction)
      this.pathFunction(element);
    if (!element.isFolder && this.fileclickFunction)
      this.fileclickFunction(this.library, this.currentPath, element);
  }

  async navigateToFolder(element: FileElement) {
    // console.log(" EVENT : " + JSON.stringify(element));
    this.currentRoot = element;
    await this.updateFileElementQuery();
    this.currentPath = this.pushToPath(this.currentPath, element.name);
    this.currentPathE.emit(this.currentPath)
    this.canNavigateUp = true;
    // console.log('navigate element ' + JSON.stringify(element));
    if (!element.id) {
      return;
    }
    let client = await this.msgraph.getClient();
    let navigation_path = `/me/drive/items/${element.id}`;
    if (this.library) {
      navigation_path = `/drives${this.library}/items/${element.id}`;
    }
    let fol = await client.api(navigation_path).get();
    await this.load(fol, element);
  }

  async navigateUp() {


    if (!this.currentRoot) {
      let client = await this.msgraph.getClient();
      this.root = await client.api(this.path).get();
      this.rootElement = this.fileService.add({ id: this.root.id, name: this.root['name'], isFolder: true, parent: 'root' });
      this.currentRoot = this.rootElement;
      await this.load(this.root, this.rootElement)
      this.updateFileElementQuery();
      this.navigateToFolder(this.rootElement)
    }

    if (this.currentRoot && this.currentRoot.parent === 'root') {
      this.currentRoot = null;
      this.canNavigateUp = false;
      this.updateFileElementQuery();
    } else {
      this.currentRoot = this.fileService.get(this.currentRoot.parent);
      this.updateFileElementQuery();
    }
    this.currentPath = this.popFromPath(this.currentPath);
    this.currentPathE.emit(this.currentPath)
    let client = await this.msgraph.getClient();
    let navigation_path = `/me/drive/items/${this.currentRoot.id}`;
    if (this.library) {
      navigation_path = `/drives${this.library}/items/${this.currentRoot.id}`;
    }
    let fol = await client.api(navigation_path).get();
    await this.load(fol, this.currentRoot);
  }

  moveElement(event: { element: FileElement; moveTo: FileElement }) {
    this.fileService.update(event.element.id, { parent: event.moveTo.id });
    this.updateFileElementQuery();
  }

  renameElement(element: FileElement) {
    console.log(element);
    this.fileService.update(element.id, { name: element.name });
    this.updateFileElementQuery();
  }

  async updateFileElementQuery() {
    this.fileElements = this.fileService.queryInFolder(this.currentRoot ? this.currentRoot.id : 'root');
    // this.fileElements.sort((a, b) => a.firstname.localeCompare(b.firstname))
  }

  pushToPath(path: string, folderName: string) {
    if (path && path.length > 0) {
      path = path.trim();
      folderName = folderName.trim();
      let p = path ? path : '';
      p += `${folderName}/`;
      return p;
    } else {
      return `${folderName}/`;
    }
  }

  popFromPath(path: string) {
    let p = path ? path : '';
    let split = p.split('/');
    split.splice(split.length - 2, 1);
    p = split.join('/');
    return p;
  }
}
