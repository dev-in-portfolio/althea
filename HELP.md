# Help — Interactive Terms Translator

## What this app does
Translates restaurant BOH/FOH/ops language into tech/product/engineering equivalents (and reverse). It is local‑first and works offline. Backend sync is optional.

## How to use (Fast)
1. Pick **Category**.
2. Pick **Subcategory** (tags).
3. Pick **Term**.
4. Press **Fire**.

You can also use **Quick Jump** to jump to a term instantly.

## Controls
- **Direction**: Restaurant → Tech or Tech → Restaurant
- **Fire**: Execute translation
- **86**: Clear and reset
- **Rush Mode**: Filters terms by operational urgency
- **Signals**: Filters terms by incident type / operational state

## Pages
- `/` Translator
- `/terms` Full list
- `/terms/[slug]` Term detail
- `/categories` Category browser
- `/favorites` Saved items
- `/contribute` Add a custom term

## Favorites
Favorites are stored locally. If the backend is available, they sync to Neon.

## Custom Terms
Use **Contribute** to add a term.  
If the backend is not available, the term is marked **local‑only**.

## Troubleshooting
- **Site won’t load on 127.0.0.1**: use `http://localhost:4321/`
- **/api 404** in dev: Netlify Functions aren’t running in Astro dev. This is expected.
- **No results**: clear filters, set Category to **All**, Subcategory to **All**, then retry.

## Data Updates
To regenerate content from the JSONL dataset:
```bash
node scripts/generate-terms.mjs
node scripts/build-index.mjs
```

