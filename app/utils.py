import copy
import json
import re
from typing import Any


_INT_RE = re.compile(r"^-?\d+$")
_FLOAT_RE = re.compile(r"^-?\d+(\.\d+)?$")


def clone_default(value: Any) -> Any:
    return copy.deepcopy(value)


def is_int_string(value: str) -> bool:
    return bool(_INT_RE.match(value))


def is_float_string(value: str) -> bool:
    return bool(_FLOAT_RE.match(value))


def parse_bool_string(value: str):
    lowered = value.strip().lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    return None


def json_dumps(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
