(function (window) {

  window["env"] = window["env"] || {};
  // la jolla labs host client id 
  // window['env']['clientId'] = '09ea7a2b1f2a4ac8bdc32c83c09a4c70'
  // below is a demo account id 
  // window['env']['clientId'] = "c68be95d9d1c46d784785aa5dff0f7c6", // <-- prod account
  // window['env']['key'] = "0e4cad81eb064e5c9c4c34436b9cd5d4", // <-- prod account

  // window['env']['pdf-key'] = '0e4cad81eb064e5c9c4c34436b9cd5d4',
  // window['env']['pdf-product'] = 'arctlajollalabs',

  // {{ LAJOLLALABS.COM (localhost)}}
  window['env']['tenant-id'] = 'b543ef7e-428b-4226-ad00-99b67b843915';
  window['env']['clientId'] = 'c3e5ffbc-9b1c-44a5-93b6-7cb909b42481';
  window["env"]["sharepoint_host"] = "lajollalabs.sharepoint.com";
  window["env"] = window["env"] || {};
  window["env"]["theme"] = "La Jolla Labs";
  window["env"]["apiUrl"] = "http://localhost:8080";
  // Off-target service base. Point at baja-server (same as apiUrl) so the
  // off-target UI uses the LOCAL 2-bit indexes it serves at /genomes and
  // /off-targets-file, with the external levenshtein worker as fallback.
  window["env"]["offtarget"] = "http://localhost:8080";
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



  // {{ hts.bio }}
  // window['env']['clientId'] = '8f3ef82f-d864-49e0-b845-c6d3b5c42ccf', // <-- localhost account


  // https://www.google.com/search?q=how+to+implement+oauth2+msgraph+&ei=5l5aZKKSHpOUwbkP7OW1qAE&ved=0ahUKEwiincKUv-j-AhUTSjABHexyDRUQ4dUDCBA&uact=5&oq=how+to+implement+oauth2+msgraph+&gs_lcp=Cgxnd3Mtd2l6LXNlcnAQAzIFCCEQoAEyBQghEKABMgUIIRCrAjIFCCEQqwI6CggAEEcQ1gQQsAM6BwgAEIoFEEM6BQgAEIAEOgYIABAWEB46CAgAEIoFEIYDSgQIQRgAUKcFWJYRYMQSaAFwAXgAgAHIAYgB3wuSAQUwLjguMZgBAKABAcgBCMABAQ&sclient=gws-wiz-serp#fpstate=ive&vld=cid:66aff020,vid:NljQx11YqNY


  // {{ ---------------------------------------------------------------------- }}
  // {{ ---------------------------------------------------------------------- }}
  // {{ ---------------------------------------------------------------------- }}
  //  {{ RAREDB }}
  // {{ ---------------------------------------------------------------------- }}
  // {{ ---------------------------------------------------------------------- }}
  // {{ ---------------------------------------------------------------------- }}
  // window['env']['tenant-id'] = '78f7a9a6-a48d-4490-9175-09a8e41516b2'
  // window["env"]["sharepoint_host"] = "htsbiology.sharepoint.com";
  // window['env']['clientId'] = '8f3ef82f-d864-49e0-b845-c6d3b5c42ccf', // <-- localhost account
  // window["env"]["theme"] = "RareDB";
  // window["env"]["apiUrl"] = "http://localhost:8080";
  // window["env"]["appHost"] = "http://localhost:4200"
  // window['env']['fileHost'] = "raredb.org";
  // window["env"]["menu"] = [
  //   {
  //     'label': 'Home', "path": 'raredb/init.js'
  //   },
  //   {
  //     'label': 'Report bug', "path": 'ljl/report-bug.js'
  //   }
  // ];

  // // use https when building add-ins for microsoft word applications
  // window["env"]["postRedirectURL"] = "https://localhost:4200";
  // window["env"]["init"] = "/app/raredb/init.js";
  // window["env"]["install"] = "ljl/dev/install-tools.js";




})(this);


