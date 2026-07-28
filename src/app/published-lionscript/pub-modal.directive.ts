import { Directive, Input, OnInit, Renderer2, ViewContainerRef } from "@angular/core";

@Directive({
    selector: '[pub-modal]',
})
export class PubModalDirective implements OnInit {
    @Input() input_value: string;

    constructor(public viewContainerRef: ViewContainerRef) {

    }

    ngOnInit(): void {
    }



}


