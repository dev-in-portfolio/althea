function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const withBoundaries = normalized
    .replace(/([.?!])\s+(?=[A-Z])/g, '$1|')
    .replace(/\n+/g, '|');

  return withBoundaries
    .split('|')
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizeForDuplicate(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z0-9']+/g);
  if (!matches) return [];
  return matches.filter((word) => word.length >= 3);
}

module.exports = {
  normalizeWhitespace,
  splitSentences,
  normalizeForDuplicate,
  tokenize
};
