import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Article {
  title: string;
  body: string;
}

@Component({
  selector: 'news-editor',
  templateUrl: './news-editor.component.html',
  styleUrls: ['./news-editor.component.scss']
})  
export class NewsEditorComponent {
  @Input() set article(value: Article | null) {
    if (value) {
      this.title = value.title; 
      this.body = value.body;
    }
  }

  // Emit when user clicks Save
  @Output() saveArticle = new EventEmitter<Article>();

  title = '';
  body = '';

  onSave() {
    this.saveArticle.emit({
      title: this.title.trim(),
      body: this.body.trim()
    });
  }

  onClear() {
    this.title = '';
    this.body = '';
  }
}
