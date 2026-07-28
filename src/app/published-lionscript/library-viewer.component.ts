import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';

import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';
import { IoniScriptManager } from '../engine/io-manager';
import { LionEngine } from '../../app/engine/io-engine';

export interface LibraryItem {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  type?: 'pdf' | 'document' | 'folder' | 'link' | 'action';
  icon?: string;
  url?: string;
  value?: any;
  action?: string;
  children?: LibraryItem[];
}

@Component({
  selector: 'library-viewer',
  templateUrl: './library-viewer.component.html',
  styleUrls: ['./library-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryViewerComponent implements OnInit, PubComponent {
  @Input() title = 'Library';
  @Input() items: LibraryItem[] = [];

  data: any;

  listener: PubComponentListener;
  resolveFunction: any;
  closeButton: any = null;

  selectedItem: LibraryItem | null = null;
  error: string | null = null;


  path = '/library'


  ngOnInit(): void {
    if (this.data) {
      if (this.data.title) {
        this.title = this.data.title;
      }



      if (this.data.closeButton) {
        this.closeButton = LionEngine.ionfunctions[this.data.closeButton];
      }

      if (this.data.close) {
        this.closeButton = LionEngine.ionfunctions[this.data.close];
      }

      if (Array.isArray(this.data.items)) {
        this.items = this.data.items;
      } else if (Array.isArray(this.data.value)) {
        this.items = this.data.value;
      } else if (!this.items?.length) {
        this.error = 'No library items found.';
      }
    }
  }

  init(ionEngine: IoniScriptManager): string {
    return '';
  }

  selectItem(item: LibraryItem): void {
    this.selectedItem = item;

    if (item.action && LionEngine.ionfunctions[item.action]) {
      LionEngine.ionfunctions[item.action](item);
      return;
    }

    if (item.url) {
      window.open(item.url, '_blank');
      return;
    }

    if (this.resolveFunction) {
      this.resolveFunction(item);
    }

    // if (this.listener?.resolve) {
    //   this.listener.resolve(item);
    // }
  }

  close(): void {
    if (this.closeButton) {
      this.closeButton();
    }
  }

  itemIcon(item: LibraryItem): string {
    if (item.icon) return item.icon;

    switch (item.type) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'document':
        return 'description';
      case 'folder':
        return 'folder';
      case 'link':
        return 'link';
      case 'action':
        return 'bolt';
      default:
        return 'article';
    }
  }
}