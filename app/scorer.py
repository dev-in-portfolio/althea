import datetime
from typing import Dict, List, Tuple

from .models import Item, RulePack
from .utils import normalize_text, parse_iso_date, today_utc


def _cap_matches(matches: List[str], cap: int = 5) -> List[str]:
    return matches[:cap]


def _match_keywords(text: str, keywords: List[str]) -> List[str]:
    if not text or not keywords:
        return []
    lowered = normalize_text(text)
    matches = []
    for keyword in keywords:
        if keyword and keyword.lower() in lowered:
            matches.append(keyword)
    return list(dict.fromkeys(matches))


def _due_boost(due: datetime.date, now: datetime.date, weight: float) -> Tuple[float, str]:
    delta_days = (due - now).days
    if delta_days <= 0:
        return weight, f"due in {delta_days} days"
    if delta_days <= 3:
        return weight * 0.75, f"due in {delta_days} days"
    if delta_days <= 7:
        return weight * 0.5, f"due in {delta_days} days"
    return 0.0, f"due in {delta_days} days"


def score_items(items: List[Item], rules: RulePack) -> List[Dict[str, object]]:
    now = parse_iso_date(rules.now) if rules.now else today_utc()
    weights = rules.weights

    ranked = []
    for item in items:
        breakdown: List[Dict[str, object]] = []
        score = 0.0

        tags = item.tags or []
        prefer_matches = _cap_matches([t for t in tags if t in rules.preferTags])
        if prefer_matches:
            delta = len(prefer_matches) * weights.tagBoost
            score += delta
            breakdown.append(
                {"rule": "preferTag", "delta": delta, "detail": f"matched {', '.join(prefer_matches)}"}
            )

        avoid_matches = _cap_matches([t for t in tags if t in rules.avoidTags])
        if avoid_matches:
            delta = len(avoid_matches) * weights.tagBoost
            score -= delta
            breakdown.append(
                {"rule": "avoidTag", "delta": -delta, "detail": f"matched {', '.join(avoid_matches)}"}
            )

        if item.due:
            due = parse_iso_date(item.due)
            if due is None:
                raise ValueError(f"Invalid due date for item {item.id}")
            delta, detail = _due_boost(due, now, weights.dueSoonBoost)
            if delta != 0:
                score += delta
                breakdown.append({"rule": "dueSoon", "delta": delta, "detail": detail})

        if item.value is not None:
            delta = float(item.value) * weights.valueBoost
            score += delta
            breakdown.append(
                {"rule": "value", "delta": delta, "detail": f"value={item.value} * valueBoost({weights.valueBoost})"}
            )

        if item.effort is not None:
            delta = float(item.effort) * weights.effortPenalty
            score -= delta
            breakdown.append(
                {"rule": "effort", "delta": -delta, "detail": f"effort={item.effort} * effortPenalty({weights.effortPenalty})"}
            )

        text = f"{item.label} {item.notes or ''}".strip()
        prefer_keywords = _cap_matches(_match_keywords(text, rules.preferKeywords))
        if prefer_keywords:
            delta = len(prefer_keywords) * weights.keywordBoost
            score += delta
            breakdown.append(
                {"rule": "keyword", "delta": delta, "detail": f"matched {', '.join(prefer_keywords)}"}
            )

        avoid_keywords = _cap_matches(_match_keywords(text, rules.avoidKeywords))
        if avoid_keywords:
            delta = len(avoid_keywords) * weights.keywordBoost
            score -= delta
            breakdown.append(
                {"rule": "avoidKeyword", "delta": -delta, "detail": f"matched {', '.join(avoid_keywords)}"}
            )

        ranked.append(
            {
                "id": item.id,
                "label": item.label,
                "score": round(score, 4),
                "breakdown": breakdown,
            }
        )

    ranked.sort(
        key=lambda entry: (
            -entry["score"],
            entry["label"].casefold(),
            entry["id"].casefold(),
        )
    )
    return ranked
