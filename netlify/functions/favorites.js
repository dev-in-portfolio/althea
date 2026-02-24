import { getClient } from "./_db.js";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  }

  const client = await getClient();
  if (!client) return json(200, { favorites: [] });

  try {
    if (event.httpMethod === "GET") {
      const userKey = event.queryStringParameters?.userKey;
      if (!userKey) return json(400, { error: "userKey required" });
      const { rows } = await client.query(
        "select term_slug from favorites where user_key=$1 order by created_at desc",
        [userKey]
      );
      return json(200, { favorites: rows.map((r) => r.term_slug) });
    }

    const payload = JSON.parse(event.body || "{}");
    const { userKey, term_slug } = payload;
    if (!userKey || !term_slug) return json(400, { error: "userKey and term_slug required" });

    if (event.httpMethod === "POST") {
      await client.query(
        "insert into favorites (user_key, term_slug) values ($1,$2) on conflict do nothing",
        [userKey, term_slug]
      );
    } else if (event.httpMethod === "DELETE") {
      await client.query(
        "delete from favorites where user_key=$1 and term_slug=$2",
        [userKey, term_slug]
      );
    } else {
      return json(405, { error: "Method not allowed" });
    }

    const { rows } = await client.query(
      "select term_slug from favorites where user_key=$1 order by created_at desc",
      [userKey]
    );
    return json(200, { favorites: rows.map((r) => r.term_slug) });
  } catch (error) {
    return json(500, { error: "Server error" });
  } finally {
    await client.end();
  }
}
