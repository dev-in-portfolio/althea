import type { Comparison, ScoreRow, SessionItem } from "./types";

function pairKey(a: string, b: string) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

export function buildScore(items: SessionItem[], comparisons: Comparison[]) {
  const map = new Map<string, ScoreRow>();
  for (const item of items) {
    map.set(item.id, {
      id: item.id,
      label: item.label,
      seed: item.seed,
      wins: 0,
      losses: 0,
      score: 0
    });
  }
  for (const comp of comparisons) {
    const winner = map.get(comp.winner_item_id);
    const loser = map.get(comp.a_item_id === comp.winner_item_id ? comp.b_item_id : comp.a_item_id);
    if (winner) {
      winner.wins += 1;
      winner.score += 1;
    }
    if (loser) {
      loser.losses += 1;
      loser.score -= 1;
    }
  }
  return map;
}

export function rankItems(items: SessionItem[], comparisons: Comparison[]) {
  const scoreMap = buildScore(items, comparisons);
  const headToHead = new Map<string, string>();
  for (const comp of comparisons) {
    headToHead.set(pairKey(comp.a_item_id, comp.b_item_id), comp.winner_item_id);
  }

  return [...scoreMap.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const key = pairKey(a.id, b.id);
    const winner = headToHead.get(key);
    if (winner) {
      return winner === a.id ? -1 : 1;
    }
    return a.seed - b.seed;
  });
}

export function nextPair(
  items: SessionItem[],
  comparisons: Comparison[],
  excludedPairs: string[]
) {
  const scoreMap = buildScore(items, comparisons);
  const compared = new Set<string>();
  for (const comp of comparisons) {
    compared.add(pairKey(comp.a_item_id, comp.b_item_id));
  }
  for (const raw of excludedPairs) {
    compared.add(raw);
  }

  const sorted = [...scoreMap.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.seed - b.seed;
  });

  for (let i = 0; i < sorted.length; i += 1) {
    const a = sorted[i];
    const candidates = sorted
      .filter((b) => b.id !== a.id)
      .map((b) => ({
        item: b,
        diff: Math.abs((a.score ?? 0) - (b.score ?? 0))
      }))
      .sort((x, y) => {
        if (x.diff !== y.diff) return x.diff - y.diff;
        return x.item.seed - y.item.seed;
      });

    for (const candidate of candidates) {
      const key = pairKey(a.id, candidate.item.id);
      if (!compared.has(key)) {
        const left = a.score >= candidate.item.score ? a : candidate.item;
        const right = left.id === a.id ? candidate.item : a;
        return { a: left, b: right, key };
      }
    }
  }

  return null;
}

export function coverage(items: SessionItem[], comparisons: Comparison[]) {
  const totalPairs = (items.length * (items.length - 1)) / 2;
  if (totalPairs === 0) return 1;
  return Math.min(1, comparisons.length / totalPairs);
}
