import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PubComponent } from '../pub-component';
import { IoniScriptManager } from 'src/app/engine/io-manager';
import { PubComponentListener } from '../pub-component-listener';
import { LionEngine } from 'src/app/engine/io-engine';

@Component({
    selector: 'calendar-chooser',
    templateUrl: './calendar-chooser.component.html',
    styleUrls: ['./calendar-chooser.component.scss']
})
export class CalendarChooserComponent implements OnInit, PubComponent {
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    selection_method: any;
    init(ionEngine: IoniScriptManager): string {
        return null;




    }
    selectedDate: Date | null = null;
    selectedHour: number | null = null;

    @Output() dateSelected = new EventEmitter<Date>();

    onDateChange(event: any): void {
        // this.selectedDate = event.value;
        if (this.selectedHour != null) {
            this.selectedDate.setHours(this.selectedHour);
        }


        if (this.selection_method)
            this.selection_method(this.selectedDate)

        this.dateSelected.emit(this.selectedDate);


    }

    getValue() {
        if (this.selectedHour != null) {
            this.selectedDate.setHours(this.selectedHour);
        }
        return this.selectedDate;

    }

    ngOnInit(): void {

        if (this.data['select'])
            this.selection_method = LionEngine.ionfunctions[this.data['select']];
        if (this.data['date']) {
            this.selectedDate = new Date(this.data['date']);
            this.selectedHour = this.selectedDate.getHours(); // <-- Initialize selectedHour here

        }
    }
}
