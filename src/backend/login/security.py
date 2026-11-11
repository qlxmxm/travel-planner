# [로그인] 비밀번호 해시 + JWT + "지금 로그인한 사람" 가져오기
# 다른 역할은 아래 get_current_user 만 가져다 쓰면 됩니다.
#   from backend.login.security import get_current_user
#   async def my_api(user = Depends(get_current_user)): ...   # user.u_id
from datetime import datetime, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.db import get_db
from backend.login.models import User

bearer = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(u_id: int) -> str:
    payload = {
        "sub": str(u_id),
        "exp": datetime.now(timezone.utc) + settings.access_token_expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


async def get_current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authorization: Bearer <token> 을 확인해서 User 를 돌려줍니다. 실패하면 401."""
    error = HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다")
    if cred is None:
        raise error
    try:
        payload = jwt.decode(cred.credentials, settings.secret_key, algorithms=[settings.jwt_algorithm])
        u_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error
    user = await db.get(User, u_id)
    if user is None:
        raise error
    return user
