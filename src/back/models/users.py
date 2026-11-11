from back.db import Base
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, TIMESTAMP, func, ForeignKey
from typing import Optional


# orm타입힌트 -> 새로운 타입 힌트방식 -> Mapped => 각필드의 특정타입을 좀 더 명확히 정의가능
class Users(Base):
    __tablename__ = "users"

    u_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    u_email: Mapped[str] = mapped_column(String(100), nullable=False)
    u_name: Mapped[str] = mapped_column(String(100), nullable=False)
    u_pw: Mapped[str] = mapped_column(String(72), nullable=False)
    u_token: Mapped[str] = mapped_column(String(255), nullable=False)
