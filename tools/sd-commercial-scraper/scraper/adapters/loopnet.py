"""LoopNet San Diego adapter. Requires Playwright (Cloudflare + JS rendering).

NOTE: LoopNet's Terms of Service restrict automated access. Only run this
against sources you are authorized to scrape. This adapter is provided as a
structural template; selectors will need periodic updates as the site changes.
"""
from __future__ import annotations

import logging
from typing import Iterable

from bs4 import BeautifulSoup

from ..base import SourceAdapter
from ..models import Listing, parse_price, parse_sqft
from .browser import PlaywrightUnavailable, rendered_page

log = logging.getLogger("scraper.loopnet")

# Commercial real estate for lease in San Diego, CA.
SEARCH_URL = "https://www.loopnet.com/search/commercial-real-estate/san-diego-ca/for-lease/"


class LoopNetAdapter(SourceAdapter):
    name = "loopnet"
    needs_browser = True
    geo_scoped = True  # search URL is scoped to san-diego-ca

    def fetch(self) -> Iterable[Listing]:
        try:
            with rendered_page(SEARCH_URL, wait_selector="article, .placard") as html:
                yield from self._parse(html)
        except PlaywrightUnavailable as exc:
            log.warning("Skipping LoopNet: %s", exc)
        except Exception as exc:  # never let one source kill the run
            log.warning("LoopNet failed: %s", exc)

    def _parse(self, html: str) -> Iterable[Listing]:
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.select("article.placard, li.placard, [data-id].placard")
        log.info("loopnet: %d cards", len(cards))
        for card in cards:
            link = card.find("a", href=True)
            if not link:
                continue
            title_el = card.select_one(".placard-title, h4, h6") or link
            title = title_el.get_text(strip=True)
            price_el = card.select_one(".price, [class*=price]")
            price_raw = price_el.get_text(strip=True) if price_el else None
            addr_el = card.select_one(".placard-address, address, [class*=address]")
            address = addr_el.get_text(strip=True) if addr_el else None
            if not title:
                continue
            yield Listing(
                source=self.name,
                url=link["href"],
                title=title,
                price=parse_price(price_raw),
                price_raw=price_raw,
                address=address,
                city=self.city,
                area_sqft=parse_sqft(card.get_text(" ", strip=True)),
                listing_type="lease",
                extra={"marketplace": "loopnet"},
            )
