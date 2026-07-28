import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { PubComponentListener } from './pub-component-listener';
import { PubComponent } from './pub-component';
import { LionEngine } from '../engine/io-engine';
@Component({
  selector: 'web-cam',
  templateUrl: './webcamera.component.html',
  styleUrls: ['./webcamera.component.scss'],
})
export class WebCameraComponent implements OnInit, PubComponent {
  ionfunction: any;
  @Input() listener: PubComponentListener;
  @Input() data: any;
  @Input() title: string;


  ngOnInit(): void {
  }
  initData: any = '';
  save_function: any = null;
  visibility: string = 'Hide';
  status = "working";
  button_label = "Commit";
  resolveFunction;
  apply(value: string) {
    if (this.listener) {
      this.listener.update("value", value);
    }

    if (this.save_function) {
      this.save_function();
    }
    if (this.ionfunction) {
      this.ionfunction(value)
    }
  }
  init(): string {
    if (this.resolveFunction) {
      this.resolveFunction(this);
    }
    if (this.data != null) {
      this.save_function = this.data['save-function'];
      if (this.data['ionfunction'])
        this.ionfunction = LionEngine.ionfunctions[this.data['ionfunction']];
      if (this.data['imageListener'])
        this.ionfunction = LionEngine.ionfunctions[this.data['imageListener']];
      this.title = this.data['title'];
      this.button_label = this.data['label'];
      this.button_label = this.data['button'];
    }

    return '';
  }

  private trigger: Subject<any> = new Subject();
  public webcamImage!: WebcamImage;
  private nextWebcam: Subject<any> = new Subject();
  sysImage = '';
  public getSnapshot(): void {
    this.trigger.next(void 0);
  }
  public captureImg(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.sysImage = webcamImage!.imageAsDataUrl;
    if (this.ionfunction) {
      this.ionfunction(this.sysImage)
    }

  }
  public get invokeObservable(): Observable<any> {
    return this.trigger.asObservable();
  }
  public get nextWebcamObservable(): Observable<any> {
    return this.nextWebcam.asObservable();
  }
}