import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { PubComponent } from "./pub-component";
import { LionEngine } from "../engine/io-engine";
import { PubComponentListener } from "./pub-component-listener";

/**
 * A minimal sibling of SimpleMenuComponent: renders a flat row/grid of
 * circular, labelled buttons (no command input, no submenus). Each button
 * fires its ion-function on click and an optional mouseOver ion-function on
 * hover.
 *
 * data = {
 *   title?: string,
 *   buttons: [
 *     { label: string, ionFunction | ionfunction: <ref>,
 *       tooltip?: string, color?: string, mouseOver?: <ref> },
 *     ...
 *   ]
 * }
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

    init(): string {
        return "";
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
