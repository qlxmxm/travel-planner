
from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base


class Plans(Base):
    __tablename__ = "plans"

    p_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    p_title: Mapped[str] = mapped_column(String(100), nullable=False)
    loc: Mapped[str] = mapped_column(String(100), nullable=False)
    p_start: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    p_end: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    p_status: Mapped[bool] = mapped_column(nullable=False)


class Invite(Base):
    __tablename__ = "invite"

    i_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    i_code: Mapped[str] = mapped_column(String(50), nullable=False)
    i_create: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    i_expire: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    i_used: Mapped[bool] = mapped_column(nullable=False)


class PlanMembers(Base):
    __tablename__ = "plan_members"

    pm_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    role: Mapped[str] = mapped_column(String(100), nullable=False)


class hashtag(Base):
    __tablename__ = "hashtag"

    h_id: Mapped[int] = mapped_column(primary_key=True)
    h_name: Mapped[str] = mapped_column(String(100), nullable=False)


class plan_hashtag(Base):
    __tablename__ = "plan_hashtag"

    ph_id: Mapped[int] = mapped_column(primary_key=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    h_id: Mapped[int] = mapped_column(nullable=False)


class plan_details(Base):
    __tablename__ = "plan_details"

    pd_id: Mapped[int] = mapped_column(primary_key=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    l_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("location.l_id"), nullable=True
    )
    visit_time: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    orders: Mapped[int] = mapped_column(nullable=False)
    memo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class Budgets(Base):
    __tablename__ = "budgets"

    b_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(
        ForeignKey("plans.p_id"), nullable=False
    )
    b_budget: Mapped[int] = mapped_column(nullable=False)
    b_date: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )
    b_add: Mapped[Optional[int]] = mapped_column(nullable=True)


class expenses(Base):
    __tablename__ = "expenses"

    e_id: Mapped[int] = mapped_column(primary_key=True)
    b_id: Mapped[int] = mapped_column(ForeignKey("budgets.b_id"))
    e_content: Mapped[str] = mapped_column(String(255), nullable=False)
    e_amount: Mapped[int] = mapped_column(nullable=False)
    e_time: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )
