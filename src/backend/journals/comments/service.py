# [여행기] 댓글 규칙(서비스)
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.comments.crud import JournalCommentCrud
from backend.journals.comments.schemas import JournalCommentCreate, JournalCommentUpdate
from backend.journals.validation import JournalValidator


class JournalCommentService:

    @staticmethod
    async def create_comment(
        db: AsyncSession,
        j_id: int,
        user_id: int,
        content: str,
    ):
        await JournalValidator.check_journal_exists(db, j_id)

        if not content.strip():
            raise HTTPException(422, "댓글 내용을 입력해야 합니다.")

        comment_data = JournalCommentCreate(
            j_id=j_id,
            u_id=user_id,
            jc_content=content,
        )

        try:
            comment = await JournalCommentCrud.create(db, comment_data)
            await db.commit()
            await db.refresh(comment)

        except Exception:
            await db.rollback()
            raise

        return comment

    @staticmethod
    async def get_comments_by_journal(db: AsyncSession, j_id: int):
        await JournalValidator.check_journal_exists(db, j_id)
        return await JournalCommentCrud.get_by_journal(db, j_id)

    @staticmethod
    async def update_comment(
        db: AsyncSession,
        jc_id: int,
        user_id: int,
        data: JournalCommentUpdate,
    ):
        await JournalValidator.check_comment_author(db, jc_id, user_id)

        if not data.jc_content.strip():
            raise HTTPException(422, "댓글 내용을 입력해야 합니다.")

        try:
            comment = await JournalCommentCrud.update(db, jc_id, data)
            await db.commit()
            await db.refresh(comment)

        except Exception:
            await db.rollback()
            raise

        return comment

    @staticmethod
    async def delete_comment(
        db: AsyncSession,
        jc_id: int,
        user_id: int,
    ):
        await JournalValidator.check_comment_author(db, jc_id, user_id)

        try:
            await JournalCommentCrud.delete(db, jc_id)
            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return {"message": "댓글이 삭제되었습니다."}
