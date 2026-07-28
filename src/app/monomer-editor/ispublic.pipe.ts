/**
 * Created by jmilton on 6/13/2016.
 */
/**
 * Created by jmilton on 6/7/2016.
 */
import {Pipe} from "@angular/core";
import { IonisMonomer } from "../db/monomerdb";

@Pipe({
    name: "ispublic_filter"

})
export class IsPublicFilter {
    transform(value:IonisMonomer[], term) {
        if (value != null) {
            console.log ( ' filter ' + term);

            if (!term || term == '') {
                return value;
            }
            return this.lookForOtherShit(value, term);


            // return value;
        }

        return value;

    }

    publicStructures(value:IonisMonomer[]):IonisMonomer[] {
        var ex_list:IonisMonomer[] = [];
        var index:number = 0;
        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.ispublic) {
                ex_list[index++] = exp;
            }
        }
        return ex_list;
    }

    privateStructures(value:IonisMonomer[]):IonisMonomer[] {
        var ex_list:IonisMonomer[] = [];
        var index:number = 0;
        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (!exp.ispublic) {
                ex_list[index++] = exp;
            }
        }
        return ex_list;
    }

    lookForOtherShit(value:IonisMonomer[], term:any) {
        var ex_list:IonisMonomer[] = [];
        var index:number = 0;

        if (term == '' || term.length <= 0 || term == 'undefined') {
            return value;
        }


        if (term == true || term == 'true') {
            return this.publicStructures(value);
        }


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            ex_list[index] = exp;
            index++;
        }
        return ex_list;
    }


    isInt(value):Boolean {
        return !isNaN(value) &&
            parseInt(value) == value && !isNaN(parseInt(value, 10));
    }

}