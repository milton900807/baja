import {
    OnInit,
    OnDestroy,
    Component,
    ViewChild,
    ChangeDetectorRef,
    ElementRef,
    AfterViewInit,
    ViewEncapsulation,
    NgZone,
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from "../engine/io-engine";
import { PubComponentListener } from "./pub-component-listener";
import {
    MatAutocompleteTrigger,
    MatAutocompleteSelectedEvent,
} from "@angular/material/autocomplete";
import { MatMenuTrigger } from "@angular/material/menu";
import { FormControl } from "@angular/forms";
import { Observable, of, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { QueryList, ViewChildren } from "@angular/core";


type Cmd = { label: string; insert?: string; args?: string; hint?: string };

type TriggerSpan = {
    kind: "trigger"; // unified for all trigger chars
    ch:
    | "="
    | "["
    | "("
    | "+"
    | "-"
    | "*"
    | "/"
    | "^"
    | "%"
    | "!"
    | "<"
    | ">"
    | ","; // which char
    start: number; // index of the trigger char
    insertStart: number; // start + 1
    term: string; // text after trigger up to caret (trim-left)
};

@Component({
    selector: "simple-menu",
    templateUrl: "./simple-menu.component.html",
    styleUrls: ["./simple-menu.component.css"],
    encapsulation: ViewEncapsulation.None,
})
export class SimpleMenuComponent
    implements OnInit, AfterViewInit, OnDestroy, PubComponent {
    listener: PubComponentListener;
    model: any;
    data: any;
    resolveFunction: any;

    title: string;
    buttons: any[] = [];
    initData: any = "";
    save_function: any = null;
    visibility = "Hide";
    status = "working";
    button_label = "Commit";
    menus: any[] = [];
    visible = true;
    title_font_size = 8;
    container = "basic-container";
    mat_tools = "menu-bar mat-elevation-z1";

    cmd: any;
    textFieldValue = "";
    placeholder = "...";
    isPrimaryCommandInput = true;

    @ViewChildren("textInput") textInputs!: QueryList<ElementRef<HTMLInputElement>>;
    // All top-level dropdown triggers, so opening one can close the rest.
    @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;

    /** Close every other open top-level menu (called when one opens). */
    closeOtherMenus(current: MatMenuTrigger): void {
        if (!this.menuTriggers) return;
        this.menuTriggers.forEach((t) => {
            if (t !== current && t.menuOpen) {
                try { t.closeMenu(); } catch (e) { }
            }
        });
    }

    get textInput(): ElementRef<HTMLInputElement> | undefined {
        return this.textInputs?.first;
    }





    caretInWindow = false;
    @ViewChild(MatAutocompleteTrigger) autoTrigger?: MatAutocompleteTrigger;

    commands: Cmd[] = [];
    cmdCtrl = new FormControl<string | Cmd>("");
    filteredCmds$: Observable<Cmd[]> = of([]);
    caretPos = 0;

    private snapText = "";
    private snapCaret = 0;

    private lastTriggerStart: number | null = null;
    private lastTriggerKind: TriggerSpan["kind"] | null = null;

    private panelSub?: Subscription;

    shouldAutocomplete = false;
    userTxt = "";

    // show full list once after typing a trigger
    private justTriggered = false;

    menu_button_color = "lightGray";

    // Optional "load a track first" guard: when guardFn() is truthy, every top-level menu
    // whose label is NOT in guardAllow is blocked (its dropdown won't open / its action
    // won't fire) and onBlockedFn() is called instead. Labels in guardHighlight get a
    // sunset-orange highlight to point the user at what to do (e.g. the Track menu).
    guardFn: any = null;
    onBlockedFn: any = null;
    guardAllow: string[] = [];
    guardHighlight: string[] = [];
    readonly GUARD_HL_BG = "#FD5E53";   // sunset orange
    readonly GUARD_HL_FG = "#000000";

    // which characters open autocomplete (math operators + brackets + comma)
    private readonly TRIGGER_CHARS: Array<TriggerSpan["ch"]> = [
        "=",
        "+",
        "-",
        "*",
        "/",
        "^",
        "%",
        "!",
        "<",
        ">",
        "(",
        "[",
        ",",
    ];
    txtListener: any;

    constructor(private cdr: ChangeDetectorRef, private zone: NgZone) { }

    /** Public API to load commands */
    setCommands(
        cmds: Array<string | Partial<Cmd>>,
        opts: { replace?: boolean } = { replace: true }
    ): void {
        const normalized = (cmds ?? []).map(this.normalizeCmd);
        this.commands = opts.replace ? normalized : [...this.commands, ...normalized];

        const v = this.cmdCtrl.value;
        this.cmdCtrl.setValue(v, { emitEvent: true });
        this.cdr.markForCheck();
    }

    private normalizeCmd = (c: string | Partial<Cmd>): Cmd => {
        if (typeof c === "string") return { label: c, insert: `${c} ` };
        const label = (c.label ?? "").trim();
        if (!label) throw new Error('Each command must have a non-empty "label".');
        return {
            label,
            insert: c.insert ?? `${label} `,
            args: c.args ?? "",
            hint: c.hint ?? "",
        };
    };

    private handleFocus = () => {
        const el = this.textInput?.nativeElement;
        if (!el) return;
        // setTimeout(() => el.select(), 0);
    };

    onCmdKeyDown(event: KeyboardEvent): void {
        event.stopPropagation();

        // Optional: block global handlers / hotkeys from seeing this first
        event.stopImmediatePropagation();

        // Only prevent default for keys you fully handle yourself.
        // Do NOT blindly preventDefault(), or typing/autocomplete may break.
        if (event.key === 'Enter') {
            event.preventDefault();
            this.submitText();
            return;
        }

        this.onKeyDown(event);
    }

    private handleMouseUp = (e: MouseEvent) => {
        const el = this.textInput?.nativeElement;
        if (!el) return;
        const valueLen = el.value?.length ?? 0;
        const selStart = el.selectionStart ?? 0;
        const selEnd = el.selectionEnd ?? 0;

        // If the entire text is currently selected, treat this click as
        // "deselect and put caret at the end"
        if (valueLen > 0 && selStart === 0 && selEnd === valueLen) {
            e.preventDefault(); // stop the browser from changing selection
            // collapse selection to the end
            // el.setSelectionRange(valueLen, valueLen);
            return;
        }

        // Otherwise, let the browser handle selection normally
    };

    selectText(): void {
        if (this.textInput) this.textInput.nativeElement.select();
    }

    setText(str: string): void {
        if (str != null && typeof str === "string") {
            const cleaned = this.stripAllWS(str);
            this.cmdCtrl.setValue(cleaned, { emitEvent: false });
            this.textFieldValue = cleaned;
        } else {
            this.cmdCtrl.setValue("" + str, { emitEvent: false });
        }
    }

    init(): string {
        return "";
    }

    private currentInputString(): string {
        const el = this.textInput?.nativeElement;
        if (el && typeof el.value === "string") return el.value;
        const v = this.cmdCtrl.value;
        return typeof v === "string" ? v : v?.label ?? "";
    }

    submitText(): void {
        const val = this.currentInputString();
        this.userTxt = val;
        this.cmd?.(val, this);
    }

    displayCmd = (val?: string | Cmd) =>
        typeof val === "string" ? val : val?.label ?? "";

    ngAfterViewInit(): void {
        this.cdr.detectChanges();
        const el = this.textInput?.nativeElement;
        if (el) {
            el.addEventListener("focus", this.handleFocus, { once: false });
            el.addEventListener("mouseup", this.handleMouseUp);
        }

        if (this.autoTrigger?.autocomplete) {
            this.panelSub = this.autoTrigger.panelClosingActions.subscribe(() => {
                /* no-op */
            });
        }
    }

    ngOnDestroy(): void {
        this.panelSub?.unsubscribe();
        const el = this.textInput?.nativeElement;
        if (el) {
            el.removeEventListener("focus", this.handleFocus);
            el.removeEventListener("mouseup", this.handleMouseUp);
        }
        this.panelSub?.unsubscribe();
    }

    // ---------- Trigger detection & commits ----------
    private getLastTriggerSpan(text: string, caret: number): TriggerSpan | null {
        const safeText = text ?? "";
        const safeCaret = Math.max(0, Math.min(caret ?? 0, safeText.length));
        const before = safeText.slice(0, safeCaret);

        let bestIdx = -1;
        let bestCh: TriggerSpan["ch"] | null = null;
        for (const ch of this.TRIGGER_CHARS) {
            const idx = before.lastIndexOf(ch);
            if (idx > bestIdx) {
                bestIdx = idx;
                bestCh = ch;
            }
        }
        if (bestIdx === -1 || !bestCh) return null;

        const insertStart = bestIdx + 1;
        const termRaw = safeText.slice(insertStart, safeCaret);
        const term = termRaw.replace(/^\s+/, ""); // allow spaces after trigger, but not counted in term
        return { kind: "trigger", ch: bestCh, start: bestIdx, insertStart, term };
    }

    /** Append-mode completion commit relative to the trigger region */
    private commitPickAtTriggerAppend(
        pick: string | Cmd,
        liveText: string,
        caret: number
    ): { next: string; pos: number } {
        const span = this.getLastTriggerSpan(liveText, caret);
        if (!span) return { next: liveText, pos: caret };

        const rawInsert =
            typeof pick === "string" ? pick : pick?.insert ?? pick?.label ?? "";
        const insert = rawInsert.trim();

        const caretSafe = Math.max(0, Math.min(caret, liveText.length));
        const typed = liveText.slice(span.insertStart, caretSafe).trimLeft();
        const tail = insert.startsWith(typed) ? insert.slice(typed.length) : insert;

        const before = liveText.slice(0, caretSafe);
        const after = liveText.slice(caretSafe);
        const next = before + tail + after;
        const pos = before.length + tail.length;
        return { next, pos };
    }

    private appendFromPick(label: string) {
        const baseText = this.snapText;
        const caret = this.snapCaret;
        const { next, pos } = this.commitPickAtTriggerAppend(label, baseText, caret);

        setTimeout(() => {
            this.setValueStripWS(next, pos, true);
            const span = this.getLastTriggerSpan(next, pos);
            this.shouldAutocomplete = !!span;
            if (this.shouldAutocomplete && this.autoTrigger?.autocomplete) {
                this.autoTrigger.openPanel();
            }
        }, 0);
    }

    // ---------- Lifecycle / reactive filtering ----------

    ngOnInit(): void {





        // Reactive pipeline – active whenever there is ANY trigger before the caret
        this.filteredCmds$ = this.cmdCtrl.valueChanges.pipe(
            startWith(""),
            map((v) => (typeof v === "string" ? v : v?.label ?? "")),
            map((text) => {
                const caret = this.caretPos ?? (text?.length ?? 0);

                const span = this.getLastTriggerSpan(text, caret);
                this.shouldAutocomplete = !!span;

                // Close if last char is ) or ]
                const lastChar =
                    text && caret > 0 ? (text as string)[caret - 1] : null;
                if (lastChar === ")" || lastChar === "]") {
                    if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                    this.lastTriggerStart = null;
                    this.lastTriggerKind = null;
                    return [];
                }

                if (!span) {
                    this.lastTriggerStart = null;
                    this.lastTriggerKind = null;
                    if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                    return [];
                }

                const spanChanged =
                    span.start !== this.lastTriggerStart || this.lastTriggerKind !== "trigger";
                if (spanChanged) {
                    this.lastTriggerStart = span.start;
                    this.lastTriggerKind = "trigger";
                    this.snapText = text;
                    this.snapCaret = caret;
                }

                // First pass after typing a trigger → show full list
                if (this.justTriggered) {
                    this.justTriggered = false;

                    const all = this.commands.slice();

                    // ✅ NEW: if there are no commands, close the panel
                    if (all.length === 0) {
                        this.shouldAutocomplete = false;
                        if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                        return [];
                    }

                    if (this.autoTrigger?.autocomplete) this.autoTrigger.openPanel();
                    return all;
                }

                // Filter by the text AFTER the trigger only
                const needle = span.term.toLowerCase();

                // If needle exactly matches any label (case-insensitive), close panel
                if (
                    needle.length > 0 &&
                    this.commands.some((c) => c.label.toLowerCase() === needle)
                ) {
                    if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                    this.shouldAutocomplete = false;
                    return [];
                }

                const results =
                    needle.length === 0
                        ? this.commands.slice()
                        : this.commands.filter((c) => c.label.toLowerCase().includes(needle));

                // Reverse the sorting before returning
                const reversedResults = results.reverse();

                // ✅ NEW: If no matches, close the dropdown
                if (reversedResults.length === 0) {
                    this.shouldAutocomplete = false;
                    if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                    return [];
                }

                // ✅ NEW: Only open when there are actually options
                if (this.autoTrigger?.autocomplete && !this.autoTrigger.panelOpen) {
                    this.autoTrigger.openPanel();
                }

                return reversedResults;
            })
        );

        // init from inbound data
        if (this.data != null) {
            this.menus = this.data["menus"];
            // Optional icon/label buttons rendered in the menubar. Each entry may be
            // { icon?, label?, tooltip?, color?, ionFunction | ionfunction }.
            if (this.data["buttons"]) this.buttons = this.data["buttons"];
            if (this.data["title"]) this.title = this.data["title"];
            if (this.data["style"]) {
                this.container = this.data["style"];
                if (this.container === "sub-container") {
                    this.mat_tools = "menu-bar mat-elevation-z1 blue-grey-bg";
                }
            }

            if (this.data["menu_button_color"]) {
                this.menu_button_color = this.data["menu_button_color"];
            }

            if (this.data["cmd"]) this.cmd = LionEngine.ionfunctions[this.data["cmd"]];
            if (this.data["text"]) {
                this.textFieldValue = this.data["text"];
                this.cmdCtrl.setValue(this.textFieldValue, { emitEvent: true });
            }

            if (this.data["txtListener"]) {
                this.txtListener = LionEngine.ionfunctions[this.data["txtListener"]];
            }

            if (this.data["guard"]) this.guardFn = LionEngine.ionfunctions[this.data["guard"]];
            if (this.data["onBlocked"]) this.onBlockedFn = LionEngine.ionfunctions[this.data["onBlocked"]];
            if (this.data["guardAllow"]) this.guardAllow = this.data["guardAllow"] || [];
            if (this.data["guardHighlight"]) this.guardHighlight = this.data["guardHighlight"] || [];

        }

        if (this.resolveFunction) this.resolveFunction(this);
    }

    // ---------- Menu click passthrough ----------

    select(item: any): void {
        this.click(item);
    }

    click(item: any): void {
        if (this.isBlocked(item)) { this.notifyBlocked(); return; }
        if (item["ionfunction"]) {
            const func = item["ionfunction"];
            if (func != null) LionEngine.ionfunctions[func]();
        } else if (item["ionFunction"]) {
            const func = item["ionFunction"];
            if (func != null) LionEngine.ionfunctions[func]();
        }
    }

    // ---------- "load a track first" guard ----------

    /** True when the guard predicate is active (e.g. no tracks are loaded). */
    guardActive(): boolean {
        try { return !!(this.guardFn && this.guardFn()); } catch (e) { return false; }
    }

    /** A top-level item is blocked when the guard is active and it is not allow-listed. */
    isBlocked(item: any): boolean {
        return this.guardActive() && this.guardAllow.indexOf(item?.label) < 0;
    }

    /** ngStyle for a top-level menu button: sunset-orange highlight for guardHighlight
     *  labels while blocked, otherwise the normal foreground color. */
    topStyle(item: any): any {
        if (this.guardActive() && this.guardHighlight.indexOf(item?.label) >= 0) {
            return { background: this.GUARD_HL_BG, color: this.GUARD_HL_FG };
        }
        return { color: item?.color || this.menu_button_color };
    }

    /** Called when a blocked top-level button is clicked / its menu is suppressed. */
    notifyBlocked(): void {
        try { if (this.onBlockedFn) this.onBlockedFn(); } catch (e) { }
    }

    /** Click handler on a top-level dropdown button — surfaces the guard message. */
    onTopClick(item: any): void {
        if (this.isBlocked(item)) this.notifyBlocked();
    }

    /** menuOpened handler — closes other menus, and closes this one if it is blocked
     *  (belt-and-suspenders in case the trigger still opened). */
    onTopMenuOpened(item: any, trigger: MatMenuTrigger): void {
        this.closeOtherMenus(trigger);
        if (this.isBlocked(item)) {
            try { trigger.closeMenu(); } catch (e) { }
            this.notifyBlocked();
        }
    }

    /** Fires an item's optional mouseOver ion-function (e.g. status messages). */
    hover(item: any): void {
        const func = item?.["mouseOver"] ?? item?.["mouseover"];
        if (func != null && LionEngine.ionfunctions[func]) LionEngine.ionfunctions[func]();
    }

    /**
     * An `icon` may be either a Material Icons ligature name (e.g. "save") or an
     * image source (data URI, url, or path such as "/assets/…/left.svg"). Image
     * sources render as <img>, ligatures as <mat-icon>.
     */
    isImageIcon(icon: any): boolean {
        return (
            typeof icon === "string" &&
            (/^(data:|https?:|\.?\/)/.test(icon) ||
                icon.startsWith("assets/") ||
                /\.(svg|png|jpe?g|gif|webp)(\?.*)?$/i.test(icon))
        );
    }

    // ---------- Keyboard handling ----------

    /** Enter acts like Tab when a trigger is active; otherwise submit */
    onEnter(ev: KeyboardEvent): void {
        // intentionally left as your original commented logic
    }

    private pickToInsert(p: string | Cmd): string {
        if (typeof p === "string") return p;
        return p.insert ?? `${p.label} `;
    }

    /** TAB COMPLETE (append tail at caret) */
    onTabComplete(ev: KeyboardEvent): void {
        ev.preventDefault();

        const el = this.textInput?.nativeElement;
        const text =
            el?.value ??
            (typeof this.cmdCtrl.value === "string"
                ? this.cmdCtrl.value
                : this.cmdCtrl.value?.label ?? "");
        const caret = el?.selectionStart ?? this.caretPos ?? text.length;

        const span = this.getLastTriggerSpan(text, caret);
        if (span) {
            const first = this.firstFiltered(text, caret);
            if (first) {
                const insertRaw = this.pickToInsert(first);
                const typedRaw = text.slice(span.insertStart, caret);

                const insert = (insertRaw ?? "").trim();
                const typed = (typedRaw ?? "").trimLeft();
                const tail = insert.startsWith(typed) ? insert.slice(typed.length) : insert;

                const before = text.slice(0, caret);
                const after = text.slice(caret);
                const next = before + tail + after;
                const pos = before.length + tail.length;

                this.cmdCtrl.setValue(next, { emitEvent: true });
                this.textFieldValue = next;
                this.setCaret(pos);
                if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
            } else {
                if (this.shouldAutocomplete && this.autoTrigger?.autocomplete) {
                    this.autoTrigger.openPanel();
                }
            }
            return;
        }
    }

    private firstFiltered(text: string, caret: number): string | Cmd | undefined {
        const span = this.getLastTriggerSpan(text, caret);
        if (!span) return undefined;
        const needle = span.term.toLowerCase();
        const list =
            needle.length === 0
                ? this.commands.slice()
                : this.commands.filter((c) => c.label.toLowerCase().includes(needle));
        return list[0];
    }

    onFocus(): void {
        this.caretInWindow = true;
        const text =
            (typeof this.cmdCtrl.value === "string"
                ? this.cmdCtrl.value
                : this.cmdCtrl.value?.label) ?? "";
        const caret = this.caretPos ?? text.length;

        const span = this.getLastTriggerSpan(text, caret);
        this.shouldAutocomplete = !!span;
        if (span) {
            if (this.autoTrigger?.autocomplete) this.autoTrigger.openPanel();
        } else if (this.autoTrigger?.panelOpen) {
            this.autoTrigger.closePanel();
        }
    }

    onKeyDown(e: KeyboardEvent) {
        // TAB → complete (keep your behavior)
        if (e.key === "Tab") {
            this.onTabComplete(e);
            return;
        }

        // ✅ ENTER → submit ONLY what's typed, never select from dropdown
        if (e.key === "Enter") {
            e.preventDefault();     // stop mat-autocomplete default behavior
            e.stopPropagation();    // stop option selection / active option commit

            // close dropdown if open
            if (this.autoTrigger?.panelOpen) {
                this.autoTrigger.closePanel();
            }

            // submit exactly what's in the input
            this.submitText();
            return;
        }

        // if a trigger char is pressed, arm startover and open the panel
        if (this.TRIGGER_CHARS.includes(e.key as any)) {
            setTimeout(() => {
                const el = this.textInput?.nativeElement;
                const text = el?.value ?? "";
                const caret = el?.selectionStart ?? text.length;

                const span = this.getLastTriggerSpan(text, caret);
                if (span) {
                    this.justTriggered = true;
                    this.shouldAutocomplete = true;
                    this.cdr.markForCheck();
                    setTimeout(() => {
                        if (this.autoTrigger?.autocomplete) this.autoTrigger.openPanel();
                    }, 0);
                }
            }, 0);
        }

        /* The above TypeScript code is checking if the key pressed by the user matches a specific pattern
        using a regular expression. The regular expression pattern allows for alphanumeric characters,
        arithmetic operators (+, -, *, /), equal sign (=), parentheses, square brackets, caret (^),
        percentage sign (%), exclamation mark (!), less than (<), greater than (>), and comma (,). If the
        key pressed by the user matches this pattern, it retrieves the value of a text input element and
        assigns it to the `userTxt` property. */
        if (/^[a-zA-Z0-9\+\-\*\/=\(\)\[\]\^\%\!\<\>\,]$/.test(e.key)) {
            const el = this.textInput?.nativeElement;
            this.userTxt = el?.value ?? "";
        }




    }

    onKeyUp(event: KeyboardEvent): void {
        const el = event.target as HTMLInputElement;
        this.caretPos = el?.selectionStart ?? el?.value?.length ?? 0;

        const text = el?.value ?? "";
        const span = this.getLastTriggerSpan(text, this.caretPos);
        this.shouldAutocomplete = !!span;



        if (this.txtListener) {
            this.txtListener(text);
        }






        // close if last char is a closing paren/bracket
        const lastChar =
            text && this.caretPos > 0 ? text[this.caretPos - 1] : null;
        if (lastChar === ")" || lastChar === "]") {
            this.shouldAutocomplete = false;
            if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
            return;
        }

        // close if exact (case-insensitive) match to a command label
        if (span && span.term) {
            const needle = span.term.toLowerCase();
            const hasExactMatch = this.commands.some(
                (c) => (c.label ?? "").toLowerCase() === needle
            );
            if (hasExactMatch) {
                this.shouldAutocomplete = false;
                if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
                return;
            }
        }
    }

    setCaret(pos: number): void {
        const el = this.textInput?.nativeElement;
        if (!el) return;
        el.focus();
        el.setSelectionRange(pos, pos);
        this.caretPos = pos;
    }

    private stripAllWS(s: string): string {
        // return s.replace(/\s+/g, "");
        return s;
    }

    private setValueStripWS(next: string, pos: number, emitEvent = true): void {
        const leftCleanLen = this.stripAllWS(next.slice(0, pos)).length;
        const cleaned = this.stripAllWS(next);
        this.cmdCtrl.setValue(cleaned, { emitEvent });
        this.textFieldValue = cleaned;

        if (this.textFieldValue && this.textFieldValue.length > 50) {
            // no-op
        } else {
            this.setCaret(leftCleanLen);
        }
    }

    // Replace from the last trigger character through the caret/selection.
    // Insert/replace ONLY the text AFTER the LAST trigger char (keep the trigger itself)
    // Keep [0 .. lastTriggerChar] and append the selected value (trimmed).
    onOptionSelected(e: MatAutocompleteSelectedEvent): void {
        const picked = e.option.value as string | Cmd;

        // Resolve text to insert (no trailing spaces)
        const raw =
            typeof picked === "string" ? picked : picked?.insert ?? picked?.label ?? "";
        const insertText = (raw ?? "").trimEnd();
        if (!insertText) return;

        // Base text + caret snapshot
        const baseText = this.snapText ?? this.textFieldValue ?? "";
        const caretSnap = this.snapCaret ?? this.caretPos ?? baseText.length;

        // Find the last trigger before/at caret
        const span = this.getLastTriggerSpan(baseText, caretSnap);

        // If we have a trigger, KEEP everything through the trigger char (inclusive),
        // then append the selected value. Otherwise just append at caret.
        let next: string;
        if (span) {
            const keepThroughTrigger = span.start + 1; // include the trigger char
            const prefix = baseText.slice(0, keepThroughTrigger);
            next = prefix + insertText;
        } else {
            // No trigger found → append at caret
            const before = baseText.slice(0, caretSnap);
            const after = baseText.slice(caretSnap);
            next = before + insertText + after;
        }

        const nextCaret = next.length;

        // Clear snapshots
        this.snapText = undefined as any;
        this.snapCaret = undefined as any;

        // Apply and tidy up autocomplete
        setTimeout(() => {
            this.textFieldValue = next;
            this.cmdCtrl?.setValue(next, { emitEvent: true });

            const el = this.textInput?.nativeElement;
            if (el) {
                el.focus();
                el.setSelectionRange(nextCaret, nextCaret);
            }
            this.setCaret(nextCaret);

            // After truncating to the trigger and appending, we typically close the panel
            this.shouldAutocomplete = false;
            if (this.autoTrigger?.panelOpen) this.autoTrigger.closePanel();
        }, 0);
    }

    onPanelOpened() {
        const el = this.textInput?.nativeElement;
        this.snapText =
            el?.value ??
            (typeof this.cmdCtrl.value === "string"
                ? this.cmdCtrl.value
                : this.cmdCtrl.value?.label ?? "");
        this.snapCaret =
            el?.selectionStart ?? this.caretPos ?? this.snapText.length;
    }
}
