import {
    AfterViewInit,
    Directive,
    ElementRef,
    HostBinding,
    Input,
    OnDestroy,
    Renderer2,
    RendererFactory2
  } from '@angular/core';
  import { fromEvent, Subscription } from 'rxjs';
  import { debounceTime, throttleTime } from 'rxjs/operators';
  
  
  @Directive({
    selector: '[fluidHeight]',
  })
  export class FluidHeightDirective implements AfterViewInit, OnDestroy {
    @Input() minHeight: number;
    @Input('fluidHeight') topOffset: number;
    @HostBinding('style.overflow-y') overflowY = 'auto';
  
    private domElement: HTMLElement;
    private resizeSub: Subscription;
    renderer: Renderer2;
    

    constructor(private rendererFactory: RendererFactory2, private elementRef: ElementRef) {
      // get ref HTML element 
      this.domElement = this.elementRef.nativeElement as HTMLElement;
      this.renderer = this.rendererFactory.createRenderer ( null, null )  
      // register on window resize event
      this.resizeSub = fromEvent(window, 'resize')
        .pipe(throttleTime(1500), debounceTime(50))
        .subscribe(() => this.setHeight());
    }
  
    ngAfterViewInit() {

      this.setHeight();
    //   window.addEventListener('resize', this.resize)

    }


    // resize() {
    //     // this.width = window.innerWidth;
    //     let height = window.innerHeight;
    //     console.log ( ' jhe4ight ' + height )
    //     this.renderer.setStyle(this.domElement, 'height', `${height}px`);

    //   }

  
    ngOnDestroy(){
      this.resizeSub.unsubscribe();
    }
  
    private setHeight() {
      const windowHeight = window?.innerHeight;
      const topOffset = this.topOffset || this.calcTopOffset();
      let height = windowHeight - topOffset - 70;
  
      if (this.minHeight && height < this.minHeight) {
        height = this.minHeight;
      }
 
    //   console.log ( " hight height " + height )
    this.renderer.setStyle(this.domElement, 'height', `${height}px`);
    this.renderer.setStyle(this.domElement, 'overflow', `hidden`);
}
  
    private calcTopOffset(): number {
      try {
        const rect = this.domElement.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
  
        return rect.top + scrollTop;
      } catch (e) {
        return 0;
      }
    }
  }
  