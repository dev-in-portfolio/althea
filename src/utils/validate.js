function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function validateLevels(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return [75, 50, 25];
  }
  const clean = levels
    .map((level) => Number(level))
    .filter((level) => Number.isFinite(level))
    .map((level) => Math.round(level))
    .filter((level) => level > 0 && level < 100);

  return clean.length ? Array.from(new Set(clean)) : [75, 50, 25];
}

function validatePayload(body) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return { error: 'Text is required.' };
  }

  const levels = validateLevels(body.levels);
  const maxSentences = clampNumber(Number(body.maxSentences), 5, 200, 60);

  return {
    value: {
      text,
      levels,
      maxSentences
    }
  };
}

module.exports = {
  validatePayload
};
