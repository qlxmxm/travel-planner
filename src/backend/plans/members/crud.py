# [여행 멤버] DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.login.models import User
from backend.plans.models import PlanMembers


class PlanMemberCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        role: str,
    ):
        db_member = PlanMembers(
            p_id=plan_id,
            u_id=user_id,
            role=role,
        )
        db.add(db_member)
        await db.flush()
        return db_member

    @staticmethod
    async def get_by_id(db: AsyncSession, member_id: int):
        return await db.get(PlanMembers, member_id)

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(PlanMembers)
            .where(PlanMembers.p_id == plan_id)
            .order_by(PlanMembers.pm_id)
        )
        return result.scalars().all()


    @staticmethod
    async def get_by_plan_with_names(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(
                PlanMembers.pm_id,
                PlanMembers.p_id,
                PlanMembers.u_id,
                User.u_name,
                PlanMembers.role,
            )
            .join(User, PlanMembers.u_id == User.u_id)
            .where(PlanMembers.p_id == plan_id)
            .order_by(PlanMembers.pm_id)
        )
        return result.mappings().all()

    @staticmethod
    async def get_by_plan_and_user(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        result = await db.execute(
            select(PlanMembers).where(
                PlanMembers.p_id == plan_id,
                PlanMembers.u_id == user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(PlanMembers).where(PlanMembers.u_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def update_role(
        db: AsyncSession,
        member_id: int,
        role: str,
    ):
        db_member = await PlanMemberCrud.get_by_id(db, member_id)
        if db_member is None:
            return None

        db_member.role = role
        await db.flush()
        return db_member

    @staticmethod
    async def delete_by_id(db: AsyncSession, member_id: int):
        db_member = await PlanMemberCrud.get_by_id(db, member_id)
        if db_member is None:
            return None

        await db.delete(db_member)
        await db.flush()
        return db_member
