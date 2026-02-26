from typing import Any, Dict, List, Tuple

from .utils import clone_default, is_float_string, is_int_string, parse_bool_string


def _error(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def _warn(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def _path_join(base: str, key: str) -> str:
    return f"{base}{key if base.endswith('/') else '/' + key}"


def normalize_value(
    value: Any,
    schema: Dict[str, Any],
    path: str,
    depth: int,
    max_depth: int,
    strict: bool,
) -> Tuple[Any, List[Dict[str, str]], List[Dict[str, str]]]:
    if depth > max_depth:
        return value, [_error(path, "depth", "Maximum depth exceeded")], []

    errors: List[Dict[str, str]] = []
    warnings: List[Dict[str, str]] = []

    if value is None and schema.get("nullable"):
        return value, errors, warnings

    schema_type = schema.get("type")

    if schema_type == "object":
        if not isinstance(value, dict):
            return value, [_error(path, "type", "Expected object")], warnings
        props = schema.get("properties", {}) or {}
        required = schema.get("required", []) or []
        additional = schema.get("additionalProperties", True)

        output: Dict[str, Any] = {}

        for key in required:
            if key not in value:
                subschema = props.get(key)
                if not (isinstance(subschema, dict) and "default" in subschema):
                    errors.append(_error(_path_join(path, key), "required", "Missing required field"))

        for key, subschema in props.items():
            if key in value:
                norm_val, sub_errors, sub_warnings = normalize_value(
                    value[key],
                    subschema,
                    _path_join(path, key),
                    depth + 1,
                    max_depth,
                    strict,
                )
                output[key] = norm_val
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
            else:
                if "default" in subschema:
                    output[key] = clone_default(subschema["default"])

        for key, val in value.items():
            if key in props:
                continue
            if additional is False or strict:
                errors.append(_error(_path_join(path, key), "additionalProperties", "Unknown field"))
            else:
                warnings.append(_warn(_path_join(path, key), "additionalProperties", "Unknown field"))
                output[key] = val

        return output, errors, warnings

    if schema_type == "array":
        if not isinstance(value, list):
            return value, [_error(path, "type", "Expected array")], warnings
        item_schema = schema.get("items")
        output = []
        for idx, item in enumerate(value):
            if isinstance(item_schema, dict):
                norm_item, sub_errors, sub_warnings = normalize_value(
                    item,
                    item_schema,
                    _path_join(path, str(idx)),
                    depth + 1,
                    max_depth,
                    strict,
                )
                output.append(norm_item)
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
            else:
                output.append(item)
        return output, errors, warnings

    if schema_type == "string":
        if not isinstance(value, str):
            return value, [_error(path, "type", "Expected string")], warnings
        if schema.get("trim"):
            value = value.strip()
        return value, errors, warnings

    if schema_type == "int":
        if isinstance(value, bool):
            return value, [_error(path, "type", "Expected int")], warnings
        if isinstance(value, int):
            return value, errors, warnings
        if isinstance(value, str) and is_int_string(value):
            return int(value), errors, warnings
        return value, [_error(path, "type", "Expected int")], warnings

    if schema_type == "float":
        if isinstance(value, bool):
            return value, [_error(path, "type", "Expected float")], warnings
        if isinstance(value, (int, float)):
            return float(value), errors, warnings
        if isinstance(value, str) and is_float_string(value):
            return float(value), errors, warnings
        return value, [_error(path, "type", "Expected float")], warnings

    if schema_type == "bool":
        if isinstance(value, bool):
            return value, errors, warnings
        if isinstance(value, str):
            parsed = parse_bool_string(value)
            if parsed is not None:
                return parsed, errors, warnings
        return value, [_error(path, "type", "Expected bool")], warnings

    return value, errors, warnings
