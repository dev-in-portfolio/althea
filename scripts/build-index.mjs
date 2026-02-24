import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "src", "content", "terms");
const outDir = path.join(root, "public", "data");
const outFile = path.join(outDir, "terms.json");

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

const parseFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const raw = match[1].split("\n");
  const data = {};
  let currentKey = null;
  raw.forEach((line) => {
    if (!line.trim()) return;
    if (line.startsWith("  - ") && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(line.replace("  - ", "").trim());
      return;
    }
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (value === "") {
      currentKey = key;
      data[currentKey] = [];
    } else {
      data[key] = value;
      currentKey = key;
    }
  });
  return data;
};

const items = files.map((file) => {
  const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
  const data = parseFrontmatter(raw);
  const fallbackSlug = file.replace(/\.md$/, "");
  return {
    term: data.term,
    slug: data.slug || fallbackSlug,
    category: data.category,
    techEquivalent: data.techEquivalent || [],
    definitionRestaurant: data.definitionRestaurant || "",
    definitionTech: data.definitionTech || "",
    examplesRestaurant: data.examplesRestaurant || [],
    examplesTech: data.examplesTech || [],
    tags: data.tags || [],
    related: data.related || []
  };
});

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(items, null, 2));
console.log(`Wrote ${items.length} terms to public/data/terms.json`);
