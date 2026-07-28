import { Component, OnInit } from '@angular/core';
import { PubComponent } from '../../pub-component';
import { LionEngine } from '../../../engine/io-engine';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { PubComponentListener } from '../../pub-component-listener';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, PubComponent {

  constructor(private sanitizer: DomSanitizer) { }

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;

  displayedColumns: string[];
  dataSource: MatTableDataSource<any>;
  selection: SelectionModel<any>;

  rawImages: string[] = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/900/500`);
  images: SafeUrl[] = [];
  links = []
  currentIndex: number = 0;

  submitIonFunction: any;
  submitButtonLabel = 'Save';


  init(): string {
    if (this.data?.images?.length > 0) {
      this.rawImages = this.data.images;
    }
    if (this.data?.links?.length > 0) {
      this.links = this.data.links;
    }
    this.images = this.rawImages.map(img => this.sanitizeImage(img));
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    return '';
  }

  ngOnInit() {
    if (this.data?.images?.length > 0) {
      this.rawImages = this.data.images;
    }
    this.images = this.rawImages.map(img => this.sanitizeImage(img));
  }

  sanitizeImage(img: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(img);
  }

  get selected() {
    return this.selection?.selected;
  }

  submit() {
    if (this.submitIonFunction) {
      this.submitIonFunction(this.selection?.selected);
    }
  }


  onImageClick(index: number): void {
    if (this.links && index < this.links.length) {
      this.links[index]();
    }
  }
  fade = true;

  next() {
    this.fade = false;
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.fade = true;
    }, 300); // 300ms should match your fade duration
  }

  prev() {
    this.fade = false;
    setTimeout(() => {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.fade = true;
    }, 300);
  }

}
