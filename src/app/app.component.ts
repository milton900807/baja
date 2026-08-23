import { Inject, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { Component } from '@angular/core';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { Title } from '@angular/platform-browser';
import { IoniScriptEngine, LionEngine } from './engine/io-engine';
import { ThemeService } from './theme.service';
import { IoniScriptManager, RunStatus } from './engine/io-manager';
import { IoniScriptFile } from './engine/lion-file';
import { AuthService } from './onedrive/auth.service';
import { OidcAuthService, AuthUser } from './auth/oidc-auth.service';
import { OAuthSettings } from './onedrive/oath.settings';
import { PubComponent } from './published-lionscript/pub-component';
import { PubDirective } from './published-lionscript/pub.directive';
import { WidgetFactory } from './widget-factory';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { GraphService, ProviderOptions } from './onedrive/graph.service';


import {
  AuthenticationResult,
  InteractionStatus,
  InteractionType,
  PopupRequest,
  RedirectRequest,
  AccountInfo,
  EventMessage,
  EventType
} from '@azure/msal-browser';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { clearStorage } from './onedrive/storage-utils';
import { b2cPolicies, protectedResources, rarePolicies } from './onedrive/auth-config';



@Component({
  selector: 'app-dialog',

  template: `                    
  <ng-template pub-modal> </ng-template>
  `,
})
export class App implements OnInit, IoniScriptManager {

  @ViewChild(PubDirective, { static: false }) compService: PubDirective | undefined;
  widgets = {}
  widget = null;
  test = 'Standby... not implemented yet. ';

  constructor(

    @Inject(MAT_DIALOG_DATA) private data: any,
    public dialogRef: MatDialogRef<App>,
    private zone: NgZone) {
  }
  ngOnInit(): void {
  }

  showWidget(js: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }

  loadWidget(wid: {}, resolve: any) {
    let type = wid["wid"];
    if (type == null) type = wid["type"];

    let line = wid["input"];
    let title = wid["title"];
    if (line == undefined || line == null) {
      line = wid["data"];
    }

    if (wid['componentRef'] === 'testing') {
      debugger;
      // alert('testing')
    }

    let pubcomp = WidgetFactory.createWidget(type);
    let viewContainerRef = this.compService.viewContainerRef;
    let componentRef = viewContainerRef.createComponent(pubcomp);
    if (line != undefined) (<PubComponent>componentRef.instance).data = line;
    (<PubComponent>componentRef.instance).resolveFunction = resolve;
    (<PubComponent>componentRef.instance).title = title;
    (<PubComponent>componentRef.instance).init(this);
    if (wid["id"] != undefined) {
      if (this.widgets == null) {
        this.widgets = {};
      }
      this.widgets[wid["id"]] = {
        instance: <PubComponent>componentRef.instance,
        wid: type,
      };
    }
    (<PubComponent>componentRef.instance).init(this);

    if (wid["componentRef"] != null) {
      LionEngine.componentRefs[wid['componentRef']] = {
        'viewContainerRef': viewContainerRef,
        'components': [(<PubComponent>componentRef.instance)]
      }
      this.zone.run(() => {
        this.dialogRef.close();
      })
    }

    if (wid['refCallback'] != null) {
      LionEngine.ionfunctions[wid['refCallback']](<PubComponent>componentRef.instance);
    }



    return (<PubComponent>componentRef.instance);
  }
  POSTFile(file: any, url: string): Promise<string> {
    throw new Error('Method not implemented.');

  }
  getScript(): string {
    throw new Error('Method not implemented.');

  }
  setScript(script: string) {
  }
  showFile(lf: IoniScriptFile) {
  }
  log(line: string) {
  }
  getIonisFS() {
  }
  getAccessToken(): string {
    throw new Error('sadfgasdfasdf asdf asdf asdfasdf asdf asdf asdf asdf asdfasd fMethod not implemented.');

  }
  setIonisFS(jsonObject: any) {
  }
  createObject(object_type: any, object_config: any): Promise<any> {
    throw new Error('Method not implemented.----------------------------------------------------------- ');

  }
  updateProgress(progress: string): void {
  }
  save(path: string, name: string, type: string, rule: string, input: string, callback: any) {
  }
  resetLog() {
  }
  removeComponent(index: any) {
  }
  getComponentCount(): Number {
    throw new Error('Method not implemented.');
  }
  voiceToText(listener) {
  }

  displayApp(title: any, url: any): Promise<string> {
    throw new Error('Method not implemented.');
  }
  showInputItem(title: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  showInputTextArea(title: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  showMenu(menuconfig: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  clearMenu(): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  showNavbar(navbarconfig: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  showFooter(menuconfig: any): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  showInputParamPair(title: any, label: string[]): Promise<{}> {
    throw new Error('Method not implemented.');
  }
  displaySVG(url: any, json: any): Promise<string> {
    throw new Error('Method not implemented.');
  }
  showOKPanel(msg: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateUI(ui_item_name: any, item_field: any, item_value: any) {
    throw new Error('Method not implemented.');
  }
  clearWeak(): Promise<{}> {
    throw new Error('Method not implemented.');

  }
  isModal(): boolean {
    throw new Error(' not implemented ')

  }

  showModal(js: any, width: number, height: number): Promise<{}> {
    throw new Error(' not implemented ')
  }
  hideAllModal(): void {
    throw new Error('Method not implemented.');
  }
  setUIObject(obj: any, objectlabel: string, objtype: string) {
    throw new Error('Method not implemented.');
  }
  statusChanged(st: RunStatus): void {
    throw new Error('Method not implemented.');
  }
  micOff() {

  }



}




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  @Input('lg')
  lg = false;
  user = null;
  host: string = null;
  ready = true;
  message = '';
  // message = '`La Jolla Labs`';
  showLJW = false;
  buttons = []
  showToolbar = true;
  isIframe = false;
  name: string | undefined;
  accounts: AccountInfo[] = [];
  canSignUp = false;
  fg = 'white';
  bg = '#ffffff'

  private readonly _destroying$ = new Subject<void>();

  static titleService: any;
  public constructor(private titleService: Title,
    private auth: AuthService,
    private zone: NgZone,
    private dialog: MatDialog,
    private engine: IoniScriptEngine,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private gs: GraphService,
    private theme: ThemeService,
    private oidc: OidcAuthService

  ) {
    AppComponent.titleService = titleService;
    this.host = window.location.hostname;
    IoniScriptEngine.app = this;

    // Apply the saved/default theme and expose a global hook so lionscript
    // menus can switch themes, e.g. window.setTheme('dark').
    this.theme.init();
    window['setTheme'] = (id: string) => this.zone.run(() => this.theme.setTheme(id));
    window['getThemes'] = () => this.theme.themes;
    window['cycleTheme'] = () => this.zone.run(() => this.theme.cycle());
  }

  get themes() { return this.theme.themes; }
  get currentTheme() { return this.theme.getTheme(); }
  setTheme(id: string): void { this.theme.setTheme(id); }



  ngOnInit(): void {
    this.canSignUp = window['env']['canSignUp'];
    this.message = window['env']['theme']
    if (window['env']['fg']) {
      this.fg = window['env']['fg']
    }
    if (window['env']['bg']) {
      this.fg = window['env']['bg']
    }
    this.message = window['env']['theme']
    if (this.message === null) {
      this.message = "La Jolla Labs"
    }
    let t = window['env']['menu']
    for (let button of t) {
      this.buttons.push({
        label: button['label'], click: () => {
          debugger;
          IoniScriptEngine.le.exec(button['path'])
        }
      })
    }
    window.addEventListener('resize', (evgt) => {
      this.zone.run(() => { })
    });

    this.setLoginDisplay();

    this.isIframe = window !== window.parent && !window.opener;
    this.authService.instance.enableAccountStorageEvents(); // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window

    /**
     * You can subscribe to MSAL events as shown below. For more info,
     * visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/events.md
     */
    this.msalBroadcastService.inProgress$
      .pipe(
        filter(

          (status: InteractionStatus) => status === InteractionStatus.None),

        takeUntil(this._destroying$)
      )
      .subscribe(() => {


        this.setLoginDisplay();
        this.checkAndSetActiveAccount();
      });

    // this.msalBroadcastService.msalSubject$
    //   .pipe(
    //     filter(
    //       (msg: EventMessage) => msg.eventType === EventType.LOGOUT_SUCCESS
    //     ),
    //     takeUntil(this._destroying$)
    //   )
    //   .subscribe((result: EventMessage) => {
    //     this.setLoginDisplay();
    //     this.checkAndSetActiveAccount();
    //   });


    if (window['env']['root'] === '900807') {
      this.lg = true;
      this.user = 'ljl'
      OAuthSettings.access_token = 'ljl@ljl.com';
    }





    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE || msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        // Checking for the forgot password error. Learn more about B2C error codes at
        // https://learn.microsoft.com/azure/active-directory-b2c/error-codes
        if (result.error && result.error.message.indexOf('AADB2C90118') > -1) {

          let resetPasswordFlowRequest: RedirectRequest | PopupRequest = {
            authority: b2cPolicies.authorities.ResetPWDPolicy.authority,
            scopes: [],
          };

          this.login(resetPasswordFlowRequest);
        } else {

          if (result.error.message.indexOf('AADB2C90083') >= 0) {
            console.log(" error " + result.error.message)
            return;
          }


          const payload = result.payload as AuthenticationResult;
          this.authService.instance.setActiveAccount(payload.account);
          this.name = payload.account.username;
          if (this.name === null || this.name.trim().length <= 0) {
            this.lg = false;
          } else {
            debugger
            this.lg = true;
            this.user = this.name;
            OAuthSettings.access_token = this.name;
          }
        }
      });

    // monaco.languages.register({ id: 'ljl' });
    // monaco.languages.setMonarchTokensProvider('ljl', {
    //   tokenizer: {
    //     root: [
    //       [/\bTODO\b/, 'custom-todo'],
    //       [/[a-zA-Z_$][\w$]*/, 'identifier'],
    //       [/"/, 'string', '@string'],
    //     ],
    //     string: [
    //       [/[^"]+/, 'string'],
    //       [/"/, 'string', '@pop']
    //     ]
    //   }
    // });


    // monaco.editor.defineTheme('no-border-theme', {
    //   base: 'vs', // or 'vs-dark' depending on your preference
    //   inherit: true,
    //   rules: [],
    //   colors: {
    //     'editor.background': '#FFFFFF', // Background color of the editor
    //     'editorLineNumber.foreground': '#000000', // Line number color (optional)
    //     'editorCursor.foreground': '#000000', // Cursor color (optional)
    //     'editor.selectionBackground': '#B4D5FE', // Selection color (optional)
    //     'editor.selectionHighlightBorder': 'none', // Remove border for selection highlight
    //     'editorWidget.border': 'none', // Remove border around widgets like hover, autocomplete
    //     'input.border': 'none',// Remove border on input elements (for find/replace box)
    //     'editorLineNumber.activeForeground': 'none', // No highlight on active line number
    //     'editor.lineHighlightBorder': 'none', // No line highlight border
    //     'editor.lineHighlightBackground': 'none', // No background for active line
    //   }
    // });

    // // Apply the new theme to the editor instance
    // // monaco.editor.setTheme('no-border-theme');

    // monaco.languages.registerCompletionItemProvider('ljl', {
    //   provideCompletionItems: function (model, position) {
    //     const word = model.getWordUntilPosition(position);
    //     const range = {
    //       startLineNumber: position.lineNumber,
    //       startColumn: word.startColumn,
    //       endLineNumber: position.lineNumber,
    //       endColumn: word.endColumn
    //     };

    //     // Return custom suggestions ONLY
    //     return {
    //       suggestions: [
    //         {
    //           label: 'tablename',
    //           kind: monaco.languages.CompletionItemKind.Function,
    //           insertText: 'tablename',
    //           range: range
    //         },
    //         {
    //           label: 'tablename.column1',
    //           kind: monaco.languages.CompletionItemKind.Property,
    //           insertText: 'tablename.column1',
    //           range: range
    //         },
    //         {
    //           label: 'tablename.column2',
    //           kind: monaco.languages.CompletionItemKind.Property,
    //           insertText: 'tablename.column2',
    //           range: range
    //         }
    //       ]
    //     };
    //   }
    // });
      

  }


  checkAndSetActiveAccount() {
    /**
     * If no active account set but there are accounts signed in, sets first account to active account
     * To use active account set here, subscribe to inProgress$ first in your component
     * Note: Basic usage demonstrated. Your app may require more complicated account selection logic
     */
    let activeAccount = this.authService.instance.getActiveAccount();
    if (

      !activeAccount &&
      this.authService.instance.getAllAccounts().length > 0
    ) {
      let accounts = this.authService.instance.getAllAccounts();
      // add your code for handling multiple accounts here
      this.auth.authenticated = true;
      this.authService.instance.setActiveAccount(accounts[0]);
      activeAccount = accounts[0]
    }

    if (activeAccount) {
      this.auth.authenticated = true;
      // const providerOptions: ProviderOptions = {
      //   account: this.authService.instance.getActiveAccount()!,
      //   scopes: protectedResources.graphMe.scopes,
      //   interactionType: InteractionType.Redirect,
      //   endpoint: protectedResources.graphMe.endpoint,
      // };
      // let client = this.gs.getGraphClient(providerOptions);
      // try {
      //   client.api('/me').get().then((me: { [x: string]: null; }) => {
      //     this.user = me['displayName']
      //     this.lg = true;
      //     OAuthSettings.access_token = this.user;

      //   });
      // } catch (exxc) {
      //   console.log(exxc)
      // }
    }


  }



  setLoginDisplay() {
    this.accounts = this.authService.instance.getAllAccounts();
    let active = this.authService.instance.getActiveAccount();



    if (active && active.username != null && active.username.trim().length > 0) {
      this.name = active.username;
      if (this.name === null || this.name.trim().length <= 0) {
        this.lg = false;
      } else {
        this.lg = true;
        this.user = this.name;
        OAuthSettings.access_token = this.name;
      }
    } else {
      for (let a of this.accounts) {
        if (a.username != null && a.username.indexOf('@') > 0) {
          this.authService.instance.setActiveAccount(a);

          this.setLoginDisplay();
        }
      }
      if (!this.lg) {
        this.logout();
      }
    }
  }

  ngOnAfterInit(): void {
    // this.setLoginDisplay();
  }

  public static setTitle(newTitle: string) {
    AppComponent.titleService.setTitle(newTitle);
  }


  showModal(js: any, width, height): Promise<{}> {
    return new Promise((resolve, reject) => {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.data = { 'component': js }
      this.dialog.open(App, dialogConfig);
      resolve(this.dialog)
    });
  }

  // --- OIDC session (from the /login providers) ---
  get oidcUser(): AuthUser | null { return this.oidc.getUser(); }
  get oidcInitials(): string {
    const u = this.oidcUser;
    const s = (u?.name || u?.email || '').trim();
    if (!s) return '?';
    const parts = s.split(/[\s@._-]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || s[0].toUpperCase();
  }
  oidcSignOut() { this.oidc.logout('/login'); }

  logout() {
    OAuthSettings.access_token = null;
    let adctive = this.authService.instance.getActiveAccount();
    // this.authService.logoutRedirect();
    if (adctive) {
      this.authService.logoutRedirect({
        account: adctive
      });
      clearStorage(adctive);
    }
  }

  // unsubscribe to events when component is destroyed
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }


  signUp() {

    if (window['env']['auth'] === 'raredb') {

      let editProfileFlowRequest: RedirectRequest | PopupRequest = {
        authority: rarePolicies.authorities.signUp.authority,
        scopes: [],
      };
      this.login(editProfileFlowRequest)
    } else {
      let editProfileFlowRequest: RedirectRequest | PopupRequest = {
        authority: b2cPolicies.authorities.signUp.authority,
        scopes: [],
      };
      this.login(editProfileFlowRequest)
    }
  }


  login(userFlowRequest?: RedirectRequest | PopupRequest) {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest) {
        this.authService.loginPopup({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as PopupRequest)
          .subscribe((response: AuthenticationResult) => {
            this.authService.instance.setActiveAccount(response.account);
          });
      } else {
        this.authService.loginPopup(userFlowRequest)
          .subscribe((response: AuthenticationResult) => {
            this.authService.instance.setActiveAccount(response.account);
          });
      }
    } else {
      if (this.msalGuardConfig.authRequest) {

        let gt = window['env']['grant_type']
        if (!gt) {
          gt = 'authorization_code'
        }
        console.log(" grant type " + gt);
        this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest, ...userFlowRequest, extraQueryParameters: { grant_type: gt } } as RedirectRequest);
      } else {
        this.authService.loginRedirect(userFlowRequest);

      }
    }
  }


  // async login() {
  //   this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  // msal 2 stuff. 
  // if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
  //   if (this.msalGuardConfig.authRequest) {
  //     this.authService
  //       .loginPopup({
  //         ...this.msalGuardConfig.authRequest,
  //       } as PopupRequest)
  //       .subscribe((response: AuthenticationResult) => {
  //         this.authService.instance.setActiveAccount(response.account);
  //       });
  //   } else {
  //     this.authService
  //       .loginPopup()
  //       .subscribe((response: AuthenticationResult) => {
  //         this.authService.instance.setActiveAccount(response.account);
  //       });
  //   }
  // } else {
  //   if (this.msalGuardConfig.authRequest) {
  //     this.authService.loginRedirect({
  //       ...this.msalGuardConfig.authRequest,
  //     } as RedirectRequest);
  //   } else {
  //     this.authService.loginRedirect();
  //   }
  // }
  // }

  showWidget(js: { wid: any; url: string | URL | null; }): Promise<{}> {
    if (!js.wid && js.url != null) {
      window.location.assign(js.url);
      return new Promise((r, rr) => { })
    }
    var waitForHello = (timeoutms: number) =>
      new Promise<{}>(async (resolve, reject) => {
        var check = () => {
          if ((timeoutms -= 100) < 0) reject("timed out!");
          else setTimeout(check, 10);
        };
        setTimeout(check, 10);
        this.zone.run(() => {
        })

      });
    return waitForHello(100000000);
  }
}
