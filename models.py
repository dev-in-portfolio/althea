from dataclasses import dataclass
from typing import List


@dataclass
class Wing:
    id: str
    name: str
    slug: str


@dataclass
class Hall:
    id: str
    wing_id: str
    name: str
    slug: str


@dataclass
class Exhibit:
    id: str
    hall_id: str
    title: str
    slug: str
    summary: str
    tags: List[str]
    body: str
    images: List[str]
