"""Collect, filter, dedupe, and serialize listings."""
from __future__ import annotations

import datetime as _dt
import json
import logging
import re
from pathlib import Path
from typing import Iterable

from .models import Listing

log = logging.getLogger("scraper.pipeline")

# San Diego County place names used to keep only in-area listings when a
# source isn't already scoped to San Diego (e.g. broker sites covering CA).
SD_TERMS = [
    "san diego", "chula vista", "la jolla", "oceanside", "escondido",
    "carlsbad", "el cajon", "vista", "encinitas", "national city",
    "santee", "poway", "coronado", "del mar", "sorrento valley",
    "mission valley", "kearny mesa", "point loma", "pacific beach",
    "gaslamp", "downtown san diego", "92101", "92037", "92121",
]
_SD_RE = re.compile("|".join(re.escape(t) for t in SD_TERMS), re.I)


def _in_san_diego(listing: Listing) -> bool:
    # Deliberately excludes listing.city: it's an operator-supplied label
    # (defaults to "San Diego"), not scraped evidence, so matching on it would
    # pass everything. Judge by the actual scraped text instead.
    haystack = " ".join(
        filter(None, [listing.address, listing.title, listing.description])
    )
    return bool(_SD_RE.search(haystack))


def collect(
    adapters,
    *,
    filter_area: bool = True,
) -> list[Listing]:
    """Run every adapter, timestamp, dedupe, and optionally geo-filter."""
    stamp = _dt.datetime.now(_dt.timezone.utc).isoformat()
    seen: set[str] = set()
    out: list[Listing] = []

    for adapter in adapters:
        count = 0
        # Sources already limited to the target area are trusted as-is; only
        # broad sources (e.g. broker sites covering all of CA) get filtered.
        apply_filter = filter_area and not getattr(adapter, "geo_scoped", False)
        for listing in adapter.fetch():
            if apply_filter and not _in_san_diego(listing):
                continue
            key = listing.dedupe_key()
            if key in seen:
                continue
            seen.add(key)
            listing.scraped_at = stamp
            out.append(listing)
            count += 1
        log.info("%s: kept %d listings", adapter.name, count)

    return out


def write_json(listings: list[Listing], path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "count": len(listings),
        "listings": [l.to_dict() for l in listings],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path
