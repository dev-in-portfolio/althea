import re
from typing import Dict, List, Tuple

from normalize import normalize_address


def qa_flags(rows: List[Dict[str, str]]) -> Dict[str, int]:
    flags = {
        "missing_address": 0,
        "missing_city": 0,
        "missing_state": 0,
        "missing_zip": 0,
        "missing_latlon": 0,
        "po_boxes": 0,
        "intersections": 0,
        "too_short": 0,
    }
    for row in rows:
        address = row.get("address", "")
        if not address.strip():
            flags["missing_address"] += 1
        if not row.get("city", "").strip():
            flags["missing_city"] += 1
        if not row.get("state", "").strip():
            flags["missing_state"] += 1
        if not row.get("zip", "").strip():
            flags["missing_zip"] += 1
        if row.get("lat") is None or row.get("lon") is None:
            flags["missing_latlon"] += 1
        if re.search(r"\bP\.?O\.?\b", address, flags=re.I):
            flags["po_boxes"] += 1
        if "&" in address or " AND " in address.upper():
            flags["intersections"] += 1
        if len(address.strip()) < 6:
            flags["too_short"] += 1
    return flags


def duplicate_addresses(rows: List[Dict[str, str]]) -> List[Tuple[str, int]]:
    counts: Dict[str, int] = {}
    for row in rows:
        norm = normalize_address(row.get("address", ""))
        if not norm:
            continue
        counts[norm] = counts.get(norm, 0) + 1
    return sorted([(k, v) for k, v in counts.items() if v > 1], key=lambda x: -x[1])

