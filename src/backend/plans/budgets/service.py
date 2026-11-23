# [여행계획] 예산·지출 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import PlanValidator
from backend.plans.budgets.crud import BudgetCrud, ExpenseCrud
from backend.plans.budgets.schemas import (
    BudgetCreate,
    BudgetUpdate,
    ExpenseCreate,
    ExpenseUpdate,
)
from backend.plans.transaction import PlanTransaction


class BudgetService:

    @staticmethod
    async def create_budget(db: AsyncSession, budget: BudgetCreate):
        await PlanValidator.check_plan(db, budget.p_id)

        try:
            db_budget = await BudgetCrud.create(db, budget)
            return await PlanTransaction.save(db, db_budget)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_budget_by_id(db: AsyncSession, budget_id: int):
        return await BudgetCrud.get_by_id(db, budget_id)

    @staticmethod
    async def get_budget_by_plan_id(db: AsyncSession, plan_id: int):
        await PlanValidator.check_plan(db, plan_id)
        return await BudgetCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def update_budget(
        db: AsyncSession,
        budget_id: int,
        budget: BudgetUpdate,
    ):
        await PlanValidator.check_budget(db, budget_id)

        update_data = budget.model_dump(exclude_unset=True)

        for field in ("p_id", "b_budget", "b_date"):
            if field in update_data and update_data[field] is None:
                raise HTTPException(422, f"{field}은 비울 수 없습니다.")

        if "p_id" in update_data:
            await PlanValidator.check_plan(db, budget.p_id)

        try:
            updated = await BudgetCrud.update_by_id(
                db, budget_id, budget
            )
            return await PlanTransaction.save(db, updated)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_budget(db: AsyncSession, budget_id: int):
        try:
            deleted = await BudgetCrud.delete_by_id(db, budget_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise


class ExpenseService:

    @staticmethod
    async def create_expense(db: AsyncSession, data: ExpenseCreate):
        await PlanValidator.check_budget(db, data.b_id)

        try:
            expense = await ExpenseCrud.create(
                db=db,
                budget_id=data.b_id,
                content=data.e_content,
                amount=data.e_amount,
            )
            return await PlanTransaction.save(db, expense)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_expense_by_id(db: AsyncSession, expense_id: int):
        return await ExpenseCrud.get_by_id(db, expense_id)

    @staticmethod
    async def get_expenses_by_budget(db: AsyncSession, budget_id: int):
        await PlanValidator.check_budget(db, budget_id)
        return await ExpenseCrud.get_by_budget_id(db, budget_id)

    @staticmethod
    async def update_expense(
        db: AsyncSession,
        expense_id: int,
        data: ExpenseUpdate,
    ):
        await PlanValidator.check_expense(db, expense_id)

        update_data = data.model_dump(exclude_unset=True)

        for field in ("e_content", "e_amount"):
            if field in update_data and update_data[field] is None:
                raise HTTPException(422, f"{field}은 비울 수 없습니다.")

        try:
            updated = await ExpenseCrud.update_by_id(
                db=db,
                expense_id=expense_id,
                content=update_data.get("e_content"),
                amount=update_data.get("e_amount"),
            )
            return await PlanTransaction.save(db, updated)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_expense(db: AsyncSession, expense_id: int):
        try:
            deleted = await ExpenseCrud.delete_by_id(db, expense_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise
