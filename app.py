import difflib
import os
import textwrap
from dataclasses import dataclass
from typing import List, Optional, Tuple
from uuid import uuid4

import gradio as gr
from dotenv import load_dotenv

import db


load_dotenv()

APP_PASSCODE = os.getenv("APP_PASSCODE", "").strip()
MAX_FILE_BYTES = 2_000_000

SESSIONS = set()


@dataclass
class MatchResult:
    count: int
    positions: List[Tuple[int, int]]


def _error(msg: str):
    return gr.update(value=f"❌ {msg}")


def _ok(msg: str):
    return gr.update(value=f"✅ {msg}")


def _require_auth(token: Optional[str]) -> None:
    if not APP_PASSCODE:
        raise RuntimeError("APP_PASSCODE is not set")
    if not token or token not in SESSIONS:
        raise RuntimeError("Not authorized. Enter passcode to continue.")


def _find_matches(content: str, find_text: str) -> MatchResult:
    positions: List[Tuple[int, int]] = []
    if not find_text:
        return MatchResult(0, positions)
    start = 0
    while True:
        idx = content.find(find_text, start)
        if idx == -1:
            break
        positions.append((idx, idx + len(find_text)))
        start = idx + len(find_text)
    return MatchResult(len(positions), positions)


def _apply_occurrence(content: str, find_text: str, replace_text: str, occurrence: int) -> str:
    matches = _find_matches(content, find_text)
    if matches.count == 0:
        raise ValueError("FIND text not found")
    if occurrence < 1 or occurrence > matches.count:
        raise ValueError("Invalid occurrence selection")
    start, end = matches.positions[occurrence - 1]
    return content[:start] + replace_text + content[end:]


def _excerpt(content: str, start: int, end: int, radius: int = 140) -> str:
    left = max(0, start - radius)
    right = min(len(content), end + radius)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(content) else ""
    return f"{prefix}{content[left:right]}{suffix}"


def _line_col(content: str, index: int) -> Tuple[int, int]:
    line = content.count("\n", 0, index) + 1
    last_newline = content.rfind("\n", 0, index)
    col = index - last_newline
    return line, col


def _format_patch(file_path: str, find_text: str, replace_text: str) -> str:
    return textwrap.dedent(
        f"""
        TARGET FILE:
        {file_path}

        FIND:
        {find_text}

        REPLACE WITH:
        {replace_text}
        """
    ).strip()


def _format_diff(before: str, after: str, path: str) -> str:
    diff = difflib.unified_diff(
        before.splitlines(),
        after.splitlines(),
        fromfile=f"{path} (before)",
        tofile=f"{path} (after)",
        lineterm="",
    )
    return "\n".join(diff) or "No diff available"


def login(passcode: str) -> Tuple[str, str]:
    if not APP_PASSCODE:
        return "", "APP_PASSCODE is not set on the server"
    if passcode != APP_PASSCODE:
        return "", "Incorrect passcode"
    token = uuid4().hex
    SESSIONS.add(token)
    return token, "Unlocked"


def load_projects(token: str):
    try:
        _require_auth(token)
        projects = db.list_projects()
        choices = [(p["name"], p["id"]) for p in projects]
        return gr.update(choices=choices, value=choices[0][1] if choices else None), "Projects loaded"
    except Exception as exc:
        return gr.update(choices=[], value=None), f"{exc}"


def create_project(token: str, name: str):
    try:
        _require_auth(token)
        if not name.strip():
            return None, "Provide a project name"
        proj = db.create_project(name.strip())
        projects = db.list_projects()
        choices = [(p["name"], p["id"]) for p in projects]
        return gr.update(choices=choices, value=proj["id"]), "Project ready"
    except Exception as exc:
        return gr.update(choices=[], value=None), f"{exc}"


def refresh_files(token: str, project_id: str):
    try:
        _require_auth(token)
        if not project_id:
            return gr.update(choices=[], value=None)
        files = db.list_files(project_id)
        choices = [f["path"] for f in files]
        return gr.update(choices=choices, value=choices[0] if choices else None)
    except Exception:
        return gr.update(choices=[], value=None)


def refresh_stats(token: str, project_id: str):
    try:
        _require_auth(token)
        if not project_id:
            return ""
        stats = db.project_stats(project_id)
        return (
            f"**Files:** {stats['file_count']}  "
            f"**Patches:** {stats['patch_count']}  "
            f"**Draft:** {stats['draft_count']}  "
            f"**Approved:** {stats['approved_count']}  "
            f"**Applied:** {stats['applied_count']}"
        )
    except Exception as exc:
        return f"{exc}"


def ingest_file(token: str, project_id: str, path: str, content: str, upload):
    try:
        _require_auth(token)
        if not project_id:
            return _error("Select a project first"), ""
        if upload is not None:
            data = upload.read()
            if len(data) > MAX_FILE_BYTES:
                return _error("File exceeds 2MB limit"), ""
            content = data.decode("utf-8", errors="replace")
        if not path.strip():
            return _error("File path is required"), ""
        if not content:
            return _error("File content is empty"), ""
        if len(content.encode("utf-8")) > MAX_FILE_BYTES:
            return _error("Content exceeds 2MB limit"), ""
        db.upsert_file(project_id, path.strip(), content)
        return _ok("File stored"), content
    except Exception as exc:
        return _error(str(exc)), ""


def load_file(token: str, project_id: str, path: str):
    try:
        _require_auth(token)
        if not project_id or not path:
            return _error("Select a file"), ""
        record = db.get_file(project_id, path)
        if not record:
            return _error("No file stored for that path"), ""
        return _ok("Loaded"), record["content"]
    except Exception as exc:
        return _error(str(exc)), ""


def analyze_patch(token: str, project_id: str, path: str, find_text: str, replace_text: str):
    try:
        _require_auth(token)
        if not project_id or not path:
            return _error("Select a file"), gr.update(choices=[], value=None), "", ""
        record = db.get_file(project_id, path)
        if not record:
            return _error("File not found"), gr.update(choices=[], value=None), "", ""
        if not find_text:
            return _error("FIND text is required"), gr.update(choices=[], value=None), "", ""
        matches = _find_matches(record["content"], find_text)
        if matches.count == 0:
            return _error("FIND text not found"), gr.update(choices=[], value=None), "", ""
        if matches.count == 1:
            start, end = matches.positions[0]
            line, col = _line_col(record["content"], start)
            before = _excerpt(record["content"], start, end)
            after = _excerpt(_apply_occurrence(record["content"], find_text, replace_text, 1), start, start + len(replace_text))
            diff = _format_diff(record["content"], _apply_occurrence(record["content"], find_text, replace_text, 1), path)
            preview = textwrap.dedent(
                f"""
                **Match count:** 1 (line {line}, col {col})

                **Before:**
                ```
                {before}
                ```

                **After:**
                ```
                {after}
                ```

                **Diff:**
                ```
                {diff}
                ```
                """
            ).strip()
            return _ok("Exact single match"), gr.update(choices=[], value=None), preview, ""
        choices = [str(i) for i in range(1, matches.count + 1)]
        preview = f"**Match count:** {matches.count}. Select which occurrence to preview."
        return _ok("Multiple matches"), gr.update(choices=choices, value=None), preview, ""
    except Exception as exc:
        return _error(str(exc)), gr.update(choices=[], value=None), "", ""

def preview_occurrence(token: str, project_id: str, path: str, find_text: str, replace_text: str, occurrence: str):
    try:
        _require_auth(token)
        if not occurrence:
            return ""
        record = db.get_file(project_id, path)
        if not record:
            return ""
        matches = _find_matches(record["content"], find_text)
        index = int(occurrence)
        start, end = matches.positions[index - 1]
        line, col = _line_col(record["content"], start)
        before = _excerpt(record["content"], start, end)
        after = _excerpt(_apply_occurrence(record["content"], find_text, replace_text, index), start, start + len(replace_text))
        diff = _format_diff(record["content"], _apply_occurrence(record["content"], find_text, replace_text, index), path)
        return textwrap.dedent(
            f"""
            **Occurrence {index} (line {line}, col {col})**

            **Before:**
            ```
            {before}
            ```

            **After:**
            ```
            {after}
            ```

            **Diff:**
            ```
            {diff}
            ```
            """
        ).strip()
    except Exception:
        return ""

def create_patch(token: str, project_id: str, path: str, find_text: str, replace_text: str, occurrence: str):
    try:
        _require_auth(token)
        if not project_id or not path:
            return _error("Select a file"), gr.update(value=None)
        record = db.get_file(project_id, path)
        if not record:
            return _error("File not found"), gr.update(value=None)
        matches = _find_matches(record["content"], find_text)
        if matches.count == 0:
            return _error("FIND text not found"), gr.update(value=None)
        if matches.count > 1 and not occurrence:
            return _error("Multiple matches: select occurrence"), gr.update(value=None)
        if matches.count > 1:
            index = int(occurrence)
        else:
            index = 1
        _apply_occurrence(record["content"], find_text, replace_text, index)
        patch = db.create_patch(project_id, path, find_text, replace_text)
        return _ok(f"Patch saved ({patch['id']})"), gr.update(value=None)
    except Exception as exc:
        return _error(str(exc)), gr.update(value=None)


def list_patches(token: str, project_id: str):
    try:
        _require_auth(token)
        patches = db.list_patches(project_id) if project_id else []
        rows = [[p["id"], p["file_path"], p["status"], p["created_at"]] for p in patches]
        choices = [p["id"] for p in patches]
        return rows, gr.update(choices=choices, value=choices[0] if choices else None)
    except Exception:
        return [], gr.update(choices=[], value=None)


def load_patch(token: str, patch_id: str):
    try:
        _require_auth(token)
        if not patch_id:
            return ""
        patch = db.get_patch(patch_id)
        if not patch:
            return ""
        return _format_patch(patch["file_path"], patch["find_text"], patch["replace_text"])
    except Exception:
        return ""


def approve_patch(token: str, patch_id: str):
    try:
        _require_auth(token)
        if not patch_id:
            return _error("Select a patch")
        db.update_patch_status(patch_id, "approved")
        return _ok("Patch approved")
    except Exception as exc:
        return _error(str(exc))


def apply_patch(token: str, patch_id: str):
    try:
        _require_auth(token)
        if not patch_id:
            return _error("Select a patch")
        patch = db.get_patch(patch_id)
        if not patch:
            return _error("Patch not found")
        record = db.get_file(patch["project_id"], patch["file_path"])
        if not record:
            return _error("File not found")
        matches = _find_matches(record["content"], patch["find_text"])
        if matches.count != 1:
            return _error("Apply blocked: FIND must match exactly once")
        updated = _apply_occurrence(record["content"], patch["find_text"], patch["replace_text"], 1)
        db.update_file_content(patch["project_id"], patch["file_path"], updated)
        db.update_patch_status(patch_id, "applied")
        return _ok("Patch applied to stored file")
    except Exception as exc:
        return _error(str(exc))


def export_approved(token: str, project_id: str):
    try:
        _require_auth(token)
        if not project_id:
            return ""
        patches = db.list_approved_patches(project_id)
        if not patches:
            return "No approved patches yet."
        blocks = [
            _format_patch(p["file_path"], p["find_text"], p["replace_text"])
            for p in patches
        ]
        return "\n\n---\n\n".join(blocks)
    except Exception as exc:
        return f"{exc}"


def app() -> gr.Blocks:
    with gr.Blocks(title="PatchSmith") as demo:
        gr.Markdown("# PatchSmith\nStructured patch builder with strict matching and approvals.")

        auth_state = gr.State("")

        with gr.Row():
            passcode = gr.Textbox(label="Passcode", type="password")
            unlock_btn = gr.Button("Unlock")
            auth_status = gr.Markdown("Locked")

        unlock_btn.click(login, inputs=passcode, outputs=[auth_state, auth_status])

        with gr.Tabs():
            with gr.Tab("Project Picker"):
                with gr.Row():
                    refresh_projects = gr.Button("Refresh Projects")
                    project_select = gr.Dropdown(label="Select Project", choices=[], value=None)
                with gr.Row():
                    project_name = gr.Textbox(label="New Project Name")
                    create_project_btn = gr.Button("Create / Use")
                project_status = gr.Markdown("")
                stats_md = gr.Markdown("")

                refresh_projects.click(load_projects, inputs=auth_state, outputs=[project_select, project_status])
                create_project_btn.click(create_project, inputs=[auth_state, project_name], outputs=[project_select, project_status])
                project_select.change(refresh_stats, inputs=[auth_state, project_select], outputs=stats_md)

            with gr.Tab("File Ingest"):
                file_path = gr.Textbox(label="File Path")
                upload = gr.File(label="Upload File", type="binary")
                file_content = gr.Textbox(label="File Content", lines=18)
                with gr.Row():
                    save_btn = gr.Button("Save File")
                    load_btn = gr.Button("Load Stored")
                ingest_status = gr.Markdown("")

                save_btn.click(
                    ingest_file,
                    inputs=[auth_state, project_select, file_path, file_content, upload],
                    outputs=[ingest_status, file_content],
                )
                load_btn.click(
                    load_file,
                    inputs=[auth_state, project_select, file_path],
                    outputs=[ingest_status, file_content],
                )

            with gr.Tab("Patch Builder"):
                patch_file = gr.Dropdown(label="File Path", choices=[])
                find_text = gr.Textbox(label="FIND", lines=6)
                replace_text = gr.Textbox(label="REPLACE WITH", lines=6)
                analyze_btn = gr.Button("Analyze")
                match_status = gr.Markdown("")
                occurrence = gr.Dropdown(label="Occurrence (required for multiple matches)", choices=[])
                preview = gr.Markdown("")
                save_patch_btn = gr.Button("Save Patch")
                create_status = gr.Markdown("")

                analyze_btn.click(
                    analyze_patch,
                    inputs=[auth_state, project_select, patch_file, find_text, replace_text],
                    outputs=[match_status, occurrence, preview, create_status],
                )
                occurrence.change(
                    preview_occurrence,
                    inputs=[auth_state, project_select, patch_file, find_text, replace_text, occurrence],
                    outputs=preview,
                )
                save_patch_btn.click(
                    create_patch,
                    inputs=[auth_state, project_select, patch_file, find_text, replace_text, occurrence],
                    outputs=[create_status, occurrence],
                )

            with gr.Tab("Approval + Export"):
                refresh_patches_btn = gr.Button("Refresh Patches")
                patches_table = gr.Dataframe(
                    headers=["id", "file_path", "status", "created_at"],
                    row_count=0,
                    col_count=4,
                    interactive=False,
                )
                patch_select = gr.Dropdown(label="Select Patch", choices=[])
                patch_block = gr.Textbox(label="Export Block", lines=12)
                approved_block = gr.Textbox(label="Approved Patch Bundle", lines=12)
                with gr.Row():
                    approve_btn = gr.Button("Approve")
                    apply_btn = gr.Button("Apply Patch")
                    export_btn = gr.Button("Export Approved")
                patch_status = gr.Markdown("")

                refresh_patches_btn.click(
                    list_patches,
                    inputs=[auth_state, project_select],
                    outputs=[patches_table, patch_select],
                )
                patch_select.change(
                    load_patch,
                    inputs=[auth_state, patch_select],
                    outputs=patch_block,
                )
                approve_btn.click(
                    approve_patch,
                    inputs=[auth_state, patch_select],
                    outputs=patch_status,
                )
                apply_btn.click(
                    apply_patch,
                    inputs=[auth_state, patch_select],
                    outputs=patch_status,
                )
                export_btn.click(
                    export_approved,
                    inputs=[auth_state, project_select],
                    outputs=approved_block,
                )

        project_select.change(refresh_files, inputs=[auth_state, project_select], outputs=patch_file)

    return demo


def main() -> None:
    demo = app()
    demo.launch(server_name="0.0.0.0", server_port=8502, show_api=False)


if __name__ == "__main__":
    main()
