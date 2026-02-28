import fs from "fs/promises";
import path from "path";

const specsPath = path.join("src", "_data", "specs.json");
const raw = await fs.readFile(specsPath, "utf-8");
const specs = JSON.parse(raw);

const errors = [];
const seen = new Set();
let entitiesCount = 0;
let routesCount = 0;

for (const spec of specs) {
  if (!spec.id || !spec.title || !spec.overview) {
    errors.push(`Missing required fields for ${spec.id || "unknown"}`);
  }
  if (!spec.constraints || spec.constraints.length === 0) {
    errors.push(`Missing constraints for ${spec.id}`);
  }
  if (!spec.acceptance || spec.acceptance.length === 0) {
    errors.push(`Missing acceptance for ${spec.id}`);
  }
  if (!spec.entities && !spec.routes) {
    errors.push(`Missing entities/routes for ${spec.id}`);
  }
  if (spec.routes) {
    spec.routes.forEach((route) => {
      if (!route.method || !route.path) {
        errors.push(`Invalid route in ${spec.id}`);
      }
    });
  }
  if (spec.entities) {
    spec.entities.forEach((entity) => {
      if (!entity.name || !entity.fields) {
        errors.push(`Invalid entity in ${spec.id}`);
      }
      entity.fields.forEach((field) => {
        if (!field.name || !field.type) {
          errors.push(`Invalid field in ${spec.id}/${entity.name}`);
        }
      });
    });
  }

  if (seen.has(spec.id)) errors.push(`Duplicate id ${spec.id}`);
  seen.add(spec.id);

  entitiesCount += spec.entities ? spec.entities.length : 0;
  routesCount += spec.routes ? spec.routes.length : 0;
}

const report = {
  specs: specs.length,
  entities: entitiesCount,
  routes: routesCount,
  errors,
};

await fs.mkdir("_site", { recursive: true });
await fs.writeFile("_site/spec-report.json", JSON.stringify(report, null, 2));

if (errors.length) {
  console.error("Validation failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log("Spec validation passed.");
