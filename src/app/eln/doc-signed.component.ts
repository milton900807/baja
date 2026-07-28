import {
    OnInit,
    AfterViewInit,
    Component,
    ViewChild,
    EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Output, NgModule, ElementRef, Inject, Input
} from "@angular/core";
import { FunctionUtil } from "../functions/function-util";
import { AuthService } from "../onedrive/auth.service";
import { PubComponent } from "../published-lionscript/pub-component";
import { PubComponentListener } from "../published-lionscript/pub-component-listener";
import { OAuthSettings } from "../onedrive/oath.settings";

@Component({
    selector: 'signed-doc',
    templateUrl: 'doc-signed.component.html',
    styles: [
        '.shadow-textarea textarea.form-control::placeholder { font-weight: 300;  }',
        '.shadow-textarea textarea.form-control {  padding-left: 0.8rem;    } ']
})
export class DocSignedComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    @Input() doc;
    @Input() config;
    isSigned = false;
    signedDate = new Date();
    signing = false;
    @Input()
    stamp = '';
    @Input()
    id = '';
    @Input()
    signedDoc = null;
    tenant = undefined;
    path: any;
    doneLoading = false;
    signers = {};
    showNewSigner = false;
    folderServiceAPI = '';
    loadingSigners = false;
    signers_msg = null;
    showUserName: boolean = false;
    currentUserId: any = null;
    signer_status: {} = null;
    docSentDisplayURI = null;
    @Output() fileDownload: EventEmitter<any> = new EventEmitter();



    constructor(public cd: ChangeDetectorRef, private msgraph: AuthService) {
    }

    download() {
        this.msgraph.getClient().then(async (client) => {
            let signed_doc = this.doc.name;
            signed_doc = signed_doc.substring(0, signed_doc.lastIndexOf('.'))
            let tp = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`;
            console.log(' path ' + tp)
            let doc = await client.api(tp).get();
            window.open(doc['webUrl'])

        });
    }



    async getFileVersion() {
        let client = await this.msgraph.getClient();
        let v = await client.api('/drives/' + this.doc.parentReference.driveId + '/items/' + this.doc.id + '/versions').get();
        console.log(" versions : " + JSON.stringify(v));
        let version = v['value']
        let version_stamp = version[version.length - 1]
        return ` v${version_stamp['id']} ${version_stamp['lastModifiedBy']['user']['displayName']} ${version_stamp['lastModifiedDateTime']}`;
    }



    async updateSigner(value, signerName) {
        if (value.indexOf('@') < 0) {
            value = value + '@' + this.tenant;
        }
        console.log(`id value  ${this.id}`)
        let client = await this.msgraph.getClient();
        try {
            if (value.indexOf('@') < 0) {
                let uvalue = await client.api(`/users/${value}`).get();
                signerName = uvalue['displayName']

            }
        }
        catch (exception) {


        }
        // if (userName == null || userName.length <= 0) {
        //     this.showUserName = true;
        //     this.loadingSigners = false;
        //     this.currentUserId = value;
        //     this.showNewSigner = true;
        //     return;
        // }

        // todo: 
        // 1. update the json object to accept usernames 
        // 2. updat the user interface to accept usernames where there are none.



        this.loadingSigners = true;
        let url = this.folderServiceAPI + '/' + encodeURI(`update-signer?id=${this.id}&signerEmail=${value}&signerName=${signerName}&status=pending`)
        let r = await FunctionUtil.GETJSON(url);
        this.showNewSigner = false;
        this.loadingSigners = true;
        await this.loadSigners();
        this.loadingSigners = false;

    }

    async removeUser(signer) {
        this.loadingSigners = true;
        let url = this.folderServiceAPI + '/' + encodeURI(`remove-signer?id=${this.id}&signer=${signer}`)
        console.log(' url ' + url);
        let r = await FunctionUtil.GETJSON(url);
        await this.loadSigners();
        this.loadingSigners = false;
    }



    async send(user) {

        let s = this.waitingForSigner();
        if (s != null) {

            if (s === user) {
                this.signer_status = "Resending";
                setTimeout(() => {
                    this.signer_status = null;
                }, 4000)
            }
            else {
                this.signer_status = "Waiting for " + s;
                setTimeout(() => {
                    this.signer_status = null;
                }, 4000)
                return;

            }
        }


        // this.signing = true;
        let servre = null;
        let versions = await this.getFileVersion();
        let stamp_wv = this.stamp + ' ' + versions;

        let signerName = this.signers[user]['name'];
        if (signerName == null || signerName.length == 0) {
            signerName = user;
        }
        if (window['env']['documentSignServer'] != null)
            servre = window['env']['documentSignServer']
        let client = await this.msgraph.getClient();
        let me = await client.api('/me').get();
        let sponsorEmail = me['userPrincipalName']
        let sponsorName = me['name']
        try {
            let ppath = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.parentReference.id}:/.signed`;
            let sigN = await client.api(ppath).get();
            if (sigN != null && sigN['id'] != null) {
                let signed_doc = this.doc.name;
                signed_doc = signed_doc.substring(0, signed_doc.lastIndexOf('.'))

                let listo = await client.api(`/drives/${this.doc.parentReference.driveId}/items/${sigN['id']}/children`).get();
                let list = listo.value;
                let index = 0
                let recent;
                for (let l of list) {
                    if (index === 0)
                        recent = l
                    else {
                        let c = new Date(l['lastModifiedDateTime'])
                        let b = new Date(recent['lastModifiedDateTime'])
                        if (c > b) {
                            recent = l;
                        }
                    }
                    index++;
                }
                let url = this.folderServiceAPI + '/' + encodeURI(`set-signer-status?id=${this.id}&signer=${user}&status=sent`)
                console.log(' url : ' + url);
                let r = await FunctionUtil.GETJSON(url);
                if (recent != null) {
                    let docpath = `/drives/${this.doc.parentReference.driveId}/items/${recent.id}`
                    let returnPath = `/drives/${this.doc.parentReference.driveId}/items/${sigN['id']}`
                    window.open(`${window['env']['documentSignServer']}send-for-signature?documentId=${this.id}&filePath="${docpath}"&signerEmail=${user}&signerName=${signerName}&sponsorEmail=${sponsorEmail}&sponsorName=${sponsorName}&stamp=${stamp_wv}&docSentDisplayURI=${this.docSentDisplayURI}`, "_blank")
                    // FunctionUtil.GETJSON(`${window['env']['documentSignServer']}send-for-signature?filePath="${docpath}"&signerEmail=${this.signer}&stamp=${this.stamp}&returnPath=${returnPath}`)
                    this.loadSigners();
                }
            } else {

                let path = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`
                window.open(`${window['env']['documentSignServer']}send-for-signature?documentId=${this.id}&filePath="${path}"&signerEmail=${user}&signerName=${signerName}&sponsorEmail=${sponsorEmail}&sponsorName=${sponsorName}&stamp=${stamp_wv}&docSentDisplayURI=${this.docSentDisplayURI}`, "_blank")

                let url = this.folderServiceAPI + '/' + encodeURI(`set-signer-status?id=${this.id}&signer=${user}&status=sent`)
                console.log(' url : ' + url);
                let r = await FunctionUtil.GETJSON(url);
                this.loadSigners();


                // FunctionUtil.GETJSON(`${window['env']['documentSignServer']}send-for-signature?filePath="${path}"&signerEmail=${this.signer}&stamp=${this.stamp}`)
            }
        } catch (exc) {
            let url = this.folderServiceAPI + '/' + encodeURI(`set-signer-status?id=${this.id}&signer=${user}&status=sent`)
            console.log(' url : ' + url);
            let path = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`
            window.open(`${window['env']['documentSignServer']}send-for-signature?documentId=${this.id}&filePath="${path}"&signerEmail=${user}&signerName=${signerName}&sponsorEmail=${sponsorEmail}&sponsorName=${sponsorName}&stamp=${stamp_wv}&docSentDisplayURI=${this.docSentDisplayURI}`, "_blank")
            let r = await FunctionUtil.GETJSON(url);
            this.loadSigners();

            // FunctionUtil.GETJSON(`${window['env']['documentSignServer']}send-for-signature?filePath="${path}"&signerEmail=${this.signer}&stamp=${this.stamp}`)
        }


    }

    getSignerStatus(signer) {

        return this.signers[signer]['status']

    }


    async checkStatus(signer) {
        let sign_status = this.config['folderServiceAPI'] + `/get-status?id=${this.id}&signer=${signer}`;
        let r = await FunctionUtil.GETJSON(sign_status);
        if (r == null || Object.keys(r).length === 0) {
            this.signers_msg = "No status available";
        }
        else {
            this.signer_status = r["status"];
            if (this.signer_status != null) {
                setTimeout(() => {
                    this.signer_status = null;
                }, 3000)
            }
        }
    }
    async downloadEnvelope(signer) {

        this.doneLoading = false;
        this.loadingSigners = true;
        setTimeout(async () => {
            await this.loadSigners();
            this.loadingSigners = false;
            this.doneLoading = true;

        }, 2500)


        let sign_status = this.config['folderServiceAPI'] + `/get-status?id=${this.id}&signer=${signer}`;
        let r = await FunctionUtil.GETJSON(sign_status);
        if (r == null || Object.keys(r).length === 0) {
            this.signers_msg = "No status available";
        }
        else {
            let envID = r['envelopeId']
            if (envID === undefined || envID == null || envID.length == 0) {
                this.signer_status = "Not signed yet."
                setTimeout(() => {
                    this.signer_status = null;
                }, 3000)
                return;
            }
            let versions = await this.getFileVersion();
            let stamp_wv = this.stamp + ' ' + versions;

            let path = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`
            window.open(`${window['env']['documentSignServer']}download-envelope?envelopeId=${envID}&filePath=${path}&stamp=${stamp_wv}&signer=${signer}`, "_blank")


            setTimeout(() => {
                this.loadSigners();
                this.fileDownload.emit(path);
            }, 5000)


        }
    }



    async loadSigners() {
        let sign_status = this.config['folderServiceAPI'] + `/list-signers?id=${this.id}`;
        let r = await FunctionUtil.GETJSON(sign_status);
        if (r == null || Object.keys(r).length === 0) {
            this.signers_msg = "No assigned signers.";
        } else {
            let obj = r['signed']
            if (obj != null) {
                let obj2 = r['signed']['signers']
                this.signers = obj2;
                // console.log(Object.keys(this.signers).length + " signers : " + JSON.stringify(this.signers))
                if (Object.keys(this.signers).length === 0) {
                    this.isSigned = false;
                } else {
                    let foundAll = true;
                    for (let o of Object.keys(this.signers)) {
                        console.log(this.signers[o])
                        if (this.signers[o]['status'] != null || this.signers[o]['status'].toLowerCase() != 'complete') {
                            foundAll = false;
                        }
                    }
                    this.isSigned = foundAll;
                }
            }
            this.signers_msg = null;
        }
        this.showNewSigner = false;
        this.doneLoading = true;

    }

    file_menu() {

    }

    getSignStatus(key) {

        return this.signers[key]['status']
    }


    getSignerKeys() {
        if (this.signers != null) {
            return Object.keys(this.signers)
        }
        else {
            return null;
        }
    }



    addSigner() {
        this.showNewSigner = true;

    }

    async ngOnInit() {
        this.initData = '';
        if (this.data['path'] != null) {
            this.path = this.data['path']
        }
        if (this.data['config'] != null) {
            this.config = this.data['config']
        }
        if (this.data['stamp'] != null) {
            this.stamp = this.data['stamp']
        }

        if (this.config != null) {
            this.tenant = this.config['tenant']
            this.docSentDisplayURI = this.config['docSentDisplayURI']
        }
        this.msgraph.getClient().then(async (client) => {
            if (this.path != null && this.doc == null) {
                this.doc = await client.api(this.path).get();
            }
            // let user = await client.api('/me').get();

            // this.signer = user.userPrincipalName;
            if (this.doc != null) {
                let fname = this.doc.name;
                if (fname.indexOf('.') > 0) {
                    fname = this.doc.name.substring(0, this.doc.name.lastIndexOf('.'))
                }
                try {
                    let hasSigned = false;
                    let listo = await client.api(`/drives/${this.doc.parentReference.driveId}/items/${this.doc.parentReference.id}/children`).get();
                    let list = listo.value;
                    for (let l of list) {
                        if (l.name === '.signed')
                            hasSigned = true;
                    }
                    if (hasSigned) {
                        let ppath = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.parentReference.id}:/.signed`;
                        let client = await this.msgraph.getClient();
                        let sigN = await client.api(ppath).get();
                        let res = await client.api(this.doc.parentReference.path + '/.signed:/children').get();
                        let listo = await client.api(`/drives/${this.doc.parentReference.driveId}/items/${sigN['id']}/children`).get();
                        let list = listo.value;
                        let index = 0
                        let recent;
                        for (let l of list) {
                            if (index === 0)
                                recent = l
                            else {
                                let c = new Date(l['lastModifiedDateTime'])
                                let b = new Date(recent['lastModifiedDateTime'])
                                if (c < b) {
                                    recent = l;
                                }
                            }
                            index++;
                        }
                        console.log(" recent " + recent['name'])
                        if (Object.keys(this.signers).length === 0) {
                            this.isSigned = false;
                        } else {
                            let foundAll = true;
                            for (let o of Object.keys(this.signers)) {
                                if (this.signers[o]['status'].toLowerCase() != 'complete') {
                                    foundAll = false;
                                }
                            }
                            this.isSigned = foundAll;
                        }

                        this.doneLoading = true;
                    }
                } catch (e) {

                    this.doneLoading = true;
                    console.log(' exception : ' + e)
                }

            }
        });
        // we should have an folderServiceAPI object so we can load information about the document signging status
        if (this.config['folderServiceAPI'] != null) {
            this.folderServiceAPI = this.config['folderServiceAPI']
            this.loadingSigners = true;
            await this.loadSigners();
            this.loadingSigners = false;
        }
    }
    resolveFunction;
    apply(value: string) {
        if (this.resolveFunction) {
            // console.log ( " value " + value );
            // this.resolveFunction ( value );
        }
    }
    setLogText(logText): void {
        this.data = logText;
    }
    setVis(): void {
        if (this.visibility == 'Show') {
            this.visibility = "Hide";

        } else {
            this.visibility = "Show";
        }
    }

    getSigners() {
        return this.signers;
    }


    waitingForSigner() {
        for (let o of Object.keys(this.signers)) {
            console.log(this.signers[o])
            if (this.signers[o]['status'] != null && this.signers[o]['status'].toLowerCase() === 'sent') {
                return o;
            }
        }
        return null;
    }



    async sign() {
        let s = this.waitingForSigner();
        if (s != null) {
            this.signer_status = "Waiting for " + s;
            setTimeout(() => {
                this.signer_status = null;
            }, 4000)
            return;
        }


        let versions = await this.getFileVersion();
        let stamp_wv = this.stamp + ' ' + versions;
        this.signing = true;
        let servre = null;
        if (window['env']['documentSignServer'] != null)
            servre = window['env']['documentSignServer']
        let ppath = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.parentReference.id}:/.signed`;
        let client = await this.msgraph.getClient();
        let me = await client.api('/me').get();
        let signerName = me['displayName']
        let email = me['mail']
        try {
            let sigN = await client.api(ppath).get();
            if (sigN != null && sigN['id'] != null) {
                let signed_doc = this.doc.name;
                signed_doc = signed_doc.substring(0, signed_doc.lastIndexOf('.'))

                let listo = await client.api(`/drives/${this.doc.parentReference.driveId}/items/${sigN['id']}/children`).get();
                let list = listo.value;
                let index = 0
                let recent;
                for (let l of list) {
                    if (index === 0)
                        recent = l
                    else {
                        let c = new Date(l['lastModifiedDateTime'])
                        let b = new Date(recent['lastModifiedDateTime'])
                        if (c > b) {
                            recent = l;
                        }
                    }
                    index++;
                }
                if (recent != null) {
                    let docpath = `/drives/${this.doc.parentReference.driveId}/items/${recent.id}`
                    let returnPath = `/drives/${this.doc.parentReference.driveId}/items/${sigN['id']}`
                    window.open(`${window['env']['documentSignServer']}?filePath="${docpath}"&signerEmail=${email}&signerName=${signerName}&stamp=${stamp_wv}&returnPath=${returnPath}`,
                        "_blank")
                }
            } else {
                let path = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`
                window.open(`${window['env']['documentSignServer']}?filePath="${path}"&signerEmail=${email}&signerName=${signerName}&stamp=${stamp_wv}`, "_blank")
            }
        } catch (exc) {

            let path = `/drives/${this.doc.parentReference.driveId}/items/${this.doc.id}`
            window.open(`${window['env']['documentSignServer']}?filePath="${path}"&signerEmail=${email}&signerName=${signerName}&stamp=${stamp_wv}`, "_blank")
        }

    }

    init(): string {
        this.resolveFunction(this);
        // console.log ( " resolving function " );
        return 'complete';
    }
    append(v: string): void {
        this.data += v;
    }

    exportToCsv(file_name) {
        let keys = Object.keys(this.data[0]);
        var options = {
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalseparator: '.',
            showLabels: true,
            showTitle: false,
            useBom: false,
            headers: keys
        };
        // new Angular2Csv(this.data, file_name, options);
    }
}