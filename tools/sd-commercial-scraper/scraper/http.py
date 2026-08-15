"""Polite HTTP client: shared session, retries, rate limiting, robots.txt."""
from __future__ import annotations

import logging
import time
import urllib.robotparser
from typing import Optional
from urllib.parse import urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

log = logging.getLogger("scraper.http")

DEFAULT_UA = (
    "Mozilla/5.0 (compatible; SDCommercialScraper/1.0; "
    "+https://example.com/bot-info)"
)


class PoliteClient:
    """Wraps requests.Session with rate limiting and robots.txt awareness.

    A single client instance is meant to be shared by all adapters so the
    delay between requests is enforced globally, not per-source.
    """

    def __init__(
        self,
        *,
        user_agent: str = DEFAULT_UA,
        delay: float = 2.0,
        timeout: float = 20.0,
        obey_robots: bool = True,
    ):
        self.delay = delay
        self.timeout = timeout
        self.obey_robots = obey_robots
        self._last_request = 0.0
        self._robots: dict[str, Optional[urllib.robotparser.RobotFileParser]] = {}

        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": user_agent,
                "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )
        retry = Retry(
            total=3,
            backoff_factor=1.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(["GET"]),
            respect_retry_after_header=True,
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    # -- rate limiting ------------------------------------------------------
    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_request = time.monotonic()

    # -- robots.txt ---------------------------------------------------------
    def _allowed(self, url: str) -> bool:
        if not self.obey_robots:
            return True
        parts = urlparse(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in self._robots:
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(f"{origin}/robots.txt")
            try:
                rp.read()
            except Exception as exc:  # network/parse error -> fail open
                log.warning("Could not read robots.txt for %s: %s", origin, exc)
                rp = None
            self._robots[origin] = rp
        rp = self._robots[origin]
        if rp is None:
            return True
        return rp.can_fetch(self.session.headers["User-Agent"], url)

    # -- public API ---------------------------------------------------------
    def get(self, url: str, **kwargs) -> Optional[requests.Response]:
        """GET a URL, respecting robots.txt and the global rate limit.

        Returns None when robots.txt disallows the URL or the request fails.
        """
        if not self._allowed(url):
            log.warning("Blocked by robots.txt, skipping: %s", url)
            return None
        self._throttle()
        try:
            resp = self.session.get(url, timeout=self.timeout, **kwargs)
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            log.warning("Request failed for %s: %s", url, exc)
            return None
