import csv
import json
import os
import textwrap
from io import StringIO
from typing import List, Optional, Tuple

import gradio as gr
from dotenv import load_dotenv

import db

load_dotenv()

APP_PASSCODE = os.getenv("APP_PASSCODE", "").strip()
MAX_BODY_CHARS = 200_000

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


def _normalize_tags(raw: str) -> List[str]:
    tags = [t.strip().lower() for t in raw.split(",") if t.strip()]
    return sorted(set(tags))


def add_chunk(token: str, title: str, body: str, tags_raw: str, source: str):
    try:
        _require_auth(token)
        if not title.strip():
            return _error("Title is required"), "", "", "", []
        if not body.strip():
            return _error("Body is required"), "", "", "", []
        if len(body) > MAX_BODY_CHARS:
            return _error("Body exceeds 200k characters"), "", "", "", []
        tags = _normalize_tags(tags_raw)
        db.add_chunk(title.strip(), body.strip(), tags, source.strip())
        return _ok("Chunk saved"), "", "", "", ""
    except Exception as exc:
        return _error(str(exc)), "", "", "", ""


def refresh_tags(token: str):
    try:
        _require_auth(token)
        tags = db.list_tags()
        return gr.update(choices=tags, value=[])
    except Exception:
        return gr.update(choices=[], value=[])


def search_chunks(token: str, query: str, tags: List[str], limit: int):
    try:
        _require_auth(token)
        rows = db.search_chunks(query.strip(), tags or [], limit)
        results = []
        choices = []
        for row in rows:
            snippet = row["body"][:180].replace("\n", " ")
            if len(row["body"]) > 180:
                snippet += "..."
            tag_display = ", ".join(row["tags"]) if row["tags"] else ""
            results.append([row["title"], snippet, tag_display, row["created_at"]])
            choices.append((row["title"], row["id"]))
        return results, gr.update(choices=choices, value=choices[0][1] if choices else None), _ok("Search complete")
    except Exception as exc:
        return [], gr.update(choices=[], value=None), _error(str(exc))


def load_chunk(token: str, chunk_id: str):
    try:
        _require_auth(token)
        if not chunk_id:
            return "", "", ""
        row = db.get_chunk(chunk_id)
        if not row:
            return "", "", ""
        tag_display = ", ".join(row["tags"]) if row["tags"] else ""
        meta = f"**Source:** {row['source'] or '—'}\n\n**Tags:** {tag_display or '—'}\n\n**Created:** {row['created_at']}"
        return row["title"], meta, row["body"]
    except Exception:
        return "", "", ""


def delete_selected(token: str, chunk_id: str):
    try:
        _require_auth(token)
        if not chunk_id:
            return _error("Select a chunk"), "", "", ""
        db.delete_chunk(chunk_id)
        return _ok("Chunk deleted"), "", "", ""
    except Exception as exc:
        return _error(str(exc)), "", "", ""


def export_json(token: str):
    try:
        _require_auth(token)
        rows = db.export_chunks()
        payload = json.dumps(rows, indent=2, default=str)
        path = "/tmp/recallgrid_export.json"
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(payload)
        return payload, path, _ok("Export ready")
    except Exception as exc:
        return "", None, _error(str(exc))


def export_csv(token: str):
    try:
        _require_auth(token)
        rows = db.export_chunks()
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["id", "title", "source", "tags", "body", "created_at"])
        for row in rows:
            writer.writerow([row["id"], row["title"], row["source"], ",".join(row["tags"]), row["body"], row["created_at"]])
        payload = buffer.getvalue()
        path = "/tmp/recallgrid_export.csv"
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(payload)
        return payload, path, _ok("Export ready")
    except Exception as exc:
        return "", None, _error(str(exc))


def app() -> gr.Blocks:
    with gr.Blocks(title="RecallGrid") as demo:
        gr.Markdown("# RecallGrid\nSemantic-lite knowledge library with FTS + tag filters.")

        auth_state = gr.State("")

        with gr.Row():
            passcode = gr.Textbox(label="Passcode", type="password")
            unlock_btn = gr.Button("Unlock")
            auth_status = gr.Markdown("Locked")

        unlock_btn.click(login, inputs=passcode, outputs=[auth_state, auth_status])

        with gr.Tabs():
            with gr.Tab("Add"):
                title = gr.Textbox(label="Title")
                tags = gr.Textbox(label="Tags (comma separated)")
                source = gr.Textbox(label="Source (optional)")
                body = gr.Textbox(label="Body", lines=12)
                save_btn = gr.Button("Save Chunk")
                save_status = gr.Markdown("")

                save_btn.click(
                    add_chunk,
                    inputs=[auth_state, title, body, tags, source],
                    outputs=[save_status, title, tags, source, body],
                )

            with gr.Tab("Search"):
                query = gr.Textbox(label="Query")
                tags_filter = gr.Dropdown(label="Tag Filter", choices=[], multiselect=True)
                limit = gr.Slider(label="Limit", minimum=5, maximum=50, value=15, step=1)
                search_btn = gr.Button("Search")
                search_status = gr.Markdown("")

                results_df = gr.Dataframe(
                    headers=["title", "snippet", "tags", "created_at"],
                    row_count=0,
                    col_count=4,
                    interactive=False,
                )
                result_select = gr.Dropdown(label="Select Result", choices=[])

                search_btn.click(
                    search_chunks,
                    inputs=[auth_state, query, tags_filter, limit],
                    outputs=[results_df, result_select, search_status],
                )

                refresh_tags_btn = gr.Button("Refresh Tags")
                refresh_tags_btn.click(refresh_tags, inputs=auth_state, outputs=tags_filter)

            with gr.Tab("Detail"):
                detail_title = gr.Textbox(label="Title")
                detail_meta = gr.Markdown("")
                detail_body = gr.Textbox(label="Body", lines=16)
                delete_btn = gr.Button("Delete")
                delete_status = gr.Markdown("")

                result_select.change(
                    load_chunk,
                    inputs=[auth_state, result_select],
                    outputs=[detail_title, detail_meta, detail_body],
                )
                delete_btn.click(
                    delete_selected,
                    inputs=[auth_state, result_select],
                    outputs=[delete_status, detail_title, detail_meta, detail_body],
                )

            with gr.Tab("Export"):
                export_json_btn = gr.Button("Export JSON")
                export_csv_btn = gr.Button("Export CSV")
                export_status = gr.Markdown("")
                export_json_text = gr.Textbox(label="JSON", lines=10)
                export_json_file = gr.File(label="JSON Download")
                export_csv_text = gr.Textbox(label="CSV", lines=10)
                export_csv_file = gr.File(label="CSV Download")

                export_json_btn.click(export_json, inputs=auth_state, outputs=[export_json_text, export_json_file, export_status])
                export_csv_btn.click(export_csv, inputs=auth_state, outputs=[export_csv_text, export_csv_file, export_status])

        demo.enable_queue = False

    return demo


def main() -> None:
    demo = app()
    demo.launch(server_name="0.0.0.0", server_port=8504, show_api=False, show_error=True)


if __name__ == "__main__":
    main()
