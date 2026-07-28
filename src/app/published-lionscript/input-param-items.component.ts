import {
    OnInit,
    Component,
    Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { FormBuilder } from "@angular/forms";
import { LionEngine } from '../engine/io-engine';
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'input-param-items',
    templateUrl: './input-param-items.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ',

        `.example-form {
            min-width: 150px;
            max-width: 500px;
            width: 100%;
          }`
        ,
        `.example-full-width {
            width: 100%;
          }`


    ]






})
export class InputParamItems implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    input_labels: string[];
    input_param = {};
    type_functions = {};
    group: any;
    buttons = [];
    input_functions = [];

    constructor(fb: FormBuilder) {
        this.group = fb.group({
        });
    }

    exec(button) {
        LionEngine.ionfunctions[button['function']](button['label'], this.input_param);
    }
    isTypingInInput = false;

    stopEvent(event: Event): void {
        event.stopPropagation();
    }

    onInputFocus(event: Event): void {
        this.isTypingInInput = true;
        event.stopPropagation();
    }

    onInputBlur(event: Event): void {
        this.isTypingInInput = false;
        event.stopPropagation();
    }

    applyParam(label, value, event): void {
        event.stopPropagation();
        this.input_param[label] = value;
    }
    handlePaste(event: ClipboardEvent): void {
        // Prevent the paste event from propagating
        event.stopPropagation();
        event.preventDefault();

        // Retrieve pasted text from clipboard
        const pastedText = event.clipboardData?.getData('text') || '';

        // Insert the pasted text manually (target the correct input element)
        const target = event.target as HTMLInputElement;
        if (target) {
            const currentValue = target.value;
            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;

            // Combine text properly at the cursor location
            const updatedValue = currentValue.slice(0, start) + pastedText + currentValue.slice(end);

            // Manually update the input value and fire an input event
            target.value = updatedValue;

            // Optionally trigger the Angular (input) handler manually if needed
            const inputEvent = new Event('input', { bubbles: true });
            target.dispatchEvent(inputEvent);
        }
    }


    ngOnInit(): void {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
    }
    initData: any = '';
    resolveFunction;
    apply(value: string) {
        if (this.listener) {
            // console.log ( " updating value ")
            this.listener.update("value", value);

        }
    }
    init(): string {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        if (this.data != null) {
            this.input_labels = this.data['input_labels'];
            for (let i of this.input_labels) {
                this.input_param[i] = '';
            }
            let default_values = this.data['default_values'];
            if (default_values != null) {
                for (let i of this.input_labels) {
                    if (default_values[i] != null) {
                        this.input_param[i] = default_values[i];
                        console.log(" value " + default_values[i]);
                    }
                }
            }

            this.input_functions = this.data['input_functions'];
            // if (input_functions != null) {
            // let keys = Object.keys(input_functions);
            // for (let key of keys) {
            // this.input_param[key] = LionEngine.ionfunctions[input_functions[key]];
            // }
            // }

            if (this.input_functions != null && Object.keys(this.input_functions).length > 0) {
                setTimeout(() => {
                    if (this.input_functions != null) {
                        let keys = Object.keys(this.input_functions);
                        for (let key of keys) {
                            this.input_param[key] = LionEngine.ionfunctions[this.input_functions[key]]();
                        }
                    }
                }, 500)
            }



            if (this.data['buttons'] != null) {
                this.buttons = this.data['buttons'];
            }


            this.title = this.data['title'];
            if (this.title == null) {
                this.title = '';

            }
            this.type_functions = this.data['type_functions'];
        }
        return '';
    }
    // applyParam(label, value, event): void {
    //     event.preventDefault();

    //     this.input_param[label] = value;
    // }

    get(label) {
        return this.input_param[label];
    }

    set(label, value) {
        this.input_param[label] = value;
    }

    getInputParams(): {} {
        return this.input_labels;
    }
}