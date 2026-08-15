"""Adapter base class. Each source subclasses this."""
from __future__ import annotations

import abc
import logging
from typing import Iterable

from .http import PoliteClient
from .models import Listing

log = logging.getLogger("scraper.adapter")


class SourceAdapter(abc.ABC):
    """Interface every listing source must implement.

    Adapters that only need plain HTTP receive a shared :class:`PoliteClient`.
    Adapters that need a real browser (Cloudflare / heavy JS) ignore it and
    drive Playwright themselves.
    """

    #: short identifier written into Listing.source
    name: str = "base"

    #: set True for adapters that require Playwright to be installed
    needs_browser: bool = False

    #: True when the source is already limited to the target area (e.g. a
    #: San-Diego-only subdomain or search URL), so the pipeline's area filter
    #: should not second-guess its results.
    geo_scoped: bool = False

    def __init__(self, client: PoliteClient, *, city: str = "San Diego", max_pages: int = 3):
        self.client = client
        self.city = city
        self.max_pages = max_pages

    @abc.abstractmethod
    def fetch(self) -> Iterable[Listing]:
        """Yield Listing objects for this source. Must not raise on empty results."""
        raise NotImplementedError
