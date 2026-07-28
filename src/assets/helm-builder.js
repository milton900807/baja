// const XLSX = require("./xlsx.full.mnin.js");
// let JSZip = require ( 'jszip') 
// var zip = new JSZip();



// const host = 'http://localhost:8080'
// const host = 'https://137.117.20.219/ionworks'
const host = window["env"]["apiUrl"];

environment = {
  ionworks_publish_bucket: "ionworks",
  // ionworks_publish_bucket: 'ioniscript',
  s3_bucket_list:
    "https://1lcgo1si7e.execute-api.us-east-1.amazonaws.com/production/s3/bucket/ls",
  save_file_to_s3: host + "/files/s3putdata",
  s3get: host + "/files/s3getjson?bucket={bucket}&path={path}",
  get_helm_rule: host + "/get-script",
  load_script_for_category: host + "/get-package",
  save_script: host + "/save-script",
  delete_script: host + "/lionrest/delete",
  s3load_js: host + "/files/s3download",
  s3savejs: host + "/files/s3upload",
  commit_code: host + "/commit",
  stash_code: host + "/stash-file",
  revert_code: host + "/revert-file"
};

var StructureDB = (function (require) {
  function StructureDB() {
  }
  StructureDB.prototype.getHELM = function (isisno) {
    var _this = this;
    var environment_1 = require("../environments/environment");
    var req = {
      host: environment_1.environment.oligo_helm_host,
      port: environment_1.environment.oligo_helm_host_port,
      path: "/oligos/" + isisno,
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      json: true
    };
    var li = null;
    var a = {
      listen: function (_li) {
        li = _li;
      }
    };
    var http_1 = require("http");
    http_1.request(req, function (response) { return _this.oligoResponse(response, li); }).end();
    return a;
  };
  StructureDB.prototype.oligoResponse = function (res, li) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      if (data != null && data.length > 0) {
        try {
          var js = JSON.parse(data);
          if (js.length > 0) {
            var helm = js[0]['helm'];
            li.complete(helm);
          }
        }
        catch (e) {
          console.log(e);
        }
      }
    });
  };
  StructureDB.prototype.parse_chemistry = function (response) {
    var j = response.json();
    var helm = j[0]['helm'];
    return helm;
  };
  StructureDB.prototype.setHELM = function (helm) {
  };
  return StructureDB;
}());





var HELMMonomers = (function () {
  function HELMMonomers() {
  }
  HELMMonomers.loadMonomers = function () {
    // if (HELMMonomers.loading){
    var a = {
      listen: function (_li) {
        _li.complete(HELMMonomers.monomers);
      }
    };
    return a;
  };
  HELMMonomers.parse_monomer_json_data = function (res, dbl) {
    console.log(" res." + res.statusCode);
    var data = '';
    var index = 0;
    res.on('data', function (chunk) {
      data += chunk;
      console.log(" data " + data);
    });
    res.on('end', function () {
      if (data != null && data.length > 0) {
        try {
          var js = JSON.parse(data);
          HELMMonomers.setMonomers(js);
          dbl.complete(js);
        }
        catch (e) {
          console.log("Failed to load the helm-monomers:  error loading monomers --> " + e);
        }
      }
    });
  };
  HELMMonomers.setMonomers = function (m) {
    console.log(" " + m.length + " monomers were loaded..... ");
    this.monomers = m;
    this.status = "Monomers are loaded";
  };
  HELMMonomers.prototype.getMonomer = function (symbol, polymerType) {
    if (HELMMonomers.monomers == null || HELMMonomers.monomers.length <= 0) {
      // // for some reason we are stuck in a loop here.. 
      // this.getMonomers().subscribe ( monomers => HELMMonomers.setMonomers ( monomers ));
      return null;
    }
    //console.log ( " helm monomer : " + HELMMonomers.monomers.length );
    for (var _i = 0, _a = HELMMonomers.monomers; _i < _a.length; _i++) {
      var m = _a[_i];
      if (m.symbol.toUpperCase() === symbol.toUpperCase() && m.polymertype.toUpperCase() === polymerType.toUpperCase()) {
        return m;
      }
    }
    return null;
  };
  return HELMMonomers;
}());
HELMMonomers.status = "Loading";
HELMMonomers.loading = false;

var HELMStructure = (function () {
  function HELMStructure() {
    this.user = "";
    this.pass = "";
    this.helm = "";
  }
  return HELMStructure;
}());

var HELMRuleDB = (function (require) {
  function HELMRuleDB() {
  }
  HELMRuleDB.prototype.list = function (user) {
    var environment_1 = require("../environments/environment");
    var req = {
      host: environment_1.environment.helm_rules_host,
      port: environment_1.environment.helm_rules_port,
      path: environment_1.environment.helm_rules_path,
      method: 'POST',
      body: { "user_id": user },
      headers: { 'content-type': 'application/json' },
      json: true
    };
    var http_1 = require("http");
    http_1.request(req, this.list_name_response).end(JSON.stringify({ "user_id": user }));
  };
  HELMRuleDB.prototype.list_name_response = function (res) {
    var data = '';
    var index = 0;
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      if (data != null) {
        var js = JSON.parse(data);
        if (js.length > 0) {
          // let user = js[0]['user_id']
          // HELMRuleDB.cache.push ( {"user":js} );
          for (var j in js) {
            var rule = js[j];
            console.log(rule['rule_name']);
          }
        }
      }
    });
  };
  HELMRuleDB.prototype.load = function (rules_user, dblistener) {
    var environment_1 = require("../environments/environment");
    HELMRuleDB.dblistener = dblistener;
    var req = {
      host: environment_1.environment.helm_rules_host,
      port: environment_1.environment.helm_rules_port,
      path: environment_1.environment.helm_rules_path,
      method: 'POST',
      body: { "user_id": 'jmilton' },
      headers: { 'content-type': 'application/json' },
      json: true
    };
    var http_1 = require("http");
    http_1.request(req, this.response).end(JSON.stringify({ "user_id": rules_user }));
  };
  HELMRuleDB.prototype.loadRule = function (rules_user, rule_name) {
    var environment_1 = require("../environments/environment");
    var _this = this;
    var req = {
      host: environment_1.environment.helm_rules_host,
      port: environment_1.environment.helm_rules_port,
      path: environment_1.environment.helm_rules_path,
      method: 'POST',
      body: { "user_id": rules_user },
      headers: { 'content-type': 'application/json' },
      json: true
    };
    var li = null;
    var a = {
      listen: function (_li) {
        li = _li;
      }
    };
    var http_1 = require("http");
    http_1.request(req, function (response) { return _this.ruleResponse(response, rule_name, li); }).end(JSON.stringify({ "user_id": rules_user }));
    return a;
  };
  HELMRuleDB.prototype.ruleResponse = function (res, rule_name, dbl) {
    var data = '';
    var index = 0;
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      if (data != null && data.length > 0) {
        // console.log ( " data for the helm rule is " + data );
        try {
          var js = JSON.parse(data);
          if (js.length > 0) {
            var user = js[0]['user_id'];
            HELMRuleDB.cache[user] = js;
            var ruleobj = HELMRuleDB.getRuleFromCache(user, rule_name);
            dbl.complete(ruleobj);
          }
        }
        catch (e) {
          console.log(e);
          console.log(" failed to load the rule " + rule_name);
        }
      }
    });
  };
  HELMRuleDB.getRuleFromCache = function (user, user_rule_name) {
    var i = {};
    // return i;
    var userCache = HELMRuleDB.cache[user];
    if (userCache != null) {
      var keys = Object.keys(userCache);
      for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        var item = userCache[key];
        var rule_name = item['rule_name'];
        var rule_value = item['rule_value'];
        // console.log ( " rule name " + rule_name + " vs in name " + user_rule_name );
        if (rule_name != null && rule_name === user_rule_name) {
          return item['rule_value'];
        }
      }
      console.log("\t Failed to find the rule with name :" + user_rule_name + " in the user " + user + " rule database ");
    }
    //         console.log ( " key " + usercache );
    // }
  };
  HELMRuleDB.prototype.response = function (res) {
    // res.setEncoding("utf8");
    var data = '';
    var index = 0;
    res.on('data', function (chunk) {
      // console.log('BODY: ' + chunk);
      // console.log('BODY: ' + index++);
      // let js = JSON.parse(chunk.toString());
      // console.log ( ' json length ' + js.length );
      data += chunk;
    });
    res.on('end', function () {
      if (data != null) {
        var js = JSON.parse(data);
        if (js.length > 0) {
          var user = js[0]['user_id'];
          HELMRuleDB.cache[user] = js;
          if (HELMRuleDB.dblistener != null) {
            HELMRuleDB.dblistener.userLoaded(js);
          }
        }
      }
      // console.log ( ' js ' + js[0]['user_id'] );
      // console.log('BODY: ' + data);
    });
    // console.log ( " res " + res.read())
  };
  return HELMRuleDB;
}());
HELMRuleDB.cache = {};





var HELMBuilder = (function () {
  function HELMBuilder(parser, db) {
    this.parser = parser;
    this.db = db;
    this.helm = null;
    this.errors = "";
  }
  HELMBuilder.prototype.setHELM = function (helm) {
    this.helm = helm;
  };
  HELMBuilder.prototype.applyChemistry = function (inputvalue, listener) {
    var _this = this;
    //    let c= {
    //             complete ( obj:any ): void {
    //             this.applyChemistryFromHELM (obj, listener )
    //         }
    //    }        
    this.db.getHELM(+inputvalue).listen({
      complete: function (obj) {
        var nhelm = _this.applyChemistryFromHELM(obj);
        listener.update_helm(nhelm);
      }
    });
  };
  HELMBuilder.prototype.applyChemistryFromHELM = function (template) {
    console.log(" apply chemistry for chain template : " + template);
    var chain_ids = this.parser.parse_chain_identifiers(template);
    var template_monomers;
    // loop to extract the template monomers 
    for (var _i = 0, chain_ids_1 = chain_ids; _i < chain_ids_1.length; _i++) {
      var ch = chain_ids_1[_i];
      if (ch === "RNA1") {
        var ch_chain = this.parser.parseChain(ch, template);
        var chain_template = this.parser.parse_chain_polymer(ch_chain);
        template_monomers = this.parser.pull_monomer_sequence_from_chain("RNA", chain_template);
      }
    }
    var helm_chain = this.parser.parseChain('RNA1', this.helm);
    var helm_chain_t = this.parser.parse_chain_polymer(helm_chain);
    var helm_monomers = this.parser.pull_monomer_sequence_from_chain("RNA", helm_chain_t);
    console.log(" ----  : " + helm_chain_t);
    var nhelm_rna = [];
    for (var i = 0; i < helm_monomers.length; i++) {
      if (i >= template_monomers.length) {
      }
      else {
        nhelm_rna[i] = template_monomers[i];
      }
    }
    var result_chain = "";
    var index = 0;
    for (var _a = 0, nhelm_rna_1 = nhelm_rna; _a < nhelm_rna_1.length; _a++) {
      var helm_monomer = nhelm_rna_1[_a];
      if (this.parser.isBranchMonomer(helm_monomer)) {
        var original_base = helm_monomers[index];
        if (original_base.length > 1) {
          original_base = "[" + original_base + "]";
        }
        // remove this first
        if (result_chain.endsWith(".")) {
          result_chain = result_chain.substring(0, result_chain.length - 1);
        }
        result_chain += "(" + original_base + ")";
      }
      else {
        if (helm_monomer.length > 1) {
          helm_monomer = "[" + helm_monomer + "]";
        }
        result_chain += helm_monomer + ".";
      }
      index++;
    }
    if (result_chain.endsWith(".")) {
      result_chain = result_chain.substring(0, result_chain.length - 1);
    }
    result_chain = "RNA1{" + result_chain + "}";
    this.replaceChain(result_chain);
    // listener.update_helm(this.helm);
    return this.helm;
  };
  HELMBuilder.prototype.incrementConnections = function (chain_id, helm) {
    var connections_for_chain_id = this.parser.parseConnections(helm);
    if (connections_for_chain_id == null || connections_for_chain_id.length <= 0) {
      return helm;
    }
    for (var _i = 0, connections_for_chain_id_1 = connections_for_chain_id; _i < connections_for_chain_id_1.length; _i++) {
      var connection = connections_for_chain_id_1[_i];
      //     CHEM1,RNA1,1:R1-12:R2|CHEM2,RNA1,1:R1-1:R1$$$
      if (connection != null && connection.length > 0) {
        var connection_parts = connection.split(',');
        var monomer_connection_part = connection_parts[2]; //monomer_connection_part = "1:R1-15:R2"
        var primary_chain_id_index = 0;
        // find the index of the rna 
        if (connection_parts[0] == chain_id) {
          primary_chain_id_index = 0;
        }
        else {
          primary_chain_id_index = 1;
        }
        // primary_chain_id_index = 1
        var monomer_connection_partsp = monomer_connection_part.split('-');
        //  ["1:R1", "15:R2"], monomer_connection_part = "1:R1-15:R2"
        var primary_chain_id_connection_part = monomer_connection_partsp[primary_chain_id_index];
        // now all we have to do is find the monomer index value
        var primary_chain_id_connection_part_sp = primary_chain_id_connection_part.split(":");
        // [15,R2]
        var primary_chain_monomer_connection_number = +primary_chain_id_connection_part_sp[0];
        primary_chain_monomer_connection_number = primary_chain_monomer_connection_number + 1;
        var new_primary_chain_monomer_connection = primary_chain_monomer_connection_number + ":" + primary_chain_id_connection_part_sp[1];
        // "CHEM1,RNA1,15:R2"  --> this needs to be ordered correctly                  
        var new_connection = null;
        if (primary_chain_id_index == 1) {
          new_connection = connection_parts[0] + "," + connection_parts[1] + "," + monomer_connection_partsp[0] + "-" + new_primary_chain_monomer_connection;
        }
        else {
          new_connection = connection_parts[0] + "," + connection_parts[1] + "," + new_primary_chain_monomer_connection + "-" + monomer_connection_partsp[1];
        }
        // console.log ( ' new connection ' + new_connection );
        helm = this.replaceConnection(connection, new_connection, helm);
      }
    }
    return helm;
  };
  HELMBuilder.prototype.replaceConnection = function (original, newconnection, helm) {
    var connections = this.parser.parseConnections(helm);
    var chains = this.parser.parseChains(helm);
    var groups = this.parser.parseGroups(helm);
    var annotations = this.parser.parseAnnotations(helm);
    var newconnections = [];
    for (var _i = 0, connections_1 = connections; _i < connections_1.length; _i++) {
      var connection = connections_1[_i];
      if (connection == original) {
        newconnections.push(newconnection);
      }
      else {
        newconnections.push(connection);
      }
    }
    return this.concat(chains) + "$" + this.concat(newconnections) + "$" + this.concat(groups) + "$" + this.concat(annotations);
  };


  HELMBuilder.prototype.addFivePrime = function (chem_chain, linker) {
    console.log(' linker ' + linker);
    var chains = this.parser.parseChains(this.helm);
    if (chains == null) {
      this.errors = "No chain found in the current helm object";
      return;
    }
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var chain_type = this.parser.parse_chain_type(chem_chain);
    var chain_contents = this.parser.parse_chain_polymer(chem_chain);
    var index = 0;
    for (var _i = 0, chains_1 = chains; _i < chains_1.length; _i++) {
      var chain = chains_1[_i];
      var ctype = this.parser.parse_chain_type(chain);
      if (ctype === chain_type) {
        var temp = this.parser.parse_chain_type_index(chain);
        if (temp > index) {
          index = temp;
        }
      }
    }
    // {{ CHECK TO SEE IF THERE IS AN EXTRA PHOSPHATE ON THE END OF THE FIVE PRIME }}
    var rna_chain_contents = this.parser.parse_chain_polymer(chains[0]);
    var rna_chain_ident = this.parser.parse_chain_identifier(chains[0]);


    if (linker == null || linker.length <= 0) {

      linker = 'p';
    }

    if (!rna_chain_contents.startsWith(linker + ".")) {
      chains[0] = rna_chain_ident + "{" + linker + "." + rna_chain_contents + "}";
      // adding a phophate linker here means we have to increment any chain connection strings 
      this.helm = this.incrementConnections(rna_chain_ident, this.helm);
      // refresh the local variables
      helm_connections = this.parser.parseConnections(this.helm);
      helm_groups = this.parser.parseGroups(this.helm);
      helm_annotations = this.parser.parseAnnotations(this.helm);
    }
    var new_chain = chain_type + (index + 1) + "{" + chain_contents + "}";
    chains.push(new_chain);
    // RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$CHEM1,RNA1,1:R1-1:R1$$$V2.0
    //RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$
    //CHEM1,RNA1,1:R1-1:R1$$$V2.0
    var connection_chain = this.parser.parse_chain_identifier(chains[0]);
    var new_connection = chain_type + (index + 1) + ',' + connection_chain + ',' + '1:R1-1:R1';
    helm_connections.push(new_connection);
    var helm_chains = this.build_chain_string(chains);
    this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  /**
   *  This will only add to RNA1
   */
  HELMBuilder.prototype.addThreePrime = function (chem_chain, connection) {
    var chains = this.parser.parseChains(this.helm);
    if (chains == null) {
      this.errors = ' No chain found in the current helm object ';
      return;
    }
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var chain_type = this.parser.parse_chain_type(chem_chain);
    var chem_chain_contents = this.parser.parse_chain_polymer(chem_chain);
    var index = 0;
    for (var _i = 0, chains_2 = chains; _i < chains_2.length; _i++) {
      var chain = chains_2[_i];
      var ctype = this.parser.parse_chain_type(chain);
      if (ctype === chain_type) {
        var temp = this.parser.parse_chain_type_index(chain);
        if (temp > index) {
          index = temp;
        }
      }
    }
    // {{ CHECK TO SEE IF THERE IS AN EXTRA PHOSPHATE ON THE END OF THE FIVE PRIME }}
    var rna_chain_contents = this.parser.parse_chain_polymer(chains[0]);
    var rna_chain_ident = this.parser.parse_chain_identifier(chains[0]);
    var mons = this.parser.parse_monomers_from_nucleic_acid(chains[0]);
    if (mons[mons.length - 1] != 'p' && mons[mons.length - 1] != 'sp') {
      chains[0] = rna_chain_ident + "{" + rna_chain_contents + "p}";
    }
    // if ( !rna_chain_contents.endsWith ( ")p") && (!rna_chain_contents.endsWith (")[sp]")) ){
    //     console.log ( " adjusting rna_chain_contents ");
    //     chains[0] = rna_chain_ident + "{" + rna_chain_contents + "p}";
    // }
    var new_chain = chain_type + (index + 1) + "{" + chem_chain_contents + "}";
    chains.push(new_chain);
    // RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$CHEM1,RNA1,1:R1-1:R1$$$V2.0
    //RNA1{p.[moe](A)[sp].[moe](G)[sp].[moe](G)[sp].[moe](A)[sp].[moe]([m5C])[sp].d(A)[sp].d(T)[sp].d(G)[sp].d([m5C])[sp].d(T)[sp].d(G)[sp].d(A)[sp].d(A)[sp].d([m5C])[sp].d([m5C])[sp].[moe](T)[sp].[moe](G)[sp].[moe](G)[sp].[moe]([m5C])[sp].[moe]([m5C])}|CHEM1{[THAGN3]}$
    //CHEM1,RNA1,1:R1-1:R1$$$V2.0
    var connection_chain = this.parser.parse_chain_identifier(chains[0]);
    var monomers = this.parser.parse_monomers_from_nucleic_acid(chains[0]);
    var new_connection = chain_type + (index + 1) + ',' + connection_chain + ',' + '1:R1-' + monomers.length + ':R2';
    helm_connections.push(new_connection);
    var helm_chains = this.build_chain_string(chains);
    this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  HELMBuilder.prototype.findAndReplaceBase = function (search_monnomer, replace_monomer) {
    var chains = this.parser.parseChains(this.helm);
    var nchains = [];
    var re = new RegExp("\\(" + search_monnomer + "\\)", "gi");
    for (var _i = 0, chains_3 = chains; _i < chains_3.length; _i++) {
      var chain = chains_3[_i];
      chain = chain.replace(re, "(" + replace_monomer + ")");
      nchains.push(chain);
    }
    this.replace_chains(nchains);
  };
  HELMBuilder.prototype.getChains = function () {
    return this.parser.parse_chain_identifiers(this.helm);
  };
  HELMBuilder.prototype.findAndReplaceBaseForSugarType = function (search_monnomer, replace_monomer, sugar_monomer) {
    var chains = this.parser.parseChains(this.helm);
    if (search_monnomer != null && search_monnomer.startsWith("[")) {
      search_monnomer = search_monnomer.replace("[", "\\[");
    }
    var non_regx_sugar = sugar_monomer;
    if (non_regx_sugar.startsWith("\\")) {
      non_regx_sugar = non_regx_sugar.replace('\\', '');
      non_regx_sugar = non_regx_sugar.trim();
    }
    if (sugar_monomer != null && sugar_monomer.startsWith("[")) {
      sugar_monomer = sugar_monomer.replace("[", "\\[");
    }
    var nchains = [];
    //  if ( sugar_monomer.length > 1 ){
    // sugar_monomer = '\\[' + sugar_monomer + '\\]';
    // }
    console.log(" sugar monomer " + sugar_monomer);
    // console.log ( " search monomer " +  sugar_monomer );

    if (non_regx_sugar.lenght > 1) {
      if (!non_regx_sugar.startWith("[")) {
        non_regx_sugar = '[' + non_regx_sugar + ']';
      }
    }


    var re = new RegExp(sugar_monomer + "\\(" + search_monnomer + "\\)", "gi");
    for (var _i = 0, chains_4 = chains; _i < chains_4.length; _i++) {
      var chain = chains_4[_i];
      chain = chain.replace(re, non_regx_sugar + "(" + replace_monomer + ")");
      nchains.push(chain);
    }
    this.replace_chains(nchains);
  };
  HELMBuilder.prototype.applyTemplate = function (template_name) {
    var chains = this.parser.parseChains(this.helm);
    var nchains = [];
    for (var _i = 0, chains_5 = chains; _i < chains_5.length; _i++) {
      var chain = chains_5[_i];
      if (template_name === "5-10-5 MOE") {
        if (chain.toUpperCase().startsWith("RNA")) {
          var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
          if (sugars.length != 20) {
            this.errors = " This is not a 20mer so we cannot apply the 5-10-5 template";
            return;
          }
          for (var h = 0; h < 5; h++) {
            sugars[h] = '[MOE]';
          }
          for (var i = 5; i < 15; i++) {
            sugars[i] = 'd';
          }
          for (var j = 15; j < 20; j++) {
            sugars[j] = '[MOE]';
          }
          chain = this.replace_sugars(chain, sugars);
          nchains.push(chain);
        }
        else {
          nchains.push(chain);
        }
      }
      else if (template_name.toLowerCase() === "3-10-3 cet") {
        if (chain.toUpperCase().startsWith("RNA")) {
          var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
          if (sugars.length != 16) {
            this.errors = "This is not a 16mer so we cannot apply the 3-10-3 template";
            return;
          }
          for (var h = 0; h < 3; h++) {
            sugars[h] = '[cet]';
          }
          for (var i = 3; i < 13; i++) {
            sugars[i] = 'd';
          }
          for (var j = 13; j < 16; j++) {
            sugars[j] = '[cet]';
          }
          chain = this.replace_sugars(chain, sugars);
          nchains.push(chain);
        }
        else {
          nchains.push(chain);
        }
      }
      else {
        if (chain.toUpperCase().startsWith("RNA")) {
          var sugars = this.parser.pull_sugar_sequence_from_chain(chain);
          var template_sugar_mononers = template_name.split('');
          var h_1 = 0;
          for (var _a = 0, template_sugar_mononers_1 = template_sugar_mononers; _a < template_sugar_mononers_1.length; _a++) {
            var template_monomer = template_sugar_mononers_1[_a];
            sugars[h_1] = this.getMonomerForSimpleLeChemMonomer(template_monomer);
            h_1++;
          }
          chain = this.replace_sugars(chain, sugars);
          nchains.push(chain);
        }
        else {
          nchains.push(chain);
        }
        this.errors = " Template type : " + template_name + " was not found. ";
      }
    }
    this.replace_chains(nchains);
  };
  HELMBuilder.prototype.getMonomerForSimpleLeChemMonomer = function (letter) {
    if (letter.toLocaleUpperCase() === 'K') {
      return "[cet]";
    }
    else if (letter.toUpperCase() === 'D') {
      return 'd';
    }
    else if (letter.toUpperCase() === 'E') {
      return "[moe]";
    }
    else if (letter.toUpperCase() === 'G') {
      return "[fhna]";
    }
    else if (letter.toUpperCase() === 'H') {
      return "[hna]";
    }
    else if (letter.toUpperCase() === 'M') {
      return "m";
    }
    else if (letter.toUpperCase() === 'L') {
      return "[lna]";
    }
    return letter;
  };
  HELMBuilder.prototype.apply_sugar_to_nucleotide = function (nuc, sugar) {
    var start_index = nuc.indexOf("(");
    var no_sugar_nuc = nuc.substring(start_index);
    return sugar.trim() + no_sugar_nuc.trim();
  };
  HELMBuilder.prototype.setSugar = function (rna, sugar) {
    if (sugar.length > 1) {
      if (!sugar.startsWith('[')) {
        sugar = '[' + sugar + ']';
      }
    }
    var nucleotides = this.parser.parse_nucleotides(rna);
    var new_set = [];
    for (var _i = 0, nucleotides_1 = nucleotides; _i < nucleotides_1.length; _i++) {
      var n = nucleotides_1[_i];
      var monomers = this.parser.parser_monomers_from_nucleotide(n);
      for (var i = 0; i < monomers.length; i++) {
        monomers[0] = sugar;
      }
      var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
      new_set.push(new_nucleotide);
    }
    var chain_id = this.parser.parse_chain_identifier(rna);
    var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.replaceAllSugars = function (newsugar) {
    var chains = this.parser.parseChains(this.helm);
    var nchain = [];
    for (var _i = 0, chains_6 = chains; _i < chains_6.length; _i++) {
      var chain = chains_6[_i];
      var chain_type = this.parser.parse_chain_type(chain);
      if (chain_type === "RNA") {
        nchain.push(this.setSugar(chain, newsugar));
      }
      else {
        nchain.push(chain);
      }
    }
    this.replace_chains(nchain);
  };
  HELMBuilder.prototype.replace_sugars = function (chain, sugar_list) {
    var nucleotides = this.parser.parse_nucleotides(chain);
    var chain_id = this.parser.parse_chain_identifier(chain);
    for (var i = 0; i < nucleotides.length; i++) {
      // let sugar = this.parser.parser_sugar_from_nucleotide ( nucleotides [ i ]);
      nucleotides[i] = this.apply_sugar_to_nucleotide(nucleotides[i], sugar_list[i]);
    }
    var cnucs = this.connect_nucleotides(nucleotides);
    return chain_id + "{" + cnucs + "}";
  };
  HELMBuilder.prototype.find_and_replace_nucleotide_monomers = function (chain, queryMonomer, replaceMonomer) {
    var nucleotides = this.parser.parse_nucleotides(chain);
    var new_set = [];
    for (var _i = 0, nucleotides_2 = nucleotides; _i < nucleotides_2.length; _i++) {
      var n = nucleotides_2[_i];
      var monomers = this.parser.parser_monomers_from_nucleotide(n);
      for (var i = 0; i < monomers.length; i++) {
        if (monomers[i] === queryMonomer) {
          monomers[i] = replaceMonomer;
        }
      }
      var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
      new_set.push(new_nucleotide);
    }
    var chain_id = this.parser.parse_chain_identifier(chain);
    var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.build_nucleotide_from_monomers = function (list) {
    if (list.length == 3) {
      return list[0].trim() + "(" + list[1].trim() + ")" + list[2].trim();
    }
    else if (list.length == 2) {
      return list[0].trim() + "(" + list[1].trim() + ")";
    }
    else {
      return list[0].trim();
    }
  };
  HELMBuilder.prototype.reverseComplement = function () {
    var chains = this.parser.parseChains(this.helm);
    var nchains = [];
    for (var _i = 0, chains_7 = chains; _i < chains_7.length; _i++) {
      var chain = chains_7[_i];
      var nucleotides = this.parser.parse_nucleotides(chain);
      var new_set = [];
      var sequence = this.parser.pull_base_sequence(chain);
      var revCompSequence = [];
      var j = 0;
      for (var i = sequence.length - 1; i >= 0; i--) {
        // console.log ( i + '>' + sequence[i]  + '<');
        if (sequence[i] == 'A') {
          revCompSequence.push('U');
        }
        else if (sequence[i] == '[m5C]') {
          revCompSequence.push('G');
        }
        else if (sequence[i] == 'C') {
          revCompSequence.push('G');
        }
        else if (sequence[i] == 'G') {
          revCompSequence.push('C');
        }
        else if (sequence[i] == 'T') {
          revCompSequence.push('A');
        }
        else if (sequence[i] == 'U') {
          revCompSequence.push('A');
        }
        else {
          revCompSequence[j] = '?';
        }
        j++;
      }
      j = 0;
      for (var _a = 0, nucleotides_3 = nucleotides; _a < nucleotides_3.length; _a++) {
        var n = nucleotides_3[_a];
        var monomers = this.parser.parser_monomers_from_nucleotide(n);
        if (monomers.length >= 2) {
          monomers[1] = revCompSequence[j++];
        }
        else {
          // console.log ( " monomer was not converted : "+ monomers[0] );
        }
        var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
        new_set.push(new_nucleotide);
      }
      var chain_id = this.parser.parse_chain_identifier(chain);
      var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
      nchains.push(new_chain);
    }
    this.replace_chains(nchains);
  };
  HELMBuilder.prototype.uniform = function (type, monomer) {
    var chains = this.parser.parseChains(this.helm);
    var nchain = [];
    if ('sugar' == type.toLocaleLowerCase()) {
      for (var _i = 0, chains_8 = chains; _i < chains_8.length; _i++) {
        var chain = chains_8[_i];
        var chain_type = this.parser.parse_chain_type(chain);
        if (chain_type === "RNA") {
          nchain.push(this.uniformSugarInChain(chain, monomer));
        }
        else {
          nchain.push(chain);
        }
      }
    }
    else if ('linker' == type.toLocaleLowerCase()) {
      for (var _a = 0, chains_9 = chains; _a < chains_9.length; _a++) {
        var chain = chains_9[_a];
        var chain_type = this.parser.parse_chain_type(chain);
        if (chain_type === "RNA") {
          nchain.push(this.uniformLinkerInChain(chain, monomer));
        }
        else {
          nchain.push(chain);
        }
      }
    }
    else if ('base' == type.toLocaleLowerCase()) {
      for (var _b = 0, chains_10 = chains; _b < chains_10.length; _b++) {
        var chain = chains_10[_b];
        var chain_type = this.parser.parse_chain_type(chain);
        if (chain_type === "RNA") {
          nchain.push(this.uniformBaseInChain(chain, monomer));
        }
        else {
          nchain.push(chain);
        }
      }
    }
    this.replace_chains(nchain);
  };
  HELMBuilder.prototype.uniformSugarInChain = function (chain, monomer) {
    var mon = chain.split(/\./gi);
    var nmon = [];
    for (var _i = 0, mon_1 = mon; _i < mon_1.length; _i++) {
      var m = mon_1[_i];
      // console.log ( " monomer " + m );
      m = this.replaceSugarInNucleotide(m, monomer);
      // console.log ( "replaced  " + m );
      nmon.push(m);
    }
    var chain_id = this.parser.parse_chain_identifier(chain);
    var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.uniformLinkerInChain = function (chain, monomer) {
    var mon = chain.split(/\./gi);
    var nmon = [];
    for (var _i = 0, mon_2 = mon; _i < mon_2.length; _i++) {
      var m = mon_2[_i];
      m = this.replaceLinkerInNucleotide(m, monomer);
      nmon.push(m);
    }
    var chain_id = this.parser.parse_chain_identifier(chain);
    var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.uniformBaseInChain = function (chain, monomer) {
    var mon = chain.split(/\./gi);
    var nmon = [];
    for (var _i = 0, mon_3 = mon; _i < mon_3.length; _i++) {
      var m = mon_3[_i];
      m = this.replaceBaseInNucleotide(m, monomer);
      nmon.push(m);
    }
    var chain_id = this.parser.parse_chain_identifier(chain);
    var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.replaceSugarInNucleotide = function (nuc, monomer) {
    var i = nuc.indexOf('\(');
    if (i > 0) {
      var tem = nuc.substring(i);
      return (monomer + tem);
    }
    return nuc;
  };
  HELMBuilder.prototype.replaceBaseInNucleotide = function (nuc, monomer) {
    var j = nuc.indexOf('\(');
    var i = nuc.indexOf('\)');
    if (i > 0 && j >= 0) {
      var sugar = nuc.substring(0, j);
      var linker = nuc.substring(i + 1);
      return (sugar + "(" + monomer + ")" + linker);
    }
    return nuc;
  };
  HELMBuilder.prototype.replaceLinkerInNucleotide = function (nuc, monomer) {
    var i = nuc.indexOf('\)');
    if (i > 0) {
      var tem = nuc.substring(0, i + 1);
      return (tem + monomer);
    }
    return nuc;
  };
  //reverseComplament
  HELMBuilder.prototype.findAndReplace = function (queryMonomer, replaceMonomer) {
    var chains = this.parser.parseChains(this.helm);
    var nchain = [];
    for (var _i = 0, chains_11 = chains; _i < chains_11.length; _i++) {
      var chain = chains_11[_i];
      var chain_type = this.parser.parse_chain_type(chain);
      if (chain_type === "RNA") {
        nchain.push(this.find_and_replace_nucleotide_monomers(chain, queryMonomer, replaceMonomer));
      }
      else if (chain_type === "CHEM" || chain_type == "PEPTIDE") {
        nchain.push(this.find_and_replace_monomers(chain, queryMonomer, replaceMonomer));
      }
      else {
        nchain.push(chain);
      }
    }
    this.replace_chains(nchain);
  };
  HELMBuilder.prototype.find_and_replace_monomers = function (chain, queryMonomer, replaceMonomer) {
    var chain_id = this.parser.parse_chain_identifier(chain);
    let sti = chain.indexOf('{');
    let endi = chain.indexOf('}');
    let chain_monomers = chain.substring(sti, endi);
    var mon = chain_monomers.split(/\./gi);
    var nmon = [];
    for (var _i = 0, mon_4 = mon; _i < mon_4.length; _i++) {
      var m = mon_4[_i];
      if (m === queryMonomer) {
        m = replaceMonomer;
      }
      nmon.push(m);
    }
    var new_chain = chain_id + "{" + this.connect_monomers(nmon) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.replace_chains = function (chains) {
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var helm_chains = this.build_chain_string(chains);
    this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  HELMBuilder.prototype.addChain = function (chain) {
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var chain_type = this.parser.parse_chain_type(chain);
    var chain_contents = this.parser.parse_chain_polymer(chain);
    var index = 0;
    var chains = this.parser.parseChains(this.helm);
    for (var _i = 0, chains_12 = chains; _i < chains_12.length; _i++) {
      var chain_1 = chains_12[_i];
      var ctype = this.parser.parse_chain_type(chain_1);
      if (ctype === chain_type) {
        var temp = this.parser.parse_chain_type_index(chain_1);
        if (temp > index) {
          index = temp;
        }
      }
    }
    var new_chain = chain_type + (index + 1) + "{" + chain_contents + "}";
    chains.push(new_chain);
    var helm_chains = this.build_chain_string(chains);
    this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  HELMBuilder.prototype.removeChain = function (chain_id) {
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var index = 0;
    var chains = this.parser.parseChains(this.helm);
    var nchains = [];
    for (var _i = 0, chains_13 = chains; _i < chains_13.length; _i++) {
      var chain = chains_13[_i];
      var cid = this.parser.parse_chain_identifier(chain);
      if (cid.toUpperCase() != chain_id.toUpperCase()) {
        nchains.push(chain);
      }
      else {
        // console.log ( ' foun dit in the chains ' );
      }
    }
    var nhelm_connections = [];
    for (var _a = 0, helm_connections_1 = helm_connections; _a < helm_connections_1.length; _a++) {
      var chain_connection = helm_connections_1[_a];
      if (chain_connection != null && chain_connection.length > 0) {
        var connection_parts = chain_connection.split(',');
        var check = false;
        for (var _b = 0, connection_parts_1 = connection_parts; _b < connection_parts_1.length; _b++) {
          var jjk = connection_parts_1[_b];
          if (chain_id.toUpperCase() == jjk.toUpperCase()) {
            check = true;
          }
        }
        if (check) {
        }
        else {
          nhelm_connections.push(chain_connection);
        }
      }
    }
    var helm_chains = this.build_chain_string(nchains);
    this.helm = helm_chains + '$' + this.concat(nhelm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  HELMBuilder.prototype.getChain = function (chain_id) {
    return this.parser.parseChain(chain_id, this.helm);
  };
  HELMBuilder.prototype.replaceChain = function (chain) {
    var chainId = this.parser.parse_chain_identifier(chain);
    var helm_connections = this.parser.parseConnections(this.helm);
    var helm_groups = this.parser.parseGroups(this.helm);
    var helm_annotations = this.parser.parseAnnotations(this.helm);
    if (helm_annotations == null) {
      helm_annotations = [""];
    }
    if (helm_groups == null) {
      helm_groups = [""];
    }
    if (helm_connections == null) {
      helm_connections = [""];
    }
    var chains = this.parser.parseChains(this.helm);
    var nchains = [];
    for (var _i = 0, chains_14 = chains; _i < chains_14.length; _i++) {
      var ch = chains_14[_i];
      var ci = this.parser.parse_chain_identifier(chain);
      if (ci.toUpperCase() == chainId.toUpperCase()) {
        nchains.push(chain);
      }
      else {
        nchains.push(ch);
      }
    }
    var helm_chains = this.build_chain_string(nchains);
    this.helm = helm_chains + '$' + this.concat(helm_connections) + '$' + this.concat(helm_groups) + '$' + this.concat(helm_annotations) + '$';
  };
  HELMBuilder.prototype.remove3PrimeLinkerFromChain = function (chain) {
    var nucleotides = this.parser.parse_nucleotides(chain);
    var new_set = [];
    var index = 0;
    for (var _i = 0, nucleotides_4 = nucleotides; _i < nucleotides_4.length; _i++) {
      var n = nucleotides_4[_i];
      var monomers = this.parser.parser_monomers_from_nucleotide(n);
      if ((nucleotides.length - 1) == index) {
        if (monomers.length == 3) {
          var temp = [];
          temp[0] = monomers[0];
          temp[1] = monomers[1];
          monomers = temp;
        }
      }
      var new_nucleotide = this.build_nucleotide_from_monomers(monomers);
      new_set.push(new_nucleotide);
      index++;
    }
    var chain_id = this.parser.parse_chain_identifier(chain);
    var new_chain = chain_id + "{" + this.connect_nucleotides(new_set) + "}";
    return new_chain;
  };
  HELMBuilder.prototype.show = function () {
    alert(this.helm);
  };
  HELMBuilder.prototype.connect_nucleotides = function (nuc) {
    var strv = "";
    for (var _i = 0, nuc_1 = nuc; _i < nuc_1.length; _i++) {
      var n = nuc_1[_i];
      strv += n + '.';
    }
    strv = strv.substring(0, strv.length - 1);
    return strv;
  };
  HELMBuilder.prototype.connect_monomers = function (monomers) {
    var strv = "";
    for (var _i = 0, monomers_1 = monomers; _i < monomers_1.length; _i++) {
      var n = monomers_1[_i];
      strv += n + '.';
    }
    strv = strv.substring(0, strv.length - 1);
    return strv;
  };
  HELMBuilder.prototype.concat = function (list) {
    var l = '';
    if (list == null || list.length <= 0) {
      return l;
    }
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
      var item = list_1[_i];
      if (item == null || item.length <= 0) { }
      else {
        l += item + '|';
      }
    }
    if (l.endsWith('|')) {
      l = l.substring(0, l.length - 1);
    }
    return l;
  };
  HELMBuilder.prototype.toString = function () {
    return this.helm;
  };
  HELMBuilder.prototype.build_chain_string = function (chains) {
    var t = "";
    for (var _i = 0, chains_15 = chains; _i < chains_15.length; _i++) {
      var c = chains_15[_i];
      t += c + "|";
    }
    if (t.endsWith('|')) {
      t = t.substring(0, t.length - 1);
    }
    return t;
  };
  return HELMBuilder;
}());
HELMBuilder.RNA = "RNA";
HELMBuilder.CHEM = "CHEM";
HELMBuilder.PEPTIDE = "PEPTIDE";





var HELMParser = (function () {
  function HELMParser(monomerLib) {
    this.monomerLib = monomerLib;
  }
  HELMParser.prototype.isBranchMonomer = function (monomer) {
    var monomerobject = this.monomerLib.getMonomer(monomer, "RNA");
    // console.log ( ' monomer breanch type ]' + monomerobject.monomerType );
    if (monomerobject && monomerobject.monomertype.toUpperCase() == "BRANCH") {
      return true;
    }
    else {
      return false;
    }
  };
  HELMParser.prototype.parse_chain_identifier = function (chain) {
    var i = chain.indexOf("{");
    var id = chain.substring(0, i);
    return id;
  };
  HELMParser.prototype.parse_chain_identifiers = function (helm) {
    var str = [];
    var chains = this.parseChains(helm);
    for (var _i = 0, chains_1 = chains; _i < chains_1.length; _i++) {
      var chain = chains_1[_i];
      var c = this.parse_chain_identifier(chain);
      str.push(c);
    }
    return str;
  };
  HELMParser.prototype.parse_monomers_from_nucleic_acid = function (chain_full) {
    var chain = this.parse_chain_polymer(chain_full);
    var t = chain.replace(/\./g, " ");
    t = t.replace(/\(/g, ' ');
    t = t.replace(/\)/g, ' ');
    var sp = t.split(/\s+/g);
    // console.log ( sp );
    return sp;
  };
  HELMParser.prototype.parse_5_prime_conjugate = function (primary_chain_id, helm) {
    var primary_chain = this.parseChain(primary_chain_id, helm);
    var chains = this.parseChains(helm);
    var primary_chain_monomer_list = this.pull_monomer_sequence_from_chain("RNA", primary_chain);
    // it will be the case that there are several chems on either side.  this is thec ase with 147480
    // this is now a list of chain ids
    var tpe = this.getFivePrimeConjugate(helm, primary_chain_id);
    var chain_link = Array();
    for (var _i = 0, chains_2 = chains; _i < chains_2.length; _i++) {
      var c = chains_2[_i];
      for (var _a = 0, tpe_1 = tpe; _a < tpe_1.length; _a++) {
        var t = tpe_1[_a];
        var chain_id = this.parse_chain_identifier(c);
        var monomer_list = this.parse_chain_polymer(c);
        if (t == chain_id) {
          chain_link.push(monomer_list);
        }
      }
    }
    var l = "";
    for (var _b = 0, chain_link_1 = chain_link; _b < chain_link_1.length; _b++) {
      var m = chain_link_1[_b];
      l = m + l;
    }
    // console.log ( " chain link size " + l + " link " + chain_link.length );
    return l;
  };
  //     let fiveprime = null;
  //     // if this is a 5prime it will look like this:   CHEM1,RNA1,1:R1-1:R1
  //     let connections : string[] = this.parseConnections ( helm );
  //     for ( let con of connections ){
  //         let s : string[] = con.split  ( ",");
  //         if ( s != null && s.length > 0  ){
  //         if ( s[0].trim() == 'RNA1'){
  //             let conj :string = s[1].trim();
  //             let connection = s[2].trim();
  //             if ( connection.startsWith("1:")){
  //                 fiveprime=conj;
  //             }
  //         }else if ( s.length >= 1 && s[1] != null && s[1].trim() == 'RNA1'){
  //             let conj :string = s[0].trim();
  //             let connection = s[2].trim();
  //             if ( connection.endsWith("-1:R1")){
  //                 fiveprime=conj;
  //             }
  //         }
  //         }
  //     }
  //     return fiveprime;
  // }
  HELMParser.prototype.getConnection = function (helm, primary_chain, query_chain) {
    var connections = this.parseConnections(helm);
    for (var _i = 0, connections_1 = connections; _i < connections_1.length; _i++) {
      var con = connections_1[_i];
      var s = con.split(",");
      if (s != null && s.length > 0) {
        if (s.length >= 1 && s[1] != null) {
          if (s.indexOf(primary_chain) > -1 && s.indexOf(query_chain) > -1) {
            return con;
          }
        }
      }
    }
    return null;
  };
  HELMParser.prototype.parseChain = function (chain_id, helm) {
    var chains = this.parseChains(helm);
    for (var _i = 0, chains_3 = chains; _i < chains_3.length; _i++) {
      var chain = chains_3[_i];
      if (chain.toUpperCase().startsWith(chain_id.toUpperCase())) {
        return chain;
      }
    }
    return null;
  };
  HELMParser.prototype.getFivePrimeConjugate = function (helm, pchain) {
    var chains = this.parse_chain_identifiers(helm);
    var list = new Array();
    for (var _i = 0, chains_4 = chains; _i < chains_4.length; _i++) {
      var c = chains_4[_i];
      var index = 0;
      var fiveprime_connection = +this.getFivePrimeConnectionIndex(helm, pchain, c, index);
      // console.log ( ' c ' + c + ' is ' + threeprime_connection );
      if (fiveprime_connection > 0) {
        // console.log ( ' adding ' + threeprime_connection + ' to ' + c);
        list.splice(fiveprime_connection, 0, c);
      }
    }
    return list;
  };
  HELMParser.prototype.getThreePrimeConjugate = function (helm, pchain) {
    var chains = this.parse_chain_identifiers(helm);
    // console.log ( " helm " + helm );
    var list = new Array();
    for (var _i = 0, chains_5 = chains; _i < chains_5.length; _i++) {
      var c = chains_5[_i];
      var index = 0;
      var threeprime_connection = +this.getThreePrimeConnectionIndex(helm, pchain, c, index);
      // console.log ( ' c ' + c + ' is ' + threeprime_connection );
      if (threeprime_connection > 0) {
        // console.log ( ' adding ' + threeprime_connection + ' to ' + c);
        list.splice(threeprime_connection, 0, c);
      }
    }
    return list;
  };
  /**
   *  Recursive method to determine the index of a monomer in a chain
   */
  HELMParser.prototype.getThreePrimeConnectionIndex = function (helm, pchain, chain, index) {
    if (pchain == chain) {
      return 0;
    }
    if (index < 0) {
      return index;
    }
    var connection = this.getConnection(helm, pchain, chain);
    if (connection == null) {
      var chains = this.parse_chain_identifiers(helm);
      if (index < chains.length) {
        index++;
        var v = this.getThreePrimeConnectionIndex(helm, pchain, chains[index], index);
        if (v > 0) {
          return (+v + 1);
        }
        else {
          return v;
        }
      }
      else {
        -1;
      }
    }
    else if (this.getConnectionOrientation(helm, pchain, chain) == 5) {
      return -1;
    }
    else {
      return 1;
    }
  };
  /**
   *  Recursive method to determine the index of a monomer in a chain
   */
  HELMParser.prototype.getFivePrimeConnectionIndex = function (helm, pchain, chain, index) {
    if (pchain == chain) {
      return 0;
    }
    if (index < 0) {
      return index;
    }
    var connection = this.getConnection(helm, pchain, chain);
    if (connection == null) {
      var chains = this.parse_chain_identifiers(helm);
      index++;
      var v = +this.getFivePrimeConnectionIndex(helm, pchain, chains[index], index);
      if (index < chains.length) {
        if (v >= 0) {
          return (+v + 1);
        }
        else {
          return v;
        }
      }
      else {
        -1;
      }
    }
    else if (this.getConnectionOrientation(helm, pchain, chain) == 3) {
      return -1;
    }
    else {
      return 1;
    }
  };
  HELMParser.prototype.getConnectionOrientation = function (helm, ref_chain, monomer) {
    var connection = this.getConnection(helm, ref_chain, monomer);
    if (connection != null) {
      var refindex = this.getReferenceIndex(ref_chain, connection);
      if (refindex > 1) {
        return 3;
      }
      else {
        return 5;
      }
    }
    else {
      var chains = this.parse_chain_identifiers(helm);
      var connections = this.parseConnections(helm);
      for (var _i = 0, chains_6 = chains; _i < chains_6.length; _i++) {
        var qchain = chains_6[_i];
        for (var _a = 0, connections_2 = connections; _a < connections_2.length; _a++) {
          var con = connections_2[_a];
          var s = con.split(",");
          if (s != null && s.length > 0) {
            if (s.length >= 1 && s[1] != null) {
              if (s.indexOf(monomer) > -1 && s.indexOf(qchain) > -1) {
                return this.getConnectionOrientation(helm, ref_chain, qchain);
              }
            }
          }
        }
      }
      return -1;
    }
  };
  HELMParser.prototype.getReferenceIndex = function (ref, con) {
    var sp = con.split(",");
    if (sp[0] == ref) {
      var ssp = sp[2].split("-");
      var count = +(ssp[0].split(":")[0]);
      return count;
    }
    else if (sp[1] == ref) {
      var ssp = sp[2].split("-");
      var count = +(ssp[1].split(":")[0]);
      return count;
    }
    return -1;
  };
  /**
   * Determine if this is a three prime object
   * @param ref
   * @param con
   */
  HELMParser.prototype.isThreePrime = function (helm, ref, con) {
    var sp = con.split(",");
    if (sp[0] == ref) {
      var ssp = sp[2].split("-");
      var count = +(ssp[0].split(":")[0]);
      // console.log ( " ssp " + ssp[0] );
      // console.log ( " count" + count);
      if (count > 1) {
        return true;
      }
    }
    else if (sp[1] == ref) {
      var ssp = sp[2].split("-");
      var count = +(ssp[1].split(":")[0]);
      if (count > 1) {
        return true;
      }
    }
    return false;
  };
  HELMParser.prototype.parse_3_prime_conjugate = function (primary_chain_id, helm) {
    var three_prime_chain_id = null;
    var primary_chain = this.parseChain(primary_chain_id, helm);
    var chains = this.parseChains(helm);
    var primary_chain_monomer_list = this.pull_monomer_sequence_from_chain("RNA", primary_chain);
    // it will be the case that there are several chems on either side.  this is thec ase with 147480
    // this is now a list of chain ids
    var tpe = this.getThreePrimeConjugate(helm, primary_chain_id);
    var chain_link = Array();
    for (var _i = 0, chains_7 = chains; _i < chains_7.length; _i++) {
      var c = chains_7[_i];
      for (var _a = 0, tpe_2 = tpe; _a < tpe_2.length; _a++) {
        var t = tpe_2[_a];
        var chain_id = this.parse_chain_identifier(c);
        var monomer_list = this.parse_chain_polymer(c);
        if (t == chain_id) {
          chain_link.push(monomer_list);
        }
      }
    }
    var l = "";
    for (var _b = 0, chain_link_2 = chain_link; _b < chain_link_2.length; _b++) {
      var m = chain_link_2[_b];
      l += m;
    }
    // console.log ( " chain link size " + l + " link " + chain_link.length );
    return l;
  };
  HELMParser.prototype.parse_rna_conjugates = function (helm) {
    var c = "";
    var chains = this.parseChains(helm);
    for (var _i = 0, chains_8 = chains; _i < chains_8.length; _i++) {
      var chain = chains_8[_i];
      var chain_type = this.parse_chain_type(chain);
      if (chain_type.startsWith("CHEM")) {
        var fivePrime = this.parse_5_prime_conjugate("RNA1", helm);
        if (chain.startsWith(fivePrime)) {
          var chainId = this.parse_chain_identifier(chain);
          c += chain += " 5' \t";
        }
        else {
          c += chain += "\t";
        }
      }
    }
    return c;
  };
  HELMParser.prototype.parse_chain_type = function (chain) {
    var i = chain.indexOf("{");
    var type = chain.substring(0, i);
    if (type != null) {
      if (type.startsWith("RNA")) {
        return "RNA";
      }
      else if (type.startsWith("CHEM")) {
        return "CHEM";
      }
      else if (type.startsWith("PEPTIDE")) {
        return "PEPTIDE";
      }
      return type.trim();
    }
    return null;
  };
  HELMParser.prototype.parse_chain_type_index = function (chain) {
    var i = chain.indexOf("{");
    var type = chain.substring(0, i);
    if (type != null) {
      if (type.startsWith("RNA")) {
        return +type.substring(3);
      }
      else if (type.startsWith("CHEM")) {
        return +type.substring(4);
      }
      else if (type.startsWith("PEPTIDE")) {
        return +type.substring(7);
      }
    }
    return null;
  };
  HELMParser.prototype.parse_chain_polymer = function (chain) {
    var i = chain.indexOf("{");
    var f = chain.indexOf("}");
    var contents = chain.substring(i + 1, f);
    return contents;
  };
  HELMParser.prototype.parseChains = function (helm) {
    var t = this.pullChainGroup(helm);
    var chains = t.split('|');
    return chains;
  };
  HELMParser.prototype.parseConnections = function (helm) {
    var t = this.pullConnectionGroup(helm);
    var chains = t.split('|');
    return chains;
  };
  HELMParser.prototype.connectionContains = function (connection, chain_id) {
    var c = connection.split(",");
    for (var _i = 0, c_1 = c; _i < c_1.length; _i++) {
      var cid = c_1[_i];
      if (cid.toUpperCase() == chain_id.toUpperCase()) {
        return true;
      }
    }
    return false;
  };
  HELMParser.prototype.getConnections = function (helm, chain_id) {
    var conn_list = [];
    var conn = this.parseConnections(helm);
    for (var _i = 0, conn_1 = conn; _i < conn_1.length; _i++) {
      var connection = conn_1[_i];
      if (this.connectionContains(chain_id, connection)) {
        conn_list.push(connection);
      }
    }
    return conn_list;
  };
  HELMParser.prototype.parseGroups = function (groups) {
    return null;
  };
  HELMParser.prototype.parseAnnotations = function (annotations) {
    return null;
  };
  HELMParser.prototype.pullGroup = function (_helm) {
    //    for ( let h of _helm )
    //    {
    //     //    console.log ( h );
    //    } 
    return [''];
  };
  HELMParser.prototype.pullChainGroup = function (helm) {
    if (helm == undefined) {
      return "";
    }
    if (helm.indexOf('$') > 0) {
      var iv = helm.indexOf('$');
      var h = helm.substring(0, iv);
      return h;
    }
    else {
      return helm;
    }
  };
  HELMParser.prototype.pullAnnotations = function (helm) {
    if (helm.indexOf('$') > 0) {
      var iv = helm.lastIndexOf('$');
      var h = helm.substring(0, iv);
      return h;
    }
    else {
      return helm;
    }
  };
  HELMParser.prototype.pullConnectionGroup = function (helm) {
    if (helm == null && helm == undefined) {
      return "";
    }
    if (helm.indexOf("$") > 0) {
      var iv = helm.indexOf("$");
      var cv = helm.indexOf("$", iv + 1);
      var h = helm.substring(iv + 1, cv);
      return h;
    }
    else {
      return helm;
    }
  };
  HELMParser.prototype.pull_backbone_sequence_from_chain = function (helm) {
    var seq = "";
    var sp = helm.split(".");
    for (var s in sp) {
      var t = sp[s];
      if (t != null && t.length > 4) {
        var vs = t.indexOf('(');
        var vf = t.indexOf(')');
        while (vs >= 0 && vf > 0) {
          var seq_val = t.substring(vs, vf + 1);
          t = t.replace(seq_val, ' ');
          vs = t.indexOf('(');
          vf = t.indexOf(')');
        }
        seq += t;
      }
    }
    return seq;
  };
  HELMParser.prototype.pull_monomer_sequence_from_chain = function (chain_type, helm_chain) {
    var seq = "";
    var monomers = [];
    if (helm_chain == null) {
      return null;
    }
    // {{ FIIRST STRIP THE DECORATORS IF THERE ARE SOME }}
    if (helm_chain.indexOf("{") > 0) {
      var st = helm_chain.indexOf("{");
      var ed = helm_chain.indexOf("}");
      helm_chain = helm_chain.substring(st + 1, ed);
    }
    var mlist = [];
    var sp = helm_chain.split("\.").join(" ");
    if (sp != null && sp.length > 0) {
      sp = sp.split("\(").join(' ');
      sp = sp.split("\)").join(' ');
    }
    else {
      var monomer = helm_chain;
      monomer = this.removeBrackets(monomer);
      var mo = this.monomerLib.getMonomer(monomer, chain_type);
      if (mo != null) {
        mlist.push(mo.symbol);
      }
    }
    if (sp != null && sp.length > 0) {
      sp = sp.trim();
      var bb = sp.split(' ');
      var i = 0;
      for (var _i = 0, bb_1 = bb; _i < bb_1.length; _i++) {
        var m = bb_1[_i];
        // console.log ( " pull_monomer_sequence_from_chain " + i + ' -- ' + m);
        m = this.removeBrackets(m);
        var mo = this.monomerLib.getMonomer(m, chain_type);
        if (mo != null) {
          mlist.push(mo.symbol);
        }
      }
    }
    return mlist;
  };
  HELMParser.prototype.pull_monomer_sequence_from_helm = function (chain_id, helm) {
    var chains = this.parseChains(helm);
    for (var _i = 0, chains_9 = chains; _i < chains_9.length; _i++) {
      var chain = chains_9[_i];
      var current_chain_id = this.parse_chain_identifier(chain);
      if (chain_id == current_chain_id) {
        var chain_type = this.parse_chain_type(chain);
        return this.pull_monomer_sequence_from_chain(chain_type, chain);
      }
    }
    return null;
  };
  HELMParser.prototype.parser_sugar_from_nucleotide = function (nucleotide) {
    var start_index = nucleotide.indexOf('(');
    var end_index = nucleotide.indexOf(')');
    if (start_index <= 0 || end_index <= 0) {
      return null;
    }
    else {
      var s = nucleotide.substring(start_index + 1, end_index);
      return s;
    }
  };
  HELMParser.prototype.pull_sugar_sequence_from_chain = function (helm_chain) {
    var seq = "";
    var mlist = [];
    var sp = helm_chain.split('\.');
    for (var _i = 0, sp_1 = sp; _i < sp_1.length; _i++) {
      var nuc = sp_1[_i];
      var bstart = nuc.indexOf('(');
      if (bstart > 0) {
        var temp = nuc.substring(0, bstart);
        mlist.push(temp.trim());
      }
    }
    return mlist;
  };
  HELMParser.prototype.parse_and_format_backbone_sequence = function (helm) {
    var s = this.parse_backbone_sequence_for_RNA(helm);
    s = s.split('[').join(' ');
    s = s.split(']').join(' ');
    return s;
  };
  HELMParser.prototype.parse_backbone_sequence_for_RNA = function (helm) {
    var chain_group = this.pullChainGroup(helm);
    var backbone = '';
    var chains = chain_group.split('|');
    for (var _i = 0, chains_10 = chains; _i < chains_10.length; _i++) {
      var chain = chains_10[_i];
      if (chain.startsWith('RNA')) {
        var start = chain.indexOf('{');
        var end = chain.indexOf('}');
        if (start >= 0 && end > 0) {
          chain = chain.substring(start + 1, end);
        }
        backbone += this.pull_backbone_sequence_from_chain(chain);
        backbone += '|';
      }
    }
    if (backbone.endsWith('|')) {
      backbone = backbone.substring(0, backbone.length - 1);
    }
    return backbone;
  };
  HELMParser.prototype.parse_backbone_sequence = function (helm) {
    var chain_group = this.pullChainGroup(helm);
    var backbone = '';
    var chains = chain_group.split('|');
    for (var _i = 0, chains_11 = chains; _i < chains_11.length; _i++) {
      var chain = chains_11[_i];
      var start = chain.indexOf('{');
      var end = chain.indexOf('}');
      if (start >= 0 && end > 0) {
        chain = chain.substring(start + 1, end);
      }
      backbone += this.pull_backbone_sequence_from_chain(chain);
      backbone += '|';
    }
    if (backbone.endsWith('|')) {
      backbone = backbone.substring(0, backbone.length - 1);
    }
    return backbone;
  };
  HELMParser.prototype.parse_sugars_sequence_from_chain = function (chain) {
    var start = chain.indexOf('{');
    var end = chain.indexOf('}');
    if (start >= 0 && end > 0) {
      chain = chain.substring(start + 1, end);
    }
    var sugar_backbone = this.pull_sugar_sequence_from_chain(chain);
    return sugar_backbone;
  };
  HELMParser.prototype.parse_sugar_sequence = function (helm) {
    var chain_group = this.pullChainGroup(helm);
    var backbone = '';
    var chains = chain_group.split('|');
    for (var _i = 0, chains_12 = chains; _i < chains_12.length; _i++) {
      var chain = chains_12[_i];
      var start = chain.indexOf('{');
      var end = chain.indexOf('}');
      if (start >= 0 && end > 0) {
        chain = chain.substring(start + 1, end);
      }
      backbone += this.pull_backbone_sequence_from_chain(chain);
      backbone += '|';
    }
    if (backbone.endsWith('|')) {
      backbone = backbone.substring(0, backbone.length - 1);
    }
    return backbone;
  };
  HELMParser.prototype.pull_sequence = function (helm) {
    var seq = '';
    var chains = this.parseChains(helm);
    for (var _i = 0, chains_13 = chains; _i < chains_13.length; _i++) {
      var chain = chains_13[_i];
      if (chain.startsWith('RNA') || chain.startsWith('PEPTIDE')) {
        if (chain.indexOf('{') > 0) {
          var st = chain.indexOf('{');
          var et = chain.indexOf('}');
          chain = chain.substring(st + 1, et);
        }
        var sp = chain.split('.');
        for (var s in sp) {
          var t = sp[s];
          var vs = t.indexOf('(');
          var vf = t.indexOf(')');
          if (vs >= 0 && vf > 0) {
            var seq_val = t.substring(vs + 1, vf);
            seq += ' ' + seq_val + '  ';
          }
          else {
            //seq += '  ' + t + ' __ ';
          }
        }
      }
    }
    return seq;
  };
  HELMParser.prototype.parser_monomers_from_nucleotide = function (nucleotide) {
    var t = nucleotide;
    var vs = t.indexOf('(');
    var vf = t.indexOf(')');
    var sugar = t.substring(0, vs);
    var base = t.substring(vs + 1, vf);
    var linker = t.substring(vf + 1);
    var m = [sugar, base, linker];
    return m;
  };
  HELMParser.prototype.pull_base_sequence = function (helm) {
    var seq = [];
    var sp = helm.split('.');
    for (var s in sp) {
      var t = sp[s];
      var vs = t.indexOf('(');
      var vf = t.indexOf(')');
      if (vs >= 0 && vf > 0) {
        var seq_val = t.substring(vs + 1, vf);
        seq.push(seq_val.trim());
      }
      else {
      }
    }
    return seq;
  };
  HELMParser.prototype.parse_nucleotides = function (chain) {
    var seq = '';
    if (chain.toUpperCase().startsWith('RNA')) {
      var chainindex = chain.indexOf('{');
      var echainindex = chain.indexOf('}');
      if (chainindex >= 0 && echainindex > 0) {
        chain = chain.substring(chainindex + 1, echainindex);
      }
      var sp = chain.split('.');
      return sp;
    }
    return null;
  };
  HELMParser.prototype.parse_chem = function (chain) {
    var seq = '';
    if (chain.toUpperCase().startsWith('CHEM')) {
      var chainindex = chain.indexOf('{');
      var echainindex = chain.indexOf('}');
      if (chainindex >= 0 && echainindex > 0) {
        chain = chain.substring(chainindex + 1, echainindex);
      }
      var sp = chain.split('.');
      return sp;
    }
    return null;
  };
  HELMParser.prototype.parse_sugar_from_nucleotide = function (nuc) {
    var monomer_index_marker = nuc.indexOf('.');
    if (monomer_index_marker >= 0) {
      nuc = nuc.substring(monomer_index_marker);
    }
    var vs = nuc.indexOf('(');
    if (vs >= 0) {
      var seq_val = nuc.substring(0, vs);
      return this.removeBrackets(seq_val);
    }
    return '';
  };
  HELMParser.prototype.parse_base_from_nucleotide = function (nuc) {
    var monomer_index_marker = nuc.indexOf('.');
    // console.log ( ' monomer market ' + nuc );
    if (monomer_index_marker >= 0) {
      nuc = nuc.substring(monomer_index_marker);
    }
    var vs = nuc.indexOf('(');
    var vf = nuc.indexOf(')');
    if (vs >= 0 && vf > 0) {
      var seq_val = nuc.substring(vs + 1, vf);
      return this.removeBrackets(seq_val);
    }
    else {
      return nuc;
    }
  };
  HELMParser.prototype.parse_linker_from_nucleotide = function (nuc) {
    var monomer_index_marker = nuc.indexOf('.');
    if (monomer_index_marker >= 0) {
      nuc = nuc.substring(monomer_index_marker);
    }
    var vs = nuc.indexOf(')');
    if (vs >= 0 && vs < nuc.length) {
      var seq_val = nuc.substring(vs + 1);
      return this.removeBrackets(seq_val);
    }
    return '';
  };
  HELMParser.prototype.removeBrackets = function (monomer) {
    var bindex = monomer.indexOf('[');
    var cindex = monomer.indexOf(']');
    if (bindex >= 0 && cindex >= 0) {
      return monomer.substring(bindex + 1, cindex);
    }
    else {
      return monomer;
    }
  };
  return HELMParser;
}());

var PolymerDB = (function (require) {

  function PolymerDB() {
  }
  PolymerDB.prototype.load = function (id) {
    var environment_1 = require("../environments/environment");
    var _this = this;
    var req = {
      host: environment_1.environment.polymer_db_host,
      port: environment_1.environment.polymer_db_port,
      path: environment_1.environment.polymer_db_path + "/" + id,
      method: 'GET'
    };
    var li = null;
    var a = {
      listen: function (_li) {
        li = _li;
      }
    };
    var http_1 = require("http");
    http_1.request(req, function (res) { return _this.polymerLoaded(li, res); }).end();
    return a;
  };
  PolymerDB.prototype.polymerLoaded = function (a, res) {
    var data = '';
    var index = 0;
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      if (data != null) {
        var js = JSON.parse(data);
        if (js.length > 0) {
          for (var j in js) {
            var rule = js[j];
            a.complete(rule['helm']);
          }
        }
      }
    });
  };
  return PolymerDB;
}());

const LIB = function (path, name) {
  return new Promise(async (resolve, reject) => {
    let fun = await GETFUNCTION(path, name);
    fun = LOADLIBS(fun.toString());
    resolve(fun(lion_engine, LIB, log));
  })
}

const LOADLIB = function (path) {
  return new Promise(async (resolve, reject) => {
    let r = await GETFUNCTION(path);
    r = r.toString();
    let st = r.indexOf('{');
    let ed = r.lastIndexOf('}');
    let temp = r.substring(st + 1, ed);
    temp = temp.trim();
    if (!temp.startsWith('export')) {
      temp = 'export ' + temp;
    }
    console.log(' function : ' + temp)
    let prefixMethods = 'const LOADLIB = ' + LOADLIB.toString();
    prefixMethods += '\nvar GETFUNCTION = ' + GETFUNCTION.toString();
    var b64moduleData = "data:text/javascript;base64," + btoa(prefixMethods + '\n' + temp);
    const module = await import(b64moduleData);
    resolve(module);
  })
}





const LOADLIBS = function (functionObj) {
  let script = functionObj.toString();
  let a = script.indexOf('{')
  let b = script.lastIndexOf('}')
  let nscript = script.substring(a + 1, b);
  return new Function('lion_engine', 'LIB', 'log', nscript);
}

const GETFUNCTION = function (path, name) {
  return lion_engine.GETFUNCTION(path, name);
}

const CREATEFUNCTION = function createFunction(src) {
  return lion_engine.createIonfunctionFromSrc(src);
}


const func = function (path) {
  let index = path.indexOf('/');
  if (index > 0) {
    let cat = path.substring(0, index);
    let key = path.substring(index + 1);
    return lion_engine.GETFUNCTION(cat.trim(), key.trim());
  } else {
    log(' Failed to find the function for path : ' + path);
  }
}

const PUTJSON = function (jsonobject, url) {
  return lion_engine.PUTJSON(jsonobject, url);
}

// const PATCHJSON = function (url, jsonObject) {
//   return lion_engine.PATCHJSON(url, jsonObject);
// }

const GETJSON = function (url, header) {
  return lion_engine.GETJSON(url, header);
}
const GETFILE = function (url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () { alert("Genome Timed out"); }
    xhr.open("GET", url, true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        resolve(xhr.response);
      } else {
        console.log(" rejecting !" + status);
        reject(status);
      }
    };
    xhr.send();
  })
}
const getJSON = GETJSON;
function pause(milliseconds) {
  var dt = new Date();
  while ((new Date()) - dt <= milliseconds) { }
}


var OligoFactory = class OligoFactory {
  constructor(monomerdb) {
    this.monomerdb = monomerdb;
  }
  createTemplate(chain, sequence) {
    let chain_list = [];
    var index = chain.indexOf('/');
    var polymer_type = chain.substring(0, index);

    var rchain = chain.substring(index + 1);
    rchain = rchain.trim();
    polymer_type = polymer_type.toUpperCase();
    if (rchain.indexOf('-') > 0) {
      let sett = rchain.split('-');
      for (let s of sett) {
        let ind = s.indexOf(":");
        if (ind > 0) {
          var count = s.substring(0, ind);
          var monomer = s.substring(ind + 1);
          let mset = this.createMonomerSet(polymer_type, monomer, count);
          for (let msetob of mset) {
            console.log(" m " + msetob.id);
            chain_list.push(msetob);
          }
        }
      }
    }
    return new OligoChain(polymer_type, chain_list);
  }
  createMonomerSet(polymer_type, monomer_id, count) {
    let mset = [];
    for (var i = 0; i < count; i++) {
      let monomer = this.monomerdb.getMonomer(polymer_type, monomer_id);
      mset.push(monomer);
    }
    return mset;
  }
}
// the oligo chain object 
var OligoChain = class OligoChain {

  constructor(type, monomers, sequence) {
    this.type = type;
    this.monomers = monomers;
    this.sequence = sequence;
  }

  toHELM() {
    if (this.type === 'RNA') {
      var helm = this.type + "1{";
      let index = 0;

      let seqc = [];
      if (this.sequence) {
        seqc = sequence.split('');
      }
      for (let mon of this.monomers) {
        let base = '*';
        if (index < seqc.length) {
          base = this.seqc[index++];
        }
        helm += this.mangae_symbol_char(mon.symbol) + "(" + base + ")p.";
      }
      if (helm.endsWith(".")) {
        helm = helm.substring(0, helm.length - 1);

      }
      return helm + "}$$$$";
    }
  }
  mangae_symbol_char(t) {
    if (t.length > 1) {
      return '[' + t + ']';
    } else
      return t;
  }
}

var DNA = class DNA {
  constructor(sequence) {
    var c = '';
    for (var i = 0; i < sequence.length; i++) {
      c += 'd(' + sequence[i] + ')';
      if (i + 1 < sequence.length) {
        c += "p.";
      }
    }
    this.helm = "RNA1{" + c + "}$$$$";
  }
  toHELM() {
    return this.helm;
  }
}




var MonomerDB = class MonomerDB {

  constructor(url) {
    this.url = url;
    getJSON(this.url, function (err, data) {
      if (err != null) {
        console.error(err);
      } else {
        console.log("-data- ");
        MonomerDB.db = JSON.parse(data);
      }
    });
  }

  getNaturalAnalog(polymertype, monmoerid) {
    if (MonomerDB.db) {
      for (let i = 0; i < MonomerDB.db.length; i++) {
        let ob = MonomerDB.db[i];
        if (ob['id'] === polymertype + '/' + monmoerid) {
          return ob['naturalanalog'];
        }
      }
      console.log(" failed to find the monomer " + polymertype + '/' + monmoerid);
      return null;
    } else {
      // var loading = true;
      console.log(" loading monomers still... ");
      return null;
      var id = setInterval(function () {
        console.log(' check ');
        if (MonomerDB.db) {
          clearInterval(id);
          loading = false;
          for (let i = 0; i < MonomerDB.db.length; i++) {
            let ob = MonomerDB.db[i];
            if (ob['id'].trim() === polymertype + '/' + monmoerid) {
              return ob['naturalanalog'];
            }
          }
        }
      }, 1000);
    }
  }

  getMonomer(polymertype, monmoerid) {
    if (MonomerDB.db) {
      console.log('\tMonomerDB size: \t ' + MonomerDB.db.length);
      for (let i = 0; i < MonomerDB.db.length; i++) {
        let ob = MonomerDB.db[i];
        if (ob['id'] === polymertype + '/' + monmoerid) {
          return ob;
        }
      }
      console.log(" failed to find the monomer " + polymertype + '/' + monmoerid);
      return null;
    } else {
      // var loading = true;
      console.log(" loading monomers still... ");
      return null;
      var id = setInterval(function () {
        console.log(' check ');
        if (MonomerDB.db) {
          clearInterval(id);
          loading = false;
          for (let i = 0; i < MonomerDB.db.length; i++) {
            let ob = MonomerDB.db[i];
            if (ob['id'].trim() === polymertype + '/' + monmoerid) {
              return ob;
            }
          }
        }
      }, 1000);
    }
  }


  isLoaded() {
    if (MonomerDB.db) {
      return true;
    } else {
      return false;
    }
  }

  printDB() {
    if (!MonomerDB.db) {
      var id = setInterval(function () {
        if (MonomerDB.db != null) {
          for (var i = 0; i < MonomerDB.db.length; i++) {
            console.log(" i  " + JSON.stringify(MonomerDB.db[i]));
          }
          clearInterval(id);
          return;

        }
      }, 1000);
    } else {
      for (var i = 0; i < MonomerDB.db.length; i++) {
        console.log(" item  " + MonomerDB.db[i].toString());
      }
    }
  }
}


var RNAChain = class RNAChain {
  constructor(id, sequence) {
    this.id = id;
    this.sequence = sequence;
  }
}
// public static remote_host:string = 'http://ionprod:8984'
// public static host:string = URLs.remote_host;
// public static load_helm_rule_for_user = URLs.host + "/helm_rules/get_helm_rules_for_user";
// public static save_helm_rule_for_user:string = URLs.host + "/helm_rules/save_helm_rule";


let Solr = class Solr {
  static getDocs(url) {
    return (new Promise((resolve, reject) => {
      lion_engine.GETJSON(url).then(r => {
        let response = r;
        if ('response' in response) {
          resolve(response['response']['docs']);
        }
        reject([])
      });
    }));
  }
}
let BIRD = class BIRD {
  static assignSite(isisno, siteid, userid) {
    return lion_engine.GETJSON("http://ionprod:1111/v1/register/assign_site_ids?isisno=" + isisno + "&siteid=" + siteid + "&userid=" + userid);
  }
  static getSites(isisno) {
    return lion_engine.GETJSON("http://ionprod:1111/v1/register/get_site_ids?isisno=" + isisno);
  }
  static getOligosForOrder(orderid) {
    return lion_engine.GETJSON("http://ionprod:1111/v1/order/get-oligos/" + orderid);
  }
  static replaceOligoInOrder(orderid, currentid, newid) {
    let replacejson = {
      'orderid': orderid,
      'currentid': currentid,
      'newid': newid
    }

    return lion_engine.POSTJSON(replacejson, 'http://ionprod:1111/v1/order/replace-oligo-for-order');
  }
  static executeUpdate(sql, user, password) {
    let sclcall = {
      'user': user,
      'password': password,
      'sql': sql
    }
    return lion_engine.POSTJSON(sclcall, 'http://ionprod:1111/v1/order/updateBird');
  }
  static executeQueryHost(host, sql, limit) {
    if (limit == null) {
      limit = 50000;
    }
    let sclcall = {
      'user': 'reader',
      'password': 'readonly',
      'sql': sql,
      'limit': limit,
      'host': host
    }
    return lion_engine.POSTJSON(sclcall, 'http://ionprod:1111/v1/bird/queryOnHost');
  }


  static executeQuery(sql, limit) {
    if (limit == null) {
      limit = 50000;
    }

    let sclcall = {
      'user': 'reader',
      'password': 'readonly',
      'sql': sql,
      'limit': limit
    };
    return lion_engine.POSTJSON(sclcall, 'http://ionprod:1111/v1/bird/queryBird');
  }


  static getPPSet(ppset_name) {
    let sql = "select set_id, set_name, forward_isisno, reverse_isisno, probe_isisno, status, comments, multiplexable, date_created " +
      " from antisense.pp_set where set_name = '" + ppset_name + "'";
    console.log(" " + sql)
    return BIRD.executeQuery(sql, 1);
  }


  // orderidrange is something like 1-3
  static assignOrdersToScreen(orderidrange, mtid) {
    let jo = {};
    let ord = orderidrange.split('-');

    let start = ord[0];
    let end = ord[1];
    console.log(' start ' + start + ' end ' + end);
    for (let i = start; i < end; i++) {
      jo['order_id'] = i;
      console.log(" order id " + i);
      jo['screening_id'] = mtid;
      lion_engine.POSTJSON(jo, "http://ionprod:1111/v1/order/to-rts-project");
    }
  }

  static assignOrderToScreen(orderid, mtid) {
    let jo = {};
    jo['order_id'] = orderid;
    jo['screening_id'] = mtid;
    return lion_engine.POSTJSON(jo, "http://ionprod:1111/v1/order/to-rts-project");
  }


  static assignMTID(oligo_list, mtid) {
    let jo = {};
    jo['oligos'] = oligo_list;
    jo['mtid'] = mtid;
    return lion_engine.POSTJSON(jo, "http://ionprod:1111/v1/map/oligos-to-targets");
  }
  static getOrderIDs() {
    return lion_engine.GETJSON("http://ionprod:1111/v1/order/recent-order-ids");
  }
}



let OligoDB = class OligoDB {
  static load(oligoid) {
    let data = null;
    let url = "http://oligodb:8080/oligos/" + oligoid;
    var xhr = new XMLHttpRequest();
    // xhr.responseType = 'json';
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // xhr.setRequestHeader("Content-type", "application/json");
    console.log(" url " + url);
    xhr.open("GET", url, false);
    // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };

    xhr.send();
    let obj = JSON.parse(data);
    if (obj && obj.length > 0)
      return obj[0];
    else
      return null;
  }
  static get(isisno, path) {
    let data = OligoDB.load(isisno);
    if (data != null) {

      console.log(" -- ");
      for (let p of path) {
        data = data[p];
      }
    }
    return data;
  }
  static getGeneSymbol(isisino, genome_build) {
  }

  static updateHELM(isisno, helm) {
    let ob = {
      'isisno': isisno,
      'helm': helm
    };
    return lion_engine.POSTJSON(ob, "http://ionprod:1111/v1/oligos/update-helm");
  }
  static register(asobatch) {
    return lion_engine.POSTJSON(asobatch, "http://oligodb:8080/oligos/register");
  }



  static build_oligo_json_object_for_single_aso(aso) {
    if ('helm' in aso) {
      let oligolist = [];
      let oligo = {
        "helm": aso['helm'],
        "pion": 0
      };
      oligolist.push(oligo);
      let a = {};
      a['oligos'] = oligolist;
      let ke = Object.keys(aso);
      for (let key of ke) {
        a[key] = aso[key];
      }
      return a;
    }
    if ('comments' in aso) {
      aso['comment'] = aso['comments'];
      delete aso['comments'];
    }
    return aso;
  }


  static registerSingleOligo(singleaso) {
    if ('helm' in singleaso) {
      console.log("Reformatting the aso object");
      singleaso = OligoDB.build_oligo_json_object_for_single_aso(singleaso);
    }
    console.log(" single aso " + JSON.stringify(singleaso));
    return new Promise((resolve, reject) => {
      lion_engine.POSTJSON(singleaso, "http://oligodb:8080/oligos/register").then(res => {
        if ('successes' in res) {
          let successList = res['successes'];
          let failList = res['couchFailures'];
          // {"successes":[],"couchFailures":[{"error":"Oligo is not unique.","duplicates":[2001318],"helm":"RNA1{[cet](G)[sp].[cet]([m5C])[sp].[cet](T)[sp].d(T)[sp].d(T)[sp].d(T)[sp].d(T)[sp].d(G)[sp].d(G)[sp].d(A)[sp].d(G)[sp].d(G)[sp].d([m5C])[sp].[cet]([m5C])[sp].[cet](T)[sp].[cet](G)}$$$$","pion":0,"comment":"","designer":"HBUI","notebook":"EXP-18-HG5896","equivSequence":"","design":{"intendedTargetSites":{},"inferredTargetSites":{}},"version":"1.0.0","dateCreated":"2018-08-15T20:03:39.291Z","type":"oligo","dateUpdated":"2018-08-15T20:03:39.291Z","molWeight":5454.4892578125,"extinctCoefficient":148.28,"formula":"C172H217N56O90P15S15"}],"errors":[],"warnings":[]}
          if (successList != null && successList.length > 0) {
            let ob = successList[0];
            if ('isis' in ob) {
              ob['id'] = ob['isis'];
            }
            if ('isisno' in ob) {
              ob['id'] = ob['isisno']
            }
            resolve(ob);
          }
          if (failList != null && failList.length > 0) {
            let ob = failList[0];
            let dup = ob['duplicates'][0];
            let dupid = {
              "id": dup
            }
            resolve(dupid);
          }
        }
      });
    });
  }
  // legacy stuff. 
  static assignLegacySiteId(isisno, siteid, userid) {
    return lion_engine.GETJSON("http://ionprod:6111/v1/register/assign_site_ids?isisno=" + isisno +
      "&siteid=" + siteid + "&userid=" + userid);
  }

  static updateValue(param, value) {
    return lion_engine.GETJSON("http://ionprod:6111/v1/register/assign_site_ids?isisno=" + isisno +
      "&siteid=" + siteid + "&userid=" + userid);
  }

  static async getIsisNumbers(helmList) {
    let reslist = {}
    for (let h of helmList) {


      // let response = await fetch('https://api.github.com');
      // only proceed once promise is resolved
      // let data = await response.json();
      // console.log ( ' ----+ + + ' + JSON.stringify(data) );
      // reslist[h]=data;
      let data = await this.getIsisNo(h);
      reslist[h.helm] = (data);
    }
    return reslist;
  }

  // http://oligodb:8080/oligos/sequence/ACAATAAATACCGAGG 
  static getIsisNo(helm) {

    let data = null;
    let ionis_ids_to_helmstring = "http://oligodb:8080/oligos/helm";
    let url = ionis_ids_to_helmstring + '/' + helm;
    var xhr = new XMLHttpRequest();
    // log ( "\n\n\n url " + url );
    xhr.open("GET", url);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        return " failed to load " + status;
      }
    };
    xhr.send();
    let obj = JSON.parse(data);
    if (obj && obj.length > 0)
      return object.toString();
    else
      return 'NONE';
  }

  static isUnique(helm) {
    let data = null;
    let ionis_ids_to_helmstring = "http://oligodb:8080/oligos/helm";
    let url = ionis_ids_to_helmstring + '/' + helm;
    var xhr = new XMLHttpRequest();
    // log ( "\n\n\n url " + url );
    xhr.open("GET", url, false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        return " failed to load " + status;
      }
    };
    xhr.send();
    let obj = JSON.parse(data);
    if (obj && obj.length > 0)
      return false;
    else
      return true;

  }

  static getChainChemistryTemplateFromIsisNumber(chainid, isisnumber) {
    return new Promise((resolve, reject) => {
      OligoDB.getHELM(isisnumber).then(list => {
        for (let l of list) {

          if ('helm' in l) {

            let parser = new HELMParser();
            let p = parser.parseChain(chainid, l.helm);
            let helm_chain_t = parser.parse_chain_polymer(p);
            let helm_monomers = helm_chain_t.split(".");
            log(helm_monomers.length);
            let newnuc = [];
            for (let nucl of helm_monomers) {
              let ns = nucl.replace(/\(.*\)/g, "(*)");
              newnuc.push(ns);
            }
            let nucstr = '';
            for (let n of newnuc) {
              nucstr += n + '.';
            }
            nucstr = 'RNA1{' + nucstr.substring(0, nucstr.length - 1) + "}$$$$";


            // let newchain = '';
            // for ( let monomer of monomers )
            // {
            // if ( parser.isBranchMonomer ( monomer ) )
            // {
            // newchain += '(*)';
            // }else{
            // newchain += monomer + '.';
            // }
            // }
            resolve(nucstr);
          }

          // log ( " l " + JSON.stringify ( l ) );
        }
      });
    });
  }

  static async getHELM(isisnumber) {
    // http://oligodb:8080/oligos/301012?fields=helm
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



  static find(helm) {
    let data = null;
    let ionis_ids_to_helmstring = "http://oligodb:8080/oligos/helm";
    let url = ionis_ids_to_helmstring + '/' + helm;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        return " failed to load " + status;
      }
    };
    xhr.send();
    let obj = JSON.parse(data);
    if (obj && obj.length > 0)
      return obj;
    else
      return null;

  }
}



let OligoManager = class OligoManager {


  constructor(monomerLib) {
    this.monmerLib = monomerLib;
    if (this.monomerLib == null) {
      this.monomerLib = new MonomerDB();
    }
    this.helm_parser = new HELMParser(this.monmerLib);
  }
  static applyChemistryToSequence(chemistry, sequence) {
    let helm = chemistry;
    for (let s of sequence) {
      helm = helm.replace("*", s);
    }
    return helm;
  }

  static replaceMonomer(helm_chain, from_monomer, to_monomer) {
    let monomerLib = new MonomerDB();
    let helm_parser = new HELMParser(monomerLib);
    let builder = new HELMBuilder(helm_parser, monomerLib);
    // console.log ( " chemistry " + helm_chain );
    builder.setHELM(helm_chain);
    return builder.find_and_replace_nucleotide_monomers(helm_chain, from_monomer, to_monomer);

  }


  getSequence(helm) {
    let helm_monomer_sequence = this.helm_parser.pull_sequence(helm);
    let hs = helm_monomer_sequence.split(' ');
    //     let na = [];
    for (let monomer of hs) {

      let m = this.helm_parser.removeBrackets(monomer);
      if (m && m.length > 0) {
        na.push(this.monmerLib.getNaturalAnalog('RNA', m));
      }
    }
    let seq = '';
    for (let n of na) {
      seq += n;
    }
    return seq;
  }
}




let Genome = class Genome {

  constructor(build) {
    this.build = build;
  }


  lsc(sequence, gene) {


    let data = null;

    let url = "htt://ionprod:8701/v1/genome/lsc-hits?sequence=" + sequence + "&path=/human";

    if (gene) {

    }

    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function () { alert("Genome Timed out"); }

    console.log(" url " + url);
    xhr.open("GET", url, false);
    xhr.onload = function () {
      var status = xhr.status;
      if (status == 200) {
        data = xhr.response;
      } else {
        //callback(status);
        return " failed to load " + status;
      }
    };

    xhr.send();
    let obj = JSON.parse(data);
    return obj;
  }

}



let PanModels = class PanModels {
  run(id, helm, lsc) {
    let data = null;
    this.msg = "Running calculation... ";
    setTimeout(() => {
      if (lsc == null || lsc.length < 499) {
        this.pan_msg = " Cannot calculate activity for " + id + "; no LSC found.";
      }
      // console.log(" lsc " + lsc);
      let params = {
        'lsc': lsc,
        'helm': helm,
        'id': id
      }
      var body = JSON.stringify(params);
      let headers = new Headers({ 'Content-Type': 'application/json' });
      // console.log(' json body ' + JSON.stringify(params));
      let url = 'http://ionprod:8701/v1/genome/pan-scores';
      var xhr = new XMLHttpRequest();
      xhr.ontimeout = function () { alert("Genome Timed out"); }
      // console.log("pan url " + url);
      xhr.open("POST", url, false);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.onload = function () {
        var status = xhr.status;
        console.log(' data ' + status);
        if (status == 200) {
          data = xhr.response;
        } else {
          //callback(status);
          return " failed to load " + status;
        }
      };
      xhr.send(body);
      let strs = data;
      strs = strs.split("NaN").join("-1");
      console.log(" re " + strs);
      let results = JSON.parse(strs);
      return results;
    }, 1000);
  }
}
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}




let status = class status {
  static check(val) {
    return lion_engine.getStatus(val);
  }
  static waitFor(val, value, timeout_in_seconds) {
    if (!timeout_in_seconds) {
      timeout_in_seconds = 120;
    }
    return lion_engine.waitFor(val, value, timeout_in_seconds);
  }
}



function docx(experiment_id, title, summary, author) {
  return lion_engine.generate_document(experiment_id, title, summary, author)
}



function readFile(path) {
  if (path.startsWith('/')) {
    path = path.substring(1);
  }

  let d = 'hello world';
  let ind = path.indexOf('/');
  let bucket = path.substring(0, ind);
  path = path.substring(ind + 1);
  let url = 'http://ionprod:8000/files/s3getjson?bucket={bucket}&path={path}';
  url = url.replace("{bucket}", bucket);
  url = url.replace("{path}", path);
  var xhr = new XMLHttpRequest();
  xhr.ontimeout = function () { alert("Timed out"); }
  console.log(" url " + url);
  xhr.open("GET", url, false);
  xhr.onload = function () {
    var status = xhr.status;
    if (status == 200) {
      d = xhr.responseText;
      console.log(" d " + d);
    } else {
      //callback(status);
      return " failed to load " + status;
    }
  };
  xhr.send();
  return d;
}

let request = obj => {
  return new Promise((resolve, reject) => {

    let path = obj.path;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    let ind = path.indexOf('/');
    let bucket = path.substring(0, ind);
    path = path.substring(ind + 1);
    let url = 'http://ionprod:8000/files/s3getjson?bucket={bucket}&path={path}';
    url = url.replace("{bucket}", bucket);
    url = url.replace("{path}", path);

    console.log(' url ' + url);


    let xhr = new XMLHttpRequest();
    xhr.open(obj.method || "GET", url);
    if (obj.headers) {
      Object.keys(obj.headers).forEach(key => {
        xhr.setRequestHeader(key, obj.headers[key]);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send(obj.body);
  });
};


function toRows(data) {
  let rows = data.split("\n");
  return rows;
}

function appendFile(d, path) {
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  let ind = path.indexOf('/');
  let bucket = path.substring(0, ind);
  path = path.substring(ind + 1);

  var data = JSON.stringify({
    "data": d,
    "bucket": bucket,
    "path": path
  });
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      console.log(this.responseText);
    }
  });
  xhr.open("POST", "http://ionprod:8000/files/s3putdata");
  xhr.send(data);
}

let HumanGenome = class HumanGenome {

  getHits(sequence, edit_distance) {
    return lion_engine.GETJSON("http://192.168.125.46:8080/oligos/?genome=homo-sapiens-88&kmers=" + sequence + "&editDistance=" + edit_distance);
  }

};

let GenomeDB = class GenomeDB {
  static load(name) {
    if (name.toUpperCase() === 'HUMAN' || name.toUpperCase().startsWith('HOMO-SAPIENS')) {
      return new Genome('human', 'homo-sapiens-88');
    } else if (name === 'homo-sapiens-88') {
      return new HumanGenome(name);
    }
    return new Genome('human', 'homo-sapiens-88');
  }
};

function dropAndOpenFile(title) {
  return lion_engine.getDropFile(title, "open");
}

function dropFile(title) {
  return lion_engine.getDropFile(title, "not_open");
}


function showFile(file) {
  //   lion_engine.showFile(file);
}
function clear() {
  lion_engine.clearLog();
}
function clearWeak() {
  lion_engine.clearWeak();
}
function removeComponent(index) {
  lion_engine.removeComponent(index);
}

function getComponentCount() {
  return lion_engine.getComponentCount();
}

function clearLog() {
  lion_engine.clearLog();
}

function log(line) {
  lion_engine.log(line);
}

function logBlock(id, title) {
  if (title == null || title.length <= 0) {
    title = '';
  }
  let js = {
    "wid": 'logblock',
    "id": id,
    "title": title
  }
  return lion_engine.showWidget(js);
}

function plotly(title, data) {
  if (title == null || title.length <= 0) {
    title = '';
    //   }
    let js = {
      "wid": 'plot',
      "title": title,
      "data": data
    }
    return lion_engine.showWidget(js);
  }
}


function downloadCSVButton(title, data) {
  if (title == null || title.length <= 0) {
    title = '';
  }
  let js = {
    "wid": 'download-csv',
    "title": title,
    "data": data
  }
  return lion_engine.showWidget(js);
}


function updateProgress(line) {
  lion_engine.updateProgress(line);
}

function results(guid) {
  return lion_engine.getResults(guid);
}

function toString(fileob) {
  let lines = fileob.lines;
  t = '';
  for (let l of lines) {
    t += l + '\n';
  }
  return t;
}

RDKit = class RDKit {
  static viewMol(molfile) {
    console.log(" molfile " + molfile);
    return lion_engine.displaySVG("http://ionprod:8984/structure/view_structure", { 'mol': molfile })
  }
}


let IonEngine = class IonEngine {
  static run(path, rule_name, input) {
    return lion_engine.run(path, rule_name, input);
  }
  static getRule(path, rule_name) {
    return lion_engine.getRule(path, rule_name);
  }
}


async function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

function downloadAsCsv(object, file_name) {
  lion_engine.exportToCsv(object, file_name);
}
function showPlateManager(load_path, plate_type, save_to_path) {
  if (save_to_path == null || save_to_path.length == 0) {
    save_to_path = 'globalplatedb';
  }
  console.log(" \t load path " + load_path);
  if (load_path != null) {
    let url = "http://localhost:8888/index.html?init=plate_layout&q=open:" + load_path + ",guid:{{guid}},save_path:" + save_to_path;
    // let url = "http://ionprod:8701/platemanagerv1/index.html?init=plate_layout&q=path:" + path + ",guid:{{guid}},user:"+user;
    return lion_engine.showApp(save_to_path, url, 'modal');
  }
  if (plate_type == null) {
    plate_type = 96;
  }
  // let url = "http://ionprod:8701/platemanagerv1/index.html?init=plate_layout&q=action:new,type:" + type + ",guid:{{guid}},user:"+user;
  let url = "http://localhost:8888/index.html?init=plate_layout&q=action:new,type:" + plate_type + ",guid:{{guid}},save_path:" + save_to_path;
  return lion_engine.showApp('Create new plate layout', url, 'modal');

}
function showHELMEditor(title, helm_str) {
  let helmstring = helm_str;
  let url = "http://research-apps/ox/#/medchem";
  // let url = "/medchem";
  if (helmstring != null && helmstring.length > 0) {
    url = url + encodeURI("?helm=" + helmstring);
  }
  return lion_engine.showFeature(title, url, 'modal');
}

function showInputTextArea(title) {
  return lion_engine.showInputTextArea(title);
}
function showBIRDQuery(title) {
  let js = {
    "wid": "sql-query",
    "input": default_input,
    "title": title
  }
  return lion_engine.showWidget(js);
}

function showMenu(obj) {
  return lion_engine.showMenu(obj);
}
function clearMenu() {
  return lion_engine.clearMenu();
}
function showFooter(obj) {
  return lion_engine.showFooter(obj);
}
function showNavbar(obj) {
  return lion_engine.showNavbar(obj);
}
function showWidget(obj) {
  return lion_engine.showWidget(obj);
}
function showModal(obj) {
  return lion_engine.showModal(obj);
}
function hideAllModal() {
  return lion_engine.hideAllModal();
}


function showMedChemEditor(title, helmstring) {
  let js = {
    "wid": "medchem",
    "input": helmstring,
    "title": title
  };
  return lion_engine.showWidget(js);
}

function showInputItem(title) {
  return lion_engine.showInputItem(title);
}
function showInputParamItem(title, input_labels) {
  return lion_engine.showInputParamItem(title, input_labels);
}
function showInputTextItems(titlelist) {
  setInterval(function () {
  }, 1000);
}
function showOKPanel(msg) {
  // testSleep();
  return lion_engine.showOKPanel(msg);
}

function showHint(msg) {
  let h = {
    'wid': 'hint',
    'data': msg
  }
  lion_engine.showWidget(h);
}


function setUIObject(varobject, label, vartype) {
  lion_engine.setUIObject(varobject, label, vartype);
}

function voiceToText(listner) {
  lion_engine.voiceToText(listner);
}

function JSONToFunction(json) {
  return JSON.parse(json, function (key, value) {
    if (typeof value === "string" &&
      value.startsWith("/Function(") &&
      value.endsWith(")/")) {
      value = value.substring(10, value.length - 2);
      return eval("(" + value + ")");
    }
    return value;
  });
}


function createIonFunction(f) {
  // console.log(' lionfunction ' + lion_engine);
  return lion_engine.createIonFunction(f, null);
}
function getIonFunction(ref) {
  return lion_engine.getIonFunction(ref);
}

function functionToJSON(f) {
  return json = JSON.stringify(f, function (key, value) {
    if (typeof value === "function") {
      return "/Function(" + value.toString() + ")/";
    }
    return value;
  });
}

function showTextAreaEditor(title, default_input) {
  if (default_input == null || default_input.length <= 0)
    default_input = '';
  let js = {
    "wid": "input-textarea-editor",
    "input": default_input,
    "title": title
  }
  return lion_engine.showWidget(js);
}
function showTextField(title, default_input) {
  if (default_input == null || default_input.length <= 0)
    default_input = '';
  let js = {
    "wid": "input-textfield",
    "input": default_input,
    "title": title
  }
  return lion_engine.showWidget(js);
}


function SAVES3(file, s3bucket, s3path) {
  let site = host + "/files/s3upload";
  let resdata = null;
  var data = new FormData();
  data.append("file", file);
  data.append("path", s3path);
  data.append("bucket", s3bucket);
  // console.log ( " file " + file );
  var xhr = new XMLHttpRequest();
  xhr.ontimeout = function () { alert("Timed out"); }
  xhr.addEventListener("readystatechange", function () {
    resdata = this.responseText;
    if (this.readyState === 4) {
      // let res = JSON.parse ( this.responseText );
    }
  });
  xhr.open("POST", site, false);
  xhr.send(data);
  return resdata;

}

function READS3(s3bucket, s3path) {
  let site = "http://ionprod:8000/files/s3download" + "?bucket=" + s3bucket +
    "&path=" + s3path;
  let resdata = null;
  var xhr = new XMLHttpRequest();
  xhr.ontimeout = function () { alert("Timed out"); }
  xhr.addEventListener("readystatechange", function () {
    resdata = this.responseText;
    if (this.readyState === 4) {
      // let res = JSON.parse ( this.responseText );
    }
  });
  xhr.open("GET", site, false);
  xhr.send();
  return resdata;
}

function POSTJSON(jsonobj, site) {
  return lion_engine.POSTJSON(jsonobj, site);
}

function POSTFile(file, properties, url) {
  return lion_engine.POSTFile(file, properties, url)
}


function exec_tab(path, params) {
  return lion_engine.exec_tab(path, params);
}


function CONSTANTS(path) {
  let it = path.indexOf('/');
  let category = path.substring(0, it);
  let key = path.substring(it + 1);
  let js = {
    "spath": category,
    "rule_name": key
  };
  let url = environment.get_helm_rule;
  // return lion_engine.POSTJSON ( js, url)
  // let data = null;
  // let url = environment.get_helm_rule;
  var xhr = new XMLHttpRequest();
  // let it = path.indexOf('/');
  // let category = path.substring(0, it);
  // let key = path.substring(it + 1);
  // let js = {
  //   "spath": category,
  //   "rule_name": key
  // };
  xhr.open('POST', url, false);
  xhr.setRequestHeader("Content-type", "application/json");
  // // xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onload = function () {
    var status = xhr.status;
    if (status == 200) {
      data = xhr.response;
    } else {
      //callback(status);
      return " failed to load " + status;
    }
  }
  xhr.send(JSON.stringify(js));
  let helm_rule_object = JSON.parse(data);
  console.log(" helm rules : " + JSON.stringify(helm_rule_object));
  console.log(" helm fules value : " + helm_rule_object['rule_value']);
  // // return JSON.parse(helm_rule_object['rule_value'])
  if (helm_rule_object['rule_value'].startsWith('{')) {
    return JSON.parse('' + helm_rule_object['rule_value'] + '');
  }
  return JSON.parse('{' + helm_rule_object['rule_value'] + '}');
}




function read(path, ...args) {
  return new Promise(async (resolve, reject) => {
    let value = await lion_engine.getScript(path);
    if (value != null) {
      resolve(value['rule_value'])
    } else {
      resolve("path not found : " + path);
    }
  })

}
function load(path, ...args) {
  return lion_engine.getScript(path);
}


function exec(path, ...args) {
  return lion_engine.exec(path, ...args);
}


async function testSleep() {
  console.log("Waiting for 1 second...");
  await sleep(1000);
  console.log("Waiting done."); // Called 1 second the first console.log
}

let Grid = class Grid {
  static append(column, value) {
    lion_engine.updateUI('grid', column, value);
  }
}

let Plot = class Plot {
  static show(values) {
    lion_engine.updateUI('plot', 'plotname', values);
  }
  static d3demo(values) {
    lion_engine.updateUI('d3demo', 'd3demo', values);
  }
}
const delimiter = ',';
function parseCSV(text, f) {
  var o;
  let rowset = parseRows(text, function (row, i) {
    if (o) return o(row, i - 1);
    o = new Function("d", "return {" + row.map(function (name, i) {
      console.log(" value " + name + ' ' + i);
      return JSON.stringify(name) + ": d[" + i + "]";
    }).join(",") + "}");
  });
  return rowset;
}

parseRows = function (text, f) {
  var delimiterCode = delimiter.charCodeAt(0);
  var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
  function token() {
    if (I >= N) return EOF;
    if (eol) return eol = false, EOL;
    var j = I;
    if (text.charCodeAt(j) === 34) {
      var i = j;
      while (i++ < N) {
        if (text.charCodeAt(i) === 34) {
          if (text.charCodeAt(i + 1) !== 34) break;
          ++i;
        }
      }
      I = i + 2;
      var c = text.charCodeAt(i + 1);
      if (c === 13) {
        eol = true;
        if (text.charCodeAt(i + 2) === 10) ++I;
      } else if (c === 10) {
        eol = true;
      }
      return text.slice(j + 1, i).replace(/""/g, '"');
    }
    while (I < N) {
      var c = text.charCodeAt(I++), k = 1;
      if (c === 10) eol = true; else if (c === 13) {
        eol = true;
        if (text.charCodeAt(I) === 10) ++I, ++k;
      } else if (c !== delimiterCode) continue;
      return text.slice(j, I - k);
    }
    return text.slice(j);
  }
  while ((t = token()) !== EOF) {
    var a = [];
    while (t !== EOL && t !== EOF) {
      a.push(t);
      t = token();
    }
    if (f && (a = f(a, n++)) == null) continue;
    rows.push(a);
  }
  return (rows);
};

formatCSV = function (rows) {
  if (Array.isArray(rows[0])) return formatRows(rows);
  var fieldSet = new d3Set(), fields = [];
  rows.forEach(function (row) {
    for (var field in row) {
      console.log(" field " + field);
      if (!fieldSet.has(field)) {
        fields.push(fieldSet.add(field));
      }
    }
  });
  return [fields.map(formatValue).join(delimiter)].concat(rows.map(function (row) {
    return fields.map(function (field) {
      return formatValue(row[field]);
    }).join(delimiter);
  })).join("\n");
};


formatRows = function (rows) {
  return rows.map(formatRow).join("\n");
};
function formatRow(row) {
  return row.map(formatValue).join(delimiter);
}
var reFormat = new RegExp('["' + delimiter + "\n]");
function formatValue(text) {
  return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
}

set = function (array) {
  var set = new d3Set();
  if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
  return set;
};
var d3_map_proto = "__proto__", d3_map_zero = "\x00";

let d3Set = class d3Set {

  constructor() {
    this._ = Object.create(null);
  }

  get(key) {
    return this._[d3_map_escape(key)];
  }
  set(key, value) {
    return this._[d3_map_escape(key)] = value;
  }

  add(key) {
    this._[key] = true;
    return key;
  }
  remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  keys(key) {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  has(key) {
    return d3_map_escape(key) in this._;
  }
  values() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  empty() {
    for (var key in this._) return false;
    return true;
  }

  d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }

}
function d3_map_escape(key) {
  return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
}
function d3_map_has(key) {
  return d3_map_escape(key) in this._;
}
function d3_map_remove(key) {
  return (key = d3_map_escape(key)) in this._ && delete this._[key];
}
function d3_map_keys() {
  var keys = [];
  for (var key in this._) keys.push(d3_map_unescape(key));
  return keys;
}
function d3_map_size() {
  var size = 0;
  for (var key in this._) ++size;
  return size;
}
function d3_map_empty() {
  for (var key in this._) return false;
  return true;
}

async function getjson(url) {
  // console.log ( ' update ' + url );
  return await lion_engine.GETJSON(url);
}

function sequenceToHELM(seq) {
  seq = seq.trim();
  let chars = seq.split('');
  let helm = "";
  for (let c of chars) {
    helm += "d(" + c + ")p";
    helm += ".";
  }
  if (helm.endsWith(".")) {
    helm = helm.substring(0, helm.length - 1);
  }
  // remove the dangling phosphate 
  if (helm.endsWith("p")) {
    helm = helm.substring(0, helm.length - 1);
  }
  if (helm != null && helm.length > 0) {
    helm = "RNA1{" + helm + "}$$$$";
  }
  return helm;
}

IONIS = class IONIS {
}
IONIS.IO = {
  save(file, json_object) {
    let fs = lion_engine.getIonisFS();
    if (fs == null || fs['root'] == null) {
      console.log(" no filesystem defined.. will not save ");
      return;
    }
    let root = fs['root'];
    if (!root.endsWith('/')) {
      root = root + '/';
    }
    let js = {
      "bucket": "isis-temp",
      "path": root + file,
      "data": JSON.stringify(json_object),
      "overwrite": true
    };
    POSTJSON(js, 'http://ionprod:8000/files/s3putfile')
  }
}

var MSGraph = (function (require) {
  console.log('msgraph get client')
  function MSGraph() {
  }
  MSGraph.createWordDoc = () => {
    return lion_engine.createObject('docx');
  }
  MSGraph.getAccessToken = () => {
    return lion_engine.getAccessToken();
  }
  MSGraph.isLoggedIn = () => {
    if (lion_engine.getAccessToken() != null || lion_engine.getAccessToken().lenght() > 0)
      return true;
    else
      return false;
  }
  MSGraph.getClient = (config) => {
    return lion_engine.createObject('msgraph', config);
  }
  MSGraph.getFGClient = () => {
    let config = {
      'scope': ['User.Read', 'Files.Read', 'Files.ReadWrite', 'Files.ReadWrite.All', 'Sites.Read.All',
        'Sites.ReadWrite.All',
        'https://graph.microsoft.com/Sites.ReadWrite.All']
    }

    return lion_engine.createObject('msgraph', config)
  }

  return MSGraph;
})();


function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  // return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
  return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
}

function setAppTitle(title) {
  document.title = title;
}



// Buffer = class Buffer {
// }
// Buffer.from = (objectJSONStr) => {
//   return lion_engine.bufferFrom(objectJSONStr)
// }


let EngineMonitor = class EngineMonitor {
  msg = '';
  listenerFunction

  constructor(listenerFunction) {
    this.listenerFunction = listenerFunction;
  }

   getMSG() {
    return msg;
  }
  setMSG(msg) {
    this.msg = msg;
    if (this.listenerFunction) {
      this.listenerFunction(this.msg);
    }
  }
}