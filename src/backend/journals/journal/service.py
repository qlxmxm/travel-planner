# [여행기] 여행기 본체(목록·상세·수정·삭제·일정 수정) 규칙(서비스)
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.comments.crud import JournalCommentCrud
from backend.journals.from_plan.crud import JournalPlanCrud
from backend.journals.journal.crud import (
    JournalCrud,
    JournalItemCrud,
    JournalListMetaCrud,
    JournalUserCrud,
)
from backend.journals.journal.schemas import (
    JournalFullUpdate,
    JournalItemUpdate,
    JournalResponse,
    JournalUpdate,
)
from backend.journals.responses import JournalResponseService
from backend.journals.validation import JournalValidator


class JournalService:

    @staticmethod
    async def get_journal_list(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ):
        if skip < 0 or not 1 <= limit <= 100:
            raise HTTPException(422, "페이지 범위가 올바르지 않습니다.")

        journals = await JournalCrud.get_list(db, skip, limit)
        return await JournalService._with_author_names(db, journals)

    @staticmethod
    async def get_my_journals(db: AsyncSession, user_id: int):
        journals = await JournalCrud.get_by_user(db, user_id)
        return await JournalService._with_author_names(db, journals)

    @staticmethod
    async def _with_author_names(db: AsyncSession, journals):
        """여행기 목록에 작성자 닉네임(u_name)을 붙여서 돌려줍니다."""
        names = await JournalUserCrud.get_names(db, [j.u_id for j in journals])
        likes = await JournalListMetaCrud.like_counts(db, [j.j_id for j in journals])
        tags = await JournalListMetaCrud.hashtag_names(db, [j.p_id for j in journals])
        result = []
        for journal in journals:
            data = JournalResponse.model_validate(journal).model_dump()
            data["u_name"] = names.get(journal.u_id)
            data["like_count"] = likes.get(journal.j_id, 0)
            data["hashtags"] = tags.get(journal.p_id, [])
            result.append(data)
        return result

    @staticmethod
    async def get_journal_detail(db: AsyncSession, j_id: int):
        journal = await JournalValidator.check_journal_exists(db, j_id)
        items = await JournalItemCrud.get_by_journal(db, j_id)
        comments = await JournalCommentCrud.get_by_journal(db, j_id)

        plan = (
            await JournalPlanCrud.get_plan(db, journal.p_id)
            if journal.p_id is not None else None
        )
        start_date = plan.p_start if plan else None

        names = await JournalUserCrud.get_names(
            db, [journal.u_id] + [c.u_id for c in comments]
        )

        return {
            "journal": JournalResponseService.format_journal(journal, names.get(journal.u_id)),
            "days": JournalResponseService.group_days(items, start_date),
            "comments": JournalResponseService.format_comments(comments, names),
        }

    @staticmethod
    async def get_journal_for_edit(
        db: AsyncSession,
        j_id: int,
        user_id: int,
    ):
        await JournalValidator.check_journal_author(db, j_id, user_id)
        detail = await JournalService.get_journal_detail(db, j_id)

        return {
            "journal": detail["journal"],
            "days": detail["days"],
        }

    @staticmethod
    async def _validate_submitted_items(db: AsyncSession, j_id: int, items):
        """수정 요청의 일정 목록이 기존 여행기 일정과 정확히 일치하고, 각 항목이 올바른지 확인"""
        existing_items = await JournalItemCrud.get_by_journal(db, j_id)
        existing_ids = {item.ji_id for item in existing_items}
        submitted_ids = [item.ji_id for item in items]

        if len(submitted_ids) != len(set(submitted_ids)):
            raise HTTPException(400, "중복된 여행 일정이 있습니다.")

        if set(submitted_ids) != existing_ids:
            raise HTTPException(
                400, "여행기의 모든 일정을 정확히 전달해야 합니다."
            )

        for item in items:
            JournalValidator.check_item_update(item)

    @staticmethod
    async def update_journal(
        db: AsyncSession,
        j_id: int,
        user_id: int,
        data: JournalFullUpdate,
    ):
        await JournalValidator.check_journal_author(db, j_id, user_id)

        if "j_title" in data.model_fields_set:
            if data.j_title is None or not data.j_title.strip():
                raise HTTPException(422, "여행기 제목을 입력해야 합니다.")

        if data.items is not None:
            await JournalService._validate_submitted_items(db, j_id, data.items)

        journal_update = JournalUpdate(
            **data.model_dump(exclude_unset=True, exclude={"items"})
        )

        try:
            await JournalCrud.update(db, j_id, journal_update)

            if data.items is not None:
                for item in data.items:
                    item_update = JournalItemUpdate(
                        **item.model_dump(
                            exclude_unset=True,
                            exclude={"ji_id"},
                        )
                    )
                    await JournalItemCrud.update(db, item.ji_id, item_update)

            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return await JournalService.get_journal_detail(db, j_id)

    @staticmethod
    async def delete_journal(
        db: AsyncSession,
        j_id: int,
        user_id: int,
    ):
        await JournalValidator.check_journal_author(db, j_id, user_id)

        try:
            await JournalCommentCrud.delete_by_journal(db, j_id)
            await JournalItemCrud.delete_by_journal(db, j_id)
            await JournalCrud.delete(db, j_id)
            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return {"message": "여행기가 삭제되었습니다."}


class JournalItemService:

    @staticmethod
    async def update_journal_item(
        db: AsyncSession,
        ji_id: int,
        user_id: int,
        data: JournalItemUpdate,
    ):
        item = await JournalItemCrud.get(db, ji_id)

        if item is None:
            raise HTTPException(404, "여행 일정을 찾을 수 없습니다.")

        await JournalValidator.check_journal_author(db, item.j_id, user_id)
        JournalValidator.check_item_update(data)

        try:
            updated_item = await JournalItemCrud.update(db, ji_id, data)
            await db.commit()
            await db.refresh(updated_item)

        except Exception:
            await db.rollback()
            raise

        return JournalResponseService.format_item(updated_item)
