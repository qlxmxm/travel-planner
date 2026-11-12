# [로그인] API 명세서 1~4번 (회원가입 / 로그인 / 로그아웃 / 내 정보)
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.login.models import User
from backend.login.schemas import LoginIn, MessageOut, RegisterIn, TokenOut, UserOut
from backend.login.security import create_access_token, get_current_user
from backend.login.service import authenticate_user, create_user

router = APIRouter(tags=["로그인"])


@router.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    return await create_user(db, body)


@router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.u_email, body.u_pw)
    return TokenOut(access_token=create_access_token(user.u_id))


@router.post("/auth/logout", response_model=MessageOut)
async def logout(user: User = Depends(get_current_user)):
    # JWT는 서버에 저장하지 않으므로 할 일은 없습니다. 프론트가 저장한 토큰을 지우면 로그아웃입니다.
    return MessageOut(message="로그아웃 되었습니다")


@router.get("/users/me", response_model=UserOut)
async def get_my_info(user: User = Depends(get_current_user)):
    return user
