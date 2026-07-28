import { Component, OnInit, ViewChild, ComponentFactoryResolver, AfterViewInit, AfterContentInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpServiceHelper } from './httpservicehelper';
import { NaviDirective, FoldersDirective, INode } from './navi.directive';
import { SimpleNodeComponent } from './simple-node.component';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';

@Component({
  selector: 'link-nav',
  templateUrl: './link-nav.component.html',
  styleUrls: ['./link-nav.component.scss']
})
export class LinkNavigationComponent implements OnInit, AfterViewInit, PubComponent {
  data: any;
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  menu: null;
  @ViewChild(NaviDirective, { static: false })
  private compService: NaviDirective;
  @ViewChild(FoldersDirective, { static: false })
  private foldersService: FoldersDirective;
  mode = 'select'
  root: INode = null;
  link = '';
  canAddFolders = false;
  message = null;
  selectNodeActionFunction: any;

  constructor( private componentFactoryResolver: ComponentFactoryResolver,
    private httpService: HttpServiceHelper, private msgraph: AuthService) {
  }

  init(): string {
    if (this.data != null) {
    }
    this.title = ' Hello World '
    return '';
  }


  setRoot(root) {
    let v = root['children']
    if (v != null && v.length > 0) {
      for (let i of v) {
        this.add(i)
      }
    }
    this.buildTreeStructureFromDrives();
  }

  async buildTreeStructureFromDrives() {
    this.msgraph.getClient().then(async (client) => {
      try {
        let path = '/me/drive/root:/' + this.root.name;
        let vi = await client.api(path).get();
        this.root.onedriveID = vi['id']
        // if (this.selectNodeActionFunction != null) {
          // this.root.selectFunctions.push(this.selectNodeActionFunction);
        // }
        this.root.refresh(client);
      } catch (excpetion) {
        console.log(' experiment was not found : ' + excpetion)
      }
    })
  }

  ngAfterViewInit(): void {
    if (this.data != null) {
      let root = this.data['root']
      let val = this.data['config']

      let fun = this.data['selectNodeFunction']
      if (fun != null) {
        this.selectNodeActionFunction = fun;
      }


      if (val != null) {
        let caf = val['canAddFolders']
        if (caf != null) {
          this.canAddFolders = caf;
        }



        let mode = this.data['mode']
        if (mode != null) {
          this.mode = 'select'
        }
      }
      if (root != null) {
        this.setRoot(root);
      }
    }
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
  }

  getTree() {
    return this.root;
  }


  // // this is the new way and more general way for loading a widget 
  // addFolder(node) {
  //   let pubcomp = SimpleNodeComponent;
  //   let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
  //   let viewContainerRef = this.foldersService.viewContainerRef;
  //   let componentRef = viewContainerRef.createComponent(componentFactory);
  //   let inode = (<INode>componentRef.instance);
  //   inode.name = node['name'];
  //   if (node['children'] != null) {
  //     inode.setChildren(node['children'])
  //   }
  //   this.root = inode;
  // }

  // this is the new way and more general way for loading a widget 
  add(node) {
    let pubcomp = SimpleNodeComponent;
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(pubcomp);
    let viewContainerRef = this.compService.viewContainerRef;
    let componentRef = viewContainerRef.createComponent(componentFactory);
    let inode = (<SimpleNodeComponent>componentRef.instance);
    inode.name = node['name'];
    inode.canAddFolders = this.canAddFolders;
    inode.addSelectFunction(this.selectNodeActionFunction);

    if (node['children'] != null) {
      inode.setChildren(node['children'])
    }
    this.root = inode;
  }
  ngOnChanges() {
  }
  ngDoCheck() {
  }
  ngOnInit() {
    // if (this.resolveFunction) {
    //   this.resolveFunction(this);
    // }
  }
}