# [여행계획] 여행계획 API: 공개 목록 · 만들기 · 조회 · 수정 · 삭제
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.access import PlanAccessService
from backend.plans.trips.schemas import PlanCreate, PlanInDB, PlanUpdate
from backend.plans.trips.service import PlanService

router = APIRouter()


@router.get("/public", response_model=list[PlanInDB])
async def get_public_plans(
    db: AsyncSession = Depends(get_db),
):
    """공개(p_public)된 모든 여행계획. 다른 사람의 여행을 구경하는 화면에서 씁니다."""
    return await PlanService.get_public_plans(db=db)


@router.post("/", response_model=PlanInDB, status_code=201)
async def create_plan(
    plan: PlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if plan.u_id != user.u_id:
        raise HTTPException(403, "본인 명의로만 여행계획을 생성할 수 있습니다.")

    return await PlanService.create_plan(db=db, plan=plan)


@router.get("/", response_model=list[PlanInDB])
async def get_plans(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 내가 방장이거나 멤버로 참여했거나 공개된 여행 조회
    return await PlanService.get_accessible_plans(db=db, user_id=user.u_id)


@router.get("/user/{user_id}", response_model=list[PlanInDB])
async def get_plans_by_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user_id != user.u_id:
        raise HTTPException(403, "본인의 여행계획만 조회할 수 있습니다.")

    return await PlanService.get_plans_by_user(
        db=db, user_id=user.u_id
    )


@router.get("/{plan_id}", response_model=PlanInDB)
async def get_plan_by_id(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await PlanAccessService.require_view(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.put("/{plan_id}", response_model=PlanInDB)
async def update_plan_by_id(
    plan_id: int,
    plan: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if "p_public" in plan.model_fields_set:
        # 공개/비공개 전환은 방장만
        await PlanAccessService.require_owner(
            db=db, plan_id=plan_id, user_id=user.u_id
        )
    else:
        # 제목·여행지·날짜·대표사진은 방장 또는 편집자
        await PlanAccessService.require_editor(
            db=db, plan_id=plan_id, user_id=user.u_id
        )

    # 여행 완료 상태는 스케줄러에서 관리
    if "p_status" in plan.model_fields_set:
        raise HTTPException(
            422,
            "여행 완료 상태는 직접 변경할 수 없습니다."
        )

    return await PlanService.update_plan(
        db=db, plan_id=plan_id, plan=plan
    )


@router.delete("/{plan_id}", status_code=204)
async def delete_plan_by_id(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    await PlanService.delete_plan(db=db, plan_id=plan_id)
