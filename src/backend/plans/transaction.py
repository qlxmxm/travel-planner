# [여행계획] DB 저장(commit)·되돌리기(rollback)를 한곳에서 처리
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession


class PlanTransaction:

    @staticmethod
    async def save(db: AsyncSession, obj=None):
        try:
            await db.commit()
            if obj is not None:
                await db.refresh(obj)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                409, "연결된 데이터 또는 중복 데이터로 인해 저장할 수 없습니다."
            )
        except Exception:
            await db.rollback()
            raise

        return obj

    @staticmethod
    async def rollback(db: AsyncSession):
        await db.rollback()
