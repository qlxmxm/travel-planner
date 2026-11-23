# [초대 코드] DB 읽기·쓰기(CRUD)
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.models import Invite


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
