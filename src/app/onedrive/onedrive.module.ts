import { NgModule } from '@angular/core';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertsService } from './alerts.service';
import { AccessTokenComponent } from './access_token.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { MsalInterceptor } from '@azure/msal-angular';
import { HttpServiceHelper } from './httpservicehelper';
import { MSDocService } from './ms-doc-service';
import { UploadFileOneDrive } from './upload-file.service';
import { CookieService } from 'ngx-cookie-service'
import { LinkNavigationComponent } from './link-nav.component';
import { NaviDirective, FoldersDirective } from './navi.directive';
import { SimpleNodeComponent } from './simple-node.component';
import { LinkNodeComponent } from './link-node.component';

@NgModule({
    imports: [BrowserModule, HttpClientModule, FormsModule,
         ReactiveFormsModule],
    providers: [AuthService, AlertsService, CookieService,
        HttpServiceHelper,
        { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }, MSDocService, UploadFileOneDrive
    ],
    declarations: [LoginComponent, AccessTokenComponent,
        NaviDirective, LinkNavigationComponent, SimpleNodeComponent,
        FoldersDirective, LinkNodeComponent],
    exports: [LoginComponent, AccessTokenComponent, LinkNavigationComponent, NaviDirective, FoldersDirective,
        SimpleNodeComponent, LinkNodeComponent],
    // entryComponents: [LinkNavigationComponent, SimpleNodeComponent, LinkNodeComponent]
})
export class OneDriveModule {
}