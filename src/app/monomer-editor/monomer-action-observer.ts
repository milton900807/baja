import { IMonomer, IonisMonomer } from "../db/monomerdb";

export interface MonomerActionObserver {
    action_successful (monomer:IMonomer, msg:string): void;
    action_failed (monomer:IMonomer): void;
}