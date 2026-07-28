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
import { map } from 'rxjs/operators';


@Component({
  selector: 'market-file-browser',
  templateUrl: './fb-market.component.html',
  styleUrls: ['./fb-market.component.css']
})
export class MarketFBComponent implements OnInit, PubComponent {


  public fileElements: Observable<FileElement[]>;
  pathFunction: any;

  constructor(public fileService: FileService) { }
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
  cmdFunction;
  height = `100%`;
  width = '100%';
  backgroundcolor = 'white';
  folderAddedPath;
  filterFunction;
  folderDialogFunction;
  folderPath;
  fileclickFunction;
  rootPath;
  keyDrive = 'default';
  canAddFolder = false;
  canWriteListenerFunction;
  columns = 5;
  showSearch = true;
  server = null;
  filetype = '*';
  user = null;





  cmd(c) {
    if (this.cmdFunction) {
      this.cmdFunction(c)
    }
  }


  init(ionEngine: IoniScriptManager): string {
    if (this.data['height'] != null)
      this.height = this.data['height']
    if (this.data['root']) {
      this.rootPath = this.data['root']
    }

    if (this.data['filetype'])
      this.filetype = this.data['filetype']
    if (this.data['fileType'])
      this.filetype = this.data['fileType']


    if (this.data['drive'] != null) {
      this.keyDrive = this.data['drive']
    }
    if (this.data['user'] != null) {
      this.user = this.data['user']
    }
    if (this.data['server'] != null) {
      this.server = this.data['server']
    }
    if (this.data['showSearch'] != null) {
      this.showSearch = this.data['showSearch']
    }
    if (this.data['ionfunction.openfile']) {
      this.listenerFunction = LionEngine.ionfunctions[this.data['ionfunction.openfile']]
    }

    if (this.data['ionfunction.cmd']) {
      this.cmdFunction = LionEngine.ionfunctions[this.data['ionfunction.cmd']]
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


  async refresh() {
    // priva  te map = new Map<string, FileElement>();
    this.fileService.map = new Map<string, FileElement>();

    this.load(this.currentRoot);

    if (this.rootPath) {
      let host = window['env']['apiUrl'];
      if (this.server) {
        host = this.server
      }



      // console.log(" loading... " + host + '/get-folder?path=' + this.rootPath)
      // alert ( ' this.keydrive ' + this.keyDrive + " this.rootpath " + this.rootPath )
      let rf = await FunctionUtil.GETJSON(host + '/get-folder?key=' + this.keyDrive + '&path=' + this.rootPath, this.user)
      this.root = rf;
      // if (rf['path'].startsWith('/')) {
      //   rf['path'] = rf['path'].substring(1)
      // }
      // 
      // let rootE = { id: this.root.id, name: rf['name'], path: rf['path'], isFolder: true, parent: 'root' };
      // this.fileService.add(rootE);
      await this.load(this.currentRoot)
      this.updateFileElementQuery();
    }
  }

  async ngOnInit() {
    if (this.rootPath) {
      let host = window['env']['apiUrl'];
      if (this.server) {
        host = this.server
      }
      let rf = await FunctionUtil.GETJSON(host + '/get-folder?key=' + this.keyDrive + '&path=' + this.rootPath, this.user)
      this.root = rf;
      let rootE = { id: this.root.id, name: rf['name'], path: rf['path'], isFolder: true, parent: 'root' };
      // this.fileService.add(rootE);
      await this.load(rootE)
      this.updateFileElementQuery();
    }
  }


  async load(parentNode) {
    this.currentRoot = parentNode;
    let host = window['env']['apiUrl'];
    if (this.server) {
      host = this.server
    }

    // if (!parentNode) {
    //   parentNode = {
    //     path: '/'
    //   }
    // }

    let fol = await FunctionUtil.GETJSON(host + '/get-nodes?key=' + this.keyDrive + '&path=' + parentNode.path, this.user)
    let nodes = fol['values'];
    if (nodes && nodes.length > 0) {
      for (let n of nodes) {
        if (this.filterFunction && this.filterFunction(n)) {
          let pnode = await this.fileService.add(n);
        } else {
          let pnode = await this.fileService.add(n);

        }
      }
    }
    this.updateFileElementQuery();
  }
  async addFolder(folder: { name: string, _id: string }) {
  }
  removeElement(element: FileElement) {
    this.fileService.delete(element.id);
    this.updateFileElementQuery();
  }
  async openFile(file) {
    alert(' test ' + file)
  }

  navigateToFolderNamed(name: string) {
    if (!name || name.length <= 0) {
      this.navigateUp()
    } else {
      let sub = this.fileElements.subscribe((fileElementArray) => {
        for (let fileElement of fileElementArray) {
          if (fileElement.isFolder && fileElement.name === name) {
            this.navigateToFolder(fileElement);
            this.canNavigateUp = true;
          }
        }
      })
      sub.unsubscribe();
    }
  }
  async navigatePath(path) {
    const folders = path.split('/').filter(folder => folder !== '');
    for (const folder of folders) {
      await this.navigateToFolderNamed(folder);
      await this.refresh();

    }
  }

  fileClick(element: FileElement) {
    this.fileSelected.emit(element);
    this.currentPathE.emit(this.currentPath)
    // console.log(" file : " + JSON.stringify(element));
    // console.log(" file : " + this.currentPath);
    if (this.pathFunction)
      this.pathFunction(element);
    if (!element.isFolder && this.fileclickFunction)
      this.fileclickFunction(element);
  }

  async navigateToFolder(element: FileElement) {
    console.log(" EVENT : " + JSON.stringify(element));
    this.currentRoot = element;
    await this.updateFileElementQuery();
    if (this.currentPath === null || this.currentPath == undefined || this.currentPath.length <= 0) {
      this.currentPath = '/' + element.name
    } else
      this.currentPath = this.pushToPath(this.currentPath + '/', element.name);
    if (this.currentPath.endsWith('/')) {
      this.currentPath = this.currentPath.substring(0, this.currentPath.length - 1)
    }
    if (this.pathFunction) {
      this.pathFunction(this.currentPath)
    }
    this.load(element)
    this.currentPathE.emit(this.currentPath)
    this.canNavigateUp = true;
    if (!element.id) {
      return;
    }
  }

  async navigateUp() {
    let path = this.currentRoot.path;

    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1)
    }
    const segments = path.split('/');
    const nodes = segments.filter(segment => segment.length > 0);
    if (nodes.length === 1) {
      this.canNavigateUp == false;

    } else {
      path = path.substring(0, path.lastIndexOf('/') + 1)
    }
    this.rootPath = path;
    // alert ( this.rootPath );
    this.currentPath = this.currentPath.substring(0, this.currentPath.lastIndexOf('/'))
    let host = window['env']['apiUrl'];
    if (this.server) {
      host = this.server
    }
    let rf = await FunctionUtil.GETJSON(host + '/get-folder?key=' + this.keyDrive + '&path=' + this.rootPath, this.user)
    this.root = rf;
    if (rf['name'].startsWith('/')) {
      rf['name'] = rf['name'].substring(1)
    }


    if (this.pathFunction) {
      this.pathFunction(this.currentPath)
    }

    let rootE = { id: this.root.id, name: rf['name'], path: rf['path'], isFolder: true, parent: 'root' };
    // this.fileService.add(rootE);
    await this.load(rootE)
    this.updateFileElementQuery();





  }
  private decorateElements(elements: FileElement[]): FileElement[] {
    return elements.map(el => ({
      ...el,
      isPublishFolder: el.isFolder && el.name === 'Publish',
      icon: el.isFolder && el.name === 'Publish' ? 'attach_money' : null
    }));
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

    this.fileElements = this.fileService
      .queryInFolder(this.currentRoot ? this.currentRoot.id : 'root')
      .pipe(
        map(elements => this.decorateElements(elements))
      );

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
