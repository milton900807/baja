import {
  OnInit, OnChanges, SimpleChanges,
  Component, Input
} from "@angular/core";

import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { PubComponent } from '../published-lionscript/pub-component';
import { LionEngine } from '../engine/io-engine';
import { UploadFileOneDrive } from "../onedrive/upload-file.service";
import { PubComponentListener } from "../published-lionscript/pub-component-listener";


@Component({
  selector: 'file-drop',
  templateUrl: './data-drop.component.html',
})
export class DataDropComponent implements OnInit, OnChanges, PubComponent {
  data: any;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input("header_text")
  header_text: string = "Drop file";
  @Input("operation")
  operation: string = "post";
  public files: NgxFileDropEntry[] = [];
  fileFunction = null;
  fileButtonTitle = 'Upload';
  drop_text = "Drop files here "
  fileFunctionBlob = null;
  showUploadButton = true;
  destinationPath = null;
  onDropFunction = null;
  uploadFolderFunction: any;
  uploadCompleteFunction: any;
  file;

  constructor(private uploader: UploadFileOneDrive) { }

  ngOnChanges(changes: SimpleChanges): void {
  }

  onChange ( event ) {

  }
  ngOnInit(): void {

    if (this.data != null) {
      if (this.data['fileFunction']) {
        this.fileFunction = LionEngine.ionfunctions[this.data['fileFunction']]
      }
      if (this.data['onDropToBlob']) {
        this.fileFunctionBlob = LionEngine.ionfunctions[this.data['onDropToBlob']]
      }
      if (this.data['fileButtonTitle']) {
        this.fileButtonTitle = this.data['fileButtonTitle']
      }
      if (this.data['dropText']) {
        this.drop_text = this.data['dropText']
      }
      if (this.data['showUploadButton'] != null) {
        this.showUploadButton = this.data['showUploadButton']
      }
      if (this.data['getUploadFolder'] != null) {
        this.uploadFolderFunction = this.data['getUploadFolder']
      }
      if (this.data['onDropFunction'] != null) {
        this.onDropFunction = this.data['onDropFunction']
      }
      if (this.data['getRef'] != null) {
        LionEngine.ionfunctions[this.data['getRef']](this)
      }
      if (this.data['uploadCompleteFunction'] != null) {
        this.uploadCompleteFunction = this.data['uploadCompleteFunction']
      }
    }
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
  }

  execFileFunction() {
    if (this.fileFunction != null) {
      this.fileFunction(this.files);
    }
    this.upload();
  }

  init(): string {
    return '';
  }

  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          if (this.fileFunctionBlob != null) {
            this.fileFunctionBlob(file)
          }
          if (this.onDropFunction != null) {
            LionEngine.ionfunctions[this.onDropFunction](file)
          }
        });
      } else {
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  public fileOver(event) {
    console.log(event);
  }

  public fileLeave(event) {
    console.log(event);
  }


  public async upload() {
    return new Promise((resolve, reject) => {
      if (this.uploadFolderFunction != null) {
        this.destinationPath = LionEngine.ionfunctions[this.uploadFolderFunction]();

      }

      let responses = []
      let index = 0;
      for (const droppedFile of this.files) {

        if (droppedFile.fileEntry.isFile) {
          const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
          fileEntry.file(async (file: File) => {
            let response = await this.uploader.fileUpload(file, this.destinationPath, ()=>{})
            responses.push(response)
            index++;
            if (index === this.files.length) {
              if (this.uploadCompleteFunction) {
                LionEngine.ionfunctions[this.uploadCompleteFunction](responses);
              }
              resolve(responses)
            }
          });

        }
      }
    })
  }




}