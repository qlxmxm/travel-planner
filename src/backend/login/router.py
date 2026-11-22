# [로그인] API 명세서 1~4번 (회원가입 / 로그인 / 로그아웃 / 내 정보)
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.login.models import User
from backend.login.schemas import LoginIn, MessageOut, RegisterIn, TokenOut, UserOut
from backend.login.security import create_access_token, get_current_user
from backend.login.service import authenticate_user, clear_token, create_user, save_token

router = APIRouter(tags=["로그인"])


@router.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    return await create_user(db, body)


@router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.u_email, body.u_pw)
    token = create_access_token(user.u_id)
    await save_token(db, user, token)
    return TokenOut(access_token=token)


@router.post("/auth/logout", response_model=MessageOut)
async def logout(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # DB의 u_token 을 비웁니다. (프론트도 저장한 토큰을 지웁니다)
    await clear_token(db, user)
    return MessageOut(message="로그아웃 되었습니다")


@router.get("/users/me", response_model=UserOut)
async def get_my_info(user: User = Depends(get_current_user)):
    return user
