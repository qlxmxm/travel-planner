# [참여 요청] 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel


class JoinRequestOut(BaseModel):
    """공개 여행에 보낸 참여 요청 (요청한 사람 이름 포함)"""
    jr_id: int
    p_id: int
    u_id: int
    u_name: str | None = None
    jr_create: datetime | None = None
