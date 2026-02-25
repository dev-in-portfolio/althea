function validateInput(text) {
  if (!text || typeof text !== "string") {
    return { ok: false, error: "text required" };
  }
  if (text.length < 3) {
    return { ok: false, error: "text too short" };
  }
  if (text.length > 10000) {
    return { ok: false, error: "text too long" };
  }
  return { ok: true };
}

module.exports = { validateInput };
