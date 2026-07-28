
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DataImportModule } from '../data-import/data-import.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IonWorkslistComponet } from './ionwork-list.component';
import { IonisEngineModule } from '../engine/io-engine.module';
import { PublishLIONScriptModule } from '../published-lionscript/publish-lionscript.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
    imports: [FormsModule, BrowserModule,
         DataImportModule, 
        HttpClientModule, 
         IonisEngineModule, PublishLIONScriptModule,
         ReactiveFormsModule],
    providers: [],
    declarations: [ IonWorkslistComponet],
})
export class IonworksModule {
}