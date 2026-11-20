
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ==================================================
# 1. 여행기 (journals)
# ==================================================

class JournalCreate(BaseModel):
    """CRUD에서 여행기 DB 레코드 생성"""
    p_id: Optional[int] = None
    u_id: int
    j_title: str = Field(..., min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    loc: Optional[str] = Field(None, max_length=100)


class JournalUpdate(BaseModel):
    """여행기 기본 정보 수정"""
    j_title: Optional[str] = Field(None, min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)


class JournalResponse(BaseModel):
    """여행기 조회 응답"""
    j_id: int
    p_id: Optional[int] = None
    u_id: int
    j_title: str
    j_intro: Optional[str] = None
    j_photo: Optional[str] = None
    p_create: datetime
    loc: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 2. 여행기 일정 (journals_item)
# ==================================================

class JournalItemCreate(BaseModel):
    """원본 여행계획의 일정 복사 및 저장"""
    j_id: int
    ji_day: int = Field(1, ge=1)
    ji_order: int = Field(0, ge=0)
    ji_time: Optional[datetime] = None
    ji_title: str = Field(..., min_length=1, max_length=100)
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemUpdate(BaseModel):
    """사용자가 변경할 수 있는 여행기 일정 정보"""
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemResponse(BaseModel):
    """DB 일정 조회 응답"""
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


# ==================================================
# 3. 여행기 댓글 (journals_comment)
# ==================================================

class JournalCommentCreate(BaseModel):
    """CRUD에서 댓글 생성"""
    j_id: int
    u_id: int
    jc_content: str = Field(..., min_length=1)


class JournalCommentRequest(BaseModel):
    """프론트엔드 댓글 작성 요청"""
    jc_content: str = Field(..., min_length=1)


class JournalCommentUpdate(BaseModel):
    """댓글 수정"""
    jc_content: str = Field(..., min_length=1)


class JournalCommentResponse(BaseModel):
    """댓글 조회 응답"""
    jc_id: int
    j_id: int
    u_id: int
    jc_content: str
    jc_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 4. 여행계획 → 여행기 작성 미리보기
# ==================================================

class JournalPlanPreviewInfo(BaseModel):
    """여행계획에서 가져온 여행기 기본 정보"""
    p_id: int
    j_title: str
    j_intro: Optional[str] = None
    j_photo: Optional[str] = None
    loc: Optional[str] = None


class JournalPlanItemPreview(BaseModel):
    """작성 화면에 표시할 원본 여행 일정"""
    pd_id: int
    ji_day: int = Field(..., ge=1)
    ji_order: int = Field(..., ge=0)
    ji_time: str
    ji_title: str
    ji_content: str = ""
    ji_photo: str = ""
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalPlanDayPreview(BaseModel):
    """작성 화면의 날짜별 일정"""
    ji_day: int = Field(..., ge=1)
    date: str
    items: list[JournalPlanItemPreview]


class JournalPlanPreviewResponse(BaseModel):
    """여행계획 → 여행기 작성 화면 응답"""
    journal: JournalPlanPreviewInfo
    days: list[JournalPlanDayPreview]


# ==================================================
# 5. 여행계획 → 여행기 생성 요청
# ==================================================

class JournalFromPlanItemCreate(BaseModel):
    """원본 일정 ID 및 사용자가 입력한 기록"""
    pd_id: int
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalFromPlanCreate(BaseModel):
    """
    여행기 생성 요청

    p_id: URL의 plan_id에서 가져옴
    u_id: 로그인한 사용자 정보에서 가져옴
    일정 날짜, 시간, 장소: 서버에서 원본 복사
    """
    j_title: str = Field(..., min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    items: list[JournalFromPlanItemCreate]


# ==================================================
# 6. 여행기 전체 수정 요청
# ==================================================

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


# ==================================================
# 7. 프론트엔드 화면용 일정 응답
# ==================================================

class JournalDisplayItemResponse(BaseModel):
    """React 화면에 표시할 여행기 일정"""
    ji_id: int
    j_id: int
    ji_day: int = Field(..., ge=1)
    ji_order: int = Field(..., ge=0)
    ji_time: str
    ji_title: str
    ji_content: str = ""
    ji_photo: str = ""
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalDayResponse(BaseModel):
    """날짜별 여행기 일정"""
    ji_day: int = Field(..., ge=1)
    date: Optional[str] = None
    items: list[JournalDisplayItemResponse]


# ==================================================
# 8. 여행기 수정 화면 응답
# ==================================================

class JournalEditResponse(BaseModel):
    """여행기 수정 화면: { journal, days }"""
    journal: JournalResponse
    days: list[JournalDayResponse]


# ==================================================
# 9. 여행기 상세 및 저장 결과 응답
# ==================================================

class JournalDetailResponse(BaseModel):
    """여행기 상세: { journal, days, comments }"""
    journal: JournalResponse
    days: list[JournalDayResponse]
    comments: list[JournalCommentResponse]


# ==================================================
# 10. 여행기 좋아요 (journals_like)
# ==================================================

class JournalLikeCreate(BaseModel):
    """좋아요 추가"""
    j_id: int
    u_id: int


class JournalLikeResponse(BaseModel):
    """좋아요 조회"""
    j_id: int
    u_id: int
    jl_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 11. 여행기 해시태그 (journals_hashtag)
# ==================================================

class JournalHashtagCreate(BaseModel):
    """여행기에 해시태그 연결"""
    j_id: int
    h_id: int


class JournalHashtagResponse(BaseModel):
    """여행기 해시태그 조회"""
    j_id: int
    h_id: int

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 12. 공통 응답
# ==================================================

class JournalMessageResponse(BaseModel):
    message: str
