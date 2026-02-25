import { ATOMS, MUTUALS, RESOURCE_WORDS, CONSTRAINTS } from "./dictionary";

export type Statement = {
  id: string;
  text: string;
  weight: number;
  domain: string | null;
};

export type Conflict = {
  a: Statement;
  b: Statement;
  conflictType: string;
  reason: string;
  resolutionPrompt: string;
  severity: number;
};

function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
}

function containsPhrase(text: string, phrase: string) {
  return text.toLowerCase().includes(phrase);
}

function extractAtoms(text: string) {
  const atoms: string[] = [];
  const tokens = tokenize(text);
  for (const [atom, keywords] of Object.entries(ATOMS)) {
    if (keywords.some((keyword) => tokens.includes(keyword))) {
      atoms.push(atom);
    }
  }
  return atoms;
}

function hasConstraint(text: string, list: string[]) {
  return list.some((phrase) => containsPhrase(text, phrase));
}

function resourceIntensity(text: string, resource: string) {
  const tokens = tokenize(text);
  const keywords = RESOURCE_WORDS[resource as keyof typeof RESOURCE_WORDS] || [];
  return keywords.some((keyword) => tokens.includes(keyword));
}

export function detectConflicts(statements: Statement[]) {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < statements.length; i += 1) {
    for (let j = i + 1; j < statements.length; j += 1) {
      const a = statements[i];
      const b = statements[j];
      const atomsA = extractAtoms(a.text);
      const atomsB = extractAtoms(b.text);

      for (const [left, right, reason] of MUTUALS) {
        if (atomsA.includes(left) && atomsB.includes(right)) {
          conflicts.push({
            a,
            b,
            conflictType: "value-tension",
            reason,
            resolutionPrompt: `If ${left} and ${right} collide, which one gets priority in this season?`,
            severity: Math.min(5, Math.round((a.weight + b.weight) / 2))
          });
        }
        if (atomsA.includes(right) && atomsB.includes(left)) {
          conflicts.push({
            a,
            b,
            conflictType: "value-tension",
            reason,
            resolutionPrompt: `If ${left} and ${right} collide, which one gets priority in this season?`,
            severity: Math.min(5, Math.round((a.weight + b.weight) / 2))
          });
        }
      }

      const resources = ["time", "energy", "money"] as const;
      for (const resource of resources) {
        const aNeeds = resourceIntensity(a.text, resource);
        const bNeeds = resourceIntensity(b.text, resource);
        if (aNeeds && bNeeds && a.weight >= 4 && b.weight >= 4) {
          conflicts.push({
            a,
            b,
            conflictType: "resource-conflict",
            reason: `Both statements demand ${resource}.`,
            resolutionPrompt: `What cap or tradeoff could free ${resource} for both?`,
            severity: 5
          });
        }
      }

      const aMust = hasConstraint(a.text, CONSTRAINTS.must);
      const bMust = hasConstraint(b.text, CONSTRAINTS.must);
      const aMustNot = hasConstraint(a.text, CONSTRAINTS.mustNot);
      const bMustNot = hasConstraint(b.text, CONSTRAINTS.mustNot);

      if ((aMust && bMustNot) || (bMust && aMustNot)) {
        conflicts.push({
          a,
          b,
          conflictType: "constraint-conflict",
          reason: "One statement implies a must while the other implies a must-not.",
          resolutionPrompt: "Which constraint can be softened or rephrased to reduce the clash?",
          severity: Math.min(5, Math.max(a.weight, b.weight))
        });
      }
    }
  }

  return conflicts;
}
