# [여행기] 여행기 본체(목록·상세·수정·삭제·일정 수정) 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from backend.journals.comments.schemas import JournalCommentResponse


class JournalBase(BaseModel):
    """여행기 제목, 소개, 대표 사진"""
    j_title: str = Field(..., min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)


class JournalCreate(JournalBase):
    """CRUD에서 여행기 DB 레코드 생성"""
    p_id: int
    u_id: int
    loc: Optional[str] = Field(None, max_length=100)


class JournalUpdate(BaseModel):
    """여행기 기본 정보 부분 수정"""
    j_title: Optional[str] = Field(None, min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)


class JournalResponse(JournalCreate):
    """여행기 조회 응답"""
    j_id: int
    p_id: Optional[int] = None   # 원본 계획이 삭제되면 NULL
    p_create: datetime
    u_name: Optional[str] = None   # 작성자 닉네임 (users.u_name)
    hashtags: list[str] = Field(default_factory=list)   # 목록 화면용: 원본 여행계획의 해시태그 이름
    like_count: int = 0                                 # 목록 화면용: 좋아요 수

    model_config = ConfigDict(from_attributes=True)


class JournalItemBase(BaseModel):
    """일정의 기록 및 사진"""
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)


class JournalItemCreate(JournalItemBase):
    """원본 여행계획의 일정 복사 및 저장"""
    j_id: int
    ji_day: int = Field(1, ge=1)
    ji_order: int = Field(0, ge=0)
    ji_time: Optional[datetime] = None
    ji_title: str = Field(..., min_length=1, max_length=100)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)   # 별점은 선택 (없으면 화면에 안 보임)


class JournalItemUpdate(JournalItemBase):
    """여행기 일정 부분 수정"""
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemResponse(JournalItemCreate):
    """DB 일정 조회 응답"""
    ji_id: int

    model_config = ConfigDict(from_attributes=True)


class JournalItemFullUpdate(JournalItemUpdate):
    """수정할 여행기 일정 식별"""
    ji_id: int


class JournalFullUpdate(JournalUpdate):
    """
    여행기 기본 정보 및 일정 일괄 수정

    items 미전달: 기본 정보만 수정
    items 전달: 기존 일정 전체 수정
    """
    items: Optional[list[JournalItemFullUpdate]] = None


class JournalDisplayItemResponse(JournalItemResponse):
    """React 화면에 표시할 여행기 일정"""
    ji_time: str
    ji_content: str = ""
    ji_photo: str = ""


class JournalDayResponse(BaseModel):
    """날짜별 여행기 일정"""
    ji_day: int = Field(..., ge=1)
    date: Optional[str] = None
    items: list[JournalDisplayItemResponse]


class JournalEditResponse(BaseModel):
    """여행기 수정 화면 응답"""
    journal: JournalResponse
    days: list[JournalDayResponse]


class JournalDetailResponse(JournalEditResponse):
    """여행기 상세 응답"""
    comments: list[JournalCommentResponse]


class JournalMessageResponse(BaseModel):
    """공통 처리 결과"""
    message: str
