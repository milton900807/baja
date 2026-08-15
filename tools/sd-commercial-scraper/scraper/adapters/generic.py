"""Generic adapter for broker sites / arbitrary URLs you supply.

Configure targets in a JSON file (see sites.example.json). Each target maps
CSS selectors onto the Listing fields, so you can add a broker site without
writing Python. Targets may opt into browser rendering with "render": true.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from ..base import SourceAdapter
from ..models import Listing, parse_price, parse_sqft
from .browser import PlaywrightUnavailable, rendered_page

log = logging.getLogger("scraper.generic")


class GenericAdapter(SourceAdapter):
    """Drives a list of CSS-selector-configured targets.

    Config schema (list of objects)::

        {
          "name": "acme-brokers",
          "url": "https://acme.example/san-diego/commercial",
          "render": false,
          "selectors": {
            "item": ".listing-card",     # required: repeated container
            "title": ".card-title",
            "url": "a",                  # href is read from this element
            "price": ".price",
            "address": ".addr",
            "listing_type": "lease"      # literal, not a selector, if no '.'/'#'
          }
        }
    """

    name = "generic"

    def __init__(self, client, *, config_path: str, city: str = "San Diego", max_pages: int = 3):
        super().__init__(client, city=city, max_pages=max_pages)
        self.targets = json.loads(Path(config_path).read_text())
        # if any target needs rendering, the runner should know
        self.needs_browser = any(t.get("render") for t in self.targets)

    def fetch(self) -> Iterable[Listing]:
        for target in self.targets:
            try:
                yield from self._fetch_target(target)
            except Exception as exc:
                log.warning("Target %s failed: %s", target.get("name"), exc)

    def _get_html(self, target: dict) -> str | None:
        url = target["url"]
        if target.get("render"):
            sel = target.get("selectors", {}).get("item")
            try:
                with rendered_page(url, wait_selector=sel) as html:
                    return html
            except PlaywrightUnavailable as exc:
                log.warning("Target %s needs a browser: %s", target.get("name"), exc)
                return None
        resp = self.client.get(url)
        return resp.text if resp else None

    def _fetch_target(self, target: dict) -> Iterable[Listing]:
        html = self._get_html(target)
        if not html:
            return
        soup = BeautifulSoup(html, "html.parser")
        sel = target["selectors"]
        items = soup.select(sel["item"])
        log.info("generic/%s: %d items", target.get("name", target["url"]), len(items))
        for node in items:
            listing = self._parse_item(node, target, sel)
            if listing:
                yield listing

    def _text(self, node, selector: str | None) -> str | None:
        if not selector:
            return None
        el = node.select_one(selector)
        return el.get_text(strip=True) if el else None

    def _parse_item(self, node, target: dict, sel: dict) -> Listing | None:
        title = self._text(node, sel.get("title"))
        # url: read href off the configured element (default: first anchor)
        url_sel = sel.get("url", "a")
        link = node.select_one(url_sel)
        href = link.get("href") if link and link.has_attr("href") else None
        if href:
            href = urljoin(target["url"], href)
        if not title and not href:
            return None

        price_raw = self._text(node, sel.get("price"))
        # listing_type may be a literal value rather than a selector
        lt = sel.get("listing_type")
        listing_type = lt if lt and not any(c in lt for c in ".#[ ") else self._text(node, lt)

        return Listing(
            source=target.get("name", self.name),
            url=href or target["url"],
            title=title or "(untitled)",
            price=parse_price(price_raw),
            price_raw=price_raw,
            address=self._text(node, sel.get("address")),
            city=self.city,
            area_sqft=parse_sqft(node.get_text(" ", strip=True)),
            listing_type=listing_type,
            extra={"target": target.get("name")},
        )
