# [장소] location, location_reviews 테이블 (DB 정의서 '장소db' 기준)
from sqlalchemy import (
    CheckConstraint, Column, DateTime, ForeignKey,
    Integer, Numeric, SmallInteger, String, Text, func,
)

from backend.db import Base


class Location(Base):
    __tablename__ = "location"
    __table_args__ = (
        CheckConstraint("l_category IN ('맛집', '관광명소', '숙소')"),
    )

    l_id = Column(Integer, primary_key=True, autoincrement=True)
    l_category = Column(String(20), nullable=False)    # 맛집 / 관광명소 / 숙소
    l_name = Column(String(100), nullable=False)
    l_add = Column(String(200), nullable=False)        # 주소
    l_telno = Column(String(20), nullable=True)
    l_start = Column(String(100), nullable=True)       # 맛집=오픈시간, 숙소=체크인
    l_end = Column(String(100), nullable=True)         # 맛집=마감시간, 숙소=체크아웃
    l_intro = Column(Text, nullable=True)
    l_city = Column(String(50), nullable=False)
    l_image = Column(String(255), nullable=True)
    l_lat = Column(Numeric(10, 7), nullable=True)      # 위도
    l_lng = Column(Numeric(10, 7), nullable=True)      # 경도


class LocationReview(Base):
    __tablename__ = "location_reviews"
    __table_args__ = (
        CheckConstraint("lr_rating BETWEEN 1 AND 5"),
    )

    lr_id = Column(Integer, primary_key=True, autoincrement=True)
    l_id = Column(Integer, ForeignKey("location.l_id", ondelete="CASCADE"), nullable=False)
    u_id = Column(Integer, ForeignKey("users.u_id", ondelete="CASCADE"), nullable=False)
    lr_rating = Column(SmallInteger, nullable=False)   # 별점 1~5
    lr_content = Column(Text, nullable=True)
    lr_create = Column(DateTime, nullable=False, server_default=func.now())
    lr_update = Column(DateTime, nullable=True, onupdate=func.now())