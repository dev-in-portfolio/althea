import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(p) {
  const full = path.join(root, p);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function writeJson(p, data) {
  const full = path.join(root, p);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const bannedTitleSnippets = [
  'exit',
  'gallery',
  'quiz',
  'prompt',
  'takeaway',
  'hands-on',
  'hands on',
  'interactive',
];

function shouldFilter(title = '') {
  const t = title.toLowerCase();
  return bannedTitleSnippets.some((s) => t.includes(s));
}

function toTag(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const stop = new Set([
  'the','and','or','of','in','to','a','an','for','with','vs','from','as','on','by','into','why','what','how','is','are','be','vs','&'
]);

function titleTags(title) {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9-]/g, ''))
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((w) => !stop.has(w) && w.length > 2);
  const unique = Array.from(new Set(words));
  return unique.slice(0, 6).map(toTag).filter(Boolean);
}

function makeSummary(exhibit, hallName) {
  const title = exhibit.title || 'This exhibit';
  const base = `${title} in the ${hallName} frames the topic at research depth, emphasizing mechanisms, evidence quality, and interpretive limits.`;
  const extra = `It connects the exhibit to the hall’s conceptual core while foregrounding uncertainty, competing models, and scale-dependent effects.`;
  return `${base} ${extra}`.trim();
}

function makeBody(exhibit, hallName) {
  const title = exhibit.title || 'This exhibit';
  const p1 = `This exhibit in the ${hallName} situates ${title.toLowerCase()} within a research-grade evidentiary chain. It foregrounds operational definitions, boundary conditions, and measurement protocols, with attention to sampling design, calibration, and error propagation. Expect explicit distinctions between observable variables, latent states, and inferred processes, framed at multiple spatial and temporal scales.`;
  const p2 = `The core idea is that ${title.toLowerCase()} is best explained by coupling mechanistic theory to diagnostic signatures. The mapping is many-to-one: proxy sensitivity, confounding structure, and model priors can allow competing mechanisms to fit the same data. The exhibit highlights identifiability limits and the role of cross-validation across independent datasets or methods.`;
  const p3 = `Try a structured test: specify the state variables, hypothesized causal pathway, and the predictions that would be violated under a rival model. Then evaluate which observations are decisive versus merely consistent. This mirrors expert practice in assessing falsifiability, sensitivity to assumptions, and robustness under alternative parameterizations.`;
  const p4 = `This matters because it shows how high-confidence claims emerge from constrained inference, not isolated observations. The exhibit models expert reasoning: formalizing mechanisms, quantifying uncertainty, and revising theory as higher-resolution data or improved instrumentation shift what counts as reliable evidence.`;
  const body = [
    '## What you’ll see',
    p1,
    '## The core idea',
    p2,
    '## Try it',
    p3,
    '## Why it matters',
    p4,
  ].join('\n\n');
  return body;
}

const wings = readJson('data/wings.json');
const halls = readJson('data/halls.json');
let exhibits = readJson('data/exhibits.json');

const wingBySlug = new Map(wings.map((w) => [w.slug, w]));
const hallBySlug = new Map(halls.map((h) => [h.slug, h]));

const wingSlugs = new Set();
for (const w of wings) {
  if (wingSlugs.has(w.slug)) die(`Duplicate wing slug: ${w.slug}`);
  wingSlugs.add(w.slug);
}

const hallSlugs = new Set();
for (const h of halls) {
  if (hallSlugs.has(h.slug)) die(`Duplicate hall slug: ${h.slug}`);
  hallSlugs.add(h.slug);
  if (!wingBySlug.has(h.wingSlug)) die(`Hall ${h.slug} has unknown wingSlug ${h.wingSlug}`);
}

const exhibitSlugs = new Set();
for (const e of exhibits) {
  if (exhibitSlugs.has(e.slug)) die(`Duplicate exhibit slug: ${e.slug}`);
  exhibitSlugs.add(e.slug);
  if (!hallBySlug.has(e.hallSlug)) die(`Exhibit ${e.slug} has unknown hallSlug ${e.hallSlug}`);
}

exhibits = exhibits.filter((e) => !shouldFilter(e.title));

const enriched = exhibits.map((e) => {
  const hall = hallBySlug.get(e.hallSlug);
  const hallName = hall?.name || 'Hall';
  const wing = hall ? wingBySlug.get(hall.wingSlug) : null;
  const wingSlug = wing?.slug || '';

  const summary = (typeof e.summary === 'string' && e.summary.trim().length > 0)
    ? e.summary
    : makeSummary(e, hallName);

  const tags = (Array.isArray(e.tags) && e.tags.length > 0)
    ? e.tags
    : Array.from(new Set([
        `hall-${toTag(e.hallSlug || '')}`,
        wingSlug ? `wing-${toTag(wingSlug)}` : null,
        ...titleTags(e.title || ''),
      ].filter(Boolean))).slice(0, 8);

  const body = (typeof e.body === 'string' && e.body.trim().length > 0)
    ? e.body
    : makeBody(e, hallName);

  const images = Array.isArray(e.images) ? e.images : [];
  const sources = Array.isArray(e.sources) ? e.sources : [];

  return {
    ...e,
    summary,
    tags,
    body,
    images,
    sources,
  };
});

const exhibitsIndex = enriched.map((e) => ({
  slug: e.slug,
  title: e.title,
  hallSlug: e.hallSlug,
  wingSlug: hallBySlug.get(e.hallSlug)?.wingSlug || '',
  summary: e.summary,
  tags: e.tags,
  images: e.images,
  sources: e.sources,
}));

const museum = { wings, halls, exhibits: exhibitsIndex };

const generatedTs = `// Generated file. Do not edit manually.\n\nexport const museum = ${JSON.stringify(museum, null, 2)} as const;\n\nexport type Wing = typeof museum.wings[number];\nexport type Hall = typeof museum.halls[number];\nexport type Exhibit = typeof museum.exhibits[number];\n\nexport const wingBySlug = new Map(museum.wings.map(w => [w.slug, w]));\nexport const hallBySlug = new Map(museum.halls.map(h => [h.slug, h]));\nexport const exhibitBySlug = new Map(museum.exhibits.map(e => [e.slug, e]));\n`;

fs.writeFileSync(path.join(root, 'src/generated/museum.ts'), generatedTs);

writeJson('public/search-index.json', enriched.map((e) => ({
  slug: e.slug,
  title: e.title,
  wingSlug: hallBySlug.get(e.hallSlug)?.wingSlug || '',
  hallSlug: e.hallSlug,
  tags: e.tags || [],
  summary: e.summary || '',
})));

writeJson('public/exhibit-slugs.json', enriched.map((e) => e.slug));

console.log('Data build complete:', {
  wings: wings.length,
  halls: halls.length,
  exhibits: enriched.length,
});
