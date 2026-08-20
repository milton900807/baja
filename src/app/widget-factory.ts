import { OKPanel } from "./published-lionscript/okpanel.component";
import { TextAreaEditComponent } from "./published-lionscript/text-area-edit.component";
import { LogBlockComponent } from "./published-lionscript/log-block.component";
import { MedChemWidgetComponent } from './published-lionscript/med-chem-widget.component';
import { TextFieldComponent } from "./published-lionscript/text-field.component";
import { ChemistryComponent } from "./published-lionscript/chemistry.component";
import { JSONViewerComponent } from "./published-lionscript/jsonviewer.component";
import { WorkingFeedbackComponent } from "./published-lionscript/working-feedback.component";
import { InputParamItems } from "./published-lionscript/input-param-items.component";
import { GMapViewerComponent } from "./published-lionscript/gmap-viewer.component";
import { CMDLineComponent } from "./published-lionscript/cmd-line.component";
import { HTMLFieldComponent } from "./published-lionscript/html-field.component";
import { RunButton } from "./published-lionscript/run-button.component";
import { OneDriveComponent } from './published-lionscript/onedrive.component';
import { LaunchListComponent } from './published-lionscript/launch-list.component';
import { IonWorksMenuComponent } from './published-lionscript/ionworks-menu.component';
import { RadioButtonsComponent } from './published-lionscript/components/radio-buttons/radio-buttons.component';
import { MultiSelectComponent } from './published-lionscript/multi-select.component';
import { LinkNavigationComponent } from './onedrive/link-nav.component';
import { SimpleMenuComponent } from './published-lionscript/simple-menu.component';
import { ButtonMenuComponent } from './published-lionscript/button-menu.component';
import { DataDropComponent } from './data-import/data-drop.component';
import { SimpleD3Component } from './published-lionscript/data-vis/simple-d3.component';
import { ButtonToggleMultipleComponent } from './published-lionscript/components/button-toggle-multiple/button-toggle-multiple.component';
import { SelectionListComponent } from './published-lionscript/components/selection-list/selection-list.component';
import { TableComponent } from './published-lionscript/components/table/table.component';
import { SearchResultsComponent } from "./published-lionscript/data-vis/search-results.component";
import { IonWorksNavbarComponent } from "./published-lionscript/ionworks-navbar.component";
import { AddUserComponent } from "./published-lionscript/components/cap-user/adduser.component";
import { CarouselComponent } from "./published-lionscript/components/carousel/carousel.component";
import { CanvasComponent } from "./published-lionscript/components/canvas.component";
import { IconCanvasComponent } from "./published-lionscript/components/icon-canvas.component";
import { CardComponent } from "./published-lionscript/components/card.component";
import { MTButtonComponent } from "./published-lionscript/components/mt-button/mt-button.component";
import { CanvasButtonsComponent } from "./published-lionscript/components/canvas-buttons.component";
import { MolEditorComponent } from "./published-lionscript/mol-editor.component";
import { TabComponent } from "./published-lionscript/components/tab.component";
import { FileBrowserComponent } from "./file-manager/folder-browser.component";
import { ImageBase64 } from "./published-lionscript/components/image-base64.component";
import { FolderListComponent } from "./eln/folder-list-view.component";
import { FileGalleryComponent } from "./eln/file-gallery-view.component";
import { ELNComponent } from "./eln/eln.component";
import { FolderChooserComponent } from "./eln/folder-chooser.component";
import { MSFolderComponent } from "./eln/ms-folder.component";
import { CanvasProgressComponent } from "./published-lionscript/components/canvas-progress.component";
import { CanvasAbsoluteComponent } from "./published-lionscript/components/canvas-absolute.component";
import { WebCameraComponent } from "./published-lionscript/webcamera.component";
import { FBComponent } from "./file-manager/fb.component";
import { ColorPaletteComponent } from "./published-lionscript/color-chooser.component";
import { PDBViewerComponent } from "./published-lionscript/components/pdb/viewer.component";
import { TextEditorComponent } from "./published-lionscript/components/texteditor-component";
import { YoutubeComponent } from "./published-lionscript/youtube.component";
import { SimpleFileDropComponent } from "./data-import/simple-file-upload.component";
import { AppCheckoutComponent } from "./app-checkout.component";
import { CalendarChooserComponent } from "./published-lionscript/components/calendar-chooser.component";
import { CalendarImportComponent } from "./published-lionscript/components/calendar-import.component";
import { CardColumnComponent } from "./published-lionscript/components/card-column.component";
import { SimpleMenuButtonComponent } from "./published-lionscript/simple-button-menu.component";
import { SimpleButtonComponent } from "./published-lionscript/simple-button.component";
import { MolstarEmbedComponent } from "./published-lionscript/ms.component";
import { NewsComponent } from "./published-lionscript/news.component";
import { NewsTickerComponent } from "./published-lionscript/news-ticker.component";
import { PdfViewerComponent } from "./published-lionscript/pdf-viewer.component";
import { NewsEditorComponent } from "./published-lionscript/news-editor.component";
import { NewsletterComponent } from "./published-lionscript/news-letter.component"
import { RadioBigButtonsComponent } from "./published-lionscript/components/radio-buttons/radio-big-buttons.component";
import { MarketFBComponent } from "./file-manager/fb-market.component";
import { PdfPurchaseViewerComponent } from "./published-lionscript/pdf-viewer-purchase.component";
import { LibraryViewerComponent } from "./published-lionscript/library-viewer.component";
import { TitleWidgetComponent } from "./published-lionscript/components/title/title-widget.component";


export class PageWidgetFactory {
    static IsJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    static createWidget(id: string) {
        if (PageWidgetFactory.IsJsonString(JSON.stringify(id))) {
        }
        return null;
    }
}
export class WidgetFactory {

    private static widgets = {
        'news': NewsComponent,
        'news-letter': NewsletterComponent,
        'news-ticker': NewsTickerComponent,
        'news-editor': NewsEditorComponent,
        'ionworks-menu': IonWorksMenuComponent,
        'market-file-browser': MarketFBComponent,
        'simple-file-browser': FBComponent,
        'ionworks-navbar': IonWorksNavbarComponent,
        'folder-list': FolderListComponent,
        'file-gallery': FileGalleryComponent,
        'chemistry-display': ChemistryComponent,
        'input-textarea-editor': TextAreaEditComponent,
        'logblock': LogBlockComponent,
        'json': JSONViewerComponent,
        'working': WorkingFeedbackComponent,
        'save': OKPanel,
        'input-param-items': InputParamItems,
        'button': SimpleButtonComponent,
        'gmap-viewer': GMapViewerComponent,
        'cmd-line': CMDLineComponent,
        'html': HTMLFieldComponent,
        'title': TitleWidgetComponent,
        'run': RunButton,
        'data-drop': DataDropComponent,
        'file-drop': DataDropComponent,
        'simple-button-menu': SimpleMenuButtonComponent,
        'simple-file-upload': SimpleFileDropComponent,
        'input-textfield': TextFieldComponent,
        'onedrive': OneDriveComponent,
        'eln': ELNComponent,
        'folder-chooser': FolderChooserComponent,
        'folder-browser': FileBrowserComponent,
        'calendar-chooser': CalendarChooserComponent,
        'ms-folder': MSFolderComponent,
        'launch-list': LaunchListComponent,
        'radio-buttons': RadioButtonsComponent,
        'radio-big-buttons': RadioBigButtonsComponent,
        'button-toggle-multiple': ButtonToggleMultipleComponent,
        'multi-select': MultiSelectComponent,
        'selection-list': SelectionListComponent,
        'table': TableComponent,
        'link-nav': LinkNavigationComponent,
        'menu': SimpleMenuComponent,
        'button-menu': ButtonMenuComponent,
        'd3': SimpleD3Component,
        'search-results': SearchResultsComponent,
        'register-user': AddUserComponent,
        'carousel': CarouselComponent,
        'canvas': CanvasComponent,  
        'absolute-canvas': CanvasAbsoluteComponent,
        'icon-canvas': IconCanvasComponent,
        'card': CardComponent, 
        'card-column': CardColumnComponent, 
        'mt-button': MTButtonComponent, 
        'button-canvas': CanvasButtonsComponent,
        'progress': CanvasProgressComponent,
        'youtube': YoutubeComponent,
        'medchem': MedChemWidgetComponent, 
        'medchemviewer': MedChemWidgetComponent, 
        'mol-editor': MolEditorComponent, 
        'tabs': TabComponent,
        'base64': ImageBase64,
        'webcam': WebCameraComponent,
        'text-editor': TextEditorComponent,
        // 'text-editor': TextAreaEditComponent,
        'color-chooser': ColorPaletteComponent, 
        'pdb-viewer': PDBViewerComponent,
        'pdf-viewer': PdfViewerComponent,
        'purchase-pdf': PdfPurchaseViewerComponent,
        'checkout': AppCheckoutComponent,
        'calendar-import': CalendarImportComponent,
        'molstar': MolstarEmbedComponent,
        'library': LibraryViewerComponent,

    }

    static createWidget(id: string) {
        return this.widgets[id] ? this.widgets[id] : null;
    }

}