from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.crud import PlanCrud,BudgetCrud
from backend.plans.schemas import PlanCreate, PlanUpdate, BudgetCreate, BudgetUpdate


class PlanService:
    @staticmethod
    async def create_plan(db: AsyncSession, plan: PlanCreate):
        db_plan = await PlanCrud.create(db=db, plan=plan)
        await db.commit()
        await db.refresh(db_plan)
        return db_plan

    @staticmethod
    async def get_plan_by_id(db: AsyncSession, plan_id: int):
        return await PlanCrud.get_by_id(db=db, plan_id=plan_id)

    @staticmethod
    async def update_plan(db: AsyncSession, plan_id: int, plan: PlanUpdate):
        updated_plan = await PlanCrud.update_by_id(db=db, plan_id=plan_id, plan=plan)
        if updated_plan:
            await db.commit()
            await db.refresh(updated_plan)
        return updated_plan

    @staticmethod
    async def delete_plan(db: AsyncSession, plan_id: int):
        deleted_plan = await PlanCrud.delete_by_id(db=db, plan_id=plan_id)
        if deleted_plan:
            await db.commit()
        return deleted_plan


class BudgetService:
    @staticmethod
    async def create_budget(db: AsyncSession, budget: BudgetCreate):
        db_budget = await BudgetCrud.create(db=db, budget=budget)
        await db.commit()
        await db.refresh(db_budget)
        return db_budget

    @staticmethod
    async def get_budget_by_id(db: AsyncSession, budget_id: int):
        return await BudgetCrud.get_by_id(db=db, budget_id=budget_id)

    @staticmethod
    async def get_budget_by_plan_id(db: AsyncSession, plan_id: int):
        return await BudgetCrud.get_by_id(db=db, plan_id=plan_id)

    @staticmethod
    async def update_budget(db: AsyncSession, budget_id: int, budget: BudgetUpdate):
        updated_budget = await BudgetCrud.update_by_id(db=db, budget_id=budget_id, budget=budget)
        if updated_budget:
            await db.commit()
            await db.refresh(updated_budget)
        return updated_budget

    @staticmethod
    async def delete_budget(db: AsyncSession, budget_id: int):
        deleted_budget = await BudgetCrud.delete_by_id(db=db, budget_id=budget_id)
        if deleted_budget:
            await db.commit()
        return deleted_budget


