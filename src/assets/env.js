(function (window) {

  window["env"] = window["env"] || {};
  // window['env']['tenant-id'] = 'b543ef7e-428b-4226-ad00-99b67b843915';
  // window['env']['clientId'] = 'c3e5ffbc-9b1c-44a5-93b6-7cb909b42481';


  window["env"]["tenant-id"] = "229ff01a-9269-433b-af3b-78887fe40052";
  window["env"]["clientId"] = "7097f922-ea1f-4397-8b7d-eb6a2cb4e752";

  window["env"]["sharepoint_host"] = "bajabio.sharepoint.com";
  window["env"] = window["env"] || {};
  window["env"]["theme"] = "MOA.Bio";
  window["env"]["apiUrl"] = "http://localhost:8080";
  window["env"]["appHost"] = "http://localhost:4200"
  window['env']['fileHost'] = "localhost:4200";
  window["env"]["menu"] = [
    {
      'label': 'Home', "path": 'baja/init.js'
    },
    {
      'label': 'Report bug', "path": 'baja/report-bug.js'
    }
  ];
  window["env"]["redirectURL"] = "https://localhost:4200";
  window["env"]["postRedirectURL"] = "https://localhost:4200";
  window["env"]["init"] = "/app/baja/init.js";
  window["env"]["install"] = "baja/dev/install-tools.js";
  window['env']['canSignUp'] = false;

  window['env']['auth'] = 'b2c'



  window["env"]["data"] = [
  ];



})(this);


