import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src", "content", "paradoxes");
const rejectedDir = path.join(root, "src", "content", "_rejected");

if (!fs.existsSync(rejectedDir)) fs.mkdirSync(rejectedDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".md"));

const readFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { fm: "", body: text };
  return { fm: match[1], body: text.slice(match[0].length).trimStart() };
};

const getField = (fm, key) => {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
  const m = fm.match(re);
  return m ? m[1].trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "") : "";
};

const allowTitle = /(paradox|problem|dilemma|effect|thought experiment|antinomy|aporia|contradiction|impossibility|infinite|liar|sorites|trolley|zeno|riddle|bootstrapping|self-reference|self reference|unexpected|prisoner|monty hall|newcomb|twin|grandfather|banach|tarski|raven|heap|spectrum|sleeper|dutch book)/i;
const allowSummary = /(paradox|thought experiment|dilemma|contradiction|inconsistent|counterintuitive|impossible|self-referent|self referent|vagueness|induction|causality|time travel|probability|game theory|decision theory)/i;
const rejectSummary = /\bis (an|a) (american|british|french|german|italian|spanish|philosopher|physicist|mathematician|economist|psychologist|sociologist|engineer|author|writer|poet|composer|politician|actor|artist|musician|company|organization|university|city|town|village|river|mountain|island|airline|brand|website)\b/i;
const rejectTitle = /\b(university|college|institute|company|corporation|airlines|football|basketball|baseball|soccer|band|album|song|film|novel|poem)\b/i;

let moved = 0;
let kept = 0;
const movedSamples = [];

for (const f of files) {
  const filePath = path.join(srcDir, f);
  const raw = fs.readFileSync(filePath, "utf8");
  const { fm } = readFrontmatter(raw);
  const title = getField(fm, "title");
  const summary = getField(fm, "summary");

  const shouldKeep = allowTitle.test(title) || allowTitle.test(summary) || allowSummary.test(summary);
  const shouldReject = rejectTitle.test(title) || rejectSummary.test(summary);

  if (!shouldKeep || shouldReject) {
    fs.renameSync(filePath, path.join(rejectedDir, f));
    moved += 1;
    if (movedSamples.length < 20) movedSamples.push(title || f);
  } else {
    kept += 1;
  }
}

const report = {
  kept,
  moved,
  movedSamples
};
fs.writeFileSync(path.join(root, "public", "data", "curation-report.json"), JSON.stringify(report, null, 2));
console.log(`Kept ${kept}, moved ${moved} to src/content/_rejected`);
