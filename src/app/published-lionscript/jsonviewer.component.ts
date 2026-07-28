import { Component, OnInit, Input, NgZone, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { PubComponent } from './pub-component';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { PubComponentListener } from './pub-component-listener';


@Component({
  selector: 'json-viewer',
  templateUrl: './jsonviewer.component.html',
  styleUrls: ['./jsonviewer.component.scss']
})
export class JSONViewerComponent implements OnInit, OnChanges,
  PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  editorOptions = {
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    formatOnUpdate: true,
    formatOnType: true,
    formatOnPaste: true,
  };
  editor: any;
  height = '400px'
  width = '100%'


  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) { }

  ngOnChanges(changes: SimpleChanges): void {

    this.format();
  }
  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  public setData(jsonString) {
    this.data = jsonString;
    this.editor.getAction('editor.action.formatDocument').run();

  }
  getData() {
    return this.data;
  }
  setValue(jsonString) {
    this.data = jsonString
    this.format();
  }
  getContent() {
    return this.getData();
  }

  format() {


    this.zone.run(() => {

    })




    if (this.editor) {
      const model = this.editor.getModel();
      if (model) {
        this.editor.getAction('editor.action.formatDocument').run();
      }

      if (this.editor) {
        this.editor.getAction('editor.action.formatDocument').run();
      }
      if (this.editor) {
        setTimeout(() => {
          this.editor.getAction('editor.action.formatDocument').run();
        }
          , 100);
      }
    }
  }


  onInit(editorInstance) {
    this.editor = editorInstance;
    this.cdr.detectChanges();
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }

  }
  init(): any {
    if (this.resolveFunction) {
      this.resolveFunction(this)
    }
  }
  ngOnInit(): void {
    let waitv2 = setTimeout(() => {
      if (this.fun != null) {
        this.fun.run();

      }
      clearTimeout(waitv2);
    }, 1500);

    this.showEditor = true;
    // this.code = this.data;
    let waitv = setTimeout(() => {
      this.format();
      clearTimeout(waitv);
    }, 1000);

    if (this.resolveFunction)
      this.resolveFunction(this)

  }

}
