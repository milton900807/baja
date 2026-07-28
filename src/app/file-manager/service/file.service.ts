import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { FileElement } from '../model/element';

export interface IFileService {
  add(fileElement: FileElement);
  delete(id: string);
  update(id: string, update: Partial<FileElement>);
  queryInFolder(folderId: string): Observable<FileElement[]>;
  get(id: string): FileElement;
}

@Injectable()
export class FileService implements IFileService {
  public map = new Map<string, FileElement>();


  add(fileElement: FileElement) {
    // fileElement.id = v4();
    let objg = this.map.keys();
    // console.log ( ' map keys ' + this.map.keys() +  " -- file element " + fileElement.name )
    for (let o in objg) {
      let object = this.map.get(o);
      console.log ( " -- object  " + object.name )
      if (object.name === fileElement.name) {
        
      }
    }

    


    this.map.set(fileElement.id, this.clone(fileElement));
    return fileElement;
  }

  delete(id: string) {
    this.map.delete(id);
  }

  update(id: string, update: Partial<FileElement>) {


    debugger;


    if (this.map.get(update.id)) {
      return;
    }


    let objg = this.map.keys();
    for (let o in objg) {
      let object = this.map.get(o);
      console.log( ' update name : ' + object.name );
      if (object.name === update.name) {
        return;
      }
    }
    let element = this.map.get(id);
    element = Object.assign(element, update); 


    this.map.set(element.id, element);
  }

  private querySubject: BehaviorSubject<FileElement[]>;
  queryInFolder(folderId: string) {
    let result: FileElement[] = [];
    this.map.forEach(element => {
      if (element.parent === folderId) {
        result.push(this.clone(element));
      }
    });
    result.sort((a, b) => a.name.localeCompare(b.name))
    if (!this.querySubject) {
      this.querySubject = new BehaviorSubject(result);
    } else {
      this.querySubject.next(result);
    }
    return this.querySubject.asObservable();
  }

  get(id: string) {
    return this.map.get(id);
  }

  clone(element: FileElement) {
    return JSON.parse(JSON.stringify(element));
  }
}
