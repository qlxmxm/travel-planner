# [여행기] 해시태그 조회 DB 읽기·쓰기(CRUD)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals import journals
from backend.plans.models import hashtag, plan_hashtag


class JournalHashtagCrud:

    @staticmethod
    async def get_by_journal(db: AsyncSession, j_id: int):
        """여행기의 원본 여행계획에 연결된 해시태그 조회 (계획의 해시태그를 그대로 따라간다)"""
        result = await db.execute(
            select(hashtag)
            .join(plan_hashtag, plan_hashtag.h_id == hashtag.h_id)
            .join(journals, journals.p_id == plan_hashtag.p_id)
            .where(journals.j_id == j_id)
            .order_by(hashtag.h_id)
        )
        return result.scalars().all()
