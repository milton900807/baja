import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';


@Component({
  selector: 'app-vjs-player',
  template: `

    <iframe
      id="video"
      src="/assets/video/index.html"
      style="width: 98%; height: 800px; overflow: hidden; padding: 1px;" 
      #video
      >____</iframe>

  `,
  styleUrls: [
  ],
  encapsulation: ViewEncapsulation.None,
})

export class VideoCaptureComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: true }) target: ElementRef;

  // See options: https://videojs.com/guides/options
  @Input() options: {
    fluid: boolean,
    aspectRatio: string,
    autoplay: boolean,
    sources: {
      src: string,
      type: string,
    }[],
  };
  constructor(
    private elementRef: ElementRef,
  ) { }

  // Instantiate a Video.js player OnInit
  ngOnInit() {
  }

  // Dispose the player OnDestroy
  ngOnDestroy() {
  }
}