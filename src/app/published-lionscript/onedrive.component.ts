import {
    OnInit,
    Component,
    Input
} from "@angular/core";
import { PubComponent } from "./pub-component";
import { AuthService } from "../onedrive/auth.service";
import { MSDocService } from "../onedrive/ms-doc-service";
import { Client } from '@microsoft/microsoft-graph-client/lib/src';
import { PubComponentListener } from "./pub-component-listener";

@Component({
    selector: 'ondrive-panel',
    templateUrl: './onedrive-component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class OneDriveComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any;
    @Input() title: string;
    login = false;



    constructor(private auth: AuthService, private msDoc: MSDocService) {

    }

    ngOnInit(): void {

        this.testMSDoc ();

        this.auth.login(this.config).then(b => {
            this.login = b;
            this.getClient().then(client => {
                this.resolveFunction(client);
            })
        });


    }
    initData: any = '';
    save_function: any = null;
    visibility: string = 'Hide';
    status = "working";
    button_label = "Commit";
    resolveFunction;
    api_list = [];
    config = null;

    apply(value: string) {
        if (this.listener) {
            this.listener.update("value", value);
        }
        if (this.save_function) {
            this.save_function();
        }
    }
    init(): string {
        if (this.data != null) {
            let config = this.data['config'];
            if (config != null) {
                this.config = config;
            }
        }
        return '';
    }
    test(): string {
        return 'hello world';
    }

    testMSDoc ()
    {
        this.msDoc.dev();
    }

    signOut() {
        this.auth.signOut();
    }
    getClient() : Promise<Client> {
        return this.auth.getClient();
    }
}