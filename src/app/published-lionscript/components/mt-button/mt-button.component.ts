import { Component, OnInit } from '@angular/core';
import { PubComponent } from '../../pub-component';
import { LionEngine } from '../../../engine/io-engine';
import { PubComponentListener } from '../../pub-component-listener';

@Component({
  selector: 'mt-button',
  templateUrl: './mt-button.component.html',
  styleUrls: ['./mt-button.component.scss']
})
export class MTButtonComponent implements OnInit, PubComponent {

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;
  buttons: any[];
  selected: any[] = [];
  useStyledButtons = false;
  backgroundStyle = 'white';//'linear-gradient(to right, #4facfe, #00f2fe)'; 

  init(): string {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    return '';
  }
  click(button) {
    LionEngine.ionfunctions[button.ionFunction](button);
  }

  ngOnInit() {
    if (this.data.useStyledButtons) {
      this.useStyledButtons = this.data.useStyledButtons;
    }

    this.buttons = this.data.buttons;

    if (this.data['background']) {
      this.backgroundStyle = this.data['background']
    }
    

  }


  onChange(event) {
    this.selected = event.value;
  }
}
