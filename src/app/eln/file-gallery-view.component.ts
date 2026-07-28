import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers, ChangeDetectionStrategy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { PubComponent } from '../published-lionscript/pub-component';

@Component({
  selector: 'file-gallery',
  templateUrl: './file-gallery-view.component.html',
  styleUrls: [],
})
export class FileGalleryComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  initData = '';
  folderIcon = '/assets/img/exp-icon.png';
  selected_folder;
  selected_folder_children;
  loading = false;
  @ViewChild(
    'folder_contents_panel', { static: false }
  ) folder_contents_panel
  @Input()
  path = null;
  type = 'msgraph';
  @ViewChild('file_folder_view', { static: false }) screen: ElementRef;
  @ViewChild('confirm_delete', { static: false }) confirm_delete: ElementRef;
  @ViewChild('confirm_archive', { static: false }) confirm_archive: ElementRef;
  @ViewChild('msg_dialog', { static: false }) msg_dialog: ElementRef;

  fileButton = null;
  showFolderButton = true;
  // data type functions are used to determine what the file data type is. 
  dtfunctions = [];
  dtactions = [];
  dataTypeActions = {};
  dataMenuActions = [];

  files = [];
  // data type files are files that are edited for specific experiment types. 
  // for example:  Animal Pharmacology 
  // dataTypeFiles = [];

  dropfunction = null;
  showDataDrop = false;
  @Input()
  detailView = false;
  
  @Input ()
  readonly = false;
  
  directory = null;
  driveId = null;
  imagePath;
  folderActionMenuItems = [];
  tagFunction = null;
  opening: boolean = false;
  // missingAnimalStudyTemplate = false;

  constructor(
    private msgraph: AuthService,
    private d: DomSanitizer,
    private cd: ChangeDetectorRef) {
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


  selectedDoc = null;
  confirm_delete_modal = null;

  async delete(doc) {
    let id = doc['id'];
    this.selectedDoc = doc;
  }

  file_menu() {
    this.opening = true;
  }
  mouse_out_file() {
    this.opening = false;
  }

  async deleteDoc(doc) {
    if (this.selectedDoc != null) {
      console.log(JSON.stringify(this.selectedDoc))
      let driveID = this.selectedDoc['parentReference']['driveId']
      let path = '/drives/' + driveID + '/items/' + this.selectedDoc['id']
      let client = await this.msgraph.getClient();
      let info = await client.api(path).get();
      // console.log ( " info \n\n\n\n");
      // console.log ( JSON.stringify ( info ))
      // remove this file from the invivo list if it is in there
      let res = await client.api(path).delete();
      this.refresh();
    }
  }

  confirm_archive_modal = null;
  async archive(doc) {
    this.selectedDoc = doc;
  }
  // this method is currently not complete. 
  async archiveDoc() {
    if (this.selectedDoc != null) {
      // console.log ( JSON.stringify ( this.selectedDoc ))
      let refpath = this.selectedDoc['parentReference']['path']
      let nefpath = refpath.substring(refpath.lastIndexOf(':') + 1)
      nefpath = nefpath.replace('/', '_')
      let driveID = this.selectedDoc['parentReference']['driveId']
      let path = '/drives/' + driveID + '/items/' + this.selectedDoc['id']
      let client = await this.msgraph.getClient();
      let info = await client.api(path).get();
      let f = formattedTimeStamp();
      let archive_path = '/drives/' + driveID + '/root:/.archive'
      try {
        let g = await client.api(archive_path).get();
        // check to see if the archive folder is there. 
      } catch (gexce) {
        console.log(gexce);
        const driveItem = {
          name: ".archive",
          folder: {},
          '@microsoft.graph.conflictBehavior': "fail"
        };
        let res = await client.api('/drives/' + driveID + '/root/children')
          .post(driveItem);
      }
      try {
        let g = await client.api(archive_path).get();
        const movingItem = {
          parentReference: {
            id: g['id']
          },
          name: "" + formattedTimeStamp() + '-' + nefpath + '-' + this.selectedDoc['name']
        };
        // alert ("" + formattedTimeStamp() + '-' + this.selectedDoc['name'] )
        let res = await client.api(path)
          .update(movingItem);
        this.refresh();
      } catch (excp) {
        console.log(excp);
      }
    }
  }

  closeArchivedialog() {
    if (this.confirm_archive_modal != null) {
      this.confirm_archive_modal.close();
    }
  }


  closeDelConfirm() {
    if (this.confirm_delete_modal != null) {
      this.confirm_delete_modal.close();
    }
  }

  open(doc) {


    if (this.fileButton != null) {
      let funct = this.fileButton['function'];
      funct(doc)
    } else {

      let url = doc['webUrl']
      window.open(url, "_blank");
    }
  }


  closeMSG() {
    this.msg_dialog.nativeElement.close();
  }


  openLocal(doc) {
    if (this.fileButton != null) {
      let funct = this.fileButton['function'];
      funct(doc)
    } else {
      let docpath = doc['parentReference']['path']
      // console.log ( " doc path : " + docpath );
      let ldoc = docpath.lastIndexOf(':/')
      docpath = docpath.substring(ldoc + 2);
      let filename = doc['name']
      // console.log ( JSON.stringify ( doc ))
      if (this.data['driveUrl'] === null) {
        alert(" Failed to find the drive url so cannot open locally")
        return;
      }
      let driveUrl = this.data['driveUrl']
      if (filename.endsWith(".xlsx") || filename.endsWith('.xls')
        || filename.endsWith('.xlsm')
        || filename.endsWith('.csv')
        || filename.endsWith('.xls')) {
        let rurl = 'ms-excel:ofe|ofc|u|' + driveUrl + '/' + filename;
        console.log("opening doc url " + rurl);
        window.open(rurl);
      }
      if (filename.endsWith(".doc") || filename.endsWith('.docx')
        || filename.endsWith('.txt')
        || filename.endsWith('.bat')) {
        let rurl = 'ms-word:ofe|ofc|u|' + driveUrl + '/' + filename;
        window.open(rurl);
      }



    }
  }
  download(doc) {
    let download = doc['@microsoft.graph.downloadUrl']
    window.open(download, "_blank");
  }
  launch(url) {
    window.open(url, "_blank");
  }




  async tag(doc) {

    let linkfilepath = `/dirves/b!fpkycXqqNEa6otdJfpicqcMtyDfDHEJKoiQ7woqS1Nq0g7K2aXGrT4pji5Lb1gBI/items/${doc.id}/content`;
    let client = await this.msgraph.getFGClient();
    let stream = await client.api(linkfilepath).get();
    let b64file = null;
    let blob = null;
    stream.on('finish', function () {
      blob = stream.toBlob('application/word');
      // let linkobj = this.create_lnk_blob(linkfilepath);
      b64file = this.getBase64(blob) + '';
      console.log(' base 64 file  ' + b64file)
    });

    // Word.run(async (context) => {
    //   var body = context.document.body;
    //   // Queue a command to insert OOXML in to the beginning of the body.
    //   if (Office.context.requirements.isSetSupported("WordApi", "1.2")) {
    //     b64file = b64file.substring(b64file.lastIndexOf(',') + 1)
    //     body.insertFileFromBase64(b64file.toString(), Word.InsertLocation.end);
    //     await context.sync();
    //   }
    // });
  }

  bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i === 0) return `${bytes} ${sizes[i]})`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
  }

  getBase64(file) {
    return new Promise<String>((resolve, reject) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function (event) {
        resolve(event.target.result + '');
      };
      reader.onerror = function (error) {
        console.log('Error: ', error);
        resolve(error.toString())
      };
    })
  }





  //   if (this.tagFunction != null) {
  //     this.tagFunction(doc);
  //   } else {
  //     console.log(" do not have a tagFunction object ");
  //   }
  // }

  // captureScreen(): Promise<{}> {
  //   return new Promise((resolve, reject) => {
  //     let viewHeight = this.screen.nativeElement.offsetHeight;
  //     let offsettop = this.screen.nativeElement.offsetTop;
  //     let offset = this.screen.nativeElement.getBoundingClientRect().top;
  //     html2canvas(this.screen.nativeElement, { y: (offsettop * -1), height: viewHeight + offsettop, scrollY: 0 }).then(canvas => {
  //       // Few necessary setting options
  //       let imgWidth = canvas.width;
  //       let imgHeight = canvas.height;
  //       let ratio = imgHeight / imgWidth;
  //       const contentDataURL = canvas.toDataURL('image/png')
  //       let pdf = new jspdf(); // A4 size page of PDF
  //       var width = pdf.internal.pageSize.getWidth();
  //       var height = pdf.internal.pageSize.getHeight();
  //       height = ratio * width;
  //       console.log(" image widhth " + width + " image height : " + height);
  //       pdf.addImage(contentDataURL, 'PNG', 0, 0, width - 20, height - 10);
  //       // pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight)
  //       pdf.save('MYPdf.pdf'); //dd Generated PDF
  //       resolve(
  //         pdf
  //       );
  //     })
  //   })
  // }


  init(): string {
    return '';
  }
  runFunction(button) {
    if (button['ionfunction'] != null) {
      LionEngine.execIon(button['ionfunction']);
    } else if (button['click'] != null) {
      LionEngine.execIon(button['click']);
    }
  }
  exec(ionfunctionID) {
    LionEngine.execIon(ionfunctionID);
  }

  ngOnInit(): void {

    if (this.data != null) {
      if (this.data['type'] != null)
        this.type = this.data['type']
      if (this.data['path'] != null)
        this.path = this.data['path']
      if (this.data['showDetails'] != null) {
        this.detailView = this.data['showDetails']
      }


      if ( this.data['readonly']!=null )
      {
        this.readonly = this.data['readonly']
      }
      debugger;

      if ( this.readonly ) {
        this.showFolderButton = false;
      }


      if (this.data['file-button'] != null) {
        this.fileButton = this.data['file-button']
      }
      if (this.data['showFolderButton'] != null)
        this.showFolderButton = this.data['showFolderButton']
      if (this.data['folderActionMenuItems'] != null)
        this.folderActionMenuItems = this.data['folderActionMenuItems']
      if (this.data['tag-document'] != null) {
        this.tagFunction = LionEngine.ionfunctions[this.data['tag-document']]
      }
      if (this.data['dataTypeFunctions'] != null) {
        let dtfs = this.data['dataTypeFunctions']
        for (let d of dtfs) {
          this.dtfunctions.push(LionEngine.ionfunctions[d])
        }
      }
      if (this.data['dataTypeActions'] != null) {
        this.dtactions = this.data['dataTypeActions']
      }

      console.log(this.data["dataMenuActions"])
      if (this.data['dataMenuActions'] != null) {
        this.dataMenuActions = this.data['dataMenuActions'];
      }

    }


    let fs = setInterval(() => {
      if (!this.opening)
        this.refresh();
    }, 10000)

    setTimeout(() => {
      clearInterval(fs)
    }, 120000)





    console.log(" folder action items " + JSON.stringify(this.folderActionMenuItems));

    // this.folderActionMenuItems= [
    //   {
    //     'label': 'Word',
    //   },
    //   {
    //     'label': 'Excel',
    //   },
    //   {
    //     'label': 'Power Point',
    //   },
    //   {
    //     'label': 'OneNote ',
    //   }
    // ]




    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    this.loadfiles();

  }
  show(d) {
    this.selected_folder = d;
  }
  folder_contents_panelx;
  list(d) {
    this.selected_folder_children = [];
    this.loading = true;
    this.selected_folder = d;
    this.loadSelectedFolder();
    if (this.folder_contents_panel) {
    }
  }


  getFileProcessTitle(name) {
    return "Process"
  }


  goToSharepointFolder() {
    if (this.path.endsWith(':/children')) {
      let lt = this.path.lastIndexOf(':');
      if (lt > 0) {
        let temp = this.path.substring(0, lt);
        console.log(" path " + temp);
        this.msgraph.getClient().then(client => {
          client.api(temp).get().then(res => {
            if (res != null) {
              window.open(res['webUrl'], '_blank');
            }
          })
        })
      }
    } else {
      let parentPath = this.path.substring(0, this.path.lastIndexOf('/children'))
      this.msgraph.getClient().then(client => {
        client.api(parentPath).get().then(res => {
          if (res != null) {
            window.open(res['webUrl'], '_blank');
          }
        })
      })
    }
  }

  getFileType(name) {
    if (name.endsWith('.gz') || name.endsWith('.zip') || name.endsWith('.bz') ||
      name.endsWith('.bzip') || name.endsWith('.tar')) {

      let ind = name.lastIndexOf('.');
      let i = name.indexOf('.');
      let previousIndex = ind;
      while (i != ind) {
        previousIndex = i;
        i = name.indexOf('.', i + 1)
      }
      return name.substring(previousIndex+1).toLowerCase();
    } else {
      let ind = name.lastIndexOf('.');
      if (ind > 0) {
        return name.substring(ind + 1).toLowerCase();
      } else {
        return 'undefined';
      }
    }
  }

  executeAction(fc, file) {
    let func = LionEngine.ionfunctions[fc.ionfunction]
    if (func) {
      func(file);
    }
  }

  refresh() {
    this.loadfiles();
  }



  close() {
    if (this.folder_contents_panelx) {
      this.folder_contents_panelx.close();
    }
  }
  format(datetime) {
    return datetime.split('T')[0]
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

  loadfiles() {
    this.loading = true;
    this.msgraph.getClient().then((client) => {
      client.api(this.path).get().then(async (res) => {
        if (res != null) {
          this.files = (res['value']);
          if (this.files != null && this.files.length > 0) {
            this.directory = this.files[0].parentReference.path
            this.driveId = this.files[0].parentReference.driveId
            this.files = await this.addDataTypeAttribute(this.files);
          }
        }
      })
    });
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

  setDropFunction(dropfunction) {
    this.dropfunction = dropfunction;
  }
  // "addFileButton($event)" [(ngModel)]="fileButtonModel

  fileButtonModel;
  addFileButton(event) {
    console.log(event.target.id)
    console.log(event.target.label)
  }


  loadSelectedFolder() {
    let f = this.selected_folder['webUrl']
    this.msgraph.createClient({ arg0: { 'scope': ['User.Read', 'AllSites.Read'] } }).then(client => {
      if (!client) {
        console.log(' iot appear that the client object is null ')
      }
      client.api(this.path).get().then(res => {
        console.log(" res values " + JSON.stringify(res));
        if (res != null) {
          this.selected_folder_children = res['value'];
          this.loading = false;
        }
      })
    })
  }
}



function formattedTimeStamp() {
  // Create a date object with the current time
  var now = new Date();

  // Create an array with the current month, day and time
  var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

  // Create an array with the current hour, minute and second
  let time:any = ['' + now.getHours(), '' + now.getMinutes(), now.getSeconds()];

  // Determine AM or PM suffix based on the hour
  var suffix = (time[0] < 12) ? "AM" : "PM";

  // Convert hour from military time
  time[0] = (time[0] < 12) ? time[0] : +time[0] - 12;

  // If hour is 0, set it to 12
  time[0] = time[0] || 12;

  // If seconds and minutes are less than 10, add a zero
  for (var i = 1; i < 3; i++) {
    if (time[i] < 10) {
      time[i] = "0" + time[i];
    }
  }

  // Return the formatted string
  return date.join("-") + "_" + time.join("-") + "_" + suffix;
}