    import {
        OnInit,
        Component,
        Input
    } from "@angular/core";
    import { PubComponent } from "./pub-component";
    import { LionEngine } from "../engine/io-engine";
    import { HookFunctionComponent } from "./hook-function-comp";
    import { PubComponentListener } from "./pub-component-listener";
    import { ColorEvent } from "ngx-color";
    import { detect } from "tesseract.js";

    @Component({
        selector: 'color-chooser',
        templateUrl: './color-chooser.component.html',
        styleUrls: ['./color-chooser.component.css']
    })
    export class ColorPaletteComponent implements OnInit, PubComponent, HookFunctionComponent {
        @Input() listener: PubComponentListener;
        @Input() data;
        initData: any = '';
        @Input() title: string;
        isValid = true;
        init_text = '';
        button_label = "Apply";
        ionfunction = '';
        showButton = true;
        width = "100%";
        height = "100%";
        colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800080', '#FFA500', '#008000', '#800000'];
        selectedColor: any = null;
        selectionListener = null;



        selectColor(color: any) {
            this.selectedColor = color;
            if (this.selectionListener) {
                this.selectionListener(color)
            }
        }
        rgbaStringToHex(rgbaString) {
            // Extract the rgba components from the string using regex
            const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
            if (!match) {
                throw new Error("Invalid RGBA format");
            }
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
            const redHex = r.toString(16).padStart(2, '0');
            const greenHex = g.toString(16).padStart(2, '0');
            const blueHex = b.toString(16).padStart(2, '0');
            const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');

            // Return in #RRGGBBAA format if alpha is not fully opaque
            return a < 1 ? `#${redHex}${greenHex}${blueHex}${alphaHex}` : `#${redHex}${greenHex}${blueHex}`;
        }

        handleChange($event: ColorEvent) {
            if (typeof $event === 'string'){

            }

            this.selectedColor = $event;
            if (this.selectionListener) {
                this.selectionListener(this.selectedColor)
            }
        }

        getWidgetValue(param: any) {
            return this.init_text;
        }

        updateValue(value) {
            this.init_text = value;
        }




        ngOnInit(): void {
            if (this.data != null) {
                // console.log ( " data : " + this.data );
                // this.initData = this.data;
                if (this.data['selectionListener'] != null) {
                    this.selectionListener = LionEngine.ionfunctions[this.data['selectionListener']];
                }
                if (this.data['ionHookFunction']) {
                    LionEngine.ionfunctions[this.data['ionHookFunction']](this);
                }
            }

            // detectcha
        }
        init(): string {

            if (this.data['color'] != null) {
                let c = this.data['color'];
                if (c != null && c.startsWith("rgb")) {
                    c = this.rgbaStringToHex(c.toString())
                }
                this.selectedColor = c;
                console.log(" selecterd color " + this.selectedColor)
            }


            if (this.data['showButton']) {
                this.showButton = this.data['showButton']
            }

            return '';
        }
        resolveFunction;
        apply(value: string) {
            this.isValid = false;
            if (this.ionfunction != null && LionEngine.ionfunctions[this.ionfunction]) {
                LionEngine.execIon(this.ionfunction, value);
            }
            if (this.resolveFunction) {
                // console.log(" value " + value);
                this.resolveFunction(value);
            }
        }
    }