import { HttpBackend } from "@angular/common/http";
import { ElementRef, ViewContainerRef } from "@angular/core";
import { ComponentFactoryResolver, TemplateRef, ViewChild } from "@angular/core";
import {
    OnInit,
    Component,
    Input
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { environment } from "../../environments/environment";
import { FunctionUtil } from "../functions/function-util";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";
import { PubDirective } from "./pub.directive";
import { WidgetFactory } from "../widget-factory";

@Component({
    selector: 'publish-app',
    templateUrl: './publish-app.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class PublishAppComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    initData: any = '';
    save_function: any = null;
    visibility: string = 'Hide';
    status = "working";
    button_label = "Commit";
    resolveFunction;
    git_status;
    git_show;
    git_tags;
    input_annotation;
    input_version;


    @ViewChild(PubDirective, { static: false }) compService: PubDirective;
    mark_release: boolean = false;

    constructor(
        httpb: HttpBackend,
        private doms: DomSanitizer,
        private componentFactoryResolver: ComponentFactoryResolver,
        private function_util: FunctionUtil,
        private viewContainerRef: ViewContainerRef
    ) {

    }
    formateTime(t) {
        if (t == null || t.length <= 0) {
            return ''
        }
        let temp = t.split('T')[0]
        temp += '      ' + t.split('T')[1]
        return temp;
    }
    clearComponents() {
        if (this.compService != null && this.compService.viewContainerRef != null) {
            let viewContainerRef = this.compService.viewContainerRef;
            viewContainerRef.clear();
        }
        // if (this.compService2 != null && this.compService2.viewContainerRef != null) {
        //     let viewContainerRef = this.compService2.viewContainerRef;
        //     viewContainerRef.clear();
        // }
    }



    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }
        if (this.save_function) {
            this.save_function();
        }
    }

    branches;

    async checkoutBranch(branch) {
        let js = {
            branch: branch
        }
        let fo = await FunctionUtil.POSTJSON(js, environment.git_checkout);
        this.branches = await FunctionUtil.POSTJSON(js, environment.git_branches);
        let statusObj = {}
        this.git_status = await FunctionUtil.POSTJSON(statusObj, environment.git_status);
        this.git_tags = await FunctionUtil.GETJSON(environment.git_tags)
        this.git_show = await FunctionUtil.GETJSON(environment.git_show + "?commits=HEAD")
        this.clearComponents();
    }
    
    save_release () {
        this.mark_release = true;
    }


    public test(v) {
        alert(v);
    }

    async tag() {
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let js = {
            annotation: this.input_annotation + '__' + date,
            version: this.input_version
        }
        let rs = await FunctionUtil.POSTJSON(js, environment.git_tag_release)
        this.git_tags = await FunctionUtil.GETJSON(environment.git_tags)
        this.mark_release = false;

    }

    ngOnInit(): void {
        let js = {}
        FunctionUtil.POSTJSON(js, environment.git_branches).then(async (functionObject) => {
            // this.branches = JSON.stringify(functionObject);

            this.branches = functionObject;
            this.git_tags = await FunctionUtil.GETJSON(environment.git_tags)
            let statusObj = {}
            this.git_status = await FunctionUtil.POSTJSON(statusObj, environment.git_status);
            this.git_show = await FunctionUtil.GETJSON(environment.git_show + "?commits=HEAD")

            // this.clearComponents();
            // this.loadWidget({
            //     wid: 'json',
            //     data: JSON.stringify(this.git_tags)
            // }, null)



        });


    }


    // this is the new way and more general way for loading a widget
    loadWidget(wid: {}, resolve) {
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
        let componentRef = this.viewContainerRef.createComponent(componentFactory);
        if (line != undefined) (<PubComponent>componentRef.instance).data = line;
        (<PubComponent>componentRef.instance).resolveFunction = resolve;
        (<PubComponent>componentRef.instance).title = title;
        (<PubComponent>componentRef.instance).init(null);



        
    }





    ngAfterViewInit(): void {
    }


    init(): string {
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        if (this.data != null) {
            this.save_function = this.data['save-function'];
            this.title = this.data['title'];
            this.button_label = this.data['label'];
        }
        return '';
    }
}