import {
    OnInit,
    Component,
    Input
} from "@angular/core";
import { LionEngine } from "../engine/io-engine";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'ok-panel',
    templateUrl: './okpanel.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ',
        '.okpanel-btn { background-color: #011c3c; color: #ffffff; border: 1px solid #011c3c; margin-right: 6px; }',
        '.okpanel-btn:hover, .okpanel-btn:focus, .okpanel-btn:active { background-color: #012a5a; color: #ffffff; border-color: #012a5a; }']
})
export class OKPanel implements OnInit, PubComponent {
    ionfunction: any;
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    ngOnInit(): void {
    }
    initData: any = '';
    save_function: any = null;
    visibility: string = 'Hide';
    status = "working";
    button_label = "Commit";
    resolveFunction;
    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }

        if (this.save_function) {
            this.save_function();
        }
        if (this.ionfunction) {
            this.ionfunction(value)
        }
    }
    init(): string {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        if (this.data != null) {
            this.save_function = this.data['save-function'];
            if (this.data['ionfunction'])
                this.ionfunction = LionEngine.ionfunctions[this.data['ionfunction']];
            if (this.data['ionFunction'])
                this.ionfunction = LionEngine.ionfunctions[this.data['ionFunction']];
            this.title = this.data['title'];
            this.button_label = this.data['label'];
            this.button_label = this.data['button'];
        }

        return '';
    }
}