import os
import streamlit as st
import pandas as pd

from db import create_dataset, insert_stops, list_datasets, list_stops, update_stop
from exporters import export_csv, export_duplicates, export_review
from normalize import normalize_address
from qa import qa_flags, duplicate_addresses
from scoring import score_bucket, score_stop


st.set_page_config(page_title="RouteForge Console", layout="wide")
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


st.title("RouteForge Console")
st.caption("QA + scoring console for routing datasets.")

if not gate():
    st.stop()

datasets = list_datasets()
dataset_names = [d[1] for d in datasets]
dataset = st.sidebar.selectbox("Dataset", dataset_names) if datasets else None
dataset_id = next((d[0] for d in datasets if d[1] == dataset), None)

tab_ds, tab_import, tab_qa, tab_review, tab_export = st.tabs(
    ["Datasets", "Import", "QA Dashboard", "Review Queue", "Export"]
)

with tab_ds:
    st.subheader("Datasets")
    name = st.text_input("New dataset name")
    if st.button("Create dataset") and name:
        create_dataset(name)
        st.success("Dataset created.")
        st.experimental_rerun()
    if dataset:
        st.write(f"Active dataset: **{dataset}**")

with tab_import:
    st.subheader("Import CSV")
    if not dataset_id:
        st.info("Create or select a dataset first.")
    else:
        uploaded = st.file_uploader("CSV file", type=["csv"])
        if uploaded and st.button("Import now"):
            df = pd.read_csv(uploaded)
            df = df.fillna("")
            rows = df.to_dict(orient="records")
            insert_stops(dataset_id, rows)
            st.success(f"Imported {len(rows)} rows.")

with tab_qa:
    st.subheader("QA Dashboard")
    if not dataset_id:
        st.info("Select a dataset.")
    else:
        rows = [
            dict(
                zip(
                    ["id", "name", "address", "city", "state", "zip", "lat", "lon", "notes", "source"],
                    r,
                )
            )
            for r in list_stops(dataset_id)
        ]
        flags = qa_flags(rows)
        st.json(flags)
        dupes = duplicate_addresses(rows)
        st.write(f"Duplicate addresses: {len(dupes)}")
        if dupes:
            st.dataframe(pd.DataFrame(dupes, columns=["normalized_address", "count"]))

with tab_review:
    st.subheader("Review Queue")
    if not dataset_id:
        st.info("Select a dataset.")
    else:
        rows = [
            dict(
                zip(
                    ["id", "name", "address", "city", "state", "zip", "lat", "lon", "notes", "source"],
                    r,
                )
            )
            for r in list_stops(dataset_id)
        ]
        scored = []
        for row in rows:
            score = score_stop(row)
            scored.append({**row, "score": score, "bucket": score_bucket(score)})
        df = pd.DataFrame(scored)
        review = df[df["bucket"] == "Needs review"]
        st.dataframe(review, use_container_width=True)
        if not review.empty:
            selected = st.selectbox("Select stop to edit", review["id"].tolist())
            row = review[review["id"] == selected].iloc[0]
            city = st.text_input("City", row["city"])
            state = st.text_input("State", row["state"])
            zip_code = st.text_input("ZIP", row["zip"])
            notes = st.text_area("Notes", row["notes"])
            if st.button("Commit changes"):
                update_stop(selected, {"city": city, "state": state, "zip": zip_code, "notes": notes})
                st.success("Saved.")

with tab_export:
    st.subheader("Export")
    if not dataset_id:
        st.info("Select a dataset.")
    else:
        rows = [
            dict(
                zip(
                    ["id", "name", "address", "city", "state", "zip", "lat", "lon", "notes", "source"],
                    r,
                )
            )
            for r in list_stops(dataset_id)
        ]
        st.download_button("Download cleaned CSV", export_csv(rows), file_name="cleaned.csv")
        dupes = duplicate_addresses(rows)
        st.download_button("Download duplicates report", export_duplicates(dupes), file_name="duplicates.csv")
        st.download_button("Download needs-review CSV", export_review(rows), file_name="needs_review.csv")
