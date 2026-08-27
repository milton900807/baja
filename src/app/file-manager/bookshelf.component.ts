import { Component, OnInit } from '@angular/core';
import { LionEngine } from '../engine/io-engine';
import { IoniScriptManager } from '../engine/io-manager';
import { FunctionUtil } from '../functions/function-util';
import { PubComponent } from '../published-lionscript/pub-component';
import { PubComponentListener } from '../published-lionscript/pub-component-listener';

interface Book {
  name: string;   // file name, e.g. ASO_Synthesis.pdf
  path: string;   // server path, e.g. /library/ASO_Synthesis.pdf
  title: string;  // display title derived from the file name
  color: string;  // cover color
  size?: number;
}

/**
 * A read-only "bookshelf" of the PDFs in a folder (defaults to the shared
 * /library). Mirrors the simple-file-browser (FBComponent) wiring — same
 * PubComponent lifecycle and the same /get-nodes source — but renders the
 * PDFs as book covers on wooden shelves, with a live title search box.
 *
 * lionscript usage (wid: 'pdf-bookshelf'):
 *   data: {
 *     drive: 'library',              // or 'wd' with root '/library'
 *     root: '/library',
 *     user: getUser(),
 *     showSearch: true,
 *     title: 'RNA Therapeutics Library',
 *     'ionfunction.fileClick': createIonFunction((el) => { ... })  // optional
 *   }
 */
@Component({
  selector: 'pdf-bookshelf',
  templateUrl: './bookshelf.component.html',
  styleUrls: ['./bookshelf.component.css']
})
export class BookshelfComponent implements OnInit, PubComponent {

  data: any;
  listener: PubComponentListener;
  resolveFunction: any;
  title = 'Library';

  keyDrive = 'library';
  rootPath = '/library';
  user: any = null;
  server: string = null;
  showSearch = true;
  fileclickFunction: any = null;

  books: Book[] = [];
  loading = true;
  error = '';
  search = '';

  // Warm, library-ish cover palette; assigned per book so the shelf looks varied.
  private palette = [
    '#7d2b2b', '#2f4f7a', '#2f6b4a', '#8a5a2b', '#54366e',
    '#2f6f6f', '#833f63', '#556b2f', '#3c4a63', '#6b3a2b',
    '#41618a', '#4a6b3a'
  ];

  init(ionEngine: IoniScriptManager): string {
    const d = this.data || {};
    // Accept both the FBComponent-style keys (drive/root) and plain key/path.
    if (d['drive'] != null) this.keyDrive = d['drive'];
    if (d['key'] != null) this.keyDrive = d['key'];
    if (d['root'] != null) this.rootPath = d['root'];
    if (d['path'] != null) this.rootPath = d['path'];
    if (d['user'] != null) this.user = d['user'];
    if (d['server'] != null) this.server = d['server'];
    if (d['showSearch'] != null) this.showSearch = d['showSearch'];
    if (d['title'] != null) this.title = d['title'];
    if (d['ionfunction.fileClick']) {
      this.fileclickFunction = LionEngine.ionfunctions[d['ionfunction.fileClick']];
    }
    return '';
  }

  private host(): string {
    return this.server || (window as any)['env']?.['apiUrl'] || '';
  }

  async ngOnInit() {
    // The shared library is keyed off /library; normalize whatever was passed.
    if (this.rootPath && !this.rootPath.startsWith('/')) this.rootPath = '/' + this.rootPath;
    if (!this.rootPath) this.rootPath = '/library';
    await this.loadBooks();
  }

  async loadBooks() {
    this.loading = true;
    this.error = '';
    try {
      const url = `${this.host()}/get-nodes?key=${encodeURIComponent(this.keyDrive)}&path=${encodeURIComponent(this.rootPath)}`;
      const res: any = await FunctionUtil.GETJSON(url, this.user);
      const values: any[] = (res && res['values']) || [];
      const pdfs = values.filter(
        (n) => n && !n.isFolder && typeof n.name === 'string' && n.name.toLowerCase().endsWith('.pdf')
      );
      // Alphabetical, but any "References" title is forced to the very end.
      pdfs.sort((a, b) => {
        const ar = this.isReferences(a.name), br = this.isReferences(b.name);
        if (ar !== br) return ar ? 1 : -1;
        return this.prettify(a.name).localeCompare(this.prettify(b.name));
      });
      this.books = pdfs.map((n, i) => ({
        name: n.name,
        path: n.path,
        size: n.size,
        title: this.prettify(n.name),
        color: this.palette[i % this.palette.length],
      }));
    } catch (e) {
      this.error = 'Could not load the library.';
    } finally {
      this.loading = false;
    }
  }

  /** A "References" book (e.g. References.pdf) is always sorted last. */
  isReferences(name: string): boolean {
    return String(name).replace(/\.pdf$/i, '').toLowerCase().includes('reference');
  }

  /** ASO_Synthesis.pdf -> "ASO Synthesis"; keeps ALL-CAPS acronyms intact. */
  prettify(name: string): string {
    let t = String(name).replace(/\.pdf$/i, '');
    t = t.replace(/[_]+/g, ' ').replace(/\s*-\s*/g, ' — ').replace(/\s+/g, ' ').trim();
    return t
      .split(' ')
      .map((w) => {
        if (w.length <= 1) return w;
        if (w === w.toUpperCase()) return w;            // acronym (ASO, LNA, CMC, RNA…)
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  get filteredBooks(): Book[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.books;
    return this.books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
    );
  }

  trackByPath(_i: number, b: Book) { return b.path; }

  openBook(b: Book) {
    // Let the caller intercept the click if it wired ionfunction.fileClick…
    if (this.fileclickFunction) {
      this.fileclickFunction({ name: b.name, path: b.path, isFolder: false, size: b.size });
      return;
    }
    // …otherwise open the PDF straight from the server (library paths need only ?path=).
    const url = `${this.host()}/load-pdf?path=${encodeURIComponent(b.path)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
