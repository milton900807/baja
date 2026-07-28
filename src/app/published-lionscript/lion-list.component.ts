

import {
    OnInit,
    Input,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule
} from "@angular/core";
import { IoniScriptManager } from "../engine/io-manager";
import { IoniScript } from "./ioniscript";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'lion-list',
    templateUrl: './lion-list.component.html',
})
export class LionListComponent implements OnInit, PubComponent {
    @Input()
    helm_rules_list: IoniScript[];
    @Output() selected_rule: EventEmitter<IoniScript> = new EventEmitter<IoniScript>();
    @Output() delete_rule: EventEmitter<IoniScript> = new EventEmitter<IoniScript>();

    rows = [[]]
    columns = []

    constructor() {


    }
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    init(ionEngine: IoniScriptManager): string {
        return '';
    }
    ngOnInit(): any {
        if (this.data) {
            this.rows = this.data['values']
            this.columns = this.data['columns']
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
    }
    loadAndSelect(rule: IoniScript) {
        this.selected_rule.emit(rule)
    }
    removeRule(rule: IoniScript): void {
        this.delete_rule.emit(rule);
    }
}
