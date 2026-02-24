import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("src/content/paradoxes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

const readFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: "", body: text };
  return { fm: match[1], body: text.slice(match[0].length).trimStart() };
};

const parseKey = (fm, key) => {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const m = fm.match(re);
  return m ? m[1].trim() : "";
};

const singleQuote = (s) => {
  const cleaned = s.replace(/\\/g, "\\\\").replace(/'/g, "''");
  return `'${cleaned}'`;
};

const toSlug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const slugCount = new Map();
const updates = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const { fm, body } = readFrontmatter(raw);
  if (!fm) continue;

  const titleRaw = parseKey(fm, "title").replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  const summaryRaw = parseKey(fm, "summary").replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  const slugRaw = parseKey(fm, "slug").replace(/^"|"$/g, "").replace(/^'|'$/g, "");

  let slug = slugRaw || toSlug(titleRaw);
  const count = (slugCount.get(slug) || 0) + 1;
  slugCount.set(slug, count);
  if (count > 1) slug = `${slug}-${count}`;

  let newFm = fm;
  newFm = newFm.replace(/^title:.*$/m, `title: ${singleQuote(titleRaw)}`);
  newFm = newFm.replace(/^summary:.*$/m, `summary: ${singleQuote(summaryRaw)}`);
  newFm = newFm.replace(/^slug:.*$/m, `slug: ${singleQuote(slug)}`);

  const newText = `---\n${newFm}\n---\n${body}`;

  const newFile = file.replace(/^\d+-/, "").replace(/\.md$/, "");
  const prefix = file.match(/^(\d+)-/)?.[1] || "00000";
  const outName = `${prefix}-${slug}.md`;

  updates.push({ from: filePath, to: path.join(dir, outName), text: newText });
}

for (const u of updates) {
  fs.writeFileSync(u.from, u.text, "utf8");
  if (u.from !== u.to) {
    fs.renameSync(u.from, u.to);
  }
}

console.log(`Fixed ${updates.length} entries.`);
