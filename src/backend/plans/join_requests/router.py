# [여행계획] 참여 요청 API (공개 여행 → "여행플래너 요청하기")
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.access import PlanAccessService
from backend.plans.join_requests.schemas import JoinRequestOut
from backend.plans.join_requests.service import JoinRequestService

router = APIRouter()


@router.post(
    "/{plan_id}/join-requests",
    response_model=JoinRequestOut,
    status_code=201,
)
async def create_join_request(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = await JoinRequestService.create_request(
        db=db, plan_id=plan_id, user_id=user.u_id
    )
    return {
        "jr_id": req.jr_id, "p_id": req.p_id, "u_id": req.u_id,
        "u_name": user.u_name, "jr_create": req.jr_create,
    }


@router.get("/{plan_id}/join-requests/me")
async def get_my_join_request(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JoinRequestService.get_my_request(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.get(
    "/{plan_id}/join-requests",
    response_model=list[JoinRequestOut],
)
async def get_join_requests(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JoinRequestService.list_requests(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.post("/{plan_id}/join-requests/{jr_id}/approve", status_code=204)
async def approve_join_request(
    plan_id: int,
    jr_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 승인(멤버 추가)은 방장만
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )
    await JoinRequestService.approve(db=db, plan_id=plan_id, jr_id=jr_id)


@router.delete("/{plan_id}/join-requests/{jr_id}", status_code=204)
async def delete_join_request(
    plan_id: int,
    jr_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 방장은 거절, 요청한 본인은 취소
    await JoinRequestService.remove(
        db=db, plan_id=plan_id, jr_id=jr_id, user_id=user.u_id
    )
