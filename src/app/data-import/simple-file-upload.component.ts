import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PubComponent } from '../published-lionscript/pub-component';
import { IoniScriptManager } from '../engine/io-manager';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';
import { LionEngine } from '../engine/io-engine';

@Component({
    selector: 'simple-file-upload',
    templateUrl: './simple-file-upload.component.html',
    styleUrls: ['./simple-file-upload.component.css']
})


export class SimpleFileDropComponent implements OnInit, OnChanges, PubComponent {
    selectedFile: File | null = null;
    selectedFileName: string | null = null;

    constructor(private http: HttpClient) { }
    data: any;
    listener: PubComponentListener;
    resolveFunction: any;
    title: string;
    fileFunction;


    init(ionEngine: IoniScriptManager): string {


        return '';

    }
    ngOnChanges(changes: SimpleChanges): void {

    }
    ngOnInit(): void {


        if (this.data != null) {
            if (this.data['fileFunction']) {
                this.fileFunction = LionEngine.ionfunctions[this.data['fileFunction']]
            }
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.selectedFileName = this.selectedFile.name;
        }
    }

    onUpload(): void {
        if (!this.selectedFile) {
            alert('Please select a file before uploading.');
            return;
        }


        if ( this.fileFunction ) {
            this.fileFunction ( this.selectedFile )
        }

        // const formData = new FormData();
        // formData.append('file', this.selectedFile);

    }
}
