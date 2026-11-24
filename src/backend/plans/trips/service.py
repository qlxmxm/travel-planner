# [여행계획] 여행계획 만들기·조회·수정·삭제 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.transaction import PlanTransaction
from backend.plans.trips.crud import PlanCrud
from backend.plans.trips.schemas import PlanCreate, PlanUpdate
from backend.db.transaction import rollback_on_error


class PlanService:

    @staticmethod
    async def create_plan(db: AsyncSession, plan: PlanCreate):
        async with rollback_on_error(db):
            db_plan = await PlanCrud.create(db, plan)
            return await PlanTransaction.save(db, db_plan)

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

    # 값이 들어왔다면 비울 수 없는 항목 (검사 순서 유지)
    _REQUIRED_WHEN_SENT = (
        ("p_start", "시작 시간은 비울 수 없습니다."),
        ("p_end", "종료 시간은 비울 수 없습니다."),
        ("p_title", "여행 제목은 비울 수 없습니다."),
        ("loc", "여행 지역은 비울 수 없습니다."),
        ("p_public", "공개 여부는 비울 수 없습니다."),
    )

    @staticmethod
    def _validate_update(plan: PlanUpdate, db_plan) -> None:
        """여행 정보 수정 요청 검사: 날짜 순서, 비울 수 없는 항목"""
        start = plan.p_start if plan.p_start is not None else db_plan.p_start
        end = plan.p_end if plan.p_end is not None else db_plan.p_end

        if end < start:
            raise HTTPException(
                422, "종료 시간은 시작 시간보다 빠를 수 없습니다."
            )

        for field, message in PlanService._REQUIRED_WHEN_SENT:
            if field in plan.model_fields_set and getattr(plan, field) is None:
                raise HTTPException(422, message)

    @staticmethod
    async def update_plan(
        db: AsyncSession,
        plan_id: int,
        plan: PlanUpdate,
    ):
        db_plan = await PlanCrud.get_by_id(db, plan_id)
        if db_plan is None:
            return None

        PlanService._validate_update(plan, db_plan)

        async with rollback_on_error(db):
            updated = await PlanCrud.update_by_id(db, plan_id, plan)
            return await PlanTransaction.save(db, updated)

    @staticmethod
    async def delete_plan(db: AsyncSession, plan_id: int):
        async with rollback_on_error(db):
            deleted = await PlanCrud.delete_by_id(db, plan_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
