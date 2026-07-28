// file: highlight-brackets.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlightBrackets'
})
export class HighlightBracketsPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    if (value && typeof value === 'string') {
      return value.replace(/\[([^\]]+)\]/g, '<span class="bracket-word">[$1]</span>');
    } else {
      return ''
    }
  }
}
