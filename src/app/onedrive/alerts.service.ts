import { Injectable } from '@angular/core';

@Injectable(
)
export class AlertsService {

  alerts: Alert[] = [];

  add(message: string, debug: string) {
    this.alerts.push({message: message, debug: debug});
  }

  remove(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}
export class Alert {
  message: string;
  debug: string;
}