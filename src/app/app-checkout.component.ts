import { Component, AfterViewInit, Input, OnInit } from '@angular/core';
import { PubComponentListener } from './published-lionscript/pub-component-listener';
import { PubComponent } from './published-lionscript/pub-component';
import { IoniScriptManager } from './engine/io-manager';
import { LionEngine } from './engine/io-engine';

@Component({
    selector: 'app-checkout',
    template: `
     <div class="checkout-root">
        <div class="checkout-card">





 <!-- Header -->
        <div class="checkout-header">
          <div class="checkout-header-top">

            <div class="header-actions">
              <div class="safety-badge">
                <span class="safety-badge-icon">🔒</span>
                <span class="safety-badge-text">Secure • encrypted • PCI-compliant</span>
              </div>
                                <div class="checkout-body">
                <!-- Features (topics) -->
                <div *ngIf="topics?.length" class="checkout-features">
                    <h3 class="features-title">Included: </h3>
                    <ul class="features-list">
                        <li *ngFor="let topic of topics" class="features-item">
                            {{ topic }}
                        </li>
                    </ul>
                </div>

                <div class="checkout-summary">
                    <!-- Order Row -->
                    <div class="summary-row">
                        <div class="summary-label"></div>
                        <div class="summary-value">
                            {{ displayLabel }}
                            <span *ngIf="position"> — {{ position }}</span>
                        </div>  
                    </div>

                    <!-- Discount Row -->
                    <div class="summary-row checkout-discount" *ngIf="discountLabel">
                        <div class="discount-label">Discount</div>
                        <div class="discount-text">
                            {{ discountLabel }}
                        </div>
                    </div>

                    <!-- Billing Row -->
                    <div class="summary-row billing-note">
                        <div class="billing-pill">Annual subscription</div>
                        <div class="billing-text">
                            <span class="billing-subtext">
                                ({{ currencySymbol }}{{ monthlyAmount.toFixed(2) }} {{ currency }} per month)
                            </span>
                        </div>
                    </div>
                </div>


                <!-- Subscribe. Stripe is the only payment path now, and the only source of
                     entitlement, so this hands off to /subscribe rather than mounting a button
                     from a second provider. -->
                <div class="subscribe-section">
                    <button type="button" class="demo-button" (click)="subscribe()">
                        <span class="demo-button-text">Subscribe</span>
                    </button>
                </div>

            </div>

            <!-- Footer -->
            <div class="checkout-footer">
                <p class="checkout-note">
                    <span class="dot"></span>
                    Payments are processed securely by Stripe.
                    Your full payment information is never stored on our servers.
                </p>
            </div>
                <button
                        *ngIf="demo_link"
                        type="button"
                        class="demo-button"
                        (click)="openDemo()"
                        aria-label="View a demo of what you’ll receive"
                    >
                        <span class="demo-button-text"> Software Demo </span>
                    </button>

        </div>
    </div>
    `,
    styleUrls: ['./app-checkout.component.css']
})
export class AppCheckoutComponent implements AfterViewInit, OnInit, PubComponent {

    // The Stripe subscribe flow. /subscribe is the page that creates the Stripe checkout
    // session (see baja/datayak/ljlcheckout.js), so everything to do with taking money lives
    // in one place instead of being split across two providers.
    subscribe(): void {
        try { window.location.href = window.location.origin + '/subscribe'; } catch (e) { }
    }

    currencySymbol: string = '$';

    init(ionEngine: IoniScriptManager): string {
        return '';
    }
    resolveFunction: any;
    title: string;
    @Input() amount!: number; // Payment amount passed from parent (ANNUAL)
    @Input() currency: string = 'USD'; // Default currency
    @Input() onSuccess!: (details: any) => void; // Success callback
    @Input() onError!: (error: any) => void; // Error callback
    @Input() data: any;
    listener: PubComponentListener;
    successListener = null;
    product: any = null;
    displayLabel: string = '';
    email: string = '';
    position: string = '';
    demo_link: string = null;

    // NEW: topics array pulled from data.features.topics
    topics: string[] = [];

    // ✅ NEW: discount label from data.features.discount
    discountLabel: string | null = null;

    // 🔹 NEW: monthly equivalent of the annual amount
    monthlyAmount: number = 0;

    // ✅ NEW: open demo link in a new window/tab
    openDemo(): void {
        if (!this.demo_link) return;
        window.open(this.demo_link, '_blank', 'noopener,noreferrer');
    }

    ngAfterViewInit(): void {
        // No payment SDK to mount: subscribing goes through /subscribe, which creates the
        // Stripe checkout session server-side.

        this.onSuccess = (details) => {
            if (this.successListener) {
                this.successListener(details);
            }
        };

        this.onError = (error) => {
            console.error('Error during payment:', error);
        };
    }

    ngOnInit(): void {
        if (!this.data) {

            console.log(" no data ")
            return;
        }

        // 1. Success listener
        if (this.data['successListener']) {
            const fn = LionEngine.ionfunctions[this.data['successListener']];
            if (typeof fn === 'function') {
                this.successListener = fn;
            }
        }
        this.currencySymbol = this.currency === 'USD' ? '$' : this.currency;
        // 2. Default amount (ANNUAL)
        this.amount = 2000.00;

        // Override amount if provided
        if (this.data['amount']) {
            this.amount = this.data['amount'];
        }

        // 🔹 NEW: compute monthly from annual (amount / 12)
        this.monthlyAmount = this.amount / 12;

        // 3. Email assignment
        this.email = null;
        if (this.data['email']) {
            this.email = this.data['email'].trim().toLowerCase();
        }

        // 4. Product (optional)
        this.product = null;
        if (this.data['product']) {
            this.product = this.data['product']; // fallback text
        }

        // 4b. Position (optional)
        this.position = null;
        if (this.data['position']) {
            this.position = this.data['position'];
        }
        this.topics = [];
        debugger;
        if (this.data['features'] &&
            this.data['features'].topics &&
            Array.isArray(this.data['features'].topics)) {
            this.topics = this.data['features'].topics;

            if (this.data['features'] && this.data['features']?.demo) {
                debugger;
                this.demo_link = this.data['features']?.demo
            }

        }

        this.discountLabel = null;
        if (this.data['features'] &&
            typeof this.data['features'].discount === 'string' &&
            this.data['features'].discount.trim().length > 0) {
            this.discountLabel = this.data['features'].discount.trim();
        }

        // 5. Display label
        if (this.product) {
            this.displayLabel =
                `${this.product} – ${this.currencySymbol}${this.amount.toFixed(2)} ${this.currency}`;
        } else {
            this.displayLabel =
                `${this.currencySymbol}${this.amount.toFixed(2)} ${this.currency}`;
        }
    }

}
