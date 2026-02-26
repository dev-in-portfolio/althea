from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from .db import (
    delete_schema,
    fetch_schema,
    get_latest_version,
    insert_schema,
    insert_validation_run,
    list_history,
    list_schemas,
)
from .models import SchemaCreate
from .normalizer import normalize_value
from .schema_store import validate_schema
from .security import get_user_key
from .settings import Settings
from .utils import is_valid_name, json_dumps
from .validator import validate_value


def _parse_body_error(message: str) -> Dict[str, str]:
    return {"path": "/", "code": "parse", "message": message}


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter()

    @router.post("/schemas")
    async def create_schema(payload: SchemaCreate, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        if not is_valid_name(payload.name):
            raise HTTPException(status_code=400, detail="Schema name must be alphanumeric, dash, underscore")

        schema_bytes = len(json_dumps(payload.schema).encode("utf-8"))
        if schema_bytes > settings.max_schema_bytes:
            raise HTTPException(status_code=400, detail="Schema too large")

        errors = validate_schema(payload.schema, path="$")
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        latest = get_latest_version(settings.database_url, user_key, payload.name)
        version = (latest or 0) + 1
        schema_id = insert_schema(
            settings.database_url,
            user_key,
            payload.name,
            version,
            payload.schema,
            payload.notes,
        )

        return {"id": schema_id, "name": payload.name, "version": version}

    @router.get("/schemas")
    async def get_schemas(name: Optional[str] = None, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        items = list_schemas(settings.database_url, user_key, name)
        return {
            "items": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "version": item["version"],
                    "createdAt": item["created_at"],
                }
                for item in items
            ]
        }

    @router.get("/schemas/{name}")
    async def get_schema(name: str, version: Optional[int] = None, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        if version is not None and version < 1:
            raise HTTPException(status_code=400, detail="Version must be >= 1")

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")
        return {
            "name": schema["name"],
            "version": schema["version"],
            "schema": schema["schema"],
            "notes": schema.get("notes"),
        }

    @router.get("/schemas/{name}/latest")
    async def get_schema_latest(name: str, user_key: str = Depends(get_user_key)):
        return await get_schema(name=name, version=None, user_key=user_key)

    @router.delete("/schemas/{name}")
    async def remove_schema(name: str, version: Optional[int] = None, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        if version is not None and version < 1:
            raise HTTPException(status_code=400, detail="Version must be >= 1")

        deleted = delete_schema(settings.database_url, user_key, name, version)
        if not deleted:
            raise HTTPException(status_code=404, detail="Schema not found")
        return {"ok": True}

    @router.post("/validate/{name}")
    async def validate_payload(
        name: str,
        request: Request,
        version: Optional[int] = None,
        strict: bool = False,
        user_key: str = Depends(get_user_key),
    ):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        if version is not None and version < 1:
            raise HTTPException(status_code=400, detail="Version must be >= 1")

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")

        try:
            payload: Any = await request.json()
        except Exception:
            errors = [_parse_body_error("Invalid JSON")]
            result = {"ok": False, "errors": errors, "warnings": [], "normalized": None}
            insert_validation_run(
                settings.database_url,
                user_key,
                schema["name"],
                schema["version"],
                payload={},
                result=result,
            )
            return {"ok": False, "errors": errors, "warnings": [], "normalized": None, "schema": schema}

        normalized, norm_errors, warnings = normalize_value(
            payload,
            schema["schema"],
            "/",
            0,
            settings.max_depth,
            strict,
        )
        val_errors, val_warnings = validate_value(
            normalized,
            schema["schema"],
            "/",
            0,
            settings.max_depth,
            strict,
        )
        errors = norm_errors + val_errors
        warnings = warnings + val_warnings
        ok = len(errors) == 0

        result = {"ok": ok, "errors": errors, "warnings": warnings, "normalized": normalized}
        insert_validation_run(
            settings.database_url,
            user_key,
            schema["name"],
            schema["version"],
            payload=payload,
            result=result,
        )
        return {"ok": ok, "errors": errors, "warnings": warnings, "normalized": normalized, "schema": schema}

    @router.post("/normalize/{name}")
    async def normalize_payload(
        name: str,
        request: Request,
        version: Optional[int] = None,
        strict: bool = False,
        user_key: str = Depends(get_user_key),
    ):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        if version is not None and version < 1:
            raise HTTPException(status_code=400, detail="Version must be >= 1")

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")

        try:
            payload: Any = await request.json()
        except Exception:
            errors = [_parse_body_error("Invalid JSON")]
            result = {"ok": False, "errors": errors, "warnings": [], "normalized": None}
            insert_validation_run(
                settings.database_url,
                user_key,
                schema["name"],
                schema["version"],
                payload={},
                result=result,
            )
            return {"ok": False, "errors": errors, "warnings": [], "normalized": None, "schema": schema}

        normalized, errors, warnings = normalize_value(
            payload,
            schema["schema"],
            "/",
            0,
            settings.max_depth,
            strict,
        )
        val_errors, val_warnings = validate_value(
            normalized,
            schema["schema"],
            "/",
            0,
            settings.max_depth,
            strict,
        )
        errors.extend(val_errors)
        warnings.extend(val_warnings)
        ok = len(errors) == 0
        normalized_out = normalized if ok else None
        result = {"ok": ok, "errors": errors, "warnings": warnings, "normalized": normalized_out}
        insert_validation_run(
            settings.database_url,
            user_key,
            schema["name"],
            schema["version"],
            payload=payload,
            result=result,
        )
        return {"ok": ok, "errors": errors, "warnings": warnings, "normalized": normalized_out, "schema": schema}

    @router.get("/history")
    async def history(limit: int = 50, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        limit = max(1, min(limit, 100))
        items = list_history(settings.database_url, user_key, limit)
        return {
            "items": [
                {
                    "id": item["id"],
                    "schemaName": item["schema_name"],
                    "schemaVersion": item["schema_version"],
                    "createdAt": item["created_at"],
                    "ok": item["ok"],
                    "errorCount": item["error_count"],
                    "warningCount": item["warning_count"],
                }
                for item in items
            ]
        }

    return router
