import fs from "fs";
import path from "path";

const root = process.cwd();
const waypointsDir = path.join(root, "src", "content", "waypoints");

const files = fs
  .readdirSync(waypointsDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => path.join(waypointsDir, f));

const marker = "## Extended Walk";

const pick = (arr, n) => arr[n % arr.length];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
};

const parseFrontmatter = (text) => {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return { frontmatter: "", body: text, data: {} };
  const frontmatter = fmMatch[0];
  const body = text.slice(frontmatter.length);
  const data = {};
  fmMatch[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    data[key] = val.replace(/^"|"$/g, "");
  });
  return { frontmatter, body, data };
};

const buildExpansion = (meta) => {
  const h = hash(meta.slug || meta.title || "");
  const mood = meta.mood || "calm";
  const type = meta.type || "prompt";
  const title = meta.title || "Wayfinder";
  const rhythm = pick(
    [
      "slow and steady",
      "light and curious",
      "patient and grounded",
      "soft and deliberate",
      "open and attentive",
    ],
    h
  );
  const terrain = pick(
    [
      "a threshold, a curb, and a window",
      "a lane, a stair, and a pocket of sky",
      "a doorway, a corner, and a quiet wall",
      "a bench, a shadow, and a small gap between sounds",
      "a gate, a step, and a breath of wind",
    ],
    h + 3
  );
  const verb = pick(
    ["notice", "name", "trace", "listen to", "map"],
    h + 7
  );
  const anchor = pick(
    [
      "your feet and the edge of your breath",
      "the line of your shoulders and the air around you",
      "the pace of your steps and the light in front of you",
      "the way your hands rest and the softest nearby sound",
      "the weight of your gaze and the ground beneath it",
    ],
    h + 11
  );
  const lens = pick(
    ["distance", "texture", "sound", "light", "temperature"],
    h + 19
  );
  const theme = pick(
    [
      "What is beginning, and what is ending?",
      "Where does effort dissolve into ease?",
      "Which choice makes the next choice simpler?",
      "What can be done gently, without rushing?",
      "What is the smallest action that changes the day?",
    ],
    h + 23
  );

  return `
${marker}

This waypoint is a ${type} with a ${mood} tone. Let it set a ${rhythm} pace: the goal is not speed, but steadiness. Begin by standing where you can see ${terrain}. ${verb} the smallest details first, then widen your view. Anchor your attention on ${anchor}. Let that anchor be the thread you return to when your mind wanders.

Walk slowly for three minutes without deciding where you will end up. Keep the pace mild enough that your breathing can stay even. Count the first ten steps; then stop counting and listen for ${lens}. If you notice urgency, soften your shoulders and shorten your stride. Let the route make itself as you move.

Pause near a boundary: the line where a wall meets light, where sidewalk meets street, or where a room turns into a corridor. At that boundary, take a silent inventory: what is within reach, what is just beyond reach, and what is behind you that you will not carry forward. Say the inventory once, in your head, using simple words.

Now choose a small motion that can be repeated without strain. It could be the pace of your feet, the cadence of your breath, or the way you turn your head at each corner. Repeat it for a dozen breaths. This repetition is the core of Wayfinder: a quiet ritual that turns movement into meaning.

If you meet a distraction—noise, traffic, messages—treat it as a marker rather than a mistake. Notice how the distraction changes your pace. Adjust back to the anchor you chose, then continue. The walk is not about perfection; it is about returning, again and again, to a steady path.

Hold ${theme} as a background question. You do not need an answer. Let the question color the way you observe your surroundings. If an answer arrives, keep it brief, as if you are placing a small stone in your pocket.

When you are ready, pick a destination with a clear boundary: a doorway, a step, or a line of shadow. Approach it with the same pace you used at the start. Cross the boundary intentionally. You have completed the waypoint when you can name one thing that felt different after the crossing.

## Field Notes
- Start: one breath, one anchor, one pace.
- Middle: notice ${lens} without naming too many details.
- End: name a single shift and let it stand.

## Exercises
1. Walk for 2 minutes. Stop. Walk for 2 minutes. Compare how the second walk feels.
2. On your next ten steps, move your attention from your feet to your horizon and back again.
3. Choose one surface—stone, metal, wood—and look for it three times along your path.
4. If you can, repeat this waypoint at a different time of day and observe what changes.

## Reflection Questions
- What was easiest to hold steady: pace, breath, or attention?
- What boundary did you cross that felt meaningful?
- If you repeated this tomorrow, what would you keep and what would you change?

## Variations
- Short form: do it all within 60 seconds at a doorway.
- Quiet form: remove the internal narration; just move and notice.
- Shared form: walk side by side and agree on the same pace without speaking.

## Closing
End where you began, or end where the path feels complete. Either is valid. The real marker is the moment you feel less hurried than before. Carry that moment forward as a small compass, not a rule.
`.trim();
};

let updated = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (raw.includes(marker)) continue;
  const { frontmatter, body, data } = parseFrontmatter(raw);
  const slug = data.slug || data.title || path.basename(file, ".md");
  const expansion = buildExpansion({ ...data, slug });
  const next = `${frontmatter}${body.trim()}\n\n${expansion}\n`;
  fs.writeFileSync(file, next, "utf8");
  updated += 1;
}

console.log(`Expanded ${updated} waypoint files.`);
