from back.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, ForeignKey
from typing import Optional


class Plans(Base):
    __tablename__ = "plans"

    p_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    p_title: Mapped[str] = mapped_column(String(100), nullable=False)
    loc: Mapped[str] = mapped_column(String(100), nullable=False)
    p_start: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=False)
    p_end: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=False)
    p_status: Mapped[bool] = mapped_column(nullable=False)


class Invite(Base):
    __tablename__ = "invite"

    i_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    i_code: Mapped[str] = mapped_column(String(50), nullable=False)
    i_create: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=False)
    i_expire: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=False)
    i_used: Mapped[bool] = mapped_column(nullable=False)


class PlanMembers(Base):
    __tablename__ = "plan_members"

    pm_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    role: Mapped[str] = mapped_column(String(100), nullable=False)
