(function (window) {

  window["env"] = window["env"] || {};
  // {{ LAJOLLALABS.COM (localhost)}}
  window['env']['tenant-id'] = 'b543ef7e-428b-4226-ad00-99b67b843915';
  window['env']['clientId'] = 'c3e5ffbc-9b1c-44a5-93b6-7cb909b42481';
  window["env"]["sharepoint_host"] = "lajollalabs.sharepoint.com";
  window["env"] = window["env"] || {};
  window["env"]["theme"] = "La Jolla Labs";
  // window["env"]["db"] = 'localhost';
  window["env"]["apiUrl"] = "http://localhost:8080";
  window["env"]["appHost"] = "https://localhost:4200"
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
  window['env']['canSignUp'] = false;
  // window['env']['db'] = 'http://localhost:3000';




  window["env"]["data"] = [
    {
      'label': 'RNASeq', "script": 'ljl/data/big-data.js',
      'data': '/rnaseq',
      'server': 'https://data.lajollalabs.com/ionworks'
    },
    {
      'label': 'Splicing Models', "script": 'ljl/screens/menu/splicing/test-loader.js',
      'data': '/splicing',
      'server': 'http://locahost:8080/ionworks'
    },
    {
      'label': 'Constrained Elements', "script": 'ljl/data/conservation-data.js',
      'data': 'conservation',
      'server': 'https://hts.bio/ionworks'
    },
    {
      'label': 'ClinVar', "script": 'ljl/screens/menu/data/clinvar.js',
      'data': 'clinvar',
      'server': 'https://hts.bio/ionworks'
    },
    {
      'label': 'Splicing', "script": 'ljl/screens/menu/splice-acceptor-track.js',
      'data': 'splice',
      'server': 'https://hts.bio/ionworks'
    },
    {
      'label': 'RNA-binding proteins', 'script': 'ljl/screens/menu/rna-binding-menu.js',
      'data': '/rna-binding',
      'server': 'https://data.lajollalabs.com/ionworks'
    }
  ];

  window['env']['offtarget'] = "https://levenshtein.lajollalabs.com/levenshtein";


})(this);


