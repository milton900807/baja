import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers } from '@angular/core';
import { PubComponent } from './pub-component';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from './pub-component-listener';


@Component({
  selector: 'ionworks-navbar',
  templateUrl: './ionworks-navbar.component.html'
})
export class IonWorksNavbarComponent implements OnInit, PubComponent {
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  menulist = []
  @Input()
  config: any;
  menu_buttons = [];
  searchTool = null;


  constructor(private msgraph: AuthService, private d: DomSanitizer, private cd: ChangeDetectorRef, private _iterableDiffers: IterableDiffers) {

  }
  select(m) {
    LionEngine.ionfunctions[m['onclick']]();
  }
  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  launch(url) {
    window.open(url, "_blank");
  }
  append(str) {
  }
  execFunction(ionfunctionid) {
    LionEngine.ionfunctions[ionfunctionid]();
  }
  ngDoCheck() {
  }
  reset() {
  }
  onInit(editor) {
  }

  init(): string {

    return '';
  }
  ngOnInit(): void {
    // if (this.resolveFunction) {
    //   console.log(" resolving the function ")
    //   this.resolveFunction(this);
    // }
  }

}