import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatMenuModule } from "@angular/material/menu";
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from "@angular/material/dialog"
import { MatInputModule } from "@angular/material/input"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FileManagerComponent } from "./file-manager.component";
import { FileBrowserComponent } from "./folder-browser.component";
import { FileService } from "./service/file.service";
import { FilenameFilter } from "./filename-filter";
import { NewFolderDialogComponent } from "./modals/newFolderDialog/newFolderDialog.component";
import { RenameDialogComponent } from "./modals/renameFolderDialog/renameDialog.component";
import { FBComponent } from "./fb.component";
import { MarketFBComponent } from "./fb-market.component";
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
    imports: [
        MatCardModule,
        MatDialogModule,
        MatIconModule,
        MatDialogModule,
        MatToolbarModule,
        MatGridListModule,
        MatMenuModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatInputModule,
        DragDropModule,
        FormsModule,
        MatButtonModule],
    declarations: [FileManagerComponent, FileBrowserComponent,
        FilenameFilter, NewFolderDialogComponent, RenameDialogComponent, FBComponent, MarketFBComponent],

    providers: [FileService],
    exports: [FileManagerComponent, FileBrowserComponent, FBComponent, MarketFBComponent]
})
export class FileManagerModule {
}