import json
import os
import re
from contextlib import contextmanager
from typing import Any, Dict, List, Tuple

import psycopg
from psycopg import sql


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


@contextmanager
def get_conn():
    database_url = get_database_url()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")
    with psycopg.connect(database_url, autocommit=True) as conn:
        yield conn


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9\\s-]", "", value).strip().lower()
    value = re.sub(r"[\\s_-]+", "-", value)
    return value[:64] or "untitled"


def validate_exhibit(summary: str, body: str, tags: List[str], images: List[str]) -> None:
    if not summary.strip():
        raise ValueError("Summary is required.")
    if not body.strip():
        raise ValueError("Body is required.")
    if not tags or not any(t.strip() for t in tags):
        raise ValueError("At least one tag is required.")
    if not isinstance(images, list):
        raise ValueError("Images must be a JSON array.")


def list_wings() -> List[Tuple]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("select id, name, slug from wings order by name")
            return cur.fetchall()


def list_halls(wing_id: str) -> List[Tuple]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, name, slug from halls where wing_id = %s order by name",
                [wing_id],
            )
            return cur.fetchall()


def list_exhibits(hall_id: str) -> List[Tuple]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, title, slug, summary, tags, body, images from exhibits where hall_id = %s order by created_at desc",
                [hall_id],
            )
            return cur.fetchall()


def create_wing(name: str, slug: str | None = None) -> None:
    slug = slug or slugify(name)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "insert into wings (name, slug) values (%s, %s) on conflict (name) do nothing",
                [name, slug],
            )


def create_hall(wing_id: str, name: str, slug: str | None = None) -> None:
    slug = slug or slugify(name)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "insert into halls (wing_id, name, slug) values (%s, %s, %s) on conflict (wing_id, name) do nothing",
                [wing_id, name, slug],
            )


def upsert_exhibit(
    hall_id: str,
    title: str,
    slug: str,
    summary: str,
    tags: List[str],
    body: str,
    images: List[str],
) -> None:
    validate_exhibit(summary, body, tags, images)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into exhibits (hall_id, title, slug, summary, tags, body, images)
                values (%s, %s, %s, %s, %s, %s, %s)
                on conflict (hall_id, slug)
                do update set title = excluded.title,
                              summary = excluded.summary,
                              tags = excluded.tags,
                              body = excluded.body,
                              images = excluded.images
                """,
                [hall_id, title, slug, summary, tags, body, json.dumps(images)],
            )


def run_import_batch(rows: List[Dict[str, Any]], strict: bool) -> List[str]:
    errors = []
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("begin")
            try:
                for idx, row in enumerate(rows, start=1):
                    try:
                        validate_exhibit(row["summary"], row["body"], row["tags"], row["images"])
                        cur.execute(
                            """
                            insert into exhibits (hall_id, title, slug, summary, tags, body, images)
                            values (%s, %s, %s, %s, %s, %s, %s)
                            on conflict (hall_id, slug)
                            do update set title = excluded.title,
                                          summary = excluded.summary,
                                          tags = excluded.tags,
                                          body = excluded.body,
                                          images = excluded.images
                            """,
                            [
                                row["hall_id"],
                                row["title"],
                                row["slug"],
                                row["summary"],
                                row["tags"],
                                row["body"],
                                json.dumps(row["images"]),
                            ],
                        )
                    except Exception as exc:  # noqa: BLE001
                        msg = f"Row {idx}: {exc}"
                        if strict:
                            raise ValueError(msg)
                        errors.append(msg)
                cur.execute("commit")
            except Exception:  # noqa: BLE001
                cur.execute("rollback")
                raise
    return errors


def resolve_wing(cur, name: str) -> str:
    cur.execute("select id from wings where name = %s", [name])
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute("insert into wings (name, slug) values (%s, %s) returning id", [name, slugify(name)])
    return cur.fetchone()[0]


def resolve_hall(cur, wing_id: str, name: str) -> str:
    cur.execute("select id from halls where wing_id = %s and name = %s", [wing_id, name])
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "insert into halls (wing_id, name, slug) values (%s, %s, %s) returning id",
        [wing_id, name, slugify(name)],
    )
    return cur.fetchone()[0]


def bulk_resolve(rows: List[Dict[str, Any]]) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            for row in rows:
                wing_id = resolve_wing(cur, row["wing"])
                hall_id = resolve_hall(cur, wing_id, row["hall"])
                row["hall_id"] = hall_id
