# 백엔드 (FastAPI) — 로그인 틀

## 실행
```bash
cd src/backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # DATABASE_URL, SECRET_KEY 를 내 환경에 맞게 수정
python seed.py              # (선택) 테스트 계정 test@test.com / test1234
uvicorn main:app --reload --port 8000
```
- API 문서(직접 눌러서 테스트): http://localhost:8000/docs
- 프론트(Vite)는 `/api/...` 를 8000번으로 넘겨 줍니다.

## 파일
| 파일 | 역할 |
|---|---|
| `main.py` | 앱 시작점, CORS, 라우터 연결 |
| `database.py` | DB 연결, `get_db` |
| `models.py` | users 테이블 (다른 테이블은 각자 추가) |
| `schemas.py` | 요청/응답 모양 |
| `security.py` | 비밀번호 해시, JWT, `get_current_user` |
| `routers/auth.py` | 회원가입·로그인·로그아웃·내 정보 (API 1~4번) |
| `seed.py` | 테스트 계정 |

## 다른 역할이 로그인 정보를 쓰는 법
```python
from fastapi import Depends
from models import User
from security import get_current_user

@router.post("/plans")
def create_plan(body: PlanIn, user: User = Depends(get_current_user)):
    ...  # user.u_id 가 지금 로그인한 사람
```

## 규칙
- 비밀번호 원문과 `u_pwtest`, `u_token` 은 응답에 넣지 않습니다.
- `.env` 는 git에 올리지 않습니다.
