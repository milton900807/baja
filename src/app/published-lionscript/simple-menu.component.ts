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
import { MatMenuTrigger } from "@angular/material/menu";
import { FormControl } from "@angular/forms";
import { Observable, of, Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { QueryList, ViewChildren } from "@angular/core";


// What a candidate IS, which decides the section it is listed under. The lionscript side
// may say so outright (plate-track's getFormulaCompletions); when it does not, it is read
// off the older shape -- hint "table"/"tag", or a `table` for a row of one.
type CmdKind = "table" | "row" | "column" | "tag" | "tool";

type Cmd = {
    label: string;
    table?: string;   // a row label's table (formula completion after "[")
    insert?: string;
    args?: string;
    hint?: string;
    kind?: CmdKind;
    // Tool lookup: the menu item this entry runs, and the top-level menu it lives under.
    tool?: any;
    top?: string;
};

/** What the caret is in the middle of completing. */
type AcContext = {
    scope: "trigger" | "bracket" | "word";
    table: string;   // for "bracket": the table named before it
    term: string;    // what has been typed of the candidate
    from: number;    // the slice of the field that a pick replaces
    to: number;
};
type AcScored = { cmd: Cmd; score: number };
type AcGroup = { title: string; items: Cmd[] };

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

    // ---------- Tool lookup ----------
    // When data.toolLookup is set, every leaf item of `menus` (any depth) becomes a
    // searchable entry: typing part of a tool's name lists the matches, Tab completes
    // the name, Enter (or picking from the list) runs the tool. This works with no
    // trigger character, unlike the formula completion below, which needs one.
    toolLookup = false;
    private tools: Cmd[] = [];
    private listAllTools = false;
    private lastToolRun: { label: string; at: number } | null = null;
    readonly TOOL_LIST_MAX = 14;

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

    commands: Cmd[] = [];
    cmdCtrl = new FormControl<string | Cmd>("");
    filteredCmds$: Observable<Cmd[]> = of([]);
    caretPos = 0;

    private snapText = "";
    private snapCaret = 0;

    // ---- the completion panel (see "THE COMPLETION LIST" below) ----
    acOpen = false;
    acGroups: AcGroup[] = [];
    acFlat: Cmd[] = [];          // the sections flattened, which is what Up/Down walks
    acIndex = 0;
    acAbove = false;
    acStyle: { [k: string]: string } = {};
    private acCtx: AcContext | null = null;

    private lastTriggerStart: number | null = null;
    private lastTriggerKind: TriggerSpan["kind"] | null = null;

    private acSub?: Subscription;

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
        if (typeof c === "string") return { label: c, insert: `${c} `, kind: "tag" };
        const label = (c.label ?? "").trim();
        if (!label) throw new Error('Each command must have a non-empty "label".');
        const table = (c as any).table ?? undefined;
        const hint = c.hint ?? "";
        const kind: CmdKind =
            (c as any).kind ??
            ((c as any).tool ? "tool"
                : hint === "table" ? "table"
                    : hint === "tag" ? "tag"
                        : table ? "row"
                            : "tag");
        return {
            label,
            insert: c.insert ?? `${label} `,
            args: c.args ?? "",
            hint,
            table,
            kind,
            tool: (c as any).tool,
            top: (c as any).top,
        };
    };

    // ---------- Formula-aware candidate pool ----------
    // After "[" the candidates are row LABELS, and only those of the table written just
    // before the bracket (Project_Assumptions[Seq → the Assumptions' labels); after any
    // other trigger they are the tables and tags. Matches that START with the typed text
    // come first, so Tab lands on the obvious one, then the ones that merely contain it.
    private candidatePool(text: string, span: TriggerSpan): Cmd[] {
        const ctx = this.acContext(text, span.insertStart + span.term.length);
        return ctx ? this.acPool(ctx) : [];
    }
    private rankMatches(pool: Cmd[], needle: string): Cmd[] {
        return this.acRank(pool, needle).map((s) => s.cmd);
    }

    // ============================================================================
    // THE COMPLETION LIST
    // Its own panel rather than mat-autocomplete: the Material one had to be opened and
    // closed by hand from two dozen places that disagreed with each other, it ranked best
    // match first and then REVERSED the list into a panel that opens downwards, and it
    // could only say a candidate's name -- not whether that name is a table, a row of one,
    // a column or a tag, which on this canvas is the thing you actually need to know.
    //
    // WHAT OPENS IT. A trigger character (= + - * / ^ % ! < > ( [ ,) as before, and now
    // also a bare word, so "Bud" offers Budget without "=" in front of it. It never opens
    // on nothing found, so an unmatched word simply stays quiet -- there is no "No matches"
    // row any more. Ctrl+Space opens it on demand, and on an empty field lists everything.
    // ============================================================================

    /** The end of the word the caret is standing in, so a pick replaces all of it. */
    private acTokenEnd(text: string, caret: number): number {
        let i = Math.max(0, Math.min(caret ?? 0, text.length));
        while (i < text.length && /[A-Za-z0-9_.]/.test(text[i])) i++;
        return i;
    }

    /**
     * What is being completed AT THE CARET, wherever that is. What has been typed is what
     * lies between the start of the word and the caret -- so clicking into the middle of
     * "Budget" and completing offers the things that start with what is to the left of the
     * caret -- while the range a pick replaces runs to the END of that word, so the rest of
     * it is not left behind as "Budgetget".
     */
    private acContext(text: string, caret: number): AcContext | null {
        const t = text ?? "";
        const c = Math.max(0, Math.min(caret ?? 0, t.length));
        const end = this.acTokenEnd(t, c);
        const span = this.getLastTriggerSpan(t, c);

        if (span) {
            const from = c - span.term.length;
            // "Budget[Re" -- the bracket scopes the list to that one table.
            if (span.ch === "[") {
                const m = /([A-Za-z_][\w.-]*)\s*$/.exec(t.slice(0, span.start));
                return { scope: "bracket", table: m ? m[1] : "", term: span.term, from, to: end };
            }
            return { scope: "trigger", table: "", term: span.term, from, to: end };
        }

        // No trigger: complete the bare word the caret is in.
        const w = /([A-Za-z_][A-Za-z0-9_.]*)$/.exec(t.slice(0, c));
        if (w) return { scope: "word", table: "", term: w[1], from: c - w[1].length, to: end };
        return null;
    }

    /** Everything that could be offered in this context, before matching. */
    private acPool(ctx: AcContext): Cmd[] {
        const all = this.commands;
        if (ctx.scope === "bracket") {
            const want = ctx.table.toLowerCase();
            const scoped = want
                ? all.filter((x) => (x.table ?? "").toLowerCase() === want)
                : [];
            // An unknown table name before the bracket: offer every row rather than nothing.
            if (scoped.length) return scoped;
            return all.filter((x) => x.kind === "row" || x.kind === "column");
        }
        // Anywhere else a row label cannot stand on its own -- it needs its table and a
        // bracket around it -- so the list is the tables and the tags.
        const base = all.filter((x) => x.kind !== "row" && x.kind !== "column");

        // The editor's menubar runs on tool lookup: every leaf of every menu is something
        // the field can find by name. Those never come through setCommands -- they are
        // collected from the menus -- so they are added here, and ranked with the rest.
        if (this.toolLookup) {
            const tools = this.allTools().map((t) => ({ ...t, kind: "tool" as CmdKind }));
            return base.concat(tools);
        }
        return base;
    }

    /**
     * How well a candidate answers what has been typed. Lower is better, and the reasons
     * are ordered the way a person would rank them: the whole word, then the start of it,
     * then the start of a part of it (Peak_Share for "share"), then anywhere inside, then
     * the letters in order but spread out. -1 means it does not answer at all.
     */
    private acScore(label: string, hint: string, needle: string): number {
        if (!needle) return 6;
        const l = label.toLowerCase();
        const q = needle.toLowerCase();
        if (l === q) return 0;
        if (l.startsWith(q)) return 1;
        if (l.split(/[_\s./()-]+/).some((w) => w && w.startsWith(q))) return 2;
        if (l.includes(q)) return 3;
        if ((hint ?? "").toLowerCase().includes(q)) return 4;
        if (q.length >= 2 && this.isSubsequence(q, l)) return 5;
        return -1;
    }

    private acRank(pool: Cmd[], needle: string): AcScored[] {
        const out: AcScored[] = [];
        for (const cmd of pool) {
            const s = this.acScore(cmd.label, cmd.hint ?? "", needle);
            if (s >= 0) out.push({ cmd, score: s });
        }
        out.sort(
            (a, b) =>
                a.score - b.score ||
                a.cmd.label.length - b.cmd.label.length ||
                a.cmd.label.localeCompare(b.cmd.label)
        );
        return out;
    }

    /** The sections, in the order they are shown, and the flat list Up/Down walks. */
    private acBuild(ctx: AcContext, ranked: AcScored[]): void {
        const order: CmdKind[] = ["table", "row", "column", "tag", "tool"];
        const title = (k: CmdKind): string => {
            const of = ctx.table ? " of " + ctx.table : "";
            switch (k) {
                case "table": return "Tables";
                case "row": return "Rows" + of;
                case "column": return "Columns" + of;
                case "tag": return "Tags";
                default: return "Tools";
            }
        };

        const groups: AcGroup[] = [];
        const flat: Cmd[] = [];
        for (const k of order) {
            const items = ranked.filter((r) => (r.cmd.kind ?? "tag") === k).map((r) => r.cmd);
            if (!items.length) continue;
            groups.push({ title: title(k), items });
            for (const it of items) flat.push(it);
        }
        this.acGroups = groups;
        this.acFlat = flat;
    }

    /** Where the panel goes: under the field, or above it when the room is below. */
    private acPlace(): void {
        const el = this.textInput?.nativeElement;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const longest = this.acFlat.reduce(
            (n, c) => Math.max(n, (c.label ?? "").length + (this.acRight(c) ?? "").length),
            12
        );
        const width = Math.max(240, Math.min(560, longest * 7.6 + 56));
        const below = window.innerHeight - r.bottom;
        this.acAbove = below < 220 && r.top > below;
        this.acStyle = {
            left: Math.round(Math.max(8, Math.min(r.left, window.innerWidth - width - 8))) + "px",
            width: Math.round(width) + "px",
            top: this.acAbove ? "" : Math.round(r.bottom + 4) + "px",
            bottom: this.acAbove ? Math.round(window.innerHeight - r.top + 4) + "px" : "",
            maxHeight: Math.round(Math.max(160, Math.min(360, this.acAbove ? r.top - 16 : below - 16))) + "px",
        };
    }

    /** The grey text on the right of a row: what picking it will put in the field. */
    acRight(c: Cmd): string {
        const ins = (c.insert ?? c.label ?? "").trim();
        return ins && ins !== c.label ? ins : "";
    }

    /** Recompute and show, or hide when there is nothing worth showing. */
    acRefresh(opts: { all?: boolean } = {}): void {
        const el = this.textInput?.nativeElement;
        const text = this.currentInputString();
        const caret = el?.selectionStart ?? this.caretPos ?? text.length;

        // Ctrl+Space on an empty field: everything there is.
        if (opts.all && !text.trim()) {
            this.acCtx = { scope: "word", table: "", term: "", from: caret, to: caret };
            this.acBuild(this.acCtx, this.acRank(this.acPool(this.acCtx), ""));
            this.acAfterBuild();
            return;
        }

        const ctx = this.acContext(text, caret);
        if (!ctx) { this.acClose(); return; }

        // A bare word is only worth completing once it is a real start, and never when it
        // already names the thing exactly -- nothing left to say.
        if (ctx.scope === "word" && !opts.all && ctx.term.length < 1) { this.acClose(); return; }

        const ranked = this.acRank(this.acPool(ctx), ctx.term);
        const exact = ctx.term && ranked.length === 1 && ranked[0].score === 0;
        if (!ranked.length || exact) { this.acClose(); return; }

        this.acCtx = ctx;
        this.acBuild(ctx, ranked);
        this.acAfterBuild();
    }

    private acAfterBuild(): void {
        if (!this.acFlat.length) { this.acClose(); return; }
        this.acIndex = 0;
        this.acOpen = true;
        this.shouldAutocomplete = true;
        this.acPlace();
        this.cdr.markForCheck();
    }

    acClose(): void {
        if (!this.acOpen && !this.acGroups.length) return;
        this.acOpen = false;
        this.acGroups = [];
        this.acFlat = [];
        this.acIndex = 0;
        this.shouldAutocomplete = false;
        this.cdr.markForCheck();
    }

    /** Up/Down through the flat list, wrapping at both ends. */
    acMove(step: number): void {
        if (!this.acOpen || !this.acFlat.length) return;
        const n = this.acFlat.length;
        this.acIndex = (this.acIndex + step + n) % n;
        this.cdr.markForCheck();
        setTimeout(() => {
            try {
                const row = document.querySelector<HTMLElement>(".cmd-ac .cmd-ac-row.is-on");
                row?.scrollIntoView({ block: "nearest" });
            } catch (e) { }
        }, 0);
    }

    /** True when this row is the highlighted one (the template asks per row). */
    acIsOn(c: Cmd): boolean {
        return this.acOpen && this.acFlat[this.acIndex] === c;
    }

    /** Put the candidate in the field, replacing exactly what was being completed. */
    acAccept(pick?: Cmd): void {
        const c = pick ?? this.acFlat[this.acIndex];
        if (!c) return;

        // A tool entry runs its menu item instead of being typed.
        if (c.tool) {
            this.acClose();
            try { this.runTool(c); } catch (e) { console.warn("tool", e); }
            return;
        }

        const el = this.textInput?.nativeElement;
        const text = this.currentInputString();
        const caret = el?.selectionStart ?? this.caretPos ?? text.length;
        const ctx = this.acCtx ?? this.acContext(text, caret);
        const insert = (c.insert ?? c.label ?? "").trim();
        if (!ctx) return;

        // Picking in the middle of a finished reference must not double its bracket:
        // "=Budget[Re|nt]" taking Rent (which inserts "Rent]") would leave "Rent]]".
        let to = ctx.to;
        const close = insert.slice(-1);
        if ((close === "]" || close === ")" || close === "[") && text.charAt(to) === close) to += 1;

        const next = text.slice(0, ctx.from) + insert + text.slice(to);
        const pos = ctx.from + insert.length;

        this.setValueStripWS(next, pos, true);
        this.acClose();
        // "Budget[" completes to a table and leaves the caret inside the bracket, where the
        // rows of that table are what comes next: offer them straight away.
        setTimeout(() => this.acRefresh(), 0);
    }

    private handleFocus = () => {
        const el = this.textInput?.nativeElement;
        if (!el) return;
        // setTimeout(() => el.select(), 0);
    };

    onCmdKeyDown(event: KeyboardEvent): void {
        event.stopPropagation();

        // Optional: block global handlers / hotkeys from seeing this first
        event.stopImmediatePropagation();

        // THE LIST HAS THE KEYS WHILE IT IS OPEN. Up/Down walk it, Enter and Tab take the
        // highlighted row, Escape puts it away without touching the text. Everything else
        // falls through to typing, which re-asks what should be offered.
        if (this.acOpen) {
            if (event.key === "ArrowDown") { event.preventDefault(); this.acMove(1); return; }
            if (event.key === "ArrowUp") { event.preventDefault(); this.acMove(-1); return; }
            if (event.key === "Enter" || event.key === "Tab") { event.preventDefault(); this.acAccept(); return; }
            if (event.key === "Escape") { event.preventDefault(); this.acClose(); return; }
            if (event.key === "Home") { event.preventDefault(); this.acIndex = 0; this.cdr.markForCheck(); return; }
            if (event.key === "End") { event.preventDefault(); this.acIndex = Math.max(0, this.acFlat.length - 1); this.cdr.markForCheck(); return; }
        }

        // Ctrl/Cmd+Space asks for the list wherever the caret is; on an empty field that is
        // everything there is to offer.
        if (event.code === "Space" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.acRefresh({ all: true });
            return;
        }

        // Only prevent default for keys you fully handle yourself.
        // Do NOT blindly preventDefault(), or typing/autocomplete may break.
        if (event.key === 'Enter') {
            event.preventDefault();
            if (this.toolLookup && this.runToolFromInput()) return;
            this.submitText();
            return;
        }

        this.onKeyDown(event);
    }

    /**
     * THE CARET MOVED WITHOUT THE TEXT CHANGING -- clicked into, arrowed across, focused,
     * selected. The list follows it: it asks again for wherever the caret now is, so it is
     * offered in the middle of a line as readily as at the end of one. Typing is not routed
     * through here; that already comes round on the field's value changing.
     */
    acCaretMoved(ev?: any): void {
        // From a key, only the ones that MOVE the caret. Up and Down belong to the list
        // while it is open, and Enter, Tab and Escape have already been dealt with.
        if (ev && typeof ev.key === "string") {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
        }
        setTimeout(() => { try { this.acRefresh(); } catch (e) { } }, 0);
    }

    /** Hovering a row moves the highlight to it, so the mouse and keys agree. */
    acHover(c: Cmd): void {
        const i = this.acFlat.indexOf(c);
        if (i >= 0 && i !== this.acIndex) { this.acIndex = i; this.cdr.markForCheck(); }
    }

    /** Leaving the field closes the list -- after the click that may be picking from it. */
    acBlur(): void {
        setTimeout(() => this.acClose(), 150);
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

    }

    ngOnDestroy(): void {
        this.acSub?.unsubscribe();
        const el = this.textInput?.nativeElement;
        if (el) {
            el.removeEventListener("focus", this.handleFocus);
            el.removeEventListener("mouseup", this.handleMouseUp);
        }
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
            this.acRefresh();
        }, 0);
    }

    // ---------- Lifecycle / reactive filtering ----------

    ngOnInit(): void {





        // Every change to the field re-asks what should be offered. One place decides,
        // instead of two dozen calls to open and close a Material panel that disagreed
        // with each other -- which is what made a bare "=" show an empty list.
        this.acSub = this.cmdCtrl.valueChanges.subscribe(() => {
            // After the value has landed in the DOM, so the caret is the real one.
            setTimeout(() => { try { this.acRefresh(); } catch (e) { } }, 0);
        });

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
            if (this.data["placeholder"]) this.placeholder = this.data["placeholder"];
            if (this.data["toolLookup"]) {
                this.toolLookup = true;
                this.tools = this.collectTools(this.menus);
            }
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
        if (!span && this.toolLookup) {
            this.tabCompleteTool(text);
            return;
        }
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
                this.acClose();
            } else {
                this.acRefresh();
            }
            return;
        }
    }

    private firstFiltered(text: string, caret: number): string | Cmd | undefined {
        const span = this.getLastTriggerSpan(text, caret);
        if (!span) return undefined;
        const needle = span.term.toLowerCase();
        const list = this.rankMatches(this.candidatePool(text, span), needle);
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
            this.acRefresh();
        } else this.acClose();
    }

    onKeyDown(e: KeyboardEvent) {
        // TAB → complete (keep your behavior)
        if (e.key === "Tab") {
            this.onTabComplete(e);
            return;
        }

        // Tool lookup: ArrowDown on an empty field lists every tool.
        if (this.toolLookup && e.key === "ArrowDown" && !(this.currentInputString() ?? "").trim()) {
            e.preventDefault();
            this.listAllTools = true;
            this.cmdCtrl.setValue("", { emitEvent: true });
            return;
        }

        // ✅ ENTER → submit ONLY what's typed, never select from dropdown
        if (e.key === "Enter") {
            e.preventDefault();     // stop mat-autocomplete default behavior
            e.stopPropagation();    // stop option selection / active option commit

            // close dropdown if open
            this.acClose();

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
                        this.acRefresh();
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
        this.shouldAutocomplete = !!span || (this.toolLookup && !span && this.toolMatches(text).length > 0);



        if (this.txtListener) {
            this.txtListener(text);
        }






        // close if last char is a closing paren/bracket
        const lastChar =
            text && this.caretPos > 0 ? text[this.caretPos - 1] : null;
        if (lastChar === ")" || lastChar === "]") {
            this.shouldAutocomplete = false;
            this.acClose();
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
                this.acClose();
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
    // Picking is acAccept() now; the Material option event is gone with its panel.

    // ---------- Tool lookup helpers ----------

    /** Flatten `menus` (any depth) into runnable leaf entries with a breadcrumb hint. */
    private collectTools(menus: any[], path: string[] = [], out: Cmd[] = []): Cmd[] {
        for (const m of menus ?? []) {
            if (!m || typeof m !== "object") continue;
            const label = ("" + (m.label ?? "")).trim();
            const kids = m.items ?? m.children;
            if (Array.isArray(kids) && kids.length > 0) {
                this.collectTools(kids, label ? [...path, label] : path, out);
            } else if (label && (m.ionfunction || m.ionFunction || m.click)) {
                out.push({ label, insert: label, hint: path.join(" › "), tool: m, top: path[0] ?? label });
            }
        }
        return out;
    }

    /** Public API: replace the lookup list (e.g. after the menus are rebuilt). */
    setTools(menus?: any[]): void {
        if (menus) this.menus = menus;
        this.tools = this.collectTools(this.menus);
        this.cdr.markForCheck();
    }

    private allTools(): Cmd[] {
        if (this.tools.length === 0) this.tools = this.collectTools(this.menus);
        return this.tools.slice();
    }

    /** True when every character of q appears in s, in order (fuzzy match). */
    private isSubsequence(q: string, s: string): boolean {
        let i = 0;
        for (const ch of s) { if (ch === q[i]) i++; if (i === q.length) return true; }
        return q.length === 0;
    }

    /** Ranked matches for the typed text: exact, prefix, word-start, substring, path, fuzzy. */
    private toolMatches(text: string): Cmd[] {
        const q = (text ?? "").trim().toLowerCase();
        if (!q) return [];
        const scored: Array<{ s: number; t: Cmd }> = [];
        for (const t of this.allTools()) {
            const l = t.label.toLowerCase();
            const p = (t.hint ?? "").toLowerCase();
            let s = -1;
            if (l === q) s = 0;
            else if (l.startsWith(q)) s = 1;
            else if (l.split(/[\s/(),.-]+/).some((w) => w.startsWith(q))) s = 2;
            else if (l.includes(q)) s = 3;
            else if (p.includes(q)) s = 4;
            else if (q.length >= 3 && this.isSubsequence(q, l)) s = 5;
            if (s >= 0) scored.push({ s, t });
        }
        scored.sort((a, b) => a.s - b.s || a.t.label.localeCompare(b.t.label));
        return scored.slice(0, this.TOOL_LIST_MAX).map((x) => x.t);
    }

    private commonPrefix(labels: string[]): string {
        if (labels.length === 0) return "";
        let prefix = labels[0];
        for (const l of labels.slice(1)) {
            let i = 0;
            while (i < prefix.length && i < l.length && prefix[i].toLowerCase() === l[i].toLowerCase()) i++;
            prefix = prefix.slice(0, i);
            if (!prefix) break;
        }
        return prefix;
    }

    /** Tab in tool mode: extend the typed text to the matches' common prefix, or to the
     *  first match when nothing longer is shared. The list stays open while ambiguous. */
    private tabCompleteTool(text: string): void {
        const typed = (text ?? "").trim();
        const matches = typed ? this.toolMatches(typed) : this.allTools();
        if (matches.length === 0) return;
        let target = this.commonPrefix(matches.map((m) => m.label));
        if (target.length <= typed.length || !target.toLowerCase().startsWith(typed.toLowerCase())) {
            target = matches[0].label;
        }
        this.cmdCtrl.setValue(target, { emitEvent: true });
        this.textFieldValue = target;
        this.setCaret(target.length);
    }

    /** Enter in tool mode: run the highlighted option, an exact label match, or the only
     *  match. Returns false when nothing applies so the caller can fall back to cmd. */
    private runToolFromInput(): boolean {
        const active = this.acOpen ? this.acFlat[this.acIndex] : undefined;
        if (active && typeof active !== "string" && active.tool) { this.runTool(active); return true; }
        const text = (this.currentInputString() ?? "").trim();
        if (!text) return false;
        const q = text.toLowerCase();
        const exact = this.allTools().find((t) => t.label.toLowerCase() === q);
        if (exact) { this.runTool(exact); return true; }
        const matches = this.toolMatches(text);
        if (matches.length === 1) { this.runTool(matches[0]); return true; }
        return false;
    }

    /** Fire a tool's ion-function the way a menu click would, then clear the field.
     *  Guarded against the double fire that Enter can produce when mat-autocomplete also
     *  commits the active option. */
    runTool(entry: Cmd): void {
        const item = entry?.tool;
        if (!item) return;
        const now = Date.now();
        if (this.lastToolRun && this.lastToolRun.label === entry.label && now - this.lastToolRun.at < 400) return;
        this.lastToolRun = { label: entry.label, at: now };

        this.shouldAutocomplete = false;
        this.acClose();
        this.cmdCtrl.setValue("", { emitEvent: false });
        this.textFieldValue = "";
        this.cdr.markForCheck();

        if (this.guardActive() && this.guardAllow.indexOf(entry.top ?? "") < 0) { this.notifyBlocked(); return; }
        try {
            if (typeof item.click === "function") { item.click(); return; }
            const func = item["ionfunction"] ?? item["ionFunction"];
            if (func != null && LionEngine.ionfunctions[func]) LionEngine.ionfunctions[func](item);
        } catch (e) {
            console.error("tool lookup: failed to run " + entry.label, e);
        }
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
