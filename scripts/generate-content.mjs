import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "src", "content", "paradoxes");
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const entries = [
  { title: "Ship of Theseus", type: "PARADOX", tags: ["identity", "persistence", "metaphysics"] },
  { title: "Sorites Paradox", type: "PARADOX", tags: ["vagueness", "logic", "language"] },
  { title: "Liar Paradox", type: "PARADOX", tags: ["self-reference", "truth", "logic"] },
  { title: "Barber Paradox", type: "PARADOX", tags: ["set-theory", "self-reference", "logic"] },
  { title: "Russell's Paradox", type: "PARADOX", tags: ["set-theory", "foundations", "logic"] },
  { title: "Zeno's Dichotomy", type: "PARADOX", tags: ["motion", "infinity", "time"] },
  { title: "Achilles and the Tortoise", type: "PARADOX", tags: ["motion", "infinity", "time"] },
  { title: "Zeno's Arrow", type: "PARADOX", tags: ["motion", "time", "continuity"] },
  { title: "Grandfather Paradox", type: "PARADOX", tags: ["time-travel", "causality", "identity"] },
  { title: "Bootstrap Paradox", type: "PARADOX", tags: ["time-travel", "causality", "loops"] },
  { title: "Fermi Paradox", type: "PARADOX", tags: ["cosmology", "probability", "civilizations"] },
  { title: "Olbers' Paradox", type: "PARADOX", tags: ["cosmology", "light", "infinity"] },
  { title: "Monty Hall Problem", type: "THOUGHT_EXPERIMENT", tags: ["probability", "decision", "information"] },
  { title: "Newcomb's Problem", type: "THOUGHT_EXPERIMENT", tags: ["decision", "prediction", "free-will"] },
  { title: "Prisoner's Dilemma", type: "SYSTEM", tags: ["game-theory", "cooperation", "strategy"] },
  { title: "Tragedy of the Commons", type: "SYSTEM", tags: ["resources", "incentives", "collective-action"] },
  { title: "Trolley Problem", type: "THOUGHT_EXPERIMENT", tags: ["ethics", "decision", "harm"] },
  { title: "Trolley Loop Variant", type: "THOUGHT_EXPERIMENT", tags: ["ethics", "intention", "harm"] },
  { title: "Experience Machine", type: "THOUGHT_EXPERIMENT", tags: ["ethics", "value", "identity"] },
  { title: "Mary's Room", type: "THOUGHT_EXPERIMENT", tags: ["consciousness", "knowledge", "qualia"] },
  { title: "Chinese Room", type: "THOUGHT_EXPERIMENT", tags: ["mind", "ai", "meaning"] },
  { title: "Brain in a Vat", type: "THOUGHT_EXPERIMENT", tags: ["skepticism", "knowledge", "perception"] },
  { title: "Gettier Problem", type: "PARADOX", tags: ["knowledge", "epistemology", "justification"] },
  { title: "Unexpected Hanging", type: "PARADOX", tags: ["prediction", "logic", "knowledge"] },
  { title: "Raven Paradox", type: "PARADOX", tags: ["induction", "confirmation", "logic"] },
  { title: "Allais Paradox", type: "PARADOX", tags: ["decision", "probability", "rationality"] },
  { title: "Simpson's Paradox", type: "PARADOX", tags: ["statistics", "aggregation", "causality"] },
  { title: "Birthday Paradox", type: "PARADOX", tags: ["probability", "intuition", "combinatorics"] },
  { title: "Paradox of Choice", type: "PARADOX", tags: ["decision", "psychology", "overload"] },
  { title: "Heap of Sand", type: "PARADOX", tags: ["vagueness", "language", "logic"] },
  { title: "Theseus' Plank", type: "PARADOX", tags: ["identity", "persistence", "objects"] },
  { title: "Ship of Theseus (Reassembly)", type: "PARADOX", tags: ["identity", "persistence", "objects"] },
  { title: "Omnipotence Paradox", type: "PARADOX", tags: ["theology", "logic", "power"] },
  { title: "Buridan's Ass", type: "THOUGHT_EXPERIMENT", tags: ["decision", "rationality", "delay"] },
  { title: "Twin Paradox", type: "PARADOX", tags: ["relativity", "time", "physics"] },
  { title: "EPR Paradox", type: "PARADOX", tags: ["quantum", "locality", "measurement"] },
  { title: "Schrodinger's Cat", type: "THOUGHT_EXPERIMENT", tags: ["quantum", "measurement", "uncertainty"] },
  { title: "Wigner's Friend", type: "THOUGHT_EXPERIMENT", tags: ["quantum", "observer", "measurement"] },
  { title: "Sleeping Beauty Problem", type: "PARADOX", tags: ["probability", "self-locating", "belief"] },
  { title: "St. Petersburg Paradox", type: "PARADOX", tags: ["utility", "probability", "decision"] },
  { title: "Lottery Paradox", type: "PARADOX", tags: ["knowledge", "probability", "belief"] },
  { title: "Ship of Theseus (Digital)", type: "PARADOX", tags: ["identity", "information", "copying"] },
  { title: "Preface Paradox", type: "PARADOX", tags: ["belief", "knowledge", "consistency"] },
  { title: "Curry's Paradox", type: "PARADOX", tags: ["logic", "self-reference", "inference"] },
  { title: "Epimenides Paradox", type: "PARADOX", tags: ["self-reference", "truth", "logic"] },
  { title: "Sorites Chain", type: "PARADOX", tags: ["vagueness", "boundaries", "logic"] },
  { title: "Paradox of the Raven", type: "PARADOX", tags: ["confirmation", "induction", "evidence"] },
  { title: "Hempel's Paradox", type: "PARADOX", tags: ["confirmation", "induction", "evidence"] },
  { title: "Banach–Tarski Paradox", type: "PARADOX", tags: ["math", "infinity", "measure"] },
  { title: "Bootstrap Knowledge", type: "PARADOX", tags: ["epistemology", "circularity", "knowledge"] },
  { title: "Arrow's Impossibility", type: "SYSTEM", tags: ["social-choice", "voting", "fairness"] },
  { title: "Condorcet Paradox", type: "PARADOX", tags: ["voting", "cycles", "preferences"] },
  { title: "Goodhart's Law", type: "SYSTEM", tags: ["systems", "metrics", "incentives"] },
  { title: "Braess's Paradox", type: "PARADOX", tags: ["systems", "traffic", "optimization"] },
  { title: "Yule–Simpson Effect", type: "PARADOX", tags: ["statistics", "aggregation", "causality"] },
  { title: "Paradox of Thrift", type: "SYSTEM", tags: ["economics", "incentives", "macro"] },
  { title: "Jealous Husband Problem", type: "RIDDLE", tags: ["logic", "constraints", "puzzle"] },
  { title: "Bridge and Torch", type: "RIDDLE", tags: ["logic", "optimization", "puzzle"] },
  { title: "Missionaries and Cannibals", type: "RIDDLE", tags: ["logic", "constraints", "puzzle"] },
  { title: "Blue-Eyed Islanders", type: "RIDDLE", tags: ["logic", "knowledge", "puzzle"] }
];

const makeSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const makeEntry = (entry, idx) => {
  const slug = makeSlug(entry.title);
  const related = entries
    .filter((e) => e.title !== entry.title)
    .slice((idx + 3) % entries.length, (idx + 6) % entries.length + 1)
    .map((e) => makeSlug(e.title));

  const axioms = [
    `Assume the rules of ${entry.tags[0]} hold consistently.`,
    `Assume the observer applies ordinary inference.`,
    `Assume the system is closed under its stated constraints.`
  ];
  const contradictions = [
    `The conclusions implied by ${entry.title} conflict with at least one assumption.`,
    `The system yields opposing outcomes depending on the framing.`,
    `A stable resolution appears to violate the original axioms.`
  ];
  const prompts = [
    "Which assumption is doing the most hidden work?",
    "What changes if you alter the boundary conditions?",
    "Does the paradox dissolve or relocate when reframed?",
    "What is conserved, and what is sacrificed?"
  ];

  const body = [
    `## Overview`,
    `${entry.title} is a ${entry.type.toLowerCase().replace("_", " ")} that tests boundaries of ${entry.tags.join(", ")}. It persists because each step feels permissible, yet the outcome resists a single stable interpretation.`,
    ``,
    `## Tension`,
    `The structure relies on simple premises that, when combined, produce a result that seems to defy expectation. The paradox does not demand a single fix; it demands a choice about which assumption we are willing to relax.`,
    ``,
    `## Why It Matters`,
    `The vault preserves these puzzles because they teach the limits of frameworks. Each paradox acts as a stress test for logic, language, or incentives.`,
    ``,
    `## Reading Notes`,
    `Use the prompts to explore alternate framings. Trace the smallest change that resolves the contradiction, then note the cost of that change.`
  ].join("\n");

  const frontmatter = [
    `---`,
    `title: "${entry.title}"`,
    `slug: "${slug}"`,
    `type: ${entry.type}`,
    `summary: "${entry.title} exposes a conflict between ${entry.tags[0]} and ${entry.tags[1]}."`,
    `tags:`,
    ...entry.tags.map((t) => `  - ${t}`),
    `axioms:`,
    ...axioms.map((a) => `  - ${a}`),
    `contradictions:`,
    ...contradictions.map((c) => `  - ${c}`),
    `related:`,
    ...related.map((r) => `  - ${r}`),
    `prompts:`,
    ...prompts.map((p) => `  - ${p}`),
    `---`,
    ``
  ].join("\n");

  return `${frontmatter}${body}\n`;
};

entries.forEach((entry, idx) => {
  const slug = makeSlug(entry.title);
  const filename = `${String(idx + 1).padStart(2, "0")}-${slug}.md`;
  fs.writeFileSync(path.join(outDir, filename), makeEntry(entry, idx), "utf8");
});

console.log(`Wrote ${entries.length} entries.`);
