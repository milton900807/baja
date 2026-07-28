
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'file_gallery_filter' })
export class FileGalleryName implements PipeTransform {
    transform(filename: string, foldername) {
        if (filename.endsWith('doc') ||
            filename.endsWith('docx')) {
            if (filename == foldername + '.docx')
                return 'Experiment Summary';
        }
        if (filename === foldername + '-metadata.xlsx')
            return 'Metadata';
        return filename;
    }
}