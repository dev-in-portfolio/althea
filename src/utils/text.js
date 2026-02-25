function scoreToPercent(score) {
  return Math.round(score * 100);
}

function explainLeverage({ reachCount, avgStrength, nodeWeight }) {
  return `Reaches ${reachCount} downstream nodes with avg strength ${avgStrength.toFixed(2)} and weight ${nodeWeight}.`;
}

function explainRoot({ reachCount, outDegree }) {
  return `Low incoming causes with ${outDegree} direct effects and ${reachCount} total downstream.`;
}

function explainSink({ inDegree }) {
  return `Many upstream causes (${inDegree}) and little downstream impact.`;
}

function explainBottleneck({ pathThrough }) {
  return `Appears on ${pathThrough} root-to-effect paths in this chain.`;
}

module.exports = {
  scoreToPercent,
  explainLeverage,
  explainRoot,
  explainSink,
  explainBottleneck
};
