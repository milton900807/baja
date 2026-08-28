import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MsalService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { OidcAuthService } from './oidc-auth.service';
import { OidcProvider } from './oidc-providers';
import { b2cPolicies, rarePolicies } from '../onedrive/auth-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="login-wrap">
    <div class="palm-bg" aria-hidden="true">
      <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice">
        <path d="M198 520 C196 390 190 300 206 232 C209 216 215 206 221 201 L233 206 C225 216 221 242 219 302 C217 384 215 452 215 520 Z" fill="#0a3b2e"/>
        <g fill="#0e5a44">
          <path d="M223 201 C181 150 121 129 60 139 C131 145 176 176 215 206 Z"/>
          <path d="M223 201 C251 139 321 118 381 129 C311 140 261 171 227 206 Z"/>
          <path d="M223 199 C201 129 191 58 211 8 C215 70 225 141 231 199 Z"/>
          <path d="M221 206 C161 201 101 221 56 261 C121 236 181 226 217 211 Z"/>
          <path d="M227 206 C291 201 351 226 391 266 C321 239 261 229 231 213 Z"/>
          <path d="M223 203 C191 176 141 176 96 196 C151 181 196 191 221 209 Z"/>
          <path d="M225 203 C261 176 306 179 346 199 C296 183 251 191 227 209 Z"/>
        </g>
      </svg>
    </div>
    <div class="login-card">
      <div class="brandline"></div>

      <div class="beta-banner" role="status">
        <span class="beta-tag">Beta release!</span>
        <span class="beta-text">Early access now open</span>
      </div>

      <div class="head">
        <div class="logo"><img src="assets/img/icons/yak.png" alt="Sign in" /></div>
      </div>

      <ul class="features">
        <li *ngFor="let f of features">{{ f }}</li>
      </ul>

      <div class="demo-row">
        <a class="demo-link" href="assets/demo/index.html" target="baja-demo"
           (click)="openDemo($event, 'index.html')">Scientists</a>
        <a class="demo-link demo-link--alt" href="assets/demo/for-you.html" target="baja-demo-curious"
           (click)="openDemo($event, 'for-you.html')">Non-scientists</a>
      </div>

      <div class="providers" *ngIf="hasConfigured">
        <button *ngFor="let p of providers"
                class="pbtn" [class.dark]="isDark(p)"
                [disabled]="busy"
                [title]="'Login with ' + p.name"
                (click)="signIn(p)">
          <span class="glyph" [innerHTML]="glyph(p)"></span>
          <span class="ptext">Login with {{ p.name }}</span>
        </button>
      </div>

      <div class="empty" *ngIf="!hasConfigured">
        <p class="hint">No providers configured yet. Add a client ID in <code>window.env</code>
          (e.g. <code>oidc.google.clientId</code>).</p>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="signup">
        <span class="secure">🔒 Authorization Code + PKCE</span>
        <div class="su-row">
          New here?
          <button class="su-link" type="button" (click)="signUp()">Create an account</button>
        </div>
      </div>

      <a class="enterprise-btn" href="mailto:contact@baja.bio?subject=Baja.bio%20enterprise%20inquiry">
        ✉ Contact us for enterprise use
      </a>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .login-wrap {
      position:relative; overflow:hidden;
      min-height: 100vh; display:flex; align-items:center; justify-content:center;
      padding: 24px; box-sizing:border-box;
      background:
        radial-gradient(1200px 600px at 15% -10%, rgba(22,196,127,0.25), transparent 60%),
        radial-gradient(1000px 600px at 110% 10%, rgba(18,167,232,0.28), transparent 55%),
        radial-gradient(900px 700px at 50% 120%, rgba(255,140,26,0.20), transparent 55%),
        #071b2a;
      font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    }
    .palm-bg {
      position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0;
      display:flex; align-items:flex-end; justify-content:center;
      filter: blur(14px) saturate(1.15) brightness(0.95);
      opacity:0.55;
    }
    .palm-bg svg { width: min(120vw, 900px); height:100%; transform: translateY(4%); }
    .login-card {
      position:relative; z-index:1; width: 100%; max-width: 400px;
      background: rgba(10,25,40,0.72); backdrop-filter: blur(14px);
      border: 1px solid rgba(18,194,224,0.28); border-radius: 18px;
      padding: 30px 28px 22px; overflow:hidden;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03) inset;
    }
    .brandline {
      position:absolute; top:0; left:0; right:0; height:5px;
      background: linear-gradient(90deg, #16c47f, #12c2c2, #12a7e8, #ff8c1a);
    }
    .beta-banner {
      display:flex; align-items:center; justify-content:center; gap:9px; flex-wrap:wrap;
      margin: 4px 0 18px; padding: 9px 12px; border-radius: 11px;
      background: linear-gradient(90deg, rgba(22,196,127,0.18), rgba(18,167,232,0.18), rgba(255,140,26,0.18));
      border: 1px solid rgba(18,194,224,0.35);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25) inset;
    }
    .beta-tag {
      font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.5px;
      color:#0a2540; background:#ffca28; border-radius:6px; padding:3px 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .beta-text { font-size:13.5px; font-weight:600; color:#eaf6f9; letter-spacing:.2px; }
    .head { text-align:center; margin-bottom: 22px; }
    .logo {
      width:72px; height:72px; margin:6px auto 12px; border-radius:18px;
      display:flex; align-items:center; justify-content:center; overflow:hidden;
      background:#ffffff; border: 1px solid rgba(18,194,224,0.35);
      box-shadow: 0 6px 18px rgba(0,0,0,0.3);
    }
    .logo img { width:100%; height:100%; object-fit:contain; padding:7px; box-sizing:border-box; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#eaf6f9; letter-spacing:.2px; }
    .sub { margin:6px 0 0; font-size:13px; color:#9db6c4; }
    .feat-head { text-align:center; font-size:10.5px; font-weight:800; letter-spacing:.6px;
      text-transform:uppercase; color:#19d0d0; margin: 0 0 9px; }
    .features { list-style:none; margin:0 0 18px; padding:0 4px; }
    .features li { font-size:12.5px; line-height:1.4; color:#cfe3ea; margin:0 0 7px;
      padding-left:20px; position:relative; }
    .features li::before { content:"✓"; position:absolute; left:2px; top:0; color:#16c47f;
      font-weight:900; font-size:12px; }
    .tour-label { text-align:center; font-size:10.5px; font-weight:800; letter-spacing:.6px;
      text-transform:uppercase; color:#19d0d0; margin: 0 0 8px; }
    /* sunset beach: warm gold -> orange -> coral (match the subscription page) */
    .demo-row { display:flex; flex-wrap:nowrap; gap:10px; margin: 0 0 18px; }
    .demo-link { display:inline-block; font-size:13px; font-weight:800; cursor:pointer;
      color:#3a1500; text-decoration:none; background: linear-gradient(135deg,#ffd166,#ff9a3c,#ff6b81);
      border-radius:10px; padding:10px 14px; box-shadow:0 6px 16px rgba(255,120,80,0.38);
      transition: transform .1s ease, filter .15s ease; flex:1 1 0; text-align:center; }
    .demo-link--alt { color:#4a1224; background: linear-gradient(135deg,#ffb15a,#ff7a8a,#ff5e8a); }
    .demo-link:hover { filter:brightness(1.06); transform: translateY(-1px); }
    .providers { display:flex; flex-direction:column; gap:11px; }
    .pbtn {
      display:flex; align-items:center; gap:12px; width:100%;
      padding: 11px 14px; border-radius: 11px; cursor:pointer;
      background:#ffffff; color:#1b2b36; font-size:14px; font-weight:600;
      border:1px solid rgba(0,0,0,0.08);
      transition: transform .08s ease, box-shadow .15s ease, filter .15s ease;
    }
    .pbtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,0.35); }
    .pbtn:active:not(:disabled) { transform: translateY(0); }
    .pbtn:disabled { opacity:.6; cursor:default; }
    .pbtn.dark { background:#151b23; color:#f4f6f8; border-color: rgba(255,255,255,0.12); }
    .glyph { display:flex; width:22px; justify-content:center; }
    .ptext { flex:1; text-align:left; }
    .badge {
      font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px;
      color:#0a2540; background:#ffca28; border-radius:6px; padding:2px 6px;
    }
    .empty { text-align:center; color:#9db6c4; font-size:13px; }
    .empty .hint { font-size:12px; color:#7e97a6; margin-top:10px; line-height:1.6; }
    code { color:#12c2e0; background: rgba(18,194,224,0.12); padding:1px 5px; border-radius:5px; font-size:11px; }
    .error {
      margin-top:16px; padding:10px 12px; border-radius:9px; font-size:13px;
      color:#ffd9c2; background: rgba(255,90,40,0.14); border:1px solid rgba(255,140,26,0.4);
    }
    .signup { margin-top:20px; text-align:center; }
    .secure { font-size:11.5px; color:#7e97a6; }
    .su-row {
      margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);
      font-size:13px; color:#9db6c4;
    }
    .su-link {
      background:none; border:none; cursor:pointer; padding:0 2px;
      font-size:13px; font-weight:700; color:#12c2e0; text-decoration:underline;
    }
    .su-link:hover { color:#16c47f; }
    .enterprise-btn { display:block; width:100%; box-sizing:border-box; margin-top:16px; padding:10px 14px;
      text-align:center; text-decoration:none; font-size:13px; font-weight:800; color:#bfeef6;
      background: rgba(18,194,224,0.10); border:1px solid rgba(18,194,224,0.45); border-radius:11px;
      transition: transform .1s ease, background .15s ease, box-shadow .15s ease; }
    .enterprise-btn:hover { transform: translateY(-1px); background: rgba(18,194,224,0.18);
      box-shadow:0 8px 20px rgba(18,167,232,0.25); }
  `],
})
export class LoginComponent {
  providers: OidcProvider[] = [];
  busy = false;
  error = '';

  // Product highlights shown on the login card. Overridable via window.env['loginFeatures'].
  features: string[] = ((typeof window !== 'undefined' && (window as any)['env']?.['loginFeatures']) || [
    'Visualize genes, variants & mutations in context',
    'Design siRNA, ASO & qPCR assays — with djPrimer',
    'Splicing & RNA-binding predictions — BajaSplice, BajaCLIP',
    'Bonus book: “The Chemistry of RNA Therapeutics”',
  ]);

  constructor(
    private auth: OidcAuthService,
    private sanitizer: DomSanitizer,
    private msal: MsalService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
  ) {
    // Only surface providers that are actually supported/configured. Facebook is
    // intentionally excluded as a sign-in option.
    this.providers = this.auth.providers.filter(p => p.configured && p.id !== 'facebook');
  }

  get hasConfigured(): boolean { return this.providers.length > 0; }

  // Open a public, no-login feature tour: scientist carousel (index.html) or the
  // plain-language "for the curious" tour (for-you.html), in its own window.
  openDemo(ev?: Event, page: string = 'index.html') {
    if (ev) ev.preventDefault();
    const safe = page === 'for-you.html' ? 'for-you.html' : 'index.html';
    const win = safe === 'for-you.html' ? 'baja-demo-curious' : 'baja-demo';
    window.open('assets/demo/' + safe, win,
      'width=860,height=820,menubar=no,toolbar=no,location=no,status=no');
  }

  /**
   * "Create an account" → the Oligodesigner (Microsoft Entra External ID / CIAM) sign-up /
   * sign-in page, when that provider is configured. Falls back to the legacy Azure AD B2C
   * sign-up flow otherwise.
   */
  signUp() {
    const ciam = this.auth.getProvider('oidc');
    if (ciam && ciam.configured) {
      this.error = '';
      this.busy = true;
      this.auth.login('oidc').catch((e: any) => { this.busy = false; this.error = e?.message || String(e); });
      return;
    }
    const policies = (typeof window !== 'undefined' && (window as any)['env']?.['auth'] === 'raredb')
      ? rarePolicies : b2cPolicies;
    const req: RedirectRequest = { authority: policies.authorities.signUp.authority, scopes: [] };
    if (this.msalGuardConfig.authRequest) {
      this.msal.loginRedirect({ ...this.msalGuardConfig.authRequest, ...req } as RedirectRequest);
    } else {
      this.msal.loginRedirect(req);
    }
  }

  isDark(p: OidcProvider): boolean {
    const c = (p.brand || '').toLowerCase();
    return c === '#000000' || c === '#24292f' || c === '#151b23';
  }

  glyph(p: OidcProvider): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(p.glyph);
  }

  async signIn(p: OidcProvider) {
    if (!p.configured) return;
    this.error = '';
    this.busy = true;
    try {
      await this.auth.login(p.id);   // redirects away
    } catch (e: any) {
      this.busy = false;
      this.error = e?.message || String(e);
    }
  }
}
