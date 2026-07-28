import { Component, OnInit, Input } from '@angular/core';
import { PubComponent } from './pub-component';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { PubComponentListener } from './pub-component-listener';


@Component({
  selector: 'script-viewer',
  templateUrl: './script-viewer.component.html',
  styleUrls: ['./jsonviewer.component.scss']
})
export class ScriptViewerComponent implements OnInit, PubComponent {
  @ViewChild('meditor', {static:false}) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  code: string = 'function x() {\nconsole.log("Hello world!");\n}';
  editorOptions = { language: 'javascript', automaticLayout: true };
  apply(value: string) {
    if (this.resolveFunction) {
    }
  }

  
  setData ( jsonString ) {
    this.code = jsonString;

  }
  getData ( )
  {
    return this.data;
  }



  onInit(editor) {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    this.fun = editor._actions['editor.action.formatDocument'];
    let waitv2 = setTimeout(() => {
      this.fun.run();
      clearTimeout(waitv2);
    }, 1500);
    let waitv = setTimeout(() => {
      this.fun.run();
      clearTimeout(waitv);
    }, 500);
  }
  init(): string {
    return '';
  }
  ngOnInit(): void {

    let waitv2 = setTimeout(() => {
      this.fun.run();
      clearTimeout(waitv2);
    }, 1500);


    let waitv = setTimeout(() => {
      this.showEditor = true;
      this.initData = this.data;
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv);
    }, 1000);
  }

}
