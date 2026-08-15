#!/usr/bin/env python3
"""CLI for the San Diego commercial-listings scraper.

Examples
--------
    # Craigslist only (no extra deps), write to listings.json
    python main.py --sources craigslist

    # All built-in sources (LoopNet/Crexi need Playwright installed)
    python main.py --sources craigslist loopnet crexi

    # Your own broker sites configured in a JSON file
    python main.py --config sites.example.json

    # Everything, custom output path, faster (less polite) crawl
    python main.py --sources all --config sites.example.json -o out/sd.json --delay 1
"""
from __future__ import annotations

import argparse
import logging
import sys

from scraper.adapters import BUILTIN_ADAPTERS, GenericAdapter
from scraper.http import PoliteClient
from scraper.pipeline import collect, write_json


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Scrape commercial real-estate listings in San Diego.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--sources",
        nargs="*",
        default=["craigslist"],
        help="built-in sources to run: craigslist loopnet crexi (or 'all'). "
        "Default: craigslist.",
    )
    p.add_argument(
        "--config",
        help="path to a JSON file of custom broker-site targets (generic adapter).",
    )
    p.add_argument("-o", "--output", default="listings.json", help="output JSON path.")
    p.add_argument("--city", default="San Diego", help="city label for listings.")
    p.add_argument("--delay", type=float, default=2.0, help="seconds between requests.")
    p.add_argument("--max-pages", type=int, default=3, help="max result pages per source.")
    p.add_argument(
        "--no-area-filter",
        action="store_true",
        help="keep every listing, even ones that don't mention a San Diego area.",
    )
    p.add_argument(
        "--ignore-robots",
        action="store_true",
        help="do not consult robots.txt (use only where you're authorized).",
    )
    p.add_argument("-v", "--verbose", action="store_true", help="debug logging.")
    return p


def resolve_sources(names: list[str]) -> list[str]:
    if not names or "all" in names:
        return list(BUILTIN_ADAPTERS)
    unknown = [n for n in names if n not in BUILTIN_ADAPTERS]
    if unknown:
        raise SystemExit(
            f"Unknown source(s): {', '.join(unknown)}. "
            f"Choose from: {', '.join(BUILTIN_ADAPTERS)} (or 'all')."
        )
    return names


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    client = PoliteClient(delay=args.delay, obey_robots=not args.ignore_robots)

    adapters = []
    for name in resolve_sources(args.sources):
        cls = BUILTIN_ADAPTERS[name]
        adapters.append(cls(client, city=args.city, max_pages=args.max_pages))

    if args.config:
        adapters.append(
            GenericAdapter(client, config_path=args.config, city=args.city, max_pages=args.max_pages)
        )

    if not adapters:
        raise SystemExit("No sources selected. Use --sources and/or --config.")

    browser_sources = [a.name for a in adapters if getattr(a, "needs_browser", False)]
    if browser_sources:
        logging.getLogger("scraper").info(
            "Browser-based sources selected (%s): they run only if Playwright is "
            "installed, otherwise they're skipped.",
            ", ".join(browser_sources),
        )

    listings = collect(adapters, filter_area=not args.no_area_filter)
    path = write_json(listings, args.output)
    print(f"\nWrote {len(listings)} listings to {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
