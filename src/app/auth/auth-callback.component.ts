import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OidcAuthService } from './oidc-auth.service';

/**
 * Landing route for the provider redirect (/auth/callback). Completes the code exchange,
 * then routes on. Handles both query-string (?code=…) and fragment (#code=…) responses.
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="cb-wrap">
    <div class="cb-card">
      <div class="brandline"></div>
      <ng-container *ngIf="!error; else err">
        <div class="spinner"></div>
        <p>Completing sign-in…</p>
      </ng-container>
      <ng-template #err>
        <div class="x">⚠️</div>
        <p class="msg">{{ error }}</p>
        <button class="retry" (click)="backToLogin()">Back to sign in</button>
      </ng-template>
    </div>
  </div>
  `,
  styles: [`
    .cb-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center;
      background: radial-gradient(1000px 600px at 20% -10%, rgba(18,167,232,0.25), transparent 55%), #071b2a;
      font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif; }
    .cb-card { position:relative; overflow:hidden; text-align:center; color:#dcedf4;
      background: rgba(10,25,40,0.72); border:1px solid rgba(18,194,224,0.28); border-radius:16px;
      padding:34px 40px; min-width:280px; box-shadow:0 24px 70px rgba(0,0,0,0.45); }
    .brandline { position:absolute; top:0; left:0; right:0; height:5px;
      background: linear-gradient(90deg,#16c47f,#12c2c2,#12a7e8,#ff8c1a); }
    .spinner { width:34px; height:34px; margin:6px auto 16px; border-radius:50%;
      border:3px solid rgba(18,194,224,0.25); border-top-color:#12c2e0; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { margin:0; font-size:14px; color:#bcd3df; }
    .x { font-size:30px; margin-bottom:10px; }
    .msg { color:#ffd9c2; }
    .retry { margin-top:18px; padding:9px 16px; border-radius:9px; cursor:pointer;
      background:#12c2e0; color:#062430; border:none; font-weight:700; font-size:13px; }
  `],
})
export class AuthCallbackComponent implements OnInit {
  error = '';

  constructor(private auth: OidcAuthService, private router: Router) {}

  async ngOnInit() {
    try {
      // Providers may return params in the query or the fragment.
      const q = new URLSearchParams(window.location.search.replace(/^\?/, ''));
      const frag = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const merged = new URLSearchParams();
      frag.forEach((v, k) => merged.set(k, v));
      q.forEach((v, k) => merged.set(k, v));

      await this.auth.handleCallback(merged);

      const dest = sessionStorage.getItem('oidc.returnTo') || '/';
      sessionStorage.removeItem('oidc.returnTo');
      // Clean the URL of the auth params before navigating.
      window.history.replaceState({}, document.title, window.location.pathname);
      this.router.navigateByUrl(dest);
    } catch (e: any) {
      this.error = e?.message || String(e);
    }
  }

  backToLogin() { this.router.navigateByUrl('/login'); }
}
