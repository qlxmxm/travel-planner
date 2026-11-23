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
