# [로그인] API 명세서 1~4번 (회원가입 / 로그인 / 로그아웃 / 내 정보)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import LoginIn, MessageOut, RegisterIn, TokenOut, UserOut
from security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(tags=["로그인"])


@router.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.u_email == body.u_email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 가입된 이메일입니다")
    user = User(u_email=body.u_email, u_name=body.u_name, u_pw=hash_password(body.u_pw))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.u_email == body.u_email).first()
    # 이메일이 틀렸는지 비밀번호가 틀렸는지는 알려주지 않습니다.
    if user is None or not verify_password(body.u_pw, user.u_pw):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다")
    return TokenOut(access_token=create_access_token(user.u_id))


@router.post("/auth/logout", response_model=MessageOut)
def logout(user: User = Depends(get_current_user)):
    # JWT는 서버에 저장하지 않으므로 할 일은 없습니다. 프론트가 저장한 토큰을 지우면 로그아웃입니다.
    return MessageOut(message="로그아웃 되었습니다")


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
