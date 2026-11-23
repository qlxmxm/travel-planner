# [초대 코드] 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class InviteCreate(BaseModel):
    p_id: int
    i_code: str = Field(..., min_length=1, max_length=50)
    i_create: datetime
    i_expire: datetime

    @model_validator(mode="after")
    def check_expiration(self):
        if self.i_expire <= self.i_create:
            raise ValueError("초대 코드 만료 시간은 생성 시간 이후여야 합니다.")
        return self


class InviteVerify(BaseModel):
    i_code: str = Field(..., min_length=1, max_length=50)


class InviteUpdate(BaseModel):
    i_used: bool


class InviteInDB(InviteCreate):
    i_id: int
    i_used: bool

    model_config = ConfigDict(from_attributes=True)
