import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { OidcAuthService } from './oidc-auth.service';
import { SubscriptionService } from './subscription.service';

/**
 * Route guard: require a valid session (→ /login) and, once signed in, an active Stripe
 * subscription (→ /subscribe). The subscription check "fails open" so a Stripe outage or an
 * unconfigured backend never locks users out.
 */
export const authGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const auth = inject(OidcAuthService);
  const sub = inject(SubscriptionService);
  const router = inject(Router);

  // Routes that must open WITHOUT an active subscription:
  //   • manchester/viewer            — shared read-only links, no login either
  //   • manchester/clinical-library-public — the public compound library
  //   • free/editor                  — the free-tier editor. Its limits are the metered AI and
  //                                    off-target calls (enforced server-side), NOT access, so
  //                                    gating it here sent every non-subscriber who chose
  //                                    "Continue with the free version" straight back to
  //                                    /subscribe — the exact dead end that option exists to
  //                                    avoid.
  try {
    const u = (state.url || '').toLowerCase();
    // THE ONLY PAGES THAT OPEN WITHOUT SIGN-IN: the read-only viewer (shared links and the
    // public IP genome viewer, /public/ip -> /app/manchester/viewer?ip=1). Everything else
    // requires login and is bounced to /login on the same host by the checks below.
    if (u.includes('/manchester/viewer') || u.includes('manchester%2fviewer')) return true;
    // The clinical-library-public exemption is gone: the library is subscribers-only, and a
    // route that skipped sign-in was a way around that gate rather than a separate product.
    //
    // The free editor is NOT exempt any more: it is "behind sign-in but not behind payment"
    // (see the /app/free bypass further down), so an anonymous visitor is sent to /login and
    // only the subscription check is skipped once they are signed in.
  } catch { /* ignore */ }

  // Don't gate the app until at least one OIDC provider is actually configured — this
  // avoids locking everyone out during rollout (before client IDs are set in window.env).
  if (!auth.providers.some(p => p.configured)) return true;

  if (!auth.isAuthenticated()) {
    // Fail-open when a session identity is present: the app authorizes by email, and bouncing to
    // /login here caused a full-page silent re-auth loop on production. Only route to /login when
    // there is genuinely no signed-in user.
    try {
      const u = auth.getUser && auth.getUser();
      if (u && u.email) return true;
    } catch { /* fall through to /login */ }
    try { sessionStorage.setItem('oidc.returnTo', state.url); } catch { /* ignore */ }
    // A free-editor visitor is bounced into the FREE sign-in (/login?free=1) so the
    // "continue without paying" path is offered; everything else goes to the plain
    // /login. Either way it is the same host — parseUrl keeps the current origin.
    const isFree = /^\/app\/free(\/|$)/.test(('' + state.url).toLowerCase().split('?')[0]);
    return router.parseUrl(isFree ? '/login?free=1' : '/login');
  }

  // The FREE TIER is behind sign-in but not behind payment. Without this, a signed-in
  // non-subscriber asking for /app/free/editor was sent to /subscribe by the check below --
  // so the free version could not be reached by the only people it exists for, and the
  // "continue with free version" button led to the paywall it was meant to bypass.
  //
  // Login is still required: this sits AFTER the authentication check above, so an
  // anonymous visitor is still routed to /login with oidc.returnTo pointing back here.
  try {
    if (/^\/app\/free(\/|$)/.test(('' + state.url).toLowerCase().split('?')[0])) return true;
  } catch { /* fall through to the subscription check */ }

  // Signed in — require an active subscription. Fail open on error / no email so a Stripe
  // outage (or a backend without STRIPE_SECRET_KEY) never blocks access.
  const s = await sub.statusCached();
  if (s.active || s.status === 'error' || s.status === 'no-user') return true;

  // Signed in, not subscribed: the FREE TIER, and it keeps the page it asked for.
  //
  // This used to redirect to /subscribe, which meant a free user could not RELOAD. Every
  // refresh threw away the editor they were working in and put the paywall in front of them,
  // on a plan whose whole premise is that editing is unlimited. The free-editor URL was
  // exempted at the top of this file, but the app does not stay on that URL once a track is
  // open, so the exemption stopped applying the moment the tier was actually being used.
  //
  // Access is not what the free tier limits. Designs and off-target searches are, and those
  // are metered in freeGate on the server, which is the only place a browser cannot edit.
  // Gating the page as well was a second lock on a door whose real lock is elsewhere.
  //
  // The flag tells the editor to run in free mode -- it skips its own subscription gate and
  // the shell draws the free-plan badge. checkFreePlan re-asks every 20 seconds either way,
  // so someone who subscribes in another tab has it cleared without reloading.
  try { (window as any).__bajaFreeTier = true; } catch { /* ignore */ }
  return true;
};
