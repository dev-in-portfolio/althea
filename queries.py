from typing import Dict, List


QUERY_LIBRARY: Dict[str, dict] = {
    "Largest tables by size": {
        "sql": """
            select relname as table_name,
                   pg_size_pretty(pg_total_relation_size(relid)) as total_size
            from pg_catalog.pg_statio_user_tables
            order by pg_total_relation_size(relid) desc
            limit %s
        """,
        "params": [
            {"name": "limit", "type": "int", "default": 10},
        ],
    },
    "Recent rows (by created_at)": {
        "sql": """
            select *
            from %s
            order by created_at desc
            limit %s
        """,
        "params": [
            {"name": "table", "type": "text", "default": "public.your_table"},
            {"name": "limit", "type": "int", "default": 20},
        ],
        "warning": "Table name must include schema.table. Uses safe placeholder for name.",
    },
    "Missing indexes (heuristic)": {
        "sql": """
            select relname as table_name, seq_scan, idx_scan
            from pg_stat_user_tables
            where seq_scan > idx_scan
            order by (seq_scan - idx_scan) desc
            limit %s
        """,
        "params": [
            {"name": "limit", "type": "int", "default": 20},
        ],
    },
    "Recent errors from pg_stat_activity": {
        "sql": """
            select pid, state, query, now() - query_start as age
            from pg_stat_activity
            where state <> 'idle'
            order by query_start desc
            limit %s
        """,
        "params": [
            {"name": "limit", "type": "int", "default": 10},
        ],
    },
}


def list_queries() -> List[str]:
    return list(QUERY_LIBRARY.keys())


def get_query(name: str) -> dict:
    return QUERY_LIBRARY[name]
