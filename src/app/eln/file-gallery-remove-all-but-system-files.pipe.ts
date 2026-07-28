
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'removeAllButSystemFiles' })
export class RemoveAllButSystemFiles implements PipeTransform {
    transform(all: MSFile[], directory_name) {
        if ( all == null || all == undefined || all.length <=0)
        {
            return []
        }
        let list = all.filter(f => (f.name == directory_name + '.docx') || (f.name == directory_name + '-metadata.xlsx'))
        return list;
    }
}

class MSFile {
    name = '';
}
