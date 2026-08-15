"""Collect, filter, dedupe, and serialize agents to JSON and CSV."""
from __future__ import annotations

import csv
import datetime as _dt
import json
import logging
from pathlib import Path

from .models import Agent, looks_life_science

log = logging.getLogger("labagents.pipeline")


def collect(sources, *, require_life_science: bool = True) -> list[Agent]:
    """Run every source, tag, dedupe, and optionally keep only lab-focused agents.

    When two records share a name+firm, fields are merged so a scraped record
    can fill in contact details missing from the curated seed (and vice-versa).
    """
    stamp = _dt.datetime.now(_dt.timezone.utc).isoformat()
    by_key: dict[str, Agent] = {}

    for source in sources:
        kept = 0
        for agent in source.fetch():
            if require_life_science and not (
                "life-science" in agent.specialties
                or looks_life_science(agent.title, agent.firm)
            ):
                continue
            agent.scraped_at = stamp
            key = agent.dedupe_key()
            if key in by_key:
                _merge(by_key[key], agent)
            else:
                by_key[key] = agent
            kept += 1
        log.info("%s: %d agents", getattr(source, "name", "?"), kept)

    return list(by_key.values())


def _merge(base: Agent, other: Agent) -> None:
    """Fill empty fields on `base` from `other`; union specialties."""
    for f in ("firm", "title", "phone", "email", "profile_url", "office_address", "dre_license"):
        if not getattr(base, f) and getattr(other, f):
            setattr(base, f, getattr(other, f))
    base.specialties = sorted(set(base.specialties) | set(other.specialties))


def write_json(agents: list[Agent], path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "count": len(agents),
        "agents": [a.to_dict() for a in agents],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    return path


def write_csv(agents: list[Agent], path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    cols = ["name", "firm", "title", "phone", "email", "profile_url",
            "office_address", "city", "dre_license", "specialties", "source"]
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(cols)
        for a in sorted(agents, key=lambda x: (x.firm or "", x.name)):
            d = a.to_dict()
            d["specialties"] = ", ".join(d["specialties"])
            w.writerow([d.get(c, "") for c in cols])
    return path
