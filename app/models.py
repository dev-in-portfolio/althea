from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class Item(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=200)
    tags: Optional[List[str]] = None
    due: Optional[str] = None
    effort: Optional[int] = Field(default=None, ge=0, le=10)
    value: Optional[int] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value):
        if value is None:
            return value
        if len(value) > 30:
            raise ValueError("tags length must be <= 30")
        for tag in value:
            if not isinstance(tag, str) or not tag:
                raise ValueError("tags must be non-empty strings")
        return value

    @field_validator("due")
    @classmethod
    def validate_due(cls, value):
        if value is None:
            return value
        if isinstance(value, str) and len(value) == 10:
            return value
        raise ValueError("due must be ISO date YYYY-MM-DD or null")


class RuleWeights(BaseModel):
    tagBoost: float = 2.0
    dueSoonBoost: float = 3.0
    effortPenalty: float = 1.0
    valueBoost: float = 2.0
    keywordBoost: float = 1.5


class RulePack(BaseModel):
    weights: RuleWeights = RuleWeights()
    preferTags: List[str] = Field(default_factory=list)
    avoidTags: List[str] = Field(default_factory=list)
    preferKeywords: List[str] = Field(default_factory=list)
    avoidKeywords: List[str] = Field(default_factory=list)
    dueKey: str = "due"
    now: Optional[str] = None
    tieBreak: str = "stable"

    @field_validator("preferTags", "avoidTags", "preferKeywords", "avoidKeywords")
    @classmethod
    def cap_lists(cls, value):
        if len(value) > 50:
            raise ValueError("list length must be <= 50")
        return value

    @field_validator("tieBreak")
    @classmethod
    def validate_tie_break(cls, value):
        if value != "stable":
            raise ValueError("tieBreak must be 'stable'")
        return value

    @field_validator("dueKey")
    @classmethod
    def validate_due_key(cls, value):
        if value != "due":
            raise ValueError("dueKey must be 'due'")
        return value


class JudgeOptions(BaseModel):
    maxItems: int = Field(default=500, ge=1, le=500)
    maxExplainPairs: int = Field(default=200, ge=1, le=500)


class JudgeRequest(BaseModel):
    items: List[Item]
    rules: RulePack
    options: JudgeOptions = JudgeOptions()

    @model_validator(mode="after")
    def validate_items(self):
        if len(self.items) > self.options.maxItems:
            raise ValueError("items exceed maxItems")
        return self


class RankedItem(BaseModel):
    id: str
    label: str
    score: float
    breakdown: List[Dict[str, object]]


class JudgeResponse(BaseModel):
    id: str
    ranked: List[RankedItem]
    explanations: Dict[str, object]


class HistoryItem(BaseModel):
    id: str
    createdAt: str
    itemCount: int


class HistoryResponse(BaseModel):
    items: List[HistoryItem]


class RulePackCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    rules: RulePack
