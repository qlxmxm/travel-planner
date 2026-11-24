from apscheduler.schedulers.asyncio import AsyncIOScheduler

from backend.db import AsyncSessionLocal
from backend.plans.trips.crud import PlanCrud
from backend.db.transaction import rollback_on_error


scheduler = AsyncIOScheduler(timezone="Asia/Seoul")


async def update_completed_plans():
    async with AsyncSessionLocal() as db:
        async with rollback_on_error(db):
            count = await PlanCrud.complete_expired_plans(db)
            await db.commit()

            if count:
                print(f"완료 처리된 여행: {count}개")



scheduler.add_job(
    update_completed_plans,
    trigger="interval",
    minutes=1,
    id="complete_expired_plans",
    replace_existing=True,
)