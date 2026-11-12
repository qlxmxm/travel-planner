# [로그인] DB 연결. 다른 역할도 같은 get_db 를 가져다 씁니다.
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/travel_planner?charset=utf8mb4")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    """요청마다 DB 세션을 열고, 끝나면 닫습니다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
