import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers } from '@angular/core';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine, IoniScriptEngine } from '../engine/io-engine';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';

@Component({
  selector: 'ms-folder',
  templateUrl: './ms-folder.component.html',
  styleUrls: ['./ms-folder.component.css'],
})
export class MSFolderComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = {};
  initData = {};
  code: string = '';
  editorOptions = { language: 'gmap', automaticLayout: true, theme: 'gmapTheme' };
  iterableDiffer: IterableDiffer<{}>;
  driveID = null;
  label_field = null;
  menuItems = [];
  folderIcon = '/assets/img/exp-icon.png';
  @ViewChild(
    'folder_contents_panel', { static: false }
  ) folder_contents_panel
  @Input()
  path = null;
  type = 'msgraph';
  fileButton = null;
  dtfunctions = [];
  dtactions = [];
  dataTypeActions = {};
  files = [];
  directory = null;
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
  signed_Docs = null;
  @Output() signedDocs: EventEmitter<[]> = new EventEmitter();
  showDocumentSigning = false;
  documentSigningConfig;
  folder_details: any;
  showVersions = false;
  id = '';
  loading = true;



  //   @microsoft.graph.downloadUrl: "https://arcturustherapeutics.sharepoint.com/sites/ARCT-ELN/_layouts/15/download.aspx?UniqueId=695e4b42-a64e-4ec7-9d32-8f6411484595&Translate=false&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvYXJjdHVydXN0aGVyYXBldXRpY3Muc2hhcmVwb2ludC5jb21AYmRlMjA0OTQtODIxMy00ZWIxLTk1Y2MtOWVjMWYzM2U1MDc3IiwiaXNzIjoiMDAwMDAwMDMtMDAwMC0wZmYxLWNlMDAtMDAwMDAwMDAwMDAwIiwibmJmIjoiMTYxNTMwODUxMyIsImV4cCI6IjE2MTUzMTIxMTMiLCJlbmRwb2ludHVybCI6InZ2ekp4QklRbHREM0pOVmRHREoxZUNNRTBMMEVtbWpRMzYvY1Q1eDk0NG89IiwiZW5kcG9pbnR1cmxMZW5ndGgiOiIxNDYiLCJpc2xvb3BiYWNrIjoiVHJ1ZSIsImNpZCI6IlkyUm1PRFk1TUdFdE9UUTFZeTAxT1RGaExUTmpaV1V0TW1FNVlUQTRZMk5qTkRRMCIsInZlciI6Imhhc2hlZHByb29mdG9rZW4iLCJzaXRlaWQiOiJOekV6TWprNU4yVXRZV0UzWVMwME5qTTBMV0poWVRJdFpEYzBPVGRsT1RnNVkyRTUiLCJhcHBfZGlzcGxheW5hbWUiOiJlbG4iLCJnaXZlbl9uYW1lIjoiSmVmZiIsImZhbWlseV9uYW1lIjoiTWlsdG9uIiwiYWMiOiJsfG18aCIsImFwcGlkIjoiNDUyNWM0OTUtNjA5My00YTZlLWE0MGUtOGYwOGE0MzdjY2RhIiwidGlkIjoiYmRlMjA0OTQtODIxMy00ZWIxLTk1Y2MtOWVjMWYzM2U1MDc3IiwidXBuIjoiamVmZm1AYXJjdHVydXNyeC5jb20iLCJwdWlkIjoiMTAwMzIwMDBGQzE1QzFFNyIsImNhY2hla2V5IjoiMGguZnxtZW1iZXJzaGlwfDEwMDMyMDAwZmMxNWMxZTdAbGl2ZS5jb20iLCJzY3AiOiJteWZpbGVzLnJlYWQgYWxsZmlsZXMucmVhZCBteWZpbGVzLndyaXRlIGFsbGZpbGVzLndyaXRlIGFsbHNpdGVzLnJlYWQgYWxsc2l0ZXMud3JpdGUgYWxscHJvZmlsZXMucmVhZCIsInR0IjoiMiIsInVzZVBlcnNpc3RlbnRDb29raWUiOm51bGx9.bkdTNmxGOFZsTDBMVkpmN0pzbmxUN2R1QldiNnF3VklUelM2aEJYQWRsTT0&ApiVersion=2.0"
  // cTag: ""c:{695E4B42-A64E-4EC7-9D32-8F6411484595},4""
  // createdBy: {application: {…}, user: {…}}
  // createdDateTime: "2021-03-09T15:26:14Z"
  // eTag: ""{695E4B42-A64E-4EC7-9D32-8F6411484595},4""
  // file: {mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", hashes: {…}}
  // fileSystemInfo: {createdDateTime: "2021-03-09T15:26:14Z", lastModifiedDateTime: "2021-03-09T15:26:33Z"}
  // id: "01QGFOKD2CJNPGSTVGY5HJ2MUPMQIUQRMV"
  // lastModifiedBy: {application: {…}, user: {…}}
  // lastModifiedDateTime: "2021-03-09T15:26:33Z"
  // name: "Lab Worker Vaccine Memo (002).docx"
  // parentReference:
  // driveId: "b!fpkycXqqNEa6otdJfpicqcMtyDfDHEJKoiQ7woqS1NqFOVh9Nrc5RYU-ZRbk6vB3"
  // driveType: "documentLibrary"
  // id: "01QGFOKD2HKYFHKF4MKFFYC2Z7ZXL5HBAB"
  // path: "/drives/b!fpkycXqqNEa6otdJfpicqcMtyDfDHEJKoiQ7woqS1NqFOVh9Nrc5RYU-ZRbk6vB3/root:/ARCT-DOC55"
  // __proto__: Object
  // dd = { "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#drives('b%21fpkycXqqNEa6otdJfpicqcMtyDfDHEJKoiQ7woqS1NqFOVh9Nrc5RYU-ZRbk6vB3')/items('01QGFOKD2CJNPGSTVGY5HJ2MUPMQIUQRMV')/versions",
  //  "value": [{ "id": "1.0", "lastModifiedDateTime": "2021-03-09T15:26:33Z", "size": 69949,"lastModifiedBy": { "user": { "email": "jeffm@arcturusrx.com", "id": "c75ccba3-40f9-4ac1-aace-b4223fa0560e", "displayName": "Jeff Milton" } } }] }

  constructor(private msgraph: AuthService,
    private d: DomSanitizer, private cd: ChangeDetectorRef,
    private _iterableDiffers: IterableDiffers, engine: IoniScriptEngine) {
    this.iterableDiffer = this._iterableDiffers.find([]).create(null);

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
    this.selectedSignedFile = null;
    await this.loadfiles();
    let temp = this.selectedFile;
    this.selectedFile = null;
    setTimeout(() => {
      this.selectedFile = temp;
    }, 1000)

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

    if (this.data['documentSigning'] != null) {
      this.showDocumentSigning = true;
      this.documentSigningConfig = this.data['documentSigning']
    }
    if (this.data['showVersions'] != null) {
      this.showVersions = false;
    }
    if (this.data['id'] != null) {
      this.id = this.data['id']
    }


    // this.msgraph.getClient().then(client => {
    //   if (!this.path.endsWith('/children'))
    //     this.path = this.path.substring(0, this.path.indexOf('/children'))
    //   client.api('https://graph.microsoft.com/v1.0/' + this.path + '').get().then(r => {
    //   })
    // });

    this.msgraph.getClient().then(async (client) => {
      this.folder_details = await client.api(this.path).get();
      let value = await this.hasSignedFolder()
      if (value)
        this.isSigned = true;
      await this.loadfiles();
      let waitv = setTimeout(() => {
        this.initData = this.data;
        this.menuItems = this.data['menuItems']
        clearTimeout(waitv);
      }, 1000);
      let iv = setInterval(async () => {
        if (this.selectedFile == null) {
          await this.loadfiles();
        } else {
          return clearInterval(iv)
        }
      }, 1500);
      setTimeout(() => {
        clearInterval(iv)
      }, 100000)


      // let check_for_signed = setInterval(() => {
      //   //   let doc = startw + '/_layouts/15/Doc.aspx?sourcedoc={' + t +
      //   //   '}&amp;action=embedview&amp;wdStartOn=1'
      //   // let dHTML = '<iframe src="' + doc + '" width="650px" height="800px" frameborder="0" AllowFraming  allowfullscreen>____</iframe>';
      //   // console.log(" start : " + doc);
      //   // this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);

      // }, 15000)
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


  findSelectedfile() {
    for (let file of this.files) {
      if (file['folder'] == null) {
        this.selectedFile = file;
        console.log(' selected file' + this.selectedFile)
      }
    }

  }
  async getSelectedFileVersions() {
    if (this.selectedFile == null) {
      this.findSelectedfile();

    }
    let client = await this.msgraph.getClient();
    let res = await client.api('/drives/' + this.selectedFile.parentReference.driveId + '/items/' + this.selectedFile.id + '/versions').get();
    this.selectedFileVersions = res['value'];
  }


  hasSignedFolder() {
    let sdocs = [];
    return new Promise(async (resolve, reject) => {
      this.msgraph.getClient().then(async (client) => {
        let ch = await client.api(this.path + '/children').get();
        let vdocs = ch['value']
        for (let i of vdocs) {
          if (i.name === '.signed') {
            this.isSigned = true;

          }
        }
        if (this.isSigned) {
          client.api(this.path + ':/.signed').get().then(async (res) => {
            if (res != null) {
              let signed_docs = await client.api(this.path + ':/.signed:/children').get();
              let vdocs = signed_docs['value']
              for (let i of vdocs) {
                sdocs.push(i);
              }
              this.signed_Docs = sdocs;
              this.signedDocs.emit(this.signed_Docs);
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false)
        }
      });

    })
  }


  async loadfiles() {
    let client = await this.msgraph.getClient();
    let res = await client.api(this.path + '/children').get();
    if (res != null) {
      this.files = (res['value']);
      if (this.selectedFile === null) {
        this.findSelectedfile();
        await this.getSelectedFileVersions();
        if (this.selectedFile != null) {
          let fname = this.selectedFile.name;
          if (fname.indexOf('.') > 0) {
            fname = this.selectedFile.name.substring(0, this.selectedFile.name.lastIndexOf('.'))
          }
          if (this.isSigned) {
            let res = await client.api(this.selectedFile.parentReference.path + '/.signed:/children').get();
            let list = res.value;
            let index = 0
            let recent;
            for (let l of list) {
              if (index === 0)
                recent = l
              else {
                let c = new Date(l['lastModifiedDateTime'])
                let b = new Date(recent['lastModifiedDateTime'])
                if (c > b) {
                  recent = l;
                }
              }
              index++;
            }
            let driveId = recent.parentReference.driveId;
            let itemId = recent.id;
            this.isSigned = true;
            this.selectedSignedFile = recent;
            let signed_selected = await client.api(`/drives/${driveId}/items/${itemId}`).get();
            let etg = signed_selected['eTag'];
            etg = etg.trim();
            let start = etg.indexOf('{')
            let end = etg.indexOf('}')
            if (start > 0) {

              let downloadURL = signed_selected['@microsoft.graph.downloadUrl']
              let temp = downloadURL.indexOf('/_layouts');
              let startw = downloadURL.substring(0, temp);
              let t = etg.substring(start + 1, end);
              if (t.startsWith('"'))
                t = t.substring(1)
              let doc = startw + '/_layouts/15/WopiFrame.aspx?sourcedoc={' + t +
                '}&amp;action=embedview&amp;wdStartOn=1'
              let dHTML = '<iframe src="' + doc + '" width="650px" height="800px" frameborder="0" AllowFraming  allowfullscreen>____</iframe>';
              console.log(" start : " + doc);
              // this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);
              this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);
            }
          } else {
            console.log(" ----------------------------------------------------------- ")
            let etg = this.selectedFile['eTag'];
            etg = etg.trim();
            let start = etg.indexOf('{')
            let end = etg.indexOf('}')
            if (start > 0) {
              let downloadURL = this.selectedFile['@microsoft.graph.downloadUrl']
              let temp = downloadURL.indexOf('/_layouts');
              let startw = downloadURL.substring(0, temp);
              let t = etg.substring(start + 1, end);
              if (t.startsWith('"'))
                t = t.substring(1)





              let doc = startw + '/_layouts/15/Doc.aspx?sourcedoc={' + t +
                '}&amp;action=embedview&amp;wdStartOn=1'
              let dHTML = '<iframe src="' + doc + '" width="650px" height="800px" frameborder="0" AllowFraming  allowfullscreen></iframe>';
              console.log(" start : " + doc);
              this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);

            }
            if (this.files != null && this.files.length > 0) {
              this.directory = this.files[0].parentReference.path
              this.driveId = this.files[0].parentReference.driveId
              this.files = await this.addDataTypeAttribute(this.files);
            }
          }
        }









        if (!this.isSigned) {

        }
      }
    }
    this.loading = false;
  }
  async addDataTypeAttribute(files): Promise<any[]> {
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
  downloadSigned() {
    this.msgraph.getClient().then(async (client) => {
      let signed_doc = this.selectedSignedFile.name;
      signed_doc = signed_doc.substring(0, signed_doc.lastIndexOf('.'))
      let tp = `/drives/${this.selectedSignedFile.parentReference.driveId}/items/${this.selectedSignedFile.id}`;
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

