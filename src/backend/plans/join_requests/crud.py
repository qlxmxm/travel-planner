# [참여 요청] DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.login.models import User
from backend.plans.models import JoinRequest


class JoinRequestCrud:

    @staticmethod
    async def create(db: AsyncSession, plan_id: int, user_id: int):
        req = JoinRequest(p_id=plan_id, u_id=user_id)
        db.add(req)
        await db.flush()
        return req

    @staticmethod
    async def get_by_id(db: AsyncSession, jr_id: int):
        return await db.get(JoinRequest, jr_id)

    @staticmethod
    async def get_by_plan_and_user(db: AsyncSession, plan_id: int, user_id: int):
        result = await db.execute(
            select(JoinRequest).where(
                JoinRequest.p_id == plan_id, JoinRequest.u_id == user_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_plan_with_names(db: AsyncSession, plan_id: int):
        result = await db.execute(
            select(
                JoinRequest.jr_id,
                JoinRequest.p_id,
                JoinRequest.u_id,
                User.u_name,
                JoinRequest.jr_create,
            )
            .join(User, JoinRequest.u_id == User.u_id)
            .where(JoinRequest.p_id == plan_id)
            .order_by(JoinRequest.jr_id)
        )
        return result.mappings().all()

    @staticmethod
    async def delete(db: AsyncSession, req):
        await db.delete(req)
        await db.flush()
