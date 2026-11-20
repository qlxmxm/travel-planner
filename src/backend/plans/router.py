from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.plans.service import PlanService, BudgetService
from backend.plans.schemas import PlanCreate, PlanUpdate, BudgetCreate, BudgetUpdate

router = APIRouter(
    prefix="/plans",
    tags=["여행 계획"]
)

# 여행계획
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_plan(plan: PlanCreate, db: AsyncSession = Depends(get_db)):
    return await PlanService.create_plan(db=db, plan=plan)


@router.get("/{plan_id}")
async def get_plan_by_id(plan_id: int, db: AsyncSession = Depends(get_db)):
    plan = await PlanService.get_plan_by_id(db=db, plan_id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="여행 계획이 없습니다.")
    return plan


# 여행 계획 수정 (Update)
@router.put("/{plan_id}")
async def update_plan_by_id(plan_id: int, plan: PlanUpdate, db: AsyncSession = Depends(get_db)):
    update_plan = await PlanService.update_plan(db=db, plan_id=plan_id, plan=plan)
    if not update_plan:
        raise HTTPException(status_code=404, detail="여행 계획이 없습니다.")
    return update_plan

# 여행 계획 삭제 (Delete)
@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan_by_id(plan_id: int, db: AsyncSession = Depends(get_db)):
    delete_plan = await PlanService.delete_plan(db=db, plan_id=plan_id)
    if not delete_plan:
        raise HTTPException(status_code=404, detail="여행 계획이 없습니다.")
    return None


# 예산 생성
@router.post("/{plan_id}/budgets", status_code=status.HTTP_201_CREATED)
async def create_budget(plan: BudgetCreate, db: AsyncSession = Depends(get_db)):
    return await BudgetService.create_budget(db=db, plan=plan)

# 예산 아이디로 조회
@router.get("/{plan_id}/budgets/{budget_id}")
async def get_budget_by_id(budget_id: int, db: AsyncSession = Depends(get_db)):
    budget = await BudgetService.get_budget_by_id(db=db, budget_id=budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="예산이 없습니다.")
    return budget

# 예산 계획 아이디로 조회해서 리스팅
@router.get("/{plan_id}/budgets")
async def get_budget_by_plan_id(plan_id: int, db: AsyncSession = Depends(get_db)):
    budgets = await BudgetService.get_budget_by_plan_id(db=db, plan_id=plan_id)
    if not budgets:
        raise HTTPException(status_code=404, detail="예산이 없습니다.")
    return budgets


# 예산 수정 (Update)
@router.put("/{plan_id}/budgets/{budget_id}")
async def update_budget_by_id(plan_id: int, budget_id: int, budget: BudgetUpdate, db: AsyncSession = Depends(get_db)):
    update_budget = await BudgetService.update_budget(db=db, plan_id=plan_id, budget_id=budget_id, budget=budget)
    if not update_budget:
        raise HTTPException(status_code=404, detail="예산이 없습니다.")
    return update_budget

# 예산 삭제 (Delete)
@router.delete("/{plan_id}/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget_by_id(plan_id: int, budget_id: int, db: AsyncSession = Depends(get_db)):
    delete_budget_by_id = await BudgetService.delete_budget_by_id(db=db, plan_id=plan_id, budget_id=budget_id)
    if not delete_budget_by_id:
        raise HTTPException(status_code=404, detail="예산이 없습니다.")
    return None
