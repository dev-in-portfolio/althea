import base64
import hashlib
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple

import dash
from dash import Dash, Input, Output, State, dcc, html
import pandas as pd
import psycopg

APP_TITLE = "DriftMeter"


def get_db_url() -> str:
    return (
        os.environ.get("DATABASE_URL")
        or os.environ.get("NETLIFY_DATABASE_URL")
        or os.environ.get("NETLIFY_DATABASE_URL_UNPOOLED")
        or ""
    )


def get_conn():
    db_url = get_db_url()
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(db_url)


def hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_env(text: str) -> Dict[str, str]:
    items: Dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        items[key.strip()] = value.strip().strip("\"")
    return items


def parse_payload(text: str) -> Dict[str, str]:
    payload = text.strip()
    if not payload:
        return {}
    if payload.startswith("{"):
        try:
            data = json.loads(payload)
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items()}
        except json.JSONDecodeError:
            pass
    return parse_env(payload)


def decode_upload(contents: str) -> str:
    header, encoded = contents.split(",", 1)
    return base64.b64decode(encoded).decode("utf-8", errors="ignore")


def ensure_schema() -> None:
    sql_path = os.path.join(os.path.dirname(__file__), "sql", "002_driftmeter.sql")
    if not os.path.exists(sql_path):
        return
    with open(sql_path, "r", encoding="utf-8") as handle:
        ddl = handle.read()
    with get_conn() as conn:
        conn.execute(ddl)
        conn.commit()


def list_envs() -> List[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "select distinct env from config_snapshots order by env"
        ).fetchall()
    return [row[0] for row in rows]


def list_snapshots(env: str) -> List[Tuple[str, str, str]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            select id::text, label, created_at
            from config_snapshots
            where env = %s
            order by created_at desc
            """,
            (env,),
        ).fetchall()
    return [(row[0], row[1], row[2].isoformat()) for row in rows]


def insert_snapshot(env: str, label: str, items: Dict[str, str]) -> str:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            insert into config_snapshots (env, label)
            values (%s, %s)
            returning id
            """,
            (env, label),
        )
        snapshot_id = cur.fetchone()[0]
        rows = [
            (snapshot_id, key, value, hash_value(value))
            for key, value in items.items()
        ]
        if rows:
            cur.executemany(
                """
                insert into config_items (snapshot_id, key, value, value_hash)
                values (%s, %s, %s, %s)
                """,
                rows,
            )
        conn.commit()
    return str(snapshot_id)


def risk_level(key: str) -> str:
    upper = key.upper()
    if any(token in upper for token in ("TOKEN", "KEY", "SECRET", "PASSWORD")):
        return "high"
    if any(token in upper for token in ("URL", "HOST", "PORT")):
        return "medium"
    return "low"


def risk_score(df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    weights = {"high": 5, "medium": 2, "low": 1}
    return int(
        (df["risk"]
        .map(weights)
        .fillna(0)
        * (df["status"] == "changed").astype(int))
        .sum()
    )


def load_diff(snapshot_a: str, snapshot_b: str) -> pd.DataFrame:
    with get_conn() as conn:
        rows = conn.execute(
            """
            with a as (
                select key, value, value_hash from config_items where snapshot_id = %s
            ),
            b as (
                select key, value, value_hash from config_items where snapshot_id = %s
            )
            select
                coalesce(a.key, b.key) as key,
                a.value as value_a,
                b.value as value_b,
                case
                    when a.key is null then 'extra'
                    when b.key is null then 'missing'
                    when a.value_hash <> b.value_hash then 'changed'
                    else 'same'
                end as status
            from a
            full outer join b on a.key = b.key
            order by key
            """,
            (snapshot_a, snapshot_b),
        ).fetchall()
    df = pd.DataFrame(rows, columns=["key", "value_a", "value_b", "status"])
    if not df.empty:
        df["risk"] = df["key"].apply(risk_level)
    else:
        df["risk"] = []
    return df


app = Dash(__name__, title=APP_TITLE)

app.layout = html.Div(
    className="app-shell",
    children=[
        html.Div(
            className="hero",
            children=[
                html.Div(
                    className="hero-text",
                    children=[
                        html.H1("DriftMeter"),
                        html.P(
                            "Compare config snapshots across environments and score risk in minutes."
                        ),
                        html.Div(
                            className="hero-meta",
                            children=[
                                html.Span("Live diff"),
                                html.Span("Risk scoring"),
                                html.Span("Runbook exports"),
                            ],
                        ),
                    ],
                ),
                html.Div(
                    className="hero-card",
                    children=[
                        html.H3("Quick Start"),
                        html.Ol(
                            children=[
                                html.Li("Paste a JSON or .env snapshot"),
                                html.Li("Create dev/stage/prod baselines"),
                                html.Li("Compare snapshots for drift"),
                            ]
                        ),
                    ],
                ),
            ],
        ),
        html.Div(
            className="grid",
            children=[
                html.Div(
                    className="panel",
                    children=[
                        html.H2("Capture Snapshot"),
                        html.Div(
                            className="field-row",
                            children=[
                                html.Div(
                                    children=[
                                        html.Label("Environment"),
                                        dcc.Dropdown(
                                            id="env-input",
                                            options=[
                                                {"label": "local", "value": "local"},
                                                {"label": "dev", "value": "dev"},
                                                {"label": "stage", "value": "stage"},
                                                {"label": "prod", "value": "prod"},
                                            ],
                                            value="dev",
                                            clearable=False,
                                        ),
                                    ]
                                ),
                                html.Div(
                                    children=[
                                        html.Label("Snapshot Label"),
                                        dcc.Input(
                                            id="label-input",
                                            type="text",
                                            placeholder="e.g. pre-release-02",
                                            value="",
                                        ),
                                    ]
                                ),
                            ],
                        ),
                        html.Label("Paste JSON or .env"),
                        dcc.Textarea(
                            id="config-text",
                            placeholder="{"
                            "\"API_URL\": \"https://api.example.com\", "
                            "\"FEATURE_FLAG\": true"
                            "}\n\n# or .env\nAPI_URL=https://api.example.com",
                            className="textarea",
                        ),
                        html.Div(
                            className="upload-row",
                            children=[
                                dcc.Upload(
                                    id="config-upload",
                                    children=html.Div([
                                        "Drag & drop file or ",
                                        html.Span("browse"),
                                    ]),
                                    className="upload",
                                ),
                                html.Button("Create Snapshot", id="create-btn"),
                            ],
                        ),
                        html.Div(id="create-status", className="status"),
                    ],
                ),
                html.Div(
                    className="panel",
                    children=[
                        html.H2("Compare Snapshots"),
                        html.Div(
                            className="field-row",
                            children=[
                                html.Div(
                                    children=[
                                        html.Label("Env A"),
                                        dcc.Dropdown(id="env-a"),
                                    ]
                                ),
                                html.Div(
                                    children=[
                                        html.Label("Snapshot A"),
                                        dcc.Dropdown(id="snap-a"),
                                    ]
                                ),
                            ],
                        ),
                        html.Div(
                            className="field-row",
                            children=[
                                html.Div(
                                    children=[
                                        html.Label("Env B"),
                                        dcc.Dropdown(id="env-b"),
                                    ]
                                ),
                                html.Div(
                                    children=[
                                        html.Label("Snapshot B"),
                                        dcc.Dropdown(id="snap-b"),
                                    ]
                                ),
                            ],
                        ),
                        html.Button("Compare", id="compare-btn"),
                        html.Div(
                            className="filters",
                            children=[
                                dcc.Checklist(
                                    id="filter-changed",
                                    options=[
                                        {"label": "Show only changed", "value": "changed"}
                                    ],
                                    value=[],
                                ),
                                dcc.Checklist(
                                    id="filter-high",
                                    options=[
                                        {"label": "High risk only", "value": "high"}
                                    ],
                                    value=[],
                                ),
                            ],
                        ),
                        html.Div(
                            className="summary",
                            children=[
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Changed"), html.P(id="sum-changed")],
                                ),
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Missing"), html.P(id="sum-missing")],
                                ),
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Extra"), html.P(id="sum-extra")],
                                ),
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Risk Score"), html.P(id="sum-risk")],
                                ),
                            ],
                        ),
                        html.Div(
                            className="export-row",
                            children=[
                                html.Button("Download CSV", id="export-csv"),
                                dcc.Download(id="download-csv"),
                                html.Button("Download Runbook", id="export-md"),
                                dcc.Download(id="download-md"),
                            ],
                        ),
                    ],
                ),
            ],
        ),
        html.Div(
            className="panel full",
            children=[
                html.H2("Diff Table"),
                dcc.Loading(
                    type="circle",
                    children=html.Div(id="diff-table"),
                ),
            ],
        ),
        dcc.Store(id="diff-store"),
    ],
)


@app.callback(
    Output("env-a", "options"),
    Output("env-b", "options"),
    Input("create-status", "children"),
)
def refresh_envs(_):
    try:
        envs = list_envs()
    except Exception:
        envs = ["local", "dev", "stage", "prod"]
    options = [{"label": env, "value": env} for env in envs]
    return options, options


@app.callback(
    Output("snap-a", "options"),
    Input("env-a", "value"),
)
def load_snapshots_a(env: str):
    if not env:
        return []
    try:
        snapshots = list_snapshots(env)
    except Exception:
        return []
    return [
        {
            "label": f"{label} • {created_at}",
            "value": snapshot_id,
        }
        for snapshot_id, label, created_at in snapshots
    ]


@app.callback(
    Output("snap-b", "options"),
    Input("env-b", "value"),
)
def load_snapshots_b(env: str):
    if not env:
        return []
    try:
        snapshots = list_snapshots(env)
    except Exception:
        return []
    return [
        {
            "label": f"{label} • {created_at}",
            "value": snapshot_id,
        }
        for snapshot_id, label, created_at in snapshots
    ]


@app.callback(
    Output("config-text", "value"),
    Input("config-upload", "contents"),
    State("config-text", "value"),
)
def handle_upload(contents, current):
    if not contents:
        return current
    return decode_upload(contents)


@app.callback(
    Output("create-status", "children"),
    Input("create-btn", "n_clicks"),
    State("env-input", "value"),
    State("label-input", "value"),
    State("config-text", "value"),
)
def create_snapshot(n_clicks, env, label, payload):
    if not n_clicks:
        return ""
    if not env:
        return "Select an environment."
    if not payload:
        return "Paste or upload config content."
    try:
        ensure_schema()
        items = parse_payload(payload)
        if not items:
            return "No valid keys detected."
        label_value = label or f"snapshot-{datetime.utcnow().strftime('%Y%m%d-%H%M')}"
        snapshot_id = insert_snapshot(env, label_value, items)
        return f"Snapshot saved: {snapshot_id} ({len(items)} keys)"
    except Exception as exc:
        return f"Error: {exc}"


@app.callback(
    Output("diff-store", "data"),
    Output("diff-table", "children"),
    Output("sum-changed", "children"),
    Output("sum-missing", "children"),
    Output("sum-extra", "children"),
    Output("sum-risk", "children"),
    Input("compare-btn", "n_clicks"),
    State("snap-a", "value"),
    State("snap-b", "value"),
    State("filter-changed", "value"),
    State("filter-high", "value"),
)
def compare(n_clicks, snap_a, snap_b, filter_changed, filter_high):
    if not n_clicks:
        return None, "", "0", "0", "0", "0"
    if not snap_a or not snap_b:
        return None, "Select both snapshots.", "0", "0", "0", "0"
    try:
        df = load_diff(snap_a, snap_b)
    except Exception as exc:
        return None, f"Error: {exc}", "0", "0", "0", "0"

    filtered = df.copy()
    if filter_changed:
        filtered = filtered[filtered["status"].isin(["changed", "missing", "extra"])]
    if filter_high:
        filtered = filtered[filtered["risk"] == "high"]

    table = html.Table(
        className="diff-table",
        children=[
            html.Thead(
                html.Tr(
                    [
                        html.Th("Key"),
                        html.Th("Status"),
                        html.Th("Value A"),
                        html.Th("Value B"),
                        html.Th("Risk"),
                    ]
                )
            ),
            html.Tbody(
                [
                    html.Tr(
                        [
                            html.Td(row["key"]),
                            html.Td(row["status"], className=f"status {row['status']}"),
                            html.Td(row["value_a"] or "—"),
                            html.Td(row["value_b"] or "—"),
                            html.Td(row["risk"], className=f"risk {row['risk']}"),
                        ]
                    )
                    for _, row in filtered.iterrows()
                ]
            ),
        ],
    )

    changed = int((df["status"] == "changed").sum())
    missing = int((df["status"] == "missing").sum())
    extra = int((df["status"] == "extra").sum())
    risk = risk_score(df)

    return (
        df.to_dict("records"),
        table,
        str(changed),
        str(missing),
        str(extra),
        str(risk),
    )


@app.callback(
    Output("download-csv", "data"),
    Input("export-csv", "n_clicks"),
    State("diff-store", "data"),
    prevent_initial_call=True,
)
def export_csv(n_clicks, data):
    if not data:
        return None
    df = pd.DataFrame(data)
    return dcc.send_data_frame(df.to_csv, "driftmeter-diff.csv", index=False)


@app.callback(
    Output("download-md", "data"),
    Input("export-md", "n_clicks"),
    State("diff-store", "data"),
    prevent_initial_call=True,
)
def export_md(n_clicks, data):
    if not data:
        return None
    df = pd.DataFrame(data)
    lines = ["# DriftMeter Runbook", "", "| Key | Status | Risk |", "| --- | --- | --- |"]
    for _, row in df.iterrows():
        lines.append(f"| {row['key']} | {row['status']} | {row['risk']} |")
    content = "\n".join(lines)
    return dict(content=content, filename="driftmeter-runbook.md")


if __name__ == "__main__":
    app.run_server(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8505)))
