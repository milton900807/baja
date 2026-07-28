(function (window) {

  window["env"] = window["env"] || {};
  // {{ LAJOLLALABS.COM (localhost)}}
  window['env']['tenant-id'] = 'b543ef7e-428b-4226-ad00-99b67b843915';
  window['env']['clientId'] = 'c3e5ffbc-9b1c-44a5-93b6-7cb909b42481';
  window["env"]["sharepoint_host"] = "lajollalabs.sharepoint.com";
  window["env"] = window["env"] || {};
  window["env"]["theme"] = "La Jolla Labs";
  window["env"]["apiUrl"] = "http://localhost:8080";
  window["env"]["appHost"] = "http://localhost:4200"
  window['env']['fileHost'] = "localhost:4200";
  window["env"]["menu"] = [
    {
      'label': 'Home', "path": 'ljl/init.js'
    },
    {
      'label': 'Report bug', "path": 'ljl/report-bug.js'
    }
  ];
  window["env"]["redirectURL"] = "https://localhost:4200";
  window["env"]["postRedirectURL"] = "https://localhost:4200";
  window["env"]["init"] = "/app/ljl/init.js";
  window["env"]["install"] = "ljl/dev/install-tools.js";


  window["env"]["data"] = [
    {
      'label': 'RNASeq', "script": 'ljl/data/big-data.js',
      'data': '/rnaseq',
      'server': '/ionworks'
    },
    {
      'label': 'Conservation', "script": 'ljl/data/big-data.js',
      'data': 'conservation',
      'server': '/ionworks'
    },{
      'label': 'RiboSeq', "script": 'ljl/screens/menu/data/riboseq.js',
      'data': '/riboseq',
      'server': 'https://hts.bio/ionworks'
    }
  ];

})(this);
