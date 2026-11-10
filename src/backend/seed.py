# [로그인] 테스트 계정 만들기: python seed.py
# 이메일 test@test.com / 비밀번호 test1234  (개발용. 제출 전 삭제하세요)
from database import Base, SessionLocal, engine
import models  # noqa: F401
from models import User
from security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()
if not db.query(User).filter(User.u_email == "test@test.com").first():
    db.add(User(u_email="test@test.com", u_name="테스트", u_pw=hash_password("test1234")))
    db.commit()
    print("테스트 계정을 만들었습니다: test@test.com / test1234")
else:
    print("이미 있습니다")
db.close()
