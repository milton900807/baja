import { Injectable } from '@angular/core';
import { OidcAuthService } from './oidc-auth.service';

export interface SubStatus {
  active: boolean;
  status: string;                 // 'active' | 'trialing' | 'none' | 'error' | 'no-user' | ...
  currentPeriodEnd?: number | null;
  customerId?: string;
}

/**
 * Talks to the baja-server Stripe endpoints. Access is gated on a live subscription-status
 * check (keyed on the signed-in user's email). Checkout is hosted by Stripe, so cards,
 * Apple Pay, Google Pay and Link are all supported.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private cache: { at: number; status: SubStatus } | null = null;

  constructor(private auth: OidcAuthService) {}

  private api(): string { return String((window as any)['env']?.['apiUrl'] || '').replace(/\/$/, ''); }
  private appBase(): string { return window.location.origin; }
  private email(): string | null { return this.auth.getUser()?.email || null; }

  /** Live status (no cache). Fails "open" (status 'error') so a Stripe outage never locks users out. */
  async status(email?: string): Promise<SubStatus> {
    const e = email || this.email();
    if (!e) return { active: false, status: 'no-user' };
    try {
      const r = await fetch(`${this.api()}/stripe/subscription-status?email=${encodeURIComponent(e)}`,
        { headers: { 'Accept': 'application/json' } });
      if (!r.ok) return { active: false, status: 'error' };
      return await r.json();
    } catch {
      return { active: false, status: 'error' };
    }
  }

  /** Cached status (default 60s) for cheap repeated guard checks. */
  async statusCached(ttlMs = 60000): Promise<SubStatus> {
    if (this.cache && Date.now() - this.cache.at < ttlMs) return this.cache.status;
    const s = await this.status();
    this.cache = { at: Date.now(), status: s };
    return s;
  }

  clearCache(): void { this.cache = null; }

  async isSubscribed(): Promise<boolean> { return (await this.statusCached()).active; }

  /** Start hosted Stripe Checkout (redirects away). */
  async subscribe(priceId?: string, returnPath = '/subscribe'): Promise<void> {
    const email = this.email();
    if (!email) throw new Error('Please sign in first.');
    const r = await fetch(`${this.api()}/stripe/create-checkout-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, name: this.auth.getUser()?.name, priceId,
        appBase: this.appBase(), returnPath,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error_description || j.error || 'Could not start checkout.');
    window.location.assign(j.url);
  }

  /** The configured plan price for display (e.g. { display: '$1', period: '/year' }). Null on error. */
  async priceInfo(): Promise<{ display?: string; period?: string; amount?: number; currency?: string } | null> {
    try {
      const r = await fetch(`${this.api()}/stripe/price-info`, { headers: { 'Content-Type': 'application/json' } });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  /** Open the Stripe billing portal to manage/cancel (redirects away). */
  async manage(): Promise<void> {
    const email = this.email();
    if (!email) throw new Error('Please sign in first.');
    const r = await fetch(`${this.api()}/stripe/portal`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, appBase: this.appBase() }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error_description || j.error || 'Could not open the billing portal.');
    window.location.assign(j.url);
  }
}
