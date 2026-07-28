import {
    OnInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, Input, OnChanges
} from "@angular/core";
import { LionEngine } from "../../../../app/engine/io-engine";
import { PubComponentListener } from "../../pub-component-listener";
import { PubComponent } from "./../../pub-component";

import { FormBuilder } from '@angular/forms';


@Component({
    selector: 'register-user',
    templateUrl: './adduser.component.html',
    styleUrls: ['./adduser.component.scss']
})
export class AddUserComponent implements OnInit, OnChanges, PubComponent {
    @Input() listener: PubComponentListener;
    selectionListener = null;
    data: any = '';
    initData: any = '';
    title: string;
    visibility: string = 'Hide';
    list = ['hello', 'world'];
    selected = '';
    apply_button = false;
    public search = '';
    private selectFunction;
    private submitFunction;
    checkoutForm = this.formBuilder.group({
        first: '',
        last: '',
        email: '',
        comment: ''
    });

    listFunction;
    model: any;
    formatter = (r) => r[this.searchField];
    searchField: any;
    SubmitButton = 'New Account'



    constructor(public cd: ChangeDetectorRef, private formBuilder: FormBuilder) {
    }
    onSubmit(): void {
        // Process checkout data here
        console.log('Your order has been submitted', this.checkoutForm.value);
        LionEngine.ionfunctions[this.submitFunction](this.checkoutForm.value);
        // this.checkoutForm.reset();
    }


    setApplyListener(listener) {
        this.selectionListener = listener;
    }
    handleResultSelected(result) {
        this.search = result;
        this.selectionListener(this.search);
    }
    ngOnInit(): void {
        this.initData = '';


    }
    ngOnChanges(): void {
        this.setSelected(this.model)
    }


    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
            // console.log ( " value " + value );
            // this.resolveFunction ( value );
        }
    }

    setSelected(item) {
        this.selected = item['item'];
        if (this.selectFunction) {
            this.selectFunction(this.selected);
        }
    }


    setLogText(logText): void {
        this.data = logText;
    }
    setVis(): void {
        if (this.visibility == 'Show') {
            this.visibility = "Hide";

        } else {
            this.visibility = "Show";
        }
    }

    applyButton(): void {
        this.apply_button = null;
        this.selectionListener(this.search);
    }

    getValue() {
        return this.model;
    }

    init(): string {
        if (this.resolveFunction)
            this.resolveFunction(this);
        if (this.data != null) {
            // this.list = this.data['list'];
            // // [resultFormatter]="formatter"
            // this.listFunction = (text: Observable<string>) => {
            //     if (text != null) {
            //         return text.pipe(
            //             debounceTime(200),
            //             distinctUntilChanged(),
            //             map(term => term.length < 2 ? []
            //                 : this.list.filter(v => v[this.searchField].toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
            //         )
            //     }
            // }
            // this.searchField = this.data['searchField'];

            // if (this.data['selectFunction'] != null) {
            //     this.selectFunction = LionEngine.ionfunctions[this.data['selectFunction']];
            // }
            if (this.data['submit'] != null) {
                this.submitFunction = this.data['submit']
            }



        }



        return 'complete';
    }
    append(v: string): void {
        this.data += v;
    }

}