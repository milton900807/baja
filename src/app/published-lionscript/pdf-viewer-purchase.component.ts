import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { AppCheckoutComponent } from '../app-checkout.component';
import { PubDirective } from './pub.directive';
import { LionEngine } from '../../app/engine/io-engine';

@Component({
  selector: 'pdf-viewer',
  templateUrl: './pdf-viewer-purchase.component.html',
  styleUrls: ['./pdf-viewer-purchase.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPurchaseViewerComponent implements OnInit, OnDestroy {
  @Input() src?: string;
  @Input() data: any;

  pdfUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;
  @ViewChild(PubDirective, { static: false }) compService: PubDirective;

  title = '';
  showCloseButton = false;

  loading = false;
  error: string | null = null;
  @Input() purchaseLink?: string;
  @Input() purchaseData?: any;
  purchaseClicked = null;

  purchase: any;
  showPurchaseButton = false;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }


  init() {

  }



  ngOnInit(): void {


    this.showPurchaseButton = !!(this.data?.purchase || this.purchaseLink);
    if (this.src) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.src);
      this.objectUrl = this.src;
      this.cdr.markForCheck();
      return;
    }

    if (!this.data) {
      this.error = 'No data provided.';
      this.cdr.markForCheck();
      return;
    }
    this.purchaseClicked = this.data?.purchaseClicked;

    this.title = this.data?.title || '';
    this.showCloseButton = !!(this.data?.close || this.data?.closeButton);


    if (this.purchaseClicked){
      this.showPurchaseButton = true;
      this.purchaseClicked = LionEngine.ionfunctions[this.purchaseClicked]
    }


    const base64Keys = ['pdf_base64', 'base64'];
    for (const key of base64Keys) {
      if (this.data[key]) {
        this.setPdfFromBase64(this.data[key]);
        return;
      }
    }

    const urlKeys = ['url', 'endpoint', 'link'];
    for (const key of urlKeys) {
      if (this.data[key]) {
        this.loadPdfFromUrl(this.data[key]);
        return;
      }
    }

    this.error = 'No PDF source found.';
    this.cdr.markForCheck();
  }

  onPurchase(): void {

    if (this.purchaseClicked) {
      this.purchaseClicked()
    } else {



      const dialogRef = this.dialog.open(AppCheckoutComponent, {
        width: '500px'
      });

      dialogRef.componentInstance.data = this.data?.purchase;
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  onClose(): void {
    console.log('Close clicked');
  }

  private loadPdfFromUrl(url: string): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const options = {
      observe: 'response' as const,
      responseType: 'blob' as const,
      headers: {
        Accept: 'application/pdf, application/json, text/plain, */*'
      }
    };

    this.http.get(url, options).subscribe({
      next: async (response) => {
        try {
          const blob = response.body;
          const contentType = (response.headers.get('content-type') || '').toLowerCase();

          if (!blob) {
            throw new Error('Empty response');
          }

          if (contentType.includes('application/pdf')) {
            this.setPdfFromBlob(blob);
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          const text = await blob.text();
          const trimmed = text.trim();

          if (!trimmed) {
            throw new Error('Empty response text');
          }

          if (trimmed.startsWith('{')) {
            const parsed = JSON.parse(trimmed);
            const base64 = parsed?.pdf_base64;

            if (!base64) {
              throw new Error('Missing pdf_base64 field');
            }

            this.setPdfFromBase64(base64);
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }

          this.setPdfFromBase64(trimmed);
          this.loading = false;
          this.cdr.markForCheck();
        } catch (err) {
          console.error(err);
          this.error = 'Failed to process PDF response.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: async (err) => {
        let errorText = '';

        try {
          if (err?.error instanceof Blob) {
            errorText = await err.error.text();
          }
        } catch { }

        console.error('HTTP error:', err, errorText);

        this.error = 'Failed to load PDF' + (errorText ? ': ' + errorText : '');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setPdfFromBlob(blob: Blob): void {
    if (this.objectUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.objectUrl);
    }

    const url = URL.createObjectURL(blob);
    this.objectUrl = url;
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cdr.markForCheck();
  }

  private setPdfFromBase64(base64: string): void {
    try {
      const byteString = atob(base64.trim());
      const bytes = new Uint8Array(byteString.length);

      for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      this.setPdfFromBlob(blob);
    } catch (e) {
      console.error(e);
      this.error = 'Invalid PDF data.';
      this.cdr.markForCheck();
    }
  }

  downloadPdf(): void {
    if (!this.objectUrl) return;

    const a = document.createElement('a');
    a.href = this.objectUrl;
    a.download = this.title ? `${this.title}.pdf` : 'document.pdf';
    a.click();
  }



}