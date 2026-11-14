import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from "../engine/io-engine";
import { PubComponentListener } from "./pub-component-listener";

/**
 * A flat row of toolbar items. Each item fires its ion-function on click and an
 * optional mouseOver ion-function on hover.
 *
 * THREE KINDS OF ITEM, chosen by `type`. An item with NO type is an ordinary
 * circular icon button and renders exactly as it always has, which is what every
 * existing caller passes.
 *
 * data = {
 *   title?: string,
 *   buttons: [
 *     // a button
 *     { label, ionFunction | ionfunction, tooltip?, icon?, iconSymbol?,
 *       color?, badge?, mouseOver? },
 *
 *     // a menu: a button that opens a list of ordinary button items
 *     { type: 'menu', label, icon?, tooltip?, items: [ <button items> ] },
 *
 *     // a command input: a text field that fires its ion-function on Enter
 *     { type: 'input', placeholder?, goLabel?, label?, ionFunction }
 *   ]
 * }
 *
 * THE INPUT HANDS ITS TEXT BACK ON THE ITEM OBJECT. This component binds the very
 * array it was given, so an item is the same object the caller built: the typed
 * text is written to `b.value` before the ion-function fires, and the caller reads
 * it from the item it is handed. That avoids inventing a second channel for one
 * string, and it means the caller cannot read a stale value -- there is only one.
 */
@Component({
    selector: "button-menu",
    templateUrl: "./button-menu.component.html",
    styleUrls: ["./button-menu.component.css"],
    encapsulation: ViewEncapsulation.None,
})
export class ButtonMenuComponent implements OnInit, PubComponent {
    listener: PubComponentListener;
    data: any;
    resolveFunction: any;
    title: string;

    buttons: any[] = [];

    /** The menu item whose popup is open, or null. One at a time. */
    openMenu: any = null;

    /**
     * The panel under the bar that a command's answer is rendered into. Handed to the
     * caller on the item (see submit), the same way the typed text is: the caller owns
     * what goes in it, this component owns where it sits and when it is dismissed.
     */
    @ViewChild("inputResults") inputResults: ElementRef;

    init(): string {
        return "";
    }

    /** Close any open menu. Called when the input takes focus, and on Escape. */
    closeMenu(): void {
        this.openMenu = null;
    }

    /** Open this menu, or close it if it is the one already open. */
    toggleMenu(item: any): void {
        this.openMenu = (this.openMenu === item) ? null : item;
    }

    /** An entry inside a menu: close the menu, then fire the entry's own function. */
    pick(item: any): void {
        this.openMenu = null;
        this.click(item);
    }

    /**
     * Enter submits; Escape closes an open menu. Other keys are stopped from
     * travelling further: the editor listens on the window for keystrokes, so
     * without this, typing a command also drives the canvas.
     */
    inputKey(event: any, item: any): void {
        try { event.stopPropagation(); } catch (e) { }
        if (event && event.key === "Enter") {
            try { event.preventDefault(); } catch (e) { }
            this.submit(item);
        }
    }

    /** Empty the results panel. It is hidden while empty, so this closes it. */
    clearResults(): void {
        try {
            const el = this.inputResults && this.inputResults.nativeElement;
            if (el) { el.innerHTML = ""; }
        } catch (e) { }
    }

    /**
     * NO DOCUMENT-LEVEL LISTENERS HERE.
     *
     * This component briefly registered @HostListener("document:mousedown") to dismiss
     * the panel on an outside click. A handler on the document runs inside the Angular
     * zone for every mousedown anywhere in the application -- including every press on
     * the editor canvas, which has mouse handling of its own and is the busiest surface
     * in the app. A toolbar is not entitled to a say in every click in the product, and
     * one widget's convenience is not worth a global hook.
     *
     * So dismissal is the panel content's own business: whatever renders into it renders
     * a way out with it, and submit() replaces the content each time anyway.
     */

    /** Fire the input's ion-function with the typed text on the item, then clear it. */
    submit(item: any): void {
        const text = ("" + (item?.["value"] ?? "")).trim();
        if (!text) { return; }
        item["value"] = text;
        this.openMenu = null;
        // Where to put the answer. Handed over on the item so the caller needs no
        // selector and no knowledge of this component's markup; without it the caller
        // opens a window of its own, which is what this replaces.
        try {
            item["resultsHost"] = (this.inputResults && this.inputResults.nativeElement) || null;
        } catch (e) { item["resultsHost"] = null; }
        this.click(item);
        // Cleared after firing, not before: the handler reads item.value synchronously
        // when it starts, and leaving the text in place made every later Enter re-run
        // the request that was already running.
        item["value"] = "";
    }

    ngOnInit(): void {
        if (this.data != null) {
            if (this.data["buttons"]) this.buttons = this.data["buttons"];
            if (this.data["title"]) this.title = this.data["title"];
        }
        if (this.resolveFunction) this.resolveFunction(this);
    }

    /** Fire the button's ion-function (accepts either key spelling). */
    click(item: any): void {
        const func = item?.["ionfunction"] ?? item?.["ionFunction"];
        if (func != null && LionEngine.ionfunctions[func]) {
            LionEngine.ionfunctions[func](item);
        }
    }

    /** Optional hover ion-function (e.g. status-bar messages). */
    hover(item: any): void {
        const func = item?.["mouseOver"] ?? item?.["mouseover"];
        if (func != null && LionEngine.ionfunctions[func]) {
            LionEngine.ionfunctions[func](item);
        }
    }
}
