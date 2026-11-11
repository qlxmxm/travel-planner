# 백엔드 (FastAPI)

역할별 폴더로 나눠서 작업합니다. **자기 폴더 안의 파일만** 수정하고, 공통 파일을 고칠 때는 팀에 알려 주세요.

```
src/backend/
  main.py          [공통] 앱 시작, CORS, 라우터 연결
  core/settings.py [공통] .env 읽기 (DB 접속, SECRET_KEY, 토큰 만료)
  db/db.py         [공통] DB 연결 (비동기), Base, get_db
  login/           [로그인]   models(users) · schemas · security · router · seed
  plans/           [여행계획] models(plans, invite, plan_members) · budgets(작성 중)
  journals/        [여행기]   (비어 있음)
  places/          [장소]     (비어 있음)
  requirements.txt, .env.example
```

## 실행 (src 폴더에서)
```bash
cd src
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env                  # DB 접속 정보와 SECRET_KEY 입력
python -m backend.login.seed                          # (선택) 테스트 계정 test@test.com / test1234
uvicorn backend.main:app --reload --port 8000
```
- API 문서(직접 눌러서 테스트): http://localhost:8000/docs
- 테이블은 DB 정의서대로 미리 만들어 둡니다 (서버가 자동으로 만들지 않습니다).
- 프론트(Vite)는 `/api/...` 를 8000번으로 넘겨 줍니다.

## 새 기능을 추가하는 법 (예: 여행계획)
1. `plans/` 안에 `router.py` 를 만들고 `router = APIRouter(tags=["여행계획"])` 로 API를 작성
2. `main.py` 의 주석 처리된 줄 두 개(`import`, `include_router`)를 풀기

## 로그인한 사용자를 쓰는 법
```python
from fastapi import Depends
from backend.login.models import User
from backend.login.security import get_current_user
from backend.db import get_db

@router.post("/plans")
async def create_plan(body: PlanIn, user: User = Depends(get_current_user), db = Depends(get_db)):
    ...  # user.u_id 가 지금 로그인한 사람
```

## 규칙
- 비밀번호 원문과 `u_pwtest`, `u_token` 은 응답에 넣지 않습니다.
- `.env` 는 git에 올리지 않습니다.
- DB 접근은 비동기(`async`)로 통일합니다 (`from backend.db import get_db`).
