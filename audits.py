import json
import re
from typing import Dict, List, Tuple

from db import get_conn


def _rows(query: str, params=None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or [])
            return cur.fetchall()


def missing_summary() -> List[Tuple]:
    return _rows("select id, title from exhibits where summary = ''")


def missing_body() -> List[Tuple]:
    return _rows("select id, title from exhibits where body = ''")


def empty_tags() -> List[Tuple]:
    return _rows("select id, title from exhibits where tags = '{}'::text[]")


def duplicate_slugs() -> List[Tuple]:
    return _rows(
        """
        select hall_id, slug, count(*) as count
        from exhibits
        group by hall_id, slug
        having count(*) > 1
        """
    )


def invalid_images() -> List[Tuple]:
    rows = _rows("select id, images from exhibits")
    invalid = []
    for row in rows:
        images = row[1] or []
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except json.JSONDecodeError:
                invalid.append((row[0], "invalid json"))
                continue
        if not isinstance(images, list):
            invalid.append((row[0], "not array"))
            continue
        for image in images:
            if not isinstance(image, str) or not re.match(r"^https?://", image):
                invalid.append((row[0], image))
                break
    return invalid
