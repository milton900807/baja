import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffers } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine } from '../engine/io-engine';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';

@Component({
  selector: 'folder-list',
  templateUrl: './folder-list-view.component.html',
  styleUrls: ['./folder-list-view.component.css'],
})
export class FolderListComponent implements OnInit, PubComponent {
  @ViewChild('meditor', {static:false}) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  mode = 'exp';
  folderIcon = '/assets/img/exp-icon.png';
  folder_list = [];
  selected_folder;
  selected_folder_children;
  loading = false;
  @ViewChild(
    'folder_contents_panel', {static:false}
  ) folder_contents_panel

  group_id = null;
  loadTitles = null;


  constructor(
    private msgraph: AuthService,
    private d: DomSanitizer,
    private cd: ChangeDetectorRef,
    private _iterableDiffers: IterableDiffers) {
  }
  select(m) {
    m.function();
  }
  showMetaData() {
  }
  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  setMode(mode) {
    this.mode = mode;
    if (this.mode == 'edit-summary') {
    }

  }

  load(doc) {
    console.log(" loading the document " + JSON.stringify(doc));
  }
  tag(doc) {

  }
  open(doc) {
    let url = doc['webUrl']
    window.open(url, "_blank");
  }
  download(doc) {
    let download = doc['@microsoft.graph.downloadUrl']
    window.open(download, "_blank");
  }
  launch(url) {
    window.open(url, "_blank");
  }

  init(): string {
    // 'data': { 'list': explist, 'group-id': TEST_ELN_GROUP_ID }
    this.folder_list = this.data['folders']
    this.group_id = this.data['group-id']
    return '';
  }
  ngOnInit(): void {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    this.msgraph.createClient({ arg0: { 'scope': ['User.Read', 'AllSites.Read'] } }).then(client => {
      if (!client) {
        console.log(' iot appear that the client object is null ')
      }
      this.loadTitles = new Promise((resolve, reject) => {
        for (let l of this.folder_list) {
          (new Promise((resolve, reject) => {
            client.api('/groups/' + this.group_id + '/drive/items/' + l.id + '/children').get().then(res => {
              let v = res['value'];
              for (let file of v) {
                if (file['name'].endsWith('-metadata.xlsx')) {
                  console.log(" file name " + file['name'])
                  client.api('/groups/' + this.group_id +
                    '/drive/items/' + file['id'] + '/workbook/worksheets/info/cell(row=0,column=1)').get().then(res_title => {
                      // client.api('/me/drive/items/' + file['id'] + '/workbook/worksheets/info/cell(row=0,column=0)').get().then(res_title => {
                      // resolve(file['name'])
                      // console.log(" ------------  " + JSON.stringify(res_title));
                      resolve(res_title['text'][0][0]);
                    });
                }
              }
            });
          }).then(r => l.title = r))
        }
        resolve('hello');
      })
    });
  }
  show(d) {
    this.mode = 'show-folder-contents';
    this.selected_folder = d;
  }
  folder_contents_panelx;
  list(d) {
    this.selected_folder_children = [];
    this.loading = true;
    this.selected_folder = d;
    this.loadSelectedFolder();
    if (this.folder_contents_panel) {
      // this.folder_contents_panelx = this.ngmodal.open(this.folder_contents_panel);
    }
  }
  close() {
    if (this.folder_contents_panelx) {
      this.folder_contents_panelx.close();
    }
  }
  format(datetime) {
    return datetime.split('T')[0]
  }
  getTitleFromFunction(key) {
    return LionEngine.ionfunctions[key]();
  }
  loadSelectedFolder() {
    let f = this.selected_folder['webUrl']
    this.msgraph.createClient({ arg0: { 'scope': ['User.Read', 'AllSites.Read'] } }).then(client => {
      if (!client) {
        console.log(' iot appear that the client object is null ')
      }
      client.api('/groups/' + this.group_id + '/drive/items/' + this.selected_folder['id'] + '/children').get().then(res => {
        // console.log(" res values " + JSON.stringify(res));
        if (res != null) {
          this.selected_folder_children = res['value'];
          this.loading = false;
        }
      })
    })
  }
}


