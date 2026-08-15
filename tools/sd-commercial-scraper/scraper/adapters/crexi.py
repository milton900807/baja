"""Crexi San Diego adapter. Requires Playwright (JS-rendered SPA).

NOTE: Respect Crexi's Terms of Service and robots.txt. Selectors are
best-effort and will drift as the site changes.
"""
from __future__ import annotations

import logging
from typing import Iterable

from bs4 import BeautifulSoup

from ..base import SourceAdapter
from ..models import Listing, parse_price, parse_sqft
from .browser import PlaywrightUnavailable, rendered_page

log = logging.getLogger("scraper.crexi")

SEARCH_URL = "https://www.crexi.com/properties?locations[]=San%20Diego,%20CA"


class CrexiAdapter(SourceAdapter):
    name = "crexi"
    needs_browser = True
    geo_scoped = True  # search URL is scoped to San Diego, CA

    def fetch(self) -> Iterable[Listing]:
        try:
            with rendered_page(SEARCH_URL, wait_selector="[data-testid*=tile], .property-tile") as html:
                yield from self._parse(html)
        except PlaywrightUnavailable as exc:
            log.warning("Skipping Crexi: %s", exc)
        except Exception as exc:
            log.warning("Crexi failed: %s", exc)

    def _parse(self, html: str) -> Iterable[Listing]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("[data-testid*=tile], .property-tile, a[href*='/properties/']")
        log.info("crexi: %d cards", len(cards))
        seen = set()
        for card in cards:
            link = card if card.name == "a" else card.find("a", href=True)
            if not link or not link.get("href"):
                continue
            href = link["href"]
            if href in seen:
                continue
            seen.add(href)
            text = card.get_text(" ", strip=True)
            title_el = card.select_one("h3, h4, [class*=title]") or link
            title = title_el.get_text(strip=True) or text[:80]
            price_el = card.select_one("[class*=price]")
            price_raw = price_el.get_text(strip=True) if price_el else None
            if not title:
                continue
            yield Listing(
                source=self.name,
                url=href if href.startswith("http") else f"https://www.crexi.com{href}",
                title=title,
                price=parse_price(price_raw),
                price_raw=price_raw,
                city=self.city,
                area_sqft=parse_sqft(text),
                extra={"marketplace": "crexi"},
            )
