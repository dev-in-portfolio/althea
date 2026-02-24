import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("src/content/paradoxes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) continue;
  const fm = match[1];
  const body = raw.slice(match[0].length).trimStart();
  const base = file.replace(/\.md$/, "");
  const slug = base;
  const newFm = fm.replace(/^slug:.*$/m, `slug: '${slug}'`);
  const out = `---\n${newFm}\n---\n${body}`;
  fs.writeFileSync(filePath, out, "utf8");
}

console.log(`Normalized slugs for ${files.length} entries.`);
