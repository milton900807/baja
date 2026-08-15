# San Diego Lab / Life-Science Real-Estate Agent Finder

Generates a structured list of commercial real-estate agents/brokers who
specialize in **laboratory / life-science space in San Diego** (Torrey Pines,
UTC, Sorrento Valley/Mesa, etc.). Outputs JSON and CSV.

It combines two sources:

1. **Curated seed** (`data/seed_agents.json`) — a verified starter list of the
   major San Diego life-science CRE teams, gathered from each firm's public
   pages (CBRE, JLL, Cushman & Wakefield, Hughes Marino, Shelton & Associates).
   Works with **no network access**.
2. **Directory scraper** (`labagents/directory.py`) — a config-driven scraper
   that pulls agents from firm "our team / professionals" pages you list in a
   JSON file. Add a firm with CSS selectors — no Python needed.

Records are normalized to one `Agent` schema, tagged by specialty
(`life-science`, `tenant-rep`), de-duplicated by name+firm (merging contact
details across sources), and filtered to lab/life-science by default.

## Architecture

```
labagents/
  models.py       Agent dataclass + specialty tagging, DRE + SD detection
  http.py         PoliteClient: session, retries, rate limit, robots.txt
  seed.py         Loads the curated seed dataset
  directory.py    Config-driven firm team-page scraper
  pipeline.py     collect -> filter -> dedupe/merge -> JSON + CSV
main.py           CLI
data/seed_agents.json   Verified starter list
firms.example.json      Template config for the directory scraper
```

## Install & run

```bash
cd tools/sd-lab-agents
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Verified seed list, no network:
python main.py                      # -> agents.json + agents.csv

# Add scraped firm rosters:
python main.py --firms firms.example.json
```

`python main.py --help` lists every flag.

## Output (`agents.json`)

```json
{
  "generated_at": "2026-08-01T18:00:00+00:00",
  "count": 22,
  "agents": [
    {
      "name": "Ted Jacobs",
      "firm": "CBRE",
      "title": "Vice Chairman, Managing Director — Life Sciences Practice",
      "phone": "+1 858 546 4655",
      "email": "ted.jacobs@cbre.com",
      "profile_url": "https://www.cbre.com/people/ted-jacobs",
      "office_address": "4301 La Jolla Village Dr, Suite 3000, San Diego, CA 92122",
      "city": "San Diego",
      "dre_license": null,
      "specialties": ["life-science", "tenant-rep"],
      "source": "seed"
    }
  ]
}
```

## Adding a firm to the scraper

Copy `firms.example.json`, point `item` at the repeating professional card and
map the inner selectors. Use `require_any` (e.g. `["life science","lab"]`) to
keep only lab-focused people from a firm-wide roster.

## Notes on the data

- The seed's contact fields are filled **only where the firm's public page
  showed them**; the rest are `null` and can be enriched by the scraper or by
  visiting the linked profile. **Verify names/contacts before outreach** — CRE
  teams change often.
- The client honors `robots.txt` and rate-limits by default. Scrape only
  publicly listed professional directories, and respect each site's Terms of
  Service. This tool is for legitimate business-development research, not bulk
  unsolicited contact.
```
