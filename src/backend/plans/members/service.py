# [여행계획] 멤버 조회·역할 변경·내보내기 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import PlanAccessService, PlanValidator
from backend.plans.members.crud import PlanMemberCrud
from backend.plans.members.schemas import PlanMemberCreate, PlanMemberUpdate
from backend.plans.transaction import PlanTransaction


class PlanMemberService:

    @staticmethod
    async def create_member(db: AsyncSession, data: PlanMemberCreate):
        await PlanValidator.check_plan(db, data.p_id)

        existing = await PlanMemberCrud.get_by_plan_and_user(
            db, data.p_id, data.u_id
        )
        if existing is not None:
            raise HTTPException(409, "이미 등록된 여행 멤버입니다.")

        try:
            member = await PlanMemberCrud.create(
                db, data.p_id, data.u_id, data.role
            )
            return await PlanTransaction.save(db, member)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_member_by_id(db: AsyncSession, member_id: int):
        return await PlanMemberCrud.get_by_id(db, member_id)

    @staticmethod
    async def get_members_by_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        # 방장·멤버는 전체 명단, 공개 여행을 구경하는 사람은 방장 한 명(누구의 여행인지 표시용)만 본다
        plan = await PlanAccessService.require_view(db, plan_id, user_id)
        members = [dict(m) for m in await PlanMemberCrud.get_by_plan_with_names(db, plan_id)]
        if plan.u_id == user_id or any(m["u_id"] == user_id for m in members):
            return members
        return [m for m in members if m["u_id"] == plan.u_id]

    @staticmethod
    async def get_members_by_user(db: AsyncSession, user_id: int):
        return await PlanMemberCrud.get_by_user_id(db, user_id)

    @staticmethod
    async def update_member(
        db: AsyncSession,
        member_id: int,
        data: PlanMemberUpdate,
    ):
        await PlanValidator.check_member(db, member_id)

        try:
            member = await PlanMemberCrud.update_role(
                db, member_id, data.role
            )
            return await PlanTransaction.save(db, member)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_member(db: AsyncSession, member_id: int):
        try:
            deleted = await PlanMemberCrud.delete_by_id(db, member_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise
