# [공통] FastAPI 시작점. src 폴더에서 실행:  uvicorn backend.main:app --reload --port 8000
# 새 라우터가 생기면 아래에 include_router 한 줄만 추가하세요. (각자 자기 폴더의 router.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.login.router import router as login_router
# from backend.plans.router import router as plans_router         # [여행계획]
# from backend.journals.router import router as journals_router   # [여행기]
# from backend.places.router import router as places_router       # [장소]

app = FastAPI(title="여행 계획 플래너 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # React(Vite) 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router, prefix="/api")
# app.include_router(plans_router, prefix="/api")
# app.include_router(journals_router, prefix="/api")
# app.include_router(places_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
