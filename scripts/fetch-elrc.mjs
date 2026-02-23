import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const outDir = path.join(ROOT, "data");
const types = ["Gardiner", "DictionaryEntries", "Aegyptus"]; // per ELRC UI

fs.mkdirSync(outDir, { recursive: true });

function fetchJson(type){
  return new Promise((resolve, reject) => {
    const url = `https://www.elrc.dev/api/Hieroglyphs_Read?Id=${encodeURIComponent(type)}`;
    https.get(url, (res) => {
      if(res.statusCode !== 200){
        reject(new Error(`Failed ${type}: ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

(async () => {
  for(const type of types){
    const json = await fetchJson(type);
    const outPath = path.join(outDir, `elrc-${type}.json`);
    fs.writeFileSync(outPath, json);
    console.log(`[fetch-elrc] Saved ${outPath}`);
  }
})().catch((err) => {
  console.error("[fetch-elrc] Failed", err.message);
  process.exit(1);
});
