# [세부 일정] DB 읽기·쓰기(CRUD)
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.models import plan_details


class PlanDetailCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        location_id: int | None,
        visit_time: datetime,
        order: int,
        memo: str | None = None,
    ):
        db_detail = plan_details(
            p_id=plan_id,
            l_id=location_id,
            visit_time=visit_time,
            orders=order,
            memo=memo,
        )
        db.add(db_detail)
        await db.flush()
        return db_detail

    @staticmethod
    async def get_by_id(db: AsyncSession, detail_id: int):
        return await db.get(plan_details, detail_id)

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(plan_details)
            .where(plan_details.p_id == plan_id)
            .order_by(
                plan_details.visit_time,
                plan_details.orders,
                plan_details.pd_id,
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update_by_id(
        db: AsyncSession,
        detail_id: int,
        update_data: dict,
    ):
        db_detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if db_detail is None:
            return None

        allowed_fields = {"l_id", "visit_time", "orders", "memo"}

        for key, value in update_data.items():
            if key in allowed_fields:
                setattr(db_detail, key, value)

        await db.flush()
        return db_detail

    @staticmethod
    async def delete_by_id(db: AsyncSession, detail_id: int):
        db_detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if db_detail is None:
            return None

        await db.delete(db_detail)
        await db.flush()
        return db_detail
