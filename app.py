import os
import streamlit as st
import pandas as pd

from audits import duplicate_slugs, empty_tags, invalid_images, missing_body, missing_summary
from db import (
    create_hall,
    create_wing,
    get_database_url,
    list_exhibits,
    list_halls,
    list_wings,
    slugify,
    upsert_exhibit,
)
from exporters import export_csv, export_json_tree
from importers import import_csv, import_json


st.set_page_config(page_title="HallMap Studio", layout="wide")
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


st.title("HallMap Studio")
st.caption("Hierarchy editor for Wings → Halls → Exhibits with audits and bulk import.")

if not gate():
    st.stop()

if not get_database_url():
    st.error("DATABASE_URL is not set. Add it to .streamlit/secrets.toml or env.")
    st.stop()

tab_editor, tab_import, tab_audits, tab_export = st.tabs(
    ["Editor", "Import", "Audits", "Export"]
)

with tab_editor:
    st.subheader("Hierarchy Editor")
    cols = st.columns([1, 1, 2])
    with cols[0]:
        st.markdown("#### Wings")
        wings = list_wings()
        wing_names = [w[1] for w in wings]
        wing_select = st.selectbox("Select wing", wing_names) if wings else None
        wing_name = st.text_input("New wing name")
        if st.button("Add wing") and wing_name:
            create_wing(wing_name, slugify(wing_name))
            st.success("Wing created.")
            st.experimental_rerun()

    with cols[1]:
        st.markdown("#### Halls")
        wing_id = None
        if wing_select:
            wing_id = next(w[0] for w in wings if w[1] == wing_select)
            halls = list_halls(wing_id)
            hall_names = [h[1] for h in halls]
            hall_select = st.selectbox("Select hall", hall_names) if halls else None
            hall_name = st.text_input("New hall name")
            if st.button("Add hall") and hall_name:
                create_hall(wing_id, hall_name, slugify(hall_name))
                st.success("Hall created.")
                st.experimental_rerun()
        else:
            st.info("Select a wing first.")

    with cols[2]:
        st.markdown("#### Exhibits")
        if wing_select and hall_select:
            hall_id = next(h[0] for h in halls if h[1] == hall_select)
            exhibits = list_exhibits(hall_id)
            if exhibits:
                df = pd.DataFrame(
                    exhibits, columns=["id", "title", "slug", "summary", "tags", "body", "images"]
                )
                st.dataframe(df[["title", "slug", "summary"]], use_container_width=True)
                selected_id = st.selectbox("Edit exhibit", df["id"].tolist())
                selected = df[df["id"] == selected_id].iloc[0]
            else:
                selected = None
                selected_id = None

            st.markdown("##### Exhibit Editor")
            title = st.text_input("Title", value=selected["title"] if selected is not None else "")
            slug = st.text_input("Slug", value=selected["slug"] if selected is not None else "")
            summary = st.text_area("Summary", value=selected["summary"] if selected is not None else "")
            tags = st.text_input(
                "Tags (pipe separated)",
                value="|".join(selected["tags"]) if selected is not None else "",
            )
            body = st.text_area("Body", value=selected["body"] if selected is not None else "")
            images = st.text_area(
                "Images (JSON array or pipe separated URLs)",
                value="|".join(selected["images"]) if selected is not None else "",
            )
            if st.button("Commit exhibit"):
                try:
                    tags_list = [t.strip() for t in tags.split("|") if t.strip()]
                    if images.strip().startswith("["):
                        import json
                        images_list = json.loads(images)
                    else:
                        images_list = [i.strip() for i in images.split("|") if i.strip()]
                    upsert_exhibit(
                        hall_id,
                        title,
                        slug or slugify(title),
                        summary,
                        tags_list,
                        body,
                        images_list,
                    )
                    st.success("Exhibit saved.")
                except Exception as exc:  # noqa: BLE001
                    st.error(str(exc))
        else:
            st.info("Select a hall to edit exhibits.")

with tab_import:
    st.subheader("Bulk Import")
    mode = st.radio("Import format", ["CSV", "JSON"])
    strict = st.checkbox("Strict mode (fail on first error)", value=False)
    uploaded = st.file_uploader("Upload file", type=["csv", "json"])
    if uploaded and st.button("Preview + Import"):
        try:
            if mode == "CSV":
                errors = import_csv(uploaded.getvalue(), strict)
            else:
                errors = import_json(uploaded.getvalue(), strict)
            if errors:
                st.warning("Import completed with warnings.")
                st.write(errors)
            else:
                st.success("Import completed successfully.")
        except Exception as exc:  # noqa: BLE001
            st.error(str(exc))

with tab_audits:
    st.subheader("Integrity Checks")
    st.write("Missing summary:", missing_summary())
    st.write("Missing body:", missing_body())
    st.write("Empty tags:", empty_tags())
    st.write("Duplicate slugs:", duplicate_slugs())
    st.write("Invalid images:", invalid_images())

with tab_export:
    st.subheader("Export")
    wings = list_wings()
    wing_names = [w[1] for w in wings]
    wing_select = st.selectbox("Export wing", wing_names) if wings else None
    if wing_select:
        wing_id = next(w[0] for w in wings if w[1] == wing_select)
        import json
        json_tree = export_json_tree(wing_id)
        st.download_button(
            "Download JSON tree",
            data=json.dumps(json_tree, indent=2),
            file_name=f"{wing_select}.json",
        )

    st.markdown("#### Export Hall CSV")
    if wings:
        wing_id = next(w[0] for w in wings if w[1] == wing_select) if wing_select else wings[0][0]
        halls = list_halls(wing_id)
        hall_names = [h[1] for h in halls]
        hall_select = st.selectbox("Hall", hall_names) if halls else None
        if hall_select:
            hall_id = next(h[0] for h in halls if h[1] == hall_select)
            csv_data = export_csv(hall_id)
            st.download_button("Download Hall CSV", csv_data, file_name=f"{hall_select}.csv")
