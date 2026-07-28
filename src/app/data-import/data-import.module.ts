import { BrowserModule } from '@angular/platform-browser';
import {  NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SimpleFileDrop } from './simple-file-drop';
import { NgxFileDropModule } from 'ngx-file-drop';
import { SimpleFileDropComponent } from './simple-file-upload.component';
import { DataDropComponent } from './data-drop.component';

@NgModule({
  declarations: [ DataDropComponent, SimpleFileDropComponent ],
  imports: [
    BrowserModule,
    FormsModule,
    NgxFileDropModule,
  ],
  exports: [  DataDropComponent, SimpleFileDropComponent ],
  // entryComponents: [DataDropComponent],
  providers: [SimpleFileDrop],
  
})
export class DataImportModule{ }
