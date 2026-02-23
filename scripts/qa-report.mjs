import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const reportPath = path.join(ROOT, "public", "data", "report.json");

if(!fs.existsSync(reportPath)){
  console.error("[qa] report.json not found. Run npm run build:data first.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

console.log("[qa] Data completeness report");
console.log(`Generated: ${report.generatedAt}`);
console.log(`Total signs: ${report.counts.total}`);
console.log(`Missing Gardiner: ${report.counts.missingGardiner}`);
console.log(`Missing Unicode name: ${report.counts.missingUnicodeName}`);
console.log(`Missing meanings: ${report.counts.missingMeanings}`);
console.log(`Missing transliterations: ${report.counts.missingTransliterations}`);
console.log(`Missing descriptions: ${report.counts.missingDescription}`);
if(report.needsResolutionSample?.length){
  console.log("Needs-resolution sample:", report.needsResolutionSample.join(", "));
}
