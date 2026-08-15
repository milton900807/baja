"""Normalized data model shared by every source adapter."""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class Listing:
    """A single commercial real-estate listing, normalized across sources."""

    source: str                       # adapter name, e.g. "craigslist"
    url: str                          # canonical listing URL
    title: str
    price: Optional[float] = None     # numeric price/rent if parseable
    price_raw: Optional[str] = None   # the price string as shown on the page
    address: Optional[str] = None
    city: Optional[str] = None
    area_sqft: Optional[int] = None
    listing_type: Optional[str] = None  # "lease" | "sale" | None
    description: Optional[str] = None
    posted_at: Optional[str] = None   # ISO-8601 if known
    scraped_at: Optional[str] = None  # ISO-8601, stamped by the pipeline
    extra: dict = field(default_factory=dict)  # source-specific fields

    def dedupe_key(self) -> str:
        """Stable identity used to drop duplicate listings across sources."""
        basis = (self.url or f"{self.title}|{self.address}").strip().lower()
        return hashlib.sha1(basis.encode("utf-8")).hexdigest()

    def to_dict(self) -> dict:
        return asdict(self)


_PRICE_RE = re.compile(r"[\d,]+(?:\.\d+)?")
_SQFT_RE = re.compile(r"([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet|ft2|ft²)", re.I)


def parse_price(text: Optional[str]) -> Optional[float]:
    """Pull the first monetary figure out of a free-text price string."""
    if not text:
        return None
    match = _PRICE_RE.search(text.replace("$", ""))
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def parse_sqft(text: Optional[str]) -> Optional[int]:
    """Pull a square-footage figure out of free text, if present."""
    if not text:
        return None
    match = _SQFT_RE.search(text)
    if not match:
        return None
    try:
        return int(match.group(1).replace(",", ""))
    except ValueError:
        return None
