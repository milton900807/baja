import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class SearchEngine {
    static cache = [];

    constructor(private router: Router) {
    }
    public show(url, data, display) {
        console.log ( " url " + url );
        SearchEngine.cache.push(url, data);
        if (!/^http[s]?:\/\//.test(url)) {
            url += 'http://';
        }
        let t = encodeURIComponent ( url );
        t += '&displayPage='+ display;
        // console.log ( ' t =================== ' + t );
        this.router.navigateByUrl('/results?rurl=' + t);
    }
    static get(key: string): {} {
        return SearchEngine.cache[key];
    }

}
