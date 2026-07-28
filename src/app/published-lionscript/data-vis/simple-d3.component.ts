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
import * as d3 from 'd3';
import { PubComponent} from '../pub-component';
import { PubDirective } from '../pub.directive';
import { SimplePlate } from './simple-plate.component';
import { PlateDirective } from './plate.directive';
import { PubComponentListener } from "../pub-component-listener";
import { LionEngine } from "../../../app/engine/io-engine";

@Component({
    selector: 'simple-d3-panel',
    templateUrl: './simple-d3.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SimpleD3Component implements OnInit, AfterViewInit, PubComponent {
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
    @ViewChild(PlateDirective, { static: false }) compService: PlateDirective;
    clickListener = null;

    private values = []
    private svg;
    private margin = 50;
    width = 750 - (this.margin * 2);
    height = 400 - (this.margin * 2);
    private fun;





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

    private createSvg(): void {
        this.svg = d3.select("figure#bar")
            .append("svg")
            .attr("width", this.width + (this.margin * 2))
            .attr("height", this.height + (this.margin * 2))
            .append("g")
            .attr("transform", "translate(" + this.margin + "," + this.margin + ")");
    }

    private drawBars(data: any[]): void {
        // Create the X-axis band scale

        if (this.fun) {
            // drawIonFunction: createIonFunction((data, d3, svg, width, height) => {
            this.fun(data, d3, this.svg, this.width, this.height);
        } else {


            const x = d3.scaleBand()
                .range([0, this.width])
                .domain(data.map(d => d.compound))
                .padding(0.2);

            // Draw the X-axis on the DOM
            this.svg.append("g")
                .attr("transform", "translate(0," + this.height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            // Create the Y-axis band scale
            const y = d3.scaleLinear()
                .domain([0, 130])
                .range([this.height, 0]);

            // Draw the Y-axis on the DOM
            this.svg.append("g")
                .call(d3.axisLeft(y));

            // Create and fill the bars
            this.svg.selectAll("bars")
                .data(data)
                .enter()
                .append("rect")
                .attr("x", d => x(d.compound))
                .attr("y", d => y(d.um8))
                // .attr("y", d => y(d.linearIC50))
                .attr("width", x.bandwidth())
                .attr("height", (d) => this.height - y(d.um8))
                .attr("fill", "#d04a35");
        }
    }



    init(): string {
        if (this.data != null) {
            if (this.data['values'] != null) {
                this.values = this.data['values']
            }
            if (this.data['drawIonFunction']) {
                this.fun = LionEngine.ionfunctions[this.data['drawIonFunction']]
            }
            if ( this.data['width']){
                this.width = +this.data['width'] - (this.margin * 2);
            }
            if ( this.data['height']){
                this.height = this.data['height'] - (this.margin * 2);
            }
            if (this.data['clickListener'] != null)
                this.clickListener = this.data['clickListener']
        }
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return ';'

    }
    ngOnInit(): void {
        this.createSvg();
        this.drawBars(this.values);
    }
    ngAfterViewInit() {
        // this.loadWidget({ wid: 'any' }, this.resolveFunction)

    }
    createWidget(w) {
        return SimplePlate;
    }

    clear() {
        this.compService.viewContainerRef.clear();
    }


}