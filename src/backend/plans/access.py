# [여행계획] 권한 확인: 방장 > 편집자 > 참여자(멤버) 규칙과 여행·멤버 존재 검증
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.budgets.crud import BudgetCrud, ExpenseCrud
from backend.plans.members.crud import PlanMemberCrud
from backend.plans.trips.crud import PlanCrud


def require_child(obj, parent_field: str, parent_id: int, message: str):
    """주소의 부모(예: 여행 번호)에 속한 항목이 맞는지 확인. 없거나 다른 부모의 것이면 404.
    예) require_child(budget, "p_id", plan_id, "예산이 없습니다.")"""
    if obj is None or getattr(obj, parent_field) != parent_id:
        raise HTTPException(404, message)
    return obj


class PlanValidator:

    @staticmethod
    async def check_plan(db: AsyncSession, plan_id: int):
        plan = await PlanCrud.get_by_id(db, plan_id)
        if plan is None:
            raise HTTPException(404, "여행계획이 없습니다.")
        return plan

    @staticmethod
    async def check_budget(db: AsyncSession, budget_id: int):
        budget = await BudgetCrud.get_by_id(db, budget_id)
        if budget is None:
            raise HTTPException(404, "예산이 없습니다.")
        return budget

    @staticmethod
    async def check_member(db: AsyncSession, member_id: int):
        member = await PlanMemberCrud.get_by_id(db, member_id)
        if member is None:
            raise HTTPException(404, "여행 멤버가 없습니다.")
        return member

    @staticmethod
    async def check_expense(db: AsyncSession, expense_id: int):
        expense = await ExpenseCrud.get_by_id(db, expense_id)
        if expense is None:
            raise HTTPException(404, "지출 내역이 없습니다.")
        return expense


OWNER_ROLE = "방장"
EDITOR_ROLE = "편집자"
MEMBER_ROLE = "멤버"


class PlanAccessService:

    @staticmethod
    async def require_member(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id == user_id:
            return plan

        member = await PlanMemberCrud.get_by_plan_and_user(
            db, plan_id, user_id
        )

        if member is None:
            raise HTTPException(
                403,
                "해당 여행계획의 작성자 또는 초대된 멤버만 조회할 수 있습니다."
            )

        return plan

    @staticmethod
    async def require_owner(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        message: str = "여행계획 작성자만 수행할 수 있습니다.",
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id != user_id:
            raise HTTPException(403, message)

        return plan

    @staticmethod
    async def require_editor(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        """방장 또는 편집자(역할 '편집자')만 통과. 일정·예산·여행 정보 수정에 쓴다."""
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id == user_id:
            return plan

        member = await PlanMemberCrud.get_by_plan_and_user(
            db, plan_id, user_id
        )

        if member is None or member.role != EDITOR_ROLE:
            raise HTTPException(
                403,
                "방장 또는 편집자만 수정할 수 있습니다."
            )

        return plan

    @staticmethod
    async def require_view(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        """방장·멤버, 또는 공개(p_public) 여행이면 누구든 통과. 일정·장소처럼 공개되는 정보 조회에 쓴다."""
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.p_public or plan.u_id == user_id:
            return plan

        member = await PlanMemberCrud.get_by_plan_and_user(
            db, plan_id, user_id
        )

        if member is None:
            raise HTTPException(
                403,
                "비공개 여행계획입니다. 방장 또는 멤버만 조회할 수 있습니다."
            )

        return plan
