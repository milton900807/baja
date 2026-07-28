import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { PubComponent } from '../../pub-component';
import { LionEngine } from '../../../engine/io-engine';
import { PubComponentListener } from '../../pub-component-listener';
import { IoniScriptManager } from 'src/app/engine/io-manager';
import { MatSelectionListChange } from '@angular/material/list';

@Component({
  selector: 'selection-list',
  templateUrl: './selection-list.component.html',
  styleUrls: ['./selection-list.component.scss']
})
export class SelectionListComponent implements OnInit, AfterViewInit, PubComponent {

  @ViewChildren('listItem') listItemElements!: QueryList<ElementRef>;

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string = '';

  listItems: any[];
  contentItems: {} = {};
  selectedItems: any[] = [];

  submitIonFunction: any;
  submitButtonLabel = 'Save';
  actionIonFunction = null;
  showButton = false;
  displayButton = true;
  singleSelect = true;
  padding_top = '0px';
  color_set = {};
  itemHeights: { [key: string]: string } = {}; // Store dynamic heights


  init(ionEngine: IoniScriptManager): string {
    return '';
  }
  isBracketed(item: string): boolean {
    return item?.trim().startsWith('[');
  }

  ngOnInit() {
    this.contentItems = this.data.contentItems;
    this.listItems = this.data.listItems;
    this.selectedItems = this.listItems[0];

    if (this.data.onSubmit) {
      this.submitIonFunction = LionEngine.ionfunctions[this.data['onSubmit']];
    }
    if (this.submitIonFunction) {
      this.showButton = true;
    }
    if (this.data.button_label) {
      this.submitButtonLabel = this.data.button_label;
    }
    if (this.data.show_button != null) {
      this.displayButton = this.data.show_button;
    }
    if (this.data.title) {
      this.title = this.data.title;
      this.padding_top = '2px';
    }
    if (this.data.single_selection) {
      this.singleSelect = true;
    }
    if (this.data.button_function) {
      this.showButton = false;
      this.displayButton = false;
      this.actionIonFunction = LionEngine.ionfunctions[this.data['button_function']];
    }
    if (this.data.color_set != null) {
      this.color_set = this.data.color_set;
    }
  }

  ngAfterViewInit() {
    // Calculate the dynamic height for each list item
    setTimeout(() => {
      this.listItemElements.forEach((elementRef, index) => {
        const element = elementRef.nativeElement;
        this.itemHeights[this.listItems[index]] = `${element.scrollHeight}px`;
      });
    });
  }

  getDesc(name) {
    if (this.contentItems) {
      return this.contentItems[name];
    }
    return null;
  }

  getBackgroundColor(item) {
    return this.color_set[item] != null ? this.color_set[item] : 'rgba(184, 255, 170, 0.8)';
  }
  // Add this method to selection-list.component.ts
  getOptionBackground(item: string): string {
    // Special color for items that start with '['
    if (this.isBracketed(item)) {
      return 'rgba(25, 118, 210, 0.08)'; // subtle Material-ish blue tint
    } else if ( item === 'Close' || item === 'Back' || item === 'Back...'){
      return 'lightGray'
    }
    // Otherwise fall back to your per-item color_set or default
    return this.getBackgroundColor(item);
  }

  // keep this to match the template's trackBy
  trackByItem(index: number, item: any) {
    return item;
  }
  onChange(event) {
    this.selectedItems = event;
    if (this.actionIonFunction && this.selectedItems.length > 0) {
      if (this.displayButton) this.showButton = true;
    }
    if (this.singleSelect && this.actionIonFunction) {
      this.actionIonFunction(this.selectedItems);
    }
  }
  // new handler for selection change
  onSelectionChange(change: MatSelectionListChange) {
    const selectedValues = change.source.selectedOptions.selected.map(o => o.value);
    this.onChange(selectedValues);
  }
  submit() {
    if (this.submitIonFunction) {
      this.submitIonFunction();
    }
    if (this.actionIonFunction) {
      this.actionIonFunction(this.selectedItems);
    }
  }
}
