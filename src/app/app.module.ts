import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login.component';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { SubscriptionPromptComponent } from './auth/subscription-prompt.component';
import { authGuard } from './auth/auth.guard';
import { LionAppComponent } from "./published-lionscript/dash.component";
import { PublishLIONScriptModule } from "./published-lionscript/publish-lionscript.module";
import { NgxMonacoEditorConfig, MonacoEditorModule } from "ngx-monaco-editor-v2";

// import { IonWorksEditorComponent } from "./ionworks/ionworks-editor.component";
import { Injectable, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterModule, RouterStateSnapshot } from "@angular/router";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { ELNModule } from "./eln/eln.module";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatCardModule } from "@angular/material/card"
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SpeechService } from './speech.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DragDropModule } from '@angular/cdk/drag-drop';

import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
} from '@azure/msal-browser';
import { msalConfig, loginRequest, protectedResources } from './onedrive/auth-config';
import { getClaimsFromStorage } from './onedrive/storage-utils';
import { GraphService } from './onedrive/graph.service';
import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalRedirectComponent,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalService
} from '@azure/msal-angular'
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FileManagerModule } from './file-manager/file-manager.module';
import { FileService } from './file-manager/service/file.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WebcamModule } from 'ngx-webcam'
import { NgxFileDropModule } from 'ngx-file-drop';
import { DataImportModule } from './data-import/data-import.module';
import { OAuthSettings } from './onedrive/oath.settings';
import { MatNativeDateModule } from '@angular/material/core';
import { MicrosoftCallbackComponent } from './published-lionscript/microsoftcallback.component';
import { SignupRedirectComponent } from './published-lionscript/signup.component';

export const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

/**
 * Here we pass the configuration parameters to create an MSAL instance.
 * For more info, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md
 */
export function MSALInstanceFactory() {
  return new PublicClientApplication(msalConfig);
}


export function onMonacoLoad() {
  const monaco = (window as any).monaco;
}

// const monacoConfig: NgxMonacoEditorConfig = {
//   onMonacoLoad
// };


export const monacoConfig = {
  baseUrl: "assets", // configure base path for monaco editor
  defaultOptions: { scrollBeyondLastLine: false }, // pass deafult options to be used
  onMonacoLoad: () => {
    // Monaco loader puts it on window already in most setups,
    // but this makes it explicit:
    (window as any).monaco = (window as any).monaco;
    console.log('Monaco loaded:', !!(window as any).monaco);
  }
}







/**
 * Set your default interaction type for MSALGuard here. If you have any
 * additional scopes you want the user to consent upon login, add them here as well.
 */
export function MsalGuardConfigurationFactory() {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest
  };
}



/**
 * MSAL Angular will automatically retrieve tokens for resources
 * added to protectedResourceMap. For more info, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  // Empty on purpose: no resources are auto-protected by MSAL. See the disabled MsalInterceptor
  // note in providers — the app uses OIDC, and MSAL token acquisition here caused a redirect loop.
  const protectedResourceMap = new Map<string, Array<string>>();

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap,
    authRequest: (msalService, httpReq, originalAuthRequest) => {
      const resource = new URL(httpReq.url).hostname;
      // console.log ( " resource " + resource );
      let claim =
        msalService.instance.getActiveAccount()! &&
          getClaimsFromStorage(
            `cc.${msalConfig.auth.clientId}.${msalService.instance.getActiveAccount()?.idTokenClaims?.oid
            }.${resource}`
          )
          ? window.atob(
            getClaimsFromStorage(
              `cc.${msalConfig.auth.clientId}.${msalService.instance.getActiveAccount()?.idTokenClaims?.oid
              }.${resource}`
            )
          )
          : undefined; // claims challenge e.g {"access_token":{"xms_cc":{"values":["cp1"]}}}
      return {
        ...originalAuthRequest,
        claims: claim,
      };
    },
  };
}

export function hasParams(route: ActivatedRouteSnapshot, state: ActivatedRouteSnapshot): boolean {
  const queryParams = route.queryParams;
  if (Object.keys(queryParams).length > 0) {

    if (OAuthSettings.access_token && OAuthSettings.access_token.length > 0) {
      return true;
    }

    // this.router.navigate(['/component-with-query']);
    return false;
  }
  return true;
}


export function SubApp() {
  // constructor(private router: Router) { }
  // canActivate(): boolean {
  if (OAuthSettings.access_token && OAuthSettings.access_token.length > 0) {
    return true;
  }
  return false;
  // }
}
export const protectedResourceMap: [string, string[]][] = [
  ['https://graph.microsoft.com/v1.0/me', []]
];


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,
    BrowserAnimationsModule,
    MonacoEditorModule.forRoot(monacoConfig),
    FormsModule,
    MsalModule,
    MatDialogModule,
    ELNModule,
    DataImportModule,
    NgxFileDropModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    PublishLIONScriptModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatMenuModule,
    FileManagerModule,
    WebcamModule,
    MatNativeDateModule,
    DragDropModule,
    LoginComponent,
    AuthCallbackComponent,
    SubscriptionPromptComponent,
    RouterModule.forRoot(
      [
        { path: "login", component: LoginComponent },
        { path: "auth/callback", component: AuthCallbackComponent },
        { path: "subscribe", component: SubscriptionPromptComponent },
        { path: "auth/microsoft-callback", component: MicrosoftCallbackComponent },
        { path: "lft/:id", component: LionAppComponent, canActivate: [authGuard] },
        {
          path: "app/:id",
          component: LionAppComponent,
          canActivate: [authGuard],
        },
        {
          path: "books/:id",
          component: LionAppComponent,
          canActivate: [authGuard],
        },
        {
          path: "edit/:id",
          component: LionAppComponent,
          canActivate: [authGuard],
        },
        { path: "signup", component: SignupRedirectComponent },

        {
          path: "",
          canActivate: [authGuard],
          children: [{ path: "**", component: LionAppComponent }],
          component: LionAppComponent,
        },
        {
          path: "_app/:id",
          pathMatch: "prefix",
          canActivate: [authGuard],
          children: [{ path: "**", component: LionAppComponent }],
          component: LionAppComponent,
        },
        {
          path: "doc/:id",
          pathMatch: "prefix",
          canActivate: [authGuard],
          children: [{ path: "**", component: LionAppComponent }],
          component: LionAppComponent,
        }

      ],
      { useHash: false, enableTracing: true }
    ),
    BrowserAnimationsModule,
  ],
  providers: [
    SpeechService,
    // MsalInterceptor intentionally DISABLED. The app authenticates via OIDC (see authGuard /
    // OidcAuthService); the legacy MSAL "b2c" stack ran in parallel and its interceptor kept
    // firing silent (prompt=none) token acquisitions on protected-resource calls, escalating to
    // full-page redirects that re-booted the page mid-load on production and discarded the loaded
    // file. Removing the interceptor stops that storm. (Module kept for DI so MsalService /
    // MSAL_GUARD_CONFIG still resolve where injected.)
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: MsalInterceptor,
    //   multi: true,
    // },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MsalGuardConfigurationFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    MsalBroadcastService,
    MsalGuard,
    MatDialog,
    MatDatepickerModule,
    GraphService,
    FileService
  ],
  // MsalRedirectComponent intentionally NOT bootstrapped. It runs handleRedirectObservable() on
  // boot, which processes/continues MSAL redirect flows — the source of the production redirect
  // loop (MSAL b2c federates through Google and, with navigateToLoginRequestUrl, keeps bouncing
  // the page back, discarding in-progress loads). The app authenticates via OIDC; MSAL is left
  // inert. (Also remove <app-redirect> from index.html.)
  bootstrap: [AppComponent]
})



export class AppModule {

  constructor() {


    window.onpopstate = function (event) {
      if (event && event.state) {
        location.reload();
      }
    }

  }


  static getClassAPI(arg0: string): any {
    throw new Error("Method not implemented.");
  }
  static getAPI(arg0: string): any[] {
    throw new Error("Method not implemented.");
  }
}
