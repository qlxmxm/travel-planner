# [여행기] 여행계획으로 여행기 쓰기 API
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.journals.from_plan.schemas import (
    JournalFromPlanCreate,
    JournalPlanPreviewResponse,
)
from backend.journals.from_plan.service import JournalPlanService
from backend.journals.journal.schemas import JournalDetailResponse
from backend.login.models import User
from backend.login.security import get_current_user

router = APIRouter()


@router.get(
    "/from-plan/{plan_id}/preview",
    response_model=JournalPlanPreviewResponse,
)
async def get_plan_preview(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalPlanService.get_plan_preview(
        db, plan_id, user.u_id
    )


@router.post(
    "/from-plan/{plan_id}",
    response_model=JournalDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_journal_from_plan(
    plan_id: int,
    body: JournalFromPlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalPlanService.create_journal_from_plan(
        db, plan_id, user.u_id, body
    )
