import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PubComponentListener } from './pub-component-listener';
import { PubComponent } from './pub-component';
import { IoniScriptManager } from '../engine/io-manager';
import { LionEngine } from '../engine/io-engine';



@Component({
    selector: 'button-menu-toolbar',
    templateUrl: './simple-button-menu.component.html',
    styleUrls: ['./simple-button-menu.component.scss']
})
export class SimpleMenuButtonComponent implements OnInit, PubComponent {
    buttons = [
        { label: 'Home', icon: 'home' },
        { label: 'Search', icon: 'search' },
        { label: 'Settings', icon: 'settings' }
    ];

    @Input() listener: PubComponentListener;
    @Input() data: any;
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    selected = '';
    disabled = false;
    constructor(public cd: ChangeDetectorRef) {
    }
    resolveFunction: any;
    init(ionEngine: IoniScriptManager): string {
        debugger;
        if (this.data) {
            if (this.data['buttons']) {
                this.buttons = this.data['buttons']
            }
        }
        return '';
    }
    onButtonClick(button: any): void {
        LionEngine.ionfunctions[button['click']]()
    }
    ngOnInit(): void {
        this.initData = '';
    }

    textFieldValue = '';
    placeholder = 'Enter command';
    buttonSize = 24;

    sizes = [16, 24, 48];

    setButtonSize(size: number) {
        this.buttonSize = size;
    }

    submitText() {
        console.log('Submitted:', this.textFieldValue);
    }
}