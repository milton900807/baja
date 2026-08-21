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
        // Tropical, compact prompt fields. Encapsulation is Emulated, so these
        // (and the ::ng-deep Material overrides) stay scoped to this component.
        ':host { display: block; font-size: 12px; }',
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300; }',
        '.shadow-textarea textarea.form-control { padding-left: 0.8rem; }',

        `.example-form {
            min-width: 140px;
            max-width: 300px;
            width: 100%;
            margin-bottom: 4px;
          }`,
        `.example-form label {
            color: #0a2540;
            font-weight: 600;
            font-size: 12px;
            display: block;
            margin-bottom: 2px;
          }`,
        `.example-full-width { width: 100%; }`,

        // Compact + tropical Material field internals.
        `:host ::ng-deep .example-form .mat-mdc-text-field-wrapper,
         :host ::ng-deep .example-form .mat-form-field-wrapper {
            background: #ffffff;
            border: 1px solid #1aa3bd;
            border-radius: 6px;
            padding: 0 8px;
          }`,
        `:host ::ng-deep .example-form .mat-mdc-form-field-infix,
         :host ::ng-deep .example-form .mat-form-field-infix {
            min-height: 26px;
            padding: 3px 0;
            border-top: 0;
          }`,
        `:host ::ng-deep .example-form input.mat-mdc-input-element,
         :host ::ng-deep .example-form input.mat-input-element {
            color: #0a2540;
            font-size: 12px;
            caret-color: #1aa3bd;
          }`,
        // Hide Material's own underline; the cyan border above is the frame.
        `:host ::ng-deep .example-form .mdc-line-ripple,
         :host ::ng-deep .example-form .mat-mdc-form-field-subscript-wrapper,
         :host ::ng-deep .example-form .mat-form-field-underline,
         :host ::ng-deep .example-form .mat-form-field-subscript-wrapper {
            display: none;
          }`,

        // Slimmer separators + tropical button text.
        `hr { border: 0; border-top: 1px solid rgba(26,163,189,0.25); margin: 6px 0; }`,
        `:host ::ng-deep .btn-group button { color: #0a2540; }`
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