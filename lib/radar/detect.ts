import type { EventRecord, Signal } from "./types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function dayNameFromIndex(index: number) {
  return DAY_NAMES[index] ?? "Day";
}

function hourLabel(hour: number) {
  if (hour < 5) return "late night";
  if (hour < 9) return "early morning";
  if (hour < 12) return "late morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function countTags(events: EventRecord[]) {
  const map = new Map<string, number>();
  for (const event of events) {
    for (const tag of event.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return map;
}

function dateWithin(date: Date, days: number, end: Date) {
  return date >= new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
}

function scoreConfidence(primary: number, total: number) {
  if (total === 0) return 0;
  const ratio = primary / total;
  return Math.min(1, Math.max(0.2, ratio));
}

function collectContextValues(events: EventRecord[]) {
  const map = new Map<string, Map<string, Set<string>>>();
  for (const event of events) {
    if (!event.context) continue;
    for (const [key, value] of Object.entries(event.context)) {
      if (!value) continue;
      const keyMap = map.get(key) ?? new Map<string, Set<string>>();
      const valueSet = keyMap.get(value) ?? new Set<string>();
      valueSet.add(event.id);
      keyMap.set(value, valueSet);
      map.set(key, keyMap);
    }
  }
  return map;
}

export function computeSignals(events: EventRecord[], windowDays: number) {
  const now = new Date();
  const recentDays = Math.min(7, Math.max(3, Math.floor(windowDays / 4)));
  const previousDays = recentDays * 3;

  const recentEvents = events.filter((e) =>
    dateWithin(new Date(e.happenedAt), recentDays, now)
  );
  const previousEvents = events.filter((e) => {
    const date = new Date(e.happenedAt);
    const start = new Date(now.getTime() - (recentDays + previousDays) * 86400000);
    const end = new Date(now.getTime() - recentDays * 86400000);
    return date >= start && date < end;
  });

  const recentCounts = countTags(recentEvents);
  const previousCounts = countTags(previousEvents);
  const totalCounts = countTags(events);

  const signals: Signal[] = [];

  const frequent = [...totalCounts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [tag, count] of frequent) {
    signals.push({
      signalType: "frequent",
      headline: `${tag} shows up often in your recent activity`,
      evidence: `${count} events in the last ${windowDays} days.`,
      confidence: scoreConfidence(count, events.length),
      supportingTags: [tag]
    });
  }

  for (const [tag, recentCount] of recentCounts.entries()) {
    const previousCount = previousCounts.get(tag) ?? 0;
    const previousAvg = previousCount / 3;
    if (recentCount >= 3 && recentCount >= previousAvg * 1.5) {
      signals.push({
        signalType: "rising",
        headline: `${tag} is rising in the last ${recentDays} days`,
        evidence: `${recentCount} recent vs ${previousCount} in the prior ${previousDays} days.`,
        confidence: scoreConfidence(recentCount, recentCount + previousCount),
        supportingTags: [tag]
      });
    }
  }

  const coMap = new Map<string, { pair: [string, string]; count: number }>();
  for (const event of events) {
    const tags = [...new Set(event.tags)].sort();
    for (let i = 0; i < tags.length; i += 1) {
      for (let j = i + 1; j < tags.length; j += 1) {
        const key = `${tags[i]}__${tags[j]}`;
        const entry = coMap.get(key) ?? { pair: [tags[i], tags[j]], count: 0 };
        entry.count += 1;
        coMap.set(key, entry);
      }
    }
  }

  const totalEvents = events.length || 1;
  const coSignals = [...coMap.values()]
    .map((entry) => {
      const [a, b] = entry.pair;
      const expected = ((totalCounts.get(a) ?? 0) * (totalCounts.get(b) ?? 0)) / totalEvents;
      const lift = expected > 0 ? entry.count / expected : 0;
      return { ...entry, lift };
    })
    .filter((entry) => entry.count >= 3 && entry.lift >= 1.4)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 5);

  for (const entry of coSignals) {
    const [a, b] = entry.pair;
    signals.push({
      signalType: "co-occurrence",
      headline: `${a} and ${b} appear together more than expected`,
      evidence: `${entry.count} co-occurrences with lift ${entry.lift.toFixed(2)}.`,
      confidence: scoreConfidence(entry.count, totalEvents),
      supportingTags: [a, b]
    });
  }

  const timeBuckets = new Map<string, { hourCounts: number[]; dayCounts: number[]; total: number }>();
  for (const event of events) {
    const date = new Date(event.happenedAt);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();
    for (const tag of event.tags) {
      const entry = timeBuckets.get(tag) ?? {
        hourCounts: Array(24).fill(0),
        dayCounts: Array(7).fill(0),
        total: 0
      };
      entry.hourCounts[hour] += 1;
      entry.dayCounts[day] += 1;
      entry.total += 1;
      timeBuckets.set(tag, entry);
    }
  }

  for (const [tag, entry] of timeBuckets.entries()) {
    if (entry.total < 4) continue;
    const maxHour = Math.max(...entry.hourCounts);
    const hourIndex = entry.hourCounts.indexOf(maxHour);
    if (maxHour / entry.total >= 0.45) {
      signals.push({
        signalType: "time-cluster",
        headline: `${tag} shows up mostly in the ${hourLabel(hourIndex)}`,
        evidence: `${maxHour} of ${entry.total} events fall into this time window.`,
        confidence: scoreConfidence(maxHour, entry.total),
        supportingTags: [tag]
      });
    }

    const maxDay = Math.max(...entry.dayCounts);
    const dayIndex = entry.dayCounts.indexOf(maxDay);
    if (maxDay / entry.total >= 0.4) {
      signals.push({
        signalType: "time-cluster",
        headline: `${tag} clusters on ${dayNameFromIndex(dayIndex)}s`,
        evidence: `${maxDay} of ${entry.total} events land on this day.`,
        confidence: scoreConfidence(maxDay, entry.total),
        supportingTags: [tag]
      });
    }
  }

  const contextMap = collectContextValues(events);
  for (const [tag, entry] of timeBuckets.entries()) {
    if (entry.total < 4) continue;
    for (const [contextKey, valueMap] of contextMap.entries()) {
      for (const [contextValue, eventIds] of valueMap.entries()) {
        const overlap = events.filter((event) => event.tags.includes(tag) && eventIds.has(event.id));
        if (overlap.length >= 3 && overlap.length / entry.total >= 0.45) {
          signals.push({
            signalType: "context-correlation",
            headline: `${tag} often appears when ${contextKey} is ${contextValue}`,
            evidence: `${overlap.length} of ${entry.total} ${tag} events include this context.`,
            confidence: scoreConfidence(overlap.length, entry.total),
            supportingTags: [tag],
            supportingEventIds: overlap.slice(0, 6).map((event) => event.id)
          });
        }
      }
    }
  }

  return signals;
}
