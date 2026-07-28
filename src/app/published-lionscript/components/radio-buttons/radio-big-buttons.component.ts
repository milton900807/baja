import { OnInit, Component, Input } from "@angular/core";
import { PubComponent } from "../../pub-component";
import { LionEngine } from "../../../engine/io-engine";
import { PubComponentListener } from "../../pub-component-listener";

export interface Option {
  name: string;
  value: number;
  checked: boolean;
}

@Component({
  selector: "radio-big-button",
  templateUrl: "./radio-buttons.component.html",
  styles: [`
    mat-radio-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin: 8px;

  --radio-card-size: 120px;

  /* space for the mat radio circle + gap */
  --radio-icon-space: 38px;
}

/* Card */
mat-radio-button.radio-button {
  display: flex !important;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;

  width: var(--radio-card-size);
  height: var(--radio-card-size);
  min-width: var(--radio-card-size);
  min-height: var(--radio-card-size);

  padding: 14px;
  background: #e2efff;
  border: 2px solid #c4d9ff;
  border-radius: 14px;

  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* ✅ Ensure the *actual* radio circle sits in a reserved column */
mat-radio-button.radio-button ::ng-deep .mdc-form-field {
  /* make the whole area clickable and predictable */
  width: 100%;
  height: 100%;

  /* this creates a left column for the radio circle */
  display: grid;
  grid-template-columns: var(--radio-icon-space) 1fr;
  grid-template-rows: 1fr;
  align-items: start;
}

/* place radio circle in column 1 */
mat-radio-button.radio-button ::ng-deep .mdc-form-field > .mdc-radio {
  grid-column: 1;
  margin: 0;              /* avoid surprise offsets */
  align-self: start;
}

/* place label container in column 2 */
mat-radio-button.radio-button ::ng-deep .mdc-form-field > label {
  grid-column: 2;
  width: 100%;
  height: 100%;
  margin: 0;              /* material adds margins sometimes */
  padding: 0;
}

/* ✅ Your custom label: wrap fully, never overlap circle */
mat-radio-button.radio-button .label-top-left {
  position: absolute;
  top: 10px;

  /* start AFTER the radio circle column */
  left: calc(var(--radio-icon-space) + 8px);

  font-size: 16px;
  font-weight: 900;
  color: #002575ff;

  max-width: calc(100% - var(--radio-icon-space) - 16px);
  white-space: normal;
  text-overflow: unset;
  overflow-wrap: break-word;   /* or normal */
  word-break: normal;
  line-height: 1.1;
  pointer-events: none;
}

/* media sizing (unchanged) */
.svg-img {
  width: calc(var(--radio-card-size) * 0.80);
  height: calc(var(--radio-card-size) * 0.58);
  margin-top: 28px;
  margin-bottom: 4px;
}

.img-icon {
  width: calc(var(--radio-card-size) * 0.55);
  height: calc(var(--radio-card-size) * 0.30);
  margin-top: 28px;
  margin-bottom: 4px;
}

/* ✅ When NO icon/svg: give the label more vertical room */
mat-radio-button.radio-button.no-media {
  padding-top: 10px;
}

mat-radio-button.radio-button.no-media .label-top-left {
  top: 10px;
  /* allow more lines before you “run into” where media would be */
  max-height: calc(100% - 18px);
}

/* bottom description as-is */
.text-block {
  width: 100%;
  text-align: center;
  margin-top: auto;
  padding: 2px 6px 0;
  box-sizing: border-box;
}

  `],
})
export class RadioBigButtonsComponent implements OnInit, PubComponent {
  // ✅ when not provided we fall back to the CSS default (150px) via template binding
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

      // ✅ NEW — use button_size to set card size
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

    // existing defaultChecked logic
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

  setUniformRadioSize(enable, sizePx = 18) {
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
      let f = button["ionfunction"];
      if (f != null) {
        LionEngine.ionfunctions[f](button.label);
      }
    } else {
      let currentTarget = event.currentTarget.innerText;
      if (currentTarget != null && currentTarget.length > 0) {
        currentTarget = currentTarget.trim();
      } else {
        console.log(" blank text for the button tyarget ");
        return;
      }

      button = this.getButton(currentTarget);
      if (!button) {
        console.log("Failed to find a button for model : " + event);
        console.log(" Current Buttons  " + JSON.stringify(this.buttons));
      }
    }
  }
}
