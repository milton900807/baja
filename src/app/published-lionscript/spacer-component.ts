import { Component, Input } from '@angular/core';
import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';


@Component({
  template: `
  <div class="alert alert-success" role="alert">
  <a href="#" class="alert-link"></a>
</div>

  `
})
export class SpacerComponent implements PubComponent {
  init(): string {
    return '';
  }
  @Input() listener: PubComponentListener;
  @Input() data: any;
  resolveFunction;
  @Input() title:string;
}
