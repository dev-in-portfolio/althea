import os
from contextlib import contextmanager
from typing import Any, Dict, List, Tuple

import psycopg


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


@contextmanager
def get_conn():
    database_url = get_database_url()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")
    with psycopg.connect(database_url, autocommit=True) as conn:
        yield conn


def list_datasets() -> List[Tuple]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("select id, name, created_at from datasets order by created_at desc")
            return cur.fetchall()


def create_dataset(name: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("insert into datasets (name) values (%s)", [name])


def insert_stops(dataset_id: str, rows: List[Dict[str, Any]]) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            for row in rows:
                cur.execute(
                    """
                    insert into stops (dataset_id, name, address, city, state, zip, lat, lon, notes, source)
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    [
                        dataset_id,
                        row.get("name", ""),
                        row.get("address", ""),
                        row.get("city", ""),
                        row.get("state", ""),
                        row.get("zip", ""),
                        row.get("lat"),
                        row.get("lon"),
                        row.get("notes", ""),
                        row.get("source", ""),
                    ],
                )


def list_stops(dataset_id: str) -> List[Tuple]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, name, address, city, state, zip, lat, lon, notes, source from stops where dataset_id = %s",
                [dataset_id],
            )
            return cur.fetchall()


def update_stop(stop_id: str, fields: Dict[str, Any]) -> None:
    if not fields:
        return
    cols = []
    values = []
    for key, value in fields.items():
        cols.append(f"{key} = %s")
        values.append(value)
    values.append(stop_id)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"update stops set {', '.join(cols)} where id = %s",
                values,
            )
