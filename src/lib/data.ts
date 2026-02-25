import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson<T>(rel: string): T {
  const full = path.join(root, rel);
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

export type Wing = { slug: string; name: string; description?: string };
export type Hall = { slug: string; name: string; wingSlug: string; description?: string };
export type Exhibit = { slug: string; title: string; hallSlug: string; wingSlug?: string; summary?: string; tags?: string[]; body?: string; images?: string[]; sources?: { title: string; url: string }[] };

export function getWings(): Wing[] {
  return readJson<Wing[]>('data/wings.json');
}

export function getHalls(): Hall[] {
  return readJson<Hall[]>('data/halls.json');
}

export function getExhibits(): Exhibit[] {
  return readJson<Exhibit[]>('data/exhibits.json');
}
