
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.plans.crud import (
    PlanCrud,
    InviteCrud,
    PlanMemberCrud,
    HashtagCrud,
    PlanHashtagCrud,
    PlanDetailCrud,
    BudgetCrud,
    ExpenseCrud,
)
from backend.plans.schemas import (
    PlanCreate,
    PlanUpdate,
    InviteCreate,
    PlanMemberCreate,
    PlanMemberUpdate,
    HashtagCreate,
    PlanHashtagCreate,
    PlanDetailCreate,
    PlanDetailUpdate,
    BudgetCreate,
    BudgetUpdate,
    ExpenseCreate,
    ExpenseUpdate,
)


import secrets
from datetime import timedelta
from sqlalchemy import select

from backend.plans.models import Invite

# ==================================================
# 1. 공통 검증 및 트랜잭션
# ==================================================

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


class PlanTransaction:

    @staticmethod
    async def save(db: AsyncSession, obj=None):
        try:
            await db.commit()
            if obj is not None:
                await db.refresh(obj)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                409, "연결된 데이터 또는 중복 데이터로 인해 저장할 수 없습니다."
            )
        except Exception:
            await db.rollback()
            raise

        return obj

    @staticmethod
    async def rollback(db: AsyncSession):
        await db.rollback()


# ==================================================
# 2. 여행계획 Service
# ==================================================

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


# ==================================================
# 3. 초대 코드 Service
# ==================================================

class InviteService:

    @staticmethod
    async def create_invite(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id != user_id:
            raise HTTPException(403, "방장만 초대 코드를 발급할 수 있습니다.")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = now + timedelta(days=7)

        code_value = secrets.token_hex(6).upper()
        code = f"{code_value[:6]}-{code_value[6:]}"

        try:
            invite = await InviteCrud.create(
                db=db,
                plan_id=plan_id,
                code=code,
                created_at=now,
                expires_at=expires_at,
            )
            return await PlanTransaction.save(db, invite)

        except IntegrityError:
            await db.rollback()
            raise HTTPException(409, "코드 생성이 중복되었습니다. 다시 시도해 주세요.")

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_invite_by_id(db: AsyncSession, invite_id: int):
        return await InviteCrud.get_by_id(db, invite_id)

    @staticmethod
    async def get_invites_by_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
    ):
        plan = await PlanValidator.check_plan(db, plan_id)

        if plan.u_id != user_id:
            raise HTTPException(403, "방장만 초대 코드를 조회할 수 있습니다.")

        return await InviteCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def verify_invite(db: AsyncSession, code: str):
        invite = await InviteCrud.get_by_code(db, code)

        if invite is None:
            raise HTTPException(404, "초대 코드가 존재하지 않습니다.")

        if invite.i_used:
            raise HTTPException(409, "이미 사용된 초대 코드입니다.")

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        if invite.i_expire <= now:
            raise HTTPException(400, "만료된 초대 코드입니다.")

        await PlanValidator.check_plan(db, invite.p_id)
        return invite

    @staticmethod
    async def use_invite(
        db: AsyncSession,
        code: str,
        user_id: int,
        role: str = "member",
    ):
        if not role.strip():
            raise HTTPException(422, "멤버 역할을 입력해야 합니다.")

        try:
            result = await db.execute(
                select(Invite)
                .where(Invite.i_code == code)
                .with_for_update()
            )
            invite = result.scalar_one_or_none()

            if invite is None:
                raise HTTPException(404, "초대 코드가 존재하지 않습니다.")

            if invite.i_used:
                raise HTTPException(409, "이미 사용된 초대 코드입니다.")

            now = datetime.now(timezone.utc).replace(tzinfo=None)

            if invite.i_expire <= now:
                raise HTTPException(400, "만료된 초대 코드입니다.")

            plan = await PlanValidator.check_plan(db, invite.p_id)

            if plan.u_id == user_id:
                raise HTTPException(409, "이미 참여 중인 여행입니다.")

            existing = await PlanMemberCrud.get_by_plan_and_user(
                db, invite.p_id, user_id
            )
            if existing is not None:
                raise HTTPException(409, "이미 참여 중인 여행입니다.")

            member = await PlanMemberCrud.create(
                db, invite.p_id, user_id, role
            )

            await InviteCrud.mark_used(db, invite.i_id)
            return await PlanTransaction.save(db, member)

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_invite(db: AsyncSession, invite_id: int):
        try:
            deleted = await InviteCrud.delete_by_id(db, invite_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise


# ==================================================
# 4. 여행 멤버 Service
# ==================================================

class PlanMemberService:

    @staticmethod
    async def create_member(db: AsyncSession, data: PlanMemberCreate):
        await PlanValidator.check_plan(db, data.p_id)

        existing = await PlanMemberCrud.get_by_plan_and_user(
            db, data.p_id, data.u_id
        )
        if existing is not None:
            raise HTTPException(409, "이미 등록된 여행 멤버입니다.")

        try:
            member = await PlanMemberCrud.create(
                db, data.p_id, data.u_id, data.role
            )
            return await PlanTransaction.save(db, member)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_member_by_id(db: AsyncSession, member_id: int):
        return await PlanMemberCrud.get_by_id(db, member_id)

    @staticmethod
    async def get_members_by_plan(db: AsyncSession, plan_id: int):
        await PlanValidator.check_plan(db, plan_id)
        return await PlanMemberCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def get_members_by_user(db: AsyncSession, user_id: int):
        return await PlanMemberCrud.get_by_user_id(db, user_id)

    @staticmethod
    async def update_member(
        db: AsyncSession,
        member_id: int,
        data: PlanMemberUpdate,
    ):
        await PlanValidator.check_member(db, member_id)

        try:
            member = await PlanMemberCrud.update_role(
                db, member_id, data.role
            )
            return await PlanTransaction.save(db, member)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_member(db: AsyncSession, member_id: int):
        try:
            deleted = await PlanMemberCrud.delete_by_id(db, member_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise


# ==================================================
# 5. 해시태그 Service
# ==================================================

class HashtagService:

    @staticmethod
    async def create_hashtag(db: AsyncSession, data: HashtagCreate):
        existing = await HashtagCrud.get_by_name(db, data.h_name)
        if existing is not None:
            return existing

        try:
            tag = await HashtagCrud.create(db, data.h_name)
            return await PlanTransaction.save(db, tag)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_hashtag_by_id(db: AsyncSession, hashtag_id: int):
        return await HashtagCrud.get_by_id(db, hashtag_id)

    @staticmethod
    async def get_all_hashtags(db: AsyncSession):
        return await HashtagCrud.get_all(db)

    @staticmethod
    async def delete_hashtag(db: AsyncSession, hashtag_id: int):
        tag = await HashtagCrud.get_by_id(db, hashtag_id)
        if tag is None:
            return None

        try:
            deleted = await HashtagCrud.delete_by_id(db, hashtag_id)
            await PlanTransaction.save(db)
            return deleted is not None
        except Exception:
            await db.rollback()
            raise


# ==================================================
# 6. 여행계획 해시태그 연결 Service
# ==================================================

class PlanHashtagService:

    @staticmethod
    async def add_hashtag(db: AsyncSession, data: PlanHashtagCreate):
        await PlanValidator.check_plan(db, data.p_id)

        tag = await HashtagCrud.get_by_id(db, data.h_id)
        if tag is None:
            raise HTTPException(404, "해시태그가 없습니다.")

        existing = await PlanHashtagCrud.get_link(
            db, data.p_id, data.h_id
        )
        if existing is not None:
            raise HTTPException(409, "이미 연결된 해시태그입니다.")

        try:
            link = await PlanHashtagCrud.create(
                db, data.p_id, data.h_id
            )
            return await PlanTransaction.save(db, link)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_hashtags_by_plan(db: AsyncSession, plan_id: int):
        await PlanValidator.check_plan(db, plan_id)
        return await PlanHashtagCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def remove_hashtag(
        db: AsyncSession,
        plan_id: int,
        hashtag_id: int,
    ):
        try:
            deleted = await PlanHashtagCrud.delete_link(
                db, plan_id, hashtag_id
            )
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise


# ==================================================
# 7. 여행 세부 일정 Service
# ==================================================

class PlanDetailService:

    @staticmethod
    async def create_detail(db: AsyncSession, data: PlanDetailCreate):
        plan = await PlanValidator.check_plan(db, data.p_id)

        if not plan.p_start <= data.visit_time <= plan.p_end:
            raise HTTPException(
                422, "일정 시간은 여행 시작일과 종료일 사이여야 합니다."
            )

        try:
            detail = await PlanDetailCrud.create(
                db=db,
                plan_id=data.p_id,
                location_id=data.l_id,
                visit_time=data.visit_time,
                order=data.orders,
                memo=data.memo,
            )
            return await PlanTransaction.save(db, detail)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_detail_by_id(db: AsyncSession, detail_id: int):
        return await PlanDetailCrud.get_by_id(db, detail_id)

    @staticmethod
    async def get_details_by_plan(db: AsyncSession, plan_id: int):
        await PlanValidator.check_plan(db, plan_id)
        return await PlanDetailCrud.get_by_plan_id(db, plan_id)

    @staticmethod
    async def update_detail(
        db: AsyncSession,
        detail_id: int,
        data: PlanDetailUpdate,
    ):
        detail = await PlanDetailCrud.get_by_id(db, detail_id)
        if detail is None:
            return None

        plan = await PlanValidator.check_plan(db, detail.p_id)

        update_data = data.model_dump(exclude_unset=True)

        for field in ("visit_time", "orders"):
            if field in update_data and update_data[field] is None:
                raise HTTPException(422, f"{field}은 비울 수 없습니다.")

        visit_time = update_data.get("visit_time", detail.visit_time)

        if not plan.p_start <= visit_time <= plan.p_end:
            raise HTTPException(
                422, "일정 시간은 여행 시작일과 종료일 사이여야 합니다."
            )

        try:
            updated = await PlanDetailCrud.update_by_id(
                db, detail_id, update_data
            )
            return await PlanTransaction.save(db, updated)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_detail(db: AsyncSession, detail_id: int):
        try:
            deleted = await PlanDetailCrud.delete_by_id(db, detail_id)
            if deleted is None:
                return None

            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise


# ==================================================
# 8. 예산 Service
# ==================================================

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


# ==================================================
# 9. 지출 Service
# ==================================================

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
