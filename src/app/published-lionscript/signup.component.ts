import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-signup-redirect",
  template: "Redirecting…",
})
export class SignupRedirectComponent implements OnInit {
  ngOnInit(): void {
    window.location.assign(
      "https://lajollalabs3.b2clogin.com/lajollalabs3.onmicrosoft.com/b2c_1_signup/oauth2/v2.0/authorize?client_id=7097f922-ea1f-4397-8b7d-eb6a2cb4e752&scope=openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Fhts.bio&client-request-id=019b7b10-60a7-7f94-91a1-6ee9e665220a&response_mode=fragment&response_type=code&x-client-SKU=msal.js.browser&x-client-VER=3.14.0&client_info=1&code_challenge=sOgvJTFDj9Hs27FHHnpQw5WLosPTQRV0LYFRxG271wE&code_challenge_method=S256&nonce=019b7b10-60a8-7bb6-9918-6525b7771f20&state=eyJpZCI6IjAxOWI3YjEwLTYwYTgtNzdlMS05ZDk2LTJjM2ZhOGE1MTAxZSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D&grant_type=authorization_code"
    );
  }
}
