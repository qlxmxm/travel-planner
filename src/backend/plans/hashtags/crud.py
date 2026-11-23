# [해시태그] DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.models import hashtag, plan_hashtag


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
