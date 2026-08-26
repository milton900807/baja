// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

let host = '--'

host = window['env']['apiUrl']




export const environment = {
  production: true,
  ionworks_publish_bucket: "ionworks",
  // ionworks_publish_bucket: 'ioniscript',
  save_file_to_s3: host + "/files/s3putdata",
  exec_py: host + "/py",
  read_py: host + "/py-out/read",
  file_bug: host + "/file-bug",
  bug_attachment: host + "/bug-attachment",
  get_helm_rule: host + "/get-script",
  get_script_url: host + "/script",
  apps_version_url: host + "/apps-version",
  devEnvironment: host + "/get-dev-script",
  load_script_for_category: host + "/get-package",
  devEnvironmentPackage: host + "/get-dev-package",
  save_script: host + "/save-script",
  save_dev_script: host + "/save-dev-script",
  delete_script: host + "/lionrest/delete",
  s3load_js: host + "/files/s3download",
  s3savejs: host + "/files/s3upload",
  commit_code: host + "/commit",
  stash_code: host + "/stash-file",
  revert_code: host + "/revert-file",
  git_branches: host + "/list-branches",
  git_branch: host + "/git-branch",
  git_checkout: host + "/checkout",
  git_status: host + "/git-status",
  git_show: host + "/git-show",
  git_tags: host + "/git-tags",
  git_tag_release: host + "/git-tag-release", 
  git_add: host + "/git-add", 
  git_reset: host + "/git-reset",
  tempfile: host + "/tempfile",


  monomer_lib_url:"http://900807:8000/files/s3getjson?bucket=isis-monomer-library&path=ionis_fields.json", 
  monomer_lib_url_id:"http://900807:8984/monomer_library/load_monomer", 
  generate_fingerprint:"http://900807:8984/structure/generate_fingerprint",
  monomer_lib_unique_check:"http://900807:8984/monomer_library/test_unique_monomer_id",
    // public static generate_fingerprint :string = URLs.host+'/structure_search/generate_fingerprint';
  generate_morgan_fingerprint:"http://900807:8984/structure/generate_morgan_fingerprint", 
  generate_canonical_smiles: "http://900807:8984/structure/generate_canonical_smiles",
  search_by_canonical_smiles: "http://900807:8984/monomer_library/search_by_canonical_smiles",
  search_by_morgan_fingerprint: "http://900807:8984/monomer_library/search_by_morgan_fingerprint", 
  search_by_fingerprint: "http://900807:8984/monomer_library/search_by_fingerprint", 
  monomer_lib_save_url:"http://900807:8984/monomer_library/save",
  monomer_lib_download_public_monomers_url:"http://900807:8984/chem/download_sdf?", 
  substructureurl:"",
};
