/**
 * Created by jmilton on 6/17/2016.
 */

export interface StructureClashListener {

    structures_found ( hits:Hit[] ) : void
    
}
 export class Hit {

    symbol: string;
    hit_type: string;
    monomer_id: string;


}