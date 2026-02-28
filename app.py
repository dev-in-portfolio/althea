import json
import os
from datetime import datetime
from typing import Dict, List, Tuple

import dash
from dash import Dash, Input, Output, State, dcc, html
import pandas as pd
import plotly.express as px
import psycopg

APP_TITLE = "ClaimScope"

BENEFIT_TYPES = [
    "ER",
    "HOSP_DAY",
    "ICU_DAY",
    "SURGERY",
    "OUTPATIENT",
    "AMBULANCE",
    "IMAGING",
]

UNITS = ["per_visit", "per_day", "per_event"]

SCENARIO_FIELDS = [
    ("er_visits", "ER Visits"),
    ("hospital_days", "Hospital Days"),
    ("icu_days", "ICU Days"),
    ("surgery_events", "Surgery Events"),
    ("outpatient_visits", "Outpatient Visits"),
    ("ambulance_events", "Ambulance Events"),
    ("imaging_events", "Imaging Events"),
    ("estimated_bills", "Estimated Bills ($)"),
]


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


def ensure_schema() -> None:
    sql_path = os.path.join(os.path.dirname(__file__), "sql", "003_claimscope.sql")
    if not os.path.exists(sql_path):
        return
    with open(sql_path, "r", encoding="utf-8") as handle:
        ddl = handle.read()
    with get_conn() as conn:
        conn.execute(ddl)
        conn.commit()


def list_models() -> List[Tuple[str, str]]:
    with get_conn() as conn:
        rows = conn.execute(
            "select id::text, name from benefit_models order by updated_at desc"
        ).fetchall()
    return [(row[0], row[1]) for row in rows]


def create_model(name: str, notes: str) -> str:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            insert into benefit_models (name, notes)
            values (%s, %s)
            returning id
            """,
            (name, notes),
        )
        model_id = cur.fetchone()[0]
        conn.commit()
    return str(model_id)


def list_lines(model_id: str) -> pd.DataFrame:
    with get_conn() as conn:
        rows = conn.execute(
            """
            select id::text, benefit_type, amount, unit, max_units, waiting_days, is_enabled
            from benefit_lines
            where model_id = %s
            order by benefit_type
            """,
            (model_id,),
        ).fetchall()
    return pd.DataFrame(
        rows,
        columns=[
            "id",
            "benefit_type",
            "amount",
            "unit",
            "max_units",
            "waiting_days",
            "is_enabled",
        ],
    )


def add_line(model_id: str, payload: Dict) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            insert into benefit_lines (
                model_id, benefit_type, amount, unit, max_units, waiting_days, is_enabled
            )
            values (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                model_id,
                payload["benefit_type"],
                payload["amount"],
                payload["unit"],
                payload["max_units"],
                payload["waiting_days"],
                payload["is_enabled"],
            ),
        )
        conn.execute(
            "update benefit_models set updated_at = now() where id = %s",
            (model_id,),
        )
        conn.commit()


def list_scenarios(model_id: str) -> List[Tuple[str, str]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            select id::text, name
            from claim_scenarios
            where model_id = %s
            order by created_at desc
            """,
            (model_id,),
        ).fetchall()
    return [(row[0], row[1]) for row in rows]


def save_scenario(model_id: str, name: str, payload: Dict) -> str:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            insert into claim_scenarios (model_id, name, inputs)
            values (%s, %s, %s)
            returning id
            """,
            (model_id, name, json.dumps(payload)),
        )
        scenario_id = cur.fetchone()[0]
        conn.commit()
    return str(scenario_id)


def load_scenario(scenario_id: str) -> Dict:
    with get_conn() as conn:
        row = conn.execute(
            "select inputs from claim_scenarios where id = %s",
            (scenario_id,),
        ).fetchone()
    return row[0] if row else {}


def units_for_line(benefit_type: str, unit: str, scenario: Dict) -> int:
    upper = benefit_type.upper()
    if "ICU" in upper:
        return int(scenario.get("icu_days", 0))
    if "HOSP" in upper:
        return int(scenario.get("hospital_days", 0))
    if "ER" in upper:
        return int(scenario.get("er_visits", 0))
    if "SURGERY" in upper:
        return int(scenario.get("surgery_events", 0))
    if "OUT" in upper:
        return int(scenario.get("outpatient_visits", 0))
    if "AMB" in upper:
        return int(scenario.get("ambulance_events", 0))
    if "IMAGING" in upper:
        return int(scenario.get("imaging_events", 0))

    if unit == "per_day":
        return int(scenario.get("hospital_days", 0))
    if unit == "per_visit":
        return int(scenario.get("er_visits", 0))
    return int(scenario.get("surgery_events", 0))


def run_simulation(lines: pd.DataFrame, scenario: Dict) -> pd.DataFrame:
    results = []
    for _, row in lines.iterrows():
        if not row["is_enabled"]:
            continue
        units = units_for_line(row["benefit_type"], row["unit"], scenario)
        eligible = max(units - int(row["waiting_days"]), 0)
        capped = min(eligible, int(row["max_units"]))
        payout = float(row["amount"]) * capped
        results.append(
            {
                "benefit_type": row["benefit_type"],
                "unit": row["unit"],
                "eligible_units": eligible,
                "paid_units": capped,
                "amount": float(row["amount"]),
                "payout": payout,
            }
        )
    return pd.DataFrame(results)


app = Dash(__name__, title=APP_TITLE)

app.layout = html.Div(
    className="shell",
    children=[
        html.Div(
            className="header",
            children=[
                html.Div(
                    children=[
                        html.H1("ClaimScope"),
                        html.P(
                            "Design benefit schedules and simulate payouts across real-world scenarios."
                        ),
                    ]
                ),
                html.Div(
                    className="header-tags",
                    children=[
                        html.Span("Benefit modeling"),
                        html.Span("Scenario simulator"),
                        html.Span("Payout gap analysis"),
                    ],
                ),
            ],
        ),
        html.Div(
            className="columns",
            children=[
                html.Div(
                    className="panel",
                    children=[
                        html.H2("Model Builder"),
                        html.Label("Select model"),
                        dcc.Dropdown(id="model-select"),
                        html.Div(
                            className="field-stack",
                            children=[
                                html.Label("New model name"),
                                dcc.Input(id="model-name", type="text"),
                                html.Label("Notes"),
                                dcc.Textarea(id="model-notes", className="textarea", value=""),
                                html.Button("Create Model", id="create-model"),
                                html.Div(id="model-status", className="status"),
                            ],
                        ),
                        html.H3("Benefit Line"),
                        html.Div(
                            className="field-stack",
                            children=[
                                html.Label("Benefit type"),
                                dcc.Dropdown(
                                    id="line-type",
                                    options=[{"label": t, "value": t} for t in BENEFIT_TYPES],
                                    value="ER",
                                ),
                                html.Label("Amount"),
                                dcc.Input(id="line-amount", type="number", value=200),
                                html.Label("Unit"),
                                dcc.Dropdown(
                                    id="line-unit",
                                    options=[{"label": u, "value": u} for u in UNITS],
                                    value="per_visit",
                                ),
                                html.Label("Max units"),
                                dcc.Input(id="line-max", type="number", value=2),
                                html.Label("Waiting days"),
                                dcc.Input(id="line-wait", type="number", value=0),
                                dcc.Checklist(
                                    id="line-enabled",
                                    options=[{"label": "Enabled", "value": "yes"}],
                                    value=["yes"],
                                ),
                                html.Button("Add Line", id="add-line"),
                                html.Div(id="line-status", className="status"),
                            ],
                        ),
                        html.Div(id="line-table"),
                    ],
                ),
                html.Div(
                    className="panel",
                    children=[
                        html.H2("Scenario Builder"),
                        html.Label("Scenario"),
                        dcc.Dropdown(id="scenario-select"),
                        html.Div(
                            className="field-stack",
                            children=[
                                html.Label("Scenario name"),
                                dcc.Input(id="scenario-name", type="text"),
                                *[
                                    html.Div(
                                        className="field-row",
                                        children=[
                                            html.Label(label),
                                            dcc.Input(id=field, type="number", value=0),
                                        ],
                                    )
                                    for field, label in SCENARIO_FIELDS
                                ],
                                html.Label("What-if: Hospital days"),
                                dcc.Slider(
                                    id="whatif-hosp",
                                    min=0,
                                    max=30,
                                    value=0,
                                    marks={0: "0", 10: "10", 20: "20", 30: "30"},
                                ),
                                html.Button("Save Scenario", id="save-scenario"),
                                html.Button("Run Scenario", id="run-scenario"),
                                html.Div(id="scenario-status", className="status"),
                            ],
                        ),
                    ],
                ),
                html.Div(
                    className="panel",
                    children=[
                        html.H2("Results"),
                        html.Div(
                            className="summary",
                            children=[
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Total Payout"), html.P(id="total-payout")],
                                ),
                                html.Div(
                                    className="summary-card",
                                    children=[html.H4("Gap"), html.P(id="total-gap")],
                                ),
                            ],
                        ),
                        dcc.Graph(id="payout-chart"),
                        html.Div(id="result-table"),
                        html.Button("Download CSV", id="export-csv"),
                        dcc.Download(id="download-csv"),
                    ],
                ),
            ],
        ),
        dcc.Store(id="results-store"),
    ],
)


@app.callback(
    Output("model-select", "options"),
    Output("model-select", "value"),
    Input("model-status", "children"),
)
def refresh_models(_):
    try:
        models = list_models()
    except Exception:
        return [], None
    options = [{"label": name, "value": model_id} for model_id, name in models]
    default = options[0]["value"] if options else None
    return options, default


@app.callback(
    Output("model-status", "children"),
    Input("create-model", "n_clicks"),
    State("model-name", "value"),
    State("model-notes", "value"),
)
def handle_model_create(n_clicks, name, notes):
    if not n_clicks:
        return ""
    if not name:
        return "Model name is required."
    try:
        ensure_schema()
        model_id = create_model(name, notes or "")
        return f"Model created: {model_id}"
    except Exception as exc:
        return f"Error: {exc}"


@app.callback(
    Output("line-table", "children"),
    Input("model-select", "value"),
    Input("line-status", "children"),
)
def refresh_lines(model_id, _):
    if not model_id:
        return "Select a model to view lines."
    try:
        df = list_lines(model_id)
    except Exception as exc:
        return f"Error: {exc}"
    if df.empty:
        return "No benefit lines yet."
    table = html.Table(
        className="table",
        children=[
            html.Thead(
                html.Tr(
                    [
                        html.Th("Type"),
                        html.Th("Amount"),
                        html.Th("Unit"),
                        html.Th("Max"),
                        html.Th("Wait"),
                        html.Th("Enabled"),
                    ]
                )
            ),
            html.Tbody(
                [
                    html.Tr(
                        [
                            html.Td(row["benefit_type"]),
                            html.Td(f"${row['amount']:.2f}"),
                            html.Td(row["unit"]),
                            html.Td(row["max_units"]),
                            html.Td(row["waiting_days"]),
                            html.Td("Yes" if row["is_enabled"] else "No"),
                        ]
                    )
                    for _, row in df.iterrows()
                ]
            ),
        ],
    )
    return table


@app.callback(
    Output("line-status", "children"),
    Input("add-line", "n_clicks"),
    State("model-select", "value"),
    State("line-type", "value"),
    State("line-amount", "value"),
    State("line-unit", "value"),
    State("line-max", "value"),
    State("line-wait", "value"),
    State("line-enabled", "value"),
)
def handle_add_line(n_clicks, model_id, benefit_type, amount, unit, max_units, wait, enabled):
    if not n_clicks:
        return ""
    if not model_id:
        return "Select a model first."
    if amount is None:
        return "Amount is required."
    if max_units is None:
        return "Max units required."
    if amount > 100000 or max_units > 365:
        return "Guardrails: amount or max units too high."
    payload = {
        "benefit_type": benefit_type,
        "amount": float(amount),
        "unit": unit,
        "max_units": int(max_units),
        "waiting_days": int(wait or 0),
        "is_enabled": "yes" in (enabled or []),
    }
    try:
        ensure_schema()
        add_line(model_id, payload)
        return "Line added."
    except Exception as exc:
        return f"Error: {exc}"


@app.callback(
    Output("scenario-select", "options"),
    Input("model-select", "value"),
    Input("scenario-status", "children"),
)
def refresh_scenarios(model_id, _):
    if not model_id:
        return []
    try:
        scenarios = list_scenarios(model_id)
    except Exception:
        return []
    return [{"label": name, "value": sid} for sid, name in scenarios]


@app.callback(
    [Output(field, "value") for field, _ in SCENARIO_FIELDS],
    Output("scenario-name", "value"),
    Input("scenario-select", "value"),
)
def load_scenario_inputs(scenario_id):
    if not scenario_id:
        return [0] * len(SCENARIO_FIELDS) + [""]
    try:
        data = load_scenario(scenario_id)
    except Exception:
        return [0] * len(SCENARIO_FIELDS) + [""]
    values = [data.get(field, 0) for field, _ in SCENARIO_FIELDS]
    name = data.get("name", "")
    return values + [name]


@app.callback(
    Output("scenario-status", "children"),
    Input("save-scenario", "n_clicks"),
    State("model-select", "value"),
    State("scenario-name", "value"),
    [State(field, "value") for field, _ in SCENARIO_FIELDS],
)
def handle_save_scenario(n_clicks, model_id, name, *values):
    if not n_clicks:
        return ""
    if not model_id:
        return "Select a model first."
    if not name:
        return "Scenario name required."
    payload = {field: value or 0 for (field, _), value in zip(SCENARIO_FIELDS, values)}
    payload["name"] = name
    try:
        ensure_schema()
        scenario_id = save_scenario(model_id, name, payload)
        return f"Scenario saved: {scenario_id}"
    except Exception as exc:
        return f"Error: {exc}"


@app.callback(
    Output("results-store", "data"),
    Output("total-payout", "children"),
    Output("total-gap", "children"),
    Output("payout-chart", "figure"),
    Output("result-table", "children"),
    Input("run-scenario", "n_clicks"),
    State("model-select", "value"),
    State("whatif-hosp", "value"),
    [State(field, "value") for field, _ in SCENARIO_FIELDS],
)
def run_model(n_clicks, model_id, whatif_hosp, *values):
    if not n_clicks:
        empty_fig = px.bar(title="Payout by Benefit")
        return None, "$0", "$0", empty_fig, ""
    if not model_id:
        empty_fig = px.bar(title="Payout by Benefit")
        return None, "$0", "$0", empty_fig, "Select a model first."
    scenario = {field: value or 0 for (field, _), value in zip(SCENARIO_FIELDS, values)}
    if whatif_hosp:
        scenario["hospital_days"] = whatif_hosp
    try:
        lines = list_lines(model_id)
        results = run_simulation(lines, scenario)
    except Exception as exc:
        empty_fig = px.bar(title="Payout by Benefit")
        return None, "$0", "$0", empty_fig, f"Error: {exc}"

    total = results["payout"].sum() if not results.empty else 0
    estimated = float(scenario.get("estimated_bills", 0) or 0)
    gap = max(estimated - total, 0) if estimated else 0

    if results.empty:
        fig = px.bar(title="Payout by Benefit")
    else:
        fig = px.bar(results, x="benefit_type", y="payout", title="Payout by Benefit")
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
            font_color="#eef1f6",
        )

    table = html.Table(
        className="table",
        children=[
            html.Thead(
                html.Tr(
                    [
                        html.Th("Benefit"),
                        html.Th("Eligible"),
                        html.Th("Paid"),
                        html.Th("Amount"),
                        html.Th("Payout"),
                    ]
                )
            ),
            html.Tbody(
                [
                    html.Tr(
                        [
                            html.Td(row["benefit_type"]),
                            html.Td(row["eligible_units"]),
                            html.Td(row["paid_units"]),
                            html.Td(f"${row['amount']:.2f}"),
                            html.Td(f"${row['payout']:.2f}"),
                        ]
                    )
                    for _, row in results.iterrows()
                ]
            ),
        ],
    )

    return (
        results.to_dict("records"),
        f"${total:,.2f}",
        f"${gap:,.2f}",
        fig,
        table,
    )


@app.callback(
    Output("download-csv", "data"),
    Input("export-csv", "n_clicks"),
    State("results-store", "data"),
    prevent_initial_call=True,
)
def export_csv(n_clicks, data):
    if not data:
        return None
    df = pd.DataFrame(data)
    return dcc.send_data_frame(df.to_csv, "claimscope-results.csv", index=False)


if __name__ == "__main__":
    app.run_server(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8506)))
