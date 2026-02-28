import csv
import io
import json
from typing import Dict, List

from db import get_conn


def export_json_tree(wing_id: str) -> Dict:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("select id, name, slug from wings where id = %s", [wing_id])
            wing = cur.fetchone()
            cur.execute(
                "select id, name, slug from halls where wing_id = %s order by name",
                [wing_id],
            )
            halls = cur.fetchall()
            tree = {"id": wing[0], "name": wing[1], "slug": wing[2], "halls": []}
            for hall in halls:
                cur.execute(
                    "select title, slug, summary, tags, body, images from exhibits where hall_id = %s",
                    [hall[0]],
                )
                exhibits = [
                    {
                        "title": r[0],
                        "slug": r[1],
                        "summary": r[2],
                        "tags": r[3],
                        "body": r[4],
                        "images": r[5],
                    }
                    for r in cur.fetchall()
                ]
                tree["halls"].append(
                    {"id": hall[0], "name": hall[1], "slug": hall[2], "exhibits": exhibits}
                )
            return tree


def export_csv(hall_id: str) -> str:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select title, slug, summary, tags, body, images from exhibits where hall_id = %s",
                [hall_id],
            )
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["title", "slug", "summary", "tags", "body", "images"])
            for row in cur.fetchall():
                writer.writerow(row)
            return output.getvalue()
