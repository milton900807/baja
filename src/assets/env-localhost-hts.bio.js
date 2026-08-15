(function (window) {

  window["env"] = window["env"] || {};
  window['env']['tenant-id'] = '229ff01a-9269-433b-af3b-78887fe40052';
  window['env']['clientId'] = '7097f922-ea1f-4397-8b7d-eb6a2cb4e752';
  window["env"]["sharepoint_host"] = "lajollalabs3.sharepoint.com";
  window["env"]["theme"] = "La Jolla Labs";
  window["env"]["appHost"] = "http://localhost:8080"
  // window['env']['fileHost'] = "eln.lajollalabs.com";
  window['env']['fileHost'] = "lajollalabs3.sharepoint.com";
  window["env"]["apiUrl"] = "http://localhost:8080";
  // use https when building add-ins for microsoft word applications
  window["env"]["menu"] = [
    {
      'label': 'Home', "path": 'manchester/init.js'
    }
  ];
  window["env"]["redirectURL"] = "https://localhost:4200";
  window["env"]["postRedirectURL"] = "https://localhost:4200";
  window["env"]["init"] = "/app/manchester/init.js";
  window["env"]["install"] = "ljl/dev/install-tools.js";
  window['env']['auth'] = 'b2c'


  window["env"]["data"] = [
    {   
      'label': 'RNASeq', "script": 'ljl/data/big-data.js',
      'data': '/rnaseq',
      'server': 'http://localhost:8080'
    },
    {
      'label': 'ClinVar', "script": 'ljl/screens/menu/data/clinvar.js',
      'data': '/mnt/ljl/bd/clinvar',
      'server': 'https://hts.bio/ionworks'
    },
    {
      'label': 'RNA binding', "script": 'ljl/data/big-data.js',
      'data': '/rna-binding',
      'server': 'https://app.hts.bio/ionworks'
    },
    {
      'label': 'Narrow peak', 
      'script': 'ljl/data/narrow-peak.js',
      'data' : '/narrowPeak',
      'server': 'http://localhost:8080'
    }
  ];

})(this);


