import os
import streamlit as st
import pandas as pd

from db import (
    fetch_columns,
    fetch_indexes,
    fetch_rows,
    fetch_recent_rows,
    fetch_schema_list,
    fetch_tables,
    get_database_url,
    run_query,
)
from queries import list_queries, get_query


st.set_page_config(page_title="NeonScope", layout="wide")
st.set_option("browser.gatherUsageStats", False)


def gate() -> bool:
    passcode = os.getenv("APP_PASSCODE", "")
    if not passcode:
        st.sidebar.info("Passcode gate disabled.")
        return True
    st.sidebar.markdown("### Access Gate")
    attempt = st.sidebar.text_input("Passcode", type="password")
    if attempt != passcode:
        st.sidebar.error("Passcode required.")
        return False
    return True


st.title("NeonScope")
st.caption("Safe Postgres explorer for Neon — read-only by default.")
st.sidebar.markdown("### Runtime")
st.sidebar.write(f"Read-only: `{os.getenv('READ_ONLY', 'true')}`")

if not gate():
    st.stop()

if not get_database_url():
    st.error("DATABASE_URL is not set. Add it to .streamlit/secrets.toml or env.")
    st.stop()

tab_status, tab_schema, tab_preview, tab_queries = st.tabs(
    ["Connection", "Schema Explorer", "Data Preview", "Saved Queries"]
)

with tab_status:
    st.subheader("Connection Status")
    cols, rows = run_query("select current_database() as db, version() as version, current_schema() as schema")
    info = dict(zip(cols, rows[0])) if rows else {}
    st.json(info)

with tab_schema:
    st.subheader("Schema Explorer")
    cols, rows = fetch_schema_list()
    schemas = [r[0] for r in rows] if rows else ["public"]
    schema = st.selectbox("Schema", schemas)

    tcols, trows = fetch_tables(schema)
    if trows:
        df_tables = pd.DataFrame(trows, columns=tcols)
        st.dataframe(df_tables, use_container_width=True)
        table = st.selectbox("Select table", df_tables["tablename"].tolist())
        if table:
            ccols, crows = fetch_columns(schema, table)
            st.markdown("#### Columns")
            st.dataframe(pd.DataFrame(crows, columns=ccols), use_container_width=True)
            icols, irows = fetch_indexes(schema, table)
            st.markdown("#### Indexes")
            st.dataframe(pd.DataFrame(irows, columns=icols), use_container_width=True)
    else:
        st.info("No tables found.")

with tab_preview:
    st.subheader("Data Preview")
    cols, rows = fetch_schema_list()
    schemas = [r[0] for r in rows] if rows else ["public"]
    schema = st.selectbox("Schema for preview", schemas, key="preview-schema")
    tcols, trows = fetch_tables(schema)
    tables = [r[0] for r in trows] if trows else []
    table = st.selectbox("Table", tables, key="preview-table")
    limit = st.slider("Rows per page", 10, 200, 100)
    page = st.number_input("Page", min_value=1, value=1, step=1)
    if table:
        cols, rows = fetch_rows(schema, table, limit=limit, offset=(page - 1) * limit)
        st.dataframe(pd.DataFrame(rows, columns=cols), use_container_width=True)
        st.download_button(
            "Download CSV",
            pd.DataFrame(rows, columns=cols).to_csv(index=False).encode("utf-8"),
            file_name=f"{schema}.{table}.csv",
        )

with tab_queries:
    st.subheader("Saved Queries")
    query_name = st.selectbox("Query", list_queries())
    query = get_query(query_name)
    params = []
    for param in query.get("params", []):
        if param["type"] == "int":
            params.append(st.number_input(param["name"], value=param.get("default", 0)))
        else:
            params.append(st.text_input(param["name"], value=param.get("default", "")))
    if st.button("Run Query"):
        # special handling for table name param
        if query_name == "Recent rows (by created_at)":
            table = params[0]
            if "." not in table:
                st.error("Table must be schema.table")
            else:
                schema, table_name = table.split(".", 1)
                cols, rows = fetch_recent_rows(schema, table_name, int(params[1]))
                st.dataframe(pd.DataFrame(rows, columns=cols), use_container_width=True)
        else:
            cols, rows = run_query(query["sql"], params)
            st.dataframe(pd.DataFrame(rows, columns=cols), use_container_width=True)
            st.download_button(
                "Download CSV",
                pd.DataFrame(rows, columns=cols).to_csv(index=False).encode("utf-8"),
                file_name="query.csv",
            )
