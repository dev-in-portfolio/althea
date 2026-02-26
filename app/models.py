from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SchemaCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    schema: Dict[str, Any]


class SchemaInfo(BaseModel):
    id: str
    name: str
    version: int
    createdAt: str


class SchemaResponse(BaseModel):
    name: str
    version: int
    schema: Dict[str, Any]


class SchemaListResponse(BaseModel):
    items: List[SchemaInfo]


class ValidationResult(BaseModel):
    ok: bool
    errors: List[Dict[str, Any]]
    normalized: Optional[Dict[str, Any]]
    schema: Dict[str, Any]


class HistoryItem(BaseModel):
    id: str
    schemaName: str
    schemaVersion: int
    createdAt: str
    ok: bool
    errorCount: int


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
