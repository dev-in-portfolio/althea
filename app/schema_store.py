from typing import Any, Dict, List

SUPPORTED_TYPES = {"object", "string", "int", "float", "bool", "array"}


def validate_schema(schema: Dict[str, Any], path: str = "$") -> List[Dict[str, str]]:
    errors: List[Dict[str, str]] = []

    if not isinstance(schema, dict):
        return [
            {
                "path": path,
                "code": "type",
                "message": "Schema must be an object",
            }
        ]

    schema_type = schema.get("type")
    if schema_type not in SUPPORTED_TYPES:
        errors.append(
            {
                "path": path,
                "code": "type",
                "message": "Unsupported or missing type",
            }
        )
        return errors

    if schema_type == "object":
        properties = schema.get("properties")
        if properties is None or not isinstance(properties, dict):
            errors.append(
                {
                    "path": f"{path}.properties",
                    "code": "properties",
                    "message": "Object schema must define properties as an object",
                }
            )
        required = schema.get("required", [])
        if required and not isinstance(required, list):
            errors.append(
                {
                    "path": f"{path}.required",
                    "code": "required",
                    "message": "Required must be a list",
                }
            )
        if isinstance(properties, dict):
            for key, subschema in properties.items():
                errors.extend(validate_schema(subschema, f"{path}.properties.{key}"))

    if schema_type == "array":
        items = schema.get("items")
        if not isinstance(items, dict):
            errors.append(
                {
                    "path": f"{path}.items",
                    "code": "items",
                    "message": "Array schema must define items",
                }
            )
        else:
            errors.extend(validate_schema(items, f"{path}.items"))

    return errors
