# [여행계획] 세부 일정 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import PlanValidator
from backend.plans.schedules.crud import PlanDetailCrud
from backend.plans.schedules.schemas import PlanDetailCreate, PlanDetailUpdate
from backend.plans.transaction import PlanTransaction
from backend.db.transaction import rollback_on_error


class PlanDetailService:

    @staticmethod
    async def create_detail(db: AsyncSession, data: PlanDetailCreate):
        plan = await PlanValidator.check_plan(db, data.p_id)

        if not plan.p_start <= data.visit_time <= plan.p_end:
            raise HTTPException(
                422, "일정 시간은 여행 시작일과 종료일 사이여야 합니다."
            )

        async with rollback_on_error(db):
            detail = await PlanDetailCrud.create(
                db=db,
                plan_id=data.p_id,
                location_id=data.l_id,
                visit_time=data.visit_time,
                order=data.orders,
                memo=data.memo,
            )
            return await PlanTransaction.save(db, detail)

    @staticmethod
    async def get_detail_by_id(db: AsyncSession, detail_id: int):
        return await PlanDetailCrud.get_by_id(db, detail_id)

    @staticmethod
    async def get_details_by_plan(db: AsyncSession, plan_id: int):
        await PlanValidator.check_plan(db, plan_id)
        return await PlanDetailCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def update_detail(
        db: AsyncSession,
        detail_id: int,
        data: PlanDetailUpdate,
    ):
        detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if detail is None:
            return None

        plan = await PlanValidator.check_plan(db, detail.p_id)

        update_data = data.model_dump(exclude_unset=True)

        for field in ("visit_time", "orders"):
            if field in update_data and update_data[field] is None:
                raise HTTPException(422, f"{field}은 비울 수 없습니다.")

        visit_time = update_data.get("visit_time", detail.visit_time)

        if not plan.p_start <= visit_time <= plan.p_end:
            raise HTTPException(
                422, "일정 시간은 여행 시작일과 종료일 사이여야 합니다."
            )

        async with rollback_on_error(db):
            updated = await PlanDetailCrud.update_by_id(
                db, detail_id, update_data
            )
            return await PlanTransaction.save(db, updated)

    @staticmethod
    async def delete_detail(db: AsyncSession, detail_id: int):
        async with rollback_on_error(db):
            deleted = await PlanDetailCrud.delete_by_id(db, detail_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
