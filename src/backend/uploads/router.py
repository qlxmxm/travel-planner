# [공통] 사진 업로드/보기. 사진 파일은 DB(photo_files 테이블)에 저장됩니다.
#   POST /api/uploads        로그인 필요. 본문에 사진 파일(바이너리) + Content-Type: image/*  →  {"url": "/uploads/이름.jpg"}
#   GET  /uploads/{이름}      사진 보기 (누구나). 화면의 <img src="/uploads/...">가 이 주소를 부릅니다.
# 다른 컴퓨터에서 올린 사진도 같은 DB를 쓰면 그대로 보입니다. (multipart 라이브러리 불필요)
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.login.models import User
from backend.login.security import get_current_user
from backend.uploads.models import PhotoFile

MAX_BYTES = 4 * 1024 * 1024   # 4MB (MySQL max_allowed_packet 기본값 이하. 큰 사진은 프론트에서 먼저 줄여서 보냄)

router = APIRouter(prefix="/uploads", tags=["uploads"])   # main.py 에서 /api 를 붙임
view_router = APIRouter(tags=["uploads"])                 # /uploads/{이름} (api 접두사 없음)

TYPES = {"jpg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}


def detect_ext(data: bytes):
    """파일 앞부분(매직 넘버)으로 진짜 이미지인지 확인"""
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"GIF8":
        return "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


@router.post("")
async def upload_photo(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BYTES:
        raise HTTPException(413, "사진은 4MB 이하만 올릴 수 있어요.")

    data = await request.body()
    if not data:
        raise HTTPException(400, "사진 파일이 비어 있어요.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "사진은 4MB 이하만 올릴 수 있어요.")

    ext = detect_ext(data)
    if ext is None:
        raise HTTPException(415, "JPG, PNG, GIF, WEBP 사진만 올릴 수 있어요.")

    # DB 컬럼(p_photo 50자)에 들어가도록 짧은 이름 사용: /uploads/ + 20자 + 확장자
    name = f"{secrets.token_hex(10)}.{ext}"
    db.add(PhotoFile(pf_name=name, pf_type=TYPES[ext], pf_data=data))
    await db.commit()
    return {"url": f"/uploads/{name}"}


@view_router.get("/uploads/{name}")
async def view_photo(name: str, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(PhotoFile.pf_type, PhotoFile.pf_data).where(PhotoFile.pf_name == name))).first()
    if row is None:
        raise HTTPException(404, "사진을 찾을 수 없어요.")
    # 이름이 랜덤이고 내용이 바뀌지 않으므로 브라우저가 오래 저장해도 됨
    return Response(content=row.pf_data, media_type=row.pf_type, headers={"Cache-Control": "public, max-age=31536000, immutable"})
