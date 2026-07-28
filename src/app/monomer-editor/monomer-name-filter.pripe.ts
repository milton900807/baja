
/**
 * Created by jmilton on 6/7/2016.
 */
import {Pipe} from "@angular/core";
import { IMonomer, IonisMonomer } from "../db/monomerdb";

@Pipe({
    name: "monomer_filter"

})
export class MonomerFilter {
    transform(value:IMonomer[], term) {
        if (value != null) {
            if (!term) {
                return value;
            }
            if (term == '') {
                return value;
            }
            return this.lookForOtherShit ( value, term);


            // return value;
        }

        return value;

    }

    lookForOtherShit(value:IMonomer[], term:string) {
        var ex_list:IMonomer[] = [];
        var index:number = 0;

        if( term == '' || term.length<= 0 || term == 'undefined')
        {
            return value;
        }


        //if (term == 'public') {
        //    return this.publicStructures(value);
        //} else if (term == 'private') {
        //    return this.privateStructures(value);
        //}
        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.symbol == term ) {
                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.symbol.indexOf(term)==0) {
                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.symbol.indexOf(term)>=0) {
                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }
        return ex_list;
    }


    isInt(value):Boolean {
        return !isNaN(value) &&
            parseInt(value) == value && !isNaN(parseInt(value, 10));
    }

}