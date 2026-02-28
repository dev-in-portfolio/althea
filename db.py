import os
import re
from contextlib import contextmanager
from typing import Any, Dict, Iterable, List, Tuple

import psycopg
from psycopg import sql


READ_ONLY_DEFAULT = True


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "")


def is_read_only() -> bool:
    value = os.getenv("READ_ONLY", "true").lower()
    return value in ("1", "true", "yes", "on")


@contextmanager
def get_conn():
    database_url = get_database_url()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")
    with psycopg.connect(database_url, autocommit=True) as conn:
        yield conn


def ensure_select_only(query: str) -> None:
    if not is_read_only():
        return
    cleaned = re.sub(r"/\*.*?\*/", "", query, flags=re.S).strip()
    cleaned = re.sub(r"--.*?$", "", cleaned, flags=re.M).strip()
    if not cleaned:
        raise ValueError("Query is empty.")
    if not re.match(r"^(select|with)\b", cleaned, flags=re.I):
        raise ValueError("Read-only mode: only SELECT/CTE queries are allowed.")


def run_query(query: str, params: Iterable[Any] | None = None):
    ensure_select_only(query)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or [])
            columns = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            return columns, rows


def fetch_schema_list():
    return run_query(
        """
        select schema_name
        from information_schema.schemata
        where schema_name not in ('pg_catalog', 'information_schema')
        order by schema_name
        """
    )


def fetch_tables(schema: str):
    return run_query(
        """
        select tablename,
               coalesce(n_live_tup, 0)::int as approx_rows
        from pg_catalog.pg_tables t
        left join pg_stat_user_tables s on s.relname = t.tablename
        where schemaname = %s
        order by tablename
        """,
        [schema],
    )


def fetch_columns(schema: str, table: str):
    return run_query(
        """
        select column_name, data_type, is_nullable
        from information_schema.columns
        where table_schema = %s and table_name = %s
        order by ordinal_position
        """,
        [schema, table],
    )


def fetch_indexes(schema: str, table: str):
    return run_query(
        """
        select indexname, indexdef
        from pg_indexes
        where schemaname = %s and tablename = %s
        order by indexname
        """,
        [schema, table],
    )


def fetch_rows(schema: str, table: str, limit: int, offset: int):
    query = sql.SQL("select * from {}.{} limit %s offset %s").format(
        sql.Identifier(schema),
        sql.Identifier(table),
    )
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [limit, offset])
            columns = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            return columns, rows


def fetch_recent_rows(schema: str, table: str, limit: int):
    query = sql.SQL("select * from {}.{} order by created_at desc limit %s").format(
        sql.Identifier(schema),
        sql.Identifier(table),
    )
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [limit])
            columns = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            return columns, rows
