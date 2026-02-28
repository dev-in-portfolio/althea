from typing import Dict


def score_stop(row: Dict[str, str]) -> int:
    score = 0
    if row.get("address"):
        score += 50
    if row.get("city"):
        score += 15
    if row.get("state"):
        score += 15
    if row.get("zip"):
        score += 10
    if row.get("lat") is not None and row.get("lon") is not None:
        score += 10
    return score


def score_bucket(score: int) -> str:
    if score >= 90:
        return "Ready"
    if score >= 70:
        return "Needs touch-up"
    return "Needs review"
