from typing import Literal
from pydantic import BaseModel, Field

class WorkerJob(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    quality: Literal["preview", "1080p"] = "preview"
    code: str = Field(min_length=20)
    codeLength: int = Field(default=0)
    createdAt: str
    updatedAt: str

class ClaimResponse(BaseModel):
    ok: bool
    job: WorkerJob | None = None
