import { Injectable } from '@angular/core';
import { IMonomer } from './monomerdb';

@Injectable()
export class MonomerDB {
    monomers: IMonomer[];


    saveMonomer(_monomer: IMonomer) {
        console.log(" saving monomer " + _monomer.name);
    }

    public getMonomers(polymer_type: string, monomer_type: string): IMonomer[] {

        if (polymer_type && monomer_type) {
            let mlist = new Array<IMonomer>();
            for (let m of this.monomers) {
                if (m.polymerType.toUpperCase() === polymer_type && m.monomerType.toUpperCase() === monomer_type.toUpperCase()) {
                    mlist.push(m);
                }
            }
            return mlist;

        }
        else if (polymer_type) {
            let mlist = new Array<IMonomer>();
            for (let m of this.monomers) {
                if (m.polymerType.toUpperCase() === polymer_type.toUpperCase()) {
                    mlist.push(m);
                }
            }
            return mlist;
        } else {
            return this.monomers;
        }
    }




    public getCount(): number {
        if (this.monomers) {
            return this.monomers.length;
        }
        else {
            return 0;
        }
    }


    public getMonomer(helmid: string): IMonomer {

        for (var mon of this.monomers) {
            if (mon.alternateId == helmid) {
                return mon;
            }
        }
        return null;

    }

}
