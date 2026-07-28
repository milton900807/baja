import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LionEngine } from '../engine/io-engine';
import { NavItem } from './nav-item';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})

export class MenuItemComponent implements OnInit {
  @Input() items: NavItem[];
  @ViewChild('childMenu') public childMenu;

  constructor(public router: Router) {
  }

  ngOnInit() {
  }

  click(item) {

    if (item.click) {
      item.click();
      return;
    } else {
      LionEngine.ionfunctions[item.ionfunction](item)
    }
  }

}
