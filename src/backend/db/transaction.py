# [공통] DB 저장 중 오류가 나면 되돌리기(rollback) 한 뒤 오류를 그대로 다시 던집니다.
#   사용법:
#       async with rollback_on_error(db):
#           ...저장 작업...
#   (예전에는 모든 서비스에 try / except Exception: await db.rollback(); raise 를 똑같이 적었습니다.)
from contextlib import asynccontextmanager


@asynccontextmanager
async def rollback_on_error(db):
    try:
        yield
    except Exception:
        await db.rollback()
        raise
