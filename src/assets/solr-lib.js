

// function rm(path, search) {
//   let {
//     'path': path,
//     'query': search
//   }
//   let url = 'http://arraybase:8981/v1/core/delete-docs';
//   let data = null;
//   var xhr = new XMLHttpRequest();
//   xhr.open('POST', url, false);
//   xhr.setRequestHeader("Content-type", "application/json");
//   //xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//   xhr.onload = function () {
//     var status = xhr.status;
//     if (status == 200) {
//       data = xhr.response;
//     } else {
//       return " failed to load " + status;
//     }
//   };
//   xhr.send(JSON.stringify(js));
// }



// let solr_server = new SolrServer('http://arraybase:18983/solr');
// solr_server.createSolrCore('simple_schema_test', schema).then(core => {
//     let query = {
//         'type': "sql",
//         'source': oracle,
//         'queryFunctions': qfun,
//         'increment': 100,
//         'start': 0,
//         'end': 100
//     }
//     core.load(query).then(status => {


//     };
// });

const demodb = 'http://arraybase:8981/v1/core/';

let SolrServer = class SolrServer {
  constructor(url) {
    this.url = url;
  }
  list(path, search) {
    let ob =  {
      'path': path,
      'query': search
    }
    let url = demodb + 'ls';
    let data = null;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        return " failed to load " + status;
      }
    };
    xhr.send(JSON.stringify(ob));
  }


  rm(path, search) {
    let ob =  {
      'path': path,
      'query': search
    }
    let url = demodb + 'delete-docs';
    let data = null;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        return " failed to load " + status;
      }
    };
    xhr.send(JSON.stringify(ob));
  }

  createCore(schema_object) {
    return new Promise((resolve, reject) => {
      let data = null;
      let ionis_ids_to_helmstring = "http://oligodb:8080/oligos";
      let url = ionis_ids_to_helmstring + '/' + isisnumber + '?fields=helm';
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.onload = function () {
        var status = xhr.status;
        if (status == 200) {
          data = xhr.response;
          let obj = JSON.parse(data);

          resolve(obj);
        } else {
          return " failed to load " + status;
        }
      };
      xhr.send();
      return data;
    });
  }
} 