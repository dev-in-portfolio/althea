from typing import Any, Dict, List, Optional

import psycopg


def insert_run(database_url: str, user_key: str, items: List[Dict[str, Any]], rules: Dict[str, Any], result: Dict[str, Any]) -> str:
    query = (
        "insert into judge_runs (user_key, items, rules, result) values (%s, %s, %s, %s) returning id"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, items, rules, result))
            run_id = cur.fetchone()[0]
        conn.commit()
    return str(run_id)


def list_history(database_url: str, user_key: str, limit: int) -> List[Dict[str, Any]]:
    query = (
        "select id, items, created_at from judge_runs where user_key = %s order by created_at desc limit %s"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, limit))
            rows = cur.fetchall()

    items = []
    for row in rows:
        run_id, run_items, created_at = row
        items.append(
            {
                "id": str(run_id),
                "created_at": created_at.isoformat(),
                "item_count": len(run_items or []),
            }
        )
    return items


def fetch_run(database_url: str, user_key: str, run_id: str) -> Optional[Dict[str, Any]]:
    query = "select id, result, created_at from judge_runs where id = %s and user_key = %s"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (run_id, user_key))
            row = cur.fetchone()

    if not row:
        return None
    run_id, result, created_at = row
    return {"id": str(run_id), "result": result, "created_at": created_at.isoformat()}


def delete_run(database_url: str, user_key: str, run_id: str) -> bool:
    query = "delete from judge_runs where id = %s and user_key = %s"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (run_id, user_key))
            deleted = cur.rowcount > 0
        conn.commit()
    return deleted


def upsert_rulepack(database_url: str, user_key: str, name: str, rules: Dict[str, Any]) -> None:
    query = (
        "insert into rulepacks (user_key, name, rules) values (%s, %s, %s) "
        "on conflict (user_key, name) do update set rules = excluded.rules"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, name, rules))
        conn.commit()


def list_rulepacks(database_url: str, user_key: str) -> List[Dict[str, Any]]:
    query = "select name, created_at from rulepacks where user_key = %s order by created_at desc"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key,))
            rows = cur.fetchall()
    return [{"name": row[0], "created_at": row[1].isoformat()} for row in rows]


def fetch_rulepack(database_url: str, user_key: str, name: str) -> Optional[Dict[str, Any]]:
    query = "select name, rules, created_at from rulepacks where user_key = %s and name = %s"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, name))
            row = cur.fetchone()
    if not row:
        return None
    return {"name": row[0], "rules": row[1], "created_at": row[2].isoformat()}


def delete_rulepack(database_url: str, user_key: str, name: str) -> bool:
    query = "delete from rulepacks where user_key = %s and name = %s"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, name))
            deleted = cur.rowcount > 0
        conn.commit()
    return deleted
