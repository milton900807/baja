"""Shared Playwright helpers for JS/Cloudflare-protected sources."""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Optional

log = logging.getLogger("scraper.browser")


class PlaywrightUnavailable(RuntimeError):
    """Raised when a browser-based adapter runs without Playwright installed."""


@contextmanager
def rendered_page(url: str, *, wait_selector: Optional[str] = None, timeout: float = 30.0):
    """Yield the HTML of a fully rendered page, or raise PlaywrightUnavailable.

    Usage::

        with rendered_page(url, wait_selector=".listing") as html:
            soup = BeautifulSoup(html, "html.parser")
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise PlaywrightUnavailable(
            "Playwright is not installed. Run:\n"
            "    pip install playwright && playwright install chromium"
        ) from exc

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
            viewport={"width": 1366, "height": 900},
        )
        page = context.new_page()
        try:
            page.goto(url, timeout=timeout * 1000, wait_until="domcontentloaded")
            if wait_selector:
                try:
                    page.wait_for_selector(wait_selector, timeout=timeout * 1000)
                except Exception:
                    log.warning("Selector %s never appeared on %s", wait_selector, url)
            html = page.content()
        finally:
            context.close()
            browser.close()
        yield html
