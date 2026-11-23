# [여행기] 댓글 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class JournalCommentRequest(BaseModel):
    """댓글 작성 및 수정 요청"""
    jc_content: str = Field(..., min_length=1)


class JournalCommentCreate(JournalCommentRequest):
    """CRUD에서 댓글 생성"""
    j_id: int
    u_id: int


class JournalCommentUpdate(JournalCommentRequest):
    """댓글 수정 요청"""
    pass


class JournalCommentResponse(JournalCommentCreate):
    """댓글 조회 응답"""
    jc_id: int
    jc_create: datetime
    u_name: Optional[str] = None   # 댓글 작성자 닉네임 (users.u_name)

    model_config = ConfigDict(from_attributes=True)
