/**
 * OAuth2 / OIDC provider registry.
 *
 * Every provider is configured for the Authorization Code flow with PKCE. Client IDs and
 * tenant/domain values are read from `window['env']` so they can be set per deployment
 * without a rebuild. A provider only appears on the login page when its client ID is set.
 *
 * Providers whose token endpoint cannot be called from the browser (no CORS and/or a
 * client secret is required — GitHub, Apple, Facebook) are marked `needsBackend`; for those
 * the authorization code is POSTed to a small server-side token-exchange proxy configured
 * via `window['env']['authTokenProxy']`.
 */

export interface OidcProvider {
  id: string;
  name: string;
  brand: string;               // brand color
  glyph: string;               // inline SVG (24x24) drawn on the button
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  issuer?: string;             // for OIDC discovery / id_token validation
  jwksUri?: string;            // JSON Web Key Set (for id_token signature validation)
  endSessionEndpoint?: string; // RP-initiated logout
  discoveryUrl?: string;       // .well-known/openid-configuration (auto-fills the endpoints)
  scope: string;
  clientId: string;
  responseType: string;        // 'code'
  usePkce: boolean;
  needsBackend: boolean;       // token exchange must go through a server proxy
  configured?: boolean;        // has a client ID + usable endpoints (else shown disabled)
  extraAuthParams?: Record<string, string>;
}

function env(): any {
  return (typeof window !== 'undefined' && (window as any)['env']) || {};
}

/** Read a config value, trying provider-scoped keys first, then a generic fallback. */
function cfg(...keys: string[]): string {
  const e = env();
  for (const k of keys) {
    const v = e[k];
    if (v != null && v !== '') return String(v);
  }
  return '';
}

/** Where browser-incompatible token exchanges are proxied (server holds the secret). */
export function authTokenProxy(): string {
  return cfg('authTokenProxy', 'oidcTokenProxy');
}

/** Redirect URI registered with each provider (defaults to <origin>/auth/callback). */
export function redirectUri(): string {
  const explicit = cfg('oidcRedirectUri');
  if (explicit) return explicit;
  const origin = (typeof window !== 'undefined') ? window.location.origin : '';
  return origin + '/auth/callback';
}

// --- brand glyphs (kept tiny/inline so the page needs no icon assets) -----------------
const G_GOOGLE = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.2 6.9 8.9 4.8 12 4.8z"/></svg>`;
const G_MS = `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>`;
const G_APPLE = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.3 5.6c.7-.8 1.1-2 1-3.1-1 0-2.1.6-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.1-.6 2.8-1.4z"/></svg>`;
const G_GITHUB = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>`;
const G_FB = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg>`;
const G_OKTA = `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="#007DC1" stroke-width="4"/></svg>`;
const G_AUTH0 = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#EB5424" d="M12 1.5l3.3 6.7 7.4.1-6 4.4 2.3 7-6-4.3-6 4.3 2.3-7-6-4.4 7.4-.1z"/></svg>`;
const G_OIDC = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;

/** Build the provider registry from the current environment. */
export function buildProviders(): OidcProvider[] {
  const msTenant = cfg('oidc.microsoft.tenant', 'tenant-id') || 'common';
  const oktaDomain = cfg('oidc.okta.domain');
  const auth0Domain = cfg('oidc.auth0.domain');
  const oidcIssuer = cfg('oidc.generic.issuer', 'oidcIssuer');

  const all: OidcProvider[] = [
    {
      id: 'google', name: 'Google', brand: '#ffffff', glyph: G_GOOGLE,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      issuer: 'https://accounts.google.com',
      scope: 'openid email profile',
      clientId: cfg('oidc.google.clientId', 'googleClientId'),
      responseType: 'code', usePkce: true, needsBackend: false,
      extraAuthParams: { access_type: 'offline', prompt: 'select_account' },
    },
    {
      id: 'microsoft', name: 'Microsoft', brand: '#ffffff', glyph: G_MS,
      authorizationEndpoint: `https://login.microsoftonline.com/${msTenant}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${msTenant}/oauth2/v2.0/token`,
      userInfoEndpoint: 'https://graph.microsoft.com/oidc/userinfo',
      issuer: `https://login.microsoftonline.com/${msTenant}/v2.0`,
      scope: 'openid email profile',
      clientId: cfg('oidc.microsoft.clientId', 'clientId'),
      responseType: 'code', usePkce: true, needsBackend: false,
      extraAuthParams: { prompt: 'select_account' },
    },
    {
      id: 'apple', name: 'Apple', brand: '#000000', glyph: G_APPLE,
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      issuer: 'https://appleid.apple.com',
      scope: 'openid name email',
      clientId: cfg('oidc.apple.clientId'),
      responseType: 'code', usePkce: true, needsBackend: true,
      extraAuthParams: { response_mode: 'form_post' },
    },
    {
      id: 'github', name: 'GitHub', brand: '#24292f', glyph: G_GITHUB,
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      scope: 'read:user user:email',
      clientId: cfg('oidc.github.clientId'),
      responseType: 'code', usePkce: false, needsBackend: true,
    },
    {
      id: 'facebook', name: 'Facebook', brand: '#1877F2', glyph: G_FB,
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoEndpoint: 'https://graph.facebook.com/me?fields=id,name,email,picture',
      scope: 'email public_profile',
      clientId: cfg('oidc.facebook.clientId'),
      responseType: 'code', usePkce: false, needsBackend: true,
    },
    {
      id: 'okta', name: 'Okta', brand: '#ffffff', glyph: G_OKTA,
      authorizationEndpoint: oktaDomain ? `https://${oktaDomain}/oauth2/v1/authorize` : '',
      tokenEndpoint: oktaDomain ? `https://${oktaDomain}/oauth2/v1/token` : '',
      userInfoEndpoint: oktaDomain ? `https://${oktaDomain}/oauth2/v1/userinfo` : '',
      issuer: oktaDomain ? `https://${oktaDomain}` : '',
      scope: 'openid email profile',
      clientId: cfg('oidc.okta.clientId'),
      responseType: 'code', usePkce: true, needsBackend: false,
    },
    {
      id: 'auth0', name: 'Auth0', brand: '#ffffff', glyph: G_AUTH0,
      authorizationEndpoint: auth0Domain ? `https://${auth0Domain}/authorize` : '',
      tokenEndpoint: auth0Domain ? `https://${auth0Domain}/oauth/token` : '',
      userInfoEndpoint: auth0Domain ? `https://${auth0Domain}/userinfo` : '',
      issuer: auth0Domain ? `https://${auth0Domain}/` : '',
      scope: 'openid email profile',
      clientId: cfg('oidc.auth0.clientId'),
      responseType: 'code', usePkce: true, needsBackend: false,
    },
    {
      id: 'oidc', name: cfg('oidc.generic.name') || 'Single Sign-On', brand: '#ffffff', glyph: G_OIDC,
      authorizationEndpoint: cfg('oidc.generic.authorizationEndpoint') || (oidcIssuer ? oidcIssuer.replace(/\/$/, '') + '/authorize' : ''),
      tokenEndpoint: cfg('oidc.generic.tokenEndpoint') || (oidcIssuer ? oidcIssuer.replace(/\/$/, '') + '/token' : ''),
      userInfoEndpoint: cfg('oidc.generic.userInfoEndpoint') || (oidcIssuer ? oidcIssuer.replace(/\/$/, '') + '/userinfo' : ''),
      issuer: oidcIssuer,
      scope: cfg('oidc.generic.scope') || 'openid email profile',
      clientId: cfg('oidc.generic.clientId'),
      responseType: 'code', usePkce: true, needsBackend: false,
    },
  ];

  // Apply per-provider env overrides for EVERY endpoint + a discovery URL. This lets any
  // provider be pointed at its well-known configuration (or have each endpoint set
  // explicitly) from window.env, e.g. oidc.google.authorizationEndpoint,
  // oidc.okta.wellKnown, oidc.generic.jwksUri, oidc.microsoft.endSessionEndpoint …
  // ALL providers are returned so the login page can list them; `configured` marks which
  // ones can actually be used (client ID + usable endpoints). Unconfigured ones render
  // disabled so they're still visible.
  return all.map(applyEndpointOverrides).map(p => ({
    ...p,
    configured: !!(p.clientId && (p.authorizationEndpoint || p.discoveryUrl)),
  }));
}

/** Layer window.env overrides for all well-known endpoints onto a provider. */
function applyEndpointOverrides(p: OidcProvider): OidcProvider {
  const id = p.id;
  p.issuer = cfg(`oidc.${id}.issuer`) || p.issuer;
  p.authorizationEndpoint = cfg(`oidc.${id}.authorizationEndpoint`, `oidc.${id}.authorizeUrl`) || p.authorizationEndpoint;
  p.tokenEndpoint = cfg(`oidc.${id}.tokenEndpoint`, `oidc.${id}.tokenUrl`) || p.tokenEndpoint;
  p.userInfoEndpoint = cfg(`oidc.${id}.userInfoEndpoint`, `oidc.${id}.userinfoUrl`) || p.userInfoEndpoint;
  p.jwksUri = cfg(`oidc.${id}.jwksUri`, `oidc.${id}.jwksUrl`) || p.jwksUri;
  p.endSessionEndpoint = cfg(`oidc.${id}.endSessionEndpoint`, `oidc.${id}.logoutUrl`) || p.endSessionEndpoint;
  p.scope = cfg(`oidc.${id}.scope`) || p.scope;
  // Force server-side token exchange for a provider (e.g. a Google "Web application" client
  // whose token endpoint needs the client secret): oidc.<id>.needsBackend = 'true'.
  const nb = cfg(`oidc.${id}.needsBackend`).toLowerCase();
  if (nb === 'true' || nb === '1' || nb === 'yes') p.needsBackend = true;
  else if (nb === 'false' || nb === '0' || nb === 'no') p.needsBackend = false;
  // Explicit discovery URL, else derive the standard one from the issuer.
  p.discoveryUrl = cfg(`oidc.${id}.wellKnown`, `oidc.${id}.discoveryUrl`)
    || (p.issuer ? p.issuer.replace(/\/$/, '') + '/.well-known/openid-configuration' : '');
  return p;
}

// --- PKCE + state helpers --------------------------------------------------------------

function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomUrlToken(lenBytes = 32): string {
  const a = new Uint8Array(lenBytes);
  (window.crypto || (window as any).msCrypto).getRandomValues(a);
  return base64UrlEncode(a);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}
