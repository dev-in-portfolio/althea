import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const ROOT = process.cwd();
const OUT_PUBLIC = path.join(ROOT, "public", "data");
const OUT_SIGNS = path.join(OUT_PUBLIC, "signs.json");
const OUT_REPORT = path.join(OUT_PUBLIC, "report.json");

const CANDIDATE_FILES = {
  unikemet: [
    path.join(ROOT, "Unikemet.txt"),
    path.join(ROOT, "data", "Unikemet.txt"),
    path.join(ROOT, "sources_user", "Unikemet.txt")
  ],
  unicodeData: [
    path.join(ROOT, "data", "UnicodeData.txt"),
    path.join(ROOT, "sources_user", "UnicodeData.txt")
  ],
  legacy: [
    path.join(ROOT, "data", "index.json"),
    path.join(ROOT, "data", "glyphs.json")
  ],
  elrc: [
    path.join(ROOT, "data", "elrc-Gardiner.json")
  ],
  elrcDict: [
    path.join(ROOT, "data", "elrc-DictionaryEntries.json")
  ],
  elrcAeg: [
    path.join(ROOT, "data", "elrc-Aegyptus.json")
  ],
  omnika: [
    path.join(ROOT, "data", "omnika-gardiner.xlsx")
  ],
  gardinerWiki: [
    path.join(ROOT, "data", "gardiner2unicode.wiki")
  ],
  gardinerOcr: [
    path.join(ROOT, "data", "ocr", "Gardiner_signlist.ocr.txt")
  ],
  tla: [
    path.join(ROOT, "data", "tla-late_egyptian-v19-premium.jsonl")
  ],
  ramses: [
    path.join(ROOT, "data", "RamsesTrainingSetModel.json")
  ],
  unicodeMdc: [
    path.join(ROOT, "data", "Unicode-MdC-Mapping-v1.utf8"),
    path.join(ROOT, "sources_user", "Unicode-MdC-Mapping-v1.utf8")
  ],
  aedSpellings: [
    path.join(ROOT, "data", "aed_spellings.html"),
    path.join(ROOT, "sources_user", "aed_spellings.html")
  ],
  aedTranslations: [
    path.join(ROOT, "data", "aed_word_translations.html"),
    path.join(ROOT, "sources_user", "aed_word_translations.html")
  ],
  juheapi: [
    path.join(ROOT, "data", "juheapi-egyptian-hieroglyphs.json")
  ],
  overrides: [
    path.join(ROOT, "data", "overrides.json"),
    path.join(ROOT, "sources_user", "overrides.json")
  ]
};

const CATEGORY_LABELS = {
  A: "Man and his occupations",
  B: "Woman and her occupations",
  C: "Anthropomorphic deities",
  D: "Parts of the body",
  E: "Mammals",
  F: "Parts of mammals",
  G: "Birds",
  H: "Parts of birds",
  I: "Amphibious animals, reptiles",
  K: "Fish and parts of fish",
  L: "Invertebrates",
  M: "Trees and plants",
  N: "Sky, earth, water",
  O: "Buildings, parts of buildings",
  P: "Ships and parts of ships",
  Q: "Domestic and funerary furniture",
  R: "Temple furniture and sacred emblems",
  S: "Crowns, dress, staves",
  T: "Warfare, hunting, butchery",
  U: "Agriculture, crafts, professions",
  V: "Rope, fibre, baskets",
  W: "Vessels of stone and earthenware",
  X: "Loaves and cakes",
  Y: "Writings, games, music",
  Z: "Strokes, signs derived from strokes",
  Aa: "Unclassified"
};

const SOURCES = {
  unikemet: {
    sourceRefId: "unikemet",
    title: "Unikemet (Unicode UCD contributory data)",
    author: "Unicode Consortium",
    year: "2024",
    license: "Unicode Terms of Use",
    howUsed: "metadata",
    defaultPointer: "Unikemet.txt"
  },
  unicodeData: {
    sourceRefId: "unicode_data",
    title: "UnicodeData.txt",
    author: "Unicode Consortium",
    year: "current",
    license: "Unicode Terms of Use",
    howUsed: "metadata",
    defaultPointer: "UnicodeData.txt"
  },
  elrc: {
    sourceRefId: "elrc",
    title: "ELRC Hieroglyphs table",
    author: "Egyptian Language Resource Center",
    year: "unknown",
    license: "user-permission (license not published)",
    howUsed: "metadata/paraphrase",
    defaultPointer: "https://www.elrc.dev/api/Hieroglyphs_Read"
  },
  omnika: {
    sourceRefId: "omnika_gardiner",
    title: "OMNIKA Gardiner sign list",
    author: "OMNIKA",
    year: "unknown",
    license: "see OMNIKA license link (user-permission)",
    howUsed: "metadata/paraphrase",
    defaultPointer: "omnika-gardiner.xlsx"
  },
  gardinerOcr: {
    sourceRefId: "gardiner_ocr",
    title: "Gardiner sign list OCR",
    author: "User-provided OCR",
    year: "unknown",
    license: "user-provided",
    howUsed: "metadata/paraphrase",
    defaultPointer: "data/ocr/Gardiner_signlist.ocr.txt"
  },
  wikipedia: {
    sourceRefId: "wikipedia_gardiner",
    title: "Wikipedia Gardiner list",
    author: "Wikipedia contributors",
    year: "current",
    license: "CC BY-SA 4.0",
    howUsed: "metadata/paraphrase",
    defaultPointer: "gardiner2unicode.wiki"
  },
  tla: {
    sourceRefId: "tla_late_egyptian",
    title: "TLA Late Egyptian corpus",
    author: "Thesaurus Linguae Aegyptiae",
    year: "2014-2023",
    license: "CC BY-SA 4.0",
    howUsed: "usage examples",
    defaultPointer: "tla-late_egyptian-v19-premium.jsonl"
  },
  ramses: {
    sourceRefId: "ramses_model",
    title: "Ramses Training Set Transliteration Model",
    author: "Ramses team",
    year: "2023",
    license: "CC BY 4.0",
    howUsed: "transliteration vocabulary reference",
    defaultPointer: "RamsesTrainingSetModel.json"
  },
  aed: {
    sourceRefId: "aed_dictionary",
    title: "Ancient Egyptian Dictionary (AED) lists",
    author: "Simon D. Schweitzer",
    year: "2021",
    license: "CC BY-SA 4.0",
    howUsed: "word-level translations and spellings",
    defaultPointer: "aed_spellings.html / aed_word_translations.html"
  },
  unicodeMdc: {
    sourceRefId: "unicode_mdc",
    title: "Unicode MdC Mapping (UTN #32)",
    author: "Unicode Consortium",
    year: "2015",
    license: "Unicode Terms of Use",
    howUsed: "mapping of signs to MdC codes",
    defaultPointer: "Unicode-MdC-Mapping-v1.utf8"
  },
  juheapi: {
    sourceRefId: "juheapi_images",
    title: "Egyptian Hieroglyphs image dataset",
    author: "hamdijr",
    year: "unknown",
    license: "GPL (non-commercial)",
    howUsed: "optional image references",
    defaultPointer: "juheapi-egyptian-hieroglyphs.json"
  },
  legacy: {
    sourceRefId: "legacy_data",
    title: "Legacy project data",
    author: "User-provided",
    year: "unknown",
    license: "user-provided",
    howUsed: "metadata/paraphrase",
    defaultPointer: "data/index.json"
  },
  overrides: {
    sourceRefId: "overrides",
    title: "Manual Overrides",
    author: "User-provided",
    year: "unknown",
    license: "user-provided",
    howUsed: "metadata/paraphrase",
    defaultPointer: "overrides.json"
  }
};

function firstExisting(paths){
  for(const p of paths){
    if(fs.existsSync(p)) return p;
  }
  return null;
}

function readText(filePath){
  return fs.readFileSync(filePath, "utf8");
}

function normalizeGardiner(raw){
  if(!raw) return null;
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  const hy = cleaned.match(/^([A-Z]{1,2})-(\d+)-(\d+[A-Z]?)$/);
  if(hy){
    const letter = hy[1];
    const num = hy[3];
    const m = num.match(/^(\d+)([A-Z]?)$/);
    const digits = m[1].padStart(3, "0");
    return `${letter}${digits}${m[2]}`;
  }
  const simple = cleaned.match(/^([A-Z]{1,2})(\d+)([A-Z]?)$/);
  if(simple){
    return `${simple[1]}${simple[2].padStart(3, "0")}${simple[3]}`;
  }
  return cleaned;
}

function parseUnikemet(text){
  const map = new Map();
  const lines = text.split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    if(!line || line.startsWith("#")) continue;
    const parts = line.split("\t");
    if(parts.length < 3) continue;
    const code = parts[0].trim();
    const tag = parts[1].trim();
    const value = parts.slice(2).join("\t").trim();

    const entry = map.get(code) || {
      codepoint: code,
      desc: null,
      funcs: [],
      fvals: [],
      cat: null,
      gardiner: null,
      jsesh: null,
      sourceLines: []
    };

    entry.sourceLines.push(i + 1);

    if(tag === "kEH_Desc") entry.desc = value;
    if(tag === "kEH_Func") entry.funcs.push(value);
    if(tag === "kEH_FVal") entry.fvals.push(value);
    if(tag === "kEH_Cat") entry.cat = value;
    if(tag === "kEH_UniK") entry.gardiner = normalizeGardiner(value);
    if(tag === "kEH_JSesh") entry.jsesh = value;

    map.set(code, entry);
  }
  return map;
}

function parseUnicodeData(text){
  const map = new Map();
  const lines = text.split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    if(!line) continue;
    const fields = line.split(";");
    if(fields.length < 2) continue;
    const hex = fields[0].trim().toUpperCase();
    const name = fields[1].trim();
    const code = `U+${hex}`;
    map.set(code, { name, line: i + 1 });
  }
  return map;
}

function parseLegacy(jsonText){
  try{
    const data = JSON.parse(jsonText);
    const list = Array.isArray(data) ? data : data.glyphs || [];
    const map = new Map();
    list.forEach((g) => {
      const gardiner = normalizeGardiner(g.gardiner || g.id || g.code || "");
      const codepoint = g.codepoint || (g.code ? `U+${g.code.codePointAt(0).toString(16).toUpperCase()}` : null);
      const entry = {
        gardiner,
        codepoint,
        meanings: Array.isArray(g.meanings) ? g.meanings : (g.meaning ? g.meaning.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : []),
        transliterations: Array.isArray(g.transliterations) ? g.transliterations : []
      };
      if(gardiner) map.set(`G:${gardiner}`, entry);
      if(codepoint) map.set(`U:${codepoint}`, entry);
    });
    return map;
  }catch{
    return new Map();
  }
}

function parseElrc(text){
  try{
    const data = JSON.parse(text);
    const rows = data.data || [];
    const mapByCodepoint = new Map();
    const mapByGardiner = new Map();

    rows.forEach((row, idx) => {
      const glyph = row.GLYPH || "";
      const codepoint = glyph ? `U+${glyph.codePointAt(0).toString(16).toUpperCase()}` : null;
      const gname = normalizeGardiner(row.gname || row.aname || row.gname2 || "");
      const entry = {
        idx: idx + 1,
        codepoint,
        gardiner: gname,
        name: row.Name || "",
        sectionName: row.SectionName || "",
        category: row.Category || "",
        definition: row.Definition || "",
        letter: row.Letter || "",
        biliteral: row.Biliteral || "",
        soundCode: row.SoundCode || "",
        word: row.Word || "",
        note: row.Note || "",
        note2: row.Note2 || ""
      };
      if(codepoint) mapByCodepoint.set(codepoint, entry);
      if(gname) mapByGardiner.set(gname, entry);
    });

    return { mapByCodepoint, mapByGardiner };
  }catch{
    return { mapByCodepoint: new Map(), mapByGardiner: new Map() };
  }
}

function parseOmnika(filePath){
  if(!filePath) return { byGardiner: new Map(), byCodepoint: new Map(), categoryLabels: new Map() };
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const byGardiner = new Map();
  const byCodepoint = new Map();
  const categoryLabels = new Map();
  let currentCategoryKey = null;
  let currentCategoryLabel = null;

  rows.forEach((row, idx) => {
    if(!row || !row.length) return;
    if(row.length === 1 && typeof row[0] === "string" && row[0].includes(".")){
      const m = row[0].match(/^([A-Z]{1,2})\.\s*(.+)$/);
      if(m){
        currentCategoryKey = m[1];
        currentCategoryLabel = m[2].trim();
        categoryLabels.set(currentCategoryKey, currentCategoryLabel);
      }
      return;
    }
    if(row[0] === "Gardiner No.") return;
    const gardiner = normalizeGardiner(String(row[0] || ""));
    const glyph = String(row[1] || "");
    const desc = String(row[2] || "");
    const details = String(row[3] || "");
    if(!gardiner) return;
    const entry = {
      idx: idx + 1,
      gardiner,
      glyph,
      description: desc,
      details,
      categoryKey: currentCategoryKey,
      categoryLabel: currentCategoryLabel
    };
    byGardiner.set(gardiner, entry);
    if(glyph){
      const cp = `U+${glyph.codePointAt(0).toString(16).toUpperCase()}`;
      byCodepoint.set(cp, entry);
    }
  });

  return { byGardiner, byCodepoint, categoryLabels };
}

function stripWiki(text){
  if(!text) return "";
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''+/g, "")
    .replace(/''/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function stripHtml(text){
  if(!text) return "";
  return text
    .replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, " ")
    .replace(/<span[^>]*>/gi, " ")
    .replace(/<\/span>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x[0-9a-fA-F]+;?/g, " ")
    .replace(/&thinsp;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseElrcLongDesc(html){
  if(!html) return { usages: [], translits: [], glosses: [] };
  const translits = Array.from(html.matchAll(/<span\s+class="trans">([^<]+)<\/span>/gi)).map((m) => m[1].trim());
  const glosses = Array.from(html.matchAll(/"([^"]{1,80})"/g)).map((m) => m[1].trim());
  const items = html.match(/<li>[\s\S]*?<\/li>/gi) || [];
  const usages = items.map((item) => {
    let text = stripHtml(item);
    text = text.replace(/\bExx?\.?[\s\S]*$/i, "").trim();
    if(text.length > 140) text = text.slice(0, 137) + "…";
    return text;
  }).filter(Boolean);
  return { usages, translits, glosses };
}

function mergeElrcRows(rows){
  const merged = {
    definitions: [],
    letters: [],
    biliterals: [],
    soundCodes: [],
    notes: [],
    words: [],
    longDescs: [],
    name: null,
    sectionName: null,
    category: null,
    gardiner: null
  };
  rows.forEach((row) => {
    if(!merged.name && row.Name) merged.name = row.Name;
    if(!merged.sectionName && row.SectionName) merged.sectionName = row.SectionName;
    if(!merged.category && row.Category) merged.category = row.Category;
    if(!merged.gardiner && row.gname) merged.gardiner = row.gname;

    if(row.Definition) merged.definitions.push(row.Definition);
    if(row.Letter) merged.letters.push(row.Letter);
    if(row.Biliteral) merged.biliterals.push(row.Biliteral);
    if(row.SoundCode) merged.soundCodes.push(row.SoundCode);
    if(row.Note) merged.notes.push(row.Note);
    if(row.Note2) merged.notes.push(row.Note2);
    if(row.Word) merged.words.push(row.Word);
    if(row.LongDesc) merged.longDescs.push(row.LongDesc);
  });
  return merged;
}

function parseGardinerWiki(text){
  if(!text) return { byGardiner: new Map(), byCodepoint: new Map() };
  const byGardiner = new Map();
  const byCodepoint = new Map();

  const blocks = text.split("{{List of hieroglyphs/row").slice(1);
  blocks.forEach((block) => {
    const end = block.indexOf("}}");
    if(end === -1) return;
    const body = block.slice(0, end);
    const fields = {};
    const parts = body.split("|").map((p) => p.trim()).filter(Boolean);
    for(const part of parts){
      const idx = part.indexOf("=");
      if(idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      fields[key] = value;
    }
    if(!fields.gardiner || !fields.unicode) return;
    const gardiner = normalizeGardiner(fields.gardiner);
    const codepoint = `U+${fields.unicode.toUpperCase()}`;
    const desc = stripWiki(fields.desc || "");
    const notes = stripWiki(fields.notes || "");

    const meanings = [];
    const translits = [];
    Object.keys(fields).filter((k) => k.startsWith("tl")).forEach((k) => {
      const raw = fields[k];
      const meaningMatches = raw.match(/'''([^']+)'''/g) || [];
      meaningMatches.forEach((m) => meanings.push(stripWiki(m)));
      const translitMatches = raw.match(/''([^']+)''/g) || [];
      translitMatches.forEach((m) => translits.push(stripWiki(m)));
    });

    const entry = { gardiner, codepoint, desc, notes, meanings, translits };
    byGardiner.set(gardiner, entry);
    byCodepoint.set(codepoint, entry);
  });

  return { byGardiner, byCodepoint };
}

function parseGardinerOcr(text){
  if(!text) return new Map();
  const map = new Map();
  const lines = text.split(/\r?\n/);
  let pending = null;

  const extractHints = (line) => {
    const translits = [];
    const meanings = [];

    // Extract quoted English glosses
    const quoted = line.match(/"([^"]{2,60})"/g) || [];
    quoted.forEach((q) => {
      const cleaned = q.replace(/"/g, "").trim();
      if(cleaned) meanings.push(cleaned);
    });

    // Extract parenthetical transliterations (limited to short tokens)
    const parens = line.match(/\(([^)]+)\)/g) || [];
    parens.forEach((p) => {
      const inner = p.replace(/[()]/g, "").trim();
      if(!inner) return;
      // Keep short tokens likely to be transliterations (avoid long phrases)
      inner.split(/[;,]/).map((t) => t.trim()).forEach((t) => {
        if(t.length > 0 && t.length <= 10) translits.push(t);
      });
    });

    return { translits, meanings };
  };

  for(let i = 0; i < lines.length; i++){
    const raw = lines[i];
    const line = raw.trim();
    if(!line) continue;
    const match = line.match(/\b(Aa|[A-Z])\s*0*(\d{1,3}[A-Za-z]?)\b/);
    if(match){
      const code = `${match[1]}${match[2]}`.replace(/\s+/g, "");
      const rest = line.replace(match[0], "").trim();
      if(rest){
        const hints = extractHints(rest);
        map.set(code, { desc: rest, line: i + 1, ...hints });
        pending = null;
      }else{
        pending = { code, line: i + 1 };
      }
      continue;
    }
    if(pending && line.length > 3){
      if(!map.has(pending.code)){
        const hints = extractHints(line);
        map.set(pending.code, { desc: line, line: pending.line, ...hints });
      }
      pending = null;
    }
  }
  return map;
}

function parseTlaExamples(filePath, maxPerSign = 2){
  if(!filePath) return new Map();
  const text = readText(filePath);
  const lines = text.split(/\r?\n/).filter(Boolean);
  const map = new Map();

  lines.forEach((line, idx) => {
    let obj;
    try{ obj = JSON.parse(line); }catch{ return; }
    const glyphsRaw = obj.hieroglyphs || "";
    const glyphs = glyphsRaw
      .replace(/<g>.*?<\/g>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/Ff\\d+/gi, "")
      .replace(/\\s{2,}/g, " ")
      .trim();
    const transliteration = obj.transliteration || "";
    const glossing = obj.glossing || "";
    const translation = obj.translation || "";
    const date = [obj.dateNotBefore, obj.dateNotAfter].filter(Boolean).join("–");

    const cps = new Set();
    for(const ch of glyphs){
      const cp = ch.codePointAt(0);
      if(cp >= 0x13000 && cp <= 0x1347F) cps.add(`U+${cp.toString(16).toUpperCase()}`);
    }

    if(!cps.size) return;

    const textParts = [glyphs, transliteration, glossing, translation].filter(Boolean);
    let combined = textParts.join(" | ");
    if(date) combined += ` (date: ${date})`;
    if(combined.length > 260) combined = combined.slice(0, 257) + "…";

    cps.forEach((code) => {
      const list = map.get(code) || [];
      if(list.length >= maxPerSign) return;
      list.push({ text: combined });
      map.set(code, list);
    });
  });

  return map;
}

function parseRamses(filePath){
  if(!filePath) return new Set();
  try{
    const data = JSON.parse(readText(filePath));
    const words = data.words || {};
    const set = new Set();
    Object.values(words).forEach((entry) => {
      (entry.interpretations || []).forEach((it) => {
        if(it.transliteration) set.add(it.transliteration);
      });
    });
    return set;
  }catch{
    return new Set();
  }
}

function parseCodepoint(code){
  const hex = code.replace(/^U\+/, "").toUpperCase();
  const int = parseInt(hex, 16);
  return { hex: `U+${hex}`, int, char: String.fromCodePoint(int) };
}

function gardinerCategoryFromCat(cat){
  if(!cat) return { key: "?", subgroup: null };
  const m = cat.match(/^([A-Z]{1,2})-(\d+)-/);
  if(!m) return { key: "?", subgroup: null };
  return { key: m[1], subgroup: m[2] };
}

function missing(reason, needsSources){
  return { reason, needsSources };
}

function applyOverrides(entry, overrides){
  const override = overrides?.[entry.id];
  if(!override) return entry;
  return {
    ...entry,
    ...override,
    sources: Array.from(new Set([...(entry.sources || []), ...(override.sources || [])]))
  };
}

function item(text){
  return { text };
}

function dedupeItems(items){
  const seen = new Set();
  return items.filter((it) => {
    const key = (it?.text || "").trim().toLowerCase();
    if(!key) return false;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function limitItems(items, max = 6){
  if(!items || !items.length) return [];
  return items.slice(0, max);
}

function parseAedSpellings(html){
  if(!html) return new Map();
  const map = new Map();
  const blocks = html.split("<div class=\"entry_list\">").slice(1);
  blocks.forEach((block) => {
    const end = block.indexOf("</div>");
    if(end === -1) return;
    const body = block.slice(0, end);
    const translits = Array.from(body.matchAll(/<a[^>]+>([^<]+)<\/a>/gi)).map((m) => m[1].trim()).filter(Boolean);
    const cps = Array.from(body.matchAll(/&#x([0-9a-fA-F]+);/g)).map((m) => `U+${m[1].toUpperCase()}`);
    if(!translits.length || !cps.length) return;
    translits.forEach((t) => {
      const existing = map.get(t) || new Set();
      cps.forEach((cp) => existing.add(cp));
      map.set(t, existing);
    });
  });
  return map;
}

function parseAedTranslations(html){
  if(!html) return new Map();
  const map = new Map();
  const blocks = html.split("<div class=\"entry_list\">").slice(1);
  blocks.forEach((block) => {
    const end = block.indexOf("</div>");
    if(end === -1) return;
    const body = block.slice(0, end);
    const translits = Array.from(body.matchAll(/<a[^>]+>([^<]+)<\/a>/gi)).map((m) => m[1].trim()).filter(Boolean);
    if(!translits.length) return;
    const raw = body.replace(/<a[^>]+>[^<]+<\/a>/gi, "").replace(/<[^>]+>/g, "").trim();
    const colonIdx = raw.indexOf(":");
    if(colonIdx === -1) return;
    let translation = raw.slice(0, colonIdx).trim();
    translation = translation.replace(/^"+|"+$/g, "");
    if(!translation) return;
    translits.forEach((t) => {
      const list = map.get(t) || [];
      list.push(translation);
      map.set(t, list);
    });
  });
  return map;
}

function parseUnicodeMdc(text){
  if(!text) return new Map();
  const map = new Map();
  const lines = text.split(/\r?\n/).filter(Boolean);
  lines.forEach((line, idx) => {
    const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    if(parts.length < 2) return;
    const hex = parts[1];
    const mdc = parts[2] || "";
    if(!hex) return;
    const code = `U+${hex.toUpperCase()}`;
    map.set(code, { mdc, line: idx + 1 });
  });
  return map;
}

function splitMdc(mdc){
  if(!mdc) return { gardiner: null, phonetics: [] };
  const rawTokens = mdc.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  const phonetics = [];
  let gardiner = null;
  rawTokens.forEach((token) => {
    const cleaned = token.replace(/[\\]/g, "");
    if(!cleaned) return;
    const g = normalizeGardiner(cleaned);
    const isGardiner = /^[A-Z]{1,2}\d{1,3}[A-Za-z]?$/.test(g || "");
    if(isGardiner){
      if(!gardiner) gardiner = g;
      return;
    }
    phonetics.push(cleaned);
  });
  return { gardiner, phonetics };
}

function computeCompleteness(entry){
  const levels = {
    L1: Boolean(entry.codepoint?.hex),
    L2: Boolean(entry.gardiner?.code),
    L3: Boolean(entry.classifiers?.length),
    L4: Boolean(entry.transliterations?.length),
    L5: Boolean(entry.meanings?.length),
    L6: Boolean(entry.usage?.length),
    L7: Boolean(entry.notes?.length)
  };
  const present = Object.entries(levels).filter(([, v]) => v).map(([k]) => k);
  const missingLevels = Object.entries(levels).filter(([, v]) => !v).map(([k]) => k);
  return { levels, present, missing: missingLevels };
}

function splitMeaning(text){
  return text.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

function cleanToken(value){
  if(!value) return null;
  const v = value.trim();
  if(!v) return null;
  if(v === "0" || v === "_" || v === "-" || v === "—") return null;
  return v;
}

function normalizeCategoryLabel(label){
  if(!label) return label;
  const lower = label.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

async function main(){
  const unikemetPath = firstExisting(CANDIDATE_FILES.unikemet);
  const unicodeDataPath = firstExisting(CANDIDATE_FILES.unicodeData);
  const legacyPath = firstExisting(CANDIDATE_FILES.legacy);
  const elrcPath = firstExisting(CANDIDATE_FILES.elrc);
  const elrcDictPath = firstExisting(CANDIDATE_FILES.elrcDict);
  const elrcAegPath = firstExisting(CANDIDATE_FILES.elrcAeg);
  const omnikaPath = firstExisting(CANDIDATE_FILES.omnika);
  const wikiPath = firstExisting(CANDIDATE_FILES.gardinerWiki);
  const ocrPath = firstExisting(CANDIDATE_FILES.gardinerOcr);
  const tlaPath = firstExisting(CANDIDATE_FILES.tla);
  const ramsesPath = firstExisting(CANDIDATE_FILES.ramses);
  const unicodeMdcPath = firstExisting(CANDIDATE_FILES.unicodeMdc);
  const aedSpellingsPath = firstExisting(CANDIDATE_FILES.aedSpellings);
  const aedTranslationsPath = firstExisting(CANDIDATE_FILES.aedTranslations);
  const overridesPath = firstExisting(CANDIDATE_FILES.overrides);

  const unikemetMap = unikemetPath ? parseUnikemet(readText(unikemetPath)) : new Map();
  const unicodeMap = unicodeDataPath ? parseUnicodeData(readText(unicodeDataPath)) : new Map();
  const legacyMap = legacyPath ? parseLegacy(readText(legacyPath)) : new Map();
  const overrides = overridesPath ? JSON.parse(readText(overridesPath)) : {};

  const elrc = elrcPath ? parseElrc(readText(elrcPath)) : { mapByCodepoint: new Map(), mapByGardiner: new Map() };
  const elrcDict = elrcDictPath ? parseElrc(readText(elrcDictPath)) : { mapByCodepoint: new Map(), mapByGardiner: new Map() };
  const elrcAeg = elrcAegPath ? parseElrc(readText(elrcAegPath)) : { mapByCodepoint: new Map(), mapByGardiner: new Map() };
  const omnika = parseOmnika(omnikaPath);
  const wiki = wikiPath ? parseGardinerWiki(readText(wikiPath)) : { byGardiner: new Map(), byCodepoint: new Map() };
  const ocrMap = ocrPath ? parseGardinerOcr(readText(ocrPath)) : new Map();
  const tlaExamples = parseTlaExamples(tlaPath, 2);
  const ramsesVocab = parseRamses(ramsesPath);
  const unicodeMdcMap = unicodeMdcPath ? parseUnicodeMdc(readText(unicodeMdcPath)) : new Map();
  const aedSpellings = aedSpellingsPath ? parseAedSpellings(readText(aedSpellingsPath)) : new Map();
  const aedTranslations = aedTranslationsPath ? parseAedTranslations(readText(aedTranslationsPath)) : new Map();
  const aedMeaningByCodepoint = new Map();
  const aedUsageByCodepoint = new Map();

  if(aedTranslations.size && aedSpellings.size){
    for(const [translit, translations] of aedTranslations.entries()){
      const cps = aedSpellings.get(translit);
      if(!cps || !cps.size) continue;
      cps.forEach((code) => {
        const list = aedMeaningByCodepoint.get(code) || [];
        translations.forEach((t) => list.push(t));
        aedMeaningByCodepoint.set(code, list);
      });
    }
  }

  if(aedSpellings.size){
    for(const [translit, cps] of aedSpellings.entries()){
      const usageText = `AED spelling: ${translit}`;
      cps.forEach((code) => {
        const list = aedUsageByCodepoint.get(code) || [];
        list.push(usageText);
        aedUsageByCodepoint.set(code, list);
      });
    }
  }

  const codepoints = new Set([
    ...unikemetMap.keys(),
    ...unicodeMap.keys(),
    ...wiki.byCodepoint.keys(),
    ...tlaExamples.keys(),
    ...elrc.mapByCodepoint.keys(),
    ...elrcDict.mapByCodepoint.keys(),
    ...elrcAeg.mapByCodepoint.keys(),
    ...omnika.byCodepoint.keys(),
    ...unicodeMdcMap.keys()
  ]);

  const signs = [];
  const needsResolution = [];

  for(const code of codepoints){
    const unikemet = unikemetMap.get(code);
    const unicode = unicodeMap.get(code);
    const cp = parseCodepoint(code);
    const isEgyptian =
      (unicode?.name || "").startsWith("EGYPTIAN HIEROGLYPH") ||
      Boolean(unikemet) ||
      wiki.byCodepoint.has(code);
    if(!isEgyptian) continue;

    const elrcRows = [
      elrc.mapByCodepoint.get(code),
      elrcDict.mapByCodepoint.get(code),
      elrcAeg.mapByCodepoint.get(code)
    ].filter(Boolean);
    const elrcMerged = mergeElrcRows(elrcRows);
    const elrcLongDesc = elrcMerged.longDescs.map((ld) => parseElrcLongDesc(ld));
    const elrcLongDescUsages = elrcLongDesc.flatMap((ld) => ld.usages || []);
    const elrcLongDescTranslits = elrcLongDesc.flatMap((ld) => ld.translits || []);
    const elrcLongDescGlosses = elrcLongDesc.flatMap((ld) => ld.glosses || []);
    const omnikaRow = omnika.byCodepoint.get(code);
    const wikiRow = wiki.byCodepoint.get(code);
    const mdcRow = unicodeMdcMap.get(code);
    const mdcInfo = splitMdc(mdcRow?.mdc || "");

    let gardiner = normalizeGardiner(unikemet?.gardiner || "");
    if(!gardiner && elrcMerged?.gardiner) gardiner = elrcMerged.gardiner;
    if(!gardiner && omnikaRow?.gardiner) gardiner = omnikaRow.gardiner;
    if(!gardiner && wikiRow?.gardiner) gardiner = wikiRow.gardiner;
    if(!gardiner && mdcInfo?.gardiner) gardiner = mdcInfo.gardiner;
    const ocrRow = gardiner ? ocrMap.get(gardiner) : null;

    const catParts = gardinerCategoryFromCat(unikemet?.cat);
    const categoryKey = gardiner ? gardiner.match(/^[A-Z]{1,2}/)?.[0] : catParts.key;
    const rawLabel = omnika.categoryLabels.get(categoryKey) || CATEGORY_LABELS[categoryKey] || "Unclassified";
    const categoryLabel = normalizeCategoryLabel(rawLabel);

    const id = gardiner ? `${code}:${gardiner}` : code;

    const unikemetPointer = unikemet?.sourceLines?.length ? `Unikemet.txt lines ${unikemet.sourceLines.slice(0,3).join(",")}` : SOURCES.unikemet.defaultPointer;
    const unicodePointer = unicode ? `UnicodeData.txt line ${unicode.line}` : SOURCES.unicodeData.defaultPointer;
    const elrcPointer = elrcRows.length ? `ELRC rows ${elrcRows.map((r) => r.idx).filter(Boolean).slice(0,3).join(", ")}` : SOURCES.elrc.defaultPointer;
    const omnikaPointer = omnikaRow ? `omnika-gardiner.xlsx row ${omnikaRow.idx}` : SOURCES.omnika.defaultPointer;
    const wikiPointer = wikiRow ? `gardiner2unicode.wiki ${wikiRow.gardiner || code}` : SOURCES.wikipedia.defaultPointer;

    const descriptionText =
      unikemet?.desc ||
      omnikaRow?.description ||
      elrcMerged?.name ||
      elrcMerged?.sectionName ||
      wikiRow?.desc ||
      ocrRow?.desc ||
      (unicode?.name ? unicode.name.replace(/EGYPTIAN HIEROGLYPH /g, "") : null);

    const meanings = [];
    elrcMerged.definitions.forEach((def) => {
      splitMeaning(def).forEach((m) => {
        const cleaned = cleanToken(m);
        if(cleaned) meanings.push(item(cleaned));
      });
    });
    if(elrcLongDescGlosses.length) elrcLongDescGlosses.forEach((m) => {
      const cleaned = cleanToken(m);
      if(cleaned) meanings.push(item(cleaned));
    });
    if(wikiRow?.meanings?.length) wikiRow.meanings.forEach((m) => {
      const cleaned = cleanToken(m);
      if(cleaned) meanings.push(item(cleaned));
    });
    if(legacyMap.get(`G:${gardiner}`)?.meanings?.length) legacyMap.get(`G:${gardiner}`).meanings.forEach((m) => {
      const cleaned = cleanToken(m);
      if(cleaned) meanings.push(item(cleaned));
    });
    if(ocrRow?.meanings?.length){
      ocrRow.meanings.forEach((m) => {
        const cleaned = cleanToken(m);
        if(cleaned) meanings.push(item(cleaned));
      });
    }
    if(unikemet?.funcs?.length){
      unikemet.funcs.forEach((m) => {
        const cleaned = cleanToken(m);
        if(cleaned) meanings.push(item(cleaned));
      });
    }
    if(aedMeaningByCodepoint.has(code)){
      aedMeaningByCodepoint.get(code).forEach((m) => {
        const cleaned = cleanToken(m);
        if(cleaned) meanings.push(item(cleaned));
      });
    }
    if(!meanings.length && unicode?.name){
      const fallback = unicode.name.replace(/EGYPTIAN HIEROGLYPH /g, "").trim();
      if(fallback) meanings.push(item(fallback));
    }

    const transliterations = [];
    elrcMerged.letters.forEach((value) => {
      const cleaned = cleanToken(value);
      if(cleaned) transliterations.push(item(cleaned));
    });
    elrcMerged.biliterals.forEach((value) => {
      const cleaned = cleanToken(value);
      if(cleaned) transliterations.push(item(cleaned));
    });
    elrcMerged.soundCodes.forEach((value) => {
      const cleaned = cleanToken(value);
      if(cleaned) transliterations.push(item(cleaned));
    });
    if(elrcLongDescTranslits.length) elrcLongDescTranslits.forEach((t) => {
      const cleaned = cleanToken(t);
      if(cleaned) transliterations.push(item(cleaned));
    });
    if(wikiRow?.translits?.length) wikiRow.translits.forEach((t) => {
      const cleaned = cleanToken(t);
      if(cleaned) transliterations.push(item(cleaned));
    });
    if(legacyMap.get(`G:${gardiner}`)?.transliterations?.length) legacyMap.get(`G:${gardiner}`).transliterations.forEach((t) => {
      const cleaned = cleanToken(t);
      if(cleaned) transliterations.push(item(cleaned));
    });
    if(ocrRow?.translits?.length){
      ocrRow.translits.forEach((t) => {
        const cleaned = cleanToken(t);
        if(cleaned) transliterations.push(item(cleaned));
      });
    }
    if(unikemet?.fvals?.length){
      unikemet.fvals.forEach((t) => {
        const cleaned = cleanToken(t);
        if(cleaned) transliterations.push(item(cleaned));
      });
    }
    if(mdcInfo?.phonetics?.length){
      mdcInfo.phonetics.forEach((t) => {
        const cleaned = cleanToken(t);
        if(cleaned) transliterations.push(item(cleaned));
      });
    }

    if(ramsesVocab.size){
      // no-op: sources stripped
    }

    const classifiers = [];
    (unikemet?.funcs || []).forEach((f) => classifiers.push(item(f)));
    (unikemet?.fvals || []).forEach((f) => classifiers.push(item(f)));

    const notes = [];
    elrcMerged.notes.forEach((note) => {
      const cleaned = cleanToken(note);
      if(cleaned) notes.push(item(cleaned));
    });
    elrcMerged.words.forEach((word) => {
      const cleaned = cleanToken(word);
      if(cleaned) notes.push(item(cleaned));
    });
    if(omnikaRow?.details) notes.push(item(omnikaRow.details));
    if(wikiRow?.notes) notes.push(item(wikiRow.notes));

    const usage = [
      ...(tlaExamples.get(code) || []).map((u) => ({ text: u.text })),
      ...elrcLongDescUsages.map((text) => ({ text })),
      ...(aedUsageByCodepoint.get(code) || []).map((text) => ({ text }))
    ];

    const sign = {
      id,
      codepoint: {
        hex: cp.hex,
        int: cp.int,
        char: cp.char
      },
      gardiner: gardiner ? {
        code: gardiner,
        categoryKey: categoryKey || "?",
        categoryLabel,
        subgroup: catParts.subgroup || null
      } : null,
      unicode: {
        name: unicode?.name || null,
        block: cp.int >= 0x13000 && cp.int <= 0x1342F ? "Egyptian Hieroglyphs" : "Egyptian Hieroglyphs Extended-A"
      },
      description: {
        text: descriptionText
      },
      meanings: limitItems(dedupeItems(meanings), 10),
      transliterations: dedupeItems(transliterations),
      classifiers,
      usage: limitItems(dedupeItems(usage), 6),
      notes: limitItems(dedupeItems(notes), 6),
      sources: [],
      missing: {
        unicodeName: unicode?.name ? null : missing("Not in UnicodeData.txt; update UnicodeData source", ["unicode_data"]),
        gardiner: gardiner ? null : missing("Not in current sources; needs Gardiner code", ["unikemet", "elrc", "omnika", "wikipedia"]),
        meanings: meanings.length ? null : missing("Not in current sources; needs lexicon/meaning data", ["elrc", "wikipedia", "legacy_data", "user-provided"]),
        transliterations: transliterations.length ? null : missing("Not in current sources; needs transliteration data", ["elrc", "wikipedia", "legacy_data", "user-provided"]),
        description: descriptionText ? null : missing("Not in current sources; needs description", ["unikemet", "omnika", "wikipedia", "gardiner_ocr"]),
        classifiers: classifiers.length ? null : missing("Not in current sources; needs classifier/function data", ["unikemet", "user-provided"]),
        notes: notes.length ? null : missing("Not in current sources; needs notes/usage", ["elrc", "omnika", "wikipedia", "user-provided"]),
        usage: usage.length ? null : missing("Not in current sources; needs usage examples", ["tla_late_egyptian", "user-provided"])
      }
    };

    const merged = applyOverrides(sign, overrides);
    merged.completeness = computeCompleteness(merged);

    if(merged.missing.meanings || merged.missing.transliterations){
      needsResolution.push(merged.id);
    }

    signs.push(merged);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      total: signs.length,
      missingGardiner: signs.filter((s) => !s.gardiner).length,
      missingUnicodeName: signs.filter((s) => !s.unicode?.name).length,
      missingMeanings: signs.filter((s) => !s.meanings.length).length,
      missingTransliterations: signs.filter((s) => !s.transliterations.length).length,
      missingDescription: signs.filter((s) => !s.description?.text).length,
      missingUsage: signs.filter((s) => !s.usage.length).length
    },
    needsResolutionSample: needsResolution.slice(0, 50)
  };

  fs.mkdirSync(OUT_PUBLIC, { recursive: true });
  fs.writeFileSync(OUT_SIGNS, JSON.stringify(signs, null, 2));
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

  console.log(`[build-data] Wrote ${signs.length} signs to ${OUT_SIGNS}`);
  // sources.json intentionally omitted (sources stripped)
  console.log(`[build-data] Wrote report to ${OUT_REPORT}`);
}

main().catch((err) => {
  console.error("[build-data] Failed", err);
  process.exit(1);
});
