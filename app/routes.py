from fastapi import APIRouter, Depends, HTTPException

from .db import (
    delete_rulepack,
    delete_run,
    fetch_rulepack,
    fetch_run,
    insert_run,
    list_history,
    list_rulepacks,
    upsert_rulepack,
)
from .explain import build_explanations
from .models import JudgeRequest, RulePackCreate
from .scorer import score_items
from .security import get_user_key
from .settings import Settings
from .utils import parse_iso_date


def create_router(settings: Settings) -> APIRouter:
    router = APIRouter()

    @router.post("/judge")
    async def judge(payload: JudgeRequest, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        if payload.rules.now and parse_iso_date(payload.rules.now) is None:
            raise HTTPException(status_code=422, detail="rules.now must be ISO date YYYY-MM-DD")

        try:
            ranked = score_items(payload.items, payload.rules)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        explanations = build_explanations(ranked, payload.options.maxExplainPairs)
        result = {"ranked": ranked, "explanations": explanations}

        run_id = insert_run(
            settings.database_url,
            user_key,
            [item.model_dump() for item in payload.items],
            payload.rules.model_dump(),
            result,
        )

        return {"id": run_id, **result}

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
                    "createdAt": item["created_at"],
                    "itemCount": item["item_count"],
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
        return {"id": run["id"], **run["result"]}

    @router.delete("/runs/{run_id}")
    async def remove_run(run_id: str, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        deleted = delete_run(settings.database_url, user_key, run_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Run not found")
        return {"ok": True}

    @router.post("/rulepacks")
    async def create_rulepack(payload: RulePackCreate, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        upsert_rulepack(settings.database_url, user_key, payload.name, payload.rules.model_dump())
        return {"ok": True}

    @router.get("/rulepacks")
    async def get_rulepacks(user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        items = list_rulepacks(settings.database_url, user_key)
        return {
            "items": [
                {"name": item["name"], "createdAt": item["created_at"]}
                for item in items
            ]
        }

    @router.get("/rulepacks/{name}")
    async def get_rulepack(name: str, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        pack = fetch_rulepack(settings.database_url, user_key, name)
        if not pack:
            raise HTTPException(status_code=404, detail="Rulepack not found")
        return pack

    @router.delete("/rulepacks/{name}")
    async def remove_rulepack(name: str, user_key: str = Depends(get_user_key)):
        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
        deleted = delete_rulepack(settings.database_url, user_key, name)
        if not deleted:
            raise HTTPException(status_code=404, detail="Rulepack not found")
        return {"ok": True}

    return router
