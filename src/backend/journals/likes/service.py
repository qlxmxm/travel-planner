# [여행기] 좋아요 규칙(서비스)
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.likes.crud import JournalLikeCrud
from backend.journals.validation import JournalValidator


class JournalLikeService:

    @staticmethod
    async def get_count(db: AsyncSession, j_id: int):
        await JournalValidator.check_journal_exists(db, j_id)
        return {"j_id": j_id, "like_count": await JournalLikeCrud.count(db, j_id)}

    @staticmethod
    async def get_my_likes(db: AsyncSession, user_id: int):
        likes = await JournalLikeCrud.get_by_user(db, user_id)
        return [{"j_id": like.j_id, "jl_create": like.jl_create} for like in likes]

    @staticmethod
    async def add_like(db: AsyncSession, j_id: int, user_id: int):
        await JournalValidator.check_journal_exists(db, j_id)

        # 이미 눌렀으면 그대로 성공 처리 (중복 클릭/새로고침에도 안전)
        if await JournalLikeCrud.get(db, j_id, user_id) is None:
            try:
                await JournalLikeCrud.create(db, j_id, user_id)
                await db.commit()
            except Exception:
                await db.rollback()
                raise

        return {"message": "좋아요를 눌렀습니다."}

    @staticmethod
    async def remove_like(db: AsyncSession, j_id: int, user_id: int):
        await JournalValidator.check_journal_exists(db, j_id)

        try:
            await JournalLikeCrud.delete(db, j_id, user_id)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        return {"message": "좋아요를 취소했습니다."}
