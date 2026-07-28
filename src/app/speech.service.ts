import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private speechRecognizer: SpeechSDK.SpeechRecognizer;
  private recognizer: SpeechSDK.SpeechRecognizer;
  private isRecognitionActive: boolean = false;


  private recognizedTextSubject = new Subject<string>();
  audioConfig: SpeechSDK.AudioConfig;
  speechConfig: SpeechSDK.SpeechConfig;
  constructor() {

    this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription('9c282bbd4ec94e31b8cdf55af1a05144', 'eastus');
    this.audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig);


    // const speechConfig = SpeechSDK.SpeechConfig.fromSubscription('9c282bbd4ec94e31b8cdf55af1a05144', 'eastus');
    // const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    // this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);



    this.recognizer.sessionStarted = (s, e) => {
      this.isRecognitionActive = true;
    };

    this.speechConfig.speechRecognitionLanguage = 'en-US';
    this.speechRecognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig);



    this.recognizer.sessionStopped = (s, e) => {
      this.isRecognitionActive = false;
    };

  }
  startRecognition(listener) {
    if (!this.isRecognitionActive) {
      this.recognizer.recognizeOnceAsync(result => {
        console.log(`Recognized: ${result.text}`);
        listener(result.text, false)
        // this.recognizer.close();
      }, err => {
        console.error(err);
        this.recognizer.close();
        this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig);

      });
    } else {
      console.log('Recognition is already active.');
    }
  }

  isRecognitionOn(): boolean {
    return this.isRecognitionActive;
  }
  getRecognizedTextObservable() {
    return this.recognizedTextSubject.asObservable();
  }
}
