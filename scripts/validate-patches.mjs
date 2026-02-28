import fs from "fs/promises";
import path from "path";

const patchesDir = path.join("src", "patches");
const files = await fs.readdir(patchesDir);

const required = ["slug", "title", "tags", "risk"];
const validRisk = new Set(["low", "medium", "high"]);

const seen = new Set();
const errors = [];

for (const file of files) {
  if (!file.endsWith(".md")) continue;
  const raw = await fs.readFile(path.join(patchesDir, file), "utf-8");
  const match = raw.match(/---([\s\S]*?)---/);
  if (!match) {
    errors.push(`${file}: missing front matter`);
    continue;
  }
  const front = match[1];
  const data = {};
  front.split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) return;
    const value = rest.join(":").trim();
    data[key.trim()] = value;
  });

  required.forEach((field) => {
    if (!data[field]) errors.push(`${file}: missing ${field}`);
  });

  const slug = data.slug?.replace(/"/g, "");
  if (slug && seen.has(slug)) errors.push(`${file}: duplicate slug ${slug}`);
  if (slug) seen.add(slug);

  if (data.tags && !data.tags.includes("[")) {
    errors.push(`${file}: tags must be an array`);
  }

  if (data.risk && !validRisk.has(data.risk.replace(/"/g, ""))) {
    errors.push(`${file}: invalid risk ${data.risk}`);
  }

  if (!raw.includes("```patch") && !raw.includes("```bash")) {
    errors.push(`${file}: missing patch or bash code block`);
  }
}

if (errors.length) {
  console.error("Validation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("Patch validation passed.");
