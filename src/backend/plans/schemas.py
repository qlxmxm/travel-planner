# [임시 연결 파일] 요청·응답 모양(Pydantic)은 기능별 폴더의 schemas.py 로 옮겼어요.
# service.py / router.py 가 새 위치(기능 폴더)를 직접 가져다 쓰게 되면 이 파일은 지웁니다.
from backend.plans.trips.schemas import PlanBase, PlanCreate, PlanUpdate, PlanInDB
from backend.plans.join_requests.schemas import JoinRequestOut
from backend.plans.members.schemas import PlanMemberDetail, PlanMemberCreate, PlanMemberUpdate, PlanMemberInDB, PlanMemberOut
from backend.plans.invites.schemas import InviteCreate, InviteVerify, InviteUpdate, InviteInDB
from backend.plans.hashtags.schemas import HashtagCreate, HashtagInDB, PlanHashtagCreate, PlanHashtagInDB
from backend.plans.schedules.schemas import PlanDetailBase, PlanDetailCreate, PlanDetailUpdate, PlanDetailInDB
from backend.plans.budgets.schemas import BudgetBase, BudgetCreate, BudgetUpdate, BudgetInDB, ExpenseBase, ExpenseCreate, ExpenseUpdate, ExpenseInDB
