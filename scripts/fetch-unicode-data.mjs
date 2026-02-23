import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const outPath = path.join(ROOT, "data", "UnicodeData.txt");
const url = "https://www.unicode.org/Public/UNIDATA/UnicodeData.txt";

fs.mkdirSync(path.dirname(outPath), { recursive: true });

https.get(url, (res) => {
  if(res.statusCode !== 200){
    console.error(`[fetch] Failed: ${res.statusCode}`);
    res.resume();
    process.exit(1);
  }
  const file = fs.createWriteStream(outPath);
  res.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log(`[fetch] Saved ${outPath}`);
  });
}).on("error", (err) => {
  console.error("[fetch] Error", err.message);
  process.exit(1);
});
