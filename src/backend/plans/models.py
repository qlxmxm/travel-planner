# [여행계획] DB 테이블 정의: plans(여행), plan_members(멤버), invite(초대 코드), plan_details(일정), budgets·expenses(예산·지출), hashtag·plan_hashtag, plan_join_requests(참여 요청)

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base
from sqlalchemy import CheckConstraint, UniqueConstraint, text


class Plans(Base):
    __tablename__ = "plans"

    p_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    p_title: Mapped[str] = mapped_column(String(100), nullable=False)
    loc: Mapped[str] = mapped_column(String(100), nullable=False)
    p_start: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    p_end: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    p_status: Mapped[bool] = mapped_column(
    nullable=False,
    default=False,
    server_default=text("0"))
    # 공개 여부: False 비공개(멤버만) / True 공개(다른 사람도 일정을 볼 수 있음)
    p_public: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="0")
    # 여행 대표 사진: 프론트 사진 목록(data/photos.js)의 이름. 비어 있으면 여행지 이름으로 자동 선택
    p_photo: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class Invite(Base):
    __tablename__ = "invite"

    i_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    i_code: Mapped[str] = mapped_column(String(50), nullable=False)
    i_create: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    i_expire: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    i_used: Mapped[bool] = mapped_column(nullable=False)

    __table_args__ = (
        UniqueConstraint("i_code", name="uq_invite_code"),
    )


class PlanMembers(Base):
    __tablename__ = "plan_members"

    pm_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    role: Mapped[str] = mapped_column(String(100), nullable=False)

    __table_args__ = (
        UniqueConstraint("p_id", "u_id", name="uq_pm_plan_user"),
    )


class JoinRequest(Base):
    """공개 여행에 '같이 가고 싶어요' 하고 보낸 참여 요청. 방장이 승인/거절하면 행이 지워진다."""
    __tablename__ = "plan_join_requests"

    jr_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    u_id: Mapped[int] = mapped_column(ForeignKey("users.u_id"))
    jr_create: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("p_id", "u_id", name="uq_jr_plan_user"),
    )


class hashtag(Base):
    __tablename__ = "hashtag"

    h_id: Mapped[int] = mapped_column(primary_key=True)
    h_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)


class plan_hashtag(Base):
    __tablename__ = "plan_hashtag"

    ph_id: Mapped[int] = mapped_column(primary_key=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    h_id: Mapped[int] = mapped_column(nullable=False)

    __table_args__ = (
    UniqueConstraint("p_id", "h_id", name="uq_plan_hashtag"),
)


class plan_details(Base):
    __tablename__ = "plan_details"

    pd_id: Mapped[int] = mapped_column(primary_key=True)
    p_id: Mapped[int] = mapped_column(ForeignKey("plans.p_id"))
    l_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("location.l_id"), nullable=True
    )
    visit_time: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    orders: Mapped[int] = mapped_column(nullable=False)
    memo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


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

    __table_args__ = (
    CheckConstraint("b_budget >= 0", name="ck_budget_nonnegative"),
    CheckConstraint(
        "b_add IS NULL OR b_add >= 0",
        name="ck_budget_add_nonnegative"
    ),
)


class expenses(Base):
    __tablename__ = "expenses"

    e_id: Mapped[int] = mapped_column(primary_key=True)
    b_id: Mapped[int] = mapped_column(ForeignKey("budgets.b_id"))
    e_content: Mapped[str] = mapped_column(String(255), nullable=False)
    e_amount: Mapped[int] = mapped_column(nullable=False)
    e_time: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )

    __table_args__ = (
    CheckConstraint("e_amount >= 0", name="ck_expense_nonnegative"),
)
