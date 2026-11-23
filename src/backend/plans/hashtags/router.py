# [여행계획] 해시태그 API: 전체 해시태그 목록(/plans/hashtags)과 여행계획에 붙은 해시태그(/plans/{plan_id}/hashtags)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.dependencies import require_editor_dep, require_view_dep
from backend.plans.hashtags.schemas import (
    HashtagCreate,
    HashtagInDB,
    PlanHashtagCreate,
    PlanHashtagInDB,
)
from backend.plans.hashtags.service import HashtagService, PlanHashtagService

catalog_router = APIRouter()
plan_router = APIRouter()


@catalog_router.post(
    "/hashtags",
    response_model=HashtagInDB,
    status_code=201,
)
async def create_hashtag(
    data: HashtagCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await HashtagService.create_hashtag(db, data)


@catalog_router.get("/hashtags", response_model=list[HashtagInDB])
async def get_all_hashtags(
    db: AsyncSession = Depends(get_db),
):
    return await HashtagService.get_all_hashtags(db)


@catalog_router.get("/hashtags/{hashtag_id}", response_model=HashtagInDB)
async def get_hashtag_by_id(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
):
    tag = await HashtagService.get_hashtag_by_id(db, hashtag_id)
    if tag is None:
        raise HTTPException(404, "해시태그가 없습니다.")
    return tag


@catalog_router.delete("/hashtags/{hashtag_id}", status_code=204)
async def delete_hashtag(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = await HashtagService.delete_hashtag(db, hashtag_id)
    if deleted is None:
        raise HTTPException(404, "해시태그가 없습니다.")


@plan_router.post("/{plan_id}/hashtags",
    response_model=PlanHashtagInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def add_plan_hashtag(
    plan_id: int,
    data: PlanHashtagCreate,
    db: AsyncSession = Depends(get_db),
):
    if data.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await PlanHashtagService.add_hashtag(db, data)


@plan_router.get("/{plan_id}/hashtags",
    response_model=list[HashtagInDB],
    dependencies=[Depends(require_view_dep)],
)
async def get_plan_hashtags(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await PlanHashtagService.get_hashtags_by_plan(db, plan_id)


@plan_router.delete("/{plan_id}/hashtags/{hashtag_id}",
    status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def remove_plan_hashtag(
    plan_id: int,
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await PlanHashtagService.remove_hashtag(
        db, plan_id, hashtag_id
    )
    if deleted is None:
        raise HTTPException(404, "연결된 해시태그가 없습니다.")
