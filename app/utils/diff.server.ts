import crypto from "crypto";

export function canonicalize(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `"${k}":${canonicalize(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashRecord(record: any): string {
  const canon = canonicalize(record);
  return crypto.createHash("sha256").update(canon).digest("hex");
}

export function parseDataset(raw: string): any[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    if (trimmed.startsWith("[")) return JSON.parse(trimmed);
    return trimmed.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  }
  const lines = trimmed.split("\n").filter(Boolean);
  const [header, ...rows] = lines;
  const headers = header.split(",").map((h) => h.trim());
  return rows.map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
}
