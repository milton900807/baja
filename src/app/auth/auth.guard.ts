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

  // Public read-only viewer: shared "view-only" links (manchester/viewer) must open
  // without any login or subscription. Allow them through unconditionally.
  try {
    const u = (state.url || '').toLowerCase();
    if (u.includes('/manchester/viewer') || u.includes('manchester%2fviewer')) return true;
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
    return router.parseUrl('/login');
  }

  // Signed in — require an active subscription. Fail open on error / no email so a Stripe
  // outage (or a backend without STRIPE_SECRET_KEY) never blocks access.
  const s = await sub.statusCached();
  if (s.active || s.status === 'error' || s.status === 'no-user') return true;

  try { sessionStorage.setItem('oidc.returnTo', state.url); } catch { /* ignore */ }
  return router.parseUrl('/subscribe');
};
