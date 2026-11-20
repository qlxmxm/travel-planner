
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ==================================================
# 1. 여행기 (journals)
# ==================================================

class JournalCreate(BaseModel):
    """CRUD에서 여행기 DB 레코드를 생성할 때 사용"""
    p_id: Optional[int] = None   # 계획이 지워져도 여행기는 남음 (NULL 허용)
    u_id: int
    j_title: str = Field(..., min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    loc: Optional[str] = Field(None, max_length=100)


class JournalUpdate(BaseModel):
    """여행기 기본 정보 수정 요청"""
    j_title: Optional[str] = Field(None, min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)


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


# ==================================================
# 2. 여행기 세부 일정 (journals_item)
# ==================================================

class JournalItemCreate(BaseModel):
    """CRUD에서 원본 여행계획을 복사해 일정 생성"""
    j_id: int
    ji_day: int = Field(1, ge=1)
    ji_order: int = Field(0, ge=0)
    ji_time: Optional[datetime] = None
    ji_title: str = Field(..., min_length=1, max_length=100)
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalItemUpdate(BaseModel):
    """사용자가 수정할 수 있는 세부 일정 필드"""
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


# ==================================================
# 3. 여행기 댓글 (journals_comment)
# ==================================================

class JournalCommentCreate(BaseModel):
    """CRUD에서 댓글 생성 시 사용"""
    j_id: int
    u_id: int
    jc_content: str = Field(..., min_length=1)


class JournalCommentRequest(BaseModel):
    """Axios 댓글 작성 요청: 사용자와 여행기 ID는 서버에서 결정"""
    jc_content: str = Field(..., min_length=1)


class JournalCommentUpdate(BaseModel):
    jc_content: str = Field(..., min_length=1)


class JournalCommentResponse(BaseModel):
    jc_id: int
    j_id: int
    u_id: int
    jc_content: str
    jc_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 4. 여행계획 → 여행기 작성 화면 미리보기
# ==================================================

class JournalPlanItemPreview(BaseModel):
    """plan_details + location에서 가져온 원본 일정"""
    pd_id: int
    ji_day: int
    ji_order: int
    ji_time: datetime
    ji_title: str
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = None
    ji_rating: Optional[int] = None


class JournalPlanDayPreview(BaseModel):
    ji_day: int
    date: str
    items: list[JournalPlanItemPreview]


class JournalPlanPreviewInfo(BaseModel):
    p_id: int
    j_title: str
    j_intro: Optional[str] = None
    j_photo: Optional[str] = None
    loc: Optional[str] = None


class JournalPlanPreviewResponse(BaseModel):
    journal: JournalPlanPreviewInfo
    days: list[JournalPlanDayPreview]


# ==================================================
# 5. 여행계획을 복사하여 여행기 생성
# ==================================================

class JournalFromPlanItemCreate(BaseModel):
    """원본 일정 ID와 사용자가 입력한 여행 기록"""
    pd_id: int
    ji_content: Optional[str] = None
    ji_photo: Optional[str] = Field(None, max_length=255)
    ji_rating: Optional[int] = Field(None, ge=1, le=5)


class JournalFromPlanCreate(BaseModel):
    """
    Axios 여행기 생성 요청

    p_id: 라우터 경로에서 전달
    u_id: JWT 인증에서 전달
    날짜/시간/장소: 원본 여행계획에서 복사
    """
    j_title: str = Field(..., min_length=1, max_length=100)
    j_intro: Optional[str] = Field(None, max_length=100)
    j_photo: Optional[str] = Field(None, max_length=255)
    items: list[JournalFromPlanItemCreate]


# ==================================================
# 6. 여행기 전체 수정
# ==================================================

class JournalItemFullUpdate(JournalItemUpdate):
    """기존 여행기 일정의 고유 ID"""
    ji_id: int


class JournalFullUpdate(JournalUpdate):
    """
    여행기 기본 정보와 세부 일정 일괄 수정

    items가 없으면 기본 정보만 수정
    items가 있으면 전달한 일정들을 수정
    """
    items: Optional[list[JournalItemFullUpdate]] = None


# ==================================================
# 7. 여행기 상세 조회
# ==================================================

class JournalDetailResponse(BaseModel):
    journal: JournalResponse
    items: list[JournalItemResponse]
    comments: list[JournalCommentResponse]


# ==================================================
# 8. 공통 응답
# ==================================================

class JournalMessageResponse(BaseModel):
    message: str


# ==================================================
# 좋아요 (journals_like)
# ==================================================

class JournalLikeCreate(BaseModel):
    j_id: int
    u_id: int


class JournalLikeResponse(BaseModel):
    j_id: int
    u_id: int
    jl_create: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 해시태그 (journals_hashtag)
# ==================================================

class JournalHashtagCreate(BaseModel):
    j_id: int
    h_id: int


class JournalHashtagResponse(BaseModel):
    j_id: int
    h_id: int

    model_config = ConfigDict(from_attributes=True)
