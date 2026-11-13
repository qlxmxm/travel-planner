# [장소] 요청/응답 모양 (Pydantic). API 명세서 38~43번과 같게 맞췄습니다.
from datetime import datetime
from typing import Optional

from pydantic import AliasChoices, BaseModel, Field


# ───────── 장소 (조회만 가능) ─────────

class PlaceListOut(BaseModel):
    """38 GET /places 응답 배열의 한 칸"""
    l_id: int
    l_category: str
    l_name: str
    l_city: str
    l_add: str
    avg_rating: float = 0          # DB에 없음, 리뷰로 계산
    review_count: int = 0          # DB에 없음, 리뷰로 계산

    model_config = {"from_attributes": True}


class PlaceDetailOut(BaseModel):
    """39 GET /places/{l_id} 응답"""
    l_id: int
    l_category: str
    l_name: str
    l_add: str
    l_telno: Optional[str] = None
    l_start: Optional[str] = None  # 맛집=오픈시간, 숙소=체크인
    l_end: Optional[str] = None    # 맛집=마감시간, 숙소=체크아웃
    l_intro: Optional[str] = None
    l_city: str
    avg_rating: float = 0
    review_count: int = 0

    model_config = {"from_attributes": True}


# ───────── 리뷰 ─────────

class ReviewIn(BaseModel):
    """41 리뷰 작성 / 42 리뷰 수정 요청 Body"""
    lr_rating: int = Field(ge=1, le=5)   # 별점 1~5
    lr_content: Optional[str] = None


class ReviewOut(BaseModel):
    """40 리뷰 목록 한 칸 / 41 작성 결과 / 42 수정 결과"""
    lr_id: int
    u_id: int
    u_name: str                    # users 테이블에서 가져옴
    lr_rating: int
    lr_content: Optional[str] = None
    # DB 컬럼은 lr_create, 명세서 응답은 lr_created → 둘 다 받아서 lr_created로 내보냄
    lr_created: datetime = Field(validation_alias=AliasChoices("lr_create", "lr_created"))

    model_config = {"from_attributes": True}