/**
 * Created by jmilton on 6/7/2016.
 */
import {Component, Output, Input, EventEmitter} from '@angular/core';
@Component ({
    selector: 'filter-monomers',
    template: '',
    // template: `

    //         <hr>
    //         </div>
    //         `,
})
export class FilterMonomers{
    @Output()
    public update = new EventEmitter();
    @Output()
    public update_name = new EventEmitter();
    @Output()
    public ispublic = new EventEmitter();
    @Input()
    substructureList:Array<string>;

    ngOnInit ()
    {
        this.update.emit('');
        this.update_name.emit('');
        this.ispublic.emit('');
    }
    updateFilter ( fv : string, v : any) : void {
        this.update.emit ( fv );
        this.ispublic.emit ( v );
    }
    updateNameFilter ( fv : string, v : any) : void {
        this.update_name.emit ( fv );
        this.ispublic.emit ( v );
    }
    go(v:any) : void {

        this.ispublic.emit ( v );

    }




}