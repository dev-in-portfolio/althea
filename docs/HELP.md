# Codex of Hieroglyphs — Help & Maintenance Guide

This document is for developers and maintainers. It is **not** displayed in the app UI.

## 1) Local Setup
```sh
npm install
npm run build:data
npm run dev -- --host 127.0.0.1 --port 4321
```

## 2) Data Ingestion Pipeline
The main build script is `scripts/build-data.mjs`. It reads all available sources, merges them, and outputs:
- `public/data/signs.json`
- `public/data/report.json`

### Key Inputs (auto‑detected)
The build script checks both `data/` and `sources_user/` for:
- `Unikemet.txt`
- `UnicodeData.txt`
- `gardiner2unicode.wiki`
- `elrc-Gardiner.json`
- `elrc-DictionaryEntries.json`
- `elrc-Aegyptus.json`
- `Unicode-MdC-Mapping-v1.utf8`
- `aed_spellings.html`
- `aed_word_translations.html`
- `overrides.json`
- `Gardiner_signlist.pdf` (OCR optional)

### Optional Sources
Place in `sources_user/` if you have them:
- `signs_definition.xml` (JSesh sign definitions)
- `Gardiner_signlist.pdf` OCR output in `data/ocr/Gardiner_signlist.ocr.txt`

## 3) Source Refresh
```sh
npm run fetch:unicode
npm run fetch:elrc
npm run build:data
```

## 4) QA & Reporting
```sh
npm run qa
```
`public/data/report.json` contains counts of missing fields and a sample of missing entries.

## 5) Overrides
Use `data/overrides.json` to correct or enrich any field on a specific sign:
```json
{
  "U+13000:A001": {
    "meanings": [{ "text": "man" }],
    "transliterations": [{ "text": "j" }]
  }
}
```

## 6) Expected Counts
Unicode Egyptian Hieroglyphs (U+13000–U+1342F) plus Extended‑A (U+13460–U+143FF) totals **5105 signs** in `UnicodeData.txt`.

If you see a lower count:
1. Ensure `UnicodeData.txt` is present.
2. Rebuild with `npm run build:data`.

## 7) Troubleshooting
### Dev server not reachable
Use local host binding:
```sh
npm run dev -- --host 127.0.0.1 --port 4321
```

### Missing glyphs
Check that a hieroglyph font exists in `public/fonts/`. The UI expects it via CSS `@font-face`.

### OCR for Gardiner PDF
If you have `ocrmypdf` and `tesseract` installed:
```sh
npm run ocr:gardiner
npm run build:data
```

## 8) Licensing & Attribution
- Unicode data: Unicode Terms of Use
- Wikipedia (wikitext sources): CC BY‑SA 4.0
- AED datasets: CC BY‑SA 4.0
- ELRC: license not published (treat as metadata)

Keep sources and citations in dataset fields. Avoid embedding large copyrighted text.

## 9) Release Checklist
1. `npm run build:data`
2. `npm run qa`
3. `npm run build`
4. Commit changes in:
   - `public/data/`
   - `data/` (if new raw sources)
   - `scripts/`
