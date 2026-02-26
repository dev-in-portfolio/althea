from fastapi import APIRouter, Depends, HTTPException

from .db import delete_run, fetch_history, fetch_run, insert_run
from .diff_json import diff_json
from .diff_text import diff_text
from .models import DiffRequest
from .security import get_user_key
from .settings import Settings
from .utils import ensure_max_length, sha256_text


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter()

    @router.post("/diff")
    async def create_diff(payload: DiffRequest, user_key: str = Depends(get_user_key)):
        try:
            ensure_max_length(payload.a, settings.max_body_chars)
            ensure_max_length(payload.b, settings.max_body_chars)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        if payload.mode == "text":
            output = diff_text(
                payload.a,
                payload.b,
                payload.granularity or "line",
                payload.options.contextLines,
                payload.options.maxDiffChunks,
            )
        else:
            try:
                output = diff_json(
                    payload.a,
                    payload.b,
                    settings.max_json_depth,
                    settings.max_json_ops,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Invalid JSON") from exc

        summary = output["summary"]
        summary_payload = {
            "mode": payload.mode,
            "granularity": payload.granularity or "line",
            **summary,
        }
        result_payload = {
            "summary": summary_payload,
            "diff": output["diff"],
            "options": payload.options.model_dump(),
        }

        run_id = insert_run(
            settings.database_url,
            user_key,
            payload.mode,
            payload.granularity or "line",
            sha256_text(payload.a),
            sha256_text(payload.b),
            len(payload.a),
            len(payload.b),
            result_payload,
        )

        return {
            "id": run_id,
            "summary": summary_payload,
            "diff": output["diff"],
            "options": payload.options.model_dump(),
        }

    @router.post("/diff/validate")
    async def validate_diff(payload: DiffRequest, user_key: str = Depends(get_user_key)):
        try:
            ensure_max_length(payload.a, settings.max_body_chars)
            ensure_max_length(payload.b, settings.max_body_chars)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return {
            "ok": True,
            "mode": payload.mode,
            "granularity": payload.granularity or "line",
            "options": payload.options.model_dump(),
        }

    @router.get("/history")
    async def history(limit: int = 50, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        limit = max(1, min(limit, 100))
        items = fetch_history(settings.database_url, user_key, limit)
        return {
            "items": [
                {
                    "id": item["id"],
                    "mode": item["mode"],
                    "granularity": item["granularity"],
                    "createdAt": item["created_at"],
                    "aHash": item["a_hash"],
                    "bHash": item["b_hash"],
                    "summary": item["result"]["summary"],
                }
                for item in items
            ]
        }

    @router.get("/runs/{run_id}")
    async def get_run(run_id: str, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        run = fetch_run(settings.database_url, user_key, run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return {
            "id": run["id"],
            "mode": run["mode"],
            "granularity": run["granularity"],
            "result": run["result"],
            "createdAt": run["created_at"],
        }

    @router.delete("/runs/{run_id}")
    async def delete(run_id: str, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        ok = delete_run(settings.database_url, user_key, run_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Run not found")
        return {"ok": True}

    return router
