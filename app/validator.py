from typing import Any, Dict, List


def _error(path: str, code: str, message: str) -> Dict[str, str]:
    return {"path": path, "code": code, "message": message}


def validate_value(value: Any, schema: Dict[str, Any], path: str, depth: int, max_depth: int) -> List[Dict[str, str]]:
    if depth > max_depth:
        return [_error(path, "depth", "Maximum depth exceeded")]

    errors: List[Dict[str, str]] = []
    schema_type = schema.get("type")

    if schema_type == "object":
        if not isinstance(value, dict):
            return [_error(path, "type", "Expected object")]
        required = schema.get("required", []) or []
        properties = schema.get("properties", {}) or {}
        additional = schema.get("additionalProperties", True)

        for key in required:
            if key not in value:
                errors.append(_error(f"{path}{key if path.endswith('/') else '/' + key}", "required", "Missing required field"))

        for key, val in value.items():
            if key in properties:
                errors.extend(validate_value(val, properties[key], f"{path}{key if path.endswith('/') else '/' + key}", depth + 1, max_depth))
            elif additional is False:
                errors.append(_error(f"{path}{key if path.endswith('/') else '/' + key}", "additionalProperties", "Unknown field"))
        return errors

    if schema_type == "array":
        if not isinstance(value, list):
            return [_error(path, "type", "Expected array")]
        min_items = schema.get("minItems")
        max_items = schema.get("maxItems")
        if isinstance(min_items, int) and len(value) < min_items:
            errors.append(_error(path, "minItems", f"Must have at least {min_items} items"))
        if isinstance(max_items, int) and len(value) > max_items:
            errors.append(_error(path, "maxItems", f"Must have at most {max_items} items"))
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for idx, item in enumerate(value):
                errors.extend(validate_value(item, item_schema, f"{path}{idx if path.endswith('/') else '/' + str(idx)}", depth + 1, max_depth))
        return errors

    if schema_type == "string":
        if not isinstance(value, str):
            return [_error(path, "type", "Expected string")]
        trimmed = value.strip() if schema.get("trim") else value
        min_len = schema.get("minLength")
        max_len = schema.get("maxLength")
        if isinstance(min_len, int) and len(trimmed) < min_len:
            errors.append(_error(path, "minLength", f"Must be at least {min_len} characters"))
        if isinstance(max_len, int) and len(trimmed) > max_len:
            errors.append(_error(path, "maxLength", f"Must be at most {max_len} characters"))
        return errors

    if schema_type == "int":
        if not isinstance(value, int) or isinstance(value, bool):
            return [_error(path, "type", "Expected int")]
        min_val = schema.get("min")
        max_val = schema.get("max")
        if isinstance(min_val, (int, float)) and value < min_val:
            errors.append(_error(path, "min", f"Must be >= {min_val}"))
        if isinstance(max_val, (int, float)) and value > max_val:
            errors.append(_error(path, "max", f"Must be <= {max_val}"))
        return errors

    if schema_type == "float":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            return [_error(path, "type", "Expected float")]
        min_val = schema.get("min")
        max_val = schema.get("max")
        if isinstance(min_val, (int, float)) and value < min_val:
            errors.append(_error(path, "min", f"Must be >= {min_val}"))
        if isinstance(max_val, (int, float)) and value > max_val:
            errors.append(_error(path, "max", f"Must be <= {max_val}"))
        return errors

    if schema_type == "bool":
        if not isinstance(value, bool):
            return [_error(path, "type", "Expected bool")]
        return errors

    return errors
