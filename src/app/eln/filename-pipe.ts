
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileicon' })
export class FileIcons implements PipeTransform {
    s = 2;
    transform(file: any) {

        if (file.folder != null) {
            return '/assets/img/icons/png/folder.png'
        }

        let filename = file.name;

        if (filename.endsWith('doc') ||
            filename.endsWith('docx')) {
            if (filename.startsWith("EXP-"))
                // return '/assets/img/icons/png/experiment-summary.png'
                // return '/assets/img/icons/manifest.svg'
                return '/assets/img/icons/png/clipboard-2x.png'
            else
                return '/assets/img/icons/png/file-' + this.s + 'x.png'
        } else if ( filename.endsWith ( '.json')){
            return '/assets/img/icons/png/layers-2x.png'
        } else if ( filename.endsWith ( '.screen') ){
            return '/assets/img/icons/png/code-2x.png'
        }
        else {
            return '/assets/img/icons/png/file-2x.png'
        }
    }
}