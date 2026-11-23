# [여행기] 여행기 본체(목록·상세·수정·삭제·일정 수정) API
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.journals.journal.schemas import (
    JournalDetailResponse,
    JournalDisplayItemResponse,
    JournalEditResponse,
    JournalFullUpdate,
    JournalItemUpdate,
    JournalMessageResponse,
    JournalResponse,
)
from backend.journals.journal.service import JournalItemService, JournalService
from backend.login.models import User
from backend.login.security import get_current_user

router = APIRouter()


@router.get("", response_model=list[JournalResponse])
async def get_journal_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await JournalService.get_journal_list(
        db, skip, limit
    )


@router.get("/me", response_model=list[JournalResponse])
async def get_my_journals(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalService.get_my_journals(
        db, user.u_id
    )


@router.get(
    "/{j_id}/edit",
    response_model=JournalEditResponse,
)
async def get_journal_for_edit(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalService.get_journal_for_edit(
        db, j_id, user.u_id
    )


@router.get(
    "/{j_id}",
    response_model=JournalDetailResponse,
)
async def get_journal_detail(
    j_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await JournalService.get_journal_detail(
        db, j_id
    )


@router.patch(
    "/{j_id}",
    response_model=JournalDetailResponse,
)
async def update_journal(
    j_id: int,
    body: JournalFullUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalService.update_journal(
        db, j_id, user.u_id, body
    )


@router.delete(
    "/{j_id}",
    response_model=JournalMessageResponse,
)
async def delete_journal(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalService.delete_journal(
        db, j_id, user.u_id
    )


@router.patch(
    "/items/{ji_id}",
    response_model=JournalDisplayItemResponse,
)
async def update_journal_item(
    ji_id: int,
    body: JournalItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalItemService.update_journal_item(
        db, ji_id, user.u_id, body
    )
