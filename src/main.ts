import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// --- Deep-link survival across the prod auth round-trip --------------------------------
// On production, reloading a deep editor link (/app/manchester/editor?path=…) can trigger a
// full-page OIDC/Google token-refresh redirect mid-boot. When the browser returns, an in-page
// navigation lands on the default home (/app/baja/init) and the ?path= is lost, so the file
// never loads. (Locally the token is always fresh, so no redirect happens and the path
// survives — which is why reload works under `ng serve` but not on AWS.)
//
// Capture the intended editor link at the EARLIEST possible moment — before Angular's router,
// guards, or the auth callback can touch the URL — and stash it (with a timestamp). dash.component
// restores it one-shot if it would otherwise fall back to init. Timestamped so a later,
// user-initiated Home navigation is never hijacked.
try {
  const loc = window.location.pathname + window.location.search;
  if (loc.indexOf('manchester/editor') >= 0 && loc.indexOf('path=') >= 0) {
    sessionStorage.setItem('deep.editor', JSON.stringify({ url: loc, t: Date.now() }));
  }
} catch (e) { /* sessionStorage may be unavailable; ignore */ }

// --- Spurious auth-redirect blocker (fix + diagnostic) ---------------------------------
// A logged-in user (a valid OIDC session in localStorage) must never be auto-redirected to an
// auth provider from inside the app — that only happens due to the production re-auth loop, which
// reloads the page and discards the open file. Block any navigation to an auth provider while a
// session with an email exists, and log the initiating stack so the source can be removed. New
// users (no session) are NOT blocked, so real sign-in still works. Covers assign/replace/open/form
// (href = url is unforgeable in Chrome and can't be patched — the login() log below covers that).
(function installAuthNavBlocker() {
  const hasSession = (): boolean => {
    try { const s = JSON.parse(localStorage.getItem('oidc.session') || 'null'); return !!(s && s.user && s.user.email); } catch (e) { return false; }
  };
  const isAuthUrl = (u: any): boolean => {
    const s = '' + u;
    return s.indexOf('accounts.google.com') >= 0
      || s.indexOf('login.microsoftonline.com') >= 0
      || s.indexOf('b2clogin.com') >= 0
      || s.indexOf('ciamlogin.com') >= 0
      || (/[?&]response_type=/.test(s) && /[?&]client_id=/.test(s));
  };
  const onNav = (how: string, u: any): boolean => {
    const blocked = hasSession();
    // eslint-disable-next-line no-console
    console.error('🔴 AUTH-NAV via ' + how + ' (' + (blocked ? 'BLOCKED — session present' : 'allowed — no session') + ') →\n' + u + '\nSTACK:\n' + (new Error().stack || '(no stack)'));
    return blocked;
  };
  try {
    const proto: any = Object.getPrototypeOf(window.location);
    const oa = proto.assign, orp = proto.replace;
    if (typeof oa === 'function') proto.assign = function (this: any, u: any) { if (isAuthUrl(u) && onNav('assign', u)) return; return oa.apply(this, arguments as any); };
    if (typeof orp === 'function') proto.replace = function (this: any, u: any) { if (isAuthUrl(u) && onNav('replace', u)) return; return orp.apply(this, arguments as any); };
  } catch (e) { /* ignore */ }
  try { const oo = window.open; (window as any).open = function (this: any, u?: any) { if (isAuthUrl(u) && onNav('open', u)) return null; return oo.apply(this, arguments as any); }; } catch (e) { /* ignore */ }
  try { document.addEventListener('submit', (ev: any) => { try { const a = ev && ev.target && ev.target.action; if (isAuthUrl(a) && onNav('form', a)) { ev.preventDefault(); ev.stopPropagation(); } } catch (e) { } }, true); } catch (e) { /* ignore */ }
})();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
