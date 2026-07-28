/**
 * Created by jmilton on 6/1/2016.
 */


import { IMonomer, IonisMonomer } from "../db/monomerdb";
import { Hit } from "../db/hit";

export interface MonomerManagerListener {

    updateSelectedStructure ( ionisMon : IMonomer, msg:string ) : void;
    updateSelectedSubstructureList ( substructureList:Hit[] ) : void;
}