import { Component, OnInit, Input, ChangeDetectorRef, IterableDiffer, IterableDiffers, ChangeDetectionStrategy } from '@angular/core';
import { PubComponent } from './pub-component';
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { PubComponentListener } from './pub-component-listener';


@Component({
  selector: 'gmap-viewer',
  templateUrl: './gmap-viewer.component.html',
  styleUrls: ['./gmap-viewer.component.scss'],
})
export class GMapViewerComponent implements OnInit, PubComponent {
  @ViewChild('meditor', { static: false }) _meditor: ElementRef;
  fun: any;
  showEditor = false;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  @Input()
  data = '';
  @Input()
  initData = '';
  code: string = '';
  editorOptions = { language: 'gmap', automaticLayout: true, theme: 'gmapTheme' };
  gene_hits = [];
  gene_hits_table = {};
  iterableDiffer: IterableDiffer<{}>;
  go_hits = [];


  constructor(private cd: ChangeDetectorRef, private _iterableDiffers: IterableDiffers) {
    this.iterableDiffer = this._iterableDiffers.find([]).create(null);
  }

  apply(value: string) {
    if (this.resolveFunction) {
    }
  }
  append(str) {
    this.code += str;
  }
  // [{"gene":"NOC2L","chromosome":"1","start":946660,"end":946669,"strand":"-","gene_id":"ENSG00000188976","feature_type":"protein_coding"},{"gene":"ISG15","chromosome":"1","start":1006383,"end":1006374,"strand":"+","gene_id":"ENSG00000187608","feature_type":"protein_coding"},
  appendLog(gmap_result) {
    let t = '';
    let r = gmap_result['res'];
    for (let it of r) {
      let coordinates = it['coords'];
      let start = coordinates['start']
      let end = coordinates['end']
      let chrom = coordinates['chromosome']
      let strand = coordinates['strand']
      let line = 'chr:' + chrom + '\t' + 'strand:' + strand + '\t' + start + '\t' + end

      let bi = it['base_index_range'];
      let match = it['match'];
      let seq = it['seq'];

      if (bi != null) {
        line += '\n'
        line += 'base:' + bi + '\t' + 'match:' + match + '\t' + 'matches:' + '\t' +
          '\n\t\t\t' + 'seq:' + seq;
      }
      t += line + '\n\n';
    }
    this.code = t;
  }


  ngDoCheck() {
    let changes = this.iterableDiffer.diff(this.gene_hits);
    if (changes) {
      this.cd.markForCheck();
      // console.log('Changes detected!');
    }
  }

  reset() {
    this.gene_hits = [];
    this.gene_hits_table = [];
    this.code = '';
    this.go_hits = [];
  }


  setGO(gs) {
    this.go_hits = null;
    this.go_hits = Object.assign([], gs);
  }

  printGeneContent(gjs) {
    let content = gjs['value']
    if (content != null) {
      let sc = "";
      let keys = Object.keys(content);
      for (let k of keys) {
        sc += " (" + k + "):    " + content[k];
      }
      return sc;
    }
    return content;
  }
  printGeneSymbol(gjs) {
    return gjs['gene'].trim();
  }


  appendGeneHits(gs) {
    if (this.gene_hits && this.gene_hits.length > 0) {
      this.gene_hits = this.gene_hits.concat(gs);
      // this.gene_hits = Object.assign([], gs );
    }
    else {
      this.gene_hits = Object.assign([], gs);
    }
    if (this.gene_hits.length == 0) {
      return;
    }

    this.gene_hits_table = {};
    let keys = Object.keys(this.gene_hits[0]);
    let fields = []
    for (let f of keys) {
      fields.push({ 'field': f });
    }
    this.gene_hits_table = {
      'fields': fields,
      'values': this.gene_hits
    }
  }

  toString(bo) {
    return JSON.stringify(bo);
  }


  getGeneData() {
    if (this.gene_hits && this.gene_hits.length > 0) {
      let keys = Object.keys(this.gene_hits[0]);
      let fields = []
      for (let f of keys) {
        fields.push({ 'field': f });
      }
      let dt = {
        'fields': fields,
        'values': this.gene_hits
      }
      return dt;
    } else {
      return null;
    }
  }


  setValue(str) {
    this.code = str;
  }
  onInit(editor) {
    this.fun = editor._actions['editor.action.formatDocument'];
    let waitv = setTimeout(() => {
      this.fun.run();
      clearTimeout(waitv);
    }, 500);
  }
  init(): string {
    return '';
  }
  ngOnInit(): void {


    if (this.resolveFunction) {
      this.resolveFunction(this);
    }

    let waitv = setTimeout(() => {
      this.showEditor = true;
      this.initData = this.data;
      if (this.fun)
        this.fun.run();
      clearTimeout(waitv);
    }, 1000);
  }

}
