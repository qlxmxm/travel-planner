# [임시 연결 파일] DB 읽기·쓰기는 기능별 폴더의 crud.py 로 옮겼어요.
# service.py / router.py 가 새 위치(기능 폴더)를 직접 가져다 쓰게 되면 이 파일은 지웁니다.
from backend.plans.trips.crud import PlanCrud
from backend.plans.invites.crud import InviteCrud
from backend.plans.members.crud import PlanMemberCrud
from backend.plans.hashtags.crud import HashtagCrud, PlanHashtagCrud
from backend.plans.schedules.crud import PlanDetailCrud
from backend.plans.budgets.crud import BudgetCrud, ExpenseCrud
from backend.plans.join_requests.crud import JoinRequestCrud
