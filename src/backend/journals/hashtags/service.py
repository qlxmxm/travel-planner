# [여행기] 해시태그 조회 규칙(서비스)
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.hashtags.crud import JournalHashtagCrud
from backend.journals.validation import JournalValidator


class JournalHashtagService:

    @staticmethod
    async def get_hashtags_by_journal(db: AsyncSession, j_id: int):
        await JournalValidator.check_journal_exists(db, j_id)
        return await JournalHashtagCrud.get_by_journal(db, j_id)
