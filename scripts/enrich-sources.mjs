import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("src/content/paradoxes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const toSlug = (s) =>
  s
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const readFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: "", body: text };
  return { fm: match[1], body: text.slice(match[0].length).trimStart() };
};

const getField = (fm, key) => {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const m = fm.match(re);
  return m ? m[1].trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "") : "";
};

const listField = (fm, key) => {
  const re = new RegExp(`^${key}:\\s*$([\\s\\S]*?)(^\\w|\\Z)`, "m");
  const m = fm.match(re);
  if (!m) return [];
  const block = m[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^- /, "").replace(/^'|'$/g, "").replace(/^"|"$/g, ""));
  return block;
};

const setListField = (fm, key, values) => {
  const re = new RegExp(`^${key}:\\s*$([\\s\\S]*?)(^\\w|\\Z)`, "m");
  const block = `${key}:\n${values.map((v) => `  - ${v}`).join("\n")}\n`;
  if (re.test(fm)) {
    return fm.replace(re, `${block}$2`);
  }
  return `${fm}\n${block}`;
};

const headOk = async (url) => {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
};

let updated = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const { fm, body } = readFrontmatter(raw);
  if (!fm) continue;

  const title = getField(fm, "title");
  const slug = toSlug(title || file.replace(/^\d+-/, "").replace(/\.md$/, ""));
  const sources = new Set(listField(fm, "sources"));

  const sep = `https://plato.stanford.edu/entries/${slug}/`;
  const iep = `https://iep.utm.edu/${slug}/`;

  if (!(sources.has(sep))) {
    const ok = await headOk(sep);
    if (ok) sources.add(sep);
  }
  await sleep(150);

  if (!(sources.has(iep))) {
    const ok = await headOk(iep);
    if (ok) sources.add(iep);
  }
  await sleep(150);

  const newFm = setListField(fm, "sources", Array.from(sources));
  if (newFm !== fm) {
    fs.writeFileSync(filePath, `---\n${newFm}\n---\n${body}`, "utf8");
    updated += 1;
  }
}

console.log(`Updated sources for ${updated} entries.`);
