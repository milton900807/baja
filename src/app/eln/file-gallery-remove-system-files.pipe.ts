
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'removeSystemFiles' })
export class RemoveSystemFiles implements PipeTransform {
    transform(all: MSFile[], directory_name) {
        if ( all == undefined )
        {
            return [];
        }
        let list = all.filter(f => (!f.name.startsWith('.')));
        list = list.filter(f => (f.name !== directory_name + '.docx'))
        list = list.filter(f => (f.name !== directory_name + '-metadata.xlsx'))
        return list;
    }
}

class MSFile {
    name = '';
}
