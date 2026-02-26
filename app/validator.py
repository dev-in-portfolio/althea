import json
import re
from typing import Any, Dict, List, Tuple


def _error(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def _warn(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def _path_join(base: str, key: str) -> str:
    return f"{base}{key if base.endswith('/') else '/' + key}"


def validate_value(
    value: Any,
    schema: Dict[str, Any],
    path: str,
    depth: int,
    max_depth: int,
    strict: bool,
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    if depth > max_depth:
        return [_error(path, "depth", "Maximum depth exceeded")], []

    errors: List[Dict[str, str]] = []
    warnings: List[Dict[str, str]] = []

    if value is None and schema.get("nullable"):
        return errors, warnings

    schema_type = schema.get("type")

    if "enum" in schema:
        if value not in schema.get("enum", []):
            errors.append(_error(path, "enum", "Value not in enum"))
            return errors, warnings

    if schema_type == "object":
        if not isinstance(value, dict):
            return [_error(path, "type", "Expected object")], warnings
        required = schema.get("required", []) or []
        properties = schema.get("properties", {}) or {}
        additional = schema.get("additionalProperties", True)

        min_props = schema.get("minProperties")
        max_props = schema.get("maxProperties")
        if isinstance(min_props, int) and len(value) < min_props:
            errors.append(_error(path, "minProperties", f"Must have at least {min_props} properties"))
        if isinstance(max_props, int) and len(value) > max_props:
            errors.append(_error(path, "maxProperties", f"Must have at most {max_props} properties"))

        for key in required:
            if key not in value:
                errors.append(_error(_path_join(path, key), "required", "Missing required field"))

        for key, val in value.items():
            if key in properties:
                sub_errors, sub_warnings = validate_value(
                    val,
                    properties[key],
                    _path_join(path, key),
                    depth + 1,
                    max_depth,
                    strict,
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
            else:
                if additional is False or strict:
                    errors.append(_error(_path_join(path, key), "additionalProperties", "Unknown field"))
                else:
                    warnings.append(_warn(_path_join(path, key), "additionalProperties", "Unknown field"))
        return errors, warnings

    if schema_type == "array":
        if not isinstance(value, list):
            return [_error(path, "type", "Expected array")], warnings
        min_items = schema.get("minItems")
        max_items = schema.get("maxItems")
        if isinstance(min_items, int) and len(value) < min_items:
            errors.append(_error(path, "minItems", f"Must have at least {min_items} items"))
        if isinstance(max_items, int) and len(value) > max_items:
            errors.append(_error(path, "maxItems", f"Must have at most {max_items} items"))
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for idx, item in enumerate(value):
                sub_errors, sub_warnings = validate_value(
                    item,
                    item_schema,
                    _path_join(path, str(idx)),
                    depth + 1,
                    max_depth,
                    strict,
                )
                errors.extend(sub_errors)
                warnings.extend(sub_warnings)
        if schema.get("uniqueItems"):
            seen = set()
            for item in value:
                marker = json.dumps(item, sort_keys=True, separators=(",", ":"))
                if marker in seen:
                    errors.append(_error(path, "uniqueItems", "Array items must be unique"))
                    break
                seen.add(marker)
        return errors, warnings

    if schema_type == "string":
        if not isinstance(value, str):
            return [_error(path, "type", "Expected string")], warnings
        trimmed = value.strip() if schema.get("trim") else value
        min_len = schema.get("minLength")
        max_len = schema.get("maxLength")
        if isinstance(min_len, int) and len(trimmed) < min_len:
            errors.append(_error(path, "minLength", f"Must be at least {min_len} characters"))
        if isinstance(max_len, int) and len(trimmed) > max_len:
            errors.append(_error(path, "maxLength", f"Must be at most {max_len} characters"))
        pattern = schema.get("pattern")
        if isinstance(pattern, str):
            if not re.search(pattern, trimmed):
                errors.append(_error(path, "pattern", "Does not match pattern"))
        return errors, warnings

    if schema_type == "int":
        if not isinstance(value, int) or isinstance(value, bool):
            return [_error(path, "type", "Expected int")], warnings
        min_val = schema.get("min")
        max_val = schema.get("max")
        if isinstance(min_val, (int, float)) and value < min_val:
            errors.append(_error(path, "min", f"Must be >= {min_val}"))
        if isinstance(max_val, (int, float)) and value > max_val:
            errors.append(_error(path, "max", f"Must be <= {max_val}"))
        return errors, warnings

    if schema_type == "float":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            return [_error(path, "type", "Expected float")], warnings
        min_val = schema.get("min")
        max_val = schema.get("max")
        if isinstance(min_val, (int, float)) and value < min_val:
            errors.append(_error(path, "min", f"Must be >= {min_val}"))
        if isinstance(max_val, (int, float)) and value > max_val:
            errors.append(_error(path, "max", f"Must be <= {max_val}"))
        return errors, warnings

    if schema_type == "bool":
        if not isinstance(value, bool):
            return [_error(path, "type", "Expected bool")], warnings
        return errors, warnings

    return errors, warnings
