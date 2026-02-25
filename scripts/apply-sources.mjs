import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argPath = process.argv[2];
if (!argPath) {
  console.error('Usage: node scripts/apply-sources.mjs data/sources/batch-XX.json');
  process.exit(1);
}
const sourcesPath = path.join(root, argPath);
const exhibitsPath = path.join(root, 'data/exhibits.json');

const sourcesByHall = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
const force = process.argv.includes('--force');
const exhibits = JSON.parse(fs.readFileSync(exhibitsPath, 'utf8'));

let updated = 0;
for (const e of exhibits) {
  const hallSources = sourcesByHall[e.hallSlug];
  if (!hallSources) continue;
  if (force || !Array.isArray(e.sources) || e.sources.length === 0) {
    e.sources = hallSources;
    updated++;
  }
}

fs.writeFileSync(exhibitsPath, JSON.stringify(exhibits, null, 2));
console.log('Applied sources to exhibits:', updated);
