from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from .db import (
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
from .validator import validate_value


def _parse_body_error(message: str) -> Dict[str, str]:
    return {"path": "/", "code": "parse", "message": message}


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter()

    @router.post("/schemas")
    async def create_schema(payload: SchemaCreate, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        errors = validate_schema(payload.schema, path="$")
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        latest = get_latest_version(settings.database_url, user_key, payload.name)
        version = (latest or 0) + 1
        schema_id = insert_schema(settings.database_url, user_key, payload.name, version, payload.schema)

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

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")
        return {
            "name": schema["name"],
            "version": schema["version"],
            "schema": schema["schema"],
        }

    @router.post("/validate/{name}")
    async def validate_payload(name: str, request: Request, version: Optional[int] = None, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")

        try:
            payload: Any = await request.json()
        except Exception:
            errors = [_parse_body_error("Invalid JSON")]
            result = {"ok": False, "errors": errors, "normalized": None}
            insert_validation_run(
                settings.database_url,
                user_key,
                schema["name"],
                schema["version"],
                payload={},
                result=result,
            )
            return {"ok": False, "errors": errors, "normalized": None, "schema": schema}

        errors = validate_value(payload, schema["schema"], "/", 0, settings.max_depth)
        ok = len(errors) == 0
        result = {"ok": ok, "errors": errors, "normalized": None}
        insert_validation_run(
            settings.database_url,
            user_key,
            schema["name"],
            schema["version"],
            payload=payload,
            result=result,
        )
        return {"ok": ok, "errors": errors, "normalized": None, "schema": schema}

    @router.post("/normalize/{name}")
    async def normalize_payload(name: str, request: Request, version: Optional[int] = None, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        schema = fetch_schema(settings.database_url, user_key, name, version)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")

        try:
            payload: Any = await request.json()
        except Exception:
            errors = [_parse_body_error("Invalid JSON")]
            result = {"ok": False, "errors": errors, "normalized": None}
            insert_validation_run(
                settings.database_url,
                user_key,
                schema["name"],
                schema["version"],
                payload={},
                result=result,
            )
            return {"ok": False, "errors": errors, "normalized": None, "schema": schema}

        normalized, errors = normalize_value(payload, schema["schema"], "/", 0, settings.max_depth)
        validation_errors = validate_value(normalized, schema["schema"], "/", 0, settings.max_depth)
        errors.extend(validation_errors)
        ok = len(errors) == 0
        normalized_out = normalized if ok else None
        result = {"ok": ok, "errors": errors, "normalized": normalized_out}
        insert_validation_run(
            settings.database_url,
            user_key,
            schema["name"],
            schema["version"],
            payload=payload,
            result=result,
        )
        return {"ok": ok, "errors": errors, "normalized": normalized_out, "schema": schema}

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
                }
                for item in items
            ]
        }

    return router
