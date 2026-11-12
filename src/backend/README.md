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


