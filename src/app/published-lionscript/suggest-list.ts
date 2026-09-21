/**
 * THE COMPLETION LIST -- one implementation, three callers.
 *
 * There used to be three of these: the menubar's formula field, the legacy input-textfield,
 * and a hand-rolled one inside baja/lib/prompt-text.js over in the lionscript repo. They
 * drifted, as copies do -- the prompt's ranked with startsWith-then-includes where the
 * menubar scored six ways, capped at 12 rows where the menubar scrolled, and styled itself
 * with inline strings. A fix to one was a fix to one.
 *
 * This file is deliberately framework-free so all three can share it: the two Angular
 * components import it, and it also registers itself as window.LionSuggest so a lionscript
 * module (which has no Angular) can construct the same list. It owns its DOM, its CSS and
 * its keyboard; a caller supplies the input element, the candidates, and what a pick means.
 */

export type SuggestKind = "goto" | "table" | "row" | "column" | "tag" | "tool";

export interface SuggestItem {
    label: string;
    insert?: string;
    hint?: string;
    table?: string;
    kind?: SuggestKind;
    /** Carried through untouched, for the caller's onPick. */
    data?: any;
}

export interface SuggestContext {
    scope: "bracket" | "trigger" | "word" | "plain";
    table: string;
    term: string;
    /** The range in the text a pick replaces. */
    from: number;
    to: number;
}

export interface SuggestOptions {
    /** The field being completed. */
    input: HTMLInputElement | HTMLTextAreaElement;
    /** Everything that could be offered, asked for fresh on each keystroke. */
    items: () => Array<SuggestItem | string>;
    /**
     * 'formula' parses trigger characters and scopes to a table inside "[...]".
     * 'plain' filters the whole field value, for a field that is one value (a gene name).
     */
    mode?: "formula" | "plain";
    /** Extra rows put at the top, rebuilt per refresh (the menubar's "Go to"). */
    lead?: (text: string, caret: number) => SuggestItem[];
    /**
     * A pick. Return true when it was handled and nothing should be typed -- that is what a
     * "Go to" row or a tool does. Returning false (or nothing) inserts item.insert.
     */
    onPick?: (item: SuggestItem, ctx: SuggestContext | null) => boolean | void;
    /** Called after text is inserted, with the new value and caret. */
    onInsert?: (value: string, caret: number) => void;
    /** Grey key hints along the bottom. Omitted, there is no footer. */
    footer?: string;
    /** Section headings. Off for a list that is all one kind of thing. */
    groupTitles?: boolean;
    /** Largest number of rows to show at once. */
    limit?: number;
}

const TRIGGERS = ["=", "+", "-", "*", "/", "^", "%", "!", "<", ">", "(", "[", ","];
const WORD_CH = /[A-Za-z0-9_.]/;

/* The one stylesheet. Injected once, on the document, because the panel is appended to
   <body>: inside a component's template the toolbar's overflow clipped it, and inside a
   dialog the dialog did. */
const CSS = `
.ls-sug{position:fixed;z-index:2147482500;overflow-y:auto;overflow-x:hidden;background:#fff;
 color:#0a2540;border:1px solid #cfe0e6;border-radius:10px;
 box-shadow:0 12px 34px rgba(10,37,64,.26),0 2px 6px rgba(10,37,64,.12);
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:4px 0 0;
 scrollbar-width:thin;-webkit-overflow-scrolling:touch;}
.ls-sug-head{position:sticky;top:0;background:#fff;padding:6px 12px 3px;
 font:700 10px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
 color:#6b8794;border-bottom:1px solid #eef4f6;}
.ls-sug-row{display:flex;align-items:baseline;justify-content:space-between;gap:14px;
 padding:5px 12px;cursor:pointer;line-height:1.35;}
.ls-sug-row.is-on{background:#e8f6fa;box-shadow:inset 2px 0 0 #1aa3bd;}
.ls-sug-label{font:500 13px system-ui,sans-serif;color:#0a2540;white-space:nowrap;
 overflow:hidden;text-overflow:ellipsis;}
.ls-sug-ins{font:400 11.5px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
 color:#7c93a1;white-space:nowrap;flex:0 0 auto;}
.ls-sug-row.is-on .ls-sug-ins{color:#12798c;}
.ls-sug-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid #eef4f6;
 padding:5px 12px;font:400 11px system-ui,sans-serif;color:#6b8794;}
@media (pointer:coarse){.ls-sug-row{padding:11px 14px;}.ls-sug-label{font-size:15px;}}
`;

let cssDone = false;
function ensureCss(): void {
    if (cssDone || typeof document === "undefined") return;
    try {
        const s = document.createElement("style");
        s.id = "ls-sug-css";
        s.textContent = CSS;
        document.head.appendChild(s);
        cssDone = true;
    } catch (e) { }
}

const esc = (s: any): string =>
    ("" + (s ?? "")).replace(/[&<>"]/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[c]);

export function normalizeItem(c: SuggestItem | string): SuggestItem {
    if (typeof c === "string") return { label: c, insert: c, kind: "tag" };
    const label = ("" + (c.label ?? "")).trim();
    const kind: SuggestKind = c.kind ?? (c.hint === "table" ? "table" : c.table ? "row" : "tag");
    return { ...c, label, insert: c.insert ?? label, hint: c.hint ?? "", kind };
}

/** The end of the word the caret stands in, so a pick replaces all of it. */
function tokenEnd(text: string, caret: number): number {
    let i = Math.max(0, Math.min(caret ?? 0, text.length));
    while (i < text.length && WORD_CH.test(text[i])) i++;
    return i;
}

/** The last trigger character before the caret, and what has been typed since it. */
function triggerSpan(text: string, caret: number): { ch: string; start: number; term: string } | null {
    const before = text.slice(0, caret);
    let idx = -1, ch = "";
    for (const t of TRIGGERS) {
        const i = before.lastIndexOf(t);
        if (i > idx) { idx = i; ch = t; }
    }
    if (idx < 0) return null;
    return { ch, start: idx, term: before.slice(idx + 1).replace(/^\s+/, "") };
}

/**
 * What is being completed AT THE CARET, wherever that is. What has been typed is what lies
 * between the start of the word and the caret -- so clicking into the middle of "Budget"
 * offers the things that start with what is to the LEFT of the caret -- while the range a
 * pick replaces runs to the END of that word, so the rest is not left as "Budgetget".
 */
export function suggestContext(text: string, caret: number, mode?: "formula" | "plain"): SuggestContext | null {
    const t = text ?? "";
    const c = Math.max(0, Math.min(caret ?? 0, t.length));
    if (mode === "plain") return { scope: "plain", table: "", term: t, from: 0, to: t.length };

    const end = tokenEnd(t, c);
    const span = triggerSpan(t, c);
    if (span) {
        const from = c - span.term.length;
        if (span.ch === "[") {
            // "Budget[Re" -- the bracket scopes the list to that one table.
            const m = /([A-Za-z_][\w.-]*)\s*$/.exec(t.slice(0, span.start));
            return { scope: "bracket", table: m ? m[1] : "", term: span.term, from, to: end };
        }
        return { scope: "trigger", table: "", term: span.term, from, to: end };
    }
    const w = /([A-Za-z_][A-Za-z0-9_.]*)$/.exec(t.slice(0, c));
    if (w) return { scope: "word", table: "", term: w[1], from: c - w[1].length, to: end };
    return null;
}

/** Everything that could be offered in this context, before matching. */
export function suggestPool(all: Array<SuggestItem | string>, ctx: SuggestContext): SuggestItem[] {
    const items = (all || []).map(normalizeItem).filter((c) => c.label);
    if (ctx.scope === "plain") return items;
    if (ctx.scope === "bracket") {
        const want = ctx.table.toLowerCase();
        const scoped = want ? items.filter((x) => ("" + (x.table ?? "")).toLowerCase() === want) : [];
        // An unknown table before the bracket: offer every row rather than nothing.
        if (scoped.length) return scoped;
        const rows = items.filter((x) => x.kind === "row" || x.kind === "column");
        return rows.length ? rows : items;
    }
    // Elsewhere a row label cannot stand on its own -- it needs its table and a bracket
    // around it -- so the list is the tables and the tags.
    const base = items.filter((x) => x.kind !== "row" && x.kind !== "column");
    return base.length ? base : items;
}

function isSubsequence(q: string, l: string): boolean {
    let i = 0;
    for (let j = 0; j < l.length && i < q.length; j++) if (l[j] === q[i]) i++;
    return i === q.length;
}

/**
 * How well a candidate answers what was typed. Lower is better, ordered the way a person
 * would rank them: the whole word, the start of it, the start of a part of it (Peak_Share
 * for "share"), anywhere inside, the hint, then the letters in order but spread out.
 * -1 does not answer at all.
 */
export function suggestScore(label: string, hint: string, needle: string): number {
    if (!needle) return 6;
    const l = label.toLowerCase(), q = needle.toLowerCase();
    if (l === q) return 0;
    if (l.startsWith(q)) return 1;
    if (l.split(/[_\s./()-]+/).some((w) => w && w.startsWith(q))) return 2;
    if (l.includes(q)) return 3;
    if (("" + (hint ?? "")).toLowerCase().includes(q)) return 4;
    if (q.length >= 2 && isSubsequence(q, l)) return 5;
    return -1;
}

export function suggestRank(pool: SuggestItem[], needle: string): Array<{ cmd: SuggestItem; score: number }> {
    const out: Array<{ cmd: SuggestItem; score: number }> = [];
    for (const cmd of pool) {
        const s = suggestScore(cmd.label, cmd.hint ?? "", needle);
        if (s >= 0) out.push({ cmd, score: s });
    }
    out.sort((a, b) =>
        a.score - b.score ||
        a.cmd.label.length - b.cmd.label.length ||
        a.cmd.label.localeCompare(b.cmd.label));
    return out;
}

export class SuggestList {
    private o: SuggestOptions;
    private el: HTMLDivElement | null = null;
    private groups: Array<{ title: string; items: SuggestItem[] }> = [];
    private flat: SuggestItem[] = [];
    private index = 0;
    private ctx: SuggestContext | null = null;
    /** How many of `flat` are lead rows (Go to) rather than completions. */
    private leadCount = 0;
    private shown = false;
    private blurTimer: any = null;
    private bound: Array<[string, any]> = [];

    constructor(opts: SuggestOptions) {
        this.o = opts;
        ensureCss();
        this.listen();
    }

    get isOpen(): boolean { return this.shown; }
    /** The highlighted row, for a caller that wants to know before it calls accept(). */
    get current(): SuggestItem | null { return this.shown ? this.flat[this.index] ?? null : null; }

    // ---- wiring ------------------------------------------------------------------

    private listen(): void {
        const el = this.o.input;
        if (!el) return;
        const on = (ev: string, fn: any, cap?: boolean) => {
            el.addEventListener(ev, fn, cap);
            this.bound.push([ev, fn]);
        };
        on("input", () => this.refresh());
        on("click", () => this.refresh());
        on("focus", () => this.refresh());
        on("select", () => this.refresh());
        on("keyup", (e: KeyboardEvent) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(e.key) >= 0) this.refresh();
        });
        on("blur", () => {
            // A pick is a mousedown with preventDefault, so focus never leaves and this does
            // not race it; the delay is only for a click that lands elsewhere.
            clearTimeout(this.blurTimer);
            this.blurTimer = setTimeout(() => this.close(), 120);
        });
        // Capture, so the list answers Up/Down/Enter before the field's own handler does --
        // but ONLY while it is open, so everything else still reaches the caller untouched.
        on("keydown", (e: KeyboardEvent) => this.onKey(e), true);
    }

    /** True when the key was the list's to handle. */
    private onKey(e: KeyboardEvent): boolean {
        if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
            e.preventDefault(); e.stopPropagation();
            this.refresh({ all: true });
            return true;
        }
        if (!this.shown || !this.flat.length) return false;
        switch (e.key) {
            case "ArrowDown": e.preventDefault(); e.stopPropagation(); this.move(1); return true;
            case "ArrowUp": e.preventDefault(); e.stopPropagation(); this.move(-1); return true;
            case "Tab":
            case "Enter":
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) return false;  // save, not pick
                // NOTHING TO COMPLETE, ONLY SOMEWHERE TO GO. Past the "]" of a finished
                // reference there is no candidate, so the list is open for the Go to row
                // alone -- and Enter taking that row meant a finished formula could never
                // be committed: it navigated instead. Enter is the field's in that case.
                // Tab still takes the row, and so does clicking it.
                if (e.key === "Enter" && this.flat.length === this.leadCount) return false;
                e.preventDefault(); e.stopPropagation(); this.accept(); return true;
            case "Escape": e.preventDefault(); e.stopPropagation(); this.close(); return true;
        }
        return false;
    }

    destroy(): void {
        clearTimeout(this.blurTimer);
        for (const [ev, fn] of this.bound) {
            try { this.o.input.removeEventListener(ev, fn, true); } catch (e) { }
            try { this.o.input.removeEventListener(ev, fn); } catch (e) { }
        }
        this.bound = [];
        this.close();
    }

    // ---- what is being completed --------------------------------------------------

    private normalize(c: SuggestItem | string): SuggestItem { return normalizeItem(c); }
    private context(text: string, caret: number): SuggestContext | null {
        return suggestContext(text, caret, this.o.mode);
    }
    private pool(ctx: SuggestContext): SuggestItem[] { return suggestPool(this.o.items() || [], ctx); }
    private rank(pool: SuggestItem[], needle: string) { return suggestRank(pool, needle); }

    private build(ctx: SuggestContext, ranked: Array<{ cmd: SuggestItem; score: number }>): void {

        const limit = this.o.limit ?? 200;
        const kept = ranked.slice(0, limit).map((r) => r.cmd);
        if (!this.o.groupTitles) {
            this.groups = kept.length ? [{ title: "", items: kept }] : [];
            this.flat = kept;
            return;
        }
        const order: SuggestKind[] = ["goto", "table", "row", "column", "tag", "tool"];
        const of = ctx.table ? " of " + ctx.table : "";
        const title = (k: SuggestKind) =>
            k === "goto" ? "Go to" : k === "table" ? "Tables" : k === "row" ? "Rows" + of
                : k === "column" ? "Columns" + of : k === "tag" ? "Tags" : "Tools";
        const groups: Array<{ title: string; items: SuggestItem[] }> = [];
        const flat: SuggestItem[] = [];
        for (const k of order) {
            const items = kept.filter((c) => (c.kind ?? "tag") === k);
            if (!items.length) continue;
            groups.push({ title: title(k), items });
            for (const it of items) flat.push(it);
        }
        this.groups = groups;
        this.flat = flat;
    }

    // ---- the panel ----------------------------------------------------------------

    /** The grey text on the right: what picking the row will put in the field. */
    private right(c: SuggestItem): string {
        if (c.kind === "goto") return c.hint ?? "";
        const ins = ("" + (c.insert ?? c.label ?? "")).trim();
        return ins && ins !== c.label ? ins : "";
    }

    private place(): void {
        if (!this.el) return;
        const r = this.o.input.getBoundingClientRect();
        const longest = this.flat.reduce(
            (n, c) => Math.max(n, (c.label ?? "").length + (this.right(c) ?? "").length), 12);
        const width = Math.max(240, Math.min(560,
            Math.min(longest * 7.6 + 56, window.innerWidth - 16)));
        const below = window.innerHeight - r.bottom;
        const above = below < 220 && r.top > below;
        const s = this.el.style;
        s.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - width - 8))) + "px";
        s.width = Math.round(width) + "px";
        s.top = above ? "" : Math.round(r.bottom + 4) + "px";
        s.bottom = above ? Math.round(window.innerHeight - r.top + 4) + "px" : "";
        s.maxHeight = Math.round(Math.max(160, Math.min(360, above ? r.top - 16 : below - 16))) + "px";
    }

    private render(): void {
        if (!this.el) {
            this.el = document.createElement("div");
            this.el.className = "ls-sug";
            this.el.setAttribute("role", "listbox");
            // The field must not lose focus before the pick lands.
            this.el.addEventListener("mousedown", (e) => e.preventDefault());
            document.body.appendChild(this.el);
        }
        let html = "", i = 0;
        for (const g of this.groups) {
            if (g.title) html += '<div class="ls-sug-head">' + esc(g.title) + "</div>";
            for (const c of g.items) {
                const r = this.right(c);
                html += '<div class="ls-sug-row' + (i === this.index ? " is-on" : "") +
                    '" role="option" data-i="' + i + '">' +
                    '<span class="ls-sug-label">' + esc(c.label) + "</span>" +
                    (r ? '<span class="ls-sug-ins">' + esc(r) + "</span>" : "") + "</div>";
                i++;
            }
        }
        if (this.o.footer) html += '<div class="ls-sug-foot">' + this.o.footer + "</div>";
        this.el.innerHTML = html;
        this.el.querySelectorAll<HTMLElement>(".ls-sug-row").forEach((row) => {
            const n = +(row.getAttribute("data-i") || 0);
            row.onmousedown = (e) => { e.preventDefault(); this.index = n; this.accept(); };
            row.onmouseenter = () => { this.index = n; this.paint(); };
        });
        this.place();
    }

    /** Move the highlight without rebuilding the rows. */
    private paint(): void {
        if (!this.el) return;
        this.el.querySelectorAll<HTMLElement>(".ls-sug-row").forEach((row) => {
            const on = +(row.getAttribute("data-i") || 0) === this.index;
            row.classList.toggle("is-on", on);
            if (on) { try { row.scrollIntoView({ block: "nearest" }); } catch (e) { } }
        });
    }

    // ---- the cycle ----------------------------------------------------------------

    refresh(opts: { all?: boolean } = {}): void {
        const el = this.o.input;
        const text = "" + (el?.value ?? "");
        const caret = (el && el.selectionStart != null) ? el.selectionStart : text.length;
        const focused = typeof document !== "undefined" && document.activeElement === el;

        const lead = this.o.lead ? (this.o.lead(text, caret) || []) : [];

        const everything = () => {
            this.ctx = { scope: "word", table: "", term: "", from: caret, to: caret };
            this.build(this.ctx, this.rank(this.pool(this.ctx), ""));
        };

        // Nothing typed and the caret is in the field: offer the lot, which is what
        // Ctrl+Space asks for anyway. Guarded on the field really holding focus, so the
        // list does not show itself when the page merely loads.
        if (this.o.mode !== "plain" && focused && !text.trim()) {
            everything();
            this.lead(lead);
            this.after();
            return;
        }

        const ctx = this.context(text, caret);
        if (!ctx) {
            if (opts.all) { everything(); this.lead(lead); this.after(); return; }
            this.close();
            return;
        }
        if (ctx.scope === "word" && !opts.all && ctx.term.length < 1) { this.close(); return; }

        const ranked = this.rank(this.pool(ctx), ctx.term);
        const exact = ctx.term && ranked.length === 1 && ranked[0].score === 0;
        if (!ranked.length || exact) {
            // Nothing to complete -- but the caret may still be standing in a finished
            // reference, and then the list is worth opening for that one lead row.
            this.groups = []; this.flat = []; this.ctx = ctx;
            this.lead(lead);
            if (this.flat.length) { this.after(); return; }
            this.close();
            return;
        }

        this.ctx = ctx;
        this.build(ctx, ranked);
        this.lead(lead);
        this.after();
    }

    /** Rows the caller wants first, above every section. */
    private lead(items: SuggestItem[]): void {
        this.leadCount = 0;
        if (!items || !items.length) return;
        this.leadCount = items.length;
        const norm = items.map((c) => this.normalize(c));
        this.groups = [{ title: this.o.groupTitles ? "Go to" : "", items: norm }].concat(this.groups);
        this.flat = norm.concat(this.flat);
    }

    private after(): void {
        if (!this.flat.length) { this.close(); return; }
        // Enter completes; it does not navigate. So the highlight starts on the first
        // real candidate, and a lead row is reached deliberately -- Tab, an arrow or a
        // click -- rather than by being what Enter happens to land on.
        this.index = this.leadCount < this.flat.length ? this.leadCount : 0;
        this.shown = true;
        this.render();
    }

    close(): void {
        if (!this.shown && !this.el) return;
        this.shown = false;
        this.groups = []; this.flat = []; this.index = 0; this.leadCount = 0;
        if (this.el) {
            try { this.el.parentNode?.removeChild(this.el); } catch (e) { }
            this.el = null;
        }
    }

    move(step: number): void {
        if (!this.shown || !this.flat.length) return;
        const n = this.flat.length;
        this.index = (this.index + step + n) % n;
        this.paint();
    }

    accept(pick?: SuggestItem): void {
        const c = pick ?? this.flat[this.index];
        if (!c) return;
        const ctx = this.ctx;
        this.close();

        // The caller may own this row outright -- a "Go to", a tool -- in which case
        // nothing is typed.
        if (this.o.onPick) {
            let handled: any = false;
            try { handled = this.o.onPick(c, ctx); } catch (e) { console.warn("suggest pick", e); }
            if (handled === true) return;
        }

        const el = this.o.input;
        const text = "" + (el?.value ?? "");
        const insert = ("" + (c.insert ?? c.label ?? "")).trim();
        const use = ctx ?? this.context(text, (el && el.selectionStart != null) ? el.selectionStart : text.length);
        if (!use) return;

        // Picking inside a finished reference must not double its bracket: "=Budget[Re|nt]"
        // taking Rent (which inserts "Rent]") would leave "Rent]]".
        let to = use.to;
        const close = insert.slice(-1);
        if ((close === "]" || close === ")" || close === "[") && text.charAt(to) === close) to += 1;

        const next = text.slice(0, use.from) + insert + text.slice(to);
        const pos = use.from + insert.length;
        if (this.o.onInsert) {
            try { this.o.onInsert(next, pos); } catch (e) { console.warn("suggest insert", e); }
        } else {
            el.value = next;
            try { el.setSelectionRange(pos, pos); } catch (e) { }
            try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) { }
        }
        try { el.focus(); } catch (e) { }
        // "Budget[" completed to a table leaves the caret inside the bracket, where that
        // table's rows are what comes next: offer them straight away.
        setTimeout(() => this.refresh(), 0);
    }
}

// The lionscript side has no Angular and no module loader: it picks the class off window.
try { (window as any).LionSuggest = SuggestList; } catch (e) { }
