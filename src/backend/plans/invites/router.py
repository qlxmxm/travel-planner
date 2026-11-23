# [여행계획] 초대 코드 API
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.access import PlanAccessService
from backend.plans.invites.schemas import InviteInDB, InviteVerify
from backend.plans.invites.service import InviteService
from backend.plans.members.schemas import PlanMemberInDB

router = APIRouter()


@router.post(
    "/{plan_id}/invites",
    response_model=InviteInDB,
    status_code=201,
)
async def create_invite(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.create_invite(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.post("/invites/verify", response_model=InviteInDB)
async def verify_invite(
    data: InviteVerify,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.verify_invite(
        db=db, code=data.i_code
    )


@router.post(
    "/invites/join",
    response_model=PlanMemberInDB,
    status_code=201,
)
async def join_plan_by_invite(
    data: InviteVerify,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.use_invite(
        db=db,
        code=data.i_code,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/invites",
    response_model=list[InviteInDB],
)
async def get_invites_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.get_invites_by_plan(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/invites/{invite_id}",
    response_model=InviteInDB,
)
async def get_invite_by_id(
    plan_id: int,
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    invite = await InviteService.get_invite_by_id(
        db=db, invite_id=invite_id
    )

    if invite is None or invite.p_id != plan_id:
        raise HTTPException(404, "초대 코드가 없습니다.")

    return invite


@router.delete(
    "/{plan_id}/invites/{invite_id}",
    status_code=204,
)
async def delete_invite(
    plan_id: int,
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    invite = await InviteService.get_invite_by_id(
        db=db, invite_id=invite_id
    )

    if invite is None or invite.p_id != plan_id:
        raise HTTPException(404, "초대 코드가 없습니다.")

    await InviteService.delete_invite(db, invite_id)
