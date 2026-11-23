# [여행계획] 여행계획 API 전체를 하나로 묶는 파일. main.py 가 이 router 를 연결합니다.
# 실제 API 코드는 기능별 폴더의 router.py 에 있어요.
#
# ⚠ 아래 순서를 바꾸지 마세요. FastAPI 는 위에서부터 먼저 맞는 주소로 처리해서,
#    "/plans/hashtags", "/plans/public", "/plans/user/1" 같은 고정 주소가 "/plans/{plan_id}" 보다 먼저 와야 해요.
from fastapi import APIRouter

from backend.plans.hashtags.router import catalog_router, plan_router as plan_hashtag_router
from backend.plans.trips.router import router as trips_router
from backend.plans.invites.router import router as invites_router
from backend.plans.members.router import router as members_router
from backend.plans.schedules.router import router as schedules_router
from backend.plans.budgets.router import router as budgets_router
from backend.plans.join_requests.router import router as join_requests_router

router = APIRouter(prefix="/plans", tags=["여행 계획"])

router.include_router(catalog_router)           # /plans/hashtags ...        (고정 주소: {plan_id} 보다 먼저)
router.include_router(trips_router)             # /plans/public, /plans/, /plans/user/{user_id}, /plans/{plan_id}
router.include_router(invites_router)           # /plans/{plan_id}/invites, /plans/invites/verify, /plans/invites/join
router.include_router(members_router)           # /plans/{plan_id}/members
router.include_router(plan_hashtag_router)      # /plans/{plan_id}/hashtags
router.include_router(schedules_router)         # /plans/{plan_id}/details
router.include_router(budgets_router)           # /plans/{plan_id}/budgets, .../expenses
router.include_router(join_requests_router)     # /plans/{plan_id}/join-requests
