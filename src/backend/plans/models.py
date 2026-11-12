from backend.db import Base
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

class hashtag(Base):
    __tablename__ = 'hashtag'

    h_id : Mapped[int]=mapped_column(primary_key=True)
    h_name : Mapped[str]=mapped_column(String(100), nullable=False)


class plan_hashtag(Base):
    __tablename__ = 'plan_hashtag'

    ph_id : Mapped[int] = mapped_column(primary_key=True)
    p_id : Mapped[int] = mapped_column(ForeignKey('plan.p_id'))
    h_id : Mapped[int] = mapped_column(nullable=False)

class plan_details(Base):
    __tablename__ = 'plan_details'

    pd_id : Mapped[int] = mapped_column(primary_key=True)
    p_id : Mapped[int] = mapped_column(ForeignKey('plan.p_id'))
    l_id : Mapped[int] = mapped_column(ForeignKey=('location.l_id'))
    visit_time : Mapped[datetime] = mapped_column(datetime, nullable=False)
    orders : Mapped[int] = mapped_column(nullable=False)
    memo : Mapped[str] = mapped_column(String(100), nullable=True)
