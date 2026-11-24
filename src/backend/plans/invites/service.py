# [여행계획] 초대 코드 만들기·확인·참여 규칙
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import MEMBER_ROLE, PlanValidator
from backend.plans.invites.crud import InviteCrud
from backend.plans.members.crud import PlanMemberCrud
from backend.plans.models import Invite
from backend.plans.transaction import PlanTransaction


def _utc_now() -> datetime:
    """DB(naive datetime)와 비교하기 위해 시간대 정보를 뗀 현재 UTC 시각"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class InviteService:

    @staticmethod
    def _check_usable(invite) -> None:
        """초대 코드가 존재하고, 아직 쓰지 않았고, 만료되지 않았는지 확인"""
        if invite is None:
            raise HTTPException(404, "초대 코드가 존재하지 않습니다.")

        if invite.i_used:
            raise HTTPException(409, "이미 사용된 초대 코드입니다.")

        if invite.i_expire <= _utc_now():
            raise HTTPException(400, "만료된 초대 코드입니다.")

    @staticmethod
    async def _check_not_joined(db: AsyncSession, plan, user_id: int) -> None:
        """이미 방장이거나 멤버인 사람은 다시 참여할 수 없음"""
        if plan.u_id == user_id:
            raise HTTPException(409, "이미 참여 중인 여행입니다.")

        existing = await PlanMemberCrud.get_by_plan_and_user(db, plan.p_id, user_id)
        if existing is not None:
            raise HTTPException(409, "이미 참여 중인 여행입니다.")

    @staticmethod
    async def create_invite(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id != user_id:
            raise HTTPException(403, "방장만 초대 코드를 발급할 수 있습니다.")

        now = _utc_now()
        expires_at = now + timedelta(days=7)

        code_value = secrets.token_hex(6).upper()
        code = f"{code_value[:6]}-{code_value[6:]}"

        try:
            invite = await InviteCrud.create(
                db=db,
                plan_id=plan_id,
                code=code,
                created_at=now,
                expires_at=expires_at,
            )
            return await PlanTransaction.save(db, invite)

        except IntegrityError:
            await db.rollback()
            raise HTTPException(409, "코드 생성이 중복되었습니다. 다시 시도해 주세요.")

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_invite_by_id(db: AsyncSession, invite_id: int):
        return await InviteCrud.get_by_id(db, invite_id)

    @staticmethod
    async def get_invites_by_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id != user_id:
            raise HTTPException(403, "방장만 초대 코드를 조회할 수 있습니다.")

        return await InviteCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def verify_invite(db: AsyncSession, code: str):
        invite = await InviteCrud.get_by_code(db, code)
        InviteService._check_usable(invite)

        await PlanValidator.check_plan(db, invite.p_id)
        return invite

    @staticmethod
    async def use_invite(
        db: AsyncSession,
        code: str,
        user_id: int,
        role: str = MEMBER_ROLE,
    ):
        if not role.strip():
            raise HTTPException(422, "멤버 역할을 입력해야 합니다.")

        try:
            result = await db.execute(
                select(Invite)
                .where(Invite.i_code == code)
                .with_for_update()
            )
            invite = result.scalar_one_or_none()
            InviteService._check_usable(invite)

            plan = await PlanValidator.check_plan(db, invite.p_id)
            await InviteService._check_not_joined(db, plan, user_id)

            member = await PlanMemberCrud.create(
                db, invite.p_id, user_id, role
            )

            await InviteCrud.mark_used(db, invite.i_id)
            return await PlanTransaction.save(db, member)

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_invite(db: AsyncSession, invite_id: int):
        try:
            deleted = await InviteCrud.delete_by_id(db, invite_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise
