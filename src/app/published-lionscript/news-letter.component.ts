import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';
import { IoniScriptManager } from '../engine/io-manager';
import { LionEngine } from '../../app/engine/io-engine';

export interface NewsItem {
  title: string;
  url?: string;   // original viewer link
  path?: string;  // optional raw internal path (for /ln)
  desc?: string;  // optional description to pass to /ln
}

@Component({
  selector: 'news-letter',
  templateUrl: './news-letter.component.html',
  styleUrls: ['./news-letter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterComponent implements OnInit, PubComponent {
  @Input() items: NewsItem[] = [];
  @Input() data: any;         // can be string[] of URLs OR legacy object config
  @Input() showDate = true;

  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  closeButton: any = null;

  // multiple endpoints
  private sourceUrls: string[] = [];
  currentSourceIndex = 0;

  private readonly defaultLnEndpoint = '/ln';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (!this.data) {
      return;
    }

    this.initSourcesFromData();

    // Optional title only if data is an object
    if (!Array.isArray(this.data) && this.data.title) {
      this.title = this.data.title;
    }

    // Optional close button only if data is an object
    if (!Array.isArray(this.data) && this.data.closeButton) {
      this.closeButton = LionEngine.ionfunctions[this.data.closeButton];
    }

    if (this.sourceUrls.length > 0) {
      this.loadHeadlinesFromUrl(this.sourceUrls[this.currentSourceIndex]);
    }
  }

  init(ionEngine: IoniScriptManager): string {
    return '';
  }

  // ---------------------------------------------------
  // Initialize sourceUrls from `data`
  // ---------------------------------------------------
  private initSourcesFromData(): void {
    const urls: string[] = [];

    // Case A: data is already an array of URLs
    if (Array.isArray(this.data)) {
      this.data
        .filter(v => typeof v === 'string')
        .map((v: string) => v.trim())
        .filter(v => v.length > 0)
        .forEach(v => urls.push(v));
    } else if (this.data && typeof this.data === 'object') {
      // Case B: legacy object-based config

      // 1) referenceURL can itself be an array of URLs
      const ref = this.data.referenceURL;
      if (Array.isArray(ref)) {
        ref
          .filter((v: any) => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter(v => v.length > 0)
          .forEach(v => urls.push(v));
      } else if (typeof ref === 'string') {
        // or a single string / delimited list
        ref
          .split(/[\n,;]+/)
          .map((v: string) => v.trim())
          .filter(v => v.length > 0)
          .forEach(v => urls.push(v));
      }

      // 2) For backwards compatibility, also look at some older keys
      const possibleKeys = ['url', 'link', 'news', 'endpoint', 'value'];

      for (const key of possibleKeys) {
        const value = this.data[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          value
            .filter((v: any) => typeof v === 'string')
            .map((v: string) => v.trim())
            .filter(v => v.length > 0)
            .forEach(v => urls.push(v));
        } else if (typeof value === 'string') {
          value
            .split(/[\n,;]+/)
            .map((v: string) => v.trim())
            .filter(v => v.length > 0)
            .forEach(v => urls.push(v));
        }
      }
    }

    // De-dupe, keep order
    this.sourceUrls = Array.from(new Set(urls));
  }

  // ---------------------------------------------------
  // Load stories from the current source URL
  // ---------------------------------------------------
  private loadHeadlinesFromUrl(url: string): void {
    if (!url) {
      this.items = [];
      this.cdr.markForCheck();
      return;
    }

    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('newsletter news response', url, res);

        // Case 1: API returns an array
        if (Array.isArray(res)) {
          this.items = res
            .map((item: any) => ({
              title: item.title ?? item.headline ?? item.text ?? '',
              url: item.url ?? item.link ?? '',
              path: item.path,
              desc: item.desc ?? item.summary,
            }))
            .filter(item => !!item.title);

          this.cdr.markForCheck();
          return;
        }

        // Case 2: { items: [...] }
        if (res && Array.isArray(res.items)) {
          this.items = res.items
            .map((item: any) => ({
              title: item.title ?? item.headline ?? item.text ?? '',
              url: item.url ?? item.link ?? '',
              path: item.path,
              desc: item.desc ?? item.summary,
            }))
            .filter(item => !!item.title);

          this.cdr.markForCheck();
          return;
        }

        // Case 3: plain text
        if (typeof res === 'string') {
          this.items = this.parseTextToHeadlines(res);
          this.cdr.markForCheck();
          return;
        }

        // Fallback
        this.items = [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load newsletter news from', url, err);
        this.items = [];
        this.cdr.markForCheck();
      },
    });
  }

  private parseTextToHeadlines(text: string): NewsItem[] {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        const [title, url] = parts;
        return {
          title: (title || '').trim(),
          url: (url || '').trim(),
        } as NewsItem;
      })
      .filter(item => !!item.title);
  }

  // ---------------------------------------------------
  // /ln wrapper logic
  // ---------------------------------------------------
  getItemLink(item: NewsItem): string | null {
    if (!item) return null;

    // ----------------------------
    // 1) Try extracting ln endpoint
    // ----------------------------
    let lnEndpoint = this.defaultLnEndpoint;

    if (item.url) {
      try {
        const base =
          (typeof window !== 'undefined' && window.location?.origin) ||
          'http://localhost';

        const u = new URL(item.url, base);

        // detect any endpoint ending in "/ln"
        if (u.pathname.endsWith('/ln')) {
          lnEndpoint = `${u.origin}${u.pathname}`;
        }
      } catch {
        // ignore, fallback below
      }
    }

    // If data explicitly defines lnEndpoint, override
    if (!Array.isArray(this.data) && this.data?.lnEndpoint) {
      lnEndpoint = this.data.lnEndpoint;
    }

    // ----------------------------
    // 2) Extract internal path
    // ----------------------------
    let path = item.path;

    if (!path && item.url) {
      const extracted = this.extractInternalPathFromUrl(item.url);
      if (extracted) {
        path = extracted;
      }
    }

    // If still nothing, return raw URL
    if (!path) {
      return item.url || null;
    }

    // ----------------------------
    // 3) Build /ln?path=.... link
    // ----------------------------
    const title = item.title || '';
    const desc = item.desc || title;

    const params: string[] = [];
    params.push('path=' + encodeURIComponent(path));
    if (title) params.push('title=' + encodeURIComponent(title));
    if (desc) params.push('desc=' + encodeURIComponent(desc));

    return `${lnEndpoint}?${params.join('&')}`;
  }


  private extractInternalPathFromUrl(url: string): string | null {
    try {
      const base =
        (typeof window !== 'undefined' && window.location?.origin) ||
        'http://localhost';
      const u = new URL(url, base);
      const p = u.searchParams.get('path');
      if (!p) return null;

      // Try to decode once; if that fails, just return raw
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------
  // Pager (browse series of URLs)
  // ---------------------------------------------------
  get hasItems(): boolean {
    return !!this.items && this.items.length > 0;
  }

  get today(): Date {
    return new Date();
  }

  get hasMultipleSources(): boolean {
    return this.sourceUrls.length > 1;
  }

  get currentSourceLabel(): string {
    if (!this.sourceUrls.length) return '';
    return `${this.currentSourceIndex + 1} / ${this.sourceUrls.length}`;
  }

  get canGoPrev(): boolean {
    return this.currentSourceIndex > 0;
  }

  get canGoNext(): boolean {
    return this.currentSourceIndex < this.sourceUrls.length - 1;
  }

  goPrev(): void {
    if (!this.canGoPrev) return;
    this.currentSourceIndex--;
    this.loadHeadlinesFromUrl(this.sourceUrls[this.currentSourceIndex]);
  }

  goNext(): void {
    if (!this.canGoNext) return;
    this.currentSourceIndex++;
    this.loadHeadlinesFromUrl(this.sourceUrls[this.currentSourceIndex]);
  }
}
