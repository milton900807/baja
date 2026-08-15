"""Config-driven scraper for brokerage 'our team / professionals' pages.

Add a firm by mapping CSS selectors in a JSON config (see firms.example.json) —
no Python needed. Each professional card is turned into an Agent. Contact
details (phone/email) are pulled from the card text with regexes when a
dedicated selector isn't provided.
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .http import PoliteClient
from .models import Agent, classify, find_dre

log = logging.getLogger("labagents.directory")

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}")


class DirectorySource:
    name = "directory"

    def __init__(self, client: PoliteClient, *, config_path: str, city: str = "San Diego"):
        self.client = client
        self.city = city
        self.targets = json.loads(Path(config_path).read_text())

    def fetch(self) -> Iterable[Agent]:
        for target in self.targets:
            try:
                yield from self._fetch_target(target)
            except Exception as exc:  # never let one firm kill the run
                log.warning("Firm %s failed: %s", target.get("firm"), exc)

    def _text(self, node, selector: str | None) -> str | None:
        if not selector:
            return None
        el = node.select_one(selector)
        return el.get_text(strip=True) if el else None

    def _fetch_target(self, target: dict) -> Iterable[Agent]:
        resp = self.client.get(target["url"])
        if resp is None:
            return
        soup = BeautifulSoup(resp.text, "html.parser")
        sel = target["selectors"]
        cards = soup.select(sel["item"])
        firm = target.get("firm", target["url"])
        log.info("directory/%s: %d cards", firm, len(cards))

        # Optional filter: only keep cards whose text mentions these words
        # (e.g. ["life science", "lab"]) so a firm-wide roster is narrowed.
        require = [w.lower() for w in target.get("require_any", [])]

        for node in cards:
            blob = node.get_text(" ", strip=True)
            if require and not any(w in blob.lower() for w in require):
                continue
            agent = self._parse_card(node, target, sel, blob, firm)
            if agent:
                yield agent

    def _parse_card(self, node, target, sel, blob, firm) -> Agent | None:
        name = self._text(node, sel.get("name"))
        if not name:
            return None
        title = self._text(node, sel.get("title"))

        email = self._text(node, sel.get("email"))
        if not email:
            m = _EMAIL_RE.search(blob)
            email = m.group(0) if m else None

        phone = self._text(node, sel.get("phone"))
        if not phone:
            m = _PHONE_RE.search(blob)
            phone = m.group(0) if m else None

        link = node.select_one(sel.get("url", "a"))
        href = link.get("href") if link and link.has_attr("href") else None
        if href:
            href = urljoin(target["url"], href)

        return Agent(
            name=name,
            firm=firm,
            title=title,
            phone=phone,
            email=email,
            profile_url=href,
            city=self.city,
            dre_license=find_dre(blob),
            specialties=classify(title, firm, blob),
            source=firm,
            extra={"scraped": True},
        )
