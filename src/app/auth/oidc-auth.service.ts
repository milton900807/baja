import { Injectable } from '@angular/core';
import {
  OidcProvider, buildProviders, redirectUri, authTokenProxy,
  randomUrlToken, pkceChallenge,
} from './oidc-providers';

export interface AuthUser {
  provider: string;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  raw?: any;
}

export interface AuthSession {
  provider: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: AuthUser;
}

const TX_KEY = 'oidc.tx';           // in-flight authorize transaction (sessionStorage)
const SESSION_KEY = 'oidc.session'; // persisted session (localStorage)

/**
 * Framework-agnostic OAuth2 / OIDC client implementing the Authorization Code flow with
 * PKCE entirely in the browser. Providers that require a server-side token exchange
 * (client secret / no CORS) are proxied through `authTokenProxy()`.
 */
@Injectable({ providedIn: 'root' })
export class OidcAuthService {
  readonly providers: OidcProvider[] = buildProviders();
  private discoveryCache: { [id: string]: any } = {};

  getProvider(id: string): OidcProvider | undefined {
    return this.providers.find(p => p.id === id);
  }

  /**
   * Resolve a provider's endpoints from its OIDC discovery document
   * (.well-known/openid-configuration) when available, filling any that aren't already
   * set explicitly. Cached per provider. Explicit env endpoints always win.
   */
  async discover(p: OidcProvider): Promise<void> {
    if (!p.discoveryUrl) return;
    // Skip the fetch when the endpoints are already fully known (e.g. hard-coded/overridden).
    if (p.authorizationEndpoint && p.tokenEndpoint && p.userInfoEndpoint) return;
    if (this.discoveryCache[p.id] === undefined) {
      try {
        const res = await fetch(p.discoveryUrl, { headers: { 'Accept': 'application/json' } });
        this.discoveryCache[p.id] = res.ok ? await res.json() : null;
      } catch { this.discoveryCache[p.id] = null; }
    }
    const d = this.discoveryCache[p.id];
    if (!d) return;
    // Only fill in endpoints that weren't set explicitly (env override wins).
    p.issuer = p.issuer || d.issuer;
    p.authorizationEndpoint = p.authorizationEndpoint || d.authorization_endpoint;
    p.tokenEndpoint = p.tokenEndpoint || d.token_endpoint;
    p.userInfoEndpoint = p.userInfoEndpoint || d.userinfo_endpoint;
    p.jwksUri = p.jwksUri || d.jwks_uri;
    p.endSessionEndpoint = p.endSessionEndpoint || d.end_session_endpoint;
  }

  /** Start the login: build PKCE + state, stash them, and redirect to the provider. */
  async login(providerId: string): Promise<void> {
    const p = this.getProvider(providerId);
    if (!p) throw new Error('Unknown or unconfigured provider: ' + providerId);
    await this.discover(p);                    // resolve endpoints from .well-known if needed
    if (!p.authorizationEndpoint) throw new Error(`${p.name}: no authorization endpoint (check its issuer / discovery URL).`);

    const state = randomUrlToken(24);
    const nonce = randomUrlToken(24);
    const verifier = p.usePkce ? randomUrlToken(48) : '';

    const params = new URLSearchParams({
      client_id: p.clientId,
      redirect_uri: redirectUri(),
      response_type: p.responseType || 'code',
      scope: p.scope,
      state,
      nonce,
    });
    if (p.usePkce) {
      params.set('code_challenge', await pkceChallenge(verifier));
      params.set('code_challenge_method', 'S256');
    }
    for (const [k, v] of Object.entries(p.extraAuthParams || {})) params.set(k, v);

    sessionStorage.setItem(TX_KEY, JSON.stringify({
      providerId, state, nonce, verifier, ts: Date.now(),
    }));

    window.location.assign(p.authorizationEndpoint + '?' + params.toString());
  }

  /**
   * Handle the provider redirect back to /auth/callback. Verifies state, exchanges the
   * code for tokens (directly or via the proxy), loads the user, persists the session.
   */
  async handleCallback(query: URLSearchParams): Promise<AuthSession> {
    const err = query.get('error');
    if (err) throw new Error(query.get('error_description') || err);

    const code = query.get('code');
    const state = query.get('state');
    const txRaw = sessionStorage.getItem(TX_KEY);
    if (!txRaw) throw new Error('No pending sign-in was found (session expired).');
    const tx = JSON.parse(txRaw);
    sessionStorage.removeItem(TX_KEY);

    if (!code) throw new Error('Authorization response was missing a code.');
    if (!state || state !== tx.state) throw new Error('State mismatch — possible CSRF, sign-in aborted.');

    const p = this.getProvider(tx.providerId);
    if (!p) throw new Error('Provider is no longer configured: ' + tx.providerId);
    await this.discover(p);                    // ensure token endpoint is resolved

    const tokens = p.needsBackend
      ? await this.exchangeViaProxy(p, code, tx.verifier)
      : await this.exchangeDirect(p, code, tx.verifier);

    const session: AuthSession = {
      provider: p.id,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + (+tokens.expires_in * 1000) : undefined,
    };
    session.user = await this.loadUser(p, session, tokens);

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  private async exchangeDirect(p: OidcProvider, code: string, verifier: string): Promise<any> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: p.clientId,
      redirect_uri: redirectUri(),
    });
    if (verifier) body.set('code_verifier', verifier);

    const res = await fetch(p.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error('Token exchange failed (' + res.status + '): ' + (await res.text()));
    return res.json();
  }

  private async exchangeViaProxy(p: OidcProvider, code: string, verifier: string): Promise<any> {
    const proxy = authTokenProxy();
    if (!proxy) {
      throw new Error(
        `${p.name} sign-in needs a server-side token exchange. Set window.env.authTokenProxy ` +
        `to your backend endpoint (it holds the client secret and calls the provider's token URL).`
      );
    }
    const res = await fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ provider: p.id, code, code_verifier: verifier, redirect_uri: redirectUri() }),
    });
    if (!res.ok) throw new Error('Token exchange (proxy) failed (' + res.status + '): ' + (await res.text()));
    return res.json();
  }

  private async loadUser(p: OidcProvider, session: AuthSession, tokens: any): Promise<AuthUser> {
    // Some providers (e.g. Entra External ID / CIAM accounts with no display name) send a
    // placeholder like "unknown" for the name claim. Treat that (and blanks) as NO name so
    // the UI falls back to the email instead of showing "U unknown".
    const normName = (n?: string): string | undefined => {
      const t = ('' + (n || '')).trim();
      return (!t || /^unknown(\s+user)?$/i.test(t)) ? undefined : t;
    };
    // Prefer the id_token claims (OIDC); fall back to the userinfo endpoint.
    const claims = session.idToken ? this.decodeJwt(session.idToken) : null;
    let user: AuthUser = {
      provider: p.id,
      sub: claims?.sub,
      name: normName(claims?.name),
      email: claims?.email,
      picture: claims?.picture,
      raw: claims || undefined,
    };

    if ((!user.email || !user.name) && p.userInfoEndpoint && session.accessToken) {
      try {
        const res = await fetch(p.userInfoEndpoint, {
          headers: { 'Authorization': 'Bearer ' + session.accessToken, 'Accept': 'application/json' },
        });
        if (res.ok) {
          const info = await res.json();
          user = {
            provider: p.id,
            sub: user.sub || info.sub || info.id,
            name: user.name || normName(info.name) || normName(info.login),
            email: user.email || info.email,
            picture: user.picture || info.picture || info.avatar_url || info?.picture?.data?.url,
            raw: info,
          };
        }
      } catch { /* userinfo is best-effort */ }
    }
    return user;
  }

  private decodeJwt(jwt: string): any {
    try {
      const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch { return null; }
  }

  // --- session accessors ---------------------------------------------------------------

  getSession(): AuthSession | null {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  getUser(): AuthUser | null {
    const u = this.getSession()?.user || null;
    // Also scrub a placeholder "unknown" name from any already-cached session so the
    // UI falls back to the email without requiring a re-login.
    if (u && u.name && /^unknown(\s+user)?$/i.test(('' + u.name).trim())) u.name = undefined;
    return u;
  }
  getAccessToken(): string | null { return this.getSession()?.accessToken || null; }

  isAuthenticated(): boolean {
    const s = this.getSession();
    if (!s || (!s.accessToken && !s.idToken)) return false;
    // NOTE: token expiry is intentionally NOT treated as "unauthenticated". This app authorizes
    // API access by the signed-in email (not the OIDC bearer token), so an expired token does not
    // block data access. Bouncing to /login on expiry triggered a full-page silent (prompt=none)
    // re-auth that looped on production — reloading the page every ~15s and discarding the open
    // file. As long as a session with a user is present, treat the user as signed in. (A silent,
    // non-disruptive refresh can be added later if a fresh token is ever actually needed.)
    if (!s.user || !s.user.email) {
      // Only when we truly have no identity do we consider expiry a reason to re-auth.
      if (s.expiresAt && Date.now() > s.expiresAt) return false;
    }
    return true;
  }

  logout(redirect = '/login'): void {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TX_KEY);
    if (redirect) window.location.assign(redirect);
  }
}
