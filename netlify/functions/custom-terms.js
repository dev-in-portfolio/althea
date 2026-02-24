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

const validCategories = new Set(["BOH", "FOH", "MANAGEMENT", "INVENTORY", "SERVICE", "GENERAL"]);

const validatePayload = (payload) => {
  if (!payload) return "payload required";
  if (!payload.term || !payload.slug) return "term and slug required";
  if (!validCategories.has(payload.category)) return "invalid category";
  if (!Array.isArray(payload.techEquivalent)) return "techEquivalent array required";
  if (!payload.definitionRestaurant || !payload.definitionTech) return "definitions required";
  if (!Array.isArray(payload.examplesRestaurant) || !Array.isArray(payload.examplesTech)) return "examples arrays required";
  if (!Array.isArray(payload.tags)) return "tags array required";
  if (!Array.isArray(payload.related)) return "related array required";
  return null;
};

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
  if (!client) return json(200, { terms: [] });

  try {
    if (event.httpMethod === "GET") {
      const userKey = event.queryStringParameters?.userKey;
      if (!userKey) return json(400, { error: "userKey required" });
      const { rows } = await client.query(
        "select id, payload, created_at from custom_terms where user_key=$1 order by created_at desc",
        [userKey]
      );
      return json(200, { terms: rows });
    }

    const payload = JSON.parse(event.body || "{}");
    const { userKey, term_id, term } = payload;
    if (!userKey) return json(400, { error: "userKey required" });

    if (event.httpMethod === "POST") {
      const error = validatePayload(term);
      if (error) return json(400, { error });
      await client.query(
        "insert into custom_terms (user_key, payload) values ($1,$2)",
        [userKey, term]
      );
    } else if (event.httpMethod === "DELETE") {
      if (!term_id) return json(400, { error: "term_id required" });
      await client.query(
        "delete from custom_terms where user_key=$1 and id=$2",
        [userKey, term_id]
      );
    } else {
      return json(405, { error: "Method not allowed" });
    }

    const { rows } = await client.query(
      "select id, payload, created_at from custom_terms where user_key=$1 order by created_at desc",
      [userKey]
    );
    return json(200, { terms: rows });
  } catch (error) {
    return json(500, { error: "Server error" });
  } finally {
    await client.end();
  }
}
