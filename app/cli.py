import argparse
import json

from .normalizer import normalize_value
from .schema_store import validate_schema
from .validator import validate_value


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser(description="SchemaGate local validator")
    parser.add_argument("--schema", required=True, help="Path to schema JSON")
    parser.add_argument("--payload", required=True, help="Path to payload JSON")
    parser.add_argument("--strict", action="store_true", help="Treat unknown keys as errors")
    parser.add_argument("--normalize", action="store_true", help="Normalize payload before validate")
    args = parser.parse_args()

    schema = load_json(args.schema)
    payload = load_json(args.payload)

    schema_errors = validate_schema(schema, path="$")
    if schema_errors:
        print(json.dumps({"ok": False, "errors": schema_errors}, indent=2))
        raise SystemExit(1)

    if args.normalize:
        normalized, errors, warnings = normalize_value(payload, schema, "/", 0, 40, args.strict)
        val_errors, val_warnings = validate_value(normalized, schema, "/", 0, 40, args.strict)
        errors.extend(val_errors)
        warnings.extend(val_warnings)
    else:
        errors, warnings = validate_value(payload, schema, "/", 0, 40, args.strict)
        normalized = payload

    ok = len(errors) == 0
    print(json.dumps({"ok": ok, "errors": errors, "warnings": warnings, "normalized": normalized}, indent=2))
    raise SystemExit(0 if ok else 2)


if __name__ == "__main__":
    main()
