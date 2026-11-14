import { Component, OnInit, ViewEncapsulation } from "@angular/core";
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

    /** Fire the input's ion-function with the typed text on the item, then clear it. */
    submit(item: any): void {
        const text = ("" + (item?.["value"] ?? "")).trim();
        if (!text) { return; }
        item["value"] = text;
        this.openMenu = null;
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
