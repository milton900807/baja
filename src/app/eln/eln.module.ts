import { NgModule } from "@angular/core";
import { PublishLIONScriptModule } from "../published-lionscript/publish-lionscript.module";
import { DocSignedComponent } from "./doc-signed.component";
import { DownloadCSVComponent } from "./download-csv.component";
import { ELNComponent } from "./eln.component";
import { FoldersFilter } from "./file-gallery-folders.pipe";
import { FileGalleryComponent } from "./file-gallery-view.component";
import { FileGalleryName } from "./filegalleryname.pipe";
import { FolderChooserComponent } from "./folder-chooser.component";
import { FolderListComponent } from "./folder-list-view.component";
import { MSFolderComponent } from "./ms-folder.component";
import { PDFViewer } from "./pdf-viewer.component";
import { CommonModule } from '@angular/common';  
import { RemoveAllButSystemFiles } from "./file-gallery-remove-all-but-system-files.pipe";
import { FileIcons } from "./filename-pipe";
import { UserService } from "./service/userservice";
import { SignUpComponent } from "./signup.component"
import { FormsModule } from "@angular/forms";
import { IonisEngineModule } from "../engine/io-engine.module";
import { BrowserModule } from "@angular/platform-browser";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@NgModule (
  {
  imports: [PublishLIONScriptModule, BrowserModule, FormsModule, CommonModule, IonisEngineModule, MatMenuModule, MatButtonModule, MatIconModule],
  providers: [FoldersFilter, FileGalleryName, RemoveAllButSystemFiles, FileIcons, UserService],
  declarations: [DocSignedComponent, DownloadCSVComponent, ELNComponent, FileGalleryComponent, SignUpComponent,
    FolderChooserComponent, FolderListComponent, PDFViewer, MSFolderComponent, RemoveAllButSystemFiles, FoldersFilter, FileIcons],
  exports: [DocSignedComponent, DownloadCSVComponent, ELNComponent, FileGalleryComponent, 
    FolderChooserComponent, FolderListComponent, PDFViewer, MSFolderComponent, RemoveAllButSystemFiles, FoldersFilter, FileIcons],
  // entryComponents: [DocSignedComponent, DownloadCSVComponent, ELNComponent, FileGalleryComponent, 
  //   FolderChooserComponent, FolderListComponent, PDFViewer, MSFolderComponent, CommonModule]
})
export class ELNModule {
}