



export class IAttachment {

    alternateId:string;
    capGroupName:string;
    capGroupSMILES:string;
    id:number;
    label:string;

    constructor(altid:string)
    {
        this.alternateId = altid;
    }
}
export class IMonomer {
    molfile: string;
    id: number;
    canSMILES: string;
    naturalAnalog: string;
    alternateId: string;
    symbol: string;
    name: string;
    monomerType: string;
    polymerType: string;
    primary_citation:string = "";
    attachmentList: IAttachment[];
}

export class IonisMonomer {

    endcapID: string;
    sugarId: string;
    het_id: string;
    linkerId: string;
    monomerid: number;
    monomer: IMonomer;
    ispublic:boolean;
    
}

export class MonomerLibraryItem {
    monomer:IonisMonomer;
    id:number;
}
