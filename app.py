import os
import textwrap
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple

import gradio as gr
from dotenv import load_dotenv

import db

load_dotenv()

APP_PASSCODE = os.getenv("APP_PASSCODE", "").strip()

SESSIONS = set()


def _error(msg: str):
    return gr.update(value=f"❌ {msg}")


def _ok(msg: str):
    return gr.update(value=f"✅ {msg}")


def _require_auth(token: Optional[str]) -> None:
    if not APP_PASSCODE:
        raise RuntimeError("APP_PASSCODE is not set")
    if not token or token not in SESSIONS:
        raise RuntimeError("Not authorized. Enter passcode to continue.")


def login(passcode: str) -> Tuple[str, str]:
    if not APP_PASSCODE:
        return "", "APP_PASSCODE is not set on the server"
    if passcode != APP_PASSCODE:
        return "", "Incorrect passcode"
    token = os.urandom(16).hex()
    SESSIONS.add(token)
    return token, "Unlocked"


def load_tables(token: str):
    try:
        _require_auth(token)
        tables = db.list_tables()
        rows = [[t["schema"], t["table"], t["estimated_rows"]] for t in tables]
        choices = [f"{t['schema']}.{t['table']}" for t in tables]
        return tables, rows, gr.update(choices=choices, value=choices[0] if choices else None), _ok("Tables loaded")
    except Exception as exc:
        return [], [], gr.update(choices=[], value=None), _error(str(exc))


def filter_tables(search: str, tables: List[Dict]):
    if not tables:
        return []
    if not search:
        return [[t["schema"], t["table"], t["estimated_rows"]] for t in tables]
    needle = search.lower()
    filtered = [t for t in tables if needle in f"{t['schema']}.{t['table']}".lower()]
    return [[t["schema"], t["table"], t["estimated_rows"]] for t in filtered]


def _split_table(table_id: str) -> Tuple[str, str]:
    if not table_id or "." not in table_id:
        raise ValueError("Select a table")
    schema, table = table_id.split(".", 1)
    return schema, table


def load_columns(token: str, table_id: str):
    try:
        _require_auth(token)
        schema, table = _split_table(table_id)
        cols = db.list_columns(schema, table)
        rows = [[c["column_name"], c["data_type"], c["is_nullable"], c["column_default"]] for c in cols]
        return rows, _ok("Columns loaded")
    except Exception as exc:
        return [], _error(str(exc))


def load_indexes(token: str, table_id: str):
    try:
        _require_auth(token)
        schema, table = _split_table(table_id)
        indexes = db.list_indexes(schema, table)
        rows = [[i["indexname"], i["indexdef"]] for i in indexes]
        return rows, _ok("Indexes loaded")
    except Exception as exc:
        return [], _error(str(exc))


def load_constraints(token: str, table_id: str):
    try:
        _require_auth(token)
        schema, table = _split_table(table_id)
        cons = db.list_constraints(schema, table)
        rows = [[c["conname"], c["contype"], c["definition"]] for c in cons]
        return rows, _ok("Constraints loaded")
    except Exception as exc:
        return [], _error(str(exc))


def load_foreign_keys(token: str, table_id: str):
    try:
        _require_auth(token)
        schema, table = _split_table(table_id)
        fks = db.list_foreign_keys()
        outbound = [fk for fk in fks if fk["schema"] == schema and fk["table"] == table]
        inbound = [fk for fk in fks if fk["ref_schema"] == schema and fk["ref_table"] == table]

        def fmt(items: List[Dict]) -> str:
            if not items:
                return "None"
            lines = []
            for fk in items:
                cols = ", ".join(fk["columns"])
                ref_cols = ", ".join(fk["ref_columns"])
                lines.append(f"- {fk['schema']}.{fk['table']} ({cols}) -> {fk['ref_schema']}.{fk['ref_table']} ({ref_cols})")
            return "\n".join(lines)

        return fmt(outbound), fmt(inbound), _ok("Foreign keys loaded")
    except Exception as exc:
        return "", "", _error(str(exc))


def _topo_sort(nodes: List[str], edges: List[Tuple[str, str]]):
    incoming = defaultdict(int)
    outgoing = defaultdict(list)
    for src, dst in edges:
        outgoing[src].append(dst)
        incoming[dst] += 1
        incoming.setdefault(src, incoming.get(src, 0))
    for n in nodes:
        incoming.setdefault(n, 0)

    queue = deque([n for n in nodes if incoming[n] == 0])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for dst in outgoing.get(node, []):
            incoming[dst] -= 1
            if incoming[dst] == 0:
                queue.append(dst)

    remaining = [n for n in nodes if n not in order]
    return order, remaining


def generate_runbook(token: str):
    try:
        _require_auth(token)
        tables = db.list_tables()
        nodes = [f"{t['schema']}.{t['table']}" for t in tables]
        edges = db.list_fk_dependencies()

        order, remaining = _topo_sort(nodes, edges)
        drop_order = list(reversed(order))

        lines = ["# SchemaPulse Runbook", "", "## Creation Order", ""]
        if order:
            lines += [f"{idx+1}. {tbl}" for idx, tbl in enumerate(order)]
        else:
            lines.append("No tables found.")

        if remaining:
            lines += ["", "## Cycles Detected", "The following tables are in cycles and require manual ordering:"]
            lines += [f"- {tbl}" for tbl in remaining]

        lines += ["", "## Dependency Map", ""]
        if edges:
            lines += [f"- {src} -> {dst}" for src, dst in edges]
        else:
            lines.append("No foreign key dependencies found.")

        lines += ["", "## Drop Order", ""]
        if drop_order:
            lines += [f"{idx+1}. {tbl}" for idx, tbl in enumerate(drop_order)]
        else:
            lines.append("No tables found.")

        runbook = "\n".join(lines)
        path = "/tmp/schemapulse_runbook.md"
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(runbook)
        return runbook, path, _ok("Runbook generated")
    except Exception as exc:
        return "", None, _error(str(exc))


def readiness_checks(token: str):
    try:
        _require_auth(token)
        extensions = set(db.list_extensions())
        lines = ["## Readiness Checks", ""]
        lines.append("- pgcrypto: OK" if "pgcrypto" in extensions else "- pgcrypto: MISSING")

        fks = db.list_foreign_keys()
        missing = []
        idx_cache: Dict[Tuple[str, str], List[List[str]]] = {}

        for fk in fks:
            schema = fk["schema"]
            table = fk["table"]
            key = (schema, table)
            if key not in idx_cache:
                idx = db.list_index_columns(schema, table)
                idx_cache[key] = [i["columns"] for i in idx]
            fk_cols = fk["columns"]
            has_index = any(cols[: len(fk_cols)] == fk_cols for cols in idx_cache[key])
            if not has_index:
                missing.append(f"{schema}.{table} ({', '.join(fk_cols)})")

        lines.append("")
        lines.append("## Foreign Key Index Coverage")
        if missing:
            lines.append("Missing index for:")
            lines += [f"- {item}" for item in missing]
        else:
            lines.append("All FK columns appear indexed.")

        return "\n".join(lines), _ok("Readiness checks complete")
    except Exception as exc:
        return f"ERROR: {exc}", _error(str(exc))


def refresh_sets(token: str):
    try:
        _require_auth(token)
        sets = db.list_migration_sets()
        choices = [(s["name"], s["id"]) for s in sets]
        return gr.update(choices=choices, value=choices[0][1] if choices else None), _ok("Sets loaded")
    except Exception as exc:
        return gr.update(choices=[], value=None), _error(str(exc))


def create_set(token: str, name: str):
    try:
        _require_auth(token)
        if not name.strip():
            return gr.update(choices=[], value=None), _error("Provide a set name")
        record = db.create_migration_set(name.strip())
        sets = db.list_migration_sets()
        choices = [(s["name"], s["id"]) for s in sets]
        return gr.update(choices=choices, value=record["id"]), _ok("Set ready")
    except Exception as exc:
        return gr.update(choices=[], value=None), _error(str(exc))


def save_migration(token: str, set_id: str, filename: str, sql_text: str):
    try:
        _require_auth(token)
        if not set_id:
            return _error("Select a set"), []
        if not filename.strip() or not sql_text.strip():
            return _error("Filename and SQL required"), []
        db.upsert_migration(set_id, filename.strip(), sql_text.strip())
        migrations = db.list_migrations(set_id)
        rows = [[m["filename"], m["created_at"]] for m in migrations]
        return _ok("Migration saved"), rows
    except Exception as exc:
        return _error(str(exc)), []


def load_migrations(token: str, set_id: str):
    try:
        _require_auth(token)
        if not set_id:
            return []
        migrations = db.list_migrations(set_id)
        rows = [[m["filename"], m["created_at"]] for m in migrations]
        return rows
    except Exception:
        return []


def export_migrations(token: str, set_id: str):
    try:
        _require_auth(token)
        if not set_id:
            return "", None, _error("Select a set")
        migrations = db.list_migrations(set_id)
        if not migrations:
            return "No migrations found.", None, _error("No migrations")
        combined = []
        for mig in migrations:
            combined.append(f"-- {mig['filename']}\n{mig['sql_text']}")
        script = "\n\n".join(combined)
        path = "/tmp/schemapulse_migrations.sql"
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(script)
        return script, path, _ok("Export ready")
    except Exception as exc:
        return "", None, _error(str(exc))


def app() -> gr.Blocks:
    with gr.Blocks(title="SchemaPulse") as demo:
        gr.Markdown("# SchemaPulse\nSchema + migrations viewer with runbook outputs.")

        auth_state = gr.State("")
        tables_state = gr.State([])

        with gr.Row():
            passcode = gr.Textbox(label="Passcode", type="password")
            unlock_btn = gr.Button("Unlock")
            auth_status = gr.Markdown("Locked")

        unlock_btn.click(login, inputs=passcode, outputs=[auth_state, auth_status])

        with gr.Tabs():
            with gr.Tab("Schema Explorer"):
                with gr.Row():
                    with gr.Column(scale=1):
                        load_tables_btn = gr.Button("Load Schemas / Tables")
                        load_columns_btn = gr.Button("Load Columns")
                        load_indexes_btn = gr.Button("Load Indexes")
                        load_constraints_btn = gr.Button("Load Constraints")
                        load_fks_btn = gr.Button("Load Foreign Keys")
                        runbook_btn = gr.Button("Generate Runbook")
                        readiness_btn = gr.Button("Run Readiness Checks")
                        action_status = gr.Markdown("")

                    with gr.Column(scale=2):
                        search = gr.Textbox(label="Search Tables")
                        tables_df = gr.Dataframe(
                            headers=["schema", "table", "estimated_rows"],
                            row_count=0,
                            col_count=3,
                            interactive=False,
                        )

                    with gr.Column(scale=2):
                        table_select = gr.Dropdown(label="Table", choices=[])
                        cols_df = gr.Dataframe(
                            headers=["column", "type", "nullable", "default"],
                            row_count=0,
                            col_count=4,
                            interactive=False,
                        )
                        idx_df = gr.Dataframe(
                            headers=["index", "definition"],
                            row_count=0,
                            col_count=2,
                            interactive=False,
                        )
                        con_df = gr.Dataframe(
                            headers=["name", "type", "definition"],
                            row_count=0,
                            col_count=3,
                            interactive=False,
                        )
                        outbound_md = gr.Markdown("**Outgoing FKs**\n")
                        inbound_md = gr.Markdown("**Incoming FKs**\n")

                runbook_text = gr.Textbox(label="Runbook", lines=12)
                runbook_file = gr.File(label="Runbook Download")
                readiness_text = gr.Markdown("")

                load_tables_btn.click(
                    load_tables,
                    inputs=auth_state,
                    outputs=[tables_state, tables_df, table_select, action_status],
                )
                search.change(filter_tables, inputs=[search, tables_state], outputs=tables_df)

                load_columns_btn.click(load_columns, inputs=[auth_state, table_select], outputs=[cols_df, action_status])
                load_indexes_btn.click(load_indexes, inputs=[auth_state, table_select], outputs=[idx_df, action_status])
                load_constraints_btn.click(load_constraints, inputs=[auth_state, table_select], outputs=[con_df, action_status])
                load_fks_btn.click(load_foreign_keys, inputs=[auth_state, table_select], outputs=[outbound_md, inbound_md, action_status])

                runbook_btn.click(generate_runbook, inputs=auth_state, outputs=[runbook_text, runbook_file, action_status])
                readiness_btn.click(readiness_checks, inputs=auth_state, outputs=[readiness_text, action_status])

            with gr.Tab("Migration Sets"):
                with gr.Row():
                    refresh_sets_btn = gr.Button("Refresh Sets")
                    set_select = gr.Dropdown(label="Migration Set", choices=[])
                with gr.Row():
                    set_name = gr.Textbox(label="New Set Name")
                    create_set_btn = gr.Button("Create Set")
                set_status = gr.Markdown("")

                filename = gr.Textbox(label="Filename (e.g., 001_init.sql)")
                sql_text = gr.Textbox(label="Migration SQL", lines=12)
                save_mig_btn = gr.Button("Save Migration")

                migrations_df = gr.Dataframe(
                    headers=["filename", "created_at"],
                    row_count=0,
                    col_count=2,
                    interactive=False,
                )

                export_btn = gr.Button("Export Combined Script")
                export_text = gr.Textbox(label="Combined SQL", lines=12)
                export_file = gr.File(label="SQL Download")

                refresh_sets_btn.click(refresh_sets, inputs=auth_state, outputs=[set_select, set_status])
                create_set_btn.click(create_set, inputs=[auth_state, set_name], outputs=[set_select, set_status])
                save_mig_btn.click(save_migration, inputs=[auth_state, set_select, filename, sql_text], outputs=[set_status, migrations_df])
                set_select.change(load_migrations, inputs=[auth_state, set_select], outputs=migrations_df)
                export_btn.click(export_migrations, inputs=[auth_state, set_select], outputs=[export_text, export_file, set_status])

        demo.enable_queue = False

    return demo


def main() -> None:
    demo = app()
    demo.launch(server_name="0.0.0.0", server_port=8504, show_api=False, show_error=True)


if __name__ == "__main__":
    main()
