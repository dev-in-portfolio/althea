import fs from "fs/promises";
import path from "path";

const dataPath = path.join("src", "_data", "targets.json");

const allowedKinds = new Set(["app", "repo", "doc", "endpoint", "tool", "misc"]);

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const raw = await fs.readFile(dataPath, "utf-8");
const targets = JSON.parse(raw);
const seen = new Set();
const errors = [];
const tagCounts = {};
const kindCounts = {};

targets.forEach((item, index) => {
  if (!item.slug || !item.title || !item.summary) {
    errors.push(`Missing required fields for entry ${index}`);
  }
  if (!allowedKinds.has(item.kind)) {
    errors.push(`Invalid kind for ${item.slug}`);
  }
  if (!item.tags || item.tags.length === 0) {
    errors.push(`Missing tags for ${item.slug}`);
  }
  if (!isValidUrl(item.url)) {
    errors.push(`Invalid URL for ${item.slug}`);
  }
  if (seen.has(item.slug)) {
    errors.push(`Duplicate slug: ${item.slug}`);
  }
  seen.add(item.slug);
  kindCounts[item.kind] = (kindCounts[item.kind] || 0) + 1;
  item.tags.forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
});

const report = {
  total: targets.length,
  kinds: kindCounts,
  tags: tagCounts,
  errors,
};

await fs.mkdir("_site", { recursive: true });
await fs.writeFile("_site/report.json", JSON.stringify(report, null, 2));

if (errors.length) {
  console.error("Validation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("Validation passed.");
