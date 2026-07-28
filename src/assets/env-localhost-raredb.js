(function(window) {
  window["env"] = window["env"] || {};
   // Environment variables
   window["env"]["apiUrl"] = "http://localhost:8080";
   window["env"]["fileHost"] = "hts.bio";
   window["env"]["sharepoint_host"] = "htsbiology.sharepoint.com";
   window["env"]["redirectURL"] = "https://localhost:4200";
   window["env"]["postRedirectURL"] = "https://localhost:4200";
   window["env"]["init"] = "/app/raredb/init";
   window['env']['clientId'] = '8f3ef82f-d864-49e0-b845-c6d3b5c42ccf'; // <-- localhost account
   window['env']['pdf-key']='0e4cad81eb064e5c9c4c34436b9cd5d4';
   window['env']['pdf-product'] = '';
   window['env']['tenant-id'] = '78f7a9a6-a48d-4490-9175-09a8e41516b2'

   window["env"]["theme"] = "RareDB";

   window["env"]["menu"] = [
   {
     'label': 'Home', "path": 'raredb/init.js'
   },
   {
     'label': 'Report bug', "path":'ljl/report-bug.js'
   }
   ]

 })(this);
