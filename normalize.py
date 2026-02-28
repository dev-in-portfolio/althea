import re


def normalize_address(address: str) -> str:
    if not address:
        return ""
    cleaned = address.upper().strip()
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned
