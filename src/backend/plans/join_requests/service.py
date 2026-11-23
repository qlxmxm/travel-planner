# [여행계획] 참여 요청(요청하기·승인·거절) 규칙
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.plans.access import MEMBER_ROLE, PlanAccessService, PlanValidator
from backend.plans.join_requests.crud import JoinRequestCrud
from backend.plans.members.crud import PlanMemberCrud
from backend.plans.transaction import PlanTransaction


class JoinRequestService:

    @staticmethod
    async def create_request(db: AsyncSession, plan_id: int, user_id: int):
        plan = await PlanValidator.check_plan(db, plan_id)

        if not plan.p_public:
            raise HTTPException(403, "공개된 여행계획에만 참여를 요청할 수 있습니다.")

        if plan.u_id == user_id or await PlanMemberCrud.get_by_plan_and_user(
            db, plan_id, user_id
        ) is not None:
            raise HTTPException(409, "이미 참여 중인 여행입니다.")

        if await JoinRequestCrud.get_by_plan_and_user(db, plan_id, user_id) is not None:
            raise HTTPException(409, "이미 참여를 요청했어요. 방장의 승인을 기다려 주세요.")

        try:
            req = await JoinRequestCrud.create(db, plan_id, user_id)
            return await PlanTransaction.save(db, req)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def get_my_request(db: AsyncSession, plan_id: int, user_id: int):
        await PlanValidator.check_plan(db, plan_id)
        req = await JoinRequestCrud.get_by_plan_and_user(db, plan_id, user_id)
        return {"requested": req is not None, "jr_id": req.jr_id if req else None}

    @staticmethod
    async def list_requests(db: AsyncSession, plan_id: int, user_id: int):
        # 요청 목록은 방장·멤버 모두 볼 수 있다 (승인은 방장만)
        await PlanAccessService.require_member(db, plan_id, user_id)
        rows = await JoinRequestCrud.get_by_plan_with_names(db, plan_id)
        return [dict(row) for row in rows]

    @staticmethod
    async def _get_request(db: AsyncSession, plan_id: int, jr_id: int):
        req = await JoinRequestCrud.get_by_id(db, jr_id)
        if req is None or req.p_id != plan_id:
            raise HTTPException(404, "참여 요청이 없습니다.")
        return req

    @staticmethod
    async def approve(db: AsyncSession, plan_id: int, jr_id: int):
        req = await JoinRequestService._get_request(db, plan_id, jr_id)

        try:
            if await PlanMemberCrud.get_by_plan_and_user(db, plan_id, req.u_id) is None:
                await PlanMemberCrud.create(db, plan_id, req.u_id, MEMBER_ROLE)
            await JoinRequestCrud.delete(db, req)
            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def remove(db: AsyncSession, plan_id: int, jr_id: int, user_id: int):
        """방장이 거절하거나, 요청한 본인이 취소한다."""
        req = await JoinRequestService._get_request(db, plan_id, jr_id)
        plan = await PlanValidator.check_plan(db, plan_id)

        if req.u_id != user_id and plan.u_id != user_id:
            raise HTTPException(403, "방장 또는 요청한 본인만 처리할 수 있습니다.")

        try:
            await JoinRequestCrud.delete(db, req)
            await PlanTransaction.save(db)
            return True
        except Exception:
            await db.rollback()
            raise
