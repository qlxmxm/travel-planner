# [여행기] 댓글 API
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.journals.comments.schemas import (
    JournalCommentRequest,
    JournalCommentResponse,
    JournalCommentUpdate,
)
from backend.journals.comments.service import JournalCommentService
from backend.journals.journal.schemas import JournalMessageResponse
from backend.login.models import User
from backend.login.security import get_current_user

router = APIRouter()


@router.get(
    "/{j_id}/comments",
    response_model=list[JournalCommentResponse],
)
async def get_comments(
    j_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await JournalCommentService.get_comments_by_journal(
        db, j_id
    )


@router.post(
    "/{j_id}/comments",
    response_model=JournalCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    j_id: int,
    body: JournalCommentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalCommentService.create_comment(
        db, j_id, user.u_id, body.jc_content
    )


@router.patch(
    "/comments/{jc_id}",
    response_model=JournalCommentResponse,
)
async def update_comment(
    jc_id: int,
    body: JournalCommentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalCommentService.update_comment(
        db, jc_id, user.u_id, body
    )


@router.delete(
    "/comments/{jc_id}",
    response_model=JournalMessageResponse,
)
async def delete_comment(
    jc_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JournalCommentService.delete_comment(
        db, jc_id, user.u_id
    )
