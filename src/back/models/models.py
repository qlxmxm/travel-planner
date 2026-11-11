from back.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, func, ForeignKey
from typing import Optional

#orm타입힌트 -> 새로운 타입 힌트방식 -> Mapped => 각필드의 특정타입을 좀 더 명확히 정의가능
class Budgets(Base):
    __tablename__="budgets"

    b_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    p_id: Mapped[str] =mapped_column(ForeignKey('plans.p_id'))
    b_budget: Mapped[int]
    password: Mapped[str] =mapped_column(String(300), nullable=False)
    created_at: Mapped[Optional[datetime]]= mapped_column(TIMESTAMP, server_default=func.now(), nullable=True)

