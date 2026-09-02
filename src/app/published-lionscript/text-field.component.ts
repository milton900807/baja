import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { LionEngine } from "../engine/io-engine";
import { HookFunctionComponent } from "./hook-function-comp";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { FunctionUtil } from "../functions/function-util";

@Component({
    selector: 'input-textfield',
    templateUrl: './text-field.component.html',
    styleUrls: ['./text-field.component.css']
})
export class TextFieldComponent implements OnInit, PubComponent, HookFunctionComponent {
    // engine: import("./pub-component").IonEngine;
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: any = '';
    @Input() title: string;
    init_text_value = ''
    value = '';
    listenerFunction;
    options: string[] = [];
    filteredOptions: Observable<string[]>;
    myControl = new FormControl();

    button_label = "Ok";
    blocking: boolean = false;
    showButton: boolean = true;
    buttonFunction: any;
    updateMeth = null;
    optionSelected = null;
    async updateValue(value) {
        this.value = value;
        if (this.listenerFunction) {
            this.listenerFunction(this.value);
        }
        if (this.updateMeth) {
            this.options = await this.updateMeth(value);
        }

        this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(value),
            map(value => this._filter(value))
        );

    }
    private _filter(value: string): string[] {
        const filterValue = value.toLowerCase();
        return this.options.filter(option => option.toLowerCase().includes(filterValue));
    }

    ngOnInit(): void {

        if (this.data != null) {
            if (this.data['show-button'] != null) {
                this.showButton = this.data['show-button'];
            }
            if (this.data['title'] != null) {
                this.title = this.data['title'];
            }
            if (this.data['button-label'] != null) {
                this.button_label = this.data['button-label']
            }
            if (this.data['text'] != null) {
                this.init_text_value = this.data['text'];
                this.value = this.init_text_value;
            }
            if (this.data['blocking'] != null) {
                this.blocking = this.data['blocking'];
            }
            if (this.data['listen-function'] != null) {
                this.listenerFunction = this.data['listen-function'];
            }
            if (this.data['ionHookFunction'] != null) {
                LionEngine.ionfunctions[this.data['ionHookFunction']](this);
            }
            if (this.data['buttonFunction'] != null) {
                this.buttonFunction = LionEngine.ionfunctions[this.data['buttonFunction']]
            }
            if (this.data['optionSelected'] != null)
                this.optionSelected = LionEngine.ionfunctions[this.data['optionSelected']]
            if (this.data['typeahead'] != null)
                this.updateMeth = LionEngine.ionfunctions[this.data['typeahead']]
            if (this.data['typeahead_url'] != null) {
                this.updateMeth = async (value) => {
                    const url = this.data['typeahead_url'];
                    const fields = this.data['typeahead_fields'];
                    if (!url || !Array.isArray(fields) || !fields.length) { return []; }
                    // The key is whatever the user typed, so it has to be escaped. Concatenated
                    // raw, a '&', '#', '+' or space ended the query string early and the endpoint
                    // saw a truncated key -- silently, as fewer suggestions rather than an error.
                    const r: any = await FunctionUtil.GETJSON(url + '?key=' + encodeURIComponent(value));
                    // GETJSON RESOLVES on failure -- catchError calls resolve(error) rather than
                    // rejecting (see functions/trail-script.ts) -- so a 404 or 500 arrives here as
                    // an HttpErrorResponse. That is truthy, which the old `if (r)` accepted, and
                    // then .map threw 'r.map is not a function' out of an rxjs next handler,
                    // where the stack said nothing about the typeahead. Test for the shape we
                    // actually need, not for truthiness.
                    if (!Array.isArray(r)) {
                        if (r) {
                            // Named, because a typeahead that silently returns nothing looks
                            // identical to an endpoint with no matches.
                            console.warn('typeahead ' + url + ' did not return a list:',
                                (r && (r.status || r.message)) ? (r.status + ' ' + r.message) : r);
                        }
                        return [];
                    }
                    return r.map(obj => {
                        let t = '';
                        for (const f of fields) {
                            // Skip a field the row does not carry: it used to render the string
                            // 'undefined' into the suggestion list.
                            const v = obj ? obj[f] : null;
                            if (v !== undefined && v !== null && v !== '') { t += `${v}, `; }
                        }
                        if (t.endsWith(', ')) { t = t.substring(0, t.length - 2); }
                        else if (t.endsWith(',')) { t = t.substring(0, t.length - 1); }
                        return t;
                    });
                };
            }
        }
    }
    getWidgetValue(param: any) {
        return this.value;
    }

    onOptionSelected(event) {
        if (this.optionSelected && event.option && event.option.value) {
            this.optionSelected(event.option.value)
        }
    }

    init(): string {
        if (!this.blocking && this.resolveFunction) {
            this.resolveFunction("");
        }
        return '';
    }
    resolveFunction;
    apply(value: string) {
        if (this.buttonFunction) {
            this.buttonFunction(value);
        }
        if (this.resolveFunction) {
            // console.log(" value " + value);
            this.resolveFunction(value);
        }
    }
}