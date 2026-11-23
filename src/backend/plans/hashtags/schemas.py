# [해시태그] 요청·응답 데이터 모양(Pydantic)
from pydantic import BaseModel, ConfigDict, Field


class HashtagCreate(BaseModel):
    h_name: str = Field(..., min_length=1, max_length=100)


class HashtagInDB(HashtagCreate):
    h_id: int

    model_config = ConfigDict(from_attributes=True)


class PlanHashtagCreate(BaseModel):
    p_id: int
    h_id: int


class PlanHashtagInDB(PlanHashtagCreate):
    ph_id: int

    model_config = ConfigDict(from_attributes=True)
