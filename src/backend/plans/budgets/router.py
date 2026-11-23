# [여행계획] 예산·지출 API
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.plans.budgets.schemas import (
    BudgetCreate,
    BudgetInDB,
    BudgetUpdate,
    ExpenseCreate,
    ExpenseInDB,
    ExpenseUpdate,
)
from backend.plans.budgets.service import BudgetService, ExpenseService
from backend.plans.dependencies import require_editor_dep, require_member_dep

router = APIRouter()


@router.post("/{plan_id}/budgets",
    response_model=BudgetInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_budget(
    plan_id: int,
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db),
):
    if budget.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await BudgetService.create_budget(db=db, budget=budget)


@router.get("/{plan_id}/budgets",
    response_model=list[BudgetInDB],
    dependencies=[Depends(require_member_dep)],
)
async def get_budgets_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await BudgetService.get_budget_by_plan_id(db, plan_id)


@router.get("/{plan_id}/budgets/{budget_id}",
    response_model=BudgetInDB,
    dependencies=[Depends(require_member_dep)],
)
async def get_budget_by_id(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")
    return budget


@router.put("/{plan_id}/budgets/{budget_id}",
    response_model=BudgetInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_budget(
    plan_id: int,
    budget_id: int,
    budget: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
):
    existing = await BudgetService.get_budget_by_id(db, budget_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    if budget.p_id is not None and budget.p_id != plan_id:
        raise HTTPException(422, "예산의 여행계획 ID를 변경할 수 없습니다.")

    return await BudgetService.update_budget(
        db=db, budget_id=budget_id, budget=budget
    )


@router.delete("/{plan_id}/budgets/{budget_id}", status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_budget(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    existing = await BudgetService.get_budget_by_id(db, budget_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    await BudgetService.delete_budget(db, budget_id)


@router.post("/{plan_id}/budgets/{budget_id}/expenses",
    response_model=ExpenseInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_expense(
    plan_id: int,
    budget_id: int,
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    if data.b_id != budget_id:
        raise HTTPException(422, "예산 ID가 일치하지 않습니다.")

    return await ExpenseService.create_expense(db, data)


@router.get("/{plan_id}/budgets/{budget_id}/expenses",
    response_model=list[ExpenseInDB],
    dependencies=[Depends(require_member_dep)],
)
async def get_expenses_by_budget(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    return await ExpenseService.get_expenses_by_budget(db, budget_id)


@router.get("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    response_model=ExpenseInDB,
    dependencies=[Depends(require_member_dep)],
)
async def get_expense_by_id(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    return expense


@router.put("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    response_model=ExpenseInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_expense(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    return await ExpenseService.update_expense(db, expense_id, data)


@router.delete("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_expense(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    await ExpenseService.delete_expense(db, expense_id)
