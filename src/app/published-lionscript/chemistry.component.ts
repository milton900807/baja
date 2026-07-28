import {
    OnInit,
    Component,
    Input
} from "@angular/core";

import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";



@Component({
    selector: 'chemistry-display',
    templateUrl: './chemistry.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class ChemistryComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    initData: any = '';
    @Input() title: string;
    isisno = 0;

    ngOnInit(): void {
        this.initData = this.data;
        this.isisno = this.data;
    }
    init(): string {
        this.isisno = this.data;
        console.log(' printing the init data ' + JSON.stringify(this.data));
        return '';
    }
    resolveFunction;
    apply(value: string) {
        if ( this.listener != null )
        {
            this.listener.update( this.title, this.data );
        }

        if (this.resolveFunction) {
            // console.log(" value " + value);
            this.resolveFunction(value);
        }
    }
}