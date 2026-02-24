const { withClient, parseBody, isValidSlug } = require("./_db");

const VALID_SLUGS = new Set([
  "threshold",
  "slow-breath",
  "pocket-map",
  "first-turn",
  "soft-edges",
  "still-point",
  "quiet-tool",
  "window-light",
  "bridge",
  "small-kindness",
  "soundings",
  "quiet-arch",
  "stone-seat",
  "wide-sky",
  "wayfinding-link",
  "keeper-of-keys",
  "steadier-steps",
  "small-library",
  "clear-cut",
  "river-bend",
  "light-pack",
  "open-loop",
  "night-walk",
  "signal-fire",
  "the-quiet-end"
]);

exports.handler = async (event) => {
  const method = event.httpMethod || "GET";
  const userKey = event.queryStringParameters?.userKey || parseBody(event).userKey;
  if(!userKey){
    return { statusCode: 400, body: JSON.stringify({ error: "userKey required" }) };
  }

  if(method === "GET"){
    return withClient(async (client) => {
      const res = await client.query(
        "SELECT last_waypoint_slug, last_scroll_y, updated_at FROM progress WHERE user_key = $1",
        [userKey]
      );
      return { statusCode: 200, body: JSON.stringify({ progress: res.rows[0] || null }) };
    });
  }

  if(method === "POST"){
    const body = parseBody(event);
    const slug = body.last_waypoint_slug;
    const scrollY = Number(body.last_scroll_y || 0);
    if(slug && (!isValidSlug(slug) || !VALID_SLUGS.has(slug))){
      return { statusCode: 400, body: JSON.stringify({ error: "invalid slug" }) };
    }
    return withClient(async (client) => {
      await client.query(
        `INSERT INTO progress (user_key, last_waypoint_slug, last_scroll_y, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (user_key)
         DO UPDATE SET last_waypoint_slug = $2, last_scroll_y = $3, updated_at = now()`,
        [userKey, slug || null, scrollY]
      );
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    });
  }

  return { statusCode: 405, body: JSON.stringify({ error: "method not allowed" }) };
};
