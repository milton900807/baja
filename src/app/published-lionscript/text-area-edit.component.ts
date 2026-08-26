import {
    OnInit,
    Component,
    Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from "../engine/io-engine";
import { HookFunctionComponent } from "./hook-function-comp";
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'text-area-edit',
    templateUrl: './text-area-edit.component.html',
    styleUrls: ['./text-area-edit.component.css']
})
export class TextAreaEditComponent implements OnInit, PubComponent, HookFunctionComponent {
    // engine: import("./pub-component").IonEngine;
    @Input() listener: PubComponentListener;
    @Input() data;
    initData: any = '';
    @Input() title: string;
    isValid = true;
    init_text = '';
    button_label = "Apply";
    ionfunction = '';
    showButton = true;
    width = "100%";
    height = "100%";
    editable = true;
    value = ''
    rows = 7;


    getWidgetValue(param: any) {
        return this.init_text;
    }

    updateValue(value) {
        this.init_text = value;
        this.value = value;   // keep the ngModel display in sync (used to prefill/clear examples)
    }

    append(value) {
        this.init_text += value;
    }
    appendLn(value) {
        this.init_text += '\n';
        this.init_text += value;
    }




    ngOnInit(): void {
        if (this.data != null) {
            // console.log ( " data : " + this.data );
            // this.initData = this.data;
            if (this.data['text'] != null) {
                this.init_text = this.data['text']
                this.value = this.data['text']
            }
            if (this.data['height'] != null) {
                this.height = this.data['height']
            }
            if (this.data['ionfunction'] != null) {
                this.ionfunction = this.data['ionfunction']
            }
            if (this.data['ionFunction'] != null) {
                this.ionfunction = this.data['ionFunction']
            }
            if (this.data['button-label'] != null) {
                this.button_label = this.data['button-label']
            }
            if (this.data['showButton'] != null) {
                this.showButton = this.data['showButton']
            }
            if (this.data['edtiable'] != null) {
                this.editable = this.data['edtiable']
            }

            if (this.data['rows'] != null) {
                this.rows = this.data['rows']
            }


            if (this.data['ionHookFunction']) {
                LionEngine.ionfunctions[this.data['ionHookFunction']](this);
            }
        }
    }


    onKeydown(event: KeyboardEvent): void {
        event.stopPropagation();
    }

    // Fires when the textarea gains focus. Lets a caller pass data['onFocus'] (an ion
    // function) e.g. to clear an example/placeholder the first time the user clicks in.
    onFocus(): void {
        try {
            const f = this.data && this.data['onFocus'];
            if (f && LionEngine.ionfunctions[f]) { LionEngine.execIon(f, this.init_text); }
        } catch (e) { }
    }
    init(): string {
        if (this.data['showButton']) {
            this.showButton = this.data['showButton']
        }

        return '';
    }
    resolveFunction;
    apply() {
        this.isValid = false;
        if (this.ionfunction != null && LionEngine.ionfunctions[this.ionfunction]) {
            // console.log ( " ion function : " + this.ionfunction );
            LionEngine.execIon(this.ionfunction, this.value);
        }
        if (this.resolveFunction) {
            // console.log(" value " + value);
            this.resolveFunction(this.value);
        }
    }
}