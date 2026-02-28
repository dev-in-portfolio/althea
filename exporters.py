import csv
import io
from typing import List, Dict

from scoring import score_bucket, score_stop


def export_csv(rows: List[Dict[str, str]]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["name", "address", "city", "state", "zip", "lat", "lon", "notes", "source"],
    )
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return output.getvalue()


def export_duplicates(dupes):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["normalized_address", "count"])
    for addr, count in dupes:
        writer.writerow([addr, count])
    return output.getvalue()


def export_review(rows: List[Dict[str, str]]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["name", "address", "city", "state", "zip", "lat", "lon", "notes", "source", "score", "bucket"],
    )
    writer.writeheader()
    for row in rows:
        score = score_stop(row)
        writer.writerow({**row, "score": score, "bucket": score_bucket(score)})
    return output.getvalue()
