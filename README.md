# Codex of Hieroglyphs

Local‑first Egyptian hieroglyph reference built with Astro. This repo includes a data ingestion pipeline that merges multiple public datasets into a single searchable index.

## Quick Start
```sh
npm install
npm run build:data
npm run dev -- --host 127.0.0.1 --port 4321
```

Open: `http://127.0.0.1:4321/`

## Project Structure
```text
/
├── data/                  # Raw datasets (public and user‑provided)
├── public/
│   ├── data/              # Generated data (signs.json, report.json)
│   └── fonts/             # Hieroglyph font assets
├── scripts/               # Build/ingest tools
├── sources_user/          # BYOS: drop in PDFs/text here
├── src/
│   └── pages/index.astro  # Main app UI
└── README.md
```

## Commands
```sh
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview build output
npm run build:data # Rebuild dataset from data/ + sources_user/
npm run qa         # Data completeness report
```

## Data Pipeline (Summary)
The build script merges multiple sources into `public/data/signs.json`:

Primary sources:
- `data/UnicodeData.txt` (Unicode names)
- `data/Unikemet.txt` (categories + functional tags)
- `data/elrc-*.json` (ELRC metadata/definitions)
- `data/gardiner2unicode.wiki` (Gardiner list)
- `data/Unicode-MdC-Mapping-v1.utf8` (MdC / phonetic values)
- AED public lists (spellings + translations)
- Optional OCR for Gardiner PDF (see `scripts/ocr-gardiner.mjs`)

Outputs:
- `public/data/signs.json` (main dataset)
- `public/data/report.json` (completeness report)

## BYOS (Bring Your Own Sources)
Drop files into `sources_user/` (preferred) or `data/`:
- `Unikemet.txt`
- `UnicodeData.txt`
- `gardiner2unicode.wiki`
- `Gardiner_signlist.pdf`
- `U13000.pdf`, `U13460.pdf`
- `overrides.json`

Then run:
```sh
npm run build:data
```

## Fonts
This project expects a real Egyptian hieroglyph font in `public/fonts/`.
Recommended: Noto Sans Egyptian Hieroglyphs (OFL).

## QA / Completeness
Run:
```sh
npm run qa
```
This prints counts of missing fields so you can decide which sources to add next.

## Troubleshooting
- Dev server not reachable: use `--host 127.0.0.1` (local only).
- Missing glyphs: verify the font files in `public/fonts/`.
- Low counts: run `npm run build:data` again after updating sources.

## License Notes
Public datasets and third‑party sources retain their own licenses. This repo stores metadata and short, non‑copyrighted excerpts where allowed. Do not embed full copyrighted texts without permission.

For more detail, see `docs/HELP.md`.
