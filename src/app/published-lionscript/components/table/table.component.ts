import { Component, Input, OnInit } from '@angular/core';
import { PubComponent } from '../../pub-component';
import { LionEngine } from '../../../engine/io-engine';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PubComponentListener } from '../../pub-component-listener';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, PubComponent {

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;

  displayedColumns: string[];
  @Input()
  dataSource: MatTableDataSource<any>;
  rows: any[];
  showHeader = false;
  padding_top = '5px'

  init(): string {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    return '';
  }

  go(ts) {
    if (ts['ionFunction'])
      LionEngine.ionfunctions[ts['ionFunction']](ts)
  }


  ngOnInit() {
    this.rows = this.data.rows.slice();
    this.title = this.data.title;
    if (this.data['padding_top']) {
      this.padding_top = this.data['padding_top']
    }

    if (this.data) {
      if (this.data['showHeader'])
        this.showHeader = this.data['showHeader']
    }


    this.updateTable(this.rows);
  }

  updateTable(rows) {
    if (rows != null && rows.length > 0) {
      this.displayedColumns = Object.keys(rows[0]);
      this.dataSource = new MatTableDataSource<any>(rows);
    }
  }

  setRows(rows) {
    this.updateTable(rows);
  }

  sortData(sort: Sort) {
    let data = this.data.rows.slice();
    let sortedData;
    if (!sort.active || sort.direction === '') {
      sortedData = data;
      return;
    }

    sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        default: return compare(a, b, isAsc);
      }
    })

  }

}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
