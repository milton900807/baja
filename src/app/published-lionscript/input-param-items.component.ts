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

        // Slimmer separators.
        `hr { border: 0; border-top: 1px solid rgba(26,163,189,0.25); margin: 6px 0; }`,

        // BUTTONS THAT LOOK LIKE BUTTONS.
        //
        // These were mat-button: text on the background, no edge, no fill. In a panel that
        // is already a column of labels and prose the only thing marking the one thing you
        // can PRESS was that it happened to be in capitals, and people were reading past
        // it. They are filled and edged now, with room around them, so the action is the
        // most visible thing in the widget rather than the least.
        //
        // A button carrying kind: 'secondary' is outlined instead of filled -- the way out
        // of a panel should be as easy to find as the way on, and not as loud.
        `.btn-group { display: flex; flex-wrap: wrap; gap: 8px; padding: 2px 0 4px; }`,
        `:host ::ng-deep .btn-group button.ip-btn.mat-mdc-button,
         :host ::ng-deep .btn-group button.ip-btn {
            min-width: 96px;
            height: 32px;
            padding: 0 18px;
            border-radius: 6px;
            border: 1px solid #0b2545;
            background: #0b2545;
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.2px;
            line-height: 30px;
            box-shadow: 0 2px 6px rgba(11,37,69,0.28);
            cursor: pointer;
          }`,
        `:host ::ng-deep .btn-group button.ip-btn .mdc-button__label { color: inherit; }`,
        `:host ::ng-deep .btn-group button.ip-btn:hover {
            background: #143a63;
            border-color: #143a63;
            box-shadow: 0 4px 10px rgba(11,37,69,0.34);
          }`,
        `:host ::ng-deep .btn-group button.ip-btn:active { box-shadow: 0 1px 3px rgba(11,37,69,0.34); }`,
        `:host ::ng-deep .btn-group button.ip-btn:focus-visible { outline: 2px solid #1aa3bd; outline-offset: 2px; }`,
        `:host ::ng-deep .btn-group button.ip-btn.ip-btn-secondary,
         :host ::ng-deep .btn-group button.ip-btn-secondary.mat-mdc-button {
            background: #ffffff;
            color: #0b2545;
            border: 1px solid #b7c4d2;
            box-shadow: none;
          }`,
        `:host ::ng-deep .btn-group button.ip-btn.ip-btn-secondary:hover {
            background: #eef3f8;
            border-color: #0b2545;
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