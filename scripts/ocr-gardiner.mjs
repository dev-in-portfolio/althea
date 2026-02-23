import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const input = path.join(ROOT, "data", "Gardiner_signlist.pdf");
const outDir = path.join(ROOT, "data", "ocr");
const outPdf = path.join(outDir, "Gardiner_signlist.ocr.pdf");
const outTxt = path.join(outDir, "Gardiner_signlist.ocr.txt");

if(!fs.existsSync(input)){
  console.error("[ocr] Missing input PDF at data/Gardiner_signlist.pdf");
  process.exit(1);
}

function hasCmd(cmd){
  try{
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  }catch{
    return false;
  }
}

if(!hasCmd("ocrmypdf")){
  console.error("[ocr] ocrmypdf not found. Install ocrmypdf + tesseract, then re-run.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const args = [
  "--sidecar", outTxt,
  "--skip-text",
  input,
  outPdf
];

const result = spawnSync("ocrmypdf", args, { stdio: "inherit" });
if(result.status !== 0){
  console.error("[ocr] ocrmypdf failed");
  process.exit(result.status || 1);
}

console.log(`[ocr] Wrote ${outPdf}`);
console.log(`[ocr] Wrote ${outTxt}`);
