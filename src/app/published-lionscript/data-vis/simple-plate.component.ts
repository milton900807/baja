import {
    OnInit,
    Component,
    Input,
    ViewChild,
    ElementRef,
    OnChanges,
    ViewContainerRef
} from "@angular/core";
import { PubComponent } from '../pub-component';
import * as d3 from 'd3'
import { PlateDirective } from './plate.directive';
import { values } from 'd3';
import { LionEngine } from '../../engine/io-engine';
import { PubComponentListener } from "../pub-component-listener";

@Component({
    selector: 'simple-plate',
    templateUrl: './simple-plate.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class SimplePlate implements OnInit, OnChanges, PlateDirective {
    input_value: string;
    @Input() listener: PubComponentListener;
    @Input() title: string;
    resolveFunction;
    initialized = false;
    data: number[][] = [];
    clickListener;

    @ViewChild('grid', { static: true })
    private gridContainer: ElementRef;
    private grid_svg: any;
    private cells;
    plate = {
        rows: 2,
        columns: 2,
        cellWidth: 30,
        cellHeight: 20,
        type: undefined,
        highlight: [],
        layout: {
        }
    }
    currentHighlights = []



    constructor(public viewContainerRef: ViewContainerRef) { }
    ngOnChanges() {
    }
    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }
    }
    init(plateObject): string {
        console.log(" json plate data : " + JSON.stringify(plateObject))
        if (plateObject['plate'] != null)
            this.plate = plateObject['plate'];
        else
            this.plate = plateObject;

        if (plateObject['clickListener'] != null) {
            this.clickListener = plateObject['clickListener']
            // console.log ( ' click : ' + JSON.stringify ( this.clickListener ))
        }

        if (this.plate['values'] != null)
            this.setData(this.plate['values'])
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }
    getPlate() {
        var newplate = JSON.parse(JSON.stringify(this.plate));
        newplate['highlight'] = this.currentHighlights;
        return newplate;
    }
    ngAfterContentInit() {
        setTimeout(() => {
            if (this.gridContainer != undefined && this.gridContainer.nativeElement != undefined) {
                this.createPlate();
                this.initialized = true;
            }
        }, 1000)
    }
    ngOnInit(): void {
        // if (this.gridContainer != undefined && this.gridContainer.nativeElement != undefined) {
        //     this.createPlate();
        //     this.initialized = true;
        // }

    }
    setClickListener(clickListener) {
        this.clickListener = clickListener;
    }

    createPlate() {
        let gridelement = this.gridContainer.nativeElement;
        this.grid_svg = d3.select(gridelement).append('svg')
        this.grid_svg.attr("width", "100%")
        this.grid_svg.attr("height", "800px");
        let dat = this.gridData();
        this.cells = dat;
        let row = this.grid_svg.selectAll(".row").data(dat).enter().append("g").attr("class", "row");
        var column = row.selectAll(".square")
            .data(function (d) { return d; })
            .enter().append("rect")
            .attr("class", "square")
            .attr("x", function (d: { x, y }) { return d.x - 1; })
            .attr("y", function (d: { y }) { return d.y - 1; })
            .attr("width", function (d: { width }) { return d.width - 1; })
            .attr("height", function (d: { height }) { return d.height - 1; })
            .style("fill", "#fff")
            .style("stroke", "#202")

        let trow = this.grid_svg.selectAll(".trow").data(dat).enter().append("g")
        var lcolumn = row.selectAll(".tsquare")
            .data(function (d) { return d; })
            .enter().append("text")
            .text(function (d: { label, value }) {
                if (d.value != null) {
                    return '' + d.value;
                }
                return d.label
            })
            .attr("x", function (d: { x, y }) { return d.x + 5; })
            .attr("y", function (d: { x, y, width, height }) { return d.y + d.height - 4; })
            .text(function (d: { label, value }) {
                if (d.value != null) {
                    return '' + d.value;
                }
                return d.label
            })
            .attr("font-family", "sans-serif")
            .attr('pointer-events', 'none')
            .attr("font-size", "13px")
            .attr("fill", "darkGray");

        // let b = (d) => {
        //     if (this.clickListener != null) {
        //         LionEngine.execIon(this.clickListener, JSON.stringify(d));
        //     }
        //     console.log(" click : " + this.clickListener)
        //     d.click++;
        //     if ((d.click) % 4 == 0) { d3.select(d.well).style("fill", "#fff"); }
        //     if ((d.click) % 4 == 1) { d3.select(d.well).style("fill", "#2C93E8"); }
        //     if ((d.click) % 4 == 2) { d3.select(d.well).style("fill", "#F56C4E"); }
        //     if ((d.click) % 4 == 3) { d3.select(d.well).style("fill", "#838690"); }
        // }


        column.on('click', (d) => {
            if (this.clickListener != null) {
                LionEngine.execIon(this.clickListener, JSON.stringify(d));
            }

            // d.click++;
            // console.log ( " this : " +JSON.stringify ( this ))
            // if ((d.click) % 4 == 0) { d3.select(this).style("fill", "#fff"); }
            // if ((d.click) % 4 == 1) { d3.select(this).style("fill", "#2C93E8"); }
            // if ((d.click) % 4 == 2) { d3.select(d.well).style("fill", "#F56C4E"); }
            // if ((d.click) % 4 == 3) { d3.select(d.well).style("fill", "#838690"); }
        }
        )

        let selected_cells = this.plate['highlight'];
        if (selected_cells != null) {
            for (let s of selected_cells)
                this.highlight(s);
        }
    }

    async highlight(selected_cells) {
        console.log(" highlight function selected cells : " + selected_cells)
        this.currentHighlights.push(selected_cells);
        // if ( this.plate != null )
        // {
        //     if ( this.plate.highlight == null ){
        //         this.plate.highlight = [];
        //     }
        // }
        // this.plate.highlight.push ( selected_cells );
        let range = await this.highlightRange(selected_cells);

        let column_start = range[0]['column']['index']
        let row_start = range[0]['row']['index']
        let column_end = range[1]['column']['index']
        let row_end = range[1]['row']['index']

        // console.log(" ci : " + column_start)
        // console.log(" ri : " + row_start)
        // console.log(" cf : " + column_end)
        // console.log(" rf : " + row_end)

        let selectedCells = this.selectCells(column_start, row_start, column_end, row_end);

        let row = this.grid_svg.selectAll(".selected_row").data(selectedCells).enter().append("g").attr("class", "row");
        var column = row.selectAll(".selected_square")
            .data(function (d) { return d; })
            // .enter().append("rect")
            // .attr("class", "square")
            // .attr("x", function (d: { x, y }) { return d.x; })
            // .attr("y", function (d: { y }) { return d.y; })
            // .attr("width", function (d: { width }) { return d.width; })
            // .attr("height", function (d: { height }) { return d.height; })
            // .style("fill", "#fff")
            // .style("stroke", "#222")
            .enter().append("rect")
            .attr("class", "square")
            .attr("x", function (d: { x, y }) { return d.x; })
            .attr("y", function (d: { y }) { return d.y; })
            .attr("width", function (d: { width }) { return d.width - 1; })
            .attr("height", function (d: { height }) { return d.height - 1; })
            .style("fill", "magenta")
            .style("stroke", "#202")
    }
    getSelected(data) {
        return data;
    }




    // select(range: string) {
    //     var newplate = JSON.parse(JSON.stringify(this.plate));
    //     newplate['select'] = range;
    // }

    async highlightRange(_r) {
        let ranges = _r.split(':')
        let rv = await this.rangeValue(ranges[0], ranges[1])
        rv = this.transformExcelToPlate(rv);

        return rv;
    }
    transformExcelToPlate(range) {

        let column_start = range[0]['column']['index']
        let row_start = range[0]['row']['index']
        let column_end = range[1]['column']['index']
        let row_end = range[1]['row']['index']

        range[0]['column']['index'] = row_start;
        range[0]['row']['index'] = column_start;
        range[1]['column']['index'] = row_end;
        range[1]['row']['index'] = column_end;

        return range;
    }

    /**
     * Retrieve value by its label (`B3:A1`, `B$3:A1`, `B$3:$A1`, `$B$3:A$1`).
     *
     * @param {String} startLabel Coordinates of the first cell.
     * @param {String} endLabel Coordinates of the last cell.
     * @returns {Array} Returns an array of mixed values.
     * @private
     */
    async rangeValue(startLabel, endLabel) {
        startLabel = startLabel.toUpperCase();
        endLabel = endLabel.toUpperCase();
        let p = getHelpers();
        let extractLabel = p.extractLabel;
        let toLabel = p.toLabel;
        const [startRow, startColumn] = extractLabel(startLabel);
        const [endRow, endColumn] = extractLabel(endLabel);
        let startCell = {};
        let endCell = {};

        if (startRow.index <= endRow.index) {
            startCell["row"] = startRow;
            endCell["row"] = endRow;
        } else {
            startCell["row"] = endRow;
            endCell["row"] = startRow;
        }

        if (startColumn.index <= endColumn.index) {
            startCell["column"] = startColumn;
            endCell["column"] = endColumn;
        } else {
            startCell["column"] = endColumn;
            endCell["column"] = startColumn;
        }

        startCell["label"] = toLabel(startCell["row"], startCell["column"]);
        endCell["label"] = toLabel(endCell["row"], endCell["column"]);
        let value = [startCell, endCell];
        return value;
    }





    selectCells(ci, ri, cf, rf) {
        var data = new Array();
        var xpos = 1 + (ci * this.plate.cellWidth); //starting xpos and ypos at 1 so the stroke will show when we make the grid below
        var ypos = 1 + (ri * this.plate.cellHeight);
        var width = this.plate.cellWidth;
        var height = this.plate.cellHeight;
        // iterate for rows 
        for (let vrow = 0; vrow < rf + 1; vrow++) {
            data.push(new Array());
        }
        for (var row = ri; row < rf + 1; row++) {
            // data.push(new Array());
            // iterate for cells/columns inside rows
            for (var column = ci; column < cf + 1; column++) {
                data[row].push({
                    x: xpos,
                    y: ypos,

                    width: width,
                    height: height,
                    label: (('' + this.getAlph((row + 1))) + (column + 1))
                })
                xpos += width;
            }
            xpos = 1 + (ci * this.plate.cellWidth);
            ypos += height;
        }
        return data;
    }
    setData(dataObject: {}) {
        let helpers = getHelpers();
        let labels = Object.keys(dataObject);
        this.data = new Array(labels.length).fill(undefined).map(() => new Array(labels.length).fill(undefined));

        for (let label of labels) {
            let v = helpers.extractLabel(label)
            console.log(JSON.stringify(v))
            if (v != undefined)
                this.data[v[0].index][v[1].index] = dataObject[label]
        }
    }

    gridData() {
        var data = new Array();
        var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
        var ypos = 1;
        var width = this.plate.cellWidth;
        var height = this.plate.cellHeight;
        var click = 0;

        // iterate for rows 
        for (var row = 0; row < this.plate.rows; row++) {
            data.push(new Array());
            // iterate for cells/columns inside rows
            for (var column = 0; column < this.plate.columns; column++) {
                data[row].push({
                    x: xpos,
                    y: ypos,

                    width: width,
                    height: height,
                    // label: (column) + ' - ' + row
                    // label: (  (''+ this.getAlph((column+1)) + ' ' +  ((row +1))))
                    label: (('' + this.getAlph((row + 1))) + (column + 1)),
                    value: this.getValue(column, row),
                    click: click

                })
                // increment the x position. I.e. move it over by 50 (width variable)
                xpos += width;
            }
            // reset the x position after a row is complete
            xpos = 1;
            // increment the y position for the next row. Move it down 50 (height variable)
            ypos += height;
        }
        return data;
    }
    getValue(col, row) {

        if (this.data == null || this.data == undefined) {
            // console.log(" no data loaded ")
            return undefined;
        }
        if (this.data[col] != null && this.data[col] != undefined) {
            return this.data[col][row]
        } else {
            // console.log(" no data loaded for cell " + col + ' and row ' + row);
            return undefined;
        }
    }
    getAlph(i) {
        return i > 0 && i < 27 ? String.fromCharCode((((i + (65)) - 1))) : null;
    }
}

function getHelpers() {

    /**
     * Convert row label to index.
     *
     * @param {String} label Row label (eq. '1', '5')
     * @returns {Number} Returns -1 if label is not recognized otherwise proper row index.
     */
    function rowLabelToIndex(label) {
        let result = parseInt(label, 10);

        if (isNaN(result)) {
            result = -1;
        } else {
            result = Math.max(result - 1, -1);
        }

        return result;
    }

    /**
     * Convert row index to label.
     *
     * @param {Number} row Row index.
     * @returns {String} Returns row label (eq. '1', '7').
     */
    function rowIndexToLabel(row) {
        let result = '';

        if (row >= 0) {
            result = `${row + 1}`;
        }

        return result;
    }

    const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

    /**
     * Convert column label to index.
     *
     * @param {String} label Column label (eq. 'ABB', 'CNQ')
     * @returns {Number} Returns -1 if label is not recognized otherwise proper column index.
     */
    function columnLabelToIndex(label) {
        let result = 0;

        if (typeof label === 'string') {
            label = label.toUpperCase();

            for (let i = 0, j = label.length - 1; i < label.length; i += 1, j -= 1) {
                result += Math.pow(COLUMN_LABEL_BASE_LENGTH, j) * (COLUMN_LABEL_BASE.indexOf(label[i]) + 1);
            }
        }
        --result;

        return result;
    }

    /**
     * Convert column index to label.
     *
     * @param {Number} column Column index.
     * @returns {String} Returns column label (eq. 'ABB', 'CNQ').
     */
    function columnIndexToLabel(column) {
        let result = '';

        while (column >= 0) {
            result = String.fromCharCode((column % COLUMN_LABEL_BASE_LENGTH) + 97) + result;
            column = Math.floor(column / COLUMN_LABEL_BASE_LENGTH) - 1;
        }

        return result.toUpperCase();
    }

    const LABEL_EXTRACT_REGEXP = /^([$])?([A-Za-z]+)([$])?([0-9]+)$/;

    /**
     * Extract cell coordinates.
     *
     * @param {String} label Cell coordinates (eq. 'A1', '$B6', '$N$98').
     * @returns {Array} Returns an array of objects.
     */
    function extractLabel(label) {
        if (typeof label !== 'string' || !LABEL_EXTRACT_REGEXP.test(label)) {
            return [];
        }
        const [, columnAbs, column, rowAbs, row] = label.toUpperCase().match(LABEL_EXTRACT_REGEXP);

        return [
            {
                index: rowLabelToIndex(row),
                label: row,
                isAbsolute: rowAbs === '$',
            },
            {
                index: columnLabelToIndex(column),
                label: column,
                isAbsolute: columnAbs === '$',
            },
        ];
    }

    /**
     * Convert row and column indexes into cell label.
     *
     * @param {Object} row Object with `index` and `isAbsolute` properties.
     * @param {Object} column Object with `index` and `isAbsolute` properties.
     * @returns {String} Returns cell label.
     */
    function toLabel(row, column) {
        const rowLabel = (row.isAbsolute ? '$' : '') + rowIndexToLabel(row.index);
        const columnLabel = (column.isAbsolute ? '$' : '') + columnIndexToLabel(column.index);

        return columnLabel + rowLabel;
    }
    return { extractLabel: extractLabel, toLabel: toLabel };
}