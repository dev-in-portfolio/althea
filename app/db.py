from typing import Any, Dict, List, Optional

import psycopg


def get_latest_version(database_url: str, user_key: str, name: str) -> Optional[int]:
    query = "select max(version) from schemas where user_key = %s and name = %s"
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, name))
            row = cur.fetchone()
    return row[0] if row and row[0] is not None else None


def insert_schema(
    database_url: str,
    user_key: str,
    name: str,
    version: int,
    schema: Dict[str, Any],
    notes: Optional[str],
) -> str:
    query = (
        "insert into schemas (user_key, name, version, schema, notes) "
        "values (%s, %s, %s, %s, %s) returning id"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, name, version, schema, notes))
            schema_id = cur.fetchone()[0]
        conn.commit()
    return str(schema_id)


def fetch_schema(database_url: str, user_key: str, name: str, version: Optional[int]) -> Optional[Dict[str, Any]]:
    if version is None:
        query = (
            "select name, version, schema, notes from schemas "
            "where user_key = %s and name = %s order by version desc limit 1"
        )
        params = (user_key, name)
    else:
        query = (
            "select name, version, schema, notes from schemas "
            "where user_key = %s and name = %s and version = %s"
        )
        params = (user_key, name, version)

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            row = cur.fetchone()

    if not row:
        return None

    schema_name, schema_version, schema_json, notes = row
    return {
        "name": schema_name,
        "version": schema_version,
        "schema": schema_json,
        "notes": notes,
    }


def list_schemas(database_url: str, user_key: str, name: Optional[str]) -> List[Dict[str, Any]]:
    if name:
        query = (
            "select id, name, version, created_at from schemas "
            "where user_key = %s and name = %s order by version desc"
        )
        params = (user_key, name)
    else:
        query = (
            "select id, name, version, created_at from schemas "
            "where user_key = %s order by created_at desc"
        )
        params = (user_key,)

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    return [
        {
            "id": str(row[0]),
            "name": row[1],
            "version": row[2],
            "created_at": row[3].isoformat(),
        }
        for row in rows
    ]


def delete_schema(database_url: str, user_key: str, name: str, version: Optional[int]) -> bool:
    if version is None:
        query = (
            "delete from schemas where id = ("
            "select id from schemas where user_key = %s and name = %s order by version desc limit 1"
            ")"
        )
        params = (user_key, name)
    else:
        query = "delete from schemas where user_key = %s and name = %s and version = %s"
        params = (user_key, name, version)

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            deleted = cur.rowcount > 0
        conn.commit()
    return deleted


def insert_validation_run(
    database_url: str,
    user_key: str,
    schema_name: str,
    schema_version: int,
    payload: Dict[str, Any],
    result: Dict[str, Any],
) -> str:
    query = (
        "insert into validation_runs (user_key, schema_name, schema_version, payload, result) "
        "values (%s, %s, %s, %s, %s) returning id"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, schema_name, schema_version, payload, result))
            run_id = cur.fetchone()[0]
        conn.commit()
    return str(run_id)


def list_history(database_url: str, user_key: str, limit: int) -> List[Dict[str, Any]]:
    query = (
        "select id, schema_name, schema_version, result, created_at "
        "from validation_runs where user_key = %s order by created_at desc limit %s"
    )
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_key, limit))
            rows = cur.fetchall()

    items = []
    for row in rows:
        run_id, schema_name, schema_version, result, created_at = row
        errors = result.get("errors") or []
        warnings = result.get("warnings") or []
        items.append(
            {
                "id": str(run_id),
                "schema_name": schema_name,
                "schema_version": schema_version,
                "created_at": created_at.isoformat(),
                "ok": bool(result.get("ok")),
                "error_count": len(errors),
                "warning_count": len(warnings),
            }
        )
    return items
