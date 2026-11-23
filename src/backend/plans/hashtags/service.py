# [여행계획] 해시태그와 여행계획 해시태그 연결 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import PlanValidator
from backend.plans.hashtags.crud import HashtagCrud, PlanHashtagCrud
from backend.plans.hashtags.schemas import HashtagCreate, PlanHashtagCreate
from backend.plans.transaction import PlanTransaction


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
