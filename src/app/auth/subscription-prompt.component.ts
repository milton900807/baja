import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OidcAuthService } from './oidc-auth.service';
import { SubscriptionService } from './subscription.service';

@Component({
  selector: 'app-subscription-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="sub-wrap">
    <div class="sub-card">
      <div class="brandline"></div>

      <div class="head">
        <div class="logo"><img src="assets/img/icons/yak.png" alt="" /></div>
        <h1>Subscribe to continue</h1>
        <p class="sub" *ngIf="userEmail">Signed in as {{ userEmail }}</p>
      </div>

      <div class="plan">
        <div class="plan__top">
          <div class="plan__name">{{ planName }}</div>
          <span class="beta-badge">Beta release</span>
        </div>
        <div class="plan__price">{{ planPrice }}<span class="per">{{ planPeriod }}</span></div>
        <div class="beta-note">🔥 Limited beta pricing — only a limited number of early users get this rate, and it's locked in for a full year.</div>
        <ul class="feats">
          <li *ngFor="let f of features">{{ f }}</li>
        </ul>
      </div>

      <div class="notice" *ngIf="checking">Checking your subscription…</div>
      <div class="notice ok" *ngIf="justSubscribed">✅ You're subscribed — taking you in…</div>
      <div class="notice warn" *ngIf="canceled">Checkout canceled. You can subscribe whenever you're ready.</div>
      <div class="error" *ngIf="error">{{ error }}</div>

      <button class="cta" [disabled]="busy || checking" (click)="subscribe()">
        <span *ngIf="!busy">Subscribe</span>
        <span *ngIf="busy">Redirecting…</span>
      </button>
      <div class="pay-note">Card, Apple&nbsp;Pay, Google&nbsp;Pay &amp; Link · secured by Stripe</div>

      <button class="ghost" type="button" (click)="signOut()">Sign out</button>
    </div>
  </div>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .sub-wrap {
      position:relative; overflow:hidden; min-height:100vh;
      display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;
      background:
        radial-gradient(1200px 600px at 15% -10%, rgba(22,196,127,0.25), transparent 60%),
        radial-gradient(1000px 600px at 110% 10%, rgba(18,167,232,0.28), transparent 55%),
        radial-gradient(900px 700px at 50% 120%, rgba(255,140,26,0.20), transparent 55%),
        #071b2a;
      font-family:"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    }
    .sub-card {
      position:relative; width:100%; max-width:420px; overflow:hidden;
      background: rgba(10,25,40,0.74); backdrop-filter: blur(14px);
      border:1px solid rgba(18,194,224,0.28); border-radius:18px; padding:30px 28px 22px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45);
    }
    .brandline { position:absolute; top:0; left:0; right:0; height:5px;
      background: linear-gradient(90deg,#16c47f,#12c2c2,#12a7e8,#ff8c1a); }
    .head { text-align:center; margin-bottom:18px; }
    .logo { width:64px; height:64px; margin:6px auto 12px; border-radius:16px; overflow:hidden;
      display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid rgba(18,194,224,0.35); }
    .logo img { width:100%; height:100%; object-fit:contain; padding:7px; box-sizing:border-box; }
    h1 { margin:0; font-size:22px; font-weight:700; color:#eaf6f9; }
    .sub { margin:6px 0 0; font-size:13px; color:#9db6c4; }
    .plan { border:1px solid rgba(18,194,224,0.22); border-radius:14px; padding:16px 18px; margin-bottom:16px;
      background: rgba(18,194,224,0.06); }
    .plan__top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .plan__name { font-size:13px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; color:#12c2e0; }
    .beta-badge { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.5px;
      color:#0a2540; background:#ffca28; border-radius:6px; padding:3px 8px; white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.25); }
    .beta-note { margin-top:10px; padding:8px 10px; border-radius:9px; font-size:12.5px; line-height:1.45;
      color:#ffe0c2; background: rgba(255,140,26,0.12); border:1px solid rgba(255,140,26,0.4); }
    .plan__price { font-size:34px; font-weight:800; color:#eaf6f9; margin-top:4px; }
    .plan__price .per { font-size:14px; font-weight:500; color:#9db6c4; margin-left:4px; }
    .feats { list-style:none; margin:12px 0 0; padding:0; }
    .feats li { position:relative; padding:5px 0 5px 22px; color:#cfe4ec; font-size:13.5px; }
    .feats li::before { content:"✓"; position:absolute; left:0; color:#16c47f; font-weight:800; }
    .cta { width:100%; margin-top:4px; padding:13px 16px; border:none; border-radius:12px; cursor:pointer;
      font-size:15px; font-weight:800; color:#062430;
      background: linear-gradient(135deg,#16c47f,#12a7e8); box-shadow:0 8px 22px rgba(18,167,232,0.4);
      transition: transform .1s ease, box-shadow .18s ease, opacity .15s ease; }
    .cta:hover:not(:disabled) { transform: translateY(-1px); box-shadow:0 10px 26px rgba(18,167,232,0.55); }
    .cta:disabled { opacity:.6; cursor:default; }
    .pay-note { margin-top:10px; text-align:center; font-size:11.5px; color:#7e97a6; }
    .notice { margin:2px 0 14px; padding:9px 12px; border-radius:9px; font-size:13px; color:#bcd3df;
      background: rgba(18,194,224,0.1); border:1px solid rgba(18,194,224,0.25); }
    .notice.ok { color:#c8f7e2; background: rgba(22,196,127,0.14); border-color: rgba(22,196,127,0.4); }
    .notice.warn { color:#ffe0c2; background: rgba(255,140,26,0.12); border-color: rgba(255,140,26,0.35); }
    .error { margin:2px 0 14px; padding:9px 12px; border-radius:9px; font-size:13px;
      color:#ffd9c2; background: rgba(255,90,40,0.14); border:1px solid rgba(255,140,26,0.4); }
    .ghost { display:block; margin:16px auto 0; background:none; border:none; cursor:pointer;
      font-size:12.5px; color:#7e97a6; text-decoration:underline; }
    .ghost:hover { color:#bcd3df; }
  `],
})
export class SubscriptionPromptComponent implements OnInit {
  userEmail: string | null = null;
  busy = false;
  checking = true;
  justSubscribed = false;
  canceled = false;
  error = '';

  // Plan copy. The price/period are fetched live from Stripe in ngOnInit (so the UI always
  // matches STRIPE_PRICE_ID); the env values are only a fallback if that fetch fails.
  planName = String((window as any)['env']?.['planName'] || 'Baja Pro');
  planPrice = String((window as any)['env']?.['planPrice'] || '');
  planPeriod = String((window as any)['env']?.['planPeriod'] || '');
  features: string[] = ((window as any)['env']?.['planFeatures']) || [
    'Full genome editor & multi-track browser',
    'Design siRNA, ASO & qPCR assays',
    'Off-target analysis & splicing models',
    'Unlimited projects and exports',
  ];

  constructor(
    private auth: OidcAuthService,
    private sub: SubscriptionService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.userEmail = this.auth.getUser()?.email || null;

    // Show the real Stripe price (falls back to env / a sane default if unavailable).
    this.sub.priceInfo().then(p => {
      if (p && p.display) { this.planPrice = p.display; this.planPeriod = p.period || ''; }
      else if (!this.planPrice) { this.planPrice = '$49'; this.planPeriod = '/month'; }
    });

    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    this.canceled = status === 'cancel';

    // Returning from Checkout: give Stripe a moment, then confirm and route in.
    if (status === 'success') {
      this.sub.clearCache();
      await this.pollActive();
      return;
    }

    // Already subscribed? go straight in.
    const s = await this.sub.status();
    this.checking = false;
    if (s.active) this.goIn();
  }

  private async pollActive(tries = 8): Promise<void> {
    this.checking = true;
    for (let i = 0; i < tries; i++) {
      const s = await this.sub.status();
      if (s.active) { this.checking = false; this.justSubscribed = true; setTimeout(() => this.goIn(), 900); return; }
      await new Promise(r => setTimeout(r, 1200));
    }
    this.checking = false; // webhook not synced yet — let them retry
  }

  private goIn() {
    const dest = sessionStorage.getItem('oidc.returnTo') || '/';
    sessionStorage.removeItem('oidc.returnTo');
    // Full page LOAD (not an Angular SPA route change) so the app bootstraps via
    // window.env.init (/app/baja/init.js). A client-side navigateByUrl leaves the
    // engine un-initialized and the "taking you in…" screen stalls.
    window.location.assign(dest);
  }

  async subscribe() {
    this.error = '';
    this.busy = true;
    try {
      await this.sub.subscribe();   // redirects away
    } catch (e: any) {
      this.busy = false;
      this.error = e?.message || String(e);
    }
  }

  signOut() { this.auth.logout('/login'); }
}
