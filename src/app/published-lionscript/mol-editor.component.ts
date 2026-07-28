import {
    Component, Input, ElementRef, AfterViewInit, ViewChild
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { LionEngine } from '../engine/io-engine';
import { MonomerManager } from '../monomer-editor/monomer-manager.component';
import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';

@Component({
    selector: 'mol-editor',
    template: '<monomer-editor [monomer_db]="mdb" [monomer_manager]="monomer_manager"></monomer-editor>  <br>',
    styles: ['canvas { border: 0px solid lightGray; }']
})
export class MolEditorComponent implements PubComponent, AfterViewInit {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string = '';
    mouseListener;
    mouseDownListener;
    mouseUpListener;
    mouseMoveListener;
    mdb;
    monomer_manager;


    init(): string {

        if (this.data) {
            if (this.data['monomers']) {
                this.mdb = this.data['monomers']
            }

            if (this.data['mouseListener`'])
                this.mouseListener = LionEngine.ionfunctions[this.data['mouseListener']]
            if (this.data['mouseDownListener'])
                this.mouseDownListener = LionEngine.ionfunctions[this.data['mouseDownListener']]
            if (this.data['mouseUpListener'])
                this.mouseUpListener = LionEngine.ionfunctions[this.data['mouseUpListener']]
            if (this.data['mouseMoveListener'])
                this.mouseMoveListener = LionEngine.ionfunctions[this.data['mouseMoveListener']]
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        this.monomer_manager = new MonomerManager(this.mdb);
        return '';
    }

    setMonomer(monomer) {
        // public setSelectedMonomer(mon: IMonomer): void {
        this.monomer_manager
            .setSelectedMonomer(monomer);
    }
    getMonomer() {
        let js = this.monomer_manager.selectedMonomer;
        


    }



    @Input() public width = 800;
    @Input() public height = 300;
    public ngAfterViewInit() {
    }
    setSize(w, h) {
    }

}