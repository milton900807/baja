import {
    OnInit,
    Component,
    Input,
    ViewChild,
    ElementRef,
    OnChanges,
    ComponentFactoryResolver,
    ChangeDetectorRef,
    AfterViewInit
} from "@angular/core";
import { PubComponent } from '../pub-component';
import { PubDirective } from '../pub.directive';
import { SimplePlate } from './simple-plate.component';
import { PlateDirective } from './plate.directive';
import { PubComponentListener } from "../pub-component-listener";

@Component({
    selector: 'search-results',
    templateUrl: './search-results.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SearchResultsComponent implements OnInit, AfterViewInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    initData: any = '';
    save_function: any = null;
    visibility: string = 'Hide';
    status = "working";
    button_label = "Commit";
    resolveFunction;
    plateData = {};
    // @ViewChild(PlateDirective, { static: false }) compService: PlateDirective;
    clickListener = null;
    plate: SimplePlate = null;






    xSavings = [];

    xNetworth = [93453.919999999998, 81666.570000000007, 69889.619999999995, 78381.529999999999, 141395.29999999999, 92969.020000000004, 66090.179999999993, 122379.3];

    yexps = [];

    yauthors = [];

    trace1 = {
        x: this.xSavings,
        y: this.yexps,
        xaxis: 'x1',
        yaxis: 'y1',
        type: 'bar',
        marker: {
            color: 'rgba(50,171,96,0.6)',
            line: {
                color: 'rgba(50,171,96,1.0)',
                width: 1
            }
        },
        name: 'Household savings, percentage of household disposable income',
        orientation: 'h'
    };

    trace2 = {
        x: this.xNetworth,
        y: this.yauthors,
        xaxis: 'x2',
        yaxis: 'y1',
        mode: 'lines+markers',
        line: {
            color: 'rgb(128,0,128)'
        },
        name: 'Household net worth, Million USD/capita'
    };

    gdata = [this.trace1];

    layout = {
        title: 'Files for user',
        xaxis1: {
            range: [0, 1000],
            domain: [0, 0.5],
            zeroline: false,
            showline: false,
            showticklabels: true,
            showgrid: true
        },

        // xaxis2: {
        //     range: [25000, 150000],
        //     domain: [0.5, 1],
        //     zeroline: false,
        //     showline: false,
        //     showticklabels: true,
        //     showgrid: true,
        //     side: 'top',
        //     dtick: 25000
        // },
        legend: {
            x: 0.029,
            y: 1.238,
            font: {
                size: 10
            }
        },
        margin: {
            l: 100,
            r: 20,
            t: 200,
            b: 70
        },
        width: 600,
        height: 600,
        paper_bgcolor: 'rgb(248,248,255)',
        plot_bgcolor: 'rgb(248,248,255)',
        annotations: [
            {
                xref: 'paper',
                yref: 'paper',
                x: -0.2,
                y: '-0.109',
                text: 'OECD ' + '(2015), Household savings (indicator), ' + 'Household net worth (indicator). doi: ' + '10.1787/cfc6f499-en (Accessed on 05 June 2015)',
                showarrow: false,
                font: {
                    family: 'Arial',
                    size: 10,
                    color: 'rgb(150,150,150)'
                }
            }
        ]
    };





    constructor(private componentFactoryResolver: ComponentFactoryResolver, private changeDetector: ChangeDetectorRef) {

    }
    ngAfterViewChecked() {
        this.changeDetector.detectChanges();
    }
    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }
        if (this.save_function) {
            this.save_function();
        }
    }
    init(): string {

        // if (this.data != null) {
        //     if (this.data['plate'] != null) {
        //         this.plateData = this.data['plate']
        //     }
        //     if (this.data['clickListener'] != null)
        //         this.clickListener = this.data['clickListener']
        // }
        // if (this.resolveFunction) {
        //     this.resolveFunction(this);
        // }
        return ';'

    }
    ngOnInit(): void {
        let documents = JSON.parse(this.data);
        let index = 0;
        // console.log(documents)
        for (let doc in documents) {
            this.yexps.push(doc['lastModifiedBy']['user']['displayName'])
            this.xSavings.push(doc['size']/1000)
            // }
            if (index > 1000)
                break;
        }

        for (var i = 0; i < this.xSavings.length; i++) {
            let result = {
                xref: 'x1',
                yref: 'y1',
                x: this.xSavings[i],
                y: this.yexps[i],
                text: this.xSavings[i],
                font: {
                    family: 'Arial',
                    size: 12,
                    color: 'rgb(50, 171, 96)'
                },
                showarrow: false,
            };
            var result2 = {
                xref: 'x2',
                yref: 'y1',
                x: this.xNetworth[i] - 20000,
                y: this.yauthors[i],
                text: this.xNetworth[i] + ' M',
                font: {
                    family: 'Arial',
                    size: 12,
                    color: 'rgb(128, 0, 128)'
                },
                showarrow: false
            };
            this.layout.annotations.push(result, result2);
            //   Plotly.newPlot('myDiv', data, layout);
        }
        // this.generateData();
    }
    ngAfterViewInit() {
        // this.loadWidget({ wid: 'any' }, this.resolveFunction)

    }
    setPlateLayout(pl) {
        // this.loadWidget({ wid: 'any' }, this.resolveFunction)
    }
    setClickListener(clickListener) {
        this.plate.setClickListener(clickListener);
    }

    createWidget(w) {
        return SimplePlate;
    }

    // this is the new way and more general way for loading a widget 
    loadWidget(wid: {}, resolve) {
        let type = wid['wid'];
        if (type == null)
            type = wid['type'];
        let line = wid['input'];
        let title = wid['title'];
        if (line == undefined || line == null) {
            line = wid['data'];
        }
        let pubcomp = this.createWidget(type);
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
        // let viewContainerRef = this.compService.viewContainerRef;
        // let componentRef = viewContainerRef.createComponent(componentFactory);
        // (<PlateDirective>componentRef.instance).title = title;
        // this.data.plate=this.plateData;
        // (<PlateDirective>componentRef.instance).init(this.data);
        // this.plate = (<SimplePlate>componentRef.instance)
    }
    clear() {
        // this.compService.viewContainerRef.clear();
    }

    select(range) {

    }
    getData() {
        return this.data;

    }


}