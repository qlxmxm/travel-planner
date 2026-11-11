# [공통] FastAPI 시작점. 실행: uvicorn main:app --reload --port 8000
# 새 라우터가 생기면 아래에 include_router 한 줄만 추가하세요.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth

# 테이블이 없으면 만들어 줍니다. (이미 SQL로 만들었다면 아무 일도 일어나지 않음)
# 주의: 이 파일에 모델이 import 되어 있어야 테이블이 만들어집니다.
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

app = FastAPI(title="여행 계획 플래너 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # React(Vite) 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
# app.include_router(plans.router, prefix="/api")      # [여행계획]
# app.include_router(journals.router, prefix="/api")   # [여행기]
# app.include_router(places.router, prefix="/api")     # [장소]


@app.get("/api/health")
def health():
    return {"status": "ok"}
