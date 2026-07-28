import { Component, ChangeDetectorRef, Input, OnInit } from "@angular/core";
import { PubComponent } from "./pub-component";
import { PubComponentListener } from "./pub-component-listener";

type ProgressMode = "indeterminate" | "determinate";

@Component({
    selector: "working-feedback",
    templateUrl: "./working-feedback.component.html",
    styleUrls: ["./working-feedback.component.css"],
})
export class WorkingFeedbackComponent implements OnInit, PubComponent {
   // engine: import("./pub-component").IonEngine;
    @Input() listener: PubComponentListener;
    data: any = '';
    initData: any = '';
    title: string = '';
    visibility: string = 'Hide';
    message = null;
    resolveFunction = null;
    @Input() status: "working" | "idle" | "done" | "error" = "working";
    @Input() mode: ProgressMode = "indeterminate";
    @Input() percent: number | null = null;
    @Input() detailsText: string | null = null;

    @Input() showToggle = true;
    @Input() defaultMessage = "Working…";

    detailsOpen = false;
    constructor(public cd: ChangeDetectorRef) { }

    ngOnInit(): void { }

    toggleDetails(): void {
        this.detailsOpen = !this.detailsOpen;
    }

    setLogText(logText: any): void {
        // keep your existing behavior, but support string/object
        if (typeof logText === "string") {
            this.detailsText = logText;
        } else {
            this.data = logText ?? {};
            if (this.data?.message != null) this.message = String(this.data.message);
            if (this.data?.details != null) this.detailsText = String(this.data.details);
            if (this.data?.percent != null) {
                const p = Number(this.data.percent);
                this.mode = "determinate";
                this.percent = Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : null;
            }
        }

        this.cd.markForCheck?.();
    }

    init(): string {
        if (this.data?.message != null) {
            this.message = String(this.data.message);
        }

        if (this.resolveFunction) this.resolveFunction(this);
        return "complete";
    }

    append(v: string): void {
        this.detailsText = (this.detailsText ?? "") + v;
    }

    apply(): void {
        if (this.resolveFunction) {
            // intentionally left as-is (your original had it commented)
        }
    }
}
