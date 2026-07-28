
import { Pipe, PipeTransform } from '@angular/core';
import { FunctionUtil } from '../functions/function-util';
@Pipe({
    name: 'solrfetch'
})
export class SolrFetch implements PipeTransform {

    constructor() {
    }

    transform(term: string, solr_url: string, solr_return_field: string, querystring_generator) {
        return new Promise((resolve, reject) => {
            let query = term;
            if (querystring_generator != null) {
                query = querystring_generator(query);
            }
            FunctionUtil.GETJSON(solr_url + '/select?q=' + query + '&fl=' + solr_return_field).then(res => {
                if (res == null || res['response'] == null) {
                    resolve(JSON.stringify(res));
                }
                let r = res['response']['docs'];
                if (r != null) {
                    let results = '';
                    for (let d of r) {
                        results += d[solr_return_field] + ';';
                    }
                    if (results != null && results.length > 0) {
                        results = results.substring(0, results.length - 1);
                        resolve(results);
                    } else {
                        resolve('Unknown term');
                    }

                } else {
                    resolve(' Term not found ');
                }
            });
        });
    }
}