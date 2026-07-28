import { FormsModule } from '@angular/forms';
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MonomerEditor } from "./monomer-editor.component";
import { MolecularViewerComponent } from "./simple_molecular_viewer.component";
import { MonomerLibraryViewer } from "./monomer-lib-viewer.component";
import { MonomerLibraryManager } from "./monomer-lib-manager.component";
import { UnitBuilder } from "./unit-builder.component";
import { KetcherComponent } from "./ketcher.component";
import { MonomerListComponent } from "./monomer-list.component";
import { FilterMonomers } from "./filter-monomers.component";
import { MonomerSelectionListComponent } from "./monomer-selection-list.component";
import { IsPublicFilter } from "./ispublic.pipe";
import { MonomerFilter } from "./monomer-name-filter.pripe";
import { NewMonomerComponent } from "./new-monomer.component";
import { MonomerNameFilter } from "./monomer-name-filter.pipe";
import { MonomerAttributeEditor } from "./monomer-attribute-editor.component";
import { MonomerManager } from './monomer-manager.component';
import { KetcherMolview } from './ketcher_molview.component';
import { MTypeAheadComponent } from './mtype-ahead.component';

@NgModule({
  imports:[FormsModule, BrowserModule ],
  declarations:[MonomerEditor,MolecularViewerComponent,MonomerLibraryViewer,
    MonomerLibraryManager,UnitBuilder,KetcherComponent,MonomerListComponent,
    FilterMonomers,MonomerSelectionListComponent,IsPublicFilter,MonomerFilter,
  NewMonomerComponent,MonomerNameFilter,MonomerAttributeEditor, MonomerManager, KetcherMolview, MTypeAheadComponent], 
  exports:[ MonomerEditor], 
    providers: [ ],

})
export class MonomerEditorModule {



}