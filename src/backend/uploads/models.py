# [공통] 올린 사진 파일을 DB에 저장하는 테이블 (photo_files). 어느 컴퓨터에서 올려도 같은 DB를 보면 사진이 보입니다.
from datetime import datetime

from sqlalchemy import LargeBinary, String, TIMESTAMP, func
from sqlalchemy.dialects.mysql import LONGBLOB
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base


class PhotoFile(Base):
    __tablename__ = "photo_files"

    pf_id: Mapped[int] = mapped_column(primary_key=True)
    pf_name: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)   # 예: ab12cd34ef56ab78cd90.jpg
    pf_type: Mapped[str] = mapped_column(String(30), nullable=False)                # 예: image/jpeg
    pf_data: Mapped[bytes] = mapped_column(LargeBinary().with_variant(LONGBLOB, "mysql"), nullable=False)
    pf_create: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
