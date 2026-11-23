# [여행계획] 라우터에 붙이는 권한 의존성: 방장 > 편집자 > 멤버 순서.
# 경로의 {plan_id} 로 여행을 찾아 로그인한 사용자의 권한을 검사한다.
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.plans.access import PlanAccessService


async def require_editor_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_editor(db=db, plan_id=plan_id, user_id=user.u_id)


async def require_member_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_member(db=db, plan_id=plan_id, user_id=user.u_id)


async def require_view_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_view(db=db, plan_id=plan_id, user_id=user.u_id)
