import fs from "node:fs";
import path from "node:path";

const dataPath = path.resolve("data/boh_to_tech_full_enriched_ultra.jsonl");
const outDir = path.resolve("src/content/terms");

if (!fs.existsSync(dataPath)) {
  console.error(`Missing dataset: ${dataPath}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith(".md")) fs.unlinkSync(path.join(outDir, file));
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || "term";

const normalizeCategory = (c) => {
  const v = String(c || "").toUpperCase();
  if (v.includes("BOH")) return "BOH";
  if (v.includes("FOH")) return "FOH";
  if (v.includes("MANAGEMENT")) return "MANAGEMENT";
  if (v.includes("INVENTORY")) return "INVENTORY";
  if (v.includes("SERVICE")) return "SERVICE";
  return "GENERAL";
};

const splitList = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  const s = String(v);
  const parts = s
    .split(/[\n;|•]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;
  return s
    .split(/,\s+/g)
    .map((x) => x.trim())
    .filter(Boolean);
};

const safe = (s) => String(s || "").replace(/"/g, "'");

const lines = fs.readFileSync(dataPath, "utf8").split("\n").filter((l) => l.trim());
const records = lines.map((l) => JSON.parse(l));
const seen = new Map();

for (const r of records) {
  const term = String(r.Term || "").trim();
  if (!term) continue;
  const base = slugify(term);
  const id = String(r.ID || "").trim();
  const key = base;
  const count = (seen.get(key) || 0) + 1;
  seen.set(key, count);
  const slug = count === 1 ? base : `${base}-${id || count}`;
  const category = normalizeCategory(r.Category);
  const techEq = splitList(r.TechMeaning || r.Engineer_Analogy || r.Humorous_Version);
  const defRest = safe(r.Description || r.Restaurant_Story || term);
  const defTech = safe(r.TechMeaning || r.Engineer_Analogy || defRest);
  const exRest = splitList(r.Examples || r.Restaurant_Story || []);
  const exTech = splitList(r.Engineer_Analogy || r.Humorous_Version || r.TechMeaning || []);
  const tags = splitList(r.Tags || category.toLowerCase()).map((t) => t.toLowerCase());
  const related = [];

  const toMd = `---
term: "${safe(term)}"
slug: "${slug}"
category: ${category}
techEquivalent:
${(techEq.length ? techEq : ["tech equivalent"]).map((x) => `  - "${safe(x)}"`).join("\n")}
definitionRestaurant: "${defRest}"
definitionTech: "${defTech}"
examplesRestaurant:
${(exRest.length ? exRest : [defRest]).map((x) => `  - "${safe(x)}"`).join("\n")}
examplesTech:
${(exTech.length ? exTech : [defTech]).map((x) => `  - "${safe(x)}"`).join("\n")}
tags:
${(tags.length ? tags : ["general"]).map((x) => `  - "${safe(x)}"`).join("\n")}
related: []
---

## Restaurant
${defRest}

## Tech
${defTech}
`;

  fs.writeFileSync(path.join(outDir, `${slug}.md`), toMd, "utf8");
}

console.log(`Wrote ${records.length} terms from JSONL.`);
