import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers } from '@angular/core';
import { PubComponent } from './pub-component';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from './pub-component-listener';


@Component({
  selector: 'ionworks-menu',
  templateUrl: './ionworks-menu.component.html',
  styleUrls: ['./ionworks-menu.component.css'],
})
export class IonWorksMenuComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  code: string = '';
  editorOptions = { language: 'gmap', automaticLayout: true, theme: 'gmapTheme' };
  iterableDiffer: IterableDiffer<{}>;
  menulist = []
  experiment_id = undefined;
  display: SafeResourceUrl = null;
  displayHTML;
  background = "lightGray";

  menuLogo = 'assets/img/logo.png'

  @Input()
  driveID = null;
  experiments = null;
  recent_files = null;
  label_field = null;
  url_field = null;
  mode = 'exp';
  // file drop stuff. 
  @Output() drop: EventEmitter<FileDrop> = new EventEmitter();
  @Output() status: EventEmitter<String> = new EventEmitter();
  dropFunction;
  @Input("operation")
  operation: string = "drop-only";
  @Input()
  config = null;


  constructor(private msgraph: AuthService, private d: DomSanitizer, private cd: ChangeDetectorRef, private _iterableDiffers: IterableDiffers) {
    this.iterableDiffer = this._iterableDiffers.find([]).create(null);


  }
  select(m) {
    LionEngine.ionfunctions[m['onclick']]();
  }
  showMetaData() {
    this.display = this.d.bypassSecurityTrustUrl(this.experiment_id);
  }
  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  setMode(mode) {
    this.mode = mode;
    if (this.mode == 'edit-summary') {
      this.launch(this.experiment_id);
    }

  }
  getsidenavstyle () {
    // padding: 0;
    // border: none;
    // margin: 0;
    // height: 100%; /* 100% Full-height */
    // width: 138px; /* 0 width - change this with JavaScript */
    // /* position: fixed;   */
    // z-index: 1; /* Stay on top */
    // background-color:  #d4d4d4; /* Black*/
    // overflow-x: hidden; /* Disable horizontal scroll */
    // padding-top: 0px; /* Place content 60px from the top */
    // transition: 0.5s; /* 
    return 'background:'+ this.background + '; height: "900px"; cursor: "pointer"';
  }
  getstyle () {
    return 'background:' + this.background + '; height: "900px"; ';
  }
  launch(url) {
    window.open(url, "_blank");
  }
  append(str) {
    this.code += str;
  }
  // [{"gene":"NOC2L","chromosome":"1","start":946660,"end":946669,"strand":"-","gene_id":"ENSG00000188976","feature_type":"protein_coding"},{"gene":"ISG15","chromosome":"1","start":1006383,"end":1006374,"strand":"+","gene_id":"ENSG00000187608","feature_type":"protein_coding"},
  appendLog(gmap_result) {
    
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
    let turl = this.data['startURL'];
    this.driveID = this.data['driveID'];
    if (turl != null) {
      this.experiment_id = turl;
    } else {
    }
    return '';
  }
  ngOnInit(): void {



    if (this.config != null && this.config['items'] != null) {
      let keys = this.config['items'];
      for (let i of keys) {
        this.menulist.push(i);
      }
    }

    if (this.config != null) {
      this.driveID = this.config['driveID']
    }
    if (this.config != null && this.config['menuLogo']!=null) {
      this.menuLogo = this.config['menuLogo']
    }
    if (this.config != null && this.config['background']!=null) {
      this.background = this.config['background']
    }


    if (this.resolveFunction) {
      console.log(" resolving the function ")
      this.resolveFunction(this);
    }
    this.display = this.d.bypassSecurityTrustUrl(this.experiment_id);
    let dHTML = '<iframe src="' + this.experiment_id + '" onload="" width="850px" height="600px" frameborder="0">____</iframe>';
    this.displayHTML = this.d.bypassSecurityTrustHtml(dHTML);
    // this.listDocsInELN();

  }

  public loadRecentFiles() {
    this.setMode('recent-documents');
    this.msgraph.getClient().then(client => {
      // console.log(" Drive ID " + this.driveID);
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
      client.api('/drives/' + this.driveID + '/root/children').get(res => {
        this.experiments = res['value'];
      })
    }
    );
  }


  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
    }
  }



  openFile(file) {
    let fd: FileDrop = new FileDrop();
    fd.filename = file.name;

    let reader = new FileReader();
    reader.onload = () => {
      var text = reader.result;
      // console.log(' texdte : ' + text);
      let lines = text;//.split('\n');

      // fd.lines = lines;
      this.drop.emit(fd);

      // for (let line of lines) {
      //   line = line.trim();
      //   console.log(" line  " + line);
      //   if (line.startsWith("ChemAssign")) {

      //     // let oligoNucleotide = new OligoNucleotide ( cols[0], )


      //   }
      // let cols = line.split('\t');
      // for (let i = 0; i < cols.length; i++) {
      //   console.log("----" + i + " \t " + cols[i]);
      // }

      // console.log ( " l " + line );
      // }
    }
    // reader.readAsText(file);
  }


  openFiles(files) {
    if (files != null) {
      for (var index = 0; index < files.length; index++) {
        let reader = new FileReader();
        reader.onload = () => {
          // this 'text' is the content of the file
          var text = reader.result;
        }
        reader.readAsText(files[index]);
      };
    }
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

