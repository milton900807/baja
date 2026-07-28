import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, NgZone } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

import { FileElement } from './model/element';
import { NewFolderDialogComponent } from './modals/newFolderDialog/newFolderDialog.component';
import { RenameDialogComponent } from './modals/renameFolderDialog/renameDialog.component';

@Component({
  selector: 'fileg-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
})
export class FileManagerComponent implements OnChanges {
  constructor(public dialog: MatDialog, public zone: NgZone) { }

  @Input() COLS: number = 4;
  @Input() fileElements: FileElement[];
  @Input() canNavigateUp: string;
  @Input() path: string;
  @Input() folderPath: string;
  @Input() autoHeight: boolean = true;
  @Input() canAddFolder = true;
  @Input() showSearch = true;

  @Output() openFileEmitter = new EventEmitter<{ element: FileElement; moveTo: FileElement }>();
  @Output() folderAdded = new EventEmitter<{ name: string }>();
  @Output() elementRemoved = new EventEmitter<FileElement>();
  @Output() elementRenamed = new EventEmitter<FileElement>();
  @Output() navigatedDown = new EventEmitter<FileElement>();
  @Output() fileClick = new EventEmitter<FileElement>();
  @Output() elementMoved = new EventEmitter<{ element: FileElement; moveTo: FileElement }>();
  @Output() navigatedUp = new EventEmitter();
  @Output() cmd = new EventEmitter<{ cmd: string }>();

  @Input() folderDialogFunction;

  @Input() filterArgs: string = '';
  @Input() fileType: string = '';

  mode: string | null = null;

  // ---- Native DnD state ----
  hoveredFolderId: string | null = null;
  draggingFile: FileElement | null = null;
  isDragging = false;
  private ignoreNextClick = false;
  // ---- Native DnD: FILE ----
  onFileDragStart(event: DragEvent, file: FileElement) {
    if (!file || file.isFolder) return;

    this.draggingFile = file;

    if (event.dataTransfer) {
      // Put something in dataTransfer so browser treats this as a valid drag.
      event.dataTransfer.setData('application/x-file-id', String(file.id));
      event.dataTransfer.setData('text/plain', String(file.id)); // fallback
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
    }
  }
  onTileClick(element: FileElement) {
    if (this.isDragging || this.ignoreNextClick) return;
    this.navigate(element); // your existing behavior: folder navigates, file emits fileClick
  }

  onTileContextMenu(event: MouseEvent, element: FileElement, trigger: MatMenuTrigger) {
    // keep right-click working always
    event.preventDefault();
    trigger.openMenu();
  }
  onFileDragEnd(_event: DragEvent) {
    this.draggingFile = null;
    this.hoveredFolderId = null;
  }

  private isValidFileDrag(): boolean {
    return !!this.draggingFile && !this.draggingFile.isFolder;
  }

  // ---- Native DnD: FOLDER ----
  onFolderDragEnter(event: DragEvent, folder: FileElement) {
    if (!folder?.isFolder) return;
    if (!this.isValidFileDrag()) return;

    // Required so the browser shows a valid drop cursor.
    event.preventDefault();

    this.hoveredFolderId = folder.id;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onFolderDragOver(event: DragEvent, folder: FileElement) {
    if (!folder?.isFolder) return;
    if (!this.isValidFileDrag()) return;

    // MOST IMPORTANT: without this, drop will not be allowed.
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onFolderDragLeave(event: DragEvent, folder: FileElement) {
    // dragleave can fire when moving over children; only clear if truly leaving the tile.
    const related = event.relatedTarget as HTMLElement | null;
    const current = event.currentTarget as HTMLElement | null;
    if (current && related && current.contains(related)) return;

    if (this.hoveredFolderId === folder?.id) {
      this.hoveredFolderId = null;
    }
  }

  onFolderDrop(event: DragEvent, folder: FileElement) {
    if (!folder?.isFolder) return;

    event.preventDefault();

    const dragged = this.draggingFile;
    if (!dragged || dragged.isFolder) return;

    // Optional: verify payload exists (not strictly required)
    const id =
      event.dataTransfer?.getData('application/x-file-id') ||
      event.dataTransfer?.getData('text/plain');

    // Clear hover state
    this.hoveredFolderId = null;
    this.draggingFile = null;

    // Move the file into the folder
    this.moveElement(dragged, folder);
  }

  // ---- Existing behaviors ----
  onKey(_event: KeyboardEvent) { }

  onEnter(_event: KeyboardEvent) {
    if (this.filterArgs.startsWith(':')) {
      this.mode = 'command';
      this.cmd.emit({ cmd: this.filterArgs.substring(1) });
    }
  }

  ngOnChanges(_changes: SimpleChanges): void { }

  deleteElement(element: FileElement) {
    this.elementRemoved.emit(element);
  }

  navigate(element: FileElement) {
    if (element.isFolder) {
      this.filterArgs = '';
      this.navigatedDown.emit(element);
    } else {
      this.fileClick.emit(element);
    }
  }

  navigateUp() {
    this.filterArgs = '';
    this.navigatedUp.emit();
  }

  get sortedFileElements() {
    if (!this.fileElements) return [];
    return this.fileElements
      .slice()
      .sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
  }

  moveElement(element: FileElement, moveTo: FileElement) {
    this.elementMoved.emit({ element, moveTo });
  }

  openNewFolderDialog(_event: any) {
    if (this.folderDialogFunction) {
      this.folderDialogFunction(this.folderPath);
      return;
    }

    const dialogRef = this.dialog.open(NewFolderDialogComponent, { hasBackdrop: true });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.folderAdded.emit({ name: result });
    });
  }

  openRenameDialog(element: FileElement) {
    const dialogRef = this.dialog.open(RenameDialogComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        element.name = res;
        this.elementRenamed.emit(element);
      }
    });
  }

  openMenu(event: MouseEvent, _element: FileElement, viewChild: MatMenuTrigger) {
    event.preventDefault();
    viewChild.openMenu();
  }

  openFile(element: FileElement, moveTo: FileElement) {
    this.fileElements = [];
    this.openFileEmitter.emit({ element, moveTo });
  }
}
