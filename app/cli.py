import argparse
import json

from .explain import build_explanations
from .models import JudgeRequest
from .scorer import score_items
from .utils import today_utc


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser(description="QueJudge local scorer")
    parser.add_argument("--input", required=True, help="Path to judge request JSON")
    args = parser.parse_args()

    payload = load_json(args.input)
    request = JudgeRequest.model_validate(payload)

    ranked = score_items(request.items, request.rules)
    resolved_now = request.rules.now or today_utc().isoformat()
    explanations = build_explanations(
        ranked,
        request.options.maxExplainPairs,
        request.rules.caps,
        resolved_now,
    )

    print(
        json.dumps(
            {"ranked": ranked, "explanations": explanations, "resolvedNow": resolved_now},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
