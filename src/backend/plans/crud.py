from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.plans.models import Plans, Budgets
from backend.plans.schemas import PlanCreate, PlanUpdate, BudgetCreate, BudgetUpdate


class PlanCrud:
    @staticmethod
    async def create_plan(db: AsyncSession, plan: PlanCreate):
        db_plan = Plans(**plan.model_dump())
        db.add(db_plan)
        await db.flush()
        return db_plan

    @staticmethod
    async def get_plan_by_id(db: AsyncSession, plan_id: int) -> Plans | None:
        result = await db.execute(select(Plans).filter(Plans.plan_id == plan_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_plan_by_id(
        db: AsyncSession, plan_id: int, plan: PlanUpdate
    ) -> Plans | None:
        db_plan = await db.get(Plans, plan_id)
        if db_plan:
            update_data = Plans.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_plan, key, value)
            await db.flush()
            return db_plan
        return None

    @staticmethod
    async def delete_plan_by_id(db: AsyncSession, plan_id: int) -> Plans | None:
        db_plan = await db.get(Plans, plan_id)
        if db_plan:
            await db.delete(db_plan)
            await db.flush()
            return db_plan
        return None

# 예산
class BudgetCrud:
    @staticmethod
    async def create_budget(db: AsyncSession, budget: BudgetCreate):
        db_budget = Budgets(**budget.model_dump())
        db.add(db_budget)
        await db.flush()
        return db_budget

    @staticmethod
    async def get_budget_by_id(db: AsyncSession, budget_id: int) -> Budgets | None:
        result = await db.execute(
            select(Budgets).filter(Budgets.budget_id == budget_id)
        )
        return result.scalar_one_or_none()
    
    # 계획 아이디로 예산 리스트 조회
    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int) -> list[Budgets]:
        result = await db.execute(select(Budgets).filter(Budgets.p_id == plan_id))
        return list(result.scalars().all())

    @staticmethod
    async def update_budget_by_id(
        db: AsyncSession, budget_id: int, budget: BudgetUpdate
    ) -> Budgets | None:
        db_budget = await db.get(Budgets, budget_id)
        if db_budget:
            update_data = Budgets.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_budget, key, value)
            await db.flush()
            return db_budget
        return None

    @staticmethod
    async def delete_budget_by_id(db: AsyncSession, budget_id: int) -> Budgets | None:
        db_budget = await db.get(Budgets, budget_id)
        if db_budget:
            await db.delete(db_budget)
            await db.flush()
            return db_budget
        return None
