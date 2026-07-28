import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'datatype' })
export class DataTypePipe implements PipeTransform {
    s = 3;
    transform(file: any) {
        let filename = file.name;
        return new Promise<string>((resolve, reject) => {
            resolve(' TIMEOUT ')
        });

    }
}