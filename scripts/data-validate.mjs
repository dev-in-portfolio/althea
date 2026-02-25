import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(p) {
  const full = path.join(root, p);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const wings = readJson('data/wings.json');
const halls = readJson('data/halls.json');
const exhibits = readJson('data/exhibits.json');

const wingSlugs = new Set();
for (const w of wings) {
  if (wingSlugs.has(w.slug)) die(`Duplicate wing slug: ${w.slug}`);
  wingSlugs.add(w.slug);
}

const hallSlugs = new Set();
for (const h of halls) {
  if (hallSlugs.has(h.slug)) die(`Duplicate hall slug: ${h.slug}`);
  hallSlugs.add(h.slug);
  if (!wingSlugs.has(h.wingSlug)) die(`Hall ${h.slug} has unknown wingSlug ${h.wingSlug}`);
}

const exhibitSlugs = new Set();
for (const e of exhibits) {
  if (exhibitSlugs.has(e.slug)) die(`Duplicate exhibit slug: ${e.slug}`);
  exhibitSlugs.add(e.slug);
  if (!hallSlugs.has(e.hallSlug)) die(`Exhibit ${e.slug} has unknown hallSlug ${e.hallSlug}`);
}

console.log('Data validation ok:', {
  wings: wings.length,
  halls: halls.length,
  exhibits: exhibits.length,
});
