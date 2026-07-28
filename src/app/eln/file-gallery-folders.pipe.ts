
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'foldersFilter' })
export class FoldersFilter implements PipeTransform {
    transform(all: MSFile[], option) {
        if (option == 'hide' || option =='none') {
            let list = all.filter(f => (f.folder == null));
            return list;
        } else {
            return all.filter(f => (f.folder != null))
        }
    }
}

class MSFile {
    name = '';
    folder;
}
