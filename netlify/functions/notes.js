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
    return json(200, { notes: [] });
  }

  try{
    if(event.httpMethod === "GET"){
      const userKey = event.queryStringParameters?.userKey;
      const entry = event.queryStringParameters?.entry_slug;
      if(!userKey) return json(400, { error: "userKey required" });
      const params = [userKey];
      let sql = "SELECT id, entry_slug, note_text, updated_at FROM notes WHERE user_key = $1";
      if(entry){
        sql += " AND entry_slug = $2";
        params.push(entry);
      }
      sql += " ORDER BY updated_at DESC";
      const { rows } = await pool.query(sql, params);
      return json(200, { notes: rows });
    }

    const payload = JSON.parse(event.body || "{}");
    const { userKey, entry_slug, note_text, id } = payload;
    if(!userKey || !entry_slug) return json(400, { error: "userKey and entry_slug required" });

    if(event.httpMethod === "POST"){
      if(!note_text) return json(400, { error: "note_text required" });
      if(id){
        await pool.query(
          "UPDATE notes SET note_text = $1, updated_at = now() WHERE id = $2 AND user_key = $3",
          [note_text, id, userKey]
        );
      }else{
        await pool.query(
          "INSERT INTO notes (user_key, entry_slug, note_text) VALUES ($1,$2,$3)",
          [userKey, entry_slug, note_text]
        );
      }
    }else if(event.httpMethod === "DELETE"){
      if(!id) return json(400, { error: "id required" });
      await pool.query(
        "DELETE FROM notes WHERE id = $1 AND user_key = $2",
        [id, userKey]
      );
    }else{
      return json(405, { error: "Method not allowed" });
    }

    const { rows } = await pool.query(
      "SELECT id, entry_slug, note_text, updated_at FROM notes WHERE user_key = $1 ORDER BY updated_at DESC",
      [userKey]
    );
    return json(200, { notes: rows });
  }catch(error){
    return json(500, { error: "Server error" });
  }
}
