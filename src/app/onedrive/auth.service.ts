import { Injectable } from '@angular/core';
import {
    AccountInfo,
    AuthenticationResult,
    InteractionRequiredAuthError,
    InteractionType,
} from '@azure/msal-browser';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
    Client,
    AuthenticationProvider,
    AuthenticationProviderOptions,
    ResponseType,
} from '@microsoft/microsoft-graph-client';
import {
    addClaimsToStorage,
    getClaimsFromStorage,
} from './storage-utils';
import { parseChallenges } from './claim-utils';

import { msalConfig, protectedResources } from './auth-config';
/**
 * The code below demonstrates how you can use MSAL as a custom authentication provider for the Microsoft Graph JavaScript SDK.
 * You do NOT need to implement a custom provider. Microsoft Graph JavaScript SDK v3.0 (preview) offers AuthCodeMSALBrowserAuthenticationProvider
 * which handles token acquisition and renewal for you automatically. For more information on how to use it, visit:
 * https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/AuthCodeMSALBrowserAuthenticationProvider.md
 */
import { GraphService } from './graph.service';
import { filter, takeUntil } from 'rxjs/operators';
export type Profile = {
    id?: string;
    userPrincipalName?: string;
    businessPhones?: Array<string>;
    displayName?: string;
    givenName?: string;
    jobTitle?: string;
    mail?: string;
    mobilePhone?: string;
    officeLocation?: string;
    preferredLanguage?: string;
    surname?: string;
};
export interface ProviderOptions extends AuthenticationProviderOptions {
    account: AccountInfo; // user account object to be used when attempting silent token acquisition
    scopes: string[]; // array of scopes required for this resource endpoint
    interactionType: InteractionType; // type of interaction to fallback to when silent token acquisition fails
    endpoint: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    dataSource: any[];

    constructor(
        private graphService: GraphService,
        private authService: MsalService, 
        private msalBroadcastService: MsalBroadcastService

    ) {


     }


     init () {
     }

    // async signIn() {
    //     const providerOptions: ProviderOptions = {
    //         account: this.authService.instance.getActiveAccount()!,
    //         scopes: protectedResources.graphMe.scopes,
    //         interactionType: InteractionType.Redirect,
    //         endpoint: protectedResources.graphMe.endpoint,
    //     };
    //     console.log ( " client ")

    //     let client = await this.graphService.getGraphClient(providerOptions)
    //     let me = await client.api('/me').get ();
    //     debugger;
    //     console.log ( " me " + JSON.stringify ( me ))

    // }
    async createClient(jsr): Promise<Client> {
        return new Promise((resolve, reject) => {
            const providerOptions: ProviderOptions = {
                account: this.authService.instance.getActiveAccount()!,
                scopes: protectedResources.graphMe.scopes,
                interactionType: InteractionType.Redirect,
                endpoint: protectedResources.graphMe.endpoint,
            };

            this.graphService
                .getGraphClient(providerOptions)
                .api('/me')
                .responseType(ResponseType.RAW)
                .get()
                .then((response: any) => {
                    if (response.status === 200) return response.json();
                    if (response.status === 401) {
                        if (response.headers.get('WWW-Authenticate')) {
                            this.graphService.handleClaimsChallenge(response, providerOptions);
                        }
                    }
                })
                .then((profileResponse: Profile) => {
                    Object.entries(profileResponse).forEach((claim: [string, unknown]) => {
                        this.dataSource = [...this.dataSource, { claim: claim[0], value: claim[1] }];
                        return resolve(this.graphService.getGraphClient(providerOptions))
                    });
                })
                .catch((error: any) => {
                    console.log(error);
                });

        })

    }
    authenticated: boolean = false;
    logout() {
        throw new Error("Method not implemented.");
    }
    async login(config: any): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    signOut() {
        throw new Error("Method not implemented.");
    }

    async getClient(): Promise<Client> {
        const providerOptions: ProviderOptions = {
            account: this.authService.instance.getActiveAccount()!,
            scopes: protectedResources.graphMe.scopes,
            interactionType: InteractionType.Redirect,
            endpoint: protectedResources.graphMe.endpoint,
        };
        return this.getGraphClient(providerOptions);
    }

    async getFGClient(): Promise<Client> {
        const providerOptions: ProviderOptions = {
            account: this.authService.instance.getActiveAccount()!,
            scopes: protectedResources.graphMe.scopes,
            interactionType: InteractionType.Redirect,
            endpoint: protectedResources.graphMe.endpoint,
        };
        return this.getGraphClient(providerOptions);
    }


    /**
     * Returns a graph client object with the provided token acquisition options
     * @param {ProviderOptions} providerOptions: object containing user account, required scopes and interaction type
     */
    getGraphClient = (providerOptions: ProviderOptions) => {
        /**
         * Pass the instance as authProvider in ClientOptions to instantiate the Client which will create and set the default middleware chain.
         * For more information, visit: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md
         */
        let clientOptions = {
            authProvider: new MsalAuthenticationProvider(
                providerOptions,
                this.authService
            ),
        };

        const graphClient = Client.initWithMiddleware(clientOptions);

        return graphClient;
    };

    /**
     * This method inspects the HTTPS response from a http call for the "WWW-Authenticate header"
     * If present, it grabs the claims challenge from the header and store it in the sessionStorage
     * For more information, visit: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge#claims-challenge-header-format
     * @param response
     */
    handleClaimsChallenge(response: any, providerOptions: ProviderOptions): void {
        const authenticateHeader: string = response.headers.get('WWW-Authenticate');
        const claimsChallengeMap: any = parseChallenges(authenticateHeader);
        let account: AccountInfo = this.authService.instance.getActiveAccount()!;

        /**
         * This method stores the claim challenge to the session storage in the browser to be used when acquiring a token.
         * To ensure that we are fetching the correct claim from the storage, we are using the clientId
         * of the application and oid (user’s object id) as the key identifier of the claim with schema
         * cc.<clientId>.<oid><resource.hostname>
         */
        addClaimsToStorage(
            claimsChallengeMap.claims,
            `cc.${msalConfig.auth.clientId}.${account?.idTokenClaims?.oid}.${new URL(providerOptions.endpoint).hostname
            }`
        );

        new MsalAuthenticationProvider(
            providerOptions,
            this.authService
        ).getAccessToken();
    }
}

/**
 * This class implements the IAuthenticationProvider interface, which allows a custom auth provider to be
 * used with the Graph client. See: https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/src/IAuthenticationProvider.ts
 */
class MsalAuthenticationProvider implements AuthenticationProvider {
    account;
    scopes;
    interactionType;
    endpoint;

    constructor(
        providerOptions: ProviderOptions,
        private authService: MsalService
    ) {
        this.account = providerOptions.account;
        this.scopes = providerOptions.scopes;
        this.interactionType = providerOptions.interactionType;
        this.endpoint = providerOptions.endpoint;
    }

    /**
     * This method will get called before every request to the ms graph server
     * This should return a Promise that resolves to an accessToken (in case of success) or rejects with error (in case of failure)
     * Basically this method will contain the implementation for getting and refreshing accessTokens
     */
    getAccessToken(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let response: AuthenticationResult;
            let resource = new URL(this.endpoint).hostname;
            let claim =
                this.authService.instance.getActiveAccount()! &&
                    getClaimsFromStorage(
                        `cc.${msalConfig.auth.clientId}.${this.authService.instance.getActiveAccount()?.idTokenClaims?.oid
                        }.${resource}`
                    )
                    ? window.atob(
                        getClaimsFromStorage(
                            `cc.${msalConfig.auth.clientId}.${this.authService.instance.getActiveAccount()?.idTokenClaims
                                ?.oid
                            }.${resource}`
                        )
                    )
                    : undefined; // e.g {"access_token":{"xms_cc":{"values":["cp1"]}}}
            try {

                response = await this.authService.instance.acquireTokenSilent({
                    account: this.account,
                    scopes: this.scopes,
                    claims: claim,
                });

                if (response.accessToken) {
                    resolve(response.accessToken);
                } else {
                    reject(Error('Failed to acquire an access token'));
                }
            } catch (error) {
                // in case if silent token acquisition fails, fallback to an interactive method
                if (error instanceof InteractionRequiredAuthError) {
                    switch (this.interactionType) {
                        case InteractionType.Popup:
                            response = await this.authService.instance.acquireTokenPopup({
                                scopes: this.scopes,
                                claims: claim,
                            });

                            if (response.accessToken) {
                                resolve(response.accessToken);
                            } else {
                                reject(Error('Failed to acquire an access token'));
                            }

                            break;

                        case InteractionType.Redirect:
                            /**
                             * This will cause the app to leave the current page and redirect to the consent screen.
                             * Once consent is provided, the app will return back to the current page and then the
                             * silent token acquisition will succeed.
                             */
                            this.authService.instance.acquireTokenRedirect({
                                scopes: this.scopes,
                                claims: claim,
                            });
                            break;

                        default:
                            break;
                    }
                }
            }
        });
    }
}