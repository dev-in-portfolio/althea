import json
from typing import Any, Dict, List

import pandas as pd

from db import bulk_resolve, run_import_batch, slugify


def parse_tags(value: str) -> List[str]:
    if not value:
        return []
    return [t.strip() for t in value.split("|") if t.strip()]


def parse_images(value: str) -> List[str]:
    if not value:
        return []
    try:
        images = json.loads(value)
        if isinstance(images, list):
            return images
    except json.JSONDecodeError:
        pass
    return [v.strip() for v in value.split("|") if v.strip()]


def normalize_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized = []
    for row in rows:
        normalized.append(
            {
                "wing": row.get("wing", "").strip(),
                "hall": row.get("hall", "").strip(),
                "title": row.get("title", "").strip(),
                "slug": row.get("slug", "").strip() or slugify(row.get("title", "")),
                "summary": row.get("summary", "").strip(),
                "tags": parse_tags(row.get("tags", "")),
                "body": row.get("body", "").strip(),
                "images": parse_images(row.get("images", "")),
            }
        )
    return normalized


def import_csv(content: bytes, strict: bool) -> List[str]:
    df = pd.read_csv(pd.io.common.BytesIO(content))
    rows = normalize_rows(df.to_dict(orient="records"))
    bulk_resolve(rows)
    return run_import_batch(rows, strict)


def import_json(content: bytes, strict: bool) -> List[str]:
    data = json.loads(content.decode("utf-8"))
    if not isinstance(data, list):
        raise ValueError("JSON must be a list of records.")
    rows = normalize_rows(data)
    bulk_resolve(rows)
    return run_import_batch(rows, strict)
