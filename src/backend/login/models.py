# [로그인] users 테이블 (DB 정의서 '로그인 db' 기준)
from sqlalchemy import Column, DateTime, Integer, String, func

from backend.db import Base


class User(Base):
    __tablename__ = "users"

    u_id = Column(Integer, primary_key=True, autoincrement=True)
    u_email = Column(String(100), unique=True, nullable=False)   # 로그인 아이디
    u_name = Column(String(100), nullable=False)
    u_pw = Column(String(255), nullable=False)                    # bcrypt 해시
    u_pwtest = Column(String(255), nullable=True)                 # 테스트용: 가입 때 비밀번호 원문을 넣음 (제출 전 삭제)
    u_token = Column(String(255), nullable=True)                  # 로그인할 때 발급한 토큰 (로그아웃하면 비움)
    u_create = Column(DateTime, nullable=False, default=func.now(), server_default=func.now())   # 가입 시각: 코드가 직접 채움
