# San Diego Commercial Listings Scraper

A modular Python tool that scrapes commercial real-estate listings in San Diego
from multiple sources and normalizes them into a single JSON file.

## Architecture

```
scraper/
  models.py          Listing dataclass + price/sqft parsing
  http.py            PoliteClient: shared session, retries, rate limit, robots.txt
  base.py            SourceAdapter interface
  pipeline.py        collect() -> filter to San Diego -> dedupe -> write JSON
  adapters/
    craigslist.py    Fully working, plain HTTP (no browser needed)
    loopnet.py       Playwright (Cloudflare + JS) — template, ToS-restricted
    crexi.py         Playwright (SPA) — template, ToS-restricted
    generic.py       Config-driven adapter for broker sites (CSS selectors)
    browser.py       Shared Playwright helper
main.py              CLI
sites.example.json   Sample config for the generic adapter
```

Every adapter emits the same `Listing` schema, so adding a source never changes
downstream code. The pipeline geo-filters to San Diego County place names,
de-duplicates by URL, stamps `scraped_at`, and writes JSON.

## Install

```bash
cd tools/sd-commercial-scraper
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Optional — only for LoopNet / Crexi / render:true broker targets:
pip install playwright && playwright install chromium
```

## Usage

```bash
# Craigslist only (no browser needed) -> listings.json
python main.py --sources craigslist

# All built-in sources
python main.py --sources all

# Your own broker sites (no code — just CSS selectors in JSON)
python main.py --config sites.example.json

# Combine, custom output
python main.py --sources craigslist loopnet --config sites.example.json -o out/sd.json
```

Run `python main.py --help` for every flag (delay, area filter, robots, etc.).

## Output

```json
{
  "generated_at": "2026-08-01T18:00:00+00:00",
  "count": 42,
  "listings": [
    {
      "source": "craigslist",
      "url": "https://sandiego.craigslist.org/...",
      "title": "1,200 sqft office suite, Mission Valley",
      "price": 2400.0,
      "price_raw": "$2,400",
      "address": "Mission Valley",
      "city": "San Diego",
      "area_sqft": 1200,
      "listing_type": "lease",
      "scraped_at": "2026-08-01T18:00:00+00:00",
      "extra": { "category": "craigslist-commercial" }
    }
  ]
}
```

## Adding a broker site (no Python)

Copy `sites.example.json`, point `item` at the repeating listing container and
map the inner selectors to fields. Set `"render": true` for JS-heavy sites.

## Responsible use

- The client honors `robots.txt` by default and rate-limits every request.
- **LoopNet and Crexi restrict automated access in their Terms of Service.**
  Those adapters are structural templates — only run them against sources you
  are authorized to scrape, and keep selectors/politeness in check.
- Prefer official APIs or data feeds where a source offers them.
```
