
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../onedrive/auth.service';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { ViewSDKClient } from './pdf-viewer-support';

@Component({
    selector: 'pdf-viewer',
    templateUrl: './pdf-viewer.component.html',
    styleUrls: ['./pdf-viewer.component.css']
})
export class PDFViewer implements PubComponent, OnInit {
    constructor(private viewSDKClient: ViewSDKClient, private sanitized: DomSanitizer, private msgraph: AuthService) { }
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    clientId: "09ea7a2b1f2a4ac8bdc32c83c09a4c70";
    divId: "adobe-dc-view"
    @Input() fileItem;
    pv = {
        content: { location: { url: "https://documentcloud.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf" } },
        metaData: { fileName: "test" }
    }

    init(): string {
        return ''
    }

    ngOnInit(): void {
        if (this.data != null) {
            if (this.data['file'] != null) {
                this.fileItem = this.data['file']
            }
        }
        this.previewFile();
    }

    async previewFile() {
        // content: { promise: Promise.resolve(blob.arrayBuffer()) },
        let client = await this.msgraph.getClient();
        let content_path = `/drives/${this.fileItem.parentReference.driveId}/items/${this.fileItem.id}`;
        client
            .api(content_path)
            .select("content.downloadUrl")
            .get()
            .then((res) => {
                console.log(res['@microsoft.graph.downloadUrl'])
                fetch(res['@microsoft.graph.downloadUrl'])
                    .then(rres => rres.blob()) // Gets the response and returns it as a blob
                    .then(blob => {
                        console.log(' now load the content ')
                        this.viewSDKClient.ready().then(() => {
                            this.viewSDKClient.previewFileUsingFilePromise('pdf-div', Promise.resolve(blob.arrayBuffer()), this.fileItem.name, {
                                embedMode: 'IN_LINE'
                            });
                        });


                    })
            })

    }
}