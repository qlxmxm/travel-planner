# [장소] API 명세서 38~43번 (장소 목록·상세 / 리뷰 목록·작성·수정·삭제)
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.location import service
from backend.location.schemas import LocationDetailOut, LocationListOut, ReviewIn, ReviewOut
from backend.login.models import User
from backend.login.security import get_current_user

router = APIRouter(tags=["장소"])


# ───────── 장소 (공개) ─────────

@router.get("/places", response_model=list[LocationListOut])
async def get_places(
    category: Literal["맛집", "관광명소", "숙소"] | None = None,  # 이 3개 말고 다른 값이면 422
    q: str | None = Query(None, description="이름·도시·주소 검색어"),
    city: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """38 장소 목록·검색  예) /api/places?category=맛집&city=부산"""
    return await service.list_locations(db, category, q, city, page, size)


@router.get("/places/{l_id}", response_model=LocationDetailOut)
async def get_place(l_id: int, db: AsyncSession = Depends(get_db)):
    """39 장소 상세 조회"""
    return await service.get_location(db, l_id)


# ───────── 리뷰 ─────────

@router.get("/places/{l_id}/reviews", response_model=list[ReviewOut])
async def get_reviews(l_id: int, db: AsyncSession = Depends(get_db)):
    """40 리뷰 목록 조회 (공개)"""
    return await service.list_reviews(db, l_id)


@router.post("/places/{l_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def write_review(
    l_id: int,
    body: ReviewIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """41 리뷰 작성 (로그인)"""
    return await service.create_review(db, l_id, user, body)


@router.put("/reviews/{lr_id}", response_model=ReviewOut)
async def edit_review(
    lr_id: int,
    body: ReviewIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """42 리뷰 수정 (작성자)"""
    return await service.update_review(db, lr_id, user, body)


@router.delete("/reviews/{lr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_review(
    lr_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """43 리뷰 삭제 (작성자)"""
    await service.delete_review(db, lr_id, user)