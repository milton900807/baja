(function (window) {

  window["env"] = window["env"] || {};
  window['env']['tenant-id'] = '229ff01a-9269-433b-af3b-78887fe40052';
  window['env']['clientId'] = '7097f922-ea1f-4397-8b7d-eb6a2cb4e752';
  window["env"]["sharepoint_host"] = "lajollalabs3.sharepoint.com";
  window["env"]["theme"] = "La Jolla Labs";
  window["env"]["appHost"] = "https://localhost:4200" // deprecated 
  // window['env']['fileHost'] = "eln.lajollalabs.com";
  window['env']['fileHost'] = "lajollalabs3.sharepoint.com";
  window["env"]["apiUrl"] = "http://localhost:8080";
  // use https when building add-ins for microsoft word applications
  window["env"]["menu"] = [
    {
      'label': 'Home', "path": 'manchester/init.js'
    }
  ];
  window["env"]["redirectURL"] = "https://localhost:4200/";
  window["env"]["postRedirectURL"] = "https://localhost:4200/";
  window["env"]["init"] = "/app/manchester/init.js";
  window["env"]["install"] = "ljl/dev/install-tools.js";
  window['env']['auth'] = 'b2c'
  window['env']['canSignUp'] = false;


  window["env"]["data"] = [
    {
      'label': 'RNASeq', "script": 'ljl/data/big-data.js',
      'data': '/rnaseq',
      'server': 'https://hts.bio/ionworks'
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
      'server': 'https://hts.bio/ionworks'
    }
  ];

})(this);


