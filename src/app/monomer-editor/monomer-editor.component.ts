import {
    OnInit,
    Component,
    ViewChild,
    Input
} from "@angular/core";
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MonomerManager } from "./monomer-manager.component";
import { ApplicationControls, AppListener } from "./application-controls";
// import { Modal } from "ng2-modal";
import { MonomerActionObserver } from "./monomer-action-observer";
import { MonomerDB } from "../db/MonomerDB.1";


@Component({
    selector: 'monomer-editor',
    template: `
                <span [ngSwitch]="mode">
                    <span *ngSwitchCase="'lib'">
                        <monomer-library [monomer_db]="monomer_db" [monomer_manager]="monomer_manager">Loading monomer library... </monomer-library>
                    </span>
                    <span *ngSwitchCase="'monomer_manager'">
                        <monomer-library-manager [monomer_db]="monomer_db" [monomer_manager]="monomer_manager"></monomer-library-manager>
                    </span>
                    <span *ngSwitchCase="'unit_builder'">
                        <unit-builder [monomer_db]="monomer_db"></unit-builder>
                    </span>
                    <span *ngSwitchDefault>
                    </span>
                </span>
    `,

})
export class MonomerEditor implements MonomerActionObserver, OnInit, AppListener {
    @Input()
    monomer_manager: MonomerManager;
    @Input()
    monomer_db: MonomerDB;
    @Input()
    app_control: ApplicationControls;
    // @ViewChild('modal')
    // modal: Modal;
    mode: string = "lib";


    constructor(
        private route: ActivatedRoute,
        private router: Router) {

    }

    hide(): void {

        this.route.params.forEach((params: Params) => {
            let monomerid = params['id'];

        });


        document.getElementById("myDropdown").classList.toggle("show");
    }

    loadRegistration(): void {
        this.mode = "registration";
    }

    loadSearch(): void {
        this.mode = "lib";
    }

    myFunction(): void {
        document.getElementById("myDropdown").classList.toggle("show");
    }

    ngOnInit(): any {
        if (this.app_control != null) {
            this.app_control.addListener(this);
        }
    }

    saveSelectedMonomer(model:any) {
        // this.modal.open();
        let js = this.monomer_manager.selectedMonomer;
        debugger;
        // this.monomer_manager.reload(this.monomer_manager.selectedMonomer);
    }

    action_successful(): void {
        // if (this.modal) {
        //     this.modal.close();
        // }
    }

    action_failed(): void {
        // this.modal.close();
    }

    setMode(mode: string) {
        this.mode = mode;
    }


    buildunit(): void {
        this.mode = "unit_builder";
    }
    buildOligo(): void {
        this.mode = "oligo_builder";
    }


    deleteMonomer(): void {


    }

    librarymanager(): void {
        this.mode = "monomer_manager";
    }

    newMonomer(): void {

        console.log(" reset this panel ");


    }
}
