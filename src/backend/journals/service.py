
import json
from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.journals.crud import (
    JournalPlanCrud,
    JournalCrud,
    JournalItemCrud,
    JournalCommentCrud,
    JournalHashtagCrud,
    JournalLikeCrud,
    JournalUserCrud,
    JournalListMetaCrud,
)
from backend.journals.schema import (
    JournalResponse,
    JournalCreate,
    JournalUpdate,
    JournalItemCreate,
    JournalItemUpdate,
    JournalFromPlanCreate,
    JournalFullUpdate,
    JournalCommentCreate,
    JournalCommentUpdate,
)


# ==================================================
# 1. 공통 검증
# ==================================================

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

        if not plan.p_status:
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
    async def check_journal_author(db: AsyncSession, j_id: int, user_id: int):
        journal = await JournalValidator.check_journal_exists(db, j_id)

        if journal.u_id != user_id:
            raise HTTPException(403, "본인의 여행기만 수정하거나 삭제할 수 있습니다.")

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


# ==================================================
# 2. 프론트엔드 응답 데이터 변환
# ==================================================

class JournalResponseService:

    @staticmethod
    def format_time(value):
        """React input[type=time]용 HH:mm 문자열"""
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
    def get_day_number(visit_time, start_time):
        if visit_time is None or start_time is None:
            raise HTTPException(400, "여행 일정의 날짜 정보가 없습니다.")

        visit_date = visit_time.date() if isinstance(visit_time, datetime) else visit_time
        start_date = start_time.date() if isinstance(start_time, datetime) else start_time
        day_number = (visit_date - start_date).days + 1

        if day_number < 1:
            raise HTTPException(400, "여행 시작일보다 앞선 일정이 있습니다.")

        return day_number

    @staticmethod
    def place_from_memo(memo):
        """
        여행계획 일정의 memo 에는 {"place": 장소, "label": 구분, "title": 제목} JSON 이 들어 있습니다.
        여행기에는 장소 이름(place)만 쓰고, JSON 이 아닌 글이면 그대로 씁니다.
        """
        text = (memo or "").strip()
        if text.startswith("{"):
            try:
                data = json.loads(text)
            except ValueError:
                return text
            if isinstance(data, dict):
                for key in ("place", "label", "title"):
                    value = str(data.get(key) or "").strip()
                    if value:
                        return value
                return ""
        return text

    @staticmethod
    def photo_from_memo(memo):
        """일정 memo JSON 의 photo (임시그림 이름 또는 /uploads/... 주소). 없으면 빈 문자열."""
        text = (memo or "").strip()
        if text.startswith("{"):
            try:
                data = json.loads(text)
            except ValueError:
                return ""
            if isinstance(data, dict):
                return str(data.get("photo") or "").strip()[:255]
        return ""

    @staticmethod
    def get_place_title(detail, place_name):
        """장소명 → 메모의 장소 이름 → 기본 제목 순서로 사용"""
        if place_name and place_name.strip():
            return place_name.strip()

        title = JournalResponseService.place_from_memo(detail.memo)
        if title:
            return title[:100]

        return "장소 미지정"

    @staticmethod
    def format_journal(journal, author_name=None):
        return {
            "j_id": journal.j_id,
            "p_id": journal.p_id,
            "u_id": journal.u_id,
            "j_title": journal.j_title,
            "j_intro": journal.j_intro or "",
            "j_photo": journal.j_photo or "",
            "p_create": journal.p_create,
            "loc": journal.loc,
            "u_name": author_name,
        }

    @staticmethod
    def format_item(item):
        return {
            "ji_id": item.ji_id,
            "j_id": item.j_id,
            "ji_day": item.ji_day,
            "ji_order": item.ji_order,
            "ji_time": JournalResponseService.format_time(item.ji_time),
            # 예전에 JSON 그대로 저장된 제목도 장소 이름으로 보여줌
            "ji_title": JournalResponseService.place_from_memo(item.ji_title) or item.ji_title,
            "ji_content": item.ji_content or "",
            "ji_photo": item.ji_photo or "",
            "ji_rating": item.ji_rating,
        }

    @staticmethod
    def format_comments(comments, names=None):
        names = names or {}
        return [
            {
                "jc_id": comment.jc_id,
                "j_id": comment.j_id,
                "u_id": comment.u_id,
                "jc_content": comment.jc_content,
                "jc_create": comment.jc_create,
                "u_name": names.get(comment.u_id),
            }
            for comment in comments
        ]

    @staticmethod
    def group_days(items, start_date=None):
        """저장된 일정을 날짜별로 묶어 반환"""
        days = {}

        for item in items:
            day_number = item.ji_day

            if day_number not in days:
                if item.ji_time is not None:
                    day_date = JournalResponseService.format_date(item.ji_time)
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
                    "items": [],
                }

            days[day_number]["items"].append(
                JournalResponseService.format_item(item)
            )

        return [days[key] for key in sorted(days)]


# ==================================================
# 3. 여행계획 → 여행기 작성 및 복사
# ==================================================

class JournalPlanService:

    @staticmethod
    async def get_plan_preview(db: AsyncSession, plan_id: int, user_id: int):
        plan = await JournalValidator.check_completed_plan(db, plan_id, user_id)
        details = await JournalPlanCrud.get_plan_details(db, plan_id)
        days = {}

        for detail, place_name in details:
            day_number = JournalResponseService.get_day_number(
                detail.visit_time, plan.p_start
            )
            date_key = JournalResponseService.format_date(detail.visit_time)

            if day_number not in days:
                days[day_number] = {
                    "ji_day": day_number,
                    "date": date_key,
                    "items": [],
                }

            days[day_number]["items"].append({
                "pd_id": detail.pd_id,
                "ji_day": day_number,
                "ji_order": detail.orders,
                "ji_time": JournalResponseService.format_time(detail.visit_time),
                "ji_title": JournalResponseService.get_place_title(
                    detail, place_name
                ),
                "ji_content": "",
                "ji_photo": JournalResponseService.photo_from_memo(detail.memo),   # 여행계획 일정의 사진을 가져옴
                "ji_rating": None,
            })

        return {
            "journal": {
                "p_id": plan.p_id,
                "j_title": plan.p_title,
                "j_intro": "",
                "j_photo": plan.p_photo or "",   # 여행 대표사진을 여행기 대표사진 기본값으로
                "loc": plan.loc,
            },
            "days": [days[key] for key in sorted(days)],
        }

    @staticmethod
    async def create_journal_from_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        data: JournalFromPlanCreate,
    ):
        plan = await JournalValidator.check_completed_plan(db, plan_id, user_id)
        details = await JournalPlanCrud.get_plan_details(db, plan_id)

        original_items = {
            detail.pd_id: (detail, place_name)
            for detail, place_name in details
        }
        submitted_items = {item.pd_id: item for item in data.items}

        if len(submitted_items) != len(data.items):
            raise HTTPException(400, "중복된 여행 일정이 있습니다.")

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
            loc=plan.loc,
        )

        try:
            journal = await JournalCrud.create(db, journal_data)
            journal_items = []

            for pd_id, (detail, place_name) in original_items.items():
                submitted = submitted_items[pd_id]

                journal_items.append(
                    JournalItemCreate(
                        j_id=journal.j_id,
                        ji_day=JournalResponseService.get_day_number(
                            detail.visit_time, plan.p_start
                        ),
                        ji_order=detail.orders,
                        ji_time=detail.visit_time,
                        ji_title=JournalResponseService.get_place_title(
                            detail, place_name
                        ),
                        ji_content=submitted.ji_content,
                        ji_photo=submitted.ji_photo,
                        ji_rating=submitted.ji_rating,
                    )
                )

            
            await JournalItemCrud.create_many(db, journal_items)

            journal_id = journal.j_id
            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return await JournalService.get_journal_detail(db, journal_id)



# ==================================================
# 4. 여행기 조회, 수정, 삭제
# ==================================================

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
            existing_items = await JournalItemCrud.get_by_journal(db, j_id)
            existing_ids = {item.ji_id for item in existing_items}
            submitted_ids = [item.ji_id for item in data.items]

            if len(submitted_ids) != len(set(submitted_ids)):
                raise HTTPException(400, "중복된 여행 일정이 있습니다.")

            if set(submitted_ids) != existing_ids:
                raise HTTPException(
                    400, "여행기의 모든 일정을 정확히 전달해야 합니다."
                )

            for item in data.items:
                JournalValidator.check_item_update(item)

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


# ==================================================
# 5. 여행기 개별 일정 수정
# ==================================================

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


# ==================================================
# 6. 여행기 댓글
# ==================================================

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


# ==================================================
# 7. 여행기 해시태그 조회
# ==================================================

class JournalHashtagService:

    @staticmethod
    async def get_hashtags_by_journal(db: AsyncSession, j_id: int):
        await JournalValidator.check_journal_exists(db, j_id)
        return await JournalHashtagCrud.get_by_journal(db, j_id)



# ==================================================
# 7. 좋아요
# ==================================================

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
