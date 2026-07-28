import { Directive, ViewContainerRef, Input } from '@angular/core';

@Directive({
    selector: '[plate-directive]',
})
export class PlateDirective {
    @Input() input_value: string;
    title:string = null;
    init ( plateData ) : string {
        return '';
    }
    constructor(public viewContainerRef: ViewContainerRef) { }
}


