import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("src/content/paradoxes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

const parseFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: text };
  const fm = match[1];
  const body = text.slice(match[0].length).trimStart();
  const data = {};
  let currentKey = null;
  fm.split("\n").forEach((line) => {
    if (!line.trim()) return;
    if (line.startsWith("  - ") && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(line.replace("  - ", "").trim());
      return;
    }
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value === "") {
      currentKey = key;
      data[currentKey] = [];
    } else {
      data[key] = value.replace(/^"|"$/g, "");
      currentKey = key;
    }
  });
  return { data, body };
};

const slugFromFile = (file) => file.replace(/^\d+-/, "").replace(/\.md$/, "");

const tagPhrases = {
  identity: [
    "identity is stable across change",
    "naming tracks the same entity over time",
    "replacement does not necessarily create a new thing"
  ],
  persistence: [
    "persistence can survive partial replacement",
    "continuity outweighs material swap",
    "the observer’s criteria remain fixed"
  ],
  truth: [
    "statements can be assigned a stable truth value",
    "self-reference can be evaluated cleanly",
    "negation does not create infinite regress"
  ],
  "self-reference": [
    "self-application is allowed without contradiction",
    "definitions can refer to themselves safely",
    "language can contain its own evaluation"
  ],
  logic: [
    "classical logic applies without exception",
    "rules do not shift across contexts",
    "valid steps preserve truth"
  ],
  language: [
    "words map to stable categories",
    "definitions do not drift in use",
    "communication preserves intent"
  ],
  motion: [
    "motion can be decomposed into consistent steps",
    "a path can be subdivided without changing outcome",
    "time and distance scale together"
  ],
  infinity: [
    "infinite decomposition does not change reachability",
    "a sum of infinite parts can be finite",
    "limits capture physical reality"
  ],
  time: [
    "temporal order is consistent",
    "causal chains are well-founded",
    "time can be sliced without loss"
  ],
  causality: [
    "causes precede effects",
    "self-causing loops are disallowed",
    "events have stable origins"
  ],
  probability: [
    "randomness is well-defined",
    "sampling procedures are equivalent",
    "intuitive odds match formal odds"
  ],
  ethics: [
    "moral rules are consistent across cases",
    "tradeoffs can be ranked without residue",
    "intent and outcome can be balanced"
  ],
  strategy: [
    "rational agents optimize consistently",
    "local incentives align with global outcomes",
    "information is shared predictably"
  ],
  systems: [
    "system rules remain fixed under pressure",
    "feedback does not flip the goal",
    "local improvements do not degrade the whole"
  ]
};

const genericAxioms = [
  "Assume the rules of the domain apply uniformly.",
  "Assume the observer’s criteria remain fixed.",
  "Assume classification boundaries stay consistent.",
  "Assume the model describes the real case.",
  "Assume repeated steps do not change the outcome.",
  "Assume no hidden variables are introduced midstream.",
  "Assume constraints can be satisfied simultaneously.",
  "Assume equivalences preserve meaning."
];

const genericContradictions = [
  "Two reasonable lines of inference yield opposite conclusions",
  "A global rule conflicts with a local judgment",
  "A stable resolution appears to violate a starting premise",
  "Changing the framing reverses the outcome",
  "Intuition and formalism diverge at the same step",
  "The model predicts an impossible or circular result",
  "Small adjustments create a discontinuous shift"
];

const genericPrompts = [
  "Which assumption is doing the most hidden work?",
  "What changes if you relax the smallest constraint?",
  "Does the paradox dissolve or relocate when reframed?",
  "What is conserved, and what is sacrificed?",
  "Which step feels harmless but is decisive?"
];

const buildBody = (meta, relatedSlugs) => {
  const title = meta.title || "This paradox";
  const type = (meta.type || "PARADOX").toLowerCase().replace(/_/g, " ");
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const contradictions = Array.isArray(meta.contradictions) ? meta.contradictions : [];
  const axioms = Array.isArray(meta.axioms) ? meta.axioms : [];
  const prompts = Array.isArray(meta.prompts) ? meta.prompts : [];

  const tagLine = tags.length
    ? `It lives at the intersection of ${tags.join(", ")}.`
    : "It lives at the intersection of competing intuitions.";

  const axiomLine = axioms.length
    ? `Its backbone is a set of assumptions: ${axioms.slice(0, 3).join(" ")}`
    : "Its backbone is a set of assumptions that feel ordinary until combined.";

  const tensionLines = contradictions.length
    ? contradictions.map((c) => `- ${c}.`).join("\n")
    : genericContradictions.map((c) => `- ${c}.`).join("\n");

  const promptLines = prompts.length
    ? prompts.map((p) => `- ${p}`).join("\n")
    : genericPrompts.map((p) => `- ${p}`).join("\n");

  const relatedLine = relatedSlugs.length
    ? `Related entries often include: ${relatedSlugs.join(", ")}.`
    : "Related entries often explore similar tensions in different domains.";

  return `## Overview
${title} is a ${type} that resists a single stable interpretation. ${tagLine} It feels consistent in isolation, but when its premises are held together, the system begins to wobble.

## Tension
${axiomLine} The contradiction arises not from a single step, but from how the steps accumulate. The paradox forces a choice: preserve the rules or preserve the outcome, but not both.

${tensionLines}

## Origins & Variants
The paradox appears in multiple retellings and variants. Some versions emphasize a crisp logical contradiction; others emphasize how subtle shifts in framing change the conclusion. ${relatedLine}

## Why It Matters
This entry belongs in the vault because it stress-tests the way we reason. It shows how small, familiar rules can combine into a result that feels unacceptable. In practice, it teaches where models break: in language, measurement, prediction, or moral judgment.

## Resolution Strategies
Common strategies include tightening definitions, changing which assumptions are primary, or admitting contextual rules. Each move resolves one tension while creating another, which is why the paradox persists.

## Implications
When applied to real decisions, this paradox highlights the boundary between formal consistency and lived intuition. It encourages explicit tradeoffs rather than hidden ones.

## Reading Notes
Work through the structure slowly. Identify the smallest premise that could be revised without collapsing the whole system. Then track the cost of that revision. The paradox doesn’t disappear; it relocates.

## Prompts
${promptLines}
`;
};

const allMeta = files.map((file) => {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const { data } = parseFrontmatter(raw);
  return { file, slug: data.slug || slugFromFile(file), tags: data.tags || [] };
});

const pickRelated = (slug, tags) => {
  if (!tags.length) return [];
  const scored = allMeta
    .filter((m) => m.slug !== slug)
    .map((m) => ({
      slug: m.slug,
      score: m.tags.filter((t) => tags.includes(t)).length
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((m) => m.slug);
  return scored;
};

const expandList = (base, additions, target) => {
  const out = Array.isArray(base) ? [...base] : [];
  for (const item of additions) {
    if (out.length >= target) break;
    if (!out.includes(item)) out.push(item);
  }
  return out;
};

for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = parseFrontmatter(raw);
  const slug = data.slug || slugFromFile(file);
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const extraAxioms = tags.flatMap((t) => tagPhrases[t] || []).map((p) => `Assume ${p}.`);
  const axioms = expandList(data.axioms || [], [...extraAxioms, ...genericAxioms], 8);
  const contradictions = expandList(data.contradictions || [], genericContradictions, 6);
  const prompts = expandList(data.prompts || [], genericPrompts, 6);
  const related = Array.isArray(data.related)
    ? (data.related.length ? data.related : pickRelated(slug, tags))
    : pickRelated(slug, tags);

  const frontmatter = `---
title: "${data.title || slug}"
slug: "${slug}"
type: ${data.type || "PARADOX"}
summary: "${data.summary || ""}"
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
axioms:
${axioms.map((a) => `  - ${a}`).join("\n")}
contradictions:
${contradictions.map((c) => `  - ${c}`).join("\n")}
related:
${related.map((r) => `  - ${r}`).join("\n")}
prompts:
${prompts.map((p) => `  - ${p}`).join("\n")}
order: ${data.order || 0}
---`;

  const body = buildBody({ ...data, axioms, contradictions, prompts, tags }, related);
  fs.writeFileSync(filePath, `${frontmatter}\n${body}`, "utf8");
}

console.log(`Expanded ${files.length} paradox entries with added nuance.`);
