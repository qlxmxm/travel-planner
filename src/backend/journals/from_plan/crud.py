# [여행기] 여행계획으로 여행기 쓰기 DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.location.models import Location
from backend.plans.models import PlanMembers, Plans, hashtag, plan_details, plan_hashtag


class JournalPlanCrud:

    @staticmethod
    async def get_plan(db: AsyncSession, p_id: int):
        return await db.get(Plans, p_id)

    @staticmethod
    async def get_member(db: AsyncSession, p_id: int, u_id: int):
        result = await db.execute(
            select(PlanMembers).where(
                PlanMembers.p_id == p_id,
                PlanMembers.u_id == u_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_plan_details(db: AsyncSession, p_id: int):
        """장소가 연결되지 않은 일정도 포함하여 조회"""
        result = await db.execute(
            select(plan_details, Location.l_name)
            .outerjoin(Location, plan_details.l_id == Location.l_id)
            .where(plan_details.p_id == p_id)
            .order_by(
                plan_details.visit_time,
                plan_details.orders,
                plan_details.pd_id,
            )
        )
        return result.all()

    @staticmethod
    async def get_plan_hashtags(db: AsyncSession, p_id: int):
        """기존 여행계획에 연결된 해시태그 조회"""
        result = await db.execute(
            select(hashtag)
            .join(plan_hashtag, plan_hashtag.h_id == hashtag.h_id)
            .where(plan_hashtag.p_id == p_id)
            .order_by(hashtag.h_id)
        )
        return result.scalars().all()
