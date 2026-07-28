
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'file_gallery_diretory_filter' })
export class FileDirectoryGalleryName implements PipeTransform {
    transform(filename: string) {
        if (filename.endsWith('doc') ||
            filename.endsWith('docx')) {
            if (filename.startsWith("IONEXP-") || filename.startsWith("EXP-"))
                return 'Experiment Summary';
        }else if ( filename.endsWith ("metadata.xlsx") && ( filename.startsWith ('IONEXP-') || filename.startsWith ('EXP-'))){
            return 'Metadata';
        } 
        return filename;
    }
}