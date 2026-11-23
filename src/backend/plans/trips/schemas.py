# [여행계획] 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class PlanBase(BaseModel):
    u_id: int
    p_title: str = Field(..., min_length=1, max_length=100)
    loc: str = Field(..., min_length=1, max_length=100)
    p_start: datetime
    p_end: datetime
    p_public: bool = False                              # 공개 여부
    p_photo: str | None = Field(None, max_length=50)    # 대표 사진 이름


class PlanCreate(PlanBase):

    @model_validator(mode="after")
    def check_dates(self):
        if self.p_end < self.p_start:
            raise ValueError("종료 시간은 시작 시간보다 빠를 수 없습니다.")
        return self


class PlanUpdate(BaseModel):
    p_title: str | None = Field(None, min_length=1, max_length=100)
    loc: str | None = Field(None, min_length=1, max_length=100)
    p_start: datetime | None = None
    p_end: datetime | None = None
    p_status: bool | None = None
    p_public: bool | None = None
    p_photo: str | None = Field(None, max_length=50)


class PlanInDB(PlanBase):
    p_id: int
    p_status: bool

    model_config = ConfigDict(from_attributes=True)
