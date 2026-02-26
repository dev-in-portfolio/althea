from typing import Dict, List


def _rule_totals(breakdown: List[Dict[str, object]]) -> Dict[str, float]:
    totals: Dict[str, float] = {}
    for entry in breakdown:
        rule = entry.get("rule")
        delta = float(entry.get("delta", 0.0))
        totals[rule] = totals.get(rule, 0.0) + delta
    return totals


def _format_reason(diff: Dict[str, float]) -> str:
    positives = sorted([(k, v) for k, v in diff.items() if v > 0], key=lambda x: -x[1])
    if not positives:
        return "tie broken by label/id"
    top = positives[:2]
    parts = [f"{name} +{value:.2f}" for name, value in top]
    return " and ".join(parts)


def build_explanations(ranked: List[Dict[str, object]], max_pairs: int, caps: Dict[str, int], resolved_now: str) -> Dict[str, object]:
    pairwise = []
    for idx in range(len(ranked) - 1):
        if len(pairwise) >= max_pairs:
            break
        above = ranked[idx]
        below = ranked[idx + 1]
        above_totals = _rule_totals(above["breakdown"])
        below_totals = _rule_totals(below["breakdown"])
        diff = {rule: above_totals.get(rule, 0.0) - below_totals.get(rule, 0.0) for rule in set(above_totals) | set(below_totals)}
        why = _format_reason(diff)
        pairwise.append({"above": above["id"], "below": below["id"], "why": why})

    return {
        "policy": "score-first, stable-tie",
        "pairwise": pairwise,
        "meta": {
            "itemCount": len(ranked),
            "rulesVersion": 1,
            "caps": caps,
            "resolvedNow": resolved_now,
        },
    }
