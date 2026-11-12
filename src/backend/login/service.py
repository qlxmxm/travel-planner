# [로그인] 회원 관련 DB 작업. router.py 는 요청/응답만 다루고, "회원을 찾고 만들고 확인하는 일"은 여기서 합니다.
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.login.models import User
from backend.login.schemas import RegisterIn
from backend.login.security import hash_password, verify_password


async def get_user_by_email(db: AsyncSession, u_email: str) -> User | None:
    result = await db.execute(select(User).where(User.u_email == u_email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, body: RegisterIn) -> User:
    if await get_user_by_email(db, body.u_email):
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 가입된 이메일입니다")
    user = User(u_email=body.u_email, u_name=body.u_name, u_pw=hash_password(body.u_pw))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, u_email: str, u_pw: str) -> User:
    """이메일/비밀번호가 맞으면 User 를, 틀리면 401 을 냅니다."""
    user = await get_user_by_email(db, u_email)
    # 이메일이 틀렸는지 비밀번호가 틀렸는지는 알려주지 않습니다.
    if user is None or not verify_password(u_pw, user.u_pw):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다")
    return user
