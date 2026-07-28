import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IoniScriptLib } from './io-lib';
import { IoniScriptEngine } from './io-engine';
import { FormsModule } from '@angular/forms';
import { IoniScriptDB } from './io-db';

@NgModule({
  imports: [FormsModule, BrowserModule,
    HttpClientModule],
  providers: [IoniScriptEngine, IoniScriptLib, IoniScriptDB],
  declarations: [],
  exports: []
})
export class IonisEngineModule {

}