# 여행 계획 플래너 (프론트엔드 템플릿)

트리플(Triple) 웹 스타일의 **PC 웹용** 공통 틀입니다. 화면 뼈대·라우팅·디자인 토큰과 **화면 안에서만 움직이는 샘플 동작**이 들어 있고, 서버 연결(API)은 비어 있습니다.
각자 **역할 폴더**에서 기능을 채워 넣으세요.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
```
백엔드(FastAPI, 8000번 포트)는 `/api/...` 로 자동 연결됩니다 (`vite.config.js`의 proxy).

## 역할 분담 (4개 역할)

파일 맨 위 주석의 `[역할]` 표시가 그 파일의 담당입니다. 담당자 이름은 팀에서 아래 표에 적어 주세요.

| 역할 | 담당자 | 프론트 파일 | 샘플 데이터 | CSS | 백엔드(제안) |
|---|---|---|---|---|---|
| **로그인** | | `pages/auth/`, `context/AuthContext.jsx`, `components/ProtectedRoute.jsx`, `api/client.js` | - | - | `routers/auth.py` (회원가입·로그인·JWT) |
| **여행계획** | | `pages/trips/`, `pages/schedule/`, `pages/budget/`, `pages/members/`, `pages/places/PlacesTab.jsx`, `components/common/TripCard.jsx`, `TabNav.jsx` | `data/sampleTrips.js` | `trips.css`, `schedule.css`, `budget.css`, `members.css`, `places.css` | `routers/plans.py` (여행·일정·대화·예산·멤버·초대·해시태그) |
| **여행기** | | `pages/journals/` | `data/sampleJournals.js` | `journals.css` | `routers/journals.py` (여행기·댓글·좋아요) |
| **장소** | | `pages/places/PlaceListPage.jsx`, `PlaceDetailPage.jsx`, `components/common/StarRating.jsx` | `data/samplePlaces.js` | `placebrowse.css` | `routers/places.py` (장소·리뷰) |

- 해시태그는 **여행계획**과 **여행기**가 같이 씁니다 (`components/common/Tags.jsx`, `TagPicker.jsx`, `data/hashtags.js`). 데이터(`hashtags` 테이블·API)는 여행계획 담당이 소유하고, 여행기는 가져다 씁니다.
- 여행계획 → 여행기 연결: 여행계획 상세의 **[여행기에 추가]** 버튼은 `/journals/new/from/:tripId` 로 이동하고, 여행기 쓰기 화면이 그 여행의 일정을 불러옵니다. API 연결 후에는 "여행계획 상세 조회 API를 호출해 폼을 채운다"로 바꾸면 됩니다.
- 여행 안의 "장소" 탭(`PlacesTab`)은 여행계획 소유입니다. 새 `장소` 메뉴와 합칠 때는 두 담당이 함께 정하세요.

## 공통 파일 (수정 전에 팀에 알리기)

`App.jsx`(라우팅), `components/layout/`(헤더·푸터), `components/common/` 의 `Modal`, `PageHeader`, `EmptyState`, `Avatar`, `PhotoPicker`, `Tags`, `TagPicker`, `main.jsx`(CSS import), `styles/tokens.css`, `base.css`, `common.css`, `shared.css`, `forms.css`, `layout.css`, `home.css`, `hooks/`, `data/photos.js`, `data/hashtags.js`.

## 화면 지도 (PC 웹 기준)

| 주소 | 화면 | 파일 | 역할 |
|---|---|---|---|
| `/` | 홈(소개, 스크롤 연출) | `pages/HomePage.jsx` | 공통 |
| `/login`, `/register` | 로그인/회원가입 | `pages/auth/` | 로그인 |
| `/trips` | 여행계획 목록: 내 여행 + 다른 사람의 공개 여행, 검색·해시태그 필터, 초대 코드로 참여 | `pages/trips/TripListPage.jsx` | 여행계획 |
| `/trips/new` | 새 여행 만들기 (기간 자동 계산, 공개 여부, 해시태그, 대표 사진, 친구 추가) | `pages/trips/TripCreatePage.jsx` | 여행계획 |
| `/trips/:id` | 여행 상세 틀 (공개 전환·해시태그 편집·**여행기에 추가** 버튼) + 일정 탭 | `pages/trips/TripDetailPage.jsx`, `pages/schedule/ScheduleTab.jsx` | 여행계획 |
| (일정 클릭) | 오른쪽 대화창: 제목 수정, 말풍선, 본인 글만 수정/삭제 | `pages/schedule/PlanChat.jsx` | 여행계획 |
| `/trips/:id/budget` | 예산 가계부 (총 예산·지출·잔액, 내역 추가/수정/삭제, 멤버만) | `pages/budget/BudgetTab.jsx` | 여행계획 |
| `/trips/:id/places` | 여행 안의 장소 탭 | `pages/places/PlacesTab.jsx` | 여행계획 |
| `/trips/:id/members` | 멤버 탭: 초대 코드 복사·새로 만들기, 멤버 내보내기 | `pages/members/MembersTab.jsx` | 여행계획 |
| `/journals` | 여행기 목록: 검색 + 해시태그 필터, 내 여행기에만 삭제 버튼 | `pages/journals/JournalListPage.jsx` | 여행기 |
| `/journals/:id` | 여행기 상세 (Day → 시간별 장소 → 글/사진/별점, 댓글 수정·삭제) | `pages/journals/JournalDetailPage.jsx` | 여행기 |
| `/journals/new`, `/journals/new/from/:tripId` | 여행기 쓰기 (여행계획에서 불러오기, 해시태그) | `pages/journals/JournalWritePage.jsx` | 여행기 |
| `/journals/:id/edit` | 여행기 수정 (작성자만) | `pages/journals/JournalWritePage.jsx` | 여행기 |
| `/places` | 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색(이름·카테고리·도시·주소) + 평균 별점 | `pages/places/PlaceListPage.jsx` | 장소 |
| `/places/:id` | 장소 상세: 정보 + 평균 별점 + 리뷰 작성·수정·삭제(내 리뷰만) | `pages/places/PlaceDetailPage.jsx` | 장소 |

임시 사진은 `src/assets/photos/*.svg` (직접 그린 그림)이고, 실제 사진으로 바꾸려면 `data/photos.js`만 고치면 됩니다.

## 충돌을 줄이는 규칙

1. **자기 역할의 파일만 수정**합니다. 다른 역할의 파일을 고쳐야 하면 담당에게 먼저 말하세요.
2. 위의 **공통 파일**은 수정 전에 팀에 알립니다.
3. 색상·둥글기는 `tokens.css`의 변수(`var(--accent)` 등)만 사용합니다. 색을 직접 쓰지 마세요.
4. CSS는 역할별 파일로 나뉘어 있습니다. 여러 화면이 같이 쓰는 스타일만 `shared.css`에 넣고, 새 화면 전용 CSS는 새 파일을 만들어 `main.jsx`에 import 한 줄만 추가합니다.
5. 지금 화면의 목록은 `data/sample*.js` 의 **가짜 데이터**입니다. API 연결 후 삭제하세요. 필드 이름은 DB 정의서/API 명세서와 같게 맞춰 두었습니다 (장소: `p_id`, `pr_rating` 등).
6. 브랜치는 역할별로(`feature/auth`, `feature/plans`, `feature/journals`, `feature/places`), `main`에 직접 push 하지 않습니다.

## 폴더 구조

```
src/
  main.jsx            앱 시작점 (CSS import 목록)
  App.jsx             라우팅 지도
  api/client.js       백엔드 호출 공통 함수                     [로그인]
  context/            로그인 상태                               [로그인]
  components/
    layout/           헤더, 푸터, 레이아웃                      [공통]
    common/           카드, 탭, 태그, 별점 등 공통 부품
  pages/
    auth/             로그인·회원가입                           [로그인]
    trips/ schedule/ budget/ members/   여행계획 일체           [여행계획]
    places/           PlaceList·PlaceDetail [장소] / PlacesTab [여행계획]
    journals/         여행기                                    [여행기]
  hooks/              스크롤 진행률 등 공통 훅
  data/               역할별 임시 샘플 데이터
  styles/             tokens / base / common / shared / layout 은 공통, 나머지는 역할별
```

## 지금 화면에서 이미 움직이는 것 (저장은 안 됨, 새로고침하면 처음으로)

- 여행계획: 공개 여부 전환, 해시태그 편집, 검색·필터, 초대 코드 참여(샘플 코드 `BKK-4D7N`), 일정 추가/수정/삭제, 일정 대화(내 글만 수정/삭제), 예산 내역 추가/수정/삭제, 멤버 내보내기, [여행기에 추가]
- 여행기: 검색·해시태그 필터, 댓글 작성/수정/삭제(내 글만), 작성 폼(여행계획 불러오기)
- 장소: 카테고리 탭 + 검색, 리뷰 작성/수정/삭제(내 리뷰만, 한 장소에 한 번), 평균 별점 갱신
- 홈 화면: 스크롤 진행률에 따라 한 화면씩 바뀌는 소개 (`hooks/useScroll.js`, `pages/HomePage.jsx`, `styles/home.css`)

샘플 사용자 이름은 홍길동(로그인 사용자), 손오공, 마이클, 아서 입니다.
삭제·수정 권한(방장만, 작성자만)은 지금 화면에서만 처리하며, **서버에서도 반드시 권한을 다시 검사**해야 합니다.
홈 마지막 화면 배경 사진: `src/assets/photos/cta.jpg` (바꾸려면 같은 이름으로 교체)
