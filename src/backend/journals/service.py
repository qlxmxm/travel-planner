
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.journals.journal import journals, journals_item, journals_comment
from backend.journals.schema import JournalCommentUpdate
from backend.plans.models import Plans, PlanMembers, plan_details
from backend.location.models import Location


# ==================================================
# 공통 검증
# ==================================================
class JournalValidator:

    @staticmethod
    async def check_author(db: AsyncSession, j_id: int, user_id: int):
        journal = await db.get(journals, j_id)
        if journal is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")
        if journal.u_id != user_id:
            raise HTTPException(403, "본인의 여행기만 수정할 수 있습니다.")
        return journal

    @staticmethod
    def check_rating(rating):
        if type(rating) is not int or not 1 <= rating <= 5:
            raise HTTPException(422, "별점은 1~5점이어야 합니다.")

    @staticmethod
    def check_journal_fields(data: dict):
        limits = {"j_title": 100, "j_intro": 100, "j_photo": 255}
        for field, limit in limits.items():
            if field not in data:
                continue
            value = data[field]
            if value is not None and (not isinstance(value, str) or len(value) > limit):
                raise HTTPException(422, f"{field} 값이 올바르지 않습니다.")

        if "j_title" in data and (
            not isinstance(data["j_title"], str) or not data["j_title"].strip()
        ):
            raise HTTPException(422, "여행기 제목은 필수입니다.")

    @staticmethod
    def check_item_fields(data: dict):
        if "ji_rating" in data:
            JournalValidator.check_rating(data["ji_rating"])

        if "ji_content" in data:
            value = data["ji_content"]
            if value is not None and not isinstance(value, str):
                raise HTTPException(422, "여행 기록이 올바르지 않습니다.")

        if "ji_photo" in data:
            value = data["ji_photo"]
            if value is not None and (not isinstance(value, str) or len(value) > 255):
                raise HTTPException(422, "사진 경로가 올바르지 않습니다.")


# ==================================================
# 1. 여행계획 → 여행기
# ==================================================
class JournalPlanService:

    @staticmethod
    async def check_plan(db: AsyncSession, plan_id: int, user_id: int):
        plan = await db.get(Plans, plan_id)
        if plan is None:
            raise HTTPException(404, "여행계획을 찾을 수 없습니다.")

        member = await db.scalar(
            select(PlanMembers.pm_id).where(
                PlanMembers.p_id == plan_id,
                PlanMembers.u_id == user_id
            )
        )
        if plan.u_id != user_id and member is None:
            raise HTTPException(403, "여행계획 접근 권한이 없습니다.")

        if not plan.p_status:
            raise HTTPException(400, "완료된 여행계획만 여행기로 작성할 수 있습니다.")

        return plan

    @staticmethod
    async def get_plan_preview(db: AsyncSession, plan_id: int, user_id: int):
        plan = await JournalPlanService.check_plan(db, plan_id, user_id)

        result = await db.execute(
            select(plan_details, Location.l_name)
            .join(Location, plan_details.l_id == Location.l_id)
            .where(plan_details.p_id == plan_id)
            .order_by(plan_details.visit_time, plan_details.orders, plan_details.pd_id)
        )

        days = {}
        for detail, place_name in result.all():
            date = detail.visit_time.date()
            date_key = date.isoformat()
            day_number = (date - plan.p_start.date()).days + 1

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
                "ji_time": detail.visit_time.isoformat(),
                "ji_title": place_name,
                "ji_content": "",
                "ji_photo": None,
                "ji_rating": None
            })

        return {
            "journal": {
                "p_id": plan.p_id,
                "j_title": plan.p_title,
                "j_intro": "",
                "j_photo": None,
                "loc": plan.loc
            },
            "days": list(days.values())
        }

    @staticmethod
    async def create_journal_from_plan(
        db: AsyncSession, plan_id: int, user_id: int, data: dict
    ):
        preview = await JournalPlanService.get_plan_preview(db, plan_id, user_id)
        JournalValidator.check_journal_fields(data)

        originals = [item for day in preview["days"] for item in day["items"]]
        submitted = data.get("items", [])

        if not isinstance(submitted, list) or len(originals) != len(submitted):
            raise HTTPException(400, "여행 일정이 일치하지 않습니다.")

        original_by_id = {item["pd_id"]: item for item in originals}
        original_by_order = {}

        for original in originals:
            key = (original["ji_day"], original["ji_order"])
            original_by_order.setdefault(key, []).append(original)

        matched = {}
        for item in submitted:
            if not isinstance(item, dict):
                raise HTTPException(422, "잘못된 일정 데이터입니다.")

            if item.get("pd_id") is not None:
                original = original_by_id.get(item["pd_id"])
            else:
                key = (item.get("ji_day"), item.get("ji_order"))
                candidates = original_by_order.get(key, [])
                if len(candidates) != 1:
                    raise HTTPException(400, "일정 식별을 위해 pd_id가 필요합니다.")
                original = candidates[0]

            if original is None or original["pd_id"] in matched:
                raise HTTPException(400, "중복되거나 존재하지 않는 일정입니다.")

            JournalValidator.check_item_fields(item)
            JournalValidator.check_rating(item.get("ji_rating"))
            matched[original["pd_id"]] = item

        if len(matched) != len(originals):
            raise HTTPException(400, "누락된 일정이 있습니다.")

        try:
            journal = journals(
                p_id=plan_id,
                u_id=user_id,
                j_title=data.get("j_title") or preview["journal"]["j_title"],
                j_intro=data.get("j_intro"),
                j_photo=data.get("j_photo"),
                loc=preview["journal"]["loc"]
            )
            db.add(journal)
            await db.flush()

            for original in originals:
                item = matched[original["pd_id"]]
                db.add(journals_item(
                    j_id=journal.j_id,
                    ji_day=original["ji_day"],
                    ji_order=original["ji_order"],
                    ji_time=datetime.fromisoformat(original["ji_time"]),
                    ji_title=original["ji_title"],
                    ji_content=item.get("ji_content"),
                    ji_photo=item.get("ji_photo"),
                    ji_rating=item["ji_rating"]
                ))

            await db.commit()
            await db.refresh(journal)
            return journal

        except Exception:
            await db.rollback()
            raise


# ==================================================
# 2. 여행기 기본 기능
# ==================================================
class JournalService:

    @staticmethod
    async def get_journal_list(db: AsyncSession, skip: int = 0, limit: int = 100):
        if skip < 0 or not 1 <= limit <= 100:
            raise HTTPException(422, "페이지 범위가 올바르지 않습니다.")

        return (await db.scalars(
            select(journals)
            .order_by(journals.j_id.desc())
            .offset(skip).limit(limit)
        )).all()

    @staticmethod
    async def get_journal_detail(db: AsyncSession, j_id: int):
        journal = await db.get(journals, j_id)
        if journal is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")

        items = (await db.scalars(
            select(journals_item)
            .where(journals_item.j_id == j_id)
            .order_by(journals_item.ji_day, journals_item.ji_order, journals_item.ji_id)
        )).all()

        comments = (await db.scalars(
            select(journals_comment)
            .where(journals_comment.j_id == j_id)
            .order_by(journals_comment.jc_create, journals_comment.jc_id)
        )).all()

        return {"journal": journal, "items": items, "comments": comments}

    @staticmethod
    async def update_journal(
        db: AsyncSession, j_id: int, user_id: int, data: dict
    ):
        journal = await JournalValidator.check_author(db, j_id, user_id)
        JournalValidator.check_journal_fields(data)

        if "items" in data:
            updates = await JournalItemService.prepare_item_updates(
                db, j_id, data["items"]
            )
        else:
            updates = []

        try:
            for field in ("j_title", "j_intro", "j_photo"):
                if field in data:
                    setattr(journal, field, data[field])

            for item, submitted in updates:
                JournalItemService.apply_item_fields(item, submitted)

            await db.commit()
            return await JournalService.get_journal_detail(db, j_id)

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_journal(db: AsyncSession, j_id: int, user_id: int):
        journal = await JournalValidator.check_author(db, j_id, user_id)

        items = (await db.scalars(
            select(journals_item).where(journals_item.j_id == j_id)
        )).all()

        comments = (await db.scalars(
            select(journals_comment).where(journals_comment.j_id == j_id)
        )).all()

        try:
            for comment in comments:
                await db.delete(comment)
            for item in items:
                await db.delete(item)

            await db.delete(journal)
            await db.commit()
            return {"message": "여행기가 삭제되었습니다."}

        except Exception:
            await db.rollback()
            raise


# ==================================================
# 3. 여행기 세부 일정
# ==================================================
class JournalItemService:

    @staticmethod
    def apply_item_fields(item, data: dict):
        for field in ("ji_content", "ji_photo", "ji_rating"):
            if field in data:
                setattr(item, field, data[field])

    @staticmethod
    async def prepare_item_updates(db: AsyncSession, j_id: int, submitted: list):
        if not isinstance(submitted, list):
            raise HTTPException(422, "일정 데이터가 올바르지 않습니다.")

        existing = (await db.scalars(
            select(journals_item)
            .where(journals_item.j_id == j_id)
            .order_by(journals_item.ji_day, journals_item.ji_order, journals_item.ji_id)
        )).all()

        if len(existing) != len(submitted):
            raise HTTPException(400, "모든 일정을 전달해야 합니다.")

        by_id = {item.ji_id: item for item in existing}
        by_order = {}

        for item in existing:
            key = (item.ji_day, item.ji_order)
            by_order.setdefault(key, []).append(item)

        updates = []
        seen = set()

        for data in submitted:
            if not isinstance(data, dict):
                raise HTTPException(422, "잘못된 일정 데이터입니다.")

            if data.get("ji_id") is not None:
                item = by_id.get(data["ji_id"])
            else:
                key = (data.get("ji_day"), data.get("ji_order"))
                candidates = by_order.get(key, [])
                if len(candidates) != 1:
                    raise HTTPException(400, "일정 식별을 위해 ji_id가 필요합니다.")
                item = candidates[0]

            if item is None or item.ji_id in seen:
                raise HTTPException(400, "중복되거나 존재하지 않는 일정입니다.")

            JournalValidator.check_item_fields(data)
            seen.add(item.ji_id)
            updates.append((item, data))

        return updates

    @staticmethod
    async def update_journal_item(
        db: AsyncSession, ji_id: int, user_id: int, data: dict
    ):
        item = await db.get(journals_item, ji_id)
        if item is None:
            raise HTTPException(404, "여행 일정을 찾을 수 없습니다.")

        await JournalValidator.check_author(db, item.j_id, user_id)
        JournalValidator.check_item_fields(data)

        try:
            JournalItemService.apply_item_fields(item, data)
            await db.commit()
            await db.refresh(item)
            return item

        except Exception:
            await db.rollback()
            raise


# ==================================================
# 4. 여행기 댓글
# ==================================================
class JournalCommentService:

    @staticmethod
    async def create_comment(
        db: AsyncSession, j_id: int, user_id: int, content: str
    ):
        if await db.get(journals, j_id) is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")

        if not isinstance(content, str) or not content.strip():
            raise HTTPException(422, "댓글 내용을 입력해야 합니다.")

        try:
            comment = journals_comment(
                j_id=j_id,
                u_id=user_id,
                jc_content=content
            )
            db.add(comment)
            await db.commit()
            await db.refresh(comment)
            return comment

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_comments_by_journal(db: AsyncSession, j_id: int):
        if await db.get(journals, j_id) is None:
            raise HTTPException(404, "여행기를 찾을 수 없습니다.")

        return (await db.scalars(
            select(journals_comment)
            .where(journals_comment.j_id == j_id)
            .order_by(journals_comment.jc_create, journals_comment.jc_id)
        )).all()

    @staticmethod
    async def update_comment(
        db: AsyncSession,
        jc_id: int,
        comment_update: JournalCommentUpdate,
        current_user_id: int
    ):
        comment = await db.get(journals_comment, jc_id)
        if comment is None:
            raise HTTPException(404, "댓글을 찾을 수 없습니다.")

        if comment.u_id != current_user_id:
            raise HTTPException(403, "본인의 댓글만 수정할 수 있습니다.")

        data = comment_update.model_dump(exclude_unset=True)
        if "jc_content" in data:
            content = data["jc_content"]
            if not isinstance(content, str) or not content.strip():
                raise HTTPException(422, "댓글 내용을 입력해야 합니다.")

        try:
            for field, value in data.items():
                setattr(comment, field, value)

            await db.commit()
            await db.refresh(comment)
            return comment

        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_comment(
        db: AsyncSession, jc_id: int, current_user_id: int
    ):
        comment = await db.get(journals_comment, jc_id)
        if comment is None:
            raise HTTPException(404, "댓글을 찾을 수 없습니다.")

        if comment.u_id != current_user_id:
            raise HTTPException(403, "본인의 댓글만 삭제할 수 있습니다.")

        try:
            await db.delete(comment)
            await db.commit()
            return {"message": "댓글이 삭제되었습니다."}

        except Exception:
            await db.rollback()
            raise
