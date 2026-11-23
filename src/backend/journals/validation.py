# [여행기] 공통 검증(여행기·작성자·완료된 여행 확인)
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.comments.crud import JournalCommentCrud
from backend.journals.from_plan.crud import JournalPlanCrud
from backend.journals.journal.crud import JournalCrud
from backend.journals.journal.schemas import JournalItemUpdate


class JournalValidator:

    @staticmethod
    async def check_plan_access(db: AsyncSession, plan_id: int, user_id: int):
        plan = await JournalPlanCrud.get_plan(db, plan_id)

        if plan is None:
            raise HTTPException(404, "여행계획을 찾을 수 없습니다.")

        if plan.u_id != user_id:
            member = await JournalPlanCrud.get_member(db, plan_id, user_id)
            if member is None:
                raise HTTPException(403, "여행계획 접근 권한이 없습니다.")

        return plan

    @staticmethod
    async def check_completed_plan(db: AsyncSession, plan_id: int, user_id: int):
        plan = await JournalValidator.check_plan_access(db, plan_id, user_id)

        # 완료 처리(p_status)는 스케줄러가 하므로, 여행 기간이 이미 끝난 여행도 완료로 본다
        ended = plan.p_end is not None and plan.p_end < datetime.now()
        if not plan.p_status and not ended:
            raise HTTPException(400, "완료된 여행계획만 여행기로 작성할 수 있습니다.")

        if plan.p_start is None:
            raise HTTPException(400, "여행계획의 시작일이 없습니다.")

        return plan

    @staticmethod
    async def check_journal_exists(db: AsyncSession, j_id: int):
        journal = await JournalCrud.get(db, j_id)

        if journal is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")

        return journal

    @staticmethod
    async def check_journal_author(
        db: AsyncSession,
        j_id: int,
        user_id: int,
    ):
        journal = await JournalValidator.check_journal_exists(db, j_id)

        if journal.u_id != user_id:
            raise HTTPException(
                403,
                "본인의 여행기만 수정하거나 삭제할 수 있습니다."
            )

        return journal

    @staticmethod
    async def check_comment_author(db: AsyncSession, jc_id: int, user_id: int):
        comment = await JournalCommentCrud.get(db, jc_id)

        if comment is None:
            raise HTTPException(404, "댓글을 찾을 수 없습니다.")

        if comment.u_id != user_id:
            raise HTTPException(403, "본인의 댓글만 수정하거나 삭제할 수 있습니다.")

        return comment

    @staticmethod
    def check_item_update(data: JournalItemUpdate):
        if "ji_rating" in data.model_fields_set and data.ji_rating is None:
            raise HTTPException(422, "여행기 별점은 필수입니다.")

    @staticmethod
    async def check_journal_access(
        db: AsyncSession,
        j_id: int,
        user_id: int,
    ):
        journal = await JournalValidator.check_journal_exists(db, j_id)

        if journal.p_id is None:
            if journal.u_id != user_id:
                raise HTTPException(
                    403,
                    "해당 여행계획의 작성자 또는 초대된 멤버만 조회할 수 있습니다."
                )
            return journal

        await JournalValidator.check_plan_access(
            db, journal.p_id, user_id
        )
        return journal
