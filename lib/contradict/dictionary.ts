export const ATOMS = {
  time: ["time", "schedule", "calendar", "hours", "late"],
  work: ["work", "job", "career", "project", "hustle"],
  rest: ["rest", "sleep", "recover", "downtime", "break"],
  freedom: ["freedom", "flexibility", "spontaneous", "unstructured"],
  commitment: ["commit", "commitment", "long-term", "lock-in", "obligation"],
  speed: ["speed", "fast", "quick", "velocity"],
  quality: ["quality", "craft", "precision", "excellence"],
  money: ["money", "budget", "spend", "save", "cost"],
  focus: ["focus", "deep work", "single-task"],
  variety: ["variety", "explore", "options", "experiments"],
  social: ["social", "friends", "people", "network"],
  solitude: ["solitude", "alone", "quiet", "privacy"],
  health: ["health", "fitness", "exercise"],
  comfort: ["comfort", "ease", "relax"],
  growth: ["growth", "learn", "progress"],
  stability: ["stability", "predictable", "routine"]
};

export const MUTUALS: Array<[string, string, string]> = [
  ["freedom", "commitment", "Freedom and commitment often pull against each other."],
  ["speed", "quality", "Speed and quality are usually in tension."],
  ["work", "rest", "Work intensity can crowd out rest."],
  ["focus", "variety", "Deep focus conflicts with constant variety."],
  ["social", "solitude", "Social time competes with solitude."],
  ["growth", "stability", "Rapid growth can disrupt stability."]
];

export const RESOURCE_WORDS = {
  time: ["hours", "schedule", "time", "calendar"],
  energy: ["energy", "effort", "push", "intensity"],
  money: ["money", "budget", "spend", "cost", "save"]
};

export const CONSTRAINTS = {
  must: ["must", "need to", "should", "have to", "require"],
  mustNot: ["must not", "can't", "cannot", "avoid", "never"]
};
