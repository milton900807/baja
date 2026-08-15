"""Craigslist San Diego commercial / office space adapter (plain HTTP)."""
from __future__ import annotations

import logging
from typing import Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from ..base import SourceAdapter
from ..models import Listing, parse_price, parse_sqft

log = logging.getLogger("scraper.craigslist")

# Craigslist categories relevant to commercial space:
#   off = office & commercial (for lease)
#   reo = real estate - commercial for sale is folded into general "rea"/"reb"
BASE = "https://sandiego.craigslist.org"
CATEGORIES = {
    "off": "lease",   # office & commercial space
}


class CraigslistAdapter(SourceAdapter):
    name = "craigslist"
    needs_browser = False
    geo_scoped = True  # sandiego.craigslist.org is already SD-only

    def fetch(self) -> Iterable[Listing]:
        for cat, listing_type in CATEGORIES.items():
            yield from self._fetch_category(cat, listing_type)

    def _fetch_category(self, category: str, listing_type: str) -> Iterable[Listing]:
        # The no-JS static results page returns li.cl-static-search-result items.
        url = f"{BASE}/search/{category}#search=1~list~0~0"
        resp = self.client.get(f"{BASE}/search/{category}")
        if resp is None:
            log.info("No response for craigslist category %s", category)
            return
        soup = BeautifulSoup(resp.text, "html.parser")

        results = soup.select("li.cl-static-search-result")
        if not results:
            # Newer layout: anchors carry the data directly.
            results = soup.select("a.cl-app-anchor, li.cl-search-result")

        log.info("craigslist/%s: %d raw results", category, len(results))
        for node in results:
            listing = self._parse_node(node, listing_type)
            if listing:
                yield listing

    def _parse_node(self, node, listing_type: str) -> Listing | None:
        # title + url
        link = node if node.name == "a" else node.find("a", href=True)
        if not link or not link.get("href"):
            return None
        href = urljoin(BASE, link["href"])
        title_el = node.select_one(".title") or link
        title = title_el.get_text(strip=True)
        if not title:
            return None

        price_el = node.select_one(".price")
        price_raw = price_el.get_text(strip=True) if price_el else None

        loc_el = node.select_one(".location")
        address = loc_el.get_text(strip=True).strip("()") if loc_el else None

        return Listing(
            source=self.name,
            url=href,
            title=title,
            price=parse_price(price_raw),
            price_raw=price_raw,
            address=address,
            city=self.city,
            area_sqft=parse_sqft(title),
            listing_type=listing_type,
            extra={"category": "craigslist-commercial"},
        )
