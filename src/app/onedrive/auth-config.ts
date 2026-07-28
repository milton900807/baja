import {
    LogLevel,
    Configuration,
    BrowserCacheLocation,
} from '@azure/msal-browser';

const isIE =
    window.navigator.userAgent.indexOf('MSIE ') > -1 ||
    window.navigator.userAgent.indexOf('Trident/') > -1;

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */

// THIS IS THE AZURE LAJOLLALABS.COM COMPANY ACCOUNT
const APP_ID = window['env']['clientId'];//"c3e5ffbc-9b1c-44a5-93b6-7cb909b42481";
const TENANT_ID = window['env']['tenant-id'];//"b543ef7e-428b-4226-ad00-99b67b843915";
const rd = window['env']['redirectURL'];

const authb2b = {
    clientId: APP_ID, // This is the ONLY mandatory field that you need to supply.
    authority: `https://login.microsoftonline.com/${window['env']['tenant-id']}`, // Defaults to "https://login.microsoftonline.com/common"
    redirectUri: window['env']['redirectURL'], // Points to window.location.origin by default. You must register this URI on Azure portal/App Registration.
    postLogoutRedirectUri: '/', // Points to window.location.origin by default.
    clientCapabilities: ['CP1'], // This lets the resource server know that this client can handle claim challenges.
}

export const b2cPolicies = {
    names: {
        signUpSignIn: "B2C_1_lajollalabs",
        signUp: "B2C_1_signup",
        signInOnly: "B2C_1_signInOnly"
    },
    authorities: {
        signInOnly: {
            authority: "https://lajollalabs3.b2clogin.com/lajollalabs3.onmicrosoft.com/B2C_1_signInOnly",
        },
        signUpSignIn: {
            authority: "https://lajollalabs3.b2clogin.com/lajollalabs3.onmicrosoft.com/B2C_1_lajollalabs",
        } 
        ,
        signUp: {
            authority: "https://lajollalabs3.b2clogin.com/lajollalabs3.onmicrosoft.com/B2C_1_signup",
        },
        ResetPWDPolicy: {
            authority: "https://lajollalabs3.b2clogin.com/lajollalabs3.onmicrosoft.com/B2C_1_ljl_pwd_reset",

        }
    },
    authorityDomain: "lajollalabs3.b2clogin.com",
    Domain: "lajollalabs3.onmicrosoft.com",
    SignUpSignInPolicyId: "B2C_1_lajollalabs",
    SignUpPolicyId: "B2C_1_signup",
    ResetPWDPolicyID: "B2C_1_ljl_pwd_reset",
    signInOnly: "B2C_1_signInOnly"
};

export const rarePolicies = {
    names: {
        signUpSignIn: "B2C_1_raredb",
        signUp: "B2C_1_raredb",
        signInOnly: "B2C_1_raredb"
    },
    authorities: {
        signInOnly: {
            authority: "https://lajollalabs2.b2clogin.com/lajollalabs2.onmicrosoft.com/B2C_1_raredb",
        },
        signUpSignIn: {
            authority: "https://lajollalabs2.b2clogin.com/lajollalabs2.onmicrosoft.com/B2C_1_raredb-signup",
        } 
        ,
        signUp: {
            authority: "https://lajollalabs2.b2clogin.com/lajollalabs2.onmicrosoft.com/B2C_1_raredb-signup",
        },
        ResetPWDPolicy: {
            authority: "https://lajollalabs2.b2clogin.com/lajollalabs2.onmicrosoft.com/B2C_1_raredb",

        }
    },
    authorityDomain: "lajollalabs2.b2clogin.com",
    Domain: "lajollalabs2.onmicrosoft.com",
    SignUpSignInPolicyId: "B2C_1_raredb",
    SignUpPolicyId: "B2C_1_raredb",
    ResetPWDPolicyID: "B2C_1_raredb",
    signInOnly: "B2C_1_raredb"
};



const authb2c = {
    clientId: window['env']['clientId'],
    authority: b2cPolicies.authorities.signInOnly.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: rd,
    postLogoutRedirectUri: rd,
    navigateToLoginRequestUrl: true
}


const authRareDB = {
    clientId: window['env']['clientId'],
    authority: rarePolicies.authorities.signInOnly.authority,
    knownAuthorities: [rarePolicies.authorityDomain],
    redirectUri: rd,
    postLogoutRedirectUri: rd,
    navigateToLoginRequestUrl: true
}

let authConfig = () => {
    if (window['env']['auth'] === 'b2c') {
        return authb2c;
    } 
    else if ( window['env']['auth'] === 'raredb'){
        return authRareDB;
    }
    else {
        return authb2b;
    }
}


export const msalConfig: Configuration = {
    auth: authConfig()
    
}










export const msalConfig_b2b: Configuration = {
    auth: {
        clientId: APP_ID, // This is the ONLY mandatory field that you need to supply.
        authority: `https://login.microsoftonline.com/${TENANT_ID}`, // Defaults to "https://login.microsoftonline.com/common"
        redirectUri: window['env']['redirectURL'], // Points to window.location.origin by default. You must register this URI on Azure portal/App Registration.
        postLogoutRedirectUri: '/', // Points to window.location.origin by default.
        clientCapabilities: ['CP1'], // This lets the resource server know that this client can handle claim challenges.
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage, // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: isIE, // Set this to "true" if you are having issues on IE11 or Edge. Remove this line to use Angular Universal
    },
    system: {
        loggerOptions: {
            loggerCallback(logLevel: LogLevel, message: string) {
                console.log(message);
            },
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: false,
        },
    },
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const protectedResources = {
    graphMe: {
        endpoint: 'https://graph.microsoft.com/v1.0/me',
        scopes: ['User.Read'],
    },
    graphContacts: {
        endpoint: 'https://graph.microsoft.com/v1.0/me/contacts',
        scopes: [''],
    },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
    scopes: [],
};