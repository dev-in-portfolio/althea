const { lenses } = require("./lenses");
const { hash } = require("../../utils/text");

function pickTemplate(templates, seed) {
  const idx = seed % templates.length;
  return templates[idx];
}

function fillTemplate(template, keywords) {
  const keyword = keywords[0] || "signal";
  const keyword2 = keywords[1] || keywords[0] || "pressure";
  const layer = keywords[2] || "process";
  return template
    .replace(/\{keyword\}/g, keyword)
    .replace(/\{keyword2\}/g, keyword2)
    .replace(/\{layer\}/g, layer);
}

function clamp(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trim() + "…";
}

function generateOutputs({ text, classification, lensCount = 5, maxOutputLen = 420 }) {
  const seedBase = hash(`${text}-${classification.domain}-${classification.tone}`);
  const keywordPool = classification.keywords.length ? classification.keywords : ["signal", "pattern"];
  const selected = lenses.slice(0, Math.min(lensCount, lenses.length));

  return selected.map((lens, idx) => {
    const seed = seedBase + idx * 17;
    const template = pickTemplate(lens.templates, seed);
    const filled = fillTemplate(template, keywordPool);
    return {
      lens: lens.name,
      reframe: clamp(filled, maxOutputLen)
    };
  });
}

module.exports = { generateOutputs };
