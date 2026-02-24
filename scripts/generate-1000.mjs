import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("src/content/paradoxes");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Clean existing entries to avoid collisions.
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith(".md")) fs.unlinkSync(path.join(outDir, f));
}

const types = ["PARADOX", "THOUGHT_EXPERIMENT", "SYSTEM", "RIDDLE"];
const tagPools = [
  ["identity", "persistence", "change"],
  ["truth", "self-reference", "logic"],
  ["probability", "statistics", "induction"],
  ["ethics", "harm", "choice"],
  ["time", "causality", "loops"],
  ["language", "vagueness", "meaning"],
  ["strategy", "cooperation", "game-theory"],
  ["systems", "feedback", "emergence"],
  ["knowledge", "belief", "prediction"],
  ["measurement", "observer", "uncertainty"]
];

const nouns = [
  "Ship", "Mirror", "Gate", "Oracle", "Labyrinth", "Clock", "Ledger", "Threshold",
  "Signal", "Shadow", "Scale", "Anchor", "Compass", "Beacon", "Archive", "Census",
  "Circuit", "Compass", "Ledger", "Bridge", "Map", "Index", "Spiral", "Loop"
];
const adjectives = [
  "Hidden", "Infinite", "Silent", "Reversed", "Tangled", "Recursive", "Broken",
  "Duplicate", "Vanishing", "Paradoxical", "Folded", "Misleading", "Echoing",
  "Forked", "Delayed", "Contrary", "Inductive", "Ambiguous"
];
const patterns = [
  (a, n) => `The ${a} ${n} Paradox`,
  (a, n) => `The ${n} of ${a} Outcomes`,
  (a, n) => `${a} ${n} Problem`,
  (a, n) => `The ${n} Loop`,
  (a, n) => `The ${a} ${n} Effect`,
  (a, n) => `The ${n} Dilemma`,
  (a, n) => `The ${a} ${n} Trap`
];

const toSlug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const baseAxioms = [
  "Assume the rules of the domain apply uniformly.",
  "Assume the observer’s criteria remain fixed.",
  "Assume classification boundaries stay consistent.",
  "Assume the model describes the real case.",
  "Assume repeated steps do not change the outcome.",
  "Assume no hidden variables are introduced midstream.",
  "Assume constraints can be satisfied simultaneously.",
  "Assume equivalences preserve meaning."
];

const baseContradictions = [
  "Two reasonable lines of inference yield opposite conclusions",
  "A global rule conflicts with a local judgment",
  "A stable resolution appears to violate a starting premise",
  "Changing the framing reverses the outcome",
  "Intuition and formalism diverge at the same step",
  "The model predicts an impossible or circular result",
  "Small adjustments create a discontinuous shift"
];

const basePrompts = [
  "Which assumption is doing the most hidden work?",
  "What changes if you relax the smallest constraint?",
  "Does the paradox dissolve or relocate when reframed?",
  "What is conserved, and what is sacrificed?",
  "Which step feels harmless but is decisive?",
  "What would count as a stable resolution here?"
];

const buildBody = (title, type, tags, axioms, contradictions, prompts) => {
  const typeLabel = type.toLowerCase().replace(/_/g, " ");
  return `## Overview
${title} is a ${typeLabel} that resists a single stable interpretation. It lives at the intersection of ${tags.join(", ")}. The structure feels reasonable step by step, yet the total picture wobbles.

## Tension
The contradiction arises from combining ordinary assumptions. The paradox forces a choice: preserve the rules or preserve the outcome.

${contradictions.map((c) => `- ${c}.`).join("\n")}

## Why It Matters
This entry stress-tests how we reason about systems, language, measurement, or choice. It reveals where stable models give way to tradeoffs.

## Resolution Strategies
Common strategies include tightening definitions, shifting the frame, or prioritizing a different axiom. Each resolution fixes one tension while creating another.

## Implications
In practical contexts, the paradox highlights where intuition and formalism part ways and where decisions require explicit tradeoffs.

## Prompts
${prompts.map((p) => `- ${p}`).join("\n")}
`;
};

const used = new Set();
const target = Number(process.argv[2] || "1000");
let count = 0;
let i = 0;

while (count < target) {
  const a = adjectives[i % adjectives.length];
  const n = nouns[(i * 7) % nouns.length];
  const pattern = patterns[i % patterns.length];
  const title = pattern(a, n);
  const slug = toSlug(`${title}-${i + 1}`);
  if (used.has(slug)) {
    i += 1;
    continue;
  }
  used.add(slug);
  const type = types[i % types.length];
  const tagSet = tagPools[i % tagPools.length];
  const tags = Array.from(new Set(tagSet));

  const axioms = baseAxioms.slice(0, 6);
  const contradictions = baseContradictions.slice(0, 6);
  const prompts = basePrompts.slice(0, 6);

  const frontmatter = `---
title: "${title}"
slug: "${slug}"
type: ${type}
summary: "${title} exposes a conflict between ${tags[0]} and ${tags[1]}."
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
axioms:
${axioms.map((a) => `  - ${a}`).join("\n")}
contradictions:
${contradictions.map((c) => `  - ${c}`).join("\n")}
related: []
prompts:
${prompts.map((p) => `  - ${p}`).join("\n")}
order: ${count + 1}
---`;

  const body = buildBody(title, type, tags, axioms, contradictions, prompts);
  const fileName = `${String(count + 1).padStart(5, "0")}-${slug}.md`;
  fs.writeFileSync(path.join(outDir, fileName), `${frontmatter}\n${body}`, "utf8");

  count += 1;
  i += 1;
}

console.log(`Generated ${count} paradox entries.`);
