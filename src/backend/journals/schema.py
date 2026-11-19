from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


# ==========================================
# 1. 일지 (journals) 스키마
# ==========================================
class JournalCreate(BaseModel):
    p_id: Optional[int] = None
    u_id: int
    j_title: str = Field(..., max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    loc: Optional[str] = Field(None, max_length=100)


class JournalUpdate(BaseModel):
    j_title: Optional[str] = Field(None, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    loc: Optional[str] = Field(None, max_length=100)


class JournalResponse(BaseModel):
    j_id: int
    p_id: Optional[int] = None
    u_id: int
    j_title: str
    j_intro: Optional[str] = None
    j_photo: Optional[str] = None
    p_create: datetime
    loc: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. 일지 세부 일정 (journals_item) 스키마
# ==========================================
class JournalItemCreate(BaseModel):
    j_id: int
    ji_day: int = Field(1, ge=1)
    ji_order: int = 0
    ji_time: Optional[datetime] = None
    ji_title: str = Field(..., max_length=100)
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemUpdate(BaseModel):
    ji_day: Optional[int] = Field(None, ge=1)
    ji_order: Optional[int] = None
    ji_time: Optional[datetime] = None
    ji_title: Optional[str] = Field(None, max_length=100)
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemResponse(BaseModel):
    ji_id: int
    j_id: int
    ji_day: int
    ji_order: int
    ji_time: Optional[datetime] = None
    ji_title: str
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = None
    ji_rating: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. 일지 댓글 (journals_comment) 스키마
# ==========================================
class JournalCommentCreate(BaseModel):
    j_id: int
    u_id: int
    jc_content: str


class JournalCommentUpdate(BaseModel):
    jc_content: Optional[str] = None


class JournalCommentResponse(BaseModel):
    jc_id: int
    j_id: int
    u_id: int
    jc_content: str
    jc_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. 일지 좋아요 (journals_like) 스키마
# ==========================================
class JournalLikeCreate(BaseModel):
    j_id: int
    u_id: int


class JournalLikeResponse(BaseModel):
    j_id: int
    u_id: int
    jl_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 5. 일지 해시태그 (journals_hashtag) 스키마
# ==========================================
class JournalHashtagCreate(BaseModel):
    j_id: int
    h_id: int


class JournalHashtagResponse(BaseModel):
    j_id: int
    h_id: int

    model_config = ConfigDict(from_attributes=True)
