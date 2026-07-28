import { Component, Input } from '@angular/core';
import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';


@Component({
  template: `

  <div>
    <hr>
   {{ data }} </div>


  `
})
export class SimpleProfileComponent implements PubComponent {
  // engine: import("./pub-component").IonEngine;
  @Input() listener: PubComponentListener;
  @Input() data: any;
  @Input() resolveFunction;
  @Input() title;
  init(): string {
    return '';
  }
}
