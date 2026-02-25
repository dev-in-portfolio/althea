const { normalize, extractKeywords } = require("./text");

const domainRules = [
  { domain: "work", keywords: ["project", "deadline", "bug", "deploy", "team", "client"] },
  { domain: "relationship", keywords: ["friend", "partner", "family", "relationship"] },
  { domain: "self", keywords: ["feel", "anxious", "tired", "stuck", "burnout"] },
  { domain: "systems", keywords: ["system", "process", "workflow", "pipeline", "policy"] }
];

const negativeWords = ["fail", "failed", "stuck", "late", "miss", "problem", "anxious", "tired", "overwhelmed"];
const positiveWords = ["win", "progress", "good", "success", "calm", "clear", "excited", "improve"];

function detectDomain(text) {
  const lower = text.toLowerCase();
  for (const rule of domainRules) {
    if (rule.keywords.some((word) => lower.includes(word))) {
      return rule.domain;
    }
  }
  return "unknown";
}

function detectTone(text) {
  const lower = text.toLowerCase();
  const negative = negativeWords.some((word) => lower.includes(word));
  const positive = positiveWords.some((word) => lower.includes(word));
  if (negative && positive) return "mixed";
  if (negative) return "negative";
  if (positive) return "positive";
  return "neutral";
}

function classify(text) {
  const cleaned = normalize(text);
  const keywords = extractKeywords(cleaned, 8);
  return {
    domain: detectDomain(cleaned),
    tone: detectTone(cleaned),
    keywords
  };
}

module.exports = { classify };
