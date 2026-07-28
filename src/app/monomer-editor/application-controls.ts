/**
 * Created by jmilton on 5/24/2016.
 */

import { Injectable } from "@angular/core";

export interface AppListener {

    newMonomer():void;
}

 @Injectable()
export class ApplicationControls {
    listeners:AppListener[] = [];
    notifyOfNewMonomerState():void{
        for ( var l in this.listeners ){
            this.listeners[l].newMonomer();
        }
    }
    public addListener ( apl:AppListener ){
        this.listeners.push( apl );
    }
}