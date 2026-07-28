export interface FileElement {
    id?: string;
    msid?:string;
    isFolder: boolean;
    name: string;
    path?:string;
    parent: string;
    lastEdited?: string;
  }
  