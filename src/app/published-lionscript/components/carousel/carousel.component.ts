import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class CarouselComponent implements OnInit, OnDestroy, PubComponent {

  constructor(private sanitizer: DomSanitizer) { }

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;

  displayedColumns: string[];
  dataSource: MatTableDataSource<any>;
  selection: SelectionModel<any>;

  rawImages: string[] = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/1200/675`);
  images: SafeUrl[] = [];
  links: any[] = [];
  captions: string[] = [];
  currentIndex = 0;

  // Autoplay (configurable via data.autoplay / data.interval).
  autoplay = true;
  interval = 5500;
  private timer: any = null;
  private touchX: number | null = null;

  submitIonFunction: any;
  submitButtonLabel = 'Save';

  private applyConfig(): void {
    if (this.data?.images?.length > 0) this.rawImages = this.data.images;
    if (this.data?.links?.length > 0) this.links = this.data.links;
    if (this.data?.captions?.length > 0) this.captions = this.data.captions;
    if (this.data?.autoplay != null) this.autoplay = !!this.data.autoplay;
    if (this.data?.interval) this.interval = Math.max(1500, +this.data.interval);
    this.images = this.rawImages.map(img => this.sanitizeImage(img));
  }

  init(): string {
    this.applyConfig();
    this.startAutoplay();
    if (this.resolveFunction) this.resolveFunction(this);
    return '';
  }

  ngOnInit(): void {
    this.applyConfig();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  sanitizeImage(img: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(img);
  }

  get selected() { return this.selection?.selected; }

  submit() {
    if (this.submitIonFunction) this.submitIonFunction(this.selection?.selected);
  }

  onImageClick(index: number): void {
    if (this.links && index < this.links.length && typeof this.links[index] === 'function') {
      this.links[index]();
    }
  }

  // --- navigation (crossfade handled purely in CSS via the .active slide) ---------------
  goTo(index: number): void {
    if (!this.images.length) return;
    this.currentIndex = (index + this.images.length) % this.images.length;
  }
  next(): void { this.goTo(this.currentIndex + 1); this.restartAutoplay(); }
  prev(): void { this.goTo(this.currentIndex - 1); this.restartAutoplay(); }

  // --- autoplay -------------------------------------------------------------------------
  startAutoplay(): void {
    this.stopAutoplay();
    if (this.autoplay && this.hasMultiple) {
      this.timer = setInterval(() => this.goTo(this.currentIndex + 1), this.interval);
    }
  }
  stopAutoplay(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  restartAutoplay(): void { if (this.autoplay && this.hasMultiple) this.startAutoplay(); }
  pause(): void { this.stopAutoplay(); }
  resume(): void { this.restartAutoplay(); }

  get isPlaying(): boolean { return this.timer != null; }
  toggleAutoplay(): void {
    this.autoplay = !this.isPlaying;
    this.autoplay ? this.startAutoplay() : this.stopAutoplay();
  }

  // --- touch / pointer swipe ------------------------------------------------------------
  onPointerDown(e: PointerEvent): void { this.touchX = e.clientX; this.pause(); }
  onPointerUp(e: PointerEvent): void {
    if (this.touchX != null) {
      const dx = e.clientX - this.touchX;
      if (Math.abs(dx) > 40) { dx < 0 ? this.next() : this.prev(); }
      this.touchX = null;
    }
    this.resume();
  }

  get hasMultiple(): boolean { return this.images.length > 1; }
}
