# [여행기] 해시태그 조회 API
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.journals.hashtags.service import JournalHashtagService

router = APIRouter()


@router.get("/{j_id}/hashtags")
async def get_hashtags(
    j_id: int,
    db: AsyncSession = Depends(get_db),
):
    hashtags = await JournalHashtagService.get_hashtags_by_journal(
        db, j_id
    )

    return [
        {"h_id": tag.h_id, "h_name": tag.h_name}
        for tag in hashtags
    ]
