# 여행 계획 플래너

React(Vite) 프론트 + FastAPI 백엔드 + MySQL 로 만든 여행 계획 웹 서비스입니다.
여행계획 → 일정·예산·멤버 관리 → 여행이 끝나면 **여행기** 작성, 가고 싶은 **장소** 둘러보기까지 이어집니다.

## 실행 방법

### 1. DB (MySQL 8.0.16 이상)
1. Workbench 에서 스키마를 하나 만들고 선택합니다. (예: `travel_planner`)
2. 루트의 [`create_tables.sql`](create_tables.sql) 전체를 열어 실행합니다. (테이블 19개)

### 2. 백엔드
```bash
cd src
pip install -r backend/requirements.txt
# src/backend/env.example 를 복사해서 src/backend/.env 를 만들고 DB 정보·SECRET_KEY 를 채웁니다. (.env 는 git 에 올리지 않습니다)
uvicorn backend.main:app --reload --port 8000
```
API 문서: http://localhost:8000/docs

### 3. 프론트
```bash
npm install
npm run dev        # http://localhost:5173  ( /api, /uploads 는 8000 번 백엔드로 자동 연결 )
```

## 한눈에 보는 분류

| 분류 | 프론트 (`src/`) | 백엔드 (`src/backend/`) |
|---|---|---|
| **로그인** | `pages/auth/`, `context/AuthContext.jsx`, `components/ProtectedRoute.jsx`, `components/layout/UserMenu.jsx`·`userMenu/`, `api/client.js`·`authApi.js` | `login/` (회원가입·로그인·JWT·내 정보) |
| **여행계획** | `pages/trips/` (`schedule/` 일정, `budget/` 예산, `members/` 멤버), `pages/places/PlacesTab.jsx`, `api/planApi.js`·`scheduleApi.js`·`budgetApi.js`·`memberApi.js` | `plans/` (여행·일정·예산·멤버·초대·참여요청·해시태그) |
| **여행기** | `pages/journals/` (`list/` 목록, `detail/` 상세·쓰기·수정), `api/journalApi.js` | `journals/` (여행기·여행계획에서 쓰기·댓글·좋아요·해시태그) |
| **장소** | `pages/places/` (목록·상세·리뷰), `api/placeApi.js` | `location/` (장소·리뷰) |
| **공통** | `App.jsx`, `components/`, `hooks/`, `utils/`, `styles/`, `api/uploadApi.js`, `api/client.js` | `main.py`, `core/`, `db/`, `uploads/` (사진 저장) |

여행계획 → 여행기 연결: 끝난 여행에서 **여행기 쓰기**를 누르면 `/journals/new/from/:tripId` 로 이동하고, 그 여행의 일정을 불러와 여행기를 씁니다.

## 폴더 구조 — 프론트 (`src/`)

한 화면(페이지) 폴더 안에서 **화면 조립 → 데이터 처리(훅) → 작은 부품(컴포넌트)** 순서로 나눠 둡니다.
`use○○.js` 는 데이터 불러오기·저장 같은 처리, `○○.jsx` 는 화면 조각입니다.

```
src/
  main.jsx              앱 시작점 (CSS import 목록)
  App.jsx               주소(라우팅) 지도
  api/                  백엔드 호출. 화면 코드는 fetch 를 직접 쓰지 않고 여기 함수만 부릅니다
    client.js             공통 호출 함수 + 로그인 토큰 처리
    planApi / scheduleApi / budgetApi / memberApi   여행계획 (planMapper: 서버↔화면 값 변환, planPaths: 주소 모음)
    journalApi / placeApi / authApi / uploadApi
  context/AuthContext.jsx   로그인 상태
  components/
    layout/               헤더·푸터·내 정보 패널
    common/               모달·카드·탭·태그·별점 등 공통 부품
  hooks/                공통 훅 (useBusyAction: 저장 중 상태·오류 처리 등)
  utils/date.js         날짜 표시 공통 함수
  data/                 해시태그 목록·사진·샘플 데이터
  styles/               화면별 CSS (tokens/base/common/shared 가 공통)
  pages/
    home/               홈
    auth/               로그인·회원가입
    trips/              여행계획 목록·만들기·상세 + 탭
      schedule/ budget/ members/    일정·예산·멤버 탭 (각 폴더: 탭 + 훅 + 부품)
    journals/
      JournalListPage     목록 (list/ : 필터·카드·삭제/쓰기 팝업·훅)
      JournalDetailPage   상세·쓰기·수정 (detail/ : 훅과 부품)
    places/             장소 목록·상세·리뷰, 여행 안의 장소 탭(PlacesTab)
```

## 폴더 구조 — 백엔드 (`src/backend/`)

기능마다 같은 모양의 폴더로 나눕니다. 파일 하나가 하나의 역할만 합니다.

| 파일 | 역할 |
|---|---|
| `router.py` | 주소(URL)와 권한 확인. 받은 값을 service 에 넘기기만 합니다 |
| `service.py` | 규칙(검사·계산·순서). 저장 실패 시 되돌리기는 `rollback_on_error` 가 처리 |
| `crud.py` | DB 읽기·쓰기만 (SQL 질문) |
| `schemas.py` | 주고받는 값의 모양과 검사 (Pydantic) |
| `models.py` | DB 테이블 정의 (폴더 맨 위에 한 번) |

```
src/backend/
  main.py             앱 시작, CORS, 라우터 연결, 주기적으로 도는 "끝난 여행 완료 처리"
  core/settings.py    .env 읽기
  db/                 DB 연결(db.py), 저장 실패 시 되돌리기 공통 함수(transaction.py)
  uploads/            사진 업로드·보기 (DB 에 저장)
  login/              회원가입·로그인·JWT·내 정보 (security.py: 비밀번호·토큰)
  plans/              여행계획 (router.py 가 아래 폴더들을 하나로 묶음)
    trips/ schedules/ budgets/ members/ invites/ join_requests/ hashtags/
    access.py           권한 규칙 (방장 > 편집자 > 참여자), "다른 여행의 항목이면 404" 검사
    dependencies.py     router 에서 쓰는 권한 확인 의존성
    transaction.py      저장(commit) 처리
    scheduler.py        여행 기간이 끝나면 자동으로 "완료" 처리 (1분마다 확인)
  journals/           여행기 (router.py 가 아래 폴더들을 하나로 묶음)
    journal/ from_plan/ comments/ likes/ hashtags/
    validation.py       작성자·완료 여행 확인, responses.py  화면에 보낼 모양 만들기
  location/           장소·리뷰
```

### 권한 규칙 (여행계획)
- **방장**: 전부 (공개 전환, 멤버 관리, 초대 코드, 참여 요청 승인)
- **편집자**: 일정·예산·여행 정보 수정
- **참여자(멤버)**: 보기, 일정 대화
- 공개된 여행은 멤버가 아니어도 일정·장소를 볼 수 있고, **참여 요청**을 보낼 수 있습니다 (방장만 승인).

## 화면 지도 (PC 웹 기준)

| 주소 | 화면 | 파일 |
|---|---|---|
| `/` | 홈 | `pages/home/HomePage.jsx` |
| `/login`, `/register` | 로그인·회원가입 | `pages/auth/` |
| `/trips` | 내 여행 + 다른 사람의 공개 여행, 검색·해시태그 필터, 초대 코드로 참여 | `pages/trips/TripListPage.jsx` |
| `/trips/new` | 새 여행 만들기 | `pages/trips/TripCreatePage.jsx` |
| `/trips/:id` | 여행 상세 + 일정 탭 (일정을 누르면 오른쪽 대화창) | `pages/trips/TripDetailPage.jsx`, `schedule/` |
| `/trips/:id/budget` | 예산 가계부 (멤버만) | `pages/trips/budget/` |
| `/trips/:id/places` | 여행 안의 장소 | `pages/places/PlacesTab.jsx` |
| `/trips/:id/members` | 멤버·초대 코드·참여 요청 | `pages/trips/members/` |
| `/journals` | 여행기 목록 (검색·해시태그, 여행기 쓰기) | `pages/journals/JournalListPage.jsx` |
| `/journals/:id` | 여행기 상세·수정·삭제, 댓글, 좋아요 | `pages/journals/JournalDetailPage.jsx` |
| `/journals/new/from/:tripId` | 끝난 여행으로 여행기 쓰기 | `pages/journals/JournalDetailPage.jsx` |
| `/places`, `/places/:id` | 장소 목록·상세·리뷰 | `pages/places/` |

## 작업 규칙
- 자기 파트 폴더 안의 파일을 주로 수정하고, 공통 파일(`App.jsx`, `components/common/`, `styles/`, `main.py` 등)을 고칠 때는 팀에 알립니다.
- 같은 코드가 두 군데 이상 나오면 함수·훅·컴포넌트로 묶습니다.
- 비밀번호·`.env`·DB 덤프(`*.sql` 데이터)는 GitHub 에 올리지 않습니다.
