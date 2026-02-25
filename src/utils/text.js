const stopwords = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "is", "are", "was", "were",
  "i", "you", "we", "they", "he", "she", "it", "to", "of", "in", "on", "for", "with",
  "at", "by", "from", "as", "that", "this", "these", "those", "be", "been", "being"
]);

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractKeywords(text, limit = 8) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !stopwords.has(token));

  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

module.exports = { normalize, extractKeywords, hash };
