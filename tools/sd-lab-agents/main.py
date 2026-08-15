#!/usr/bin/env python3
"""Generate a list of commercial lab / life-science real-estate agents in San Diego.

Examples
--------
    # Ships with a verified seed list — no network needed:
    python main.py                         # -> agents.json + agents.csv

    # Refresh / expand by scraping firm team pages you've configured:
    python main.py --firms firms.example.json

    # Seed only, JSON to a custom path, keep even non-lab agents:
    python main.py --no-seed-only -o out/agents.json --all-specialties
"""
from __future__ import annotations

import argparse
import logging
import sys

from labagents.directory import DirectorySource
from labagents.http import PoliteClient
from labagents.pipeline import collect, write_csv, write_json
from labagents.seed import DEFAULT_SEED, SeedSource


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Build a list of San Diego lab / life-science CRE agents.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--seed", default=str(DEFAULT_SEED), help="path to the curated seed JSON.")
    p.add_argument("--no-seed", action="store_true", help="skip the curated seed list.")
    p.add_argument("--firms", help="JSON config of firm team pages to scrape.")
    p.add_argument("-o", "--output", default="agents.json", help="output JSON path.")
    p.add_argument("--csv", default="agents.csv", help="output CSV path (set '' to skip).")
    p.add_argument("--city", default="San Diego", help="city label for agents.")
    p.add_argument("--delay", type=float, default=2.0, help="seconds between requests.")
    p.add_argument(
        "--all-specialties",
        action="store_true",
        help="keep every agent, not just lab / life-science ones.",
    )
    p.add_argument("--ignore-robots", action="store_true", help="skip robots.txt checks.")
    p.add_argument("-v", "--verbose", action="store_true", help="debug logging.")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    sources = []
    if not args.no_seed:
        sources.append(SeedSource(args.seed, city=args.city))
    if args.firms:
        client = PoliteClient(delay=args.delay, obey_robots=not args.ignore_robots)
        sources.append(DirectorySource(client, config_path=args.firms, city=args.city))

    if not sources:
        raise SystemExit("Nothing to do: --no-seed was set and no --firms config given.")

    agents = collect(sources, require_life_science=not args.all_specialties)
    json_path = write_json(agents, args.output)
    msg = f"\nWrote {len(agents)} agents to {json_path}"
    if args.csv:
        csv_path = write_csv(agents, args.csv)
        msg += f" and {csv_path}"
    print(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
