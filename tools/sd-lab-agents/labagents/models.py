"""Normalized data model for a commercial lab / life-science real-estate agent."""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field, asdict
from typing import Optional


# Signals that an agent/firm actually works on lab / life-science space, used
# both to tag records and to score how relevant a scraped agent is.
LIFE_SCIENCE_TERMS = [
    "life science", "life sciences", "laboratory", "lab space", "lab ",
    "biotech", "bioscience", "life-science", "pharma", "r&d", "gmp",
    "wet lab", "vivarium", "cleanroom", "medical device", "science center",
]
TENANT_REP_TERMS = ["tenant rep", "tenant representation", "tenant advisor", "tenant-rep"]

# San Diego County place / submarket signals.
SD_TERMS = [
    "san diego", "la jolla", "torrey pines", "sorrento valley", "sorrento mesa",
    "utc", "university city", "carlsbad", "del mar", "mira mesa", "poway",
    "92121", "92122", "92037", "92130", "92008",
]

_LS_RE = re.compile("|".join(re.escape(t) for t in LIFE_SCIENCE_TERMS), re.I)
_TR_RE = re.compile("|".join(re.escape(t) for t in TENANT_REP_TERMS), re.I)
_SD_RE = re.compile("|".join(re.escape(t) for t in SD_TERMS), re.I)
_DRE_RE = re.compile(r"\b(?:0[12]\d{6})\b")  # CA DRE license: 8 digits, 01/02 prefix


@dataclass
class Agent:
    """A commercial real-estate agent/broker who works on lab space."""

    name: str
    firm: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    profile_url: Optional[str] = None
    office_address: Optional[str] = None
    city: str = "San Diego"
    dre_license: Optional[str] = None
    specialties: list = field(default_factory=list)
    source: Optional[str] = None       # where this record came from
    scraped_at: Optional[str] = None
    extra: dict = field(default_factory=dict)

    def dedupe_key(self) -> str:
        basis = f"{(self.name or '').strip().lower()}|{(self.firm or '').strip().lower()}"
        return hashlib.sha1(basis.encode("utf-8")).hexdigest()

    def to_dict(self) -> dict:
        return asdict(self)


def classify(*text_parts: Optional[str]) -> list[str]:
    """Return specialty tags inferred from any free text about the agent."""
    text = " ".join(p for p in text_parts if p)
    tags = []
    if _LS_RE.search(text):
        tags.append("life-science")
    if _TR_RE.search(text):
        tags.append("tenant-rep")
    return tags


def looks_life_science(*text_parts: Optional[str]) -> bool:
    return bool(_LS_RE.search(" ".join(p for p in text_parts if p)))


def looks_san_diego(*text_parts: Optional[str]) -> bool:
    return bool(_SD_RE.search(" ".join(p for p in text_parts if p)))


def find_dre(*text_parts: Optional[str]) -> Optional[str]:
    match = _DRE_RE.search(" ".join(p for p in text_parts if p))
    return match.group(0) if match else None
