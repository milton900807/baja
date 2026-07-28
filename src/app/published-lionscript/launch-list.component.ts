import { Component, OnInit, Output, Input, ChangeDetectorRef } from "@angular/core";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";
// let js = {
//     'wid': 'launch-to-new-tab-list',
//     'data': {
//         'list':list,
//         'label':'name'
//         'url':'webUrl'
// }
@Component({
    selector: 'launch-list',
    templateUrl: './launch-list.component.html'
})
export class LaunchListComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    @Input()
    item_list = null;
    @Input()
    label_field = null;
    @Input()
    url_field = null;
    @Input()
    date_field = null;


    ngOnInit(): void {
    }
    initData: any = '';
    resolveFunction;
    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }
    }
    init(): string {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        if (this.data != null) {

            this.item_list = this.data['list'];
            this.label_field = this.data['label-field'];
            this.url_field = this.data['url-field']
        }
        return '';
    }

    launch(ob) {
        let url = ob[this.url_field]
        window.open(url, "_blank");
    }
}
