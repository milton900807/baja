import { Component, Input, OnInit } from '@angular/core';
import { SafeUrlPipe } from "./SafeUrlPipe"
import { DomSanitizer } from '@angular/platform-browser';
import { PubComponent } from './pub-component';
import { IoniScriptManager } from '../engine/io-manager';
import { PubComponentListener } from './pub-component-listener';
import { LionEngine } from '../../app/engine/io-engine';


@Component({
  selector: 'youtube',
  templateUrl: './youtube.component.html',
  styleUrls: ['./youtube.component.css']
})
export class YoutubeComponent implements OnInit, PubComponent {
  @Input() videoId: string = '';
  data: any;
  @Input() timeInSeconds: number = null;


  constructor(private sanitizer: DomSanitizer) {

  }
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  closeButton = null;

  ngOnInit(): void {

    if (this.data) {
      const keys = ['link', 'url', 'video', 'youtube', 'value'];
      for (const key of keys) {
        if (this.data[key]) {
          let url = this.data[key];
          const info = this.extractYouTubeInfo(url);
          this.videoId = info.videoId;
          this.timeInSeconds = info.timeInSeconds;
          break;
        }
      }
      if ( this.data.closeButton ){
        this.closeButton = LionEngine.ionfunctions[this.data.closeButton];
      }
    }
  }

  extractYouTubeInfo(url: string): { videoId: string; timeInSeconds: number } {
    try {
      const parsedUrl = new URL(url);
      let videoId = '';
      let timeInSeconds = 0;

      // Case 1: Standard YouTube URL (e.g., youtube.com/watch?v=...)
      if (parsedUrl.hostname.includes('youtube.com')) {
        videoId = parsedUrl.searchParams.get('v') || '';

        // Look for 't' or 'start' parameter
        const t = parsedUrl.searchParams.get('t') || parsedUrl.searchParams.get('start');
        if (t) timeInSeconds = this.parseTimeToSeconds(t);
      }

      // Case 2: Shortened URL (e.g., youtu.be/VIDEO_ID)
      if (parsedUrl.hostname === 'youtu.be') {
        videoId = parsedUrl.pathname.slice(1);
        const t = parsedUrl.searchParams.get('t');
        if (t) timeInSeconds = this.parseTimeToSeconds(t);
      }

      return { videoId, timeInSeconds };
    } catch (e) {
      return { videoId: '', timeInSeconds: 0 };
    }
  }

  // Helper to convert time string to seconds
  parseTimeToSeconds(time: string): number {
    if (!isNaN(Number(time))) return Number(time); // just seconds

    const match = time.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (!match) return 0;

    const [, h, m, s] = match.map(v => parseInt(v || '0', 10));
    return h * 3600 + m * 60 + s;
  }

  init(ionEngine: IoniScriptManager): string {
    return "";
  }

  get embedUrl(): string {
    const base = `https://www.youtube.com/embed/${this.videoId}`;
    return this.timeInSeconds ? `${base}?start=${this.timeInSeconds}` : base;
  }
}

