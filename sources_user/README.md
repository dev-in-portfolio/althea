# Bring Your Own Sources (BYOS)

Place user-provided sources in this folder. The ingestion pipeline scans both the repo root and this folder.

## Supported inputs
- `Unikemet.txt`
- `UnicodeData.txt`
- `elrc-Gardiner.json` (ELRC API export)
- `elrc-DictionaryEntries.json`
- `elrc-Aegyptus.json`
- `omnika-gardiner.xlsx`
- `gardiner2unicode.wiki` (Wikipedia-derived table)
- `tla-late_egyptian-v19-premium.jsonl`
- `RamsesTrainingSetModel.json`
- `juheapi-egyptian-hieroglyphs.json` (optional; GPL-NC)
- `overrides.json`

## How to fetch sources
```bash
npm run fetch:unicode
npm run fetch:elrc
```

## OCR Gardiner (optional)
Requires `ocrmypdf` + `tesseract` installed on your machine.
```bash
npm run ocr:gardiner
```

## How to run ingestion
```bash
npm run build:data
```

## Notes
- ELRC and OMNIKA sources are used under user permission. If you have explicit license text, add it to this folder.
- Wikipedia-derived data is CC BY-SA 4.0; attribution is recorded in `public/data/sources.json`.
- TLA corpus is CC BY-SA 4.0; usage examples are stored with line pointers.
- Ramses model is CC BY 4.0; used as a transliteration vocabulary reference.
- JuheAPI is non-commercial; only add if you accept NC constraints.
