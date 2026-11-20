
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user

from backend.journals.schema import (
    JournalResponse,
    JournalDetailResponse,
    JournalEditResponse,
    JournalPlanPreviewResponse,
    JournalFromPlanCreate,
    JournalFullUpdate,
    JournalItemUpdate,
    JournalDisplayItemResponse,
    JournalCommentRequest,
    JournalCommentUpdate,
    JournalCommentResponse,
    JournalLikeResponse,
    JournalHashtagResponse,
    JournalMessageResponse
)
from backend.journals.service import (
    JournalPlanService,
    JournalService,
    JournalItemService,
    JournalCommentService,
    JournalLikeService,
    JournalHashtagService
)


router = APIRouter(prefix="/journals", tags=["여행기"])


# ==================================================
# 1. 여행계획 → 여행기 작성
# ==================================================

@router.get(
    "/from-plan/{plan_id}/preview",
    response_model=JournalPlanPreviewResponse
)
async def get_plan_preview(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalPlanService.get_plan_preview(
        db, plan_id, user.u_id
    )


@router.post(
    "/from-plan/{plan_id}",
    response_model=JournalDetailResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_journal_from_plan(
    plan_id: int,
    body: JournalFromPlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalPlanService.create_journal_from_plan(
        db, plan_id, user.u_id, body
    )


# ==================================================
# 2. 여행기 목록
# ==================================================

@router.get("", response_model=list[JournalResponse])
async def get_journal_list(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await JournalService.get_journal_list(
        db, skip, limit
    )


@router.get("/me", response_model=list[JournalResponse])
async def get_my_journals(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalService.get_my_journals(
        db, user.u_id
    )


# ==================================================
# 3. 여행기 상세·수정·삭제
# ==================================================

@router.get(
    "/{j_id}/edit",
    response_model=JournalEditResponse
)
async def get_journal_for_edit(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalService.get_journal_for_edit(
        db, j_id, user.u_id
    )


@router.get(
    "/{j_id}",
    response_model=JournalDetailResponse
)
async def get_journal_detail(
    j_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await JournalService.get_journal_detail(
        db, j_id
    )


@router.patch(
    "/{j_id}",
    response_model=JournalDetailResponse
)
async def update_journal(
    j_id: int,
    body: JournalFullUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalService.update_journal(
        db, j_id, user.u_id, body
    )


@router.delete(
    "/{j_id}",
    response_model=JournalMessageResponse
)
async def delete_journal(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalService.delete_journal(
        db, j_id, user.u_id
    )


# ==================================================
# 4. 여행기 개별 일정 수정
# ==================================================

@router.patch(
    "/items/{ji_id}",
    response_model=JournalDisplayItemResponse
)
async def update_journal_item(
    ji_id: int,
    body: JournalItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalItemService.update_journal_item(
        db, ji_id, user.u_id, body
    )


# ==================================================
# 5. 여행기 댓글
# ==================================================

@router.get(
    "/{j_id}/comments",
    response_model=list[JournalCommentResponse]
)
async def get_comments(
    j_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await JournalCommentService.get_comments_by_journal(
        db, j_id
    )


@router.post(
    "/{j_id}/comments",
    response_model=JournalCommentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_comment(
    j_id: int,
    body: JournalCommentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalCommentService.create_comment(
        db, j_id, user.u_id, body.jc_content
    )


@router.patch(
    "/comments/{jc_id}",
    response_model=JournalCommentResponse
)
async def update_comment(
    jc_id: int,
    body: JournalCommentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalCommentService.update_comment(
        db, jc_id, user.u_id, body
    )


@router.delete(
    "/comments/{jc_id}",
    response_model=JournalMessageResponse
)
async def delete_comment(
    jc_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalCommentService.delete_comment(
        db, jc_id, user.u_id
    )


# ==================================================
# 6. 여행기 좋아요
# ==================================================

@router.post(
    "/{j_id}/likes",
    response_model=JournalLikeResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_like(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalLikeService.add_like(
        db, j_id, user.u_id
    )


@router.delete(
    "/{j_id}/likes",
    response_model=JournalMessageResponse
)
async def remove_like(
    j_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalLikeService.remove_like(
        db, j_id, user.u_id
    )


@router.get("/{j_id}/likes/count")
async def get_like_count(
    j_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await JournalLikeService.get_like_count(
        db, j_id
    )


@router.get(
    "/me/likes",
    response_model=list[JournalLikeResponse]
)
async def get_my_likes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalLikeService.get_my_likes(
        db, user.u_id
    )


# ==================================================
# 7. 여행기 해시태그
# ==================================================

@router.get(
    "/{j_id}/hashtags",
    response_model=list[JournalHashtagResponse]
)
async def get_hashtags(
    j_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await JournalHashtagService.get_hashtags_by_journal(
        db, j_id
    )


@router.post(
    "/{j_id}/hashtags/{h_id}",
    response_model=JournalHashtagResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_hashtag(
    j_id: int,
    h_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalHashtagService.add_hashtag(
        db, j_id, user.u_id, h_id
    )


@router.delete(
    "/{j_id}/hashtags/{h_id}",
    response_model=JournalMessageResponse
)
async def remove_hashtag(
    j_id: int,
    h_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await JournalHashtagService.remove_hashtag(
        db, j_id, user.u_id, h_id
    )
