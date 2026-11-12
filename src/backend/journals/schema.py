from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from .journal import journals_item, journals_comment, journals


# Journals (일지) 스키마
class JournalBase(BaseModel):
    j_title: str = Field(..., max_length=100, description="일지 제목")
    j_intro: Optional[str] = Field(None, max_length=100, description="일지 소개")
    j_photo: Optional[str] = Field(None, max_length=255, description="대표 사진 URL")
    loc: Optional[str] = Field(None, max_length=100, description="여행 지역")


class JournalCreate(JournalBase):
    p_id: str = Field(..., description="연결된 여행 계획 ID")
    u_id: int = Field(..., description="작성자 유저 ID")


class JournalUpdate(BaseModel):
    j_title: Optional[str] = Field(None, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    loc: Optional[str] = Field(None, max_length=100)


class JournalResponse(JournalBase):
    j_id: int
    p_id: str
    u_id: int
    p_create: datetime

    model_config = ConfigDict(from_attributes=True)


# 2. Journals Item (일지 세부 일정/기록) 스키마
class JournalItemBase(BaseModel):
    ji_day: int = Field(..., ge=1, description="일차 (1일차, 2일차...)")
    ji_order: int = Field(..., ge=1, description="일정 순서")
    ji_time: Optional[datetime] = Field(None, description="방문 시간")
    ji_title: str = Field(..., max_length=100, description="장소/일정 제목")
    ji_content: Optional[str] = Field(None, description="상세 기록 내용")
    ji_photo: Optional[str] = Field(None, max_length=255, description="사진 URL")
    ji_rating: int = Field(..., ge=1, le=5, description="별점 (1~5)")


class JournalItemCreate(JournalItemBase):
    j_id: int = Field(..., description="상위 일지 ID")


class JournalItemUpdate(BaseModel):
    ji_day: Optional[int] = Field(None, ge=1)
    ji_order: Optional[int] = Field(None, ge=1)
    ji_time: Optional[datetime] = None
    ji_title: Optional[str] = Field(None, max_length=100)
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemResponse(JournalItemBase):
    ji_id: int
    j_id: int

    model_config = ConfigDict(from_attributes=True)



# 3. Journals Comment (일지 댓글) 스키마

class JournalCommentBase(BaseModel):
    jc_content: str = Field(..., min_length=1, description="댓글 내용")


class JournalCommentCreate(JournalCommentBase):
    j_id: int = Field(..., description="댓글을 달 일지 ID")
    u_id: int = Field(..., description="댓글 작성자 ID")


class JournalCommentUpdate(BaseModel):
    jc_content: str = Field(..., min_length=1, description="수정할 댓글 내용")


class JournalCommentResponse(JournalCommentBase):
    jc_id: int
    j_id: int
    u_id: int
    jc_create: datetime

    model_config = ConfigDict(from_attributes=True)
