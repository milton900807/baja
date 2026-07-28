import { Type } from '@angular/core';

export class PubItem {
  constructor(public component: Type<any>, public data: any) {}
}
