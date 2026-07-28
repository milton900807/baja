import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarImportComponent } from './components/calendar-import.component';
import { CalendarService } from './components/calender-import.service';
import { environment } from '../../environments/environment';
import { FunctionUtil } from '../functions/function-util';
import { OAuthSettings } from '../onedrive/oath.settings';
// import { CalendarImportComponent } from '../calender-import.component';

@Component({
  selector: 'app-microsoft-callback',
  template: `
  <p>Authenticating...</p>`,
})
export class MicrosoftCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private calendarService: CalendarService

  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(async params => {
      const code = params['code'];
      if (code) {
        await this.calendarService.exchangeAuthCodeForToken(code);
        // 
        this.calendarService.routeBack()
      }
    });
  }
}
