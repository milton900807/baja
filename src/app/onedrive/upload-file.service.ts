import { FileUpload, LargeFileUploadTask, OneDriveLargeFileUploadTask, UploadResult } from '@microsoft/microsoft-graph-client/lib/src';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';


@Injectable()
export class UploadFileOneDrive {


    constructor(
        private msgraph: AuthService
    ) {

    }


    async fileUpload(file, path, listener) {
        return new Promise(async (resolve, reject) => {
            let client = await this.msgraph.getClient();
            debugger;
            if (client) {
                try {
                    console.log(" ------------------------------------------------------- ")
                    let response = await this.largeFileUpload(client, file, path, listener);
                    // console.log(file.name + "---Uploaded Successfully---");
                    listener(file.size, file.size, file.size, response['_responseBody']['id']);
                    resolve(response)


                } catch (error) {
                    console.error(error);
                    resolve(error);
                }
            } else {
                listener ( file )

            }
        });

    }

    async largeFileUpload(client, file, path, listener) {
        try {

            let size = file.size;
            let options = {
                fileName: file.name,
                path: path,
                rangeSize: 1024 * 1024,
                uploadEventHandlers: {
                    progress: (range, e) => {
                        if (range.minValue) {
                            console.log(' status ' + range.minValue / size * 100)
                            listener(range.minValue, range.maxValue, file.size)
                        }
                        console.log(`Uploaded ${range?.minValue} to ${range?.maxValue}`);
                    }
                }
            }
            if (!path.endsWith(':/')) {
                path = path + ':/'
            }
            let requestUrl = path + "".split("/").map(function (p) { return encodeURIComponent(p); })
                .join("/") + encodeURIComponent(file.name) + ":/createUploadSession";
            console.log(' request url ' + requestUrl);
            const _fileObject = new FileUpload(file, file.name, file.size);
            let session = await LargeFileUploadTask.createUploadSession(client, requestUrl, _fileObject)
            const task = await new LargeFileUploadTask(client, _fileObject, session, options);
            let re = await task.upload();
            return re;
        } catch (err) {
            throw err;
        }
    }

}
