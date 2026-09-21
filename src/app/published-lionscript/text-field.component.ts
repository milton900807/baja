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

    // ---- the suggestion list (see the panel in the template) ----------------------
    @ViewChild('tfInput') tfInput: ElementRef<HTMLInputElement>;
    acOpen = false;
    acItems: string[] = [];
    acIndex = 0;
    acAbove = false;
    acStyle: { [k: string]: string } = {};
    /** Bumped per keystroke: a slow /gene-lookup must not overwrite a newer one. */
    private acSeq = 0;

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
            const seq = ++this.acSeq;
            const got = await this.updateMeth(value);
            // A reply that arrives after a later keystroke is stale: showing it would
            // offer suggestions for text the field no longer holds.
            if (seq !== this.acSeq) { return; }
            this.options = Array.isArray(got) ? got : [];
        }
        this.acRefresh();
    }

    private _filter(value: string): string[] {
        const filterValue = ('' + (value || '')).toLowerCase();
        const out = this.options.filter(option => ('' + option).toLowerCase().includes(filterValue));
        // The endpoint already ranks best-match first; cap the list rather than scroll
        // through hundreds of rows on a phone.
        return out.slice(0, 60);
    }

    /** Rebuild the list from what is in the field, and open it if anything matches. */
    acRefresh(): void {
        if (!this.options || !this.options.length) { this.acOpen = false; return; }
        const items = this._filter(this.value);
        // One option identical to what is typed is not a choice, it is what you have.
        if (!items.length || (items.length === 1 && items[0].toLowerCase() === ('' + (this.value || '')).toLowerCase())) {
            this.acOpen = false;
            return;
        }
        this.acItems = items;
        this.acIndex = 0;
        this.acOpen = true;
        this.acPlace();
    }

    /** Where the panel goes: under the field, or above it when the room is below. */
    private acPlace(): void {
        const el = this.tfInput?.nativeElement;
        if (!el) { return; }
        const r = el.getBoundingClientRect();
        const longest = this.acItems.reduce((n, o) => Math.max(n, ('' + o).length), 12);
        const width = Math.max(240, Math.min(560, Math.min(longest * 7.2 + 32, window.innerWidth - 16)));
        const below = window.innerHeight - r.bottom;
        this.acAbove = below < 220 && r.top > below;
        this.acStyle = {
            left: Math.round(Math.max(8, Math.min(r.left, window.innerWidth - width - 8))) + 'px',
            width: Math.round(width) + 'px',
            top: this.acAbove ? '' : Math.round(r.bottom + 4) + 'px',
            bottom: this.acAbove ? Math.round(window.innerHeight - r.top + 4) + 'px' : '',
            maxHeight: Math.round(Math.max(160, Math.min(360, this.acAbove ? r.top - 16 : below - 16))) + 'px',
        };
    }

    /** Take a suggestion: it fills the field, exactly as picking a mat-option did. */
    acAccept(option: string): void {
        this.acOpen = false;
        this.init_text_value = option;
        this.value = option;
        // Assigning through [(ngModel)] does not fire ngModelChange, so the listener has
        // to be called here -- the Material option used to reach it through the view.
        if (this.listenerFunction) { this.listenerFunction(this.value); }
        if (this.optionSelected) { this.optionSelected(option); }
        try { this.tfInput?.nativeElement?.focus(); } catch (e) { }
    }

    acKey(e: KeyboardEvent): void {
        if (!this.acOpen || !this.acItems.length) {
            if (e.key === 'ArrowDown') { this.acRefresh(); }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault(); this.acIndex = Math.min(this.acItems.length - 1, this.acIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); this.acIndex = Math.max(0, this.acIndex - 1);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault(); this.acAccept(this.acItems[this.acIndex]);
        } else if (e.key === 'Escape') {
            // Only the list closes: the dialog around it stays open.
            e.preventDefault(); e.stopPropagation(); this.acOpen = false;
        }
    }

    acBlur(): void {
        // A pick is a mousedown with preventDefault, so focus never leaves and this does
        // not race it; the delay is only for a tap that lands outside the panel.
        setTimeout(() => { this.acOpen = false; }, 120);
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
                    // ONE LINE PER DISTINCT SUGGESTION. These endpoints return one row per
                    // JOIN, not per thing: /gene-lookup carries a row for every synonym a
                    // gene has, so a search for SOD offered SOD1 three times over. Whatever
                    // the row count, what the list is offering is the set of distinct
                    // strings -- an option that reads identically to the one above it is
                    // not a second choice, it is the same choice again.
                    //
                    // First occurrence wins, so the endpoint's own ordering (best match
                    // first) survives. Empty rows are dropped: a row carrying none of the
                    // requested fields rendered as a blank, unselectable line.
                    const seen = new Set<string>();
                    const outv: string[] = [];
                    for (const obj of r) {
                        let t = '';
                        for (const f of fields) {
                            // Skip a field the row does not carry: it used to render the string
                            // 'undefined' into the suggestion list.
                            const v = obj ? obj[f] : null;
                            if (v !== undefined && v !== null && v !== '') { t += `${v}, `; }
                        }
                        if (t.endsWith(', ')) { t = t.substring(0, t.length - 2); }
                        else if (t.endsWith(',')) { t = t.substring(0, t.length - 1); }
                        if (!t) { continue; }
                        if (seen.has(t)) { continue; }
                        seen.add(t);
                        outv.push(t);
                    }
                    return outv;
                };
            }
        }
    }
    getWidgetValue(param: any) {
        return this.value;
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