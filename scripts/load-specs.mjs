import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const specsDir = path.join("src", "specs");
const files = await fs.readdir(specsDir);
const specs = [];

for (const file of files) {
  if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
  const raw = await fs.readFile(path.join(specsDir, file), "utf-8");
  const spec = yaml.load(raw);
  specs.push(spec);
}

await fs.writeFile(path.join("src", "_data", "specs.json"), JSON.stringify(specs, null, 2));
