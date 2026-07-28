import { Directive, ViewContainerRef, Input } from '@angular/core';

@Directive({
    selector: '[pub-comp-list]',
})
export class PubDirective {
    @Input() input_value: string;
    constructor(public viewContainerRef: ViewContainerRef) { }
}


