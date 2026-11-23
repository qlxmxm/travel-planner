# [여행계획] 세부 일정 API
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.plans.dependencies import require_editor_dep, require_view_dep
from backend.plans.schedules.schemas import (
    PlanDetailCreate,
    PlanDetailInDB,
    PlanDetailUpdate,
)
from backend.plans.schedules.service import PlanDetailService

router = APIRouter()


@router.post("/{plan_id}/details",
    response_model=PlanDetailInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_detail(
    plan_id: int,
    data: PlanDetailCreate,
    db: AsyncSession = Depends(get_db),
):
    if data.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await PlanDetailService.create_detail(db, data)


@router.get("/{plan_id}/details",
    response_model=list[PlanDetailInDB],
    dependencies=[Depends(require_view_dep)],
)
async def get_details_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await PlanDetailService.get_details_by_plan(db, plan_id)


@router.get("/{plan_id}/details/{detail_id}",
    response_model=PlanDetailInDB,
    dependencies=[Depends(require_view_dep)],
)
async def get_detail_by_id(
    plan_id: int,
    detail_id: int,
    db: AsyncSession = Depends(get_db),
):
    detail = await PlanDetailService.get_detail_by_id(db, detail_id)
    if detail is None or detail.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")
    return detail


@router.put("/{plan_id}/details/{detail_id}",
    response_model=PlanDetailInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_detail(
    plan_id: int,
    detail_id: int,
    data: PlanDetailUpdate,
    db: AsyncSession = Depends(get_db),
):
    existing = await PlanDetailService.get_detail_by_id(db, detail_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")

    return await PlanDetailService.update_detail(db, detail_id, data)


@router.delete("/{plan_id}/details/{detail_id}", status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_detail(
    plan_id: int,
    detail_id: int,
    db: AsyncSession = Depends(get_db),
):
    existing = await PlanDetailService.get_detail_by_id(db, detail_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")

    await PlanDetailService.delete_detail(db, detail_id)
