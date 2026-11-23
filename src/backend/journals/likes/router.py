# [여행기] 좋아요 API
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.journals.journal.schemas import JournalMessageResponse
from backend.journals.likes.service import JournalLikeService
from backend.login.models import User
from backend.login.security import get_current_user

router = APIRouter()


@router.get("/likes/me")
async def get_my_likes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalLikeService.get_my_likes(db, user.u_id)


@router.get("/{j_id}/likes/count")
async def get_like_count(
    j_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await JournalLikeService.get_count(db, j_id)


@router.post("/{j_id}/likes", response_model=JournalMessageResponse)
async def add_like(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalLikeService.add_like(db, j_id, user.u_id)


@router.delete("/{j_id}/likes", response_model=JournalMessageResponse)
async def remove_like(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalLikeService.remove_like(db, j_id, user.u_id)
