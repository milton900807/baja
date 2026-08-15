import { Injectable } from "@angular/core";

export interface AppTheme {
  id: string;
  label: string;
  /** Optional inline token overrides for themes defined entirely in env.js. */
  tokens?: { [cssVar: string]: string };
}

/**
 * Central theme controller.
 *
 * Built-in themes are token sets in styles.scss under `:root[data-theme="<id>"]`.
 * Everything is configurable from assets/env.js via `window.env`:
 *
 *   window.env.themes        = ['socal','dark','ocean']            // which appear in the picker (subset/order)
 *        or                  = [{ id:'socal', label:'SoCal' }, ...]
 *   window.env.defaultTheme  = 'ocean'                             // startup theme
 *   window.env.customThemes  = [{ id:'brand', label:'Brand',
 *                                 tokens: { '--app-bg':'#101820', '--app-fg':'#f0f0f0', ... } }]
 *
 * A custom theme needs no CSS block — its `tokens` map is applied inline on <html>.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly STORAGE_KEY = "app-theme";

  /** All themes with a CSS block in styles.scss. */
  private readonly builtIn: AppTheme[] = [
    { id: "socal", label: "SoCal (cream)" },
    { id: "dark", label: "Dark (navy)" },
    { id: "light", label: "Light" },
    { id: "contrast", label: "High contrast" },
    { id: "slate", label: "Slate" },
    { id: "ocean", label: "Ocean" },
    { id: "forest", label: "Forest" },
    { id: "sunset", label: "Sunset" },
    { id: "turquoise", label: "Turquoise" },
    { id: "mono", label: "Mono" },
    { id: "midnight", label: "Midnight" },
    { id: "paper", label: "Paper" },
  ];

  private current = "socal";
  private appliedCustomKeys: string[] = [];

  // ---- env helpers ----
  private env(): any {
    return (typeof window !== "undefined" && (window as any)["env"]) || {};
  }

  private customThemes(): AppTheme[] {
    const c = this.env()["customThemes"];
    return Array.isArray(c)
      ? c.filter((t) => t && t.id).map((t) => ({ id: String(t.id), label: t.label || t.id, tokens: t.tokens }))
      : [];
  }

  /** The theme list shown in the picker (env-configurable), plus any custom themes. */
  get themes(): AppTheme[] {
    const custom = this.customThemes();
    const byId = (id: string) =>
      custom.find((t) => t.id === id) || this.builtIn.find((t) => t.id === id) || { id, label: id };

    const envList = this.env()["themes"];
    let list: AppTheme[];
    if (Array.isArray(envList) && envList.length) {
      list = envList.map((e: any) => (typeof e === "string" ? byId(e) : { id: e.id, label: e.label || e.id, tokens: e.tokens }));
    } else {
      list = [...this.builtIn];
    }
    // Ensure custom themes are selectable even if not listed in env.themes
    for (const c of custom) {
      if (!list.some((t) => t.id === c.id)) list.push(c);
    }
    return list;
  }

  private find(id: string): AppTheme | undefined {
    return this.themes.find((t) => t.id === id);
  }

  isKnown(id: string): boolean {
    return !!this.find(id);
  }

  getTheme(): string {
    return this.current;
  }

  /** Apply the saved, else env default, else first available theme. */
  init(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(this.STORAGE_KEY);
    } catch { /* storage may be unavailable */ }

    const fallback = this.env()["defaultTheme"] || (this.themes[0] && this.themes[0].id) || "socal";
    this.setTheme(saved && this.isKnown(saved) ? saved : fallback);
  }

  setTheme(id: string): void {
    const theme = this.find(id) || this.themes[0];
    if (!theme) return;
    this.current = theme.id;

    try {
      const rootEl = document.documentElement;
      rootEl.setAttribute("data-theme", theme.id);

      // Clear any inline tokens from a previous custom theme
      for (const k of this.appliedCustomKeys) rootEl.style.removeProperty(k);
      this.appliedCustomKeys = [];

      // Apply inline tokens for env-defined custom themes
      if (theme.tokens) {
        for (const k of Object.keys(theme.tokens)) {
          rootEl.style.setProperty(k, theme.tokens[k]);
          this.appliedCustomKeys.push(k);
        }
      }
    } catch { /* no-op */ }

    try {
      localStorage.setItem(this.STORAGE_KEY, theme.id);
    } catch { /* no-op */ }
  }

  /** Toggle to the next theme in the list (handy for a single button). */
  cycle(): void {
    const list = this.themes;
    const i = list.findIndex((t) => t.id === this.current);
    const next = list[(i + 1) % list.length];
    if (next) this.setTheme(next.id);
  }
}
