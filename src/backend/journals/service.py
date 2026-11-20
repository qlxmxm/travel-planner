
from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.journals.crud import (
    JournalPlanCrud,
    JournalCrud,
    JournalItemCrud,
    JournalCommentCrud
)
from backend.journals.schema import (
    JournalCreate,
    JournalUpdate,
    JournalItemCreate,
    JournalItemUpdate,
    JournalFromPlanCreate,
    JournalFullUpdate,
    JournalCommentCreate,
    JournalCommentUpdate
)


# ==================================================
# 1. 공통 검증
# ==================================================
class JournalValidator:

    @staticmethod
    async def check_plan_access(
        db: AsyncSession, plan_id: int, user_id: int
    ):
        plan = await JournalPlanCrud.get_plan(db, plan_id)

        if plan is None:
            raise HTTPException(404, "여행계획을 찾을 수 없습니다.")

        if plan.u_id != user_id:
            member = await JournalPlanCrud.get_member(
                db, plan_id, user_id
            )
            if member is None:
                raise HTTPException(403, "여행계획 접근 권한이 없습니다.")

        return plan

    @staticmethod
    async def check_journal_author(
        db: AsyncSession, j_id: int, user_id: int
    ):
        journal = await JournalCrud.get(db, j_id)

        if journal is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")

        if journal.u_id != user_id:
            raise HTTPException(
                403, "본인의 여행기만 수정하거나 삭제할 수 있습니다."
            )

        return journal

    @staticmethod
    async def check_comment_author(
        db: AsyncSession, jc_id: int, user_id: int
    ):
        comment = await JournalCommentCrud.get(db, jc_id)

        if comment is None:
            raise HTTPException(404, "댓글을 찾을 수 없습니다.")

        if comment.u_id != user_id:
            raise HTTPException(
                403, "본인의 댓글만 수정하거나 삭제할 수 있습니다."
            )

        return comment


# ==================================================
# 2. 프론트엔드 반환 데이터 변환
# ==================================================
class JournalResponseService:

    @staticmethod
    def format_time(value):
        """React input[type=time]에 맞는 HH:mm 반환"""
        if value is None:
            return ""
        if isinstance(value, datetime):
            return value.strftime("%H:%M")
        return str(value)[:5]

    @staticmethod
    def format_date(value):
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, date):
            return value.isoformat()
        return None

    @staticmethod
    def group_days(items, start_date=None):
        """
        JournalWritePage.jsx에서 사용하는 days 구조 생성

        [
            {
                "ji_day": 1,
                "date": "2026-11-20",
                "items": [...]
            }
        ]
        """
        days = {}

        for item in items:
            day_number = item.ji_day

            if day_number not in days:
                if item.ji_time is not None:
                    day_date = JournalResponseService.format_date(
                        item.ji_time
                    )
                elif start_date is not None:
                    base_date = (
                        start_date.date()
                        if isinstance(start_date, datetime)
                        else start_date
                    )
                    day_date = (
                        base_date + timedelta(days=day_number - 1)
                    ).isoformat()
                else:
                    day_date = None

                days[day_number] = {
                    "ji_day": day_number,
                    "date": day_date,
                    "items": []
                }

            days[day_number]["items"].append({
                "ji_id": item.ji_id,
                "j_id": item.j_id,
                "ji_day": item.ji_day,
                "ji_order": item.ji_order,
                "ji_time": JournalResponseService.format_time(
                    item.ji_time
                ),
                "ji_title": item.ji_title,
                "ji_content": item.ji_content or "",
                "ji_photo": item.ji_photo or "",
                "ji_rating": item.ji_rating
            })

        return [
            days[key]
            for key in sorted(days)
        ]

    @staticmethod
    def format_journal(journal):
        return {
            "j_id": journal.j_id,
            "p_id": journal.p_id,
            "u_id": journal.u_id,
            "j_title": journal.j_title,
            "j_intro": journal.j_intro or "",
            "j_photo": journal.j_photo or "",
            "p_create": journal.p_create,
            "loc": journal.loc
        }

    @staticmethod
    def format_comments(comments):
        return [
            {
                "jc_id": comment.jc_id,
                "j_id": comment.j_id,
                "u_id": comment.u_id,
                "jc_content": comment.jc_content,
                "jc_create": comment.jc_create
            }
            for comment in comments
        ]


# ==================================================
# 3. 여행계획 → 여행기
# ==================================================
class JournalPlanService:

    @staticmethod
    async def get_plan_preview(
        db: AsyncSession, plan_id: int, user_id: int
    ):
        plan = await JournalValidator.check_plan_access(
            db, plan_id, user_id
        )

        if not plan.p_status:
            raise HTTPException(
                400, "완료된 여행계획만 여행기로 작성할 수 있습니다."
            )

        details = await JournalPlanCrud.get_plan_details(
            db, plan_id
        )

        days = {}

        for detail, place_name in details:
            visit_date = detail.visit_time.date()
            date_key = visit_date.isoformat()
            day_number = (
                visit_date - plan.p_start.date()
            ).days + 1

            if day_number < 1:
                raise HTTPException(
                    400, "여행 시작일보다 앞선 일정이 있습니다."
                )

            if date_key not in days:
                days[date_key] = {
                    "ji_day": day_number,
                    "date": date_key,
                    "items": []
                }

            days[date_key]["items"].append({
                "pd_id": detail.pd_id,
                "ji_day": day_number,
                "ji_order": detail.orders,
                "ji_time": JournalResponseService.format_time(
                    detail.visit_time
                ),
                "ji_title": place_name,
                "ji_content": "",
                "ji_photo": "",
                "ji_rating": None
            })

        return {
            "journal": {
                "p_id": plan.p_id,
                "j_title": plan.p_title,
                "j_intro": "",
                "j_photo": "",
                "loc": plan.loc
            },
            "days": list(days.values())
        }

    @staticmethod
    async def create_journal_from_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        data: JournalFromPlanCreate
    ):
        plan = await JournalValidator.check_plan_access(
            db, plan_id, user_id
        )

        if not plan.p_status:
            raise HTTPException(
                400, "완료된 여행계획만 여행기로 작성할 수 있습니다."
            )

        details = await JournalPlanCrud.get_plan_details(
            db, plan_id
        )

        original_items = {
            detail.pd_id: (detail, place_name)
            for detail, place_name in details
        }

        submitted_items = {
            item.pd_id: item
            for item in data.items
        }

        if len(submitted_items) != len(data.items):
            raise HTTPException(
                400, "중복된 여행 일정이 있습니다."
            )

        if original_items.keys() != submitted_items.keys():
            raise HTTPException(
                400, "원본 여행계획과 제출한 일정이 일치하지 않습니다."
            )

        journal_data = JournalCreate(
            p_id=plan_id,
            u_id=user_id,
            j_title=data.j_title,
            j_intro=data.j_intro,
            j_photo=data.j_photo,
            loc=plan.loc
        )

        try:
            journal = await JournalCrud.create(
                db, journal_data
            )

            journal_items = []

            for pd_id, (detail, place_name) in original_items.items():
                submitted = submitted_items[pd_id]

                day_number = (
                    detail.visit_time.date()
                    - plan.p_start.date()
                ).days + 1

                if day_number < 1:
                    raise HTTPException(
                        400, "여행 시작일보다 앞선 일정이 있습니다."
                    )

                journal_items.append(
                    JournalItemCreate(
                        j_id=journal.j_id,
                        ji_day=day_number,
                        ji_order=detail.orders,
                        ji_time=detail.visit_time,
                        ji_title=place_name,
                        ji_content=submitted.ji_content,
                        ji_photo=submitted.ji_photo,
                        ji_rating=submitted.ji_rating
                    )
                )

            await JournalItemCrud.create_many(
                db, journal_items
            )

            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return await JournalService.get_journal_detail(
            db, journal.j_id
        )


# ==================================================
# 4. 여행기 조회·수정·삭제
# ==================================================
class JournalService:

    @staticmethod
    async def get_journal_list(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ):
        if skip < 0 or not 1 <= limit <= 100:
            raise HTTPException(
                422, "페이지 범위가 올바르지 않습니다."
            )

        return await JournalCrud.get_list(
            db, skip, limit
        )

    @staticmethod
    async def get_my_journals(
        db: AsyncSession, user_id: int
    ):
        return await JournalCrud.get_by_user(
            db, user_id
        )

    @staticmethod
    async def get_journal_detail(
        db: AsyncSession, j_id: int
    ):
        journal = await JournalCrud.get(db, j_id)

        if journal is None:
            raise HTTPException(
                404, "여행기를 찾을 수 없습니다."
            )

        items = await JournalItemCrud.get_by_journal(
            db, j_id
        )
        comments = await JournalCommentCrud.get_by_journal(
            db, j_id
        )

        # 날짜 없는 일정에 대비해 원본 계획 시작일 조회
        # p_id 는 NULL 허용 (원본 계획이 지워진 여행기)
        plan = (
            await JournalPlanCrud.get_plan(db, journal.p_id)
            if journal.p_id else None
        )
        start_date = plan.p_start if plan else None

        return {
            "journal": JournalResponseService.format_journal(
                journal
            ),
            "days": JournalResponseService.group_days(
                items, start_date
            ),
            "comments": JournalResponseService.format_comments(
                comments
            )
        }

    @staticmethod
    async def get_journal_for_edit(
        db: AsyncSession,
        j_id: int,
        user_id: int
    ):
        await JournalValidator.check_journal_author(
            db, j_id, user_id
        )

        # JournalWritePage.jsx 수정 화면과 동일한 구조
        detail = await JournalService.get_journal_detail(
            db, j_id
        )

        return {
            "journal": detail["journal"],
            "days": detail["days"]
        }

    @staticmethod
    async def update_journal(
        db: AsyncSession,
        j_id: int,
        user_id: int,
        data: JournalFullUpdate
    ):
        await JournalValidator.check_journal_author(
            db, j_id, user_id
        )

        if data.items is not None:
            existing_items = await JournalItemCrud.get_by_journal(
                db, j_id
            )

            existing_ids = {
                item.ji_id for item in existing_items
            }
            submitted_ids = [
                item.ji_id for item in data.items
            ]

            if len(submitted_ids) != len(set(submitted_ids)):
                raise HTTPException(
                    400, "중복된 여행 일정이 있습니다."
                )

            if set(submitted_ids) != existing_ids:
                raise HTTPException(
                    400, "여행기의 모든 일정을 정확히 전달해야 합니다."
                )

        journal_update = JournalUpdate(
            **data.model_dump(
                exclude_unset=True,
                exclude={"items"}
            )
        )

        try:
            await JournalCrud.update(
                db, j_id, journal_update
            )

            if data.items is not None:
                for item in data.items:
                    item_update = JournalItemUpdate(
                        **item.model_dump(
                            exclude_unset=True,
                            exclude={"ji_id"}
                        )
                    )

                    await JournalItemCrud.update(
                        db, item.ji_id, item_update
                    )

            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return await JournalService.get_journal_detail(
            db, j_id
        )

    @staticmethod
    async def delete_journal(
        db: AsyncSession,
        j_id: int,
        user_id: int
    ):
        await JournalValidator.check_journal_author(
            db, j_id, user_id
        )

        try:
            await JournalCommentCrud.delete_by_journal(
                db, j_id
            )
            await JournalItemCrud.delete_by_journal(
                db, j_id
            )
            await JournalCrud.delete(
                db, j_id
            )

            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return {"message": "여행기가 삭제되었습니다."}


# ==================================================
# 5. 여행기 개별 일정 수정
# ==================================================
class JournalItemService:

    @staticmethod
    async def update_journal_item(
        db: AsyncSession,
        ji_id: int,
        user_id: int,
        data: JournalItemUpdate
    ):
        item = await JournalItemCrud.get(
            db, ji_id
        )

        if item is None:
            raise HTTPException(
                404, "여행 일정을 찾을 수 없습니다."
            )

        await JournalValidator.check_journal_author(
            db, item.j_id, user_id
        )

        try:
            updated_item = await JournalItemCrud.update(
                db, ji_id, data
            )

            await db.commit()
            await db.refresh(updated_item)

        except Exception:
            await db.rollback()
            raise

        return {
            "ji_id": updated_item.ji_id,
            "j_id": updated_item.j_id,
            "ji_day": updated_item.ji_day,
            "ji_order": updated_item.ji_order,
            "ji_time": JournalResponseService.format_time(
                updated_item.ji_time
            ),
            "ji_title": updated_item.ji_title,
            "ji_content": updated_item.ji_content or "",
            "ji_photo": updated_item.ji_photo or "",
            "ji_rating": updated_item.ji_rating
        }


# ==================================================
# 6. 여행기 댓글
# ==================================================
class JournalCommentService:

    @staticmethod
    async def create_comment(
        db: AsyncSession,
        j_id: int,
        user_id: int,
        content: str
    ):
        journal = await JournalCrud.get(
            db, j_id
        )

        if journal is None:
            raise HTTPException(
                404, "여행기를 찾을 수 없습니다."
            )

        if not isinstance(content, str) or not content.strip():
            raise HTTPException(
                422, "댓글 내용을 입력해야 합니다."
            )

        comment_data = JournalCommentCreate(
            j_id=j_id,
            u_id=user_id,
            jc_content=content
        )

        try:
            comment = await JournalCommentCrud.create(
                db, comment_data
            )
            await db.commit()
            await db.refresh(comment)

        except Exception:
            await db.rollback()
            raise

        return comment

    @staticmethod
    async def get_comments_by_journal(
        db: AsyncSession,
        j_id: int
    ):
        journal = await JournalCrud.get(
            db, j_id
        )

        if journal is None:
            raise HTTPException(
                404, "여행기를 찾을 수 없습니다."
            )

        return await JournalCommentCrud.get_by_journal(
            db, j_id
        )

    @staticmethod
    async def update_comment(
        db: AsyncSession,
        jc_id: int,
        user_id: int,
        data: JournalCommentUpdate
    ):
        await JournalValidator.check_comment_author(
            db, jc_id, user_id
        )

        try:
            comment = await JournalCommentCrud.update(
                db, jc_id, data
            )

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
        user_id: int
    ):
        await JournalValidator.check_comment_author(
            db, jc_id, user_id
        )

        try:
            await JournalCommentCrud.delete(
                db, jc_id
            )
            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return {"message": "댓글이 삭제되었습니다."}
