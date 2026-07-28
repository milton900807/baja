import { NgModule } from '@angular/core';
import { FunctionGenerator } from './function-gen';
import { TrailScriptLib } from './trail-script-lib';
import { FunctionUtil } from './function-util';
import { HttpClientModule } from '@angular/common/http';
import { IonisEngineModule } from '../engine/io-engine.module';

@NgModule({
  imports: [HttpClientModule, IonisEngineModule],
  providers: [TrailScriptLib, FunctionGenerator, FunctionUtil],
  declarations: [],
  exports: []
})
export class FunctionsModule {



}