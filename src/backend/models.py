# [로그인] users 테이블 (DB 정의서 '로그인 db' 기준)
# 다른 역할의 테이블(plans, journals 등)은 각자 이 파일 또는 새 파일에 추가하세요.
from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base


class User(Base):
    __tablename__ = "users"

    u_id = Column(Integer, primary_key=True, autoincrement=True)
    u_email = Column(String(100), unique=True, nullable=False)   # 로그인 아이디
    u_name = Column(String(100), nullable=False)
    u_pw = Column(String(255), nullable=False)                    # bcrypt 해시
    u_pwtest = Column(String(255), nullable=True)                 # 테스트용: API에서 사용 안 함
    u_token = Column(String(255), nullable=True)                  # 사용 안 함 (JWT는 DB에 저장하지 않음)
    u_create = Column(DateTime, nullable=False, server_default=func.now())
