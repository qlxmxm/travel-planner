# 백엔드 (FastAPI)

전체 구조·실행 방법은 루트의 [`README.md`](../../README.md) 를 보세요. 여기에는 백엔드만 짧게 적습니다.

- 실행 (`src` 폴더에서): `uvicorn backend.main:app --reload --port 8000`
- 환경 설정: `env.example` 를 복사해 `.env` 를 만들고 DB 정보·`SECRET_KEY` 를 채웁니다. (`.env` 는 git 에 올리지 않습니다)
- API 문서: http://localhost:8000/docs

```
src/backend/
  main.py       [공통]     앱 시작, CORS, 라우터 연결
  core/         [공통]     settings.py  .env 읽기
  db/           [공통]     db.py 연결 · transaction.py 저장 실패 시 되돌리기
  uploads/      [공통]     사진 업로드·보기
  login/        [로그인]   models · schemas · security · service · router
  plans/        [여행계획] trips · schedules · budgets · members · invites · join_requests · hashtags
  journals/     [여행기]   journal · from_plan · comments · likes · hashtags
  location/     [장소]     models · schemas · service · router
```

기능 폴더마다 `router.py`(주소·권한) → `service.py`(규칙) → `crud.py`(DB) → `schemas.py`(값 모양) 순서로 나뉘어 있습니다.
새 라우터를 만들면 `main.py` 에 `include_router` 한 줄만 추가하세요.
