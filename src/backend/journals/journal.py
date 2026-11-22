
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
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
    p_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("plans.p_id", ondelete="SET NULL"), nullable=True
    )  # 계획이 지워져도 여행기는 남음
    u_id: Mapped[int] = mapped_column(
        ForeignKey("users.u_id", ondelete="CASCADE"), nullable=False
    )
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
    j_id: Mapped[int] = mapped_column(
        ForeignKey("journals.j_id", ondelete="CASCADE"), nullable=False
    )
    ji_day: Mapped[int] = mapped_column(nullable=False, default=1, server_default="1")
    ji_order: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    ji_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    ji_title: Mapped[str] = mapped_column(String(100), nullable=False)
    ji_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ji_photo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ji_rating: Mapped[Optional[int]] = mapped_column(TINYINT, nullable=True)

    __table_args__ = (
        CheckConstraint("ji_rating BETWEEN 1 AND 5", name="ck_ji_rating_range"),
        CheckConstraint("ji_day >= 1", name="ck_ji_day_min"),
    )


# ==================================================
# 3. 여행기 댓글 (journals_comment)
# ==================================================

class journals_comment(Base):
    __tablename__ = "journals_comment"

    jc_id: Mapped[int] = mapped_column(primary_key=True)
    j_id: Mapped[int] = mapped_column(
        ForeignKey("journals.j_id", ondelete="CASCADE"), nullable=False
    )
    u_id: Mapped[int] = mapped_column(
        ForeignKey("users.u_id", ondelete="CASCADE"), nullable=False
    )
    jc_content: Mapped[str] = mapped_column(Text, nullable=False)
    jc_create: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


# ==================================================
# 4. 여행기 좋아요 (journals_like)
# ==================================================

class journals_like(Base):
    __tablename__ = "journals_like"

    j_id: Mapped[int] = mapped_column(
        ForeignKey("journals.j_id", ondelete="CASCADE"), primary_key=True
    )
    u_id: Mapped[int] = mapped_column(
        ForeignKey("users.u_id", ondelete="CASCADE"), primary_key=True
    )
    jl_create: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


# ==================================================
# 5. 여행기 해시태그 (journals_hashtag)
# ==================================================

class journals_hashtag(Base):
    __tablename__ = "journals_hashtag"

    j_id: Mapped[int] = mapped_column(
        ForeignKey("journals.j_id", ondelete="CASCADE"), primary_key=True
    )
    h_id: Mapped[int] = mapped_column(
        ForeignKey("hashtag.h_id", ondelete="CASCADE"), primary_key=True
    )
