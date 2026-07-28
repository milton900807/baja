import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { HttpClientModule } from '@angular/common/http';
import { LionAppComponent, ModalContentComponent } from './dash.component';
import { LionListComponent } from './lion-list.component';
import { OKPanel } from './okpanel.component';
import { SimpleProfileComponent } from './simple-profile.component';
import { PubDirective } from './pub.directive';
import { PubRenderComponent } from './pub-render.component';
import { SpacerComponent } from './spacer-component';
import { Location } from '@angular/common';
import { TextAreaEditComponent } from './text-area-edit.component';
import { LogBlockComponent } from './log-block.component';
import { MedChemWidgetComponent } from './med-chem-widget.component';
import { TextFieldComponent } from './text-field.component';
import { ChemistryComponent } from './chemistry.component';
import { FunctionsModule } from '../functions/functions.module';
import { JSONViewerComponent } from './jsonviewer.component';
import { WorkingFeedbackComponent } from './working-feedback.component';
import { InputParamItems } from './input-param-items.component';
import { HintComponent } from './hint.component';
import { SelectItemComponent } from './select-item.component';
import { SimpleButtonComponent } from './simple-button.component';
import { GMapViewerComponent } from './gmap-viewer.component';
import { CMDLineComponent } from './cmd-line.component';
import { SolrFacetListComponent } from './solr-facet-list.component';
import { HTMLFieldComponent } from './html-field.component';
import { RunButton } from './run-button.component';
import { OneDriveModule } from '../onedrive/onedrive.module';
import { OneDriveComponent } from './onedrive.component';
import { ScriptViewerComponent } from './script-viewer.component';
import { LaunchListComponent } from './launch-list.component';
import { IonWorksMenuComponent } from './ionworks-menu.component';
import { SearchComponent } from './search.component';
import { PubModalDirective } from './pub-modal.directive';
import { RadioButtonsComponent } from './components/radio-buttons/radio-buttons.component';
import { RadioBigButtonsComponent } from './components/radio-buttons/radio-big-buttons.component';
import { ButtonToggleMultipleComponent } from './components/button-toggle-multiple/button-toggle-multiple.component';
import { MultiSelectComponent } from './multi-select.component';
import { DataTypePipe } from './datatype-pipe';
import { SimpleMenuComponent } from './simple-menu.component';
import { SimpleD3Component } from './data-vis/simple-d3.component';
import { SimplePlate } from './data-vis/simple-plate.component';
import { PlateDirective } from './data-vis/plate.directive';
import { SelectionListComponent } from './components/selection-list/selection-list.component';
import { TableComponent } from './components/table/table.component';
import { SearchResultsComponent } from './data-vis/search-results.component';
import { IonWorksNavbarComponent } from './ionworks-navbar.component';
import { AddUserComponent } from './components/cap-user/adduser.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { CanvasComponent } from './components/canvas.component';
import { CanvasAbsoluteComponent } from './components/canvas-absolute.component';
import { IconCanvasComponent } from './components/icon-canvas.component';
import { CardComponent } from './components/card.component';
import { CardSingleComponent } from './components/card-single.component';
import { MTButtonComponent } from './components/mt-button/mt-button.component';
import { CanvasButtonsComponent } from './components/canvas-buttons.component';
import { MonomerEditorModule } from '../monomer-editor/monomer-editor.module';
import { MolEditorComponent } from './mol-editor.component';
import { TabComponent } from './components/tab.component';
import { TitlePipe } from './components/table/title-pipe';
import { RawResultsPageComponent } from './raw-results-page.component';
import { ImageBase64 } from './components/image-base64.component';
import { FluidHeightDirective } from './components/fluid-height-directive';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuItemComponent } from './menu-item.component';
import { CanvasProgressComponent } from './components/canvas-progress.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WebCameraComponent } from './webcamera.component'
import { WebcamModule } from 'ngx-webcam';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatHeaderRow, MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ColorPaletteComponent } from './color-chooser.component';
import { MolecularViewerComponent } from '../monomer-editor/simple_molecular_viewer.component';
import { PDBViewerComponent } from './components/pdb/viewer.component';
import { TextEditorComponent } from './components/texteditor-component';
import { YoutubeComponent } from './youtube.component';
import { SafeUrlPipe } from './SafeUrlPipe';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ColorSketchModule } from 'ngx-color/sketch';
import { NgxColorsModule } from 'ngx-colors';
import { AppCheckoutComponent } from '../app-checkout.component';
import { CalendarChooserComponent } from './components/calendar-chooser.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CalendarImportComponent } from './components/calendar-import.component';
import { MicrosoftCallbackComponent } from './microsoftcallback.component';
import { CalendarService } from './components/calender-import.service';
import { CardColumnComponent } from './components/card-column.component';
import { SimpleMenuButtonComponent } from './simple-button-menu.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HighlightBracketsPipe } from './highlight-pipe';
import { NewsComponent } from './news.component';
import { NewsTickerComponent } from './news-ticker.component';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfPurchaseViewerComponent } from './pdf-viewer-purchase.component';
import { NewsEditorComponent } from './news-editor.component';
import { NewsletterComponent } from './news-letter.component';
import { LibraryViewerComponent } from './library-viewer.component';








@NgModule({
  imports: [FormsModule, ReactiveFormsModule, BrowserModule, MonacoEditorModule, HttpClientModule,
    FunctionsModule, OneDriveModule, MonomerEditorModule, NgxColorsModule,
    FormsModule,
    MatFormFieldModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BrowserAnimationsModule,  // Important!
    MatButtonModule,
    MatMenuModule,
    MatRadioModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    MatTableModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    WebcamModule,
    NgxFileDropModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    DragDropModule,
    ColorSketchModule],

  providers: [Location, TitlePipe, SafeUrlPipe, MicrosoftCallbackComponent, CalendarService, HighlightBracketsPipe],

  declarations: [DataTypePipe, LionAppComponent, LionListComponent, OKPanel, CanvasAbsoluteComponent,
    SimpleProfileComponent, PubDirective, PubModalDirective, PubRenderComponent, SpacerComponent,
    TextAreaEditComponent, TextFieldComponent, LogBlockComponent, MedChemWidgetComponent,
    ChemistryComponent, JSONViewerComponent, WorkingFeedbackComponent,
    OKPanel, InputParamItems, HintComponent, SelectItemComponent,
    SimpleButtonComponent, GMapViewerComponent,
    CMDLineComponent, SolrFacetListComponent,
    HTMLFieldComponent,
    RunButton, ScriptViewerComponent,
    OneDriveComponent, LaunchListComponent,
    IonWorksMenuComponent, SearchComponent,
    ModalContentComponent, RadioButtonsComponent, RadioBigButtonsComponent, ButtonToggleMultipleComponent,
    MultiSelectComponent,
    SimpleMenuComponent, SimpleD3Component,
    SimplePlate, PlateDirective, ButtonToggleMultipleComponent,
    SelectionListComponent, TableComponent, SearchResultsComponent,
    IonWorksNavbarComponent,
    AddUserComponent, CarouselComponent, CanvasComponent,
    IconCanvasComponent, CardComponent, CardSingleComponent, MTButtonComponent, CanvasButtonsComponent, RawResultsPageComponent,
    MolEditorComponent, TabComponent, TitlePipe, ImageBase64, FluidHeightDirective, YoutubeComponent,
    MenuItemComponent, CanvasProgressComponent, WebCameraComponent,
    ColorPaletteComponent, PDBViewerComponent, TextEditorComponent, SafeUrlPipe, AppCheckoutComponent,
    CalendarChooserComponent, CalendarImportComponent, MicrosoftCallbackComponent, CardColumnComponent, SimpleMenuButtonComponent, 
    HighlightBracketsPipe, NewsComponent, NewsTickerComponent, PdfViewerComponent, PdfPurchaseViewerComponent, NewsEditorComponent, NewsletterComponent, LibraryViewerComponent],


  exports: [LionAppComponent, LionListComponent, OKPanel, SpacerComponent, SimpleProfileComponent,
    PubDirective, PubModalDirective, PlateDirective, TextAreaEditComponent,
    LogBlockComponent,
    TextFieldComponent, ChemistryComponent,
    JSONViewerComponent, WorkingFeedbackComponent,
    OKPanel, InputParamItems, HintComponent, SelectItemComponent,
    SimpleButtonComponent, GMapViewerComponent, CMDLineComponent, SolrFacetListComponent,
    HTMLFieldComponent,
    RunButton, ScriptViewerComponent,
    OneDriveComponent, LaunchListComponent,
    IonWorksMenuComponent, SearchComponent, ModalContentComponent, RadioButtonsComponent, RadioBigButtonsComponent, ButtonToggleMultipleComponent, MultiSelectComponent,
    SimpleMenuComponent, SimpleD3Component, SimplePlate,
    SelectionListComponent, TableComponent,
    SearchResultsComponent,
    IonWorksNavbarComponent,
    AddUserComponent, CarouselComponent,
    CanvasComponent, IconCanvasComponent, CardComponent, CardSingleComponent, MTButtonComponent, RawResultsPageComponent, YoutubeComponent,
    CanvasButtonsComponent, MolEditorComponent, TabComponent,
    ImageBase64, MenuItemComponent, CanvasProgressComponent, CanvasAbsoluteComponent,
    FluidHeightDirective, WebCameraComponent, ColorPaletteComponent, PDBViewerComponent,
    TextEditorComponent, AppCheckoutComponent, CalendarImportComponent, MicrosoftCallbackComponent, CardColumnComponent, 
    SimpleMenuButtonComponent, NewsComponent, NewsTickerComponent, PdfViewerComponent, 
    NewsEditorComponent, NewsletterComponent, PdfPurchaseViewerComponent, LibraryViewerComponent],

  // entryComponents: [SimpleProfileComponent, OKPanel, SpacerComponent, TextAreaEditComponent,
  //   LogBlockComponent, MedChemWidgetComponent, TextFieldComponent, ChemistryComponent,
  //   JSONViewerComponent, WorkingFeedbackComponent, OKPanel,
  //   InputParamItems, HintComponent, SelectItemComponent, TypeAheadComponent, SimpleButtonComponent,
  //   GMapViewerComponent, CMDLineComponent, SolrFacetListComponent,
  //   HTMLFieldComponent, RunButton, ScriptViewerComponent, CanvasAbsoluteComponent,
  //   OneDriveComponent, LaunchListComponent, IonWorksMenuComponent,
  //   SearchComponent, PlotlyPanel, ModalContentComponent,
  //   RadioButtonsComponent, ButtonToggleMultipleComponent, MultiSelectComponent, SimpleMenuComponent, LionAppComponent,
  //   SimpleD3Component, SimplePlate, SelectionListComponent, SelectionTableComponent,
  //   TableComponent, HTMLEditorComponent, SearchResultsComponent, PublishAppComponent,
  //   GitAppComponent, IonWorksNavbarComponent,
  //   AddUserComponent, CarouselComponent, CanvasComponent, IconCanvasComponent,
  //   CardComponent, CardSingleComponent, MTButtonComponent,
  //   CanvasButtonsComponent, MolEditorComponent, TabComponent, ImageBase64, CanvasProgressComponent]
})
export class PublishLIONScriptModule {
}