import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpServiceHelper } from './httpservicehelper';
import { Subscription } from 'rxjs';
import { MSDocService } from './ms-doc-service';

@Component({
  selector: 'onedrive',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // url = "https://graph.microsoft.com/v1.0/me";
  userData: any;
  private subscription: Subscription;
  authenticated = false;

  // tslint:disable-next-line:max-line-length
  constructor(public authService: AuthService,
    private http: HttpClient,
    private httpService: HttpServiceHelper,
    private msdoc: MSDocService) {

    msdoc.dev();
  }

  ngOnInit() {
    this.authService.login(null).then(user => {

    });
  }
  ngOnDestroy() {
  }



}