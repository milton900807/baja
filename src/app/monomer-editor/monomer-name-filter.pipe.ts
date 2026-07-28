/**
 * Created by jmilton on 6/7/2016.
 */
import {Pipe} from "@angular/core";
import { IMonomer } from "../db/monomerdb";

@Pipe({
    name: "monomer_name_filter"

})
export class MonomerNameFilter {
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


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.name.toLowerCase() === term.toLowerCase() ) {

                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.name.toLowerCase().indexOf(term.toLowerCase())==0) {
                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }


        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.name.toLowerCase().indexOf(term.toLowerCase())>=0) {
                if (ex_list.indexOf(exp) < 0) {
                    ex_list[index] = exp;
                    index++;
                }
            } else {
            }
        }
        for (var i = 0; i < value.length; i++) {
            var exp = value[i];
            if (exp.symbol.toLowerCase().indexOf(term.toLowerCase())>=0) {
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