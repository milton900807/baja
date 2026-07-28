import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PubComponent } from '../pub-component';
import { IoniScriptManager } from 'src/app/engine/io-manager';
import { PubComponentListener } from '../pub-component-listener';
import { LionEngine } from 'src/app/engine/io-engine';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CalendarService } from './calender-import.service';

@Component({
    selector: 'calendar-import',
    templateUrl: './calendar-import.component.html',
    styleUrls: ['./calendar-chooser.component.scss']
})
export class CalendarImportComponent implements OnInit, PubComponent {
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
    accessToken: string | null = null;
    clientId = window['env']['clientId']

    // Microsoft app info (not B2C)
    // clientId = 'YOUR_MICROSOFT_AD_CLIENT_ID';
    tenant = 'common'; // use 'common' or your tenant ID
    redirectUri = `${window['env']['appHost']}/auth/microsoft-callback`;
    scopes = 'openid offline_access Calendars.Read';
    authCodeVerifier = '';
    reference;


    constructor(private http: HttpClient, public calendarService: CalendarService) { }

    selectedDateRange = {
        start: null as Date | null,
        end: null as Date | null
      };
      
      
      onDateChange() {
        const { start, end } = this.selectedDateRange;
        if (start && end) {
          console.log('Date range selected:', start, 'to', end);
          // Use this range to fetch calendar events, etc.
        }
      }
    async initiateMicrosoftLogin() {
        const { start, end } = this.selectedDateRange;
        if ( this.reference ){
            debugger;
            this.reference(start, end)
        }
        this.calendarService.initiateMicrosoftLogin(start, end);
    }
    handleCodeExchange(code: string) {
        this.calendarService.exchangeAuthCodeForToken(code);
    }
    get events() {
        return this.calendarService.events;
    }
    ngOnInit(): void {
        if ( this.data['fetchCalendar']){
            this.reference = LionEngine.ionfunctions[this.data['fetchCalendar']]
        }

    }
}
