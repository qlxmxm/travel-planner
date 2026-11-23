# [세부 일정] 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PlanDetailBase(BaseModel):
    p_id: int
    l_id: int | None = None              # 장소 없이 메모만 있는 일정 허용
    visit_time: datetime
    orders: int = Field(ge=0)            # 방문 순서
    memo: str | None = Field(default=None, max_length=255)


class PlanDetailCreate(PlanDetailBase):
    pass


class PlanDetailUpdate(BaseModel):
    p_id: int | None = None
    l_id: int | None = None
    visit_time: datetime | None = None
    orders: int | None = Field(default=None, ge=0)
    memo: str | None = Field(default=None, max_length=255)


class PlanDetailInDB(PlanDetailBase):
    pd_id: int

    model_config = ConfigDict(from_attributes=True)
