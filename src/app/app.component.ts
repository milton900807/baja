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

  // ---- Citation ------------------------------------------------------------
  // The year is taken from the clock rather than hard-coded, so the reference does not
  // quietly go stale the way a literal would.
  showCite = false;
  citeCopied = false;
  private citeYear = new Date().getFullYear();

  get citePlain(): string {
    return 'Milton, J. (' + this.citeYear + '). BajaBio Designer '
      + '[computer software]. BajaBio, La Jolla, California. '
      + 'https://oligodesigner.com';
  }

  get citeBibtex(): string {
    return '@software{milton_bajabio_designer,\n'
      + '  author    = {Milton, Jeff},\n'
      + '  title     = {BajaBio Designer},\n'
      + '  year      = {' + this.citeYear + '},\n'
      + '  publisher = {BajaBio},\n'
      + '  address   = {La Jolla, California, USA},\n'
      + '  url       = {https://oligodesigner.com}\n'
      + '}';
  }

  copyCitation(text: string): void {
    const done = () => {
      this.zone.run(() => {
        this.citeCopied = true;
        setTimeout(() => this.zone.run(() => (this.citeCopied = false)), 2000);
      });
    };
    try {
      // navigator.clipboard needs a secure context; fall back so the button still
      // works over plain http rather than failing silently.
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, () => this.copyFallback(text, done));
      } else {
        this.copyFallback(text, done);
      }
    } catch (e) {
      this.copyFallback(text, done);
    }
  }

  private copyFallback(text: string, done: () => void): void {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) { }
  }

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



  // ---- News ("The Baja Times") ---------------------------------------------
  // The newspaper already existed inside the editor's startup progress bar, where it showed
  // once and could not be brought back. This puts it behind a toolbar button so it can be
  // opened on demand, and renders it maximised rather than as a small card.
  showNews = false;
  newsItems: string[] = [];
  newsLoading = false;

  get newsDate(): string {
    try {
      return new Date().toLocaleDateString('en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return ''; }
  }

  async openNews(): Promise<void> {
    this.showNews = true;
    if (this.newsItems.length || this.newsLoading) return;
    this.newsLoading = true;
    try {
      const host = (window['env'] && window['env']['apiUrl']) || window.location.origin;
      const r = await fetch(host + '/news-headlines');
      const j = r.ok ? await r.json() : null;
      this.zone.run(() => {
        this.newsItems = (j && Array.isArray(j.items)) ? j.items : [];
        this.newsLoading = false;
      });
    } catch (e) {
      // An empty paper says "nothing today", which is honest; a spinner that never resolves
      // would not be.
      this.zone.run(() => { this.newsItems = []; this.newsLoading = false; });
    }
  }

  // ---- Free-plan bar -------------------------------------------------------
  // Rendered HERE, in the app shell, rather than by the lionscript module it lived in before.
  // That module was correct in isolation -- it compiled and rendered under the engine's own
  // pipeline -- but it never appeared in the running app, and every layer between the two
  // (exec, the script cache, the editor's own re-mounts) swallows errors silently, so there
  // was nothing to follow. The shell is the one layer that is provably running: it draws the
  // toolbar the user is already looking at. No exec, no compile step, no DOM node appended
  // from outside Angular's lifecycle for a later re-mount to take away.
  freeBar: any = null;
  freeBarCollapsed = false;
  private freePollTimer: any = null;
  // When the subscription first failed to validate, and how many tries have failed since.
  private freeFailSince = 0;
  private freeFailTries = 0;

  private async checkFreePlan(): Promise<void> {
    try {
      // Only inside the app itself; the marketing and auth pages are not "the editor".
      //
      // This was an allow-list of '/app/', but nginx routes SIX prefixes to this shell
      // (app, edit, lft, books, doc, _app -- see conf.d/oligodesigner.conf) plus the root.
      // A subscriber opening the editor on any of the others got no badge at all, because
      // the check returned before it ever asked /free-quota.
      //
      // Inverted: name the pages that are NOT the app. Those are enumerable and stable --
      // sign-in, the OIDC callback and checkout -- and anything new in the shell is the app.
      const __path = ('' + window.location.pathname).toLowerCase();
      if (/^\/(login|auth|subscribe|signup)(\/|$)/.test(__path)) return;
      const host = (window['env'] && window['env']['apiUrl']) || window.location.origin;
      const u = this.oidcUser;
      const email = (u && u.email) || '';
      const r = await fetch(host + '/free-quota?user=' + encodeURIComponent(email));
      if (!r.ok) { this.onFreeCheckFailed(); return; }
      const q = await r.json();
      if (!q) { this.onFreeCheckFailed(); return; }
      // Answered: whatever it says, validation is working again.
      this.freeFailSince = 0;
      this.freeFailTries = 0;

      // flexigraph/gene.js runs its own two-try subscription check and sets these when it
      // concludes the user is not on a subscription. Honoured here because the badge is drawn
      // by the shell: without this, gene.js could reach that conclusion and nothing would show.
      let flagged = false, unverified = false;
      try {
        flagged = !!(window as any).__bajaFreeTier;
        unverified = !!(window as any).__bajaFreeUnverified;
      } catch (e) { }

      if (q.subscribed) {
        // The live answer wins over a stale flag: a subscriber who tripped gene.js during a
        // network wobble gets the badge cleared here rather than carrying it for the session.
        try { (window as any).__bajaFreeTier = false; (window as any).__bajaFreeUnverified = false; } catch (e) { }
        this.zone.run(() => (this.freeBar = null));
        return;
      }
      this.zone.run(() => {
        // Going from subscribed to not-subscribed is news: un-collapse so the badge is seen
        // rather than restored as a corner tab the user already dismissed this session.
        if (!this.freeBar) this.freeBarCollapsed = false;
        this.freeBar = {
          limit: q.limit != null ? q.limit : 5,
          // designRemaining is the current field; aiRemaining is its old name, still sent for
          // one release so a client cached mid-deploy does not read undefined.
          design: q.designRemaining != null ? q.designRemaining
            : (q.aiRemaining != null ? q.aiRemaining : (q.limit != null ? q.limit : 5)),
          ot: q.offtargetRemaining != null ? q.offtargetRemaining : (q.limit != null ? q.limit : 5),
          resetsOn: q.resetsOn || '',
          // Only "unverified" when a check actually failed to answer -- a plain non-subscriber
          // is not unverified, and saying so would be wrong.
          unverified: unverified && flagged
        };
      });
    } catch (e) {
      this.onFreeCheckFailed();
    }
  }

  // Validation failed. Stay quiet at first, then fall back to FREE USE.
  //
  // A single failure means nothing -- a blip should not put an upgrade bar in front of someone
  // who pays -- so the first three minutes of failures are ignored. Past that the endpoint is
  // not coming back on its own, and the honest position is that the subscription is UNPROVEN:
  // the user keeps working with the free-tier allowance and can see why, rather than silently
  // holding paid access on the strength of a check that has not answered since startup. The
  // metered calls are capped server-side regardless, so this only decides what is shown.
  //
  // The moment a check answers again this resets, and a subscriber's bar disappears on the
  // next poll 20 seconds later.
  private onFreeCheckFailed(): void {
    const now = Date.now();
    if (!this.freeFailSince) this.freeFailSince = now;
    this.freeFailTries++;
    const elapsed = now - this.freeFailSince;
    // Both conditions: three minutes AND several attempts, so a single slow request that
    // straddles the window cannot trip it on its own.
    if (elapsed < 180000 || this.freeFailTries < 3) return;
    try { (window as any).__bajaFreeTier = true; } catch (e) { }
    this.zone.run(() => {
      if (!this.freeBar) this.freeBarCollapsed = false;
      this.freeBar = {
        limit: 5, design: 5, ot: 5, resetsOn: '',
        unverified: true
      };
    });
  }

  ngOnInit(): void {
    // Re-check the subscription every 20 seconds, not once at startup.
    //
    // The answer changes DURING a session and in both directions: someone subscribes in another
    // tab and the bar should go away without a reload, or a subscription lapses and the bar
    // should appear. A single check at boot also raced sign-in -- the email decides the answer
    // and is not always known on the first tick.
    //
    // checkFreePlan sets freeBar when the account is not subscribed and clears it when it is,
    // so the same poll both raises and retires the badge.
    setTimeout(() => this.checkFreePlan(), 1200);
    try {
      if (this.freePollTimer) clearInterval(this.freePollTimer);
      this.freePollTimer = setInterval(() => this.checkFreePlan(), 20000);
    } catch (e) { }

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

    // Identity from OIDC (the app's real auth). This sets OAuthSettings.access_token — the email
    // that getUser() returns and that /load-file, /save-user-data, etc. key on. Previously this was
    // populated only from MSAL (setLoginDisplay / msalSubject$), so MSAL couldn't simply be turned
    // off. Read it from the OIDC session instead, so the whole MSAL boot path can stay inert.
    try {
      const ou = this.oidc.getUser();
      if (ou && ou.email) {
        OAuthSettings.access_token = ou.email;
        this.user = ou.email;
        this.name = ou.name || ou.email;
        this.lg = true;
      }
    } catch (e) { /* no OIDC session yet; guard will route to /login */ }

    this.setLoginDisplay();

    this.isIframe = window !== window.parent && !window.opener;

    // --- MSAL boot path DISABLED (app uses OIDC) --------------------------------------------
    // enableAccountStorageEvents + the inProgress$/msalSubject$ subscriptions below activated the
    // legacy MSAL b2c stack on boot. On production that stack federated through Google and, via
    // navigateToLoginRequestUrl, kept redirecting the page back to itself — re-booting mid-load and
    // discarding the opened file. Left inert; OIDC handles auth. (MsalRedirectComponent is also no
    // longer bootstrapped — see app.module.)
    // this.authService.instance.enableAccountStorageEvents();
    // this.msalBroadcastService.inProgress$
    //   .pipe(
    //     filter((status: InteractionStatus) => status === InteractionStatus.None),
    //     takeUntil(this._destroying$)
    //   )
    //   .subscribe(() => {
    //     this.setLoginDisplay();
    //     this.checkAndSetActiveAccount();
    //   });

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





    // MSAL LOGIN_FAILURE/ACQUIRE_TOKEN_FAILURE subscription DISABLED. Its handler called
    // this.login(resetPasswordFlowRequest) → loginRedirect() on failure — so a failing/looping MSAL
    // interaction on boot could itself trigger a full-page redirect, feeding the production loop.
    // OIDC handles auth; MSAL is inert.
    // this.msalBroadcastService.msalSubject$
    //   .pipe(
    //     filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE || msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE),
    //     takeUntil(this._destroying$)
    //   )
    //   .subscribe((result: EventMessage) => {
    //     if (result.error && result.error.message.indexOf('AADB2C90118') > -1) {
    //       let resetPasswordFlowRequest: RedirectRequest | PopupRequest = {
    //         authority: b2cPolicies.authorities.ResetPWDPolicy.authority,
    //         scopes: [],
    //       };
    //       this.login(resetPasswordFlowRequest);
    //     } else {
    //       if (result.error.message.indexOf('AADB2C90083') >= 0) {
    //         console.log(" error " + result.error.message)
    //         return;
    //       }
    //       const payload = result.payload as AuthenticationResult;
    //       this.authService.instance.setActiveAccount(payload.account);
    //       this.name = payload.account.username;
    //       if (this.name === null || this.name.trim().length <= 0) {
    //         this.lg = false;
    //       } else {
    //         this.lg = true;
    //         this.user = this.name;
    //         OAuthSettings.access_token = this.name;
    //       }
    //     }
    //   });

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
  // The two pages that stand between someone and the editor -- sign-in and checkout -- both
  // need a way THROUGH to the free version. The paywall drawn by baja/datayak/ljlcheckout.js
  // carries one, but lib/subscription.js no longer shows that paywall (showSubscribeGate()
  // sends a non-subscriber straight to free/editor), so neither page offered anything but
  // the paid path.
  get showFreeEntry(): boolean {
    try {
      const p = ('' + window.location.pathname).toLowerCase();
      // The front page, and the two gates in front of it. A signed-out visitor is routed
      // from '/' to /login by authGuard, so the button has to exist on both to be seen at
      // all -- on '/' for someone already signed in, on /login for someone who is not.
      return p === '/' || p === '' || /^\/(login|subscribe)(\/|$)/.test(p);
    } catch (e) { return false; }
  }

  // Sign-in first, then the free editor. Navigating straight to /app/free/editor also works
  // -- authGuard would bounce an anonymous visitor to /login and stash the destination -- but
  // setting oidc.returnTo here means the round trip is deliberate rather than a redirect the
  // user has to be lucky to survive. auth-callback.component reads this key after the code
  // exchange and lands the user on it.
  goFreeVersion(): void {
    try { sessionStorage.setItem('oidc.returnTo', '/app/free/editor'); } catch (e) { }
    try {
      const signedIn = !!(this.oidcUser && this.oidcUser.email);
      // ?free=1 tells the login page to describe the FREE TIER rather than run the generic
      // product pitch: the visitor has already chosen, so the page's job is to say what they
      // are getting and take the sign-in.
      window.location.href = window.location.origin + (signedIn ? '/app/free/editor' : '/login?free=1');
    } catch (e) {
      try { window.location.href = window.location.origin + '/login'; } catch (e2) { }
    }
  }

  get oidcUser(): AuthUser | null { return this.oidc.getUser(); }
  get oidcInitials(): string {
    const u = this.oidcUser;
    const s = (u?.name || u?.email || '').trim();
    if (!s) return '?';
    const parts = s.split(/[\s@._-]+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || s[0].toUpperCase();
  }
  oidcSignOut() {
    // Confirm before signing out so a stray click can't drop the user's session.
    const u = this.oidcUser;
    const who = (u && (u.email || u.name)) ? ('\n\n' + (u.email || u.name)) : '';
    if (!window.confirm('Sign out of Oligo Designer?' + who)) return;
    this.oidc.logout('/login');
  }

  // Account menu → show today's Claude-search count (runs the self-contained lionscript, which
  // reads py/usage/claude-usage-report.py for the signed-in user and pops a summary modal).
  showClaudeUsage() {
    try { IoniScriptEngine.le.exec('baja/manchester/menu/my-claude-usage.js'); }
    catch (e) { console.warn('My Claude usage failed', e); }
  }

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
    try { if (this.freePollTimer) { clearInterval(this.freePollTimer); this.freePollTimer = null; } } catch (e) { }
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
