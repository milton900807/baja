"""Load the curated seed dataset of known San Diego lab-space agents."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable

from .models import Agent, classify, find_dre

log = logging.getLogger("labagents.seed")

DEFAULT_SEED = Path(__file__).resolve().parent.parent / "data" / "seed_agents.json"


class SeedSource:
    name = "seed"

    def __init__(self, path: str | Path = DEFAULT_SEED, *, city: str = "San Diego"):
        self.path = Path(path)
        self.city = city

    def fetch(self) -> Iterable[Agent]:
        data = json.loads(self.path.read_text())
        rows = data.get("agents", [])
        log.info("seed: %d curated agents", len(rows))
        for row in rows:
            specialties = row.get("specialties") or classify(row.get("title"), row.get("firm"))
            yield Agent(
                name=row["name"],
                firm=row.get("firm"),
                title=row.get("title"),
                phone=row.get("phone"),
                email=row.get("email"),
                profile_url=row.get("profile_url"),
                office_address=row.get("office_address"),
                city=row.get("city", self.city),
                dre_license=row.get("dre_license") or find_dre(row.get("title")),
                specialties=specialties,
                source=self.name,
                extra={"curated": True},
            )
