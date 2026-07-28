import { FormsModule } from '@angular/forms';
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MonomerDB } from "./monomerdb";
import { MonomerSaver } from "./monomer-saver";
import { DownloadData } from "./download-data";
import { MonomerLoader } from "./monomer-loader";


@NgModule({
  imports:[FormsModule, BrowserModule],
  providers: [MonomerDB, MonomerSaver,DownloadData,MonomerLoader],
  declarations:[], 
  exports:[ ], 
})
export class MonomerDBModule {



}