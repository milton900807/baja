import { OnInit, Component, Input, ViewEncapsulation } from "@angular/core";
import { PubComponent } from "../../pub-component";
import { LionEngine } from "../../../engine/io-engine";
import { PubComponentListener } from "../../pub-component-listener";

export interface Option {
  name: string;
  value: number;
  checked: boolean;
}

@Component({
  selector: "radio-button",
  template: `
    <mat-radio-group
      class="radio-group"
      [(ngModel)]="model"
      [disabled]="disabled"
      [style.--radio-card-size.px]="buttonSize || 120"
    >
      <mat-radio-button
        *ngFor="let button of buttons"
        class="radio-button"
        [value]="button.label"
        [disabled]="disabled || button.disabled"
        (click)="update($event, button)"
        (mouseenter)="button.isHover = true"
        (mouseleave)="button.isHover = false"
        [class.hovered]="button.isHover"
        [class.no-media]="!button.svg && !button.icon"
      >
        <!-- top-left label (wraps, never overlaps radio circle) -->
        <span class="label-text label-top-left">
          {{ button.label }}
        </span>

        <!-- media -->
        <img *ngIf="button.svg" [src]="button.svg" class="svg-img" alt="" />
        <img *ngIf="!button.svg && button.icon" [src]="button.icon" class="img-icon" alt="" />

        <!-- bottom description -->
        <div class="text-block" [class.has-description]="button.description">
          <span *ngIf="button.description" class="description-text">
            {{ button.description }}
          </span>
        </div>
      </mat-radio-button>
    </mat-radio-group>
  `,
  // ✅ Use ::ng-deep for Angular Material internal structure; encapsulation None avoids fighting scoping.
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* Container */
    mat-radio-group.radio-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      width: 100%;
      margin: 8px;

      /* default size (overridden by binding) */
      --radio-card-size: 120px;

      /* reserved space for the mat radio circle + a gap */
      --radio-icon-space: 38px;
    }

    /* Card - square 1:1 ALWAYS */
    mat-radio-button.radio-button {
      display: flex !important;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;

      width: var(--radio-card-size);
      aspect-ratio: 1 / 1;     /* ✅ lock to square */
      height: auto;            /* ✅ let aspect-ratio drive height */

      min-width: var(--radio-card-size);
      min-height: unset;

      padding: 14px;

      background: #e2efff;
      border: 2px solid #c4d9ff;
      border-radius: 14px;

      box-shadow:
        0px 3px 6px rgba(0,0,0,0.10),
        0px 8px 18px rgba(70,120,200,0.18);

      transition:
        transform 0.2s ease,
        box-shadow 0.25s ease,
        background-color 0.25s ease,
        border-color 0.25s ease;

      cursor: pointer;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }

    /* ✅ Make the Material radio circle occupy a reserved left column,
       so your label NEVER overlaps it. (MDC structure) */
    mat-radio-button.radio-button .mdc-form-field {
      width: 100%;
      height: 100%;

      display: grid;
      grid-template-columns: var(--radio-icon-space) 1fr;
      grid-template-rows: 1fr;
      align-items: start;
    }

    /* radio circle column */
    mat-radio-button.radio-button .mdc-form-field > .mdc-radio {
      grid-column: 1;
      margin: 0;
      align-self: start;
    }

    /* label/content column */
    mat-radio-button.radio-button .mdc-form-field > label {
      grid-column: 2;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }

    /* ✅ Top-left label: wrap fully, no ellipsis, never overlaps circle */
    mat-radio-button.radio-button .label-top-left {
      position: absolute;
      top: 10px;
      left: calc(var(--radio-icon-space) + 8px);

      font-size: 16px;
      font-weight: 900;
      color: #002575ff;
      text-shadow:
        0 2px 3px rgba(255,255,255,0.7),
        0 1px 2px rgba(0,0,0,0.25);

      pointer-events: none;

      max-width: calc(100% - var(--radio-icon-space) - 16px);

      /* wrap, never truncate */
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      overflow-wrap: break-word;   /* or normal */
      word-break: normal;
      hyphens: none;
      line-height: 1.1;
      padding-right: 2px;
    }

    /* ✅ When NO icon/svg: let the label have more vertical room */
    mat-radio-button.radio-button.no-media {
      padding-top: 10px;
    }

    /* ✅ Media scales relative to card size (prevents overflow) */
    .svg-img {
      width: calc(var(--radio-card-size) * 0.80);
      height: calc(var(--radio-card-size) * 0.58);
      object-fit: contain;

      padding: 6px;
      box-sizing: content-box;

      margin-top: 28px; /* space for label */
      margin-bottom: 4px;

      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
    }

    .img-icon {
      width: calc(var(--radio-card-size) * 0.55);
      height: calc(var(--radio-card-size) * 0.30);
      object-fit: contain;

      padding: 6px;
      box-sizing: content-box;

      margin-top: 28px;
      margin-bottom: 4px;

      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
    }

    /* bottom description area */
    .text-block {
      width: 100%;
      text-align: center;
      margin-top: auto;
      padding: 2px 6px 0;
      box-sizing: border-box;
    }

    .description-text {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      overflow: hidden;
      text-overflow: ellipsis;

      max-width: 100%;
      font-size: 12px;
      font-weight: 500;
      color: #003080;
      line-height: 1.15;
    }
  `],
})
export class RadioButtonsComponent implements OnInit, PubComponent {
  // ✅ when not provided we fall back to the CSS default (120px) via template binding
  buttonSize?: number;

  listener: PubComponentListener;
  data: any;
  resolveFunction: any;
  title: string;
  model: any;
  buttons: any[] = [];
  initData: any = "";
  save_function: any = null;
  visibility: string = "Hide";
  status = "working";
  button_label = "Commit";
  ngbuttonClass = "btn-outline-dark  btn-sm";
  disabled = false;
  width = "100%";
  html: any;

  @Input() description: string | undefined;
  @Input() type: "Help" | "Applications" | "Feedback" | "Purchase" | string | undefined;

  selectedOption: any;
  radioButtonOptions: any;

  ngOnInit(): void {
    let defaultChx = true;

    if (this.data != null) {
      if (this.data["html"]) {
        this.html = this.data["html"];
      }

      if (this.data["buttons"] != null) {
        this.buttons = this.data["buttons"];
        this.model = this.data["selected"];
      } else {
        this.buttons = this.data;
        this.model = this.buttons?.[0]?.["label"];
      }

      // ✅ Use button_size to set card size
      if (this.data["button_size"]) {
        this.buttonSize = this.data["button_size"];
      }

      if (this.data["width"]) {
        this.width = this.data["width"];
      }

      if (this.data["type"]) {
        this.type = this.data["type"];
      }

      if (this.data["description"]) {
        this.description = this.data["description"];
      }

      if (this.data["unchecked"] || this.data["unselected"] || this.data["notchecked"]) {
        defaultChx = false;
      }
    }

    // defaultChecked logic
    if (defaultChx) {
      let ischecked = false;

      for (let b of this.buttons) {
        if (b.checked) ischecked = true;
      }

      if (!ischecked && this.buttons.length > 0) {
        this.buttons[0].checked = true;
      }
    } else {
      for (let b of this.buttons) {
        b.checked = false;
      }
    }

    if (this.resolveFunction) this.resolveFunction(this);
  }

  setUniformRadioSize(enable: boolean, sizePx = 18) {
    const body = document.body;

    if (enable) {
      body.classList.add("uniform-radio-size");
      document.documentElement.style.setProperty("--radio-size", `${sizePx}px`);
    } else {
      body.classList.remove("uniform-radio-size");
      document.documentElement.style.removeProperty("--radio-size");
    }
  }

  decodeSvg(dataUrl: string): string {
    try {
      const prefix = "data:image/svg+xml;base64,";
      if (dataUrl.startsWith(prefix)) {
        const base64 = dataUrl.slice(prefix.length);
        const svg = decodeURIComponent(escape(atob(base64)));
        return svg;
      }
      return "";
    } catch (e) {
      console.error("Failed to decode SVG:", e);
      return "";
    }
  }

  disable() {
    this.disabled = true;
  }

  init(): string {
    return "";
  }

  getButton(ev: string) {
    for (let buttonObject of this.buttons) {
      if (buttonObject["label"] === ev) {
        return buttonObject;
      }
    }
    return null;
  }

  removeQuotesIfAny(str: string) {
    return str.startsWith('"') ? str.substring(1, str.length - 1) : str;
  }

  update(event: any, button: any) {
    if (button && button.label) {
      const f = button["ionfunction"];
      if (f != null) {
        LionEngine.ionfunctions[f](button.label);
      }
    } else {
      let currentTarget = event.currentTarget.innerText;
      if (currentTarget != null && currentTarget.length > 0) {
        currentTarget = currentTarget.trim();
      } else {
        console.log("blank text for the button target");
        return;
      }

      button = this.getButton(currentTarget);
      if (!button) {
        console.log("Failed to find a button for model: " + event);
        console.log("Current Buttons: " + JSON.stringify(this.buttons));
      }
    }
  }
}
