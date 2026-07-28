import {HttpBackend, HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable()
export class HttpServiceHelper {
  http:HttpClient;
  constructor(private httpb: HttpBackend) {
    this.http = new HttpClient ( httpb )
  }

  public httpGetRequest(url : string) {
    return this.http.get(url)
      .subscribe(response => {
        return response;
      })
  }

}