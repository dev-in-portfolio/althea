from typing import Any, Dict, List, Tuple

from .utils import clone_default, is_float_string, is_int_string, parse_bool_string


def _error(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def normalize_value(
    value: Any,
    schema: Dict[str, Any],
    path: str,
    depth: int,
    max_depth: int,
) -> Tuple[Any, List[Dict[str, str]]]:
    if depth > max_depth:
        return value, [_error(path, "depth", "Maximum depth exceeded")]

    errors: List[Dict[str, str]] = []
    schema_type = schema.get("type")

    if schema_type == "object":
        if not isinstance(value, dict):
            return value, [_error(path, "type", "Expected object")]
        props = schema.get("properties", {}) or {}
        required = schema.get("required", []) or []
        additional = schema.get("additionalProperties", True)

        output: Dict[str, Any] = {}

        for key in required:
            if key not in value:
                subschema = props.get(key)
                if not (isinstance(subschema, dict) and "default" in subschema):
                    errors.append(
                        _error(
                            f"{path}{key if path.endswith('/') else '/' + key}",
                            "required",
                            "Missing required field",
                        )
                    )

        for key, subschema in props.items():
            if key in value:
                norm_val, sub_errors = normalize_value(
                    value[key],
                    subschema,
                    f"{path}{key if path.endswith('/') else '/' + key}",
                    depth + 1,
                    max_depth,
                )
                output[key] = norm_val
                errors.extend(sub_errors)
            else:
                if "default" in subschema:
                    output[key] = clone_default(subschema["default"])

        for key, val in value.items():
            if key in props:
                continue
            if additional is False:
                errors.append(_error(f"{path}{key if path.endswith('/') else '/' + key}", "additionalProperties", "Unknown field"))
            else:
                output[key] = val

        return output, errors

    if schema_type == "array":
        if not isinstance(value, list):
            return value, [_error(path, "type", "Expected array")]
        item_schema = schema.get("items")
        output = []
        for idx, item in enumerate(value):
            if isinstance(item_schema, dict):
                norm_item, sub_errors = normalize_value(
                    item,
                    item_schema,
                    f"{path}{idx if path.endswith('/') else '/' + str(idx)}",
                    depth + 1,
                    max_depth,
                )
                output.append(norm_item)
                errors.extend(sub_errors)
            else:
                output.append(item)
        return output, errors

    if schema_type == "string":
        if not isinstance(value, str):
            return value, [_error(path, "type", "Expected string")]
        if schema.get("trim"):
            value = value.strip()
        return value, errors

    if schema_type == "int":
        if isinstance(value, bool):
            return value, [_error(path, "type", "Expected int")]
        if isinstance(value, int):
            return value, errors
        if isinstance(value, str) and is_int_string(value):
            return int(value), errors
        return value, [_error(path, "type", "Expected int")]

    if schema_type == "float":
        if isinstance(value, bool):
            return value, [_error(path, "type", "Expected float")]
        if isinstance(value, (int, float)):
            return float(value), errors
        if isinstance(value, str) and is_float_string(value):
            return float(value), errors
        return value, [_error(path, "type", "Expected float")]

    if schema_type == "bool":
        if isinstance(value, bool):
            return value, errors
        if isinstance(value, str):
            parsed = parse_bool_string(value)
            if parsed is not None:
                return parsed, errors
        return value, [_error(path, "type", "Expected bool")]

    return value, errors
