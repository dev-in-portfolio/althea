const {
  normalizeWhitespace,
  splitSentences,
  normalizeForDuplicate,
  tokenize
} = require('../../utils/text');

function buildKeywordFrequency(sentences) {
  const freq = new Map();

  for (const sentence of sentences) {
    const words = tokenize(sentence);
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }

  return freq;
}

function scoreSentences(sentences) {
  const freq = buildKeywordFrequency(sentences);
  const seen = new Map();

  return sentences.map((sentence, index) => {
    const length = sentence.length;
    const lengthScore = Math.min(length, 240) / 240;

    const words = tokenize(sentence);
    const keywordRaw = words.reduce((sum, word) => sum + (freq.get(word) || 0), 0);
    const keywordScore = words.length ? Math.min(keywordRaw / words.length, 3) / 3 : 0;

    const positionScore = 1 - index / Math.max(sentences.length, 1);

    const normalized = normalizeForDuplicate(sentence);
    const duplicateCount = seen.get(normalized) || 0;
    seen.set(normalized, duplicateCount + 1);
    const duplicatePenalty = duplicateCount > 0 ? 0.5 : 1;

    const score = (0.3 * lengthScore + 0.5 * keywordScore + 0.2 * positionScore) * duplicatePenalty;

    return {
      sentence,
      index,
      score
    };
  });
}

function buildLayer(scored, ratio) {
  const count = scored.length;
  const keepCount = Math.max(1, Math.ceil(ratio * count));

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .map((item) => item.index);

  const kept = new Set(top);
  const ordered = scored
    .filter((item) => kept.has(item.index))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  return {
    text: ordered.join(' '),
    kept: ordered.length
  };
}

function pickCore(scored) {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const maxLength = 200;
  const candidate = sorted.find((item) => item.sentence.length <= maxLength);
  return (candidate || sorted[0]).sentence;
}

function compressText({ text, levels, maxSentences }) {
  const normalized = normalizeWhitespace(text);
  const sentences = splitSentences(normalized).slice(0, maxSentences);

  if (sentences.length === 0) {
    return {
      core: normalized,
      layers: {},
      meta: { sentenceCount: 0, kept: {} }
    };
  }

  const scored = scoreSentences(sentences);
  const layers = {};
  const kept = {};

  for (const level of levels) {
    const ratio = level / 100;
    const layer = buildLayer(scored, ratio);
    layers[String(level)] = layer.text;
    kept[String(level)] = layer.kept;
  }

  return {
    core: pickCore(scored),
    layers,
    meta: {
      sentenceCount: sentences.length,
      kept
    }
  };
}

module.exports = {
  compressText
};
