# [여행기] 여행기 API 전체를 하나로 묶는 파일. main.py 가 이 router 를 연결합니다.
# 실제 API 코드는 기능별 폴더의 router.py 에 있어요.
#
# ⚠ 아래 순서를 바꾸지 마세요. FastAPI 는 위에서부터 먼저 맞는 주소로 처리해서,
#    "/journals/me" 같은 고정 주소가 "/journals/{j_id}" 보다 먼저 와야 해요.
# ⚠ "/journals" 접두어는 아래 include_router 마다 붙여요. 여행기 목록(GET /journals)의 경로가 빈 문자열("")이라,
#    FastAPI 규칙상 묶는 쪽에 접두어가 없으면 "접두어와 경로가 둘 다 비었다"는 오류가 나기 때문이에요.
from fastapi import APIRouter

from backend.journals.from_plan.router import router as from_plan_router
from backend.journals.journal.router import router as journal_router
from backend.journals.comments.router import router as comments_router
from backend.journals.hashtags.router import router as hashtags_router
from backend.journals.likes.router import router as likes_router

PREFIX = "/journals"

router = APIRouter(tags=["여행기"])

router.include_router(from_plan_router, prefix=PREFIX)     # /journals/from-plan/{plan_id} ...
router.include_router(journal_router, prefix=PREFIX)       # /journals, /journals/me, /journals/{j_id}, /journals/items/{ji_id}
router.include_router(comments_router, prefix=PREFIX)      # /journals/{j_id}/comments, /journals/comments/{jc_id}
router.include_router(hashtags_router, prefix=PREFIX)      # /journals/{j_id}/hashtags
router.include_router(likes_router, prefix=PREFIX)         # /journals/likes/me, /journals/{j_id}/likes ...
