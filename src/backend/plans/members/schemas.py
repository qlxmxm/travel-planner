# [여행 멤버] 요청·응답 데이터 모양(Pydantic)
from pydantic import BaseModel, ConfigDict, Field


class PlanMemberDetail(BaseModel):
    pm_id: int | None = None
    p_id: int
    u_id: int
    u_name: str
    role: str


class PlanMemberCreate(BaseModel):
    p_id: int
    u_id: int
    role: str = Field(..., min_length=1, max_length=100)


class PlanMemberUpdate(BaseModel):
    role: str = Field(..., min_length=1, max_length=100)


class PlanMemberInDB(PlanMemberCreate):
    pm_id: int

    model_config = ConfigDict(from_attributes=True)


class PlanMemberOut(PlanMemberInDB):
    u_name: str | None = None   # 화면에 보여줄 멤버 이름 (users.u_name)
