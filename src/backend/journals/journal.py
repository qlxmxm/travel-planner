
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    String,
    Text,
    TIMESTAMP,
    func,
)
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base


# ==================================================
# 1. 여행기 (journals)
# ==================================================

class journals(Base):
    __tablename__ = "journals"

    j_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"), nullable=False)
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"), nullable=False)
    j_title: Mapped[str] = mapped_column(String(100), nullable=False)
    j_intro: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    j_photo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    p_create: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    loc: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


# ==================================================
# 2. 여행기 일정 (journals_item)
# ==================================================

class journals_item(Base):
    __tablename__ = "journals_item"

    ji_id: Mapped[int] = mapped_column(primary_key=True)
    j_id: Mapped[int] = mapped_column(ForeignKey("journals.j_id"), nullable=False)
    ji_day: Mapped[int] = mapped_column(nullable=False)
    ji_order: Mapped[int] = mapped_column(nullable=False)
    ji_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    ji_title: Mapped[str] = mapped_column(String(100), nullable=False)
    ji_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ji_photo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ji_rating: Mapped[int] = mapped_column(TINYINT, nullable=False)

    __table_args__ = (CheckConstraint("ji_rating BETWEEN 1 AND 5",name="ck_ji_rating_range"),)


# ==================================================
# 3. 여행기 댓글 (journals_comment)
# ==================================================

class journals_comment(Base):
    __tablename__ = "journals_comment"

    jc_id: Mapped[int] = mapped_column(primary_key=True)
    j_id: Mapped[int] = mapped_column(ForeignKey("journals.j_id"), nullable=False)
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"), nullable=False)
    jc_content: Mapped[str] = mapped_column(Text, nullable=False)
    jc_create: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
