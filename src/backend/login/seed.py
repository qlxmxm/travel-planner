# [로그인] 테스트 계정 만들기. src 폴더에서 실행:  python -m backend.login.seed
# 이메일 test@test.com / 비밀번호 test1234  (개발용. 제출 전 삭제하세요)
# users 테이블은 DB 정의서대로 미리 만들어져 있어야 합니다.
import asyncio

from sqlalchemy import select

from backend.db import AsyncSessionLocal
from backend.login.models import User
from backend.login.security import hash_password


async def main():
    async with AsyncSessionLocal() as db:
        found = await db.execute(select(User).where(User.u_email == "test@test.com"))
        if found.scalar_one_or_none():
            print("이미 있습니다")
            return
        db.add(User(u_email="test@test.com", u_name="테스트", u_pw=hash_password("test1234")))
        await db.commit()
        print("테스트 계정을 만들었습니다: test@test.com / test1234")


if __name__ == "__main__":
    asyncio.run(main())
