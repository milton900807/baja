import {
    OnInit,
    Input,
    Component,
    ChangeDetectorRef, OnChanges,
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";
import { FunctionUtil } from "../functions/function-util";

@Component({
    selector: 'solr-facet-list',
    templateUrl: './solr-facet-list.component.html',
})
export class SolrFacetListComponent implements OnInit, OnChanges, PubComponent {
    data: any;
    @Input() listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    init(): string {
        return '';
    }

    show_search = true;
    search_string = "";


    @Input()
    url: string;
    initData
    facet_field_name: string = "";
    facet_field_results = [];

    selectionListener;



    constructor() {
    }

    ngOnChanges() {
        console.log(" changes ");
        this.update();
    }

    ngOnInit(): any {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        if (this.data != null && 'url' in this.data) {
            this.url = this.data['url']
            this.update();
        }
    }
    apply(value: string) {
    }

    select(facet_obj) {
        this.selectionListener(facet_obj);
    }

    setSelectListener(selectionListener) {
        this.selectionListener = selectionListener;
    }


    search() { }

    updateQueryString(url) {
        let q = "";
        if (this.search_string == null || this.search_string == '*' || this.search_string.length < 1) {
            q = "";
        }
        else {
            q = this.search_string;
        }


        let index = url.indexOf("facet.prefix=");
        let lindex = url.indexOf('&', index);
        if (index < 0) {
            url = url + '&facet.prefix=' + q;
        } else if (lindex < 0 && index > 0) {
            let t = url.substring(0, index);
            url = t + 'facet.prefix=' + q
        }
        else {
            let t = url.substring(0, index);
            let t2 = url.substring(lindex);
            url = t + 'facet.prefix=' + q + t2;
        }
        return url;
    }
    update() {
        this.url = this.updateQueryString(this.url);
        if (this.url != null) {
            FunctionUtil.GETJSON(this.url).then(jsonr => {
                if (jsonr['facet_counts']) {
                    let s = jsonr['facet_counts']['facet_fields']
                    let fields = Object.keys(s);
                    this.facet_field_results = [];
                    for (let f of fields) {
                        let rlist = s[f];
                        for (let index = 0; (index + 1) < rlist.length; index += 2) {
                            let name = rlist[index];
                            let count = rlist[index + 1];


                            this.facet_field_results.push({
                                'name': name, 'count': count
                            })
                        }
                    }
                }
            });
        }
    }


}
