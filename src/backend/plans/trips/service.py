# [여행계획] 여행계획 만들기·조회·수정·삭제 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.transaction import PlanTransaction
from backend.plans.trips.crud import PlanCrud
from backend.plans.trips.schemas import PlanCreate, PlanUpdate


class PlanService:

    @staticmethod
    async def create_plan(db: AsyncSession, plan: PlanCreate):
        try:
            db_plan = await PlanCrud.create(db, plan)
            return await PlanTransaction.save(db, db_plan)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_accessible_plans(db: AsyncSession, user_id: int):
        return await PlanCrud.get_accessible_plans(db, user_id)

    @staticmethod
    async def get_public_plans(db: AsyncSession):
        return await PlanCrud.get_public(db)

    @staticmethod
    async def get_plan_by_id(db: AsyncSession, plan_id: int):
        return await PlanCrud.get_by_id(db, plan_id)

    @staticmethod
    async def get_plans_by_user(db: AsyncSession, user_id: int):
        return await PlanCrud.get_by_user_id(db, user_id)

    @staticmethod
    async def update_plan(
        db: AsyncSession,
        plan_id: int,
        plan: PlanUpdate,
    ):
        db_plan = await PlanCrud.get_by_id(db, plan_id)
        if db_plan is None:
            return None

        start = plan.p_start if plan.p_start is not None else db_plan.p_start
        end = plan.p_end if plan.p_end is not None else db_plan.p_end

        if end < start:
            raise HTTPException(
                422, "종료 시간은 시작 시간보다 빠를 수 없습니다."
            )

        if "p_start" in plan.model_fields_set and plan.p_start is None:
            raise HTTPException(422, "시작 시간은 비울 수 없습니다.")

        if "p_end" in plan.model_fields_set and plan.p_end is None:
            raise HTTPException(422, "종료 시간은 비울 수 없습니다.")

        if "p_title" in plan.model_fields_set and plan.p_title is None:
            raise HTTPException(422, "여행 제목은 비울 수 없습니다.")

        if "loc" in plan.model_fields_set and plan.loc is None:
            raise HTTPException(422, "여행 지역은 비울 수 없습니다.")

        if "p_public" in plan.model_fields_set and plan.p_public is None:
            raise HTTPException(422, "공개 여부는 비울 수 없습니다.")

        try:
            updated = await PlanCrud.update_by_id(db, plan_id, plan)
            return await PlanTransaction.save(db, updated)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_plan(db: AsyncSession, plan_id: int):
        try:
            deleted = await PlanCrud.delete_by_id(db, plan_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise
