(function (window) {
  window["env"] = window["env"] || {};
  window["env"]["apiUrl"] = "https://hts.bio/ionworks";
  window["env"]["sharepoint_host"] = "htsbiology.sharepoint.com";
  window["env"]["redirectURL"] = "https://raredb.org/";
  window["env"]["postRedirectURL"] = "https://raredb.org/";
  window["env"]["init"] = "/app/raredb/init";
  window['env']['clientId'] = '01d2b9d2-ecd0-480e-bd13-602f69c6a630'; // <-- localhost account
  window['env']['tenant-id'] = '4bb7bf75-3c2f-461a-9852-07a50ac02823'
  window["env"]["theme"] = "RareDB";
  window["env"]["apiUrl"] = "https://hts.bio/ionworks";
  window["env"]["appHost"] = "https://raredb.org"
  window['env']['fileHost'] = "hts.bio";
  window["env"]["menu"] = [
    {
      'label': 'Home', "path": 'screen/init.js'
    },
    {
      'label': 'Report bug', "path": 'ljl/report-bug.js'
    }
  ];
  window["env"]["init"] = "/app/screen/init.js";
  window["env"]["install"] = "ljl/dev/install-tools.js";
  window['env']['auth'] = 'raredb'

  window["env"]["theme"] = "RareDB";

  window["env"]["data"] = [
    {
      'label': 'RNASeq', "script": 'ljl/data/big-data.js',
      'data': '/rnaseq',
      'server': '/ionworks'
    },
    {
      'label': 'Splicing track', "script": 'ljl/screens/menu/splicing/test-loader.js',
      'data': 'splicing',
      'server': '/ionworks'
    },
    {
      'label': 'Constrained Elements', "script": 'ljl/data/conservation-data.js',
      'data': 'conservation',
      'server': '/ionworks'
    },
  ]

})(this);
