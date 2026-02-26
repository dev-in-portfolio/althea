import datetime
import re
from typing import Optional


_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_iso_date(value: Optional[str]) -> Optional[datetime.date]:
    if not value:
        return None
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return None
    try:
        return datetime.date.fromisoformat(value)
    except ValueError:
        return None


def today_utc() -> datetime.date:
    return datetime.datetime.utcnow().date()


def normalize_text(value: str) -> str:
    return value.lower()
