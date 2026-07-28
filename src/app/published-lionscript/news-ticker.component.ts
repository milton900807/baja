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
  url?: string;
}

interface NewsResponse {
  items: NewsItem[];
}

@Component({
  selector: 'news-ticker',
  templateUrl: './news-ticker.component.html',
  styleUrls: ['./news-ticker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsTickerComponent implements OnInit, PubComponent {
  @Input() items: NewsItem[] = [];
  @Input() scrollDurationSeconds = 30;

  @Input() data: any;

  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  closeButton: any = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    debugger;

    if (!this.data) {
      return;
    }

    const referenceURL = this.data['referenceURL'];

    if (referenceURL) {
      this.loadHeadlinesFromUrl(referenceURL);
    } else {
      const keys = ['url', 'link', 'news', 'endpoint', 'value'];
      for (const key of keys) {
        if (this.data[key]) {
          this.loadHeadlinesFromUrl(this.data[key]);
          break;
        }
      }
    }

    if (this.data.title) {
      this.title = this.data.title;
    }

    if (this.data.closeButton) {
      this.closeButton = LionEngine.ionfunctions[this.data.closeButton];
    }
  }

  init(ionEngine: IoniScriptManager): string {
    return '';
  }

  private loadHeadlinesFromUrl(url: string): void {
    // Expect: { items: [ { title, url }, ... ] }
    this.http.get<NewsResponse | NewsItem[]>(url).subscribe({
      next: (res) => {
        console.log('news response', res);

        // Case 1: { items: [...] }
        if ((res as NewsResponse)?.items && Array.isArray((res as NewsResponse).items)) {
          this.items = (res as NewsResponse).items
            .map((item) => ({
              title: item.title?.trim() || '',
              url: item.url,
            }))
            .filter((item) => !!item.title);

          this.cdr.markForCheck();
          return;
        }

        // Case 2: API returns an array directly: [ { title, url }, ... ]
        if (Array.isArray(res)) {
          this.items = res
            .map((item) => ({
              title: item.title?.trim() || '',
              url: item.url,
            }))
            .filter((item) => !!item.title);

          this.cdr.markForCheck();
          return;
        }

        console.warn('Unexpected news response shape', res);
      },
      error: (err) => {
        console.error('Failed to load news from', url, err);
      },
    });
  }
}
