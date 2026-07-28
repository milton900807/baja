import { Pipe } from "@angular/core";

@Pipe({
    name: "titlenamepipe"
})
export class TitlePipe {
    transform(value: string, term) {
        if (value != null) {
            if (value.toUpperCase() === 'BUTTON') {
                return '';
            }
            return value;
        }
        return '';
    }

}