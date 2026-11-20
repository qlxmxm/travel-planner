from backend.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, DateTime, ForeignKey, func, CheckConstraint, Text
from typing import Optional
from sqlalchemy.dialects.mysql import TINYINT


class journals(Base):
    __tablename__="journals"

    j_id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    p_id: Mapped[Optional[int]] = mapped_column(ForeignKey('plans.p_id', ondelete='SET NULL'), nullable=True)
    u_id: Mapped[int] = mapped_column(ForeignKey('users.u_id', ondelete='CASCADE'), nullable=False)
    j_title: Mapped[str] =mapped_column(String(100), nullable=False)
    j_intro: Mapped[str]= mapped_column(String(100), nullable=True)
    j_photo : Mapped[str] = mapped_column(String(255), nullable=True)
    p_create :Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    loc : Mapped[str] = mapped_column(String(100), nullable=True)

class journals_item(Base):
    __tablename__ = 'journals_item'

    ji_id : Mapped[int] = mapped_column(primary_key=True)
    j_id : Mapped[int] = mapped_column(ForeignKey("journals.j_id", ondelete="CASCADE"))
    ji_day : Mapped[int] = mapped_column(nullable=False, default=1, server_default="1")
    ji_order : Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    ji_time : Mapped[Optional[datetime]] = mapped_column(nullable=True)
    ji_title : Mapped[str] = mapped_column(String(100), nullable=False)
    ji_content : Mapped[str] = mapped_column(Text, nullable=True)
    ji_photo : Mapped[str] = mapped_column(String(255), nullable=True)
    ji_rating: Mapped[Optional[int]] = mapped_column(TINYINT, nullable=True)

    __table_args__ = (
        CheckConstraint("ji_rating BETWEEN 1 AND 5", name="ck_ji_rating_range"),
        CheckConstraint("ji_day >= 1", name="ck_ji_day_min"),
    )

class journals_comment(Base):
    __tablename__ = 'journals_comment'

    jc_id : Mapped[int] = mapped_column(primary_key=True)
    j_id : Mapped[int] = mapped_column(ForeignKey('journals.j_id', ondelete='CASCADE'))
    u_id : Mapped[int] = mapped_column(ForeignKey("users.u_id", ondelete="CASCADE"))
    jc_content : Mapped[str] = mapped_column(Text, nullable=False)
    jc_create : Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)



class journals_like(Base):
    __tablename__ = 'journals_like'

    j_id : Mapped[int] = mapped_column(ForeignKey('journals.j_id', ondelete='CASCADE'), primary_key=True)
    u_id : Mapped[int] = mapped_column(ForeignKey('users.u_id', ondelete='CASCADE'), primary_key=True)
    jl_create : Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class journals_hashtag(Base):
    __tablename__ = 'journals_hashtag'

    j_id : Mapped[int] = mapped_column(ForeignKey('journals.j_id', ondelete='CASCADE'), primary_key=True)
    h_id : Mapped[int] = mapped_column(ForeignKey('hashtag.h_id', ondelete='CASCADE'), primary_key=True)
