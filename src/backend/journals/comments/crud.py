# [여행기] 댓글 DB 읽기·쓰기(CRUD)
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals import journals_comment
from backend.journals.comments.schemas import JournalCommentCreate, JournalCommentUpdate


class JournalCommentCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        comment: JournalCommentCreate,
    ):
        db_comment = journals_comment(**comment.model_dump())
        db.add(db_comment)
        await db.flush()
        return db_comment

    @staticmethod
    async def get(db: AsyncSession, jc_id: int):
        return await db.get(journals_comment, jc_id)

    @staticmethod
    async def get_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            select(journals_comment)
            .where(journals_comment.j_id == j_id)
            .order_by(
                journals_comment.jc_create,
                journals_comment.jc_id,
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update(
        db: AsyncSession,
        jc_id: int,
        comment_update: JournalCommentUpdate,
    ):
        db_comment = await JournalCommentCrud.get(db, jc_id)
        if db_comment is None:
            return None

        db_comment.jc_content = comment_update.jc_content
        await db.flush()
        return db_comment

    @staticmethod
    async def delete(db: AsyncSession, jc_id: int):
        db_comment = await JournalCommentCrud.get(db, jc_id)
        if db_comment is None:
            return False

        await db.delete(db_comment)
        await db.flush()
        return True

    @staticmethod
    async def delete_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            delete(journals_comment)
            .where(journals_comment.j_id == j_id)
        )
        await db.flush()
        return result.rowcount
