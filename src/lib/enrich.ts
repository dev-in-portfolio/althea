import type { Exhibit, Hall, Wing } from './data';

const stop = new Set([
  'the','and','or','of','in','to','a','an','for','with','vs','from','as','on','by','into','why','what','how','is','are','be','&'
]);

function toTag(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function titleTags(title: string): string[] {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9-]/g, ''))
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((w) => !stop.has(w) && w.length > 2);
  const unique = Array.from(new Set(words));
  return unique.slice(0, 6).map(toTag).filter(Boolean);
}

function makeSummary(title: string, hallName: string): string {
  const base = `${title} in the ${hallName} frames the topic at research depth, emphasizing mechanisms, evidence quality, and interpretive limits.`;
  const extra = `It connects the exhibit to the hall’s conceptual core while foregrounding uncertainty, competing models, and scale-dependent effects.`;
  return `${base} ${extra}`.trim();
}

function makeBody(title: string, hallName: string): string {
  const p1 = `This exhibit in the ${hallName} situates ${title.toLowerCase()} within a research-grade evidentiary chain. It foregrounds operational definitions, boundary conditions, and measurement protocols, with attention to sampling design, calibration, and error propagation. Expect explicit distinctions between observable variables, latent states, and inferred processes, framed at multiple spatial and temporal scales.`;
  const p2 = `The core idea is that ${title.toLowerCase()} is best explained by coupling mechanistic theory to diagnostic signatures. The mapping is many-to-one: proxy sensitivity, confounding structure, and model priors can allow competing mechanisms to fit the same data. The exhibit highlights identifiability limits and the role of cross-validation across independent datasets or methods.`;
  const p3 = `Try a structured test: specify the state variables, hypothesized causal pathway, and the predictions that would be violated under a rival model. Then evaluate which observations are decisive versus merely consistent. This mirrors expert practice in assessing falsifiability, sensitivity to assumptions, and robustness under alternative parameterizations.`;
  const p4 = `This matters because it shows how high-confidence claims emerge from constrained inference, not isolated observations. The exhibit models expert reasoning: formalizing mechanisms, quantifying uncertainty, and revising theory as higher-resolution data or improved instrumentation shift what counts as reliable evidence.`;
  return [
    '## What you’ll see',
    p1,
    '## The core idea',
    p2,
    '## Try it',
    p3,
    '## Why it matters',
    p4,
  ].join('\n\n');
}

export function enrichExhibit(exhibit: Exhibit, hall: Hall | undefined, wing: Wing | undefined): Exhibit {
  const hallName = hall?.name || 'Hall';
  const title = exhibit.title || 'This exhibit';

  const summary = (typeof exhibit.summary === 'string' && exhibit.summary.trim().length > 0)
    ? exhibit.summary
    : makeSummary(title, hallName);

  const tags = (Array.isArray(exhibit.tags) && exhibit.tags.length > 0)
    ? exhibit.tags
    : Array.from(new Set([
        `hall-${toTag(exhibit.hallSlug || '')}`,
        wing?.slug ? `wing-${toTag(wing.slug)}` : null,
        ...titleTags(title),
      ].filter(Boolean))).slice(0, 8) as string[];

  const body = (typeof exhibit.body === 'string' && exhibit.body.trim().length > 0)
    ? exhibit.body
    : makeBody(title, hallName);

  const images = Array.isArray(exhibit.images) ? exhibit.images : [];

  return { ...exhibit, summary, tags, body, images };
}
