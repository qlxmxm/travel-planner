# 여행 계획 플래너

## 분류

| 분류 | | 프론트 파일 | 샘플 데이터 | CSS | 백엔드(제안) |
|---|---|---|---|---|---|
| **로그인** | | `pages/auth/`, `context/AuthContext.jsx`, `components/ProtectedRoute.jsx`, `api/client.js` | - | - | `routers/auth.py` (회원가입·로그인·JWT) |
| **여행계획** | | `pages/trips/`, `pages/schedule/`, `pages/budget/`, `pages/members/`, `pages/places/PlacesTab.jsx`, `components/common/TripCard.jsx`, `TabNav.jsx` | `data/sampleTrips.js` | `trips.css`, `schedule.css`, `budget.css`, `members.css`, `places.css` | `routers/plans.py` (여행·일정·대화·예산·멤버·초대·해시태그) |
| **여행기** | | `pages/journals/` | `data/sampleJournals.js` | `journals.css` | `routers/journals.py` (여행기·댓글·좋아요) |
| **장소** | | `pages/places/PlaceListPage.jsx`, `PlaceDetailPage.jsx`, `components/common/StarRating.jsx` | `data/samplePlaces.js` | `placebrowse.css` | `routers/places.py` (장소·리뷰) |


- 여행계획 → 여행기 연결: 여행계획 상세의 **[여행기에 추가]** 버튼 `/journals/new/from/:tripId` 로 이동, 여행기 쓰기 화면이 그 여행의 일정을 불러옴.

## 일부 공통 파일

`App.jsx`(라우팅), `components/layout/`(헤더·푸터), `components/common/` 의 `Modal`, `PageHeader`, `EmptyState`, `Avatar`, `PhotoPicker`, `Tags`, `TagPicker`, `main.jsx`(CSS import), `styles/tokens.css`, `base.css`, `common.css`, `shared.css`, `forms.css`, `layout.css`, `home.css`, `hooks/`, `data/photos.js`, `data/hashtags.js`.

## 화면 지도 (PC 웹 기준)

| 주소 | 화면 | 파일 |  |
|---|---|---|---|
| `/` | 홈(소개, 스크롤 연출) | `pages/HomePage.jsx` | |
| `/login`, `/register` | 로그인/회원가입 | `pages/auth/` | |
| `/trips` | 여행계획 목록: 내 여행 + 다른 사람의 공개 여행, 검색·해시태그 필터, 초대 코드로 참여 | `pages/trips/TripListPage.jsx` | |
| `/trips/new` | 새 여행 만들기 (기간 자동 계산, 공개 여부, 해시태그, 대표 사진, 친구 추가) | `pages/trips/TripCreatePage.jsx` | |
| `/trips/:id` | 여행 상세 틀 (공개 전환·해시태그 편집·**여행기에 추가** 버튼) + 일정 탭 | `pages/trips/TripDetailPage.jsx`, `pages/schedule/ScheduleTab.jsx` | |
| (일정 클릭) | 오른쪽 대화창: 제목 수정, 말풍선, 본인 글만 수정/삭제 | `pages/schedule/PlanChat.jsx` | |
| `/trips/:id/budget` | 예산 가계부 (총 예산·지출·잔액, 내역 추가/수정/삭제, 멤버만) | `pages/budget/BudgetTab.jsx` | |
| `/trips/:id/places` | 여행 안의 장소 탭 | `pages/places/PlacesTab.jsx` | |
| `/trips/:id/members` | 멤버 탭: 초대 코드 복사·새로 만들기, 멤버 내보내기 | `pages/members/MembersTab.jsx` | |
| `/journals` | 여행기 목록: 검색 + 해시태그 필터, 내 여행기에만 삭제 버튼 | `pages/journals/JournalListPage.jsx` | |
| `/journals/:id` | 여행기 상세 (Day → 시간별 장소 → 글/사진/별점, 댓글 수정·삭제) | `pages/journals/JournalDetailPage.jsx` | |
| `/journals/new`, `/journals/new/from/:tripId` | 여행기 쓰기 (여행계획에서 불러오기, 해시태그) | `pages/journals/JournalWritePage.jsx` | |
| `/journals/:id/edit` | 여행기 수정 (작성자만) | `pages/journals/JournalWritePage.jsx` | |
| `/places` | 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색(이름·카테고리·도시·주소) + 평균 별점 | `pages/places/PlaceListPage.jsx` | |
| `/places/:id` | 장소 상세: 정보 + 평균 별점 + 리뷰 작성·수정·삭제(내 리뷰만) | `pages/places/PlaceDetailPage.jsx` | |

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
  data/               임시 샘플 데이터
  styles/             tokens / base / common / shared / layout
```
