# [여행계획] 여행 멤버 API
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.access import (
    EDITOR_ROLE,
    MEMBER_ROLE,
    PlanAccessService,
    PlanValidator,
    require_child,
)
from backend.plans.members.schemas import (
    PlanMemberDetail,
    PlanMemberInDB,
    PlanMemberUpdate,
)
from backend.plans.members.service import PlanMemberService

router = APIRouter()


@router.get(
    "/{plan_id}/members",
    response_model=list[PlanMemberDetail],
)
async def get_members_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await PlanMemberService.get_members_by_plan(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/members/{member_id}",
    response_model=PlanMemberInDB,
)
async def get_member_by_id(
    plan_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_member(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    member = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    require_child(member, "p_id", plan_id, "여행 멤버가 없습니다.")

    return member


@router.put(
    "/{plan_id}/members/{member_id}",
    response_model=PlanMemberInDB,
)
async def update_member(
    plan_id: int,
    member_id: int,
    member: PlanMemberUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    existing = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    require_child(existing, "p_id", plan_id, "여행 멤버가 없습니다.")

    plan = await PlanValidator.check_plan(db, plan_id)
    if existing.u_id == plan.u_id:
        raise HTTPException(403, "방장의 역할은 바꿀 수 없습니다.")

    # 방장은 plans.u_id 로 관리하므로 멤버 <-> 편집자 전환만 허용
    if member.role not in (MEMBER_ROLE, EDITOR_ROLE):
        raise HTTPException(
            422,
            f"역할은 {MEMBER_ROLE} 또는 {EDITOR_ROLE} 만 허용됩니다."
        )

    return await PlanMemberService.update_member(
        db, member_id, member
    )


@router.delete(
    "/{plan_id}/members/{member_id}",
    status_code=204,
)
async def delete_member(
    plan_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    existing = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    require_child(existing, "p_id", plan_id, "여행 멤버가 없습니다.")

    plan = await PlanValidator.check_plan(db, plan_id)
    if existing.u_id == plan.u_id:
        raise HTTPException(
            403,
            "방장은 멤버 내보내기로 삭제할 수 없습니다."
        )

    await PlanMemberService.delete_member(db, member_id)
