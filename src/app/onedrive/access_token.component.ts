import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Component({
  selector: 'access-token',
  templateUrl: './accesstoken-component.html',
  styleUrls: ['./login.component.scss']
})
export class AccessTokenComponent {
  constructor(private activatedRoute: ActivatedRoute,
    private router: Router, private auth:AuthService) {
    // Pulls token from url before the hacd ..sh fragment is removed
    console.log(" router : " + this.router.url.toString());

    this.activatedRoute.fragment
      .pipe(map(fragment => fragment))
      .subscribe(fragment => {
        console.log( " fragment " + fragment );
        // let f = fragment.match(/^(.*?)&/);
        // if(f) {
        // let token: string = f[1].replace('access_token=', '');
        // this.tokenService.setToken(token);
        // }
      });

  }
}