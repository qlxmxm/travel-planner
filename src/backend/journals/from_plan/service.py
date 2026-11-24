# [여행기] 여행계획으로 여행기 쓰기 규칙(서비스)
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.journals.from_plan.crud import JournalPlanCrud
from backend.journals.from_plan.schemas import JournalFromPlanCreate
from backend.journals.journal.crud import JournalCrud, JournalItemCrud
from backend.journals.journal.schemas import JournalCreate, JournalItemCreate
from backend.journals.journal.service import JournalService
from backend.journals.responses import JournalResponseService
from backend.journals.validation import JournalValidator


class JournalPlanService:

    @staticmethod
    def _preview_item(detail, place_name, day_number: int) -> dict:
        """미리보기에 보여줄 일정 1개"""
        return {
            "pd_id": detail.pd_id,
            "ji_day": day_number,
            "ji_order": detail.orders,
            "ji_time": JournalResponseService.format_time(detail.visit_time),
            "ji_title": JournalResponseService.get_place_title(detail, place_name),
            "ji_content": "",
            "ji_photo": JournalResponseService.photo_from_memo(detail.memo),   # 여행계획 일정의 사진을 가져옴
            "ji_rating": None,
        }

    @staticmethod
    def _group_by_day(details, plan_start) -> list[dict]:
        """여행계획 일정들을 Day 별로 묶어서 Day 순서대로 돌려줌"""
        days = {}
        for detail, place_name in details:
            day_number = JournalResponseService.get_day_number(detail.visit_time, plan_start)
            if day_number not in days:
                days[day_number] = {
                    "ji_day": day_number,
                    "date": JournalResponseService.format_date(detail.visit_time),
                    "items": [],
                }
            days[day_number]["items"].append(
                JournalPlanService._preview_item(detail, place_name, day_number)
            )
        return [days[key] for key in sorted(days)]

    @staticmethod
    async def get_plan_preview(db: AsyncSession, plan_id: int, user_id: int):
        plan = await JournalValidator.check_completed_plan(db, plan_id, user_id)
        details = await JournalPlanCrud.get_plan_details(db, plan_id)

        return {
            "journal": {
                "p_id": plan.p_id,
                "j_title": plan.p_title,
                "j_intro": "",
                "j_photo": plan.p_photo or "",   # 여행 대표사진을 여행기 대표사진 기본값으로
                "loc": plan.loc,
            },
            "days": JournalPlanService._group_by_day(details, plan.p_start),
        }

    @staticmethod
    def _match_submitted_items(details, data: JournalFromPlanCreate):
        """제출한 일정이 원본 여행계획의 일정과 정확히 일치하는지 확인.
        (원본 일정 {pd_id: (일정, 장소이름)}, 제출 일정 {pd_id: 항목}) 을 돌려줌"""
        # 원본 여행계획에 일정이 없는 경우
        if not details:
            raise HTTPException(
                422, "여행 일정이 없는 여행계획은 여행기를 작성할 수 없습니다."
            )

        # 여행기 일정이 전달되지 않은 경우
        if not data.items:
            raise HTTPException(
                422, "여행기 일정을 하나 이상 입력해야 합니다."
            )

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

        return original_items, submitted_items

    @staticmethod
    def _build_journal_items(journal_id: int, plan, original_items, submitted_items) -> list[JournalItemCreate]:
        """원본 일정 + 사용자가 쓴 내용으로 여행기 일정 목록을 만듦"""
        journal_items = []
        for pd_id, (detail, place_name) in original_items.items():
            submitted = submitted_items[pd_id]
            journal_items.append(
                JournalItemCreate(
                    j_id=journal_id,
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
        return journal_items

    @staticmethod
    async def create_journal_from_plan(
        db: AsyncSession,
        plan_id: int,
        user_id: int,
        data: JournalFromPlanCreate,
    ):
        plan = await JournalValidator.check_completed_plan(db, plan_id, user_id)
        details = await JournalPlanCrud.get_plan_details(db, plan_id)
        original_items, submitted_items = JournalPlanService._match_submitted_items(details, data)

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
            journal_items = JournalPlanService._build_journal_items(
                journal.j_id, plan, original_items, submitted_items
            )
            await JournalItemCrud.create_many(db, journal_items)

            journal_id = journal.j_id
            await db.commit()

        except Exception:
            await db.rollback()
            raise

        return await JournalService.get_journal_detail(db, journal_id)
