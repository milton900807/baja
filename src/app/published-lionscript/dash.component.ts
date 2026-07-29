import {
  OnInit,
  Component,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  ComponentFactoryResolver,
  Input,
  AfterViewInit,
  OnDestroy,
  NgZone,
  Inject,
  HostListener,
} from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpBackend,
} from "@angular/common/http";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { FormGroup, FormBuilder } from "@angular/forms";
import { PubDirective } from "./pub.directive";
import { PubComponent } from "./pub-component";
import { SimpleProfileComponent } from "./simple-profile.component";
import { OKPanel } from "./okpanel.component";
import { SpacerComponent } from "./spacer-component";
import { WidgetFactory } from "../widget-factory";
import { RunButton } from "./run-button.component";
import { Runnable } from "./runnable-object";
import { IoniScript } from "./ioniscript";
import {
  IoniScriptEngine,
  LionEngine,
  RunStatus,
} from "../engine/io-engine";
import { IoniScriptDB } from "../engine/io-db";
import { IoniScriptFile } from "../engine/lion-file";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../../environments/environment";
import { FunctionUtil } from "../functions/function-util";
import { AuthService } from "../onedrive/auth.service";
import { PubModalDirective } from "./pub-modal.directive";
// import { Document, Paragraph } from 'docx';

import { OAuthSettings } from "../onedrive/oath.settings";
import { PubComponentListener } from "./pub-component-listener";
import { IoniScriptManager } from "../engine/io-manager";
import { UploadFileOneDrive } from "../onedrive/upload-file.service";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog'
import { Renderer2, RendererFactory2 } from '@angular/core';
import { SpeechService } from "../speech.service";




@Component({
  selector: "lion-app",
  templateUrl: "./dash.component.html",
  styleUrls: ["./dash.component.css"],
})
export class LionAppComponent
  implements
  OnInit,
  IoniScriptManager,
  AfterViewInit,
  Runnable,
  OnDestroy,
  PubComponent {
  // PubComponent stuff
  data: any;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  footerConfig: any;
  footer: string;
  width: number;
  height: number;
  renderer: Renderer2;
  private fileCache = new Map<string, Promise<any>>();
  private fileValueCache = new Map<string, any>();






  /**
   * Makes a component created in the main dashboard ViewContainerRef fill the
   * complete dashboard. An ng-template is only an insertion anchor, so sizing
   * must be applied to the generated component's host element.
   */
  private maximizeDashboardComponentHost(componentRef: any): void {
    if (
      componentRef == null ||
      componentRef.location == null ||
      componentRef.location.nativeElement == null
    ) {
      return;
    }

    const hostElement =
      componentRef.location.nativeElement as HTMLElement;

    this.renderer.setStyle(hostElement, "display", "flex");
    this.renderer.setStyle(hostElement, "flex-direction", "column");
    this.renderer.setStyle(hostElement, "flex", "1 1 0");
    this.renderer.setStyle(hostElement, "align-self", "stretch");
    this.renderer.setStyle(hostElement, "width", "100%");
    this.renderer.setStyle(hostElement, "height", "100%");
    this.renderer.setStyle(hostElement, "min-width", "0");
    this.renderer.setStyle(hostElement, "min-height", "0");
    this.renderer.setStyle(hostElement, "margin", "0");
    this.renderer.setStyle(hostElement, "padding", "0");
  }

  init(): string {
    return "";
  }

  evalExec(exec_string: any): void {
    this.run(exec_string);
  }
  ngOnDestroy(): void {
    this.engine.clearThreads();

  }
  private normalizeCacheKey(path: string): string {
    return (path || "").trim();
  }

  private loadScriptCached(path: string): Promise<any> {
    const cacheKey = this.normalizeCacheKey(path);

    if (!cacheKey) {
      return Promise.reject(new Error("Cannot load empty path"));
    }

    // Fast path: resolved value already cached
    if (this.fileValueCache.has(cacheKey)) {
      return Promise.resolve(this.fileValueCache.get(cacheKey));
    }

    // Reuse in-flight request
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey)!;
    }

    const request = this.function_util.loadScriptFromDB(cacheKey)
      .then((result) => {
        this.fileValueCache.set(cacheKey, result);
        return result;
      })
      .catch((err) => {
        // Important: don't permanently cache failures
        this.fileCache.delete(cacheKey);
        throw err;
      });

    this.fileCache.set(cacheKey, request);
    return request;
  }

  private invalidateFileCache(path?: string): void {
    if (!path) {
      this.fileCache.clear();
      this.fileValueCache.clear();
      return;
    }

    const cacheKey = this.normalizeCacheKey(path);
    this.fileCache.delete(cacheKey);
    this.fileValueCache.delete(cacheKey);
  }

  private applySelectedRule(r: any): void {
    this.selected_rule = new IoniScript();
    this.selected_rule.rule_value = FunctionUtil.removeComments(r["rule_value"]);
    this.selected_rule.rule_type = r["rule_type"];
    this.selected_rule.rule_name = r["rule_name"];
  }
  promptForInput(action: UserInputListener, inputType: string): void {
    throw new Error("Method not implemented.");
  }
  showFile(lf: IoniScriptFile) {
    throw new Error("Method not implemented.");
  }

  async showInputItem(title): Promise<{}> {
    let j = {
      wid: "input-textfield",
      data: { "button-label": "next" },
    };
    return this.showWidget(j);
  }

  async showInputTextArea(title: any): Promise<{}> {
    throw new Error("Method not implemented.");
  }

  displaySVG(url: any, json: any): Promise<string> {
    throw new Error("Method not implemented.");
  }
  headers: Headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
  });



  helm: any;
  display_rule_navigator = true;
  display_app: SafeUrl;
  display_app_title;
  display_app_guid;
  show_code_f = false;
  show_code_button = false;
  user_id: string;
  rules: IoniScript[];
  @Input()
  selected_rule: IoniScript;
  @Input()
  rule: string;
  @Input()
  args: any[];
  // @Input()
  // show_list = true;
  // // @ViewChild("app_frame", { static: false })
  // app_frame: ElementRef;
  @Input()
  show_controls = true;
  save_msg: string;
  rule_name: string = "";
  list_rule_input_text: string = "";
  input_param: {};
  input_param_label: {};
  input_labels: string[];
  code: string = 'function x() {\nconsole.log("Hello world!");\n}';
  editorOptions = {
    theme: "vs",
    language: "javascript",
    fontSize: "11",
    minimap: { enabled: false },
  };
  input_action_list: Array<InputAction> = new Array<InputAction>();
  general_message = "";
  file_message = null;
  progress: string;
  file_dropped_path: string;
  header_text_for_drop_window = "file";
  file_operation;
  text_area_window_form: FormGroup;
  okPanel_action: string;
  okPanel_action_text: string;
  // comp_list: PubComponent[];
  run_count = 0;
  widgets: {};
  @ViewChild(PubDirective, { static: false }) compService: PubDirective;
  @ViewChild(PubDirective, { static: false }) footerService: PubDirective;
  widres = {};
  init_rule: string = null;
  show_data_ = false;
  selected_data: any = null;

  @Input()
  argument_map = {};
  @Input()
  ionworks = false;

  layout = "default";

  @ViewChild("modal_directive", { static: false })
  modal_directive;
  modal_directive_ref;

  @ViewChild("input_param_text_window", { static: false })
  input_param_panel;


  topNavBar = null;
  menuConfig = null;
  showSideMenu = true;

  showStack = true;
  callLog = [];
  http: HttpClient;
  recognizedText: string;


  constructor(
    httpb: HttpBackend,
    private ref: ChangeDetectorRef,
    private engine: IoniScriptEngine,
    private ruledb: IoniScriptDB,
    private parentRouter: Router,
    private doms: DomSanitizer,
    private componentFactoryResolver: ComponentFactoryResolver,
    private function_util: FunctionUtil,
    private auth: AuthService,
    private fileIO: UploadFileOneDrive,
    private zone: NgZone,
    private dialog: MatDialog,
    private renderererFactory: RendererFactory2,
    private speechService: SpeechService,
    private cdr: ChangeDetectorRef
  ) {
    this.renderer = this.renderererFactory.createRenderer(null, null);

    let temp: string = parentRouter.url;
    this.http = new HttpClient(httpb);

    const loadAndApplyRule = (path: string) => {
      this.loadScriptCached(path).then((r) => {
        this.selected_rule = new IoniScript();
        this.selected_rule.rule_value = FunctionUtil.removeComments(r["rule_value"]);
        this.selected_rule.rule_type = r["rule_type"];
        this.selected_rule.rule_name = r["rule_name"];
      });
    };


    if (
      this.ionworks ||
      temp.endsWith("/ionworks") ||
      temp.endsWith("/revolucion")
    ) {
      this.ionworks = true;
      console.log("************** ****************");
    } else {
      function extractPathFromUrl(urlString) {
        try {
          const url = new URL("http://localhost" + urlString);
          return url.searchParams.get("path");
        } catch (e) {
          console.error("Invalid URL:", e.message);
          return null;
        }
      }

      function isLastNodeLtf(urlString) {
        try {
          const url = new URL(urlString, "http://localhost");
          const pathname = url.pathname;
          const segments = pathname.split("/").filter(Boolean);
          const lastSegment = segments[segments.length - 1];
          return lastSegment && lastSegment.toLowerCase().endsWith(".ltf");
        } catch (e) {
          console.error("Invalid URL:", e.message);
          return false;
        }
      }

      const lt = isLastNodeLtf(temp);
      if (lt) {
      }

      if (temp === "/" || temp === "" || temp.trim() === "app" || temp.startsWith("books") || temp.startsWith('/#state')) {
        temp = window["env"]["init"];
      }

      let parsePath = (path) => {
        if (typeof path !== "string" || path.length === 0) {
          return { firstElement: null, email: null, afterEmail: null };
        }
        const segments = path.split("/").filter((segment) => segment.length > 0);
        const firstElement = segments[0] || null;
        const email = segments.length > 1 ? segments[1] : null;
        const afterEmail = segments.length > 2 ? segments.slice(2).join("/") : null;
        return { firstElement, email, afterEmail };
      };






      if (temp.startsWith("/books/")) {
        loadAndApplyRule("ljl/share");
        this.argument_map = {
          'path': '15f6ec086b1f9ba44f97a73447ac83a004ab605507199c9ce2bfc6ccd5994c12/publish/test.pdf'
        }


      } else {



        let elnindex = temp.indexOf("app/");
        const prefixlength = 4
        let vindex = temp.startsWith("/open/");

        if (elnindex >= 0) {
          let appindex = elnindex
          let end_root_index = temp.length;
          if (appindex > 0) {
            let argmap = this.parseArguments(temp);
            this.argument_map = argmap;



            debugger;
            let i = temp.indexOf("?");
            if (i > 0) {
              temp = temp.substring(0, i);
              end_root_index = temp.lastIndexOf("/");
            } else {
              if (temp.endsWith("/")) {
                temp = temp.substring(0, temp.length - 1);
              }
              end_root_index = temp.lastIndexOf("/");
            }

            let path = temp.substring(appindex + prefixlength);

            if (path.indexOf("#") > 0) {
              path = path.substring(0, path.indexOf("#"));
            }
            loadAndApplyRule(path);
          }
        } else if (vindex) {
          let open_index = temp.indexOf("open/");
          temp = "path=" + temp.substring(open_index + 4) + "&config=quiet";
          let argmap = this.parseArguments(temp);
          this.argument_map = argmap;

          loadAndApplyRule("/cpd/init");
        } else {
          let end_root_index = temp.length;
          let argmap = this.parseArguments(temp);
          this.argument_map = argmap;

          let i = temp.indexOf("?");
          if (i > 0) {
            temp = temp.substring(0, i);
            end_root_index = temp.lastIndexOf("/");
          } else {
            if (temp.endsWith("/")) {
              temp = temp.substring(0, temp.length - 1);
            }
            end_root_index = temp.lastIndexOf("/");
          }

          let path = temp;

          if (path.indexOf("#") > 0) {
            path = path.substring(0, path.indexOf("#"));
          }

          console.log(" path : " + path);

          const keyword = "view";
          const parts = path.split(keyword);

          if (parts.length > 1) {
            let root = parts[1].replace(/^\/+/, "");
            this.argument_map = { path: "/users/public/" + root };
            let tp = "cpd/init";
            loadAndApplyRule(tp);
          } else {
            let p = parsePath(path);

            if (p.firstElement === "edit") {
              path = p.afterEmail;
              this.argument_map = { path: p.email + "/" + p.afterEmail };
              loadAndApplyRule("/cpd/init");
            }

            console.log(" __unk path " + path);
            return;
          }

          loadAndApplyRule(path);
        }
      }
    }
  }

  save(path: string, name: string, type: string, rule: string, input: string, callback: Function) {
    this.engine.save(path, name, type, rule, input, callback);
  }

  getExecLog() {
    return IoniScriptEngine.execLog;
  }
  clearFunctionStackLog() {
    IoniScriptEngine.execLog = [];
  }

  showFooter(footerConfig): Promise<string> {
    this.footerConfig = footerConfig;
    // this.showFooterWidget(footerConfig);
    return new Promise((resolve, reject) => {
      if (this.footerConfig != null) this.footer = 'showFooter';
      else {
        this.footer = "default";
      }
      resolve("done");
    });
  }
  isLoggedIn() {
    return true;
    // return this.auth.authenticated;
  }

  create_new_file(event) {
    console.log(' event ' + event.which)
  }


  logout() {
    this.auth.logout();
  }
  login() {
    this.auth.login({ scope: "profile" });
  }

  showNavbar(topNavBarConfig: any): Promise<{}> {
    this.topNavBar = topNavBarConfig;
    return new Promise((resolve, reject) => {
      if (this.menuConfig != null) this.layout = "eln-container";
      else {
        this.layout = "default";
      }
      resolve("done");
    });

  }
  clearMenu(): Promise<string> {
    this.menuConfig = null;
    return new Promise((resolve, reject) => {
      resolve("done");
    });

  }


  showMenu(menuConfig: any): Promise<{}> {
    this.menuConfig = menuConfig;
    return new Promise((resolve, reject) => {
      resolve("done");
    });
  }

  parseArguments(url) {
    let argmap = {};
    let index = url.indexOf("?");
    let str = url.substring(index + 1);
    let args = str.split("&");
    for (let a of args) {
      let v = a.split("=");
      argmap[v[0]] = v[1];
    }
    return argmap;
  }

  input_text: string;
  input_text_title: string;
  input_text_modal_panel;
  async showInputParamPair(title, inputs: string[]): Promise<{}> {
    this.input_param = {};

    if (
      this.argument_map != null &&
      Object.keys(this.argument_map).length > 0
    ) {
      for (let inp of inputs) {
        inp = inp.trim();
        let value = this.argument_map[inp];
        if (value != null) {
          this.input_param[inp] = value;
        }
      }
    }

    // if (
    //   Object.keys(this.input_param).length == inputs.length ||
    //   inputs == null ||
    //   inputs.length == 0
    // ) {
    this.input_text = "Complete";
    return new Promise((resolve, reject) => {
      resolve(this.input_param);
    });
    // } else {
    //   this.input_text_title = title;
    //   this.input_text = null;
    //   this.input_labels = inputs;
    //   let ip = {};

    //   for (let np of this.input_labels) {
    //     ip[np] = "";
    //   }
    //   this.input_param = ip;
    // this.showModal({
    //   wid: 'input-param-items',
    //   data: {
    //     input_labels: inputs,
    //     buttons: []
    //   }
    // })
    // return this.input_param;
    // }
  }



  startRecognition(listener) {
    this.speechService.startRecognition(listener);
    LionEngine.exec_log = [];
  }

  run(function_string) {
    // console.log("----------------------- function string : " + function_string);
    let path = [];
    if (function_string.startsWith("exec")) {
      let f = function_string.indexOf("(");
      let g = function_string.lastIndexOf(")");
      let pathparm = function_string.substring(f + 1, g);
      let apath = pathparm.split(",");
      if (apath[0].startsWith('"')) {
        apath[0] = apath[0].substring(1, apath[0].length - 1);
      }
      path = apath;
    }
    console.log(' -------------------------------------------------------------------------------   ');
    console.log(" path " + path);
    // this.callLog.push ( path )
    let p = path[0];
    // ok this is a bit messed up.. need to re-think this.
    if (p === this.rule) {
      return this.exec(p);
    } else {
      let funargs = [];
      for (let i = 1; i < path.length; i++) funargs.push(path[i]);
      let it = p.indexOf("/");
      if (it > 0) {
        let l = new LionEngine(
          this.ruledb,
          this.http,
          this.function_util,
          this,
          this.engine,
          this.renderer,
          this.componentFactoryResolver, this.zone
        );
        const ruleName = this.selected_rule.rule_type + '/' + this.selected_rule.rule_name;
        this.callLog.push(ruleName)

        return l.exec(p, funargs);
      }
    }
  }




  @HostListener('window:resize', ['$event'])
  onResize() {

    this.zone.run(() => {


    })

  }



  resize() {
    // console.log(' jhe4ight ' + this.height)
    this.width = window.innerWidth;
    this.height = window.innerHeight;

  }

  ngAfterViewInit(): void {
    // window.addEventListener('resize', this.resize)
    let it = setInterval(() => {
      if (this.selected_rule != null && this.compService != null) {
        this.test();
        clearInterval(it);
      }
    }, 100);
  }

  getIonisFS(): any {
    let t = this.user_id;
    if (this.selected_rule != null) {
      t = t + "/" + this.selected_rule.rule_name;
    }
    let r = {
      root: t,
    };
    return r;
  }

  getAccessToken(): string {
    return OAuthSettings.access_token;
  }

  createObject(object_type, object_config): Promise<any> {
    if (object_type === "msgraph") {
      return new Promise((resolve, reject) => {

        return resolve(this.auth.getClient());

        // this.auth.login(object_config).then((b) => {
        // this.auth.getClient().then((client) => {
        //   resolve(client);
        // });
        // });
      });
    } else if (object_type === "msgraph_fg") {
      // return new Promise((resolve, reject) => {
      //   this.auth.getFGClient().then((client) => {
      //     resolve(client);
      //   });
      // });
      return null;
    } else if (object_type === "docx") {
      return new Promise((resolve, reject) => {
        resolve('doc');
      });
    } else if (object_type == 'fileio') {
      return new Promise((resolve, reject) => {
        resolve(this.fileIO);
      })
    }
    return new Promise((resolve, reject) => {
      resolve("hello world");
    });
  }

  setIonisFS() { }




  loadWidget(wid: any, resolve: any) {
    let type = wid["wid"];

    if (type == null) {
      type = wid["type"];
    }

    let line = wid["input"];
    const title = wid["title"];

    if (line == null) {
      line = wid["data"];
    }

    if (wid["componentRef"] === "testing") {
      debugger;
    }

    const pubcomp = WidgetFactory.createWidget(type);
    const viewContainerRef =
      this.compService.viewContainerRef;

    const componentRef =
      viewContainerRef.createComponent(pubcomp);

    const instance =
      componentRef.instance as PubComponent;

    const hostElement =
      componentRef.location.nativeElement as HTMLElement;

    /*
     * Canvas widgets and widgets with fillParent: true
     * should occupy the complete dashboard.
     */
    const shouldFillParent =
      wid["fillParent"] === true ||
      type === "canvas" ||
      hostElement.tagName.toLowerCase() === "app-canvas";

    /*
     * Assign the widget data before init().
     */
    if (line != null) {
      instance.data = line;
    }

    instance.resolveFunction = resolve;
    instance.title = title;

    /*
     * Initialize exactly once.
     */
    instance.init(this);

    /*
     * Apply full-parent layout after init() so initialization
     * cannot overwrite the final size.
     */
    if (shouldFillParent) {
      this.fillWidgetHost(componentRef);

      window.requestAnimationFrame(() => {
        const parentElement = hostElement.parentElement;
        const resizableInstance = instance as any;

        if (
          parentElement &&
          typeof resizableInstance.setSize === "function"
        ) {
          const parentRect =
            parentElement.getBoundingClientRect();

          resizableInstance.setSize(
            parentRect.width,
            parentRect.height
          );
        }
      });
    }

    /*
     * Save the widget by its optional ID.
     */
    if (wid["id"] != null) {
      if (this.widgets == null) {
        this.widgets = {};
      }

      this.widgets[wid["id"]] = {
        instance,
        wid: type
      };
    }

    /*
     * Connect RunButton widgets to the parent engine.
     */
    if (
      wid["wid"] === "run" ||
      wid["type"] === "run"
    ) {
      (instance as RunButton).parent_engine = this;
    }

    /*
     * Save an optional external component reference.
     */
    if (wid["componentRef"] != null) {
      LionEngine.componentRefs[wid["componentRef"]] = {
        viewContainerRef,
        components: [instance]
      };

      this.zone.run(() => { });
    }

    /*
     * Call the optional component callback.
     */
    if (wid["refCallback"] != null) {
      LionEngine.ionfunctions[wid["refCallback"]](
        instance
      );
    }

    return instance;
  }

  private fillWidgetHost(componentRef: any): void {
    const hostElement =
      componentRef?.location?.nativeElement as HTMLElement;

    if (!hostElement) {
      return;
    }

    const parentElement = hostElement.parentElement;

    if (!parentElement) {
      return;
    }

    parentElement.style.setProperty(
      "position",
      "relative",
      "important"
    );
    parentElement.style.setProperty(
      "width",
      "100%",
      "important"
    );
    parentElement.style.setProperty(
      "height",
      "100%",
      "important"
    );
    parentElement.style.setProperty(
      "min-width",
      "0",
      "important"
    );
    parentElement.style.setProperty(
      "min-height",
      "0",
      "important"
    );
    parentElement.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );

    hostElement.style.setProperty(
      "position",
      "absolute",
      "important"
    );
    hostElement.style.setProperty(
      "inset",
      "0",
      "important"
    );
    hostElement.style.setProperty(
      "display",
      "flex",
      "important"
    );
    hostElement.style.setProperty(
      "flex-direction",
      "column",
      "important"
    );
    hostElement.style.setProperty(
      "box-sizing",
      "border-box",
      "important"
    );
    hostElement.style.setProperty(
      "width",
      "100%",
      "important"
    );
    hostElement.style.setProperty(
      "height",
      "100%",
      "important"
    );
    hostElement.style.setProperty(
      "min-width",
      "0",
      "important"
    );
    hostElement.style.setProperty(
      "min-height",
      "0",
      "important"
    );
    hostElement.style.setProperty(
      "margin",
      "0",
      "important"
    );
    hostElement.style.setProperty(
      "padding",
      "0",
      "important"
    );
    hostElement.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );
  }
  // this is the new way and more general way for loading a widget
  loadFooterWidget(wid: {}, resolve) {
    let type = wid["wid"];
    if (type == null) type = wid["type"];

    let line = wid["input"];
    let title = wid["title"];
    if (line == undefined || line == null) {
      line = wid["data"];
    }
    let pubcomp = WidgetFactory.createWidget(type);
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      pubcomp
    );
    let viewContainerRef = this.footerService.viewContainerRef;
    let componentRef = viewContainerRef.createComponent(componentFactory);
    if (line != undefined) (<PubComponent>componentRef.instance).data = line;
    (<PubComponent>componentRef.instance).resolveFunction = resolve;
    (<PubComponent>componentRef.instance).title = title;
    (<PubComponent>componentRef.instance).init(this);
    if (wid["id"] != undefined) {
      if (this.widgets == null) {
        this.widgets = {};
      }
      this.widgets[wid["id"]] = {
        instance: <PubComponent>componentRef.instance,
        wid: type,
      };
    }
    (<PubComponent>componentRef.instance).init(this);
    if (wid["wid"] === "run" || wid["type"] == "run")
      (<RunButton>componentRef.instance).parent_engine = this;
  }


  show_code(v) {
    this.show_code_f = v;
  }

  loadComponent(line: string, type: string, func) {
    if (type === "simple-text") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        SimpleProfileComponent
      );
      let viewContainerRef = this.compService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      this.maximizeDashboardComponentHost(componentRef);
      (<PubComponent>componentRef.instance).data = line;
    } else if (type === "spacer") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        SpacerComponent
      );
      let viewContainerRef = this.compService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      this.maximizeDashboardComponentHost(componentRef);
      (<PubComponent>componentRef.instance).data = line;
    } else if (type == "okpanel") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        OKPanel
      );
      let viewContainerRef = this.compService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      this.maximizeDashboardComponentHost(componentRef);
      (<PubComponent>componentRef.instance).data = line;
      (<PubComponent>componentRef.instance).listener = {
        update(value): void {
          func(value);
          if (value === "yes") {
            // viewContainerRef.clear ();
          }
        },
      };
    }
  }


  loadFooterComponent(line: string, type: string, func) {
    if (type === "simple-text") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        SimpleProfileComponent
      );
      let viewContainerRef = this.footerService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      (<PubComponent>componentRef.instance).data = line;
    } else if (type === "spacer") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        SpacerComponent
      );
      let viewContainerRef = this.footerService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      (<PubComponent>componentRef.instance).data = line;
    } else if (type == "okpanel") {
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        OKPanel
      );
      let viewContainerRef = this.footerService.viewContainerRef;
      let componentRef = viewContainerRef.createComponent(componentFactory);
      (<PubComponent>componentRef.instance).data = line;
      (<PubComponent>componentRef.instance).listener = {
        update(value): void {
          func(value);
          if (value === "yes") {
            // viewContainerRef.clear ();
          }
        },
      };
    }
  }



  clearComponents() {
    this.topNavBar = null;
    if (this.compService != null && this.compService.viewContainerRef != null) {
      let viewContainerRef = this.compService.viewContainerRef;
      viewContainerRef.clear();
    }
  }

  clearComponent(index) {
    if (this.compService != null && this.compService.viewContainerRef != null) {
      let viewContainerRef = this.compService.viewContainerRef;
      viewContainerRef.remove(index);
    }
  }

  async showOKPanel(msg: string): Promise<string> {
    this.okPanel_action = null;
    this.okPanel_action_text = msg;
    var waitForHello = (timeoutms) =>
      new Promise<string>((resolve, reject) => {
        var check = () => {
          if (this.okPanel_action != null) {
            // console.log ( ' resolving ' );
            resolve(this.okPanel_action);
          } else if ((timeoutms -= 100) < 0) reject("timed out!");
          else setTimeout(check, 10);
        };
        setTimeout(check, 10);
        this.loadComponent(msg, "okpanel", resolve);
      });
    return waitForHello(1000000);
  }

  toggleNavigator(): void {
    this.display_rule_navigator = !this.display_rule_navigator;
  }

  /**
   *  Implementation of the LIoniScriptManager
   */
  getScript(): string {
    this.selected_rule.rule_value = FunctionUtil.removeComments(this.selected_rule.rule_value);

    if (this.selected_rule) return this.selected_rule.rule_value;
    else return null;
  }
  setScript(script: string): void {
    this.selected_rule.rule_value = script;
  }

  logBlock(id: string): LogBlock {
    return {
      update(value: string) {
        console.log(" id " + id + "\t" + value);
      },
      close() { },
    };
  }

  guid = null;
  async POSTFile(file, url: string): Promise<string> {
    console.log(" file " + file.lines);
    this.guid = null;
    var headers = new Headers();
    const formData: FormData = new FormData();
    formData.append("file", file.lines);
    // headers.append('Content-Type', 'multipart/form-data');
    this.http
      .post(url, formData)
      .subscribe((response: Response) => {
        return response.json();
      })
    return this.guid;
  }

  updateProgress(pr: string): void {
    this.progress = pr;
  }

  statusChanged(st: RunStatus): void {
    if (st.msg) this.progress = st.msg;
  }

  applyParam(label, value) {
    // console.log(" label " + label + " value " + value);
    this.input_param[label] = value;
  }

  input_textarea: string;

  close(windows) {
    if (windows === "input_text_window") {
    }
    if (windows === "input_textarea_window") {
      console.log(" reset the form ");
    }
    if (windows === "input_param_text_window") {
    } else if (windows === "okPanel") {
    }
  }
  apply(windows, value) {
    if (windows === "input_text_window") {
    } else if (windows === "input_textarea_window") {
    } else if (windows === "input_param_text_window") {
    } else if (windows === "okPanel") {
    }
  }

  async displayApp(title, app): Promise<string> {
    this.helm = null;
    this.progress = " display app ";
    this.guid = null;
    // console.log(" display app " + app);
    this.display_app = this.doms.bypassSecurityTrustResourceUrl(app);
    this.display_app_title = title;
    this.display_app_guid = FunctionUtil.uuidv4();
    // this.display_app_window.open('lg');
    var waitForHello = (timeoutms) =>
      new Promise<string>((resolve, reject) => {
        var check = () => {
          if (this.display_app_guid != null) {
            resolve(this.display_app_guid);
          } else if ((timeoutms -= 100) < 0) reject("timed out!");
          else setTimeout(check, 100);
        };
        setTimeout(check, 100);
      });
    await waitForHello(124000).then(() => console.log(" done "));
    return this.display_app_guid;
  }

  logstr: string = "";
  log(line: string): void {

    console.log(line);
    this.loadComponent(line, "simple-text", null);
    // if (this.logstr.length > 100000) {
    //   this.logstr = "";
    // }
    this.logstr += line + "\n";
  }

  resetLog(): void {
    // FunctionUtil.clearCache();
    this.logstr = "";
    this.clearComponents();
  }
  getComponentCount(): Number {
    if (this.compService != null && this.compService.viewContainerRef != null) {
      let viewContainerRef = this.compService.viewContainerRef;
      return viewContainerRef.length;
    }
    return -1;
  }
  removeComponent(index): void {


    this.clearComponent(index);
  }
  ngOnInit(): any {

    this.speechService.getRecognizedTextObservable().subscribe(text => {
      this.recognizedText = text;
    });


  }
  validateListRuleInputText(): void {
    this.list_rule_input_text = "hello world";
    console.log(" validate " + this.list_rule_input_text);
  }
  onSubmit(): any { }
  onKey(val): void {
    this.user_id = val;
  }

  adjustToFileNameCharacters(str) {
    str = str.replace(/,/g, "-");
    str = str.replace(/ /g, "-");
    str = str.replace(/'/g, "-");
    str = str.replace(/"/g, "-");
    str = str.replace(/&/g, "-");
    return str;
  }

  convertToString(lines): string {
    let t = "";
    for (let line of lines) {
      t += line + "\n";
    }
    return t.trim();
  }


  fileDropped(f) { }
  codify(name): string {
    name = name.replace(/\./g, "_");
    return name;
  }
  // when the list item is selected the helm rule is added here.
  setSelectedRule(se: IoniScript) {
    this.selected_rule = null;
    this.selected_rule = se;
    this.run_count = 0;
    this.clearComponents();
  }




  updateUser(user: string) {
    return new Promise((resolve, reject) => {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        })
      };

      // this.rules = [];
      if (user != null && user.length > 0) {
        var body = JSON.stringify({ "spath": user });
        console.log(" posting to : " + environment.load_script_for_category);
        this.http.post(environment.load_script_for_category, body, httpOptions).subscribe(response => {
          if (response && response.toString().length > 0) {
            let v = response as IoniScript[];
            if (v && v.length > 0)
              this.setRules(v)
          }
        })
      }
    })
  }


  refresh_list(user: string) {
    this.updateUser(user);
  }
  refresh_all(response) {
    // this.function_name_window.close();
    this.setRules(response);
    this.updateUser(this.user_id);
  }
  setStatus(): void {
    this.refresh_list(this.user_id);
  }
  objectL = {};
  setUIObject(obj: any, objectLabel: string, objtype: string) {
    let ob = {
      type: objtype,
      label: objectLabel,
      data: obj,
    };
    this.objectL[objectLabel] = ob;
  }
  printObjects() {
    let keys = Object.keys(this.objectL);
    return keys;
  }
  showData(obj) {
    let showData = this.objectL[obj];
    this.show_data_ = true;
    this.selected_data = showData;
  }
  hideData() {
    this.selected_data = null;
    this.show_data_ = false;
  }
  showWidget(js): Promise<{}> {
    if (!js.wid && js.url != null) {
      window.location.assign(js.url);
      return new Promise((r, rr) => { })
    }
    var waitForHello = (timeoutms) =>
      new Promise<{}>(async (resolve, reject) => {
        var check = () => {
          if ((timeoutms -= 100) < 0) reject("timed out!");
          else setTimeout(check, 10);
        };
        setTimeout(check, 10);
        await this.loadWidget(js, resolve);
        this.zone.run(() => {
        })

      });


    return waitForHello(100000000);
  }
  showFooterWidget(js): Promise<{}> {
    var waitForHello = (timeoutms) =>
      new Promise<{}>((resolve, reject) => {
        var check = () => {
          if ((timeoutms -= 100) < 0) reject("timed out!");
          else setTimeout(check, 10);
        };
        setTimeout(check, 10);
        this.loadFooterWidget(js, resolve);
      });
    return waitForHello(100000000);
  }


  showModal(wid, __width, __height): Promise<{}> {
    return new Promise((resolve, reject) => {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;

      if (__height !== undefined)
        wid.height = __height;
      if (__width !== undefined)
        wid.width = __width;
      this.dialog.open(ModalContentComponent,
        {
          data: { wid: wid },
          panelClass: 'draggable-dialog'   // <-- important

        });

      console.log(" dimensions " + __width + ' x ' + __height)

      resolve(this.dialog)
    });
  }


  updateModalDimensions(__width, __height) {
    // Default maximum dimensions
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 700;

    // Query the modal content element
    const modalContent = document.querySelector('.modal-content'); // Replace with your modal content selector
    if (!modalContent) {
      console.error('Modal content not found');
      return;
    }

    // Ensure modalContent is cast to HTMLElement to access the style property
    const modalElement = modalContent as HTMLElement;

    // Calculate dimensions if width or height is null
    let calculatedWidth = modalElement.scrollWidth;
    let calculatedHeight = modalElement.scrollHeight;

    // Apply the calculated dimensions with the max constraints
    const width = __width !== null ? Math.min(__width, MAX_WIDTH) : Math.min(calculatedWidth, MAX_WIDTH);
    const height = __height !== null ? Math.min(__height, MAX_HEIGHT) : Math.min(calculatedHeight, MAX_HEIGHT);

    // Apply the dimensions to the modal
    modalElement.style.width = `${width}px`;
    modalElement.style.height = `${height}px`;

    console.log(`Modal dimensions updated: Width=${width}px, Height=${height}px`);
  }

  hideAllModal() {
    this.dialog.closeAll();

  }
  isModal() {
    if (this.dialog.openDialogs.length > 0) {
      return true;
    } else {
      return false;
    }

  }
  micOff() {
    return (!this.speechService.isRecognitionOn());
  }

  voiceToText(listener): void {
    this.startRecognition(listener);
    this.recognizedText = '';
    // let it = setInterval(() => {
    //   console.log(this.recognizedText + " mic " + this.micOff () )
    //   listener(this.recognizedText, this.micOff());

    // }, 100)
    // setTimeout(() => {
    //   clearInterval(it)
    // }, 10000)
  }
  clearWeak(): Promise<{}> {
    return new Promise((resolve, reject) => {
      if (this.compService != null && this.compService.viewContainerRef != null) {
        let viewContainerRef = this.compService.viewContainerRef;
        viewContainerRef.clear();
      }
      resolve(true)
    });
  }

  /**
   * This will run the test for helm rules.
   * @param ruletype
   * @param rule
   */
  test(): void {
    if (this.run_count > 0) {
      this.loadComponent("" + this.run_count, "spacer", null);
    }
    this.run_count++;
    const ruleType = this.selected_rule.rule_type;
    const ruleValue = this.selected_rule.rule_value;
    const path = this.selected_rule.spath + '/' + this.selected_rule.rule_name;
    if (this.engine != null) {
      this.engine.run(path, ruleType, ruleValue, this, this.argument_map);
      this.ref.markForCheck();
    }
  }
  /**
   * This will run the test for helm rules.
   * @param ruletype
   * @param rule
   */
  exec(args: any[]): void {

    LionEngine.exec_log.push(args)
    const ruleValue = FunctionUtil.removeComments(this.selected_rule.rule_value);
    // const ruleValue = this.selected_rule.rule_value;
    if (
      this.selected_rule != null &&
      (this.selected_rule.input_label == null ||
        this.selected_rule.input_label.toLocaleLowerCase() == "undefined")
    ) {
      this.selected_rule.input_label = null;
    }
    if (
      this.selected_rule != null &&
      this.selected_rule.input_label != null &&
      this.selected_rule.input_label.length > 0
    ) {
    } else {
      let resolve = function () { };
      const ruleName = this.selected_rule.rule_type + '/' + this.selected_rule.rule_name;
      this.callLog.push(ruleName)
      this.engine.exec(ruleValue, this, resolve, args);
    }
  }
  setRules(rules: IoniScript[]) {
    this.rules = rules;
    if (this.init_rule != null) {
      for (let r of this.rules) {
        if (r.rule_name.trim().toLowerCase() === this.init_rule.trim()) {
          // console.log ( " rule selected : " + r.rule_name );
          this.setSelectedRule(r);
        }
      }
    }
  }

  getUser() {
    return this.user_id;
  }

  setInitialInputActions(): void {

  }

  updateUI(ui_item_name: any, item_value: any) {
    //
    if (ui_item_name.toLocaleLowerCase() === "plot") {
    } else if (ui_item_name.toLowerCase() === "grid") {
    } else if (ui_item_name.toLowerCase() === "d3demo") {
    }
  }
}

export interface LogBlock {
  update(value: string);
  close();
}

export class UserInputListener {
  setValue(key, value) { }
}
export class ReadFromS3UserInputListener extends UserInputListener {
  constructor(private manager: IoniScriptManager) {
    super();
  }

  override setValue(key: string, val: string) {
    console.log(" the value is : " + val);
    const script = this.manager.getScript();
    const pre = " let " + key + " = readFile ( '" + val + "');\n";
    this.manager.setScript(pre + script);
  }
}

export interface ActionOb {
  exec(): void;
}
export class S3BucketInputAction implements ActionOb {
  constructor(private editorComp: IoniScriptManager) { }
  public exec(): void {
    // this.editorComp.promptForInput(
    //   new ReadFromS3UserInputListener(this.editorComp),
    //   "s3file"
    // );
  }
}

export class InputAction {
  constructor(private action: ActionOb) { }
  public exec(): void {
    this.action.exec();
  }
}
export interface FileLoadListener { }


export interface DialogData {
  wid: any;
}






@Component({
  selector: "modal-content",
  template: `
    <div class="menubar"
         cdkDrag
         cdkDragHandle
         cdkDragRootElement=".draggable-dialog .mat-mdc-dialog-surface">
      <div class="title">{{ wid?.title || '' }}</div>
      <button type="button" class="close-btn" (click)="close()" aria-label="Close">✕</button>
    </div>

    <div class="modal-body"
         [style.width]="width"
         [style.height]="height"
         style="overflow:auto;">
      <ng-template pub-modal></ng-template>
    </div>

    <div *ngIf="show_modal_close_button" class="modal-footer">
      <button mat-raised-button (click)="close()">Close</button>
    </div>
  `,
  styles: [`
    .menubar {
      user-select: none;
      cursor: move;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #263238;
      color: #fff;
      font-weight: 600;
    }
    .close-btn {
      border: none; background: transparent; color: #fff; font-size: 16px; cursor: pointer;
    }
    .modal-body { padding: 12px; background: #fff; }
    .modal-footer { padding: 8px 12px 12px; display: flex; justify-content: flex-end; }
  `]
})
export class ModalContentComponent implements OnInit {
  wid: any = {};
  engine: LionAppComponent = null;
  widComponent: any;
  show_modal_close_button = false;
  width = "300px";
  height = "500px";

  @ViewChild(PubModalDirective, { static: true }) modalComps: PubModalDirective;




  constructor(
    public dialogRef: MatDialogRef<ModalContentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData, private zone: NgZone,
  ) {

    this.wid = data.wid;
    // if ( this.wid === 'json' || (!this.wid['width']) && (!this.wid['height']) ){
    //   this.width = 500;
    //   this.height = 300;
    // }
    if (this.wid['width']) {
      this.width = this.wid['width'] + 'px';
    }
    if (this.wid['height']) {
      this.height = this.wid['height'] + 'px'
    }
  }

  ngOnInit() {


    let type = this.wid["wid"];
    if (type == null) type = this.wid["type"];
    let line = this.wid["input"];
    let title = this.wid["title"];
    if (line == undefined || line == null) {
      line = this.wid["data"];
    }
    if (this.wid['show_modal_close_button'] != null) {
      this.show_modal_close_button = this.wid['show_modal_close_button']
    }
    let pubcomp = WidgetFactory.createWidget(type);
    let vf = this.modalComps.viewContainerRef;
    if (this.wid === 'json' || (!this.wid['width']) && (!this.wid['height'])) {
      this.width = "500px";
      this.height = "300px";
    }
    let componentRef = vf.createComponent(pubcomp);
    if (line != undefined) (<PubComponent>componentRef.instance).data = line;
    // (<PubComponent>componentRef.instance).resolveFunction = resolve;
    (<PubComponent>componentRef.instance).title = title;
    (<PubComponent>componentRef.instance).init(null);
    // resolve(this);
    this.widComponent = componentRef.instance;

    console.log(" widht--- " + this.width);
    console.log(" height " + this.height);
    this.zone.run(() => {
    })
  }
  close() {

    this.dialogRef.close();


  }


}