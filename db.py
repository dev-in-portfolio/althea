import os
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def _require_db() -> None:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")


def get_conn() -> psycopg.Connection:
    _require_db()
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def add_chunk(title: str, body: str, tags: List[str], source: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into chunks (title, body, tags, source)
            values (%s, %s, %s, %s)
            returning id, title, source, tags, body, created_at
            """,
            (title, body, tags, source),
        )
        return cur.fetchone()


def list_tags() -> List[str]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select distinct unnest(tags) as tag
            from chunks
            order by tag
            """
        )
        return [row["tag"] for row in cur.fetchall()]


def search_chunks(query: str, tags: List[str], limit: int) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        params = []
        tag_clause = ""
        if tags:
            tag_clause = "and tags @> %s"
            params.append(tags)

        if query:
            cur.execute(
                f"""
                select id, title, source, tags, body, created_at,
                       ts_rank(body_tsv, plainto_tsquery('english', %s)) as rank
                from chunks
                where body_tsv @@ plainto_tsquery('english', %s)
                {tag_clause}
                order by rank desc, created_at desc
                limit %s
                """,
                [query, query, *params, limit],
            )
            rows = list(cur.fetchall())
            if rows:
                return rows

            cur.execute(
                f"""
                select id, title, source, tags, body, created_at,
                       similarity(title, %s) as sim
                from chunks
                where title % %s
                {tag_clause}
                order by sim desc, created_at desc
                limit %s
                """,
                [query, query, *params, limit],
            )
            return list(cur.fetchall())

        cur.execute(
            f"""
            select id, title, source, tags, body, created_at
            from chunks
            where 1=1
            {tag_clause}
            order by created_at desc
            limit %s
            """,
            [*params, limit],
        )
        return list(cur.fetchall())


def get_chunk(chunk_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, title, source, tags, body, created_at
            from chunks
            where id = %s
            """,
            (chunk_id,),
        )
        return cur.fetchone()


def delete_chunk(chunk_id: str) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("delete from chunks where id = %s", (chunk_id,))


def export_chunks() -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, title, source, tags, body, created_at
            from chunks
            order by created_at desc
            """
        )
        return list(cur.fetchall())
