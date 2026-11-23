# [여행기] 여행계획으로 여행기 쓰기 요청·응답 데이터 모양(Pydantic)
from pydantic import BaseModel, Field
from typing import Optional
from backend.journals.journal.schemas import JournalBase, JournalItemBase


class JournalPlanPreviewInfo(JournalBase):
    """여행계획에서 가져온 여행기 기본 정보"""
    p_id: int
    loc: Optional[str] = None


class JournalPlanItemPreview(JournalItemBase):
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


class JournalFromPlanItemCreate(JournalItemBase):
    """원본 일정 ID와 사용자가 작성한 기록"""
    pd_id: int
    ji_rating: Optional[int] = Field(None, ge=1, le=5)   # 별점은 선택


class JournalFromPlanCreate(JournalBase):
    """
    여행기 생성 요청

    p_id: URL의 plan_id 사용
    u_id: 로그인 사용자 정보 사용
    일정 날짜, 시간, 장소: 서버에서 원본 복사
    해시태그: 원본 여행계획의 해시태그 공유
    """
    items: list[JournalFromPlanItemCreate]
