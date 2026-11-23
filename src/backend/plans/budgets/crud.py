# [예산·지출] DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.budgets.schemas import BudgetCreate, BudgetUpdate
from backend.plans.models import Budgets, expenses


class BudgetCrud:

    @staticmethod
    async def create(db: AsyncSession, budget: BudgetCreate):
        db_budget = Budgets(**budget.model_dump(exclude_none=True))
        db.add(db_budget)
        await db.flush()
        return db_budget

    @staticmethod
    async def get_by_id(db: AsyncSession, budget_id: int):
        return await db.get(Budgets, budget_id)

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(Budgets)
            .where(Budgets.p_id == plan_id)
            .order_by(Budgets.b_id)
        )
        return result.scalars().all()

    @staticmethod
    async def update_by_id(
        db: AsyncSession,
        budget_id: int,
        budget: BudgetUpdate,
    ):
        db_budget = await BudgetCrud.get_by_id(db, budget_id)
        if db_budget is None:
            return None

        for key, value in budget.model_dump(exclude_unset=True).items():
            setattr(db_budget, key, value)

        await db.flush()
        return db_budget

    @staticmethod
    async def delete_by_id(db: AsyncSession, budget_id: int):
        db_budget = await BudgetCrud.get_by_id(db, budget_id)
        if db_budget is None:
            return None

        await db.delete(db_budget)
        await db.flush()
        return db_budget


class ExpenseCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        budget_id: int,
        content: str,
        amount: int,
    ):
        db_expense = expenses(
            b_id=budget_id,
            e_content=content,
            e_amount=amount,
        )
        db.add(db_expense)
        await db.flush()
        return db_expense

    @staticmethod
    async def get_by_id(db: AsyncSession, expense_id: int):
        return await db.get(expenses, expense_id)

    @staticmethod
    async def get_by_budget_id(db: AsyncSession, budget_id: int):
        result = await db.execute(
            select(expenses)
            .where(expenses.b_id == budget_id)
            .order_by(expenses.e_time.desc(), expenses.e_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_by_id(
        db: AsyncSession,
        expense_id: int,
        content: str | None = None,
        amount: int | None = None,
    ):
        db_expense = await ExpenseCrud.get_by_id(db, expense_id)
        if db_expense is None:
            return None

        if content is not None:
            db_expense.e_content = content
        if amount is not None:
            db_expense.e_amount = amount

        await db.flush()
        return db_expense

    @staticmethod
    async def delete_by_id(db: AsyncSession, expense_id: int):
        db_expense = await ExpenseCrud.get_by_id(db, expense_id)
        if db_expense is None:
            return None

        await db.delete(db_expense)
        await db.flush()
        return db_expense
