import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine, IoniScriptEngine } from '../engine/io-engine';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { PubComponent } from '../published-lionscript/pub-component';

@Component({
  selector: 'folder-chooser',
  templateUrl: './folder-chooser.component.html',
  styleUrls: ['./folder-chooser.component.css'],
})
export class FolderChooserComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = {};
  initData = {};
  code: string = '';
  iterableDiffer: IterableDiffer<{}>;
  driveID = null;
  label_field = null;
  menuItems = [];
  folderIcon = '/assets/img/exp-icon.png';
  @ViewChild(
    'folder_contents_panel', { static: false }
  ) folder_contents_panel
  @Input()
  path = '';
  type = 'msgraph';
  fileButton = null;
  dtfunctions:any;
  dtactions = [];
  dataTypeActions = {};
  folders = [];
  directory:string = '';
  driveId = null;
  folderActionMenuItems = [];
  tagFunction = null;
  opening: boolean = false;
  dropFunction;
  isSigned = false;
  @Input("operation")
  operation: string = "drop-only";
  experimentPath = null;
  displayHTML;
  selectedFile = null;
  selectedFileVersions = null;
  selectedSignedFile = null;
  folder_details: any;
  id = '';
  loading = true;


  constructor(private msgraph: AuthService,
    private d: DomSanitizer, private cd: ChangeDetectorRef,
    private _iterableDiffers: IterableDiffers, engine: IoniScriptEngine) {
    this.iterableDiffer = this._iterableDiffers.find([]).create();

  }

  goToSharepointFolder() {
    if (this.folder_details != null)
      window.open(this.folder_details['webUrl'], '_blank');
  }

  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  click(functionid) {
    if (typeof functionid == 'string')
      LionEngine.ionfunctions[functionid]();
    else if (typeof functionid == 'function') {
      functionid();
    }
  }

  async refresh() {
    return new Promise(async (resolve, reject) => {
      this.selectedSignedFile = null;
      await this.loadfiles();
      let temp = this.selectedFile;
      this.selectedFile = null;
      setTimeout(() => {
        this.selectedFile = temp;
        return resolve ({});
      }, 5000)
    });
  }


  fileDownload() {

  }
  // (fileDownload)="fileDownload()"



  setMode(mode) {
  }
  getSelectedFileVersionObject() {
    if (this.selectedFileVersions == null) {
      return 'not there yet'
    }
    else {
      return JSON.stringify(this.selectedFileVersions)
    }

  }
  launch(url) {
    window.open(url, "_blank");
  }
  append(str) {
    this.code += str;
  }
  ngDoCheck() {
  }
  reset() {
  }
  setValue(str) {
    this.code = str;
  }
  init(): string {
    this.driveID = this.data['driveID'];
    return '';
  }
  ngOnInit(): void {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    this.path = this.data['path']

    console.log(" path : " + this.path);
    if (this.data['id'] != null) {
      this.id = this.data['id']
    }
    this.msgraph.getClient().then(async (client) => {
      this.folder_details = await client.api(this.path).get();
      await this.loadfiles();
    });

  }
  getFolderName() {
    if (this.directory != null) {
      let ind = this.directory.lastIndexOf('/');
      if (ind < 0)
        return this.directory
      let f = this.directory.substring(ind + 1).trim();
      return f;
    }
    return null;
  }



  async loadfiles() {
    this.loading = true;
    let client = await this.msgraph.getClient();
    let res = await client.api(this.path + '/children').get();

    if (res != null) {
      let v = res['value']
      this.folders = [];

      for (let i of v) {
        if (i['folder']) {
          this.folders.push(i)
        }
      }
    }
    this.loading = false;
  }



  async addDataTypeAttribute(files: any): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      let t = [];
      for (let f of files) {
        let nf = f;
        for (let dtf of this.dtfunctions) {
          let datatypeattribute = await dtf(f)
          if (datatypeattribute != null) {
            nf['datatype'] = datatypeattribute;
            this.dataTypeActions[datatypeattribute] = this.dtactions[datatypeattribute];
          }
        }
        t.push(nf);
      }
      resolve(t);
    })
  }

  download() {
    this.msgraph.getClient().then(async (client) => {
      let signed_doc = this.selectedFile.name;
      signed_doc = signed_doc.substring(0, signed_doc.lastIndexOf('.'))
      let tp = `/drives/${this.selectedFile.parentReference.driveId}/items/${this.selectedFile.id}`;
      console.log(' path ' + tp)
      let doc = await client.api(tp).get();
      window.open(doc['webUrl'])
    });
  }
  public buildFileList(res) {
    return res;
  }
  public fileOver(event) {
    console.log(event);
  }
  public fileLeave(event) {
    console.log(event);
  }



}
export class MenuItem {
  name = '';
}
export class FileDrop {
  filename: string = "unknown";
  lines: string[];
  relativePath: string;
};

