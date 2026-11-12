from backend.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, func, ForeignKey
from typing import Optional

#orm타입힌트 -> 새로운 타입 힌트방식 -> Mapped => 각필드의 특정타입을 좀 더 명확히 정의가능
class Budgets(Base):
    __tablename__="budgets"

    b_id: Mapped[int] = mapped_column(primary_key=True, index=True) 
    p_id: Mapped[str] =mapped_column(ForeignKey('plans.p_id'), nullable=False)
    b_budget: Mapped[int] =mapped_column(nullable=False)
    b_date: Mapped[datetime] =mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    b_add: Mapped[int]= mapped_column(nullable=True)

class expenses(Base):
    __tablename__='expenses'

    e_id : Mapped[int]=mapped_column(primary_key=True)
    b_id : Mapped[int]=mapped_column(ForeignKey('budgets.b_id'))
    e_content : Mapped[str]=mapped_column(String(255), nullable=False)
    e_amount : Mapped[int] = mapped_column(nullable=False)
    e_time : Mapped[datetime] =mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
