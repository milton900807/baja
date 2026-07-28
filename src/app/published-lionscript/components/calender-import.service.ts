import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment'
import { FunctionUtil } from '../../functions/function-util';
import { OAuthSettings } from '../../onedrive/oath.settings';
import { start } from 'repl';
import { debug } from 'console';


@Injectable()
export class CalendarService {
  private accessToken: string | null = null;
  events: any[] = [];

  clientId = window['env']['clientId']
  tenant = 'common';
  redirectUri = `${window['env']['appHost']}/auth/microsoft-callback`;
  scopes = 'openid offline_access Calendars.Read';
  constructor(private http: HttpClient, private router: Router) { }

  async exchangeAuthCodeForToken(code: string): Promise<void> {
    const verifier = localStorage.getItem('pkce_verifier')!;
    const body = new URLSearchParams();
    body.set('client_id', this.clientId);
    body.set('scope', this.scopes);
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', this.redirectUri);
    body.set('code_verifier', verifier);

    try {
      const tokenResp = await this.http
        .post<any>(
          `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`,
          body.toString(),
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/x-www-form-urlencoded',
            }),
          }
        )
        .toPromise();
      this.accessToken = tokenResp.access_token;
    } catch (err) {
      console.error('OAuth token exchange failed:', err);
    }
  }

  async routeBack() {


    const userid = OAuthSettings.access_token;
    let statusObj = {
      user: OAuthSettings.access_token,
      type: 'calendar_request',
      name: 'calendar_request'
    }
    let rf = await FunctionUtil.POSTJSON(statusObj, environment.readtempfile)
    const rrf = JSON.parse(rf['content'])
    const start = new Date(rrf['start'])
    const end = new Date(rrf['end'])
    const path = rrf['path']

    const evts = await this.getCalendarEvents(start, end);
    let obj = {
      user: userid,
      name: 'calendar_import',
      type: 'calendar_import',
      value: evts
    }
    let rf1 = await FunctionUtil.POSTJSON(obj, environment.tempfile)
    window.location.assign(path);
  }


  async getCalendarEvents(start: Date, end: Date): Promise<any[] | undefined> {
    const query = `/me/calendarview?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}&$orderby=start/dateTime&top=450`;
    const batchBody = {
      requests: [
        {
          id: '1',
          method: 'GET',
          url: query,
        },
      ],
    };

    try {
      const response = await this.http
        .post<any>('https://graph.microsoft.com/v1.0/$batch', batchBody, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      const events = response?.responses?.[0]?.body?.value || [];
      console.log('Imported events via POST batch:', events);
      this.events = events;
      return events;
    } catch (error) {
      console.error('Batch calendar fetch failed:', error);
      return undefined;
    }
  }

  async initiateMicrosoftLogin(start_date, end_date) {
    let statusObj = {
      user: OAuthSettings.access_token,
      path: window.location.href,
      name: 'calendar_request',
      type: 'calendar_request',
      value: {
        start: start_date,
        end: end_date,
        path: window.location.href
      }
    }
    let rf = await FunctionUtil.POSTJSON(statusObj, environment.tempfile)
    const verifier = this.generateCodeVerifier();
    this.storeVerifier(verifier);
    this.generateCodeChallenge(verifier).then(challenge => {
      const params = new URLSearchParams({
        client_id: this.clientId,
        response_type: 'code',
        redirect_uri: this.redirectUri,
        response_mode: 'query',
        scope: this.scopes,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      const authUrl = `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/authorize?${params.toString()}`;
      window.location.href = authUrl;
    });
  }

  // === PKCE helpers ===
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private storeVerifier(verifier: string): void {
    localStorage.setItem('pkce_verifier', verifier);
  }

}
