from backend.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, ForeignKey, func, CheckConstraint, Text
from typing import Optional
from sqlalchemy.dialects.mysql import TINYINT


class journals(Base):
    __tablename__="journals"

    j_id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    p_id: Mapped[str] =mapped_column(ForeignKey('plans.p_id'), nullable=False)
    u_id: Mapped[int] =mapped_column(ForeignKey('users.u_id'),nullable=False)
    j_title: Mapped[str] =mapped_column(String(100), nullable=False)
    j_intro: Mapped[str]= mapped_column(String(100), nullable=True)
    j_photo : Mapped[str] = mapped_column(String(255), nullable=True)
    p_create=Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    loc = Mapped[str] = mapped_column(ForeignKey("plans.loc"))

class journals_item(Base):
    __tablename__ = 'journals_item'

    ji_id : Mapped[int] = mapped_column(primary_key=True)
    j_id : Mapped[int] = mapped_column(ForeignKey("journals.j_id"))
    ji_day : Mapped[int] = mapped_column(nullable=False)
    ji_order : Mapped[int] = mapped_column(nullable=False)
    ji_time : Mapped[datetime] = mapped_column(nullable=True)
    ji_title : Mapped[str] = mapped_column(String(100), nullable=False)
    ji_content : Mapped[str] = mapped_column(Text, nullable=True)
    ji_photo : Mapped[str] = mapped_column(String(255), nullable=True)
    ji_rating: Mapped[int] = mapped_column(TINYINT,nullable=False)

    __table_args__ = (CheckConstraint("ji_rating BETWEEN 1 AND 5", name="ck_ji_rating_range"),)

class journals_comment(Base):
    __tablename__ = 'journals_comment'

    jc_id : Mapped[int] = mapped_column(primary_key=True)
    j_id : Mapped[int] = mapped_column(ForeignKey('journals_item.j_id'))
    u_id : Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    jc_content : Mapped[str] = mapped_column(Text, nullable=False)
    jc_create : Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

