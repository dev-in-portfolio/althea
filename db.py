import os
from typing import Any, Dict, List, Optional, Tuple

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def _require_db() -> None:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")


def get_conn() -> psycopg.Connection:
    _require_db()
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def list_tables() -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select n.nspname as schema,
                   c.relname as table,
                   coalesce(s.n_live_tup, 0) as estimated_rows
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            left join pg_stat_user_tables s on s.relid = c.oid
            where c.relkind = 'r'
              and n.nspname not in ('pg_catalog', 'information_schema')
            order by n.nspname, c.relname
            """
        )
        return list(cur.fetchall())


def list_columns(schema: str, table: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select column_name,
                   data_type,
                   is_nullable,
                   column_default
            from information_schema.columns
            where table_schema = %s and table_name = %s
            order by ordinal_position
            """,
            (schema, table),
        )
        return list(cur.fetchall())


def list_indexes(schema: str, table: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select indexname, indexdef
            from pg_indexes
            where schemaname = %s and tablename = %s
            order by indexname
            """,
            (schema, table),
        )
        return list(cur.fetchall())


def list_index_columns(schema: str, table: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select i.indexrelid,
                   ic.relname as index_name,
                   i.indisunique,
                   i.indisprimary,
                   array_agg(a.attname order by x.ordinality) as columns
            from pg_index i
            join pg_class tc on tc.oid = i.indrelid
            join pg_namespace ns on ns.oid = tc.relnamespace
            join pg_class ic on ic.oid = i.indexrelid
            join unnest(i.indkey) with ordinality as x(attnum, ordinality) on true
            join pg_attribute a on a.attrelid = i.indrelid and a.attnum = x.attnum
            where ns.nspname = %s and tc.relname = %s
            group by i.indexrelid, ic.relname, i.indisunique, i.indisprimary
            order by ic.relname
            """,
            (schema, table),
        )
        return list(cur.fetchall())


def list_constraints(schema: str, table: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select con.conname,
                   con.contype,
                   pg_get_constraintdef(con.oid) as definition
            from pg_constraint con
            join pg_class rel on rel.oid = con.conrelid
            join pg_namespace ns on ns.oid = rel.relnamespace
            where ns.nspname = %s and rel.relname = %s
            order by con.conname
            """,
            (schema, table),
        )
        return list(cur.fetchall())


def list_foreign_keys() -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select ns.nspname as schema,
                   rel.relname as table,
                   ns2.nspname as ref_schema,
                   rel2.relname as ref_table,
                   con.conname,
                   array_agg(att.attname order by u.ordinality) as columns,
                   array_agg(att2.attname order by u.ordinality) as ref_columns
            from pg_constraint con
            join pg_class rel on rel.oid = con.conrelid
            join pg_namespace ns on ns.oid = rel.relnamespace
            join pg_class rel2 on rel2.oid = con.confrelid
            join pg_namespace ns2 on ns2.oid = rel2.relnamespace
            join unnest(con.conkey) with ordinality as u(attnum, ordinality) on true
            join pg_attribute att on att.attrelid = con.conrelid and att.attnum = u.attnum
            join unnest(con.confkey) with ordinality as u2(attnum, ordinality) on u.ordinality = u2.ordinality
            join pg_attribute att2 on att2.attrelid = con.confrelid and att2.attnum = u2.attnum
            where con.contype = 'f'
              and ns.nspname not in ('pg_catalog', 'information_schema')
            group by ns.nspname, rel.relname, ns2.nspname, rel2.relname, con.conname
            order by ns.nspname, rel.relname, con.conname
            """
        )
        return list(cur.fetchall())


def list_extensions() -> List[str]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select extname from pg_extension order by extname")
        return [row["extname"] for row in cur.fetchall()]


def list_migration_sets() -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select id, name, created_at from migration_sets order by created_at desc")
        return list(cur.fetchall())


def create_migration_set(name: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into migration_sets (name)
            values (%s)
            on conflict (name)
            do update set name = excluded.name
            returning id, name, created_at
            """,
            (name,),
        )
        return cur.fetchone()


def list_migrations(set_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, filename, sql_text, created_at
            from migrations
            where set_id = %s
            order by filename
            """,
            (set_id,),
        )
        return list(cur.fetchall())


def upsert_migration(set_id: str, filename: str, sql_text: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into migrations (set_id, filename, sql_text)
            values (%s, %s, %s)
            on conflict (set_id, filename)
            do update set sql_text = excluded.sql_text, created_at = now()
            returning id, filename, sql_text, created_at
            """,
            (set_id, filename, sql_text),
        )
        return cur.fetchone()


def get_table_identifier(schema: str, table: str) -> str:
    return f"{schema}.{table}"


def list_fk_dependencies() -> List[Tuple[str, str]]:
    fks = list_foreign_keys()
    deps = []
    for fk in fks:
        deps.append((get_table_identifier(fk["schema"], fk["table"]), get_table_identifier(fk["ref_schema"], fk["ref_table"])))
    return deps
