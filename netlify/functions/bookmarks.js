const { withClient, parseBody, isValidSlug } = require("./_db");

const MAX_BOOKMARKS = 500;
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
        "SELECT waypoint_slug FROM bookmarks WHERE user_key = $1 ORDER BY created_at DESC LIMIT $2",
        [userKey, MAX_BOOKMARKS]
      );
      return { statusCode: 200, body: JSON.stringify({ bookmarks: res.rows.map((r) => r.waypoint_slug) }) };
    });
  }

  if(method === "POST"){
    const body = parseBody(event);
    const slug = body.waypoint_slug;
    if(!isValidSlug(slug) || !VALID_SLUGS.has(slug)){
      return { statusCode: 400, body: JSON.stringify({ error: "invalid slug" }) };
    }
    return withClient(async (client) => {
      await client.query(
        "INSERT INTO bookmarks (user_key, waypoint_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userKey, slug]
      );
      const res = await client.query(
        "SELECT waypoint_slug FROM bookmarks WHERE user_key = $1 ORDER BY created_at DESC LIMIT $2",
        [userKey, MAX_BOOKMARKS]
      );
      return { statusCode: 200, body: JSON.stringify({ bookmarks: res.rows.map((r) => r.waypoint_slug) }) };
    });
  }

  if(method === "DELETE"){
    const body = parseBody(event);
    const slug = body.waypoint_slug;
    if(!isValidSlug(slug) || !VALID_SLUGS.has(slug)){
      return { statusCode: 400, body: JSON.stringify({ error: "invalid slug" }) };
    }
    return withClient(async (client) => {
      await client.query(
        "DELETE FROM bookmarks WHERE user_key = $1 AND waypoint_slug = $2",
        [userKey, slug]
      );
      const res = await client.query(
        "SELECT waypoint_slug FROM bookmarks WHERE user_key = $1 ORDER BY created_at DESC LIMIT $2",
        [userKey, MAX_BOOKMARKS]
      );
      return { statusCode: 200, body: JSON.stringify({ bookmarks: res.rows.map((r) => r.waypoint_slug) }) };
    });
  }

  return { statusCode: 405, body: JSON.stringify({ error: "method not allowed" }) };
};
