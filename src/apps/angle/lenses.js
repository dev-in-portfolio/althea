const lenses = [
  {
    name: "Systems",
    templates: [
      "From a systems view, {keyword} is failing at the {layer} layer. The pressure point is {keyword2}.",
      "If this is a systems failure, the weakest link is {keyword}. The upstream cause may be {keyword2}.",
      "Think of this as a system loop: {keyword} feeds {keyword2}, which then returns to the loop."
    ]
  },
  {
    name: "Incentives",
    templates: [
      "Incentives suggest {keyword} is rewarded even if {keyword2} suffers.",
      "If people are incentivized toward {keyword}, {keyword2} will keep slipping.",
      "The hidden payoff seems to be {keyword}; that makes {keyword2} hard to sustain."
    ]
  },
  {
    name: "Communication",
    templates: [
      "This might be a communication gap: {keyword} wasn't explicit, so {keyword2} drifted.",
      "If the signal around {keyword} is weak, {keyword2} will fill the silence.",
      "Try reframing the message: make {keyword} concrete before tackling {keyword2}."
    ]
  },
  {
    name: "Environment",
    templates: [
      "The environment may be amplifying {keyword}; adjust the context before blaming {keyword2}.",
      "If the environment rewards {keyword}, {keyword2} becomes the casualty.",
      "A small environmental shift around {keyword2} could ease pressure on {keyword}."
    ]
  },
  {
    name: "Expectations",
    templates: [
      "Expectations around {keyword} may be unrealistic, which turns {keyword2} into the symptom.",
      "If the expectation is {keyword}, the reality of {keyword2} will feel like failure.",
      "Resetting expectations for {keyword} could soften the hit to {keyword2}."
    ]
  },
  {
    name: "Constraints",
    templates: [
      "Constraint check: {keyword} may be boxed in by {keyword2}.",
      "If {keyword2} is a hard constraint, {keyword} will keep collapsing.",
      "Look for the tightest constraint around {keyword}; it likely sits in {keyword2}."
    ]
  },
  {
    name: "Time Horizon",
    templates: [
      "Short-term {keyword} may be trading off long-term {keyword2}.",
      "If the horizon is too short, {keyword} will crowd out {keyword2}.",
      "Extend the horizon: what happens to {keyword2} if {keyword} is slowed?"
    ]
  },
  {
    name: "Counterfactual",
    templates: [
      "If the opposite of {keyword} were true, how would {keyword2} change?",
      "Imagine {keyword} doesn't exist; what happens to {keyword2}?",
      "Flip the assumption: if {keyword2} were the driver, how would {keyword} look?"
    ]
  }
];

module.exports = { lenses };
