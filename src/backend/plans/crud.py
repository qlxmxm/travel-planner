
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.plans.models import (
    Plans, Invite, PlanMembers, hashtag,
    plan_hashtag, plan_details, Budgets, expenses
)
from backend.plans.schemas import (
    PlanCreate, PlanUpdate, BudgetCreate, BudgetUpdate
)


# ==================================================
# 1. 여행계획 CRUD
# ==================================================

class PlanCrud:

    @staticmethod
    async def create(db: AsyncSession, plan: PlanCreate):
        db_plan = Plans(**plan.model_dump(), p_status=False)
        db.add(db_plan)
        await db.flush()
        return db_plan

    @staticmethod
    async def get_by_id(db: AsyncSession, plan_id: int):
        return await db.get(Plans, plan_id)

    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(Plans).where(Plans.u_id == user_id).order_by(Plans.p_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_by_id(db: AsyncSession, plan_id: int, plan: PlanUpdate):
        db_plan = await PlanCrud.get_by_id(db, plan_id)
        if db_plan is None:
            return None

        for key, value in plan.model_dump(exclude_unset=True).items():
            setattr(db_plan, key, value)

        await db.flush()
        return db_plan

    @staticmethod
    async def delete_by_id(db: AsyncSession, plan_id: int):
        db_plan = await PlanCrud.get_by_id(db, plan_id)
        if db_plan is None:
            return None

        await db.delete(db_plan)
        await db.flush()
        return db_plan


# ==================================================
# 2. 초대 코드 CRUD
# ==================================================

class InviteCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        code: str,
        created_at: datetime,
        expires_at: datetime,
    ):
        db_invite = Invite(
            p_id=plan_id,
            i_code=code,
            i_create=created_at,
            i_expire=expires_at,
            i_used=False,
        )
        db.add(db_invite)
        await db.flush()
        return db_invite

    @staticmethod
    async def get_by_id(db: AsyncSession, invite_id: int):
        return await db.get(Invite, invite_id)

    @staticmethod
    async def get_by_code(db: AsyncSession, code: str):
        result = await db.execute(
            select(Invite).where(Invite.i_code == code)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(Invite)
            .where(Invite.p_id == plan_id)
            .order_by(Invite.i_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def mark_used(db: AsyncSession, invite_id: int):
        db_invite = await InviteCrud.get_by_id(db, invite_id)
        if db_invite is None:
            return None

        db_invite.i_used = True
        await db.flush()
        return db_invite

    @staticmethod
    async def delete_by_id(db: AsyncSession, invite_id: int):
        db_invite = await InviteCrud.get_by_id(db, invite_id)
        if db_invite is None:
            return None

        await db.delete(db_invite)
        await db.flush()
        return db_invite


# ==================================================
# 3. 여행 멤버 CRUD
# ==================================================

class PlanMemberCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        role: str,
    ):
        db_member = PlanMembers(
            p_id=plan_id,
            u_id=user_id,
            role=role,
        )
        db.add(db_member)
        await db.flush()
        return db_member

    @staticmethod
    async def get_by_id(db: AsyncSession, member_id: int):
        return await db.get(PlanMembers, member_id)

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(PlanMembers)
            .where(PlanMembers.p_id == plan_id)
            .order_by(PlanMembers.pm_id)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_plan_and_user(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        result = await db.execute(
            select(PlanMembers).where(
                PlanMembers.p_id == plan_id,
                PlanMembers.u_id == user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(PlanMembers).where(PlanMembers.u_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def update_role(
        db: AsyncSession,
        member_id: int,
        role: str,
    ):
        db_member = await PlanMemberCrud.get_by_id(db, member_id)
        if db_member is None:
            return None

        db_member.role = role
        await db.flush()
        return db_member

    @staticmethod
    async def delete_by_id(db: AsyncSession, member_id: int):
        db_member = await PlanMemberCrud.get_by_id(db, member_id)
        if db_member is None:
            return None

        await db.delete(db_member)
        await db.flush()
        return db_member


# ==================================================
# 4. 해시태그 CRUD
# ==================================================

class HashtagCrud:

    @staticmethod
    async def create(db: AsyncSession, name: str):
        db_hashtag = hashtag(h_name=name)
        db.add(db_hashtag)
        await db.flush()
        return db_hashtag

    @staticmethod
    async def get_by_id(db: AsyncSession, hashtag_id: int):
        return await db.get(hashtag, hashtag_id)

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str):
        result = await db.execute(
            select(hashtag).where(hashtag.h_name == name)
        )
        return result.scalars().first()

    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(
            select(hashtag).order_by(hashtag.h_id)
        )
        return result.scalars().all()

    @staticmethod
    async def delete_by_id(db: AsyncSession, hashtag_id: int):
        db_hashtag = await HashtagCrud.get_by_id(db, hashtag_id)
        if db_hashtag is None:
            return None

        await db.delete(db_hashtag)
        await db.flush()
        return db_hashtag


# ==================================================
# 5. 여행계획 해시태그 연결 CRUD
# ==================================================

class PlanHashtagCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        hashtag_id: int,
    ):
        db_link = plan_hashtag(p_id=plan_id, h_id=hashtag_id)
        db.add(db_link)
        await db.flush()
        return db_link

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(hashtag)
            .join(plan_hashtag, plan_hashtag.h_id == hashtag.h_id)
            .where(plan_hashtag.p_id == plan_id)
            .order_by(hashtag.h_id)
        )
        return result.scalars().all()

    @staticmethod
    async def get_link(
        db: AsyncSession,
        plan_id: int,
        hashtag_id: int,
    ):
        result = await db.execute(
            select(plan_hashtag).where(
                plan_hashtag.p_id == plan_id,
                plan_hashtag.h_id == hashtag_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def delete_link(
        db: AsyncSession,
        plan_id: int,
        hashtag_id: int,
    ):
        db_link = await PlanHashtagCrud.get_link(
            db, plan_id, hashtag_id
        )
        if db_link is None:
            return None

        await db.delete(db_link)
        await db.flush()
        return db_link


# ==================================================
# 6. 여행 세부 일정 CRUD
# ==================================================

class PlanDetailCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        plan_id: int,
        location_id: int | None,
        visit_time: datetime,
        order: int,
        memo: str | None = None,
    ):
        db_detail = plan_details(
            p_id=plan_id,
            l_id=location_id,
            visit_time=visit_time,
            orders=order,
            memo=memo,
        )
        db.add(db_detail)
        await db.flush()
        return db_detail

    @staticmethod
    async def get_by_id(db: AsyncSession, detail_id: int):
        return await db.get(plan_details, detail_id)

    @staticmethod
    async def get_by_plan_id(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(plan_details)
            .where(plan_details.p_id == plan_id)
            .order_by(
                plan_details.visit_time,
                plan_details.orders,
                plan_details.pd_id,
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update_by_id(
        db: AsyncSession,
        detail_id: int,
        update_data: dict,
    ):
        db_detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if db_detail is None:
            return None

        allowed_fields = {"l_id", "visit_time", "orders", "memo"}

        for key, value in update_data.items():
            if key in allowed_fields:
                setattr(db_detail, key, value)

        await db.flush()
        return db_detail

    @staticmethod
    async def delete_by_id(db: AsyncSession, detail_id: int):
        db_detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if db_detail is None:
            return None

        await db.delete(db_detail)
        await db.flush()
        return db_detail


# ==================================================
# 7. 예산 CRUD
# ==================================================

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


# ==================================================
# 8. 지출 CRUD
# ==================================================

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
