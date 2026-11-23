# [여행기] 좋아요 DB 읽기·쓰기(CRUD)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals import journals_like


class JournalLikeCrud:

    @staticmethod
    async def count(db: AsyncSession, j_id: int) -> int:
        result = await db.execute(
            select(func.count()).select_from(journals_like).where(journals_like.j_id == j_id)
        )
        return int(result.scalar_one())

    @staticmethod
    async def get(db: AsyncSession, j_id: int, u_id: int):
        return await db.get(journals_like, (j_id, u_id))

    @staticmethod
    async def get_by_user(db: AsyncSession, u_id: int):
        result = await db.execute(
            select(journals_like).where(journals_like.u_id == u_id).order_by(journals_like.jl_create.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, j_id: int, u_id: int):
        like = journals_like(j_id=j_id, u_id=u_id)
        db.add(like)
        await db.flush()
        return like

    @staticmethod
    async def delete(db: AsyncSession, j_id: int, u_id: int):
        like = await db.get(journals_like, (j_id, u_id))
        if like is None:
            return None
        await db.delete(like)
        await db.flush()
        return like
