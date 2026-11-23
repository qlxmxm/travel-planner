# [여행계획] DB 읽기·쓰기(CRUD)
from datetime import datetime
from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from zoneinfo import ZoneInfo
from backend.plans.models import (
    Budgets,
    Invite,
    JoinRequest,
    PlanMembers,
    Plans,
    expenses,
    plan_details,
    plan_hashtag,
)
from backend.plans.trips.schemas import PlanCreate, PlanUpdate


class PlanCrud:

    @staticmethod
    async def create(db: AsyncSession, plan: PlanCreate):
        db_plan = Plans(**plan.model_dump(), p_status=False)
        db.add(db_plan)
        await db.flush()
        # 만든 사람은 자동으로 방장 멤버가 된다 (멤버 목록/접근 권한이 한 곳에서 돌아가도록)
        db.add(PlanMembers(p_id=db_plan.p_id, u_id=db_plan.u_id, role="방장"))
        await db.flush()
        return db_plan


    @staticmethod
    async def get_accessible_plans(db: AsyncSession, user_id: int):
        # 내가 방장(u_id)이거나, 멤버(PlanMembers)로 참여했거나, 공개(p_public=True)된 여행 조회
        member_plan_ids = select(PlanMembers.p_id).where(PlanMembers.u_id == user_id)
        stmt = (
            select(Plans)
            .where(
                or_(
                    Plans.u_id == user_id,
                    Plans.p_id.in_(member_plan_ids),
                    Plans.p_public.is_(True),
                )
            )
            .order_by(Plans.p_id.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, plan_id: int):
        return await db.get(Plans, plan_id)

    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(Plans)
            .where(or_(
                Plans.u_id == user_id,  # 내가 만든 여행 + 초대 코드로 참여한 여행
                Plans.p_id.in_(select(PlanMembers.p_id).where(PlanMembers.u_id == user_id)),
            ))
            .order_by(Plans.p_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_public(db: AsyncSession):
        result = await db.execute(
            select(Plans).where(Plans.p_public.is_(True)).order_by(Plans.p_id.desc())
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

        # 이 여행에 딸린 데이터를 먼저 지워야 외래키(FK) 오류가 나지 않는다
        # (예산→지출, 일정, 해시태그 연결, 멤버, 초대 코드, 참여 요청). 여행기는 지우지 않고 원본 계획 연결만 끊는다.
        budget_ids = select(Budgets.b_id).where(Budgets.p_id == plan_id)
        await db.execute(delete(expenses).where(expenses.b_id.in_(budget_ids)))
        for model in (Budgets, plan_details, plan_hashtag, PlanMembers, Invite, JoinRequest):
            await db.execute(delete(model).where(model.p_id == plan_id))

        from backend.journals.journal import journals  # 순환 import 방지용으로 함수 안에서 가져옴
        await db.execute(update(journals).where(journals.p_id == plan_id).values(p_id=None))

        await db.delete(db_plan)
        await db.flush()
        return db_plan


    @staticmethod
    async def complete_expired_plans(db: AsyncSession):
        now = datetime.now(ZoneInfo("Asia/Seoul")).replace(tzinfo=None)

        stmt = (
            update(Plans)
            .where(
                Plans.p_end < now,
                Plans.p_status.is_(False),
            )
            .values(p_status=True)
        )

        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount
