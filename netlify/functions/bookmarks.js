import { getPool } from "./_db.js";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  },
  body: JSON.stringify(body)
});

export async function handler(event){
  if(event.httpMethod === "OPTIONS"){
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    };
  }

  const pool = getPool();
  if(!pool){
    return json(200, { bookmarks: [] });
  }

  try{
    if(event.httpMethod === "GET"){
      const userKey = event.queryStringParameters?.userKey;
      if(!userKey) return json(400, { error: "userKey required" });
      const { rows } = await pool.query(
        "SELECT entry_slug FROM bookmarks WHERE user_key = $1 ORDER BY created_at DESC",
        [userKey]
      );
      return json(200, { bookmarks: rows.map((r) => r.entry_slug) });
    }

    const payload = JSON.parse(event.body || "{}");
    const { userKey, entry_slug } = payload;
    if(!userKey || !entry_slug) return json(400, { error: "userKey and entry_slug required" });

    if(event.httpMethod === "POST"){
      await pool.query(
        "INSERT INTO bookmarks (user_key, entry_slug) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [userKey, entry_slug]
      );
    }else if(event.httpMethod === "DELETE"){
      await pool.query(
        "DELETE FROM bookmarks WHERE user_key = $1 AND entry_slug = $2",
        [userKey, entry_slug]
      );
    }else{
      return json(405, { error: "Method not allowed" });
    }

    const { rows } = await pool.query(
      "SELECT entry_slug FROM bookmarks WHERE user_key = $1 ORDER BY created_at DESC",
      [userKey]
    );
    return json(200, { bookmarks: rows.map((r) => r.entry_slug) });
  }catch(error){
    return json(500, { error: "Server error" });
  }
}
