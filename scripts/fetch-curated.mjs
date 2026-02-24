import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("src/content/paradoxes");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIKI = "https://en.wikipedia.org/w/api.php";

const fetchJson = async (url, attempt = 0) => {
  const res = await fetch(url, { headers: { "User-Agent": "paradox-vault-bot/1.0" } });
  if (res.status === 429) {
    const wait = Math.min(2000 + attempt * 1000, 8000);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
};

const toSlug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const cleanTitle = (t) => t.replace(/_/g, " ").trim();

const isBadTitle = (t) => {
  if (!t) return true;
  if (t.includes(":")) return true;
  const badPrefixes = [
    "List of",
    "Outline of",
    "Index of",
    "Glossary of",
    "Template",
    "Portal",
    "Help",
    "Wikipedia",
    "Category"
  ];
  return badPrefixes.some((p) => t.startsWith(p));
};

const getLinksFromPage = async (title) => {
  let plcontinue = null;
  const results = new Set();
  do {
    const url = new URL(WIKI);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("prop", "links");
    url.searchParams.set("titles", title);
    url.searchParams.set("pllimit", "max");
    if (plcontinue) url.searchParams.set("plcontinue", plcontinue);
    const json = await fetchJson(url.toString());
    const pages = json?.query?.pages || {};
    Object.values(pages).forEach((page) => {
      (page.links || []).forEach((l) => results.add(l.title));
    });
    plcontinue = json?.continue?.plcontinue || null;
    await sleep(200);
  } while (plcontinue);
  return Array.from(results)
    .map(cleanTitle)
    .filter((t) => !isBadTitle(t));
};

const getExtract = async (title) => {
  const url = new URL(WIKI);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("prop", "extracts");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exsentences", "2");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("titles", title);
  const json = await fetchJson(url.toString());
  const pages = json?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing) return null;
  const extract = (page.extract || "").trim();
  return extract || null;
};

const classifyType = (title, source) => {
  const t = title.toLowerCase();
  if (source === "thought") return "THOUGHT_EXPERIMENT";
  if (t.includes("dilemma") || t.includes("game")) return "SYSTEM";
  return "PARADOX";
};

const deriveTags = (text) => {
  const t = text.toLowerCase();
  const tags = new Set();
  const map = [
    ["set", "set-theory"],
    ["logic", "logic"],
    ["truth", "truth"],
    ["self-reference", "self-reference"],
    ["language", "language"],
    ["vague", "vagueness"],
    ["probab", "probability"],
    ["statistic", "statistics"],
    ["ethic", "ethics"],
    ["moral", "ethics"],
    ["time", "time"],
    ["causal", "causality"],
    ["quantum", "physics"],
    ["physics", "physics"],
    ["cosmo", "cosmology"],
    ["econom", "economics"],
    ["psych", "psychology"],
    ["game", "game-theory"],
    ["decision", "decision"],
    ["choice", "choice"]
  ];
  for (const [needle, tag] of map) {
    if (t.includes(needle)) tags.add(tag);
  }
  if (!tags.size) tags.add("paradox");
  return Array.from(tags).slice(0, 5);
};

const baseAxioms = [
  "Assume the rules of the domain apply uniformly.",
  "Assume the observer’s criteria remain fixed.",
  "Assume classification boundaries stay consistent.",
  "Assume the model describes the real case.",
  "Assume repeated steps do not change the outcome.",
  "Assume no hidden variables are introduced midstream."
];

const baseContradictions = [
  "Two reasonable lines of inference yield opposite conclusions",
  "A global rule conflicts with a local judgment",
  "A stable resolution appears to violate a starting premise",
  "Changing the framing reverses the outcome",
  "Intuition and formalism diverge at the same step"
];

const basePrompts = [
  "Which assumption is doing the most hidden work?",
  "What changes if you relax the smallest constraint?",
  "Does the paradox dissolve or relocate when reframed?",
  "What is conserved, and what is sacrificed?"
];

const writeEntry = (idx, title, type, summary, tags, sources) => {
  const slug = toSlug(title);
  const frontmatter = `---
title: "${title}"
slug: "${slug}"
type: ${type}
summary: "${summary.replace(/"/g, "'")}"
tags:
${tags.map((t) => `  - ${t}`).join("\n")}
axioms:
${baseAxioms.map((a) => `  - ${a}`).join("\n")}
contradictions:
${baseContradictions.map((c) => `  - ${c}`).join("\n")}
related: []
prompts:
${basePrompts.map((p) => `  - ${p}`).join("\n")}
sources:
${sources.map((s) => `  - ${s}`).join("\n")}
order: ${idx}
---`;

  const body = `## Overview
${summary}

## Tension
${baseContradictions.map((c) => `- ${c}.`).join("\n")}

## Why It Matters
This entry tests how a stable rule-set can yield unstable conclusions under certain assumptions.

## Prompts
${basePrompts.map((p) => `- ${p}`).join("\n")}
`;
  const fileName = `${String(idx).padStart(5, "0")}-${slug}.md`;
  fs.writeFileSync(path.join(outDir, fileName), `${frontmatter}\n${body}`, "utf8");
};

const main = async () => {
  // Clear existing curated content
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".md")) fs.unlinkSync(path.join(outDir, f));
  }

  const paradoxTitles = await getLinksFromPage("List_of_paradoxes");
  const thoughtTitles = await getLinksFromPage("Thought_experiment");

  const all = new Map();
  paradoxTitles.forEach((t) => all.set(t, "paradox"));
  thoughtTitles.forEach((t) => {
    if (!all.has(t)) all.set(t, "thought");
  });

  let index = 1;
  for (const [title, source] of all.entries()) {
    const extract = await getExtract(title);
    if (!extract) continue;
    const summary = extract.replace(/\s+/g, " ").slice(0, 420);
    const type = classifyType(title, source);
    const tags = deriveTags(`${title} ${summary}`);
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
    writeEntry(index, title, type, summary, tags, [wikiUrl]);
    index += 1;
    if (index % 25 === 0) await sleep(800);
  }

  console.log(`Generated ${index - 1} curated entries.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
