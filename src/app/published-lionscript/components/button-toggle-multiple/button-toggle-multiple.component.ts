import { Component, OnInit } from '@angular/core';
import { PubComponent } from '../../pub-component';
import { LionEngine } from '../../../engine/io-engine';
import { PubComponentListener } from '../../pub-component-listener';

@Component({
  selector: 'button-toggle-multiple',
  templateUrl: './button-toggle-multiple.component.html',
  styleUrls: ['./button-toggle-multiple.component.scss']
})
export class ButtonToggleMultipleComponent implements OnInit, PubComponent {

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;

  buttonGroupValue: any;

  buttons: any[];
  selected: any[] = [];

  submitIonFunction: any;
  submitButtonLabel = 'Save';

  init(): string {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    return '';
  }

  ngOnInit() {
    // if (this.data !== null) {
    this.buttons = this.data.buttons;
    if (this.data.selected && this.data.selected.length > 0) {
      this.selected = this.data.selected.map(i => this.buttons[i].label);
    }

    // }

    // this.submitIonFunction = this.data['onSubmit'];
    // console.log(this.submitIonFunction);
    // if (this.data['onSubmit'])
    //   this.submitIonFunction = LionEngine.ionfunctions[this.data['onSubmit']];
    // else if (this.data['ionFunction'])
    //   this.submitIonFunction = LionEngine.ionfunctions[this.data['ionFunction']];

    // if(this.resolveFunction) {
    //   this.resolveFunction(this);
    // }
  }



  onChange(event) {
    this.selected = event.value;
  }

  click(ionFunction) {
    ionFunction(this.selected);
  }

  submit() {
    if (this.submitIonFunction) {
      // let f = LionEngine.ionfunctions[this.submitIonFunction];
      // f(this.selected);
      // LionEngine.ionfunctions[this.submitIonFunction](this.selected);

      this.submitIonFunction(this.selected);
      // LionEngine.execIon(this.submitIonFunction, this.selected);
    } else {
      console.log("Failed to find submitIonFunction");
      // console.log(" Current Buttons  " + JSON.stringify(this.buttons));
    }
  }

}
