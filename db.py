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


def list_projects() -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("select id, name, created_at from patch_projects order by created_at desc")
        return list(cur.fetchall())


def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "select id, name, created_at from patch_projects where id = %s",
            (project_id,),
        )
        return cur.fetchone()


def create_project(name: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into patch_projects (name)
            values (%s)
            on conflict (name)
            do update set name = excluded.name
            returning id, name, created_at
            """,
            (name,),
        )
        return cur.fetchone()


def list_files(project_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, path, updated_at
            from patch_files
            where project_id = %s
            order by path
            """,
            (project_id,),
        )
        return list(cur.fetchall())


def get_file(project_id: str, path: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, path, content, updated_at
            from patch_files
            where project_id = %s and path = %s
            """,
            (project_id, path),
        )
        return cur.fetchone()


def upsert_file(project_id: str, path: str, content: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into patch_files (project_id, path, content)
            values (%s, %s, %s)
            on conflict (project_id, path)
            do update set content = excluded.content, updated_at = now()
            returning id, path, content, updated_at
            """,
            (project_id, path, content),
        )
        return cur.fetchone()


def create_patch(project_id: str, file_path: str, find_text: str, replace_text: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into patches (project_id, file_path, find_text, replace_text)
            values (%s, %s, %s, %s)
            returning id, project_id, file_path, find_text, replace_text, status, created_at
            """,
            (project_id, file_path, find_text, replace_text),
        )
        return cur.fetchone()


def list_patches(project_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, file_path, status, created_at
            from patches
            where project_id = %s
            order by created_at desc
            """,
            (project_id,),
        )
        return list(cur.fetchall())


def project_stats(project_id: str) -> Dict[str, Any]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select
              (select count(*) from patch_files where project_id = %s) as file_count,
              (select count(*) from patches where project_id = %s) as patch_count,
              (select count(*) from patches where project_id = %s and status = 'draft') as draft_count,
              (select count(*) from patches where project_id = %s and status = 'approved') as approved_count,
              (select count(*) from patches where project_id = %s and status = 'applied') as applied_count
            """,
            (project_id, project_id, project_id, project_id, project_id),
        )
        return cur.fetchone()


def list_approved_patches(project_id: str) -> List[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, file_path, find_text, replace_text, status, created_at
            from patches
            where project_id = %s and status = 'approved'
            order by created_at desc
            """,
            (project_id,),
        )
        return list(cur.fetchall())


def get_patch(patch_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, project_id, file_path, find_text, replace_text, status, created_at
            from patches
            where id = %s
            """,
            (patch_id,),
        )
        return cur.fetchone()


def update_patch_status(patch_id: str, status: str) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "update patches set status = %s where id = %s",
            (status, patch_id),
        )


def update_file_content(project_id: str, path: str, content: str) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            update patch_files
            set content = %s, updated_at = now()
            where project_id = %s and path = %s
            """,
            (content, project_id, path),
        )
