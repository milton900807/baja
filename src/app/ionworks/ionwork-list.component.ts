

import {
    OnInit,
    Input,
    Component,
    ViewChild,
     EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule
} from "@angular/core";
import { IoniScript } from '../published-lionscript/ioniscript';

@Component({
    selector: 'ionwork-list',
    templateUrl : './ionwork-list.component.html',
})
export class IonWorkslistComponet implements OnInit {
    @Input()
    ionscriptlist:IoniScript[];
	@Output() selected_rule: EventEmitter<IoniScript> = new EventEmitter<IoniScript>();
	@Output() delete_rule: EventEmitter<IoniScript> = new EventEmitter<IoniScript>();

    constructor(private ref:ChangeDetectorRef) {
    }
    ngOnInit():any {
    }

    loadAndSelect ( rule:IoniScript) {
        this.selected_rule.emit ( rule )
    }
    removeRule ( rule:IoniScript) : void {
        this.delete_rule.emit ( rule );
    }
}
