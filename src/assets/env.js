(function (window) {

  window["env"] = window["env"] || {};
  // window['env']['tenant-id'] = 'b543ef7e-428b-4226-ad00-99b67b843915';
  // window['env']['clientId'] = 'c3e5ffbc-9b1c-44a5-93b6-7cb909b42481';


  window["env"]["tenant-id"] = "229ff01a-9269-433b-af3b-78887fe40052";
  window["env"]["clientId"] = "7097f922-ea1f-4397-8b7d-eb6a2cb4e752";

  window["env"]["sharepoint_host"] = "bajabio.sharepoint.com";
  window["env"] = window["env"] || {};
  window["env"]["theme"] = "Baja Bio";
  window["env"]["apiUrl"] = "http://localhost:8080";

  window["env"]["defaultTheme"] = "ocean";
  window["env"]["themes"] = [
    "socal", "dark", "light", "contrast", "slate", "ocean",
    "forest", "sunset", "turquoise", "mono", "midnight", "paper"
  ];
  // Optionally define brand themes entirely here (no CSS needed) via token maps:
  // window["env"]["customThemes"] = [
  //   { id: "brand", label: "Brand",
  //     tokens: { "--app-bg": "#101820", "--app-fg": "#f0f0f0", "--panel-bg": "#152230",
  //               "--panel-fg": "#f0f0f0", "--toolbar-bg": "#0b131c", "--toolbar-fg": "#f0f0f0",
  //               "--title-bar-bg": "#0b131c", "--title-bar-fg": "#f0f0f0",
  //               "--accent": "#00b3a4", "--border": "#2a3a4c",
  //               "--metal-top": "#33465f", "--metal-hi": "#2b3c53", "--metal-lo": "#223448",
  //               "--metal-bot": "#1a2a3c", "--metal-border": "#33465f", "--metal-text": "#e8eef6", "--metal-gloss": "0.14" } }
  // ];
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


