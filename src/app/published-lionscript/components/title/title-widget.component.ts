import { Component, Input, OnInit, NgZone } from "@angular/core";
import { PubComponent } from "../../pub-component";
import { PubComponentListener } from "../../pub-component-listener";

/**
 * A titled heading widget with the app's brushed-metal look and feel.
 * Use as a drop-in replacement for an `html` component that only renders a
 * heading (e.g. `<hr><h2>Track Layers</h2>`).
 *
 * Accepts either a plain string:
 *   { wid: 'title', data: 'Track Layers' }
 * or an object:
 *   { wid: 'title', data: { title: 'Track Layers', subtitle: '...', icon: 'layers' } }
 */
@Component({
    selector: 'title-widget',
    template: `
    <div class="metal-title" [class.has-sub]="subtitle">
      <mat-icon *ngIf="icon" class="metal-title__icon">{{ icon }}</mat-icon>
      <div class="metal-title__text">
        <div class="metal-title__heading">{{ headingText }}</div>
        <div class="metal-title__sub" *ngIf="subtitle">{{ subtitle }}</div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; padding: 0 12px; }

    /* Brushed-metal title bar (matches mt-button / button-canvas) */
    .metal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
      margin: 4px 0 8px 0;
      padding: 10px 14px;
      border: 1px solid var(--border, #c8ced6);
      border-radius: 10px;
      color: var(--metal-text, #2a2f3a);
      background: var(--metal-top, #e9edf2);
      box-shadow: var(--btn-shadow, 0 1px 2px rgba(16, 24, 40, 0.10));
    }

    .metal-title__icon {
      flex: 0 0 auto;
      width: 22px;
      height: 22px;
      font-size: 22px;
      line-height: 22px;
      color: var(--metal-text, #475467);
    }

    .metal-title__text { min-width: 0; }

    .metal-title__heading {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.2px;
      line-height: 1.3;
      white-space: normal;
      word-break: break-word;
    }

    .metal-title__sub {
      margin-top: 2px;
      font-size: 0.8rem;
      line-height: 1.1rem;
      color: var(--muted-fg, #667085);
    }
  `]
})
export class TitleWidgetComponent implements OnInit, PubComponent {
    @Input() listener: PubComponentListener;
    @Input() data: any = '';
    @Input() title: string = '';

    headingText = '';
    subtitle = '';
    icon = '';
    width = '100%';
    resolveFunction;

    constructor(private zone: NgZone) { }

    ngOnInit(): void {
        this.apply(this.data);
    }

    init(): string {
        this.apply(this.data);
        if (this.resolveFunction) {
            this.resolveFunction(this);
        }
        return '';
    }

    private apply(d: any): void {
        if (typeof d === 'string' && d.trim().length > 0) {
            this.headingText = this.stripHtml(d);
        } else if (d && typeof d === 'object') {
            this.headingText = this.stripHtml(d.title ?? d.text ?? d.label ?? d.heading ?? '') || this.headingText;
            this.subtitle = this.stripHtml(d.subtitle ?? d.sub ?? d.description ?? '');
            this.icon = d.icon ?? '';
        }
        // Fall back to the cell title the framework may have set
        if (!this.headingText && this.title) {
            this.headingText = this.stripHtml(this.title);
        }
    }

    /**
     * Accepts plain text or heading HTML (e.g. "<hr> <h2>Track Layers</h2>")
     * and returns clean text ("Track Layers"), so callers can pass either.
     */
    private stripHtml(s: any): string {
        if (s == null) return '';
        return String(s)
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Allow programmatic updates via a component ref, like other widgets. */
    setTitle(t: string): void {
        this.headingText = t;
        this.zone.run(() => { });
    }
}
