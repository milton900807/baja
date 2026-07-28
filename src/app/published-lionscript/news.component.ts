import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface NewsItem {
  title: string;
  url?: string;
  timestamp?: Date | string;
  source?: string;
}

@Component({
  selector: 'news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsComponent {
  @Input() item!: NewsItem;
}
