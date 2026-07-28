import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PubComponent } from './pub-component';
import { PubComponentListener } from './pub-component-listener';
import { IoniScriptManager } from '../engine/io-manager';
import { LionEngine } from '../../app/engine/io-engine';

@Component({
  selector: 'pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewerComponent implements OnInit, OnDestroy, PubComponent {
  /**
   * Optional direct override from parent, if you want to pass a PDF URL directly.
   * Usually you'll just let the engine populate `data` instead.
   */
  @Input() src?: string;

  // Populated by the engine, like in YoutubeComponent / NewsTickerComponent
  data: any;

  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  closeButton: any = null;

  pdfUrl: SafeResourceUrl | null = null;
  /** Raw URL used for download (unsanitized, never bound directly) */
  private objectUrl: string | null = null;

  loading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {
    // If src is provided as an @Input, use it directly.
    if (this.src) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.src);
      this.objectUrl = this.src; // Use the same URL for download
      return;
    }

    if (this.data) {
      // 1. Optional title (e.g., "Receipt", "Invoice")
      if (this.data.title) {
        this.title = this.data.title;
      }

      // 2. Optional close button callback, same pattern as YoutubeComponent / NewsTicker
      if (this.data.closeButton) {
        this.closeButton = LionEngine.ionfunctions[this.data.closeButton];
      }
      if (this.data.close) {
        this.closeButton = LionEngine.ionfunctions[this.data.close];
      }

      // 3. If data already has base64 PDF, use it directly
      const base64Keys = ['pdf_base64', 'base64', 'value'];
      for (const key of base64Keys) {
        if (this.data[key]) {
          this.setPdfFromBase64(this.data[key]);
          return;
        }
      }

      // 4. Otherwise, look for an endpoint/URL to fetch JSON that contains pdf_base64
      const urlKeys = ['url', 'endpoint', 'link', 'value'];
      for (const key of urlKeys) {
        if (this.data[key]) {
          const url = this.data[key];
          this.loadPdfFromUrl(url);
          return;
        }
      }

      // If we reach here, we had data but neither base64 nor URL was found
      this.error = 'No PDF source found in data object.';
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl && this.objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  /**
   * Called by the engine, same contract as YoutubeComponent / NewsTickerComponent.
   */
  init(ionEngine: IoniScriptManager): string {
    // You can hook into ionEngine here if needed in future
    return '';
  }

  /**
   * Fetch a JSON payload from the given URL and extract a base64 PDF from it.
   *
   * Expected JSON shape by default:
   *   {
   *     "status": "OK",
   *     "pdf_base64": "JVBERi0xLjcKJ..." // etc
   *   }
   *
   * You can customize:
   *   - data.method: 'GET' | 'POST' (default: 'POST')
   *   - data.body: object to send as request body
   *   - data.pdfField: name of the field containing base64 (default: 'pdf_base64')
   */
  private loadPdfFromUrl(url: string): void {
    this.loading = true;
    this.error = null;

    const method = (this.data?.method || 'POST').toUpperCase();
    const body = this.data?.body || this.data?.payload || null;
    const pdfField = this.data?.pdfField || 'pdf_base64';

    let request$;

    if (method === 'GET') {
      request$ = this.http.get<any>(url);
    } else {
      // Default to POST for typical Ion-style endpoints
      request$ = this.http.post<any>(url, body || {});
    }

    request$.subscribe({
      next: (res) => {
        const base64 = res?.[pdfField];
        if (!base64) {
          console.error('PDF base64 field not found in response', { res, pdfField });
          this.error = `No "${pdfField}" field found in server response.`;
          this.loading = false;
          return;
        }

        this.setPdfFromBase64(base64);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load PDF from', url, err);
        this.error = 'Failed to load PDF.';
        this.loading = false;
      },
    });
  }

  private setPdfFromBase64(base64: string): void {
    try {
      const pdfBytes = this.base64ToUint8Array(base64);

      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });

      // Revoke previous object URL if any
      if (this.objectUrl && this.objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.objectUrl);
      }

      const url = URL.createObjectURL(blob);
      this.objectUrl = url;

      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch (e) {
      console.error('Error converting base64 PDF', e);
      this.error = 'Error decoding PDF data.';
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const cleaned = base64.trim();
    const byteString = atob(cleaned);
    const len = byteString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return bytes;
  }

  /** Trigger browser download of the current PDF */
  downloadPdf(): void {
    if (!this.objectUrl) {
      return;
    }

    const filename =
      this.data?.downloadFilename ||
      this.title?.replace(/\s+/g, '_') + '.pdf' ||
      'document.pdf';

    const a = document.createElement('a');
    a.href = this.objectUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
