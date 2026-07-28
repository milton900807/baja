import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers } from '@angular/core';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine, IoniScriptEngine } from '../engine/io-engine';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { RemoveSystemFiles } from './file-gallery-remove-system-files.pipe'


@Component({
  selector: 'eln',
  templateUrl: './eln.component.html',
  styleUrls: ['./eln.component.css'],
})
export class ELNComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = {};
  initData = {};
  code: string = '';
  editorOptions = { language: 'gmap', automaticLayout: true, theme: 'gmapTheme' };
  iterableDiffer: IterableDiffer<{}>;
  experiment_id = undefined;
  display: SafeResourceUrl = null;
  displayHTML;
  driveID = null;
  // constructor ( private d:DomSanitizer, private http:Http,private route: ActivatedRoute){
  experiments = null;
  recent_files = null;
  label_field = null;
  url_field = null;
  menuItems = [];
  mode = 'exp';
  experimentID = '-';
  experimentTypes: string[] = [];
  mainDoc = null;
  documentSigningConfig = null;
  readonly = false;

  // file drop stuff. 
  @Output() drop: EventEmitter<FileDrop> = new EventEmitter();
  @Output() status: EventEmitter<String> = new EventEmitter();
  dropFunction;
  @Input("operation")
  operation: string = "drop-only";
  experimentPath = null;
  filegallery = {};
  ismobile = false;


  constructor(private msgraph: AuthService,
    private d: DomSanitizer, private cd: ChangeDetectorRef,
    private _iterableDiffers: IterableDiffers, engine: IoniScriptEngine) {
    this.iterableDiffer = this._iterableDiffers.find([]).create(null);

  }

  get experimentTypesDisplay() {
    return this.experimentTypes.join(', ');
  }

  showMetaData() {
    this.display = this.d.bypassSecurityTrustUrl(this.experiment_id);
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
  setMode(mode) {
    this.mode = mode;
    if (this.mode == 'edit-summary') {
      this.launch(this.experiment_id);
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
  onInit(editor) {
    this.fun = editor._actions['editor.action.formatDocument'];
    let waitv = setTimeout(() => {
      this.fun.run();
      clearTimeout(waitv);
    }, 500);
  }

  getExpURI() {
  }

  init(): string {
    let turl = this.data['mainDocURL'];
    this.driveID = this.data['driveID'];
    if (turl != null) {
      this.experiment_id = turl;
    } else {
    }
    return '';
  }
  ngOnInit(): void {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    this.experimentPath = this.data['experimentPath']
    this.filegallery['path'] = this.experimentPath;

    this.filegallery['dataMenuActions'] = this.data['dataMenuActions']

    if (this.data['readonly'] != null) {
      this.readonly = this.data['readonly']
    }

    this.filegallery['readonly'] = this.readonly;



    if (this.data['folderMenuItems'])
      this.filegallery['folderActionMenuItems'] = this.data['folderMenuItems']




    if (this.data['mobile'] != null) {
      this.ismobile = this.data['mobile']
    }
    if (this.data['experimentID'] != null)
      this.experimentID = this.data['experimentID']

    if (this.data['experimentTypes']) {
      this.experimentTypes = this.data['experimentTypes'];
    }
    if (this.data['tag-document'] != null) {
      this.filegallery['tag-document'] = this.data['tag-document']
    }
    if (this.data['dataTypeFunctions'] != null) {
      this.filegallery['dataTypeFunctions'] = this.data['dataTypeFunctions']
    }
    if (this.data['dataTypeActions'] != null) {
      this.filegallery['dataTypeActions'] = this.data['dataTypeActions']
    }

    // we added the following to enable edit file in local app functionality 
    this.msgraph.getClient().then(async (client) => {
      // now we need to get the site url path: 
      // client.api('https://graph.microsoft.com/v1.0/drives/b!Hyg40p8000y6v600k453H8wDmLKt7qtEg6Wq_TDBFXuvCuJC7GrJT5SAq3kOwXob/root').get().then(r => {
      let path = this.filegallery['path']
      if (path.endsWith('/children'))
        path = path.substring(0, path.indexOf('/children'))
      client.api('https://graph.microsoft.com/v1.0/' + path + '').get().then(r => {
        this.filegallery['driveUrl'] = r['webUrl']
      })


      if (this.data['documentToSignPath'] != null) {
        let documentToSignPath = this.data['documentToSignPath']
        this.mainDoc = await client.api(documentToSignPath).get();
      }

      if (this.data['documentSigningConfig'] != null) {
        this.documentSigningConfig = this.data['documentSigningConfig']
      }

    });




    console.log(this.experiment_id);
    this.display = this.d.bypassSecurityTrustUrl(this.experiment_id);
    let dHTML = '<iframe src="' + this.experiment_id + '" width="650px" height="800px" frameborder="0" AllowFraming  allowfullscreen>____</iframe>';

    if ( this.ismobile ) {
      dHTML = '<iframe src="' + this.experiment_id + '" width="350px" height="800px" frameborder="0" AllowFraming  allowfullscreen>____</iframe>';
    }

    // let dHTML = this.experiment_id;
    this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);
    this.listDocsInELN();
    let waitv = setTimeout(() => {
      this.showEditor = true;
      this.initData = this.data;
      this.menuItems = this.data['menuItems']
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv);
    }, 4000);

    // this.loadRecentFiles();



  }

  public loadRecentFiles() {
    this.setMode('recent-documents');
    this.msgraph.getClient().then(client => {
      client.api('https://graph.microsoft.com/v1.0/me/drive/recent').get((err, res, rawResponse) => {
        // console.log(" msgraph " + JSON.stringify(res));
        console.log(" error " + err);
        console.log(" raw " + rawResponse);
        console.log(" msgraph " + JSON.stringify(res));
        if (res != null)
          this.recent_files = this.buildFileList(res['value']);
      })
    }
    );
  }

  public buildFileList(res) {
    return res;
  }


  public listDocsInELN() {


    this.msgraph.getClient().then(client => {

      // client.api('https://graph.microsoft.com/v1.0/drives/' + this.driveID + '/root/children').get(res => {
      //   this.experiments = res['value'];
      // })
    }
    );
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

