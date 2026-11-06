// [여행계획] 화면 모양 확인용 가짜 데이터. API가 연결되면 지우고 실제 데이터로 교체하세요.
// 로그인한 사용자(AuthContext)는 user_id 1 '홍길동' 입니다. author_id 가 1이면 "내가 쓴 글"로 취급합니다.
import { photos } from './photos.js';

const mk = (id, author_id, author_name, text, time) => ({ id, author_id, author_name, text, time });

export const sampleTrips = [
  {
    trip_id: 1, owner_name: '홍길동', is_public: 'Y', hashtags: ['관광', '맛집여행'], member_ids: [1, 2, 3, 4], invite_code: 'TOKYO-7K2P', invite_expire: '2026-12-01', owner_id: 1, title: '도쿄 여행', destination: '도쿄', duration: '4박 5일', start_date: '2026-12-20', end_date: '2026-12-24', members: 4, photo: photos.tokyo,
    plans: [
      { plan_id: 101, day: 1, time: '10:30', label: '여행의 시작', place: '나리타 국제공항', photo: photos.narita, title: '도착하면 심카드부터 받고 스카이라이너 타자', comments: [
        mk(1, 3, '마이클', '나리타 도착 시간이 10시 반이라 입국 심사 줄이 길 수도 있어요', '오전 9:12'),
        mk(2, 1, '홍길동', '스카이라이너 예약해 둘게요. 시내까지 40분이래요', '오전 9:15'),
        mk(3, 2, '손오공', '좋아요! 저는 eSIM으로 미리 준비할게요', '오전 9:20') ] },
      { plan_id: 102, day: 1, time: '13:00', label: '', place: '아키하바라', photo: photos.akihabara, title: '다양한 애니메이션 관련 제품을 만날 수 있는 일본 대표 오타로드', comments: [
        mk(4, 4, '아서', '게임센터는 꼭 가봐야 해요', '오후 1:02'),
        mk(5, 1, '홍길동', '면세 카운터 있는 매장 위주로 돌아요', '오후 1:10') ] },
      { plan_id: 103, day: 1, time: '18:00', label: '식사 장소 추천', place: '아사쿠사 규카츠', photo: photos.gyukatsu, title: '입에서 살살 녹는 부드러운 식감의 규카츠로 유명한 곳', comments: [
        mk(6, 2, '손오공', '웨이팅 길다는 후기가 많아요. 5시 반에 가봐요', '오후 4:40'),
        mk(7, 3, '마이클', '저 생고기 굽는 거 처음이라 기대돼요', '오후 4:44') ] },
      { plan_id: 104, day: 1, time: '21:00', label: '숙소로 이동', place: '게이오 플라자 호텔 도쿄', photo: photos.hotel, title: '디즈니랜드 무료 셔틀, 키티 룸, 수유실 등이 있어 아이와 함께 오면 더 좋은 호텔', comments: [
        mk(8, 1, '홍길동', '체크인은 3시부터라 짐 먼저 맡기면 돼요', '오후 8:05') ] },
      { plan_id: 201, day: 2, time: '09:00', label: '아침 산책', place: '아사쿠사 센소지', photo: photos.asakusa, title: '이른 아침에 가면 사람이 적어 사진 찍기 좋은 도쿄 대표 사찰', comments: [ mk(9, 3, '마이클', '인형소 간식도 꼭 먹어봐요', '오전 8:30') ] },
      { plan_id: 202, day: 2, time: '14:00', label: '', place: '시부야 스크램블 교차로', photo: photos.shibuya, title: '해 질 무렵 전망대에서 내려다보는 세계에서 가장 붐비는 교차로', comments: [] },
      { plan_id: 203, day: 2, time: '19:00', label: '식사 장소 추천', place: '신주쿠 라멘 골목', photo: photos.ramen, title: '늦은 저녁에도 줄 서서 먹는 진한 국물 라멘 맛집', comments: [] },
    ],
  },
  { trip_id: 2, owner_name: '홍길동', is_public: 'N', hashtags: ['맛집여행'], member_ids: [1, 2, 3, 4], invite_code: 'OSAKA-3M9Q', invite_expire: '2026-12-31', owner_id: 1, title: '오사카 여행', destination: '오사카', duration: '3박 4일', start_date: '2027-01-15', end_date: '2027-01-18', members: 4, photo: photos.osaka,
    plans: [ { plan_id: 301, day: 1, time: '11:00', label: '여행의 시작', place: '간사이 국제공항', photo: photos.narita, title: '라피트 열차로 난바까지 한 번에', comments: [] } ] },
  { trip_id: 3, owner_name: '손오공', is_public: 'Y', hashtags: ['힐링', '사진명소'], member_ids: [2, 1], invite_code: 'JEJU-5R8T', invite_expire: '2027-01-20', owner_id: 2, title: '제주도 여행', destination: '제주', duration: '2박 3일', start_date: '2027-02-06', end_date: '2027-02-08', members: 2, photo: photos.jeju,
    plans: [ { plan_id: 401, day: 1, time: '10:00', label: '여행의 시작', place: '제주공항', photo: photos.jeju, title: '렌터카 픽업은 공항 밖 셔틀 타고', comments: [] } ] },
];

// ---- 여행계획 공통 도우미 ----
// is_public: 'Y' 공개(다른 사람도 볼 수 있음) / 'N' 비공개(멤버만)
export const isMember = (trip, user) => trip.member_ids.includes(user.user_id);
export const canSee = (trip, user) => trip.is_public === 'Y' || isMember(trip, user);
// 여행 기간(end_date)이 지났는지 → 지났으면 "여행기에 추가" 버튼이 나타남
export const isEnded = (trip) => new Date(trip.end_date) < new Date(new Date().toDateString());

// 다른 사람의 여행계획과 이미 끝난 여행 (화면 확인용)
sampleTrips.push(
  { trip_id: 4, owner_name: '홍길동', is_public: 'Y', hashtags: ['맛집여행', '힐링'], member_ids: [1, 2], invite_code: 'BUSAN-2L6W', invite_expire: '2026-09-30', owner_id: 1, title: '부산 여행', destination: '부산', duration: '2박 3일', start_date: '2026-09-12', end_date: '2026-09-14', members: 2, photo: photos.sunset,
    plans: [
      { plan_id: 501, day: 1, time: '12:00', label: '점심', place: '자갈치시장', photo: photos.gyukatsu, title: '싱싱한 회와 꼼장어로 시작하는 부산 여행', comments: [] },
      { plan_id: 502, day: 1, time: '17:30', label: '', place: '해운대 해변', photo: photos.sunset, title: '해 질 무렵 모래사장 산책', comments: [] },
      { plan_id: 503, day: 2, time: '10:00', label: '아침 산책', place: '감천문화마을', photo: photos.asakusa, title: '골목마다 색이 다른 포토 스폿', comments: [] },
    ] },
  { trip_id: 5, owner_name: '손오공', is_public: 'Y', hashtags: ['관광', '쇼핑'], member_ids: [2, 3], invite_code: 'BKK-4D7N', invite_expire: '2027-02-01', owner_id: 2, title: '방콕 여행', destination: '방콕', duration: '3박 4일', start_date: '2027-03-10', end_date: '2027-03-13', members: 2, photo: photos.akihabara,
    plans: [ { plan_id: 601, day: 1, time: '14:00', label: '여행의 시작', place: '수완나품 공항', photo: photos.narita, title: '공항철도로 시내까지 이동', comments: [] }, { plan_id: 602, day: 2, time: '10:00', label: '', place: '왕궁', photo: photos.asakusa, title: '이른 시간에 가면 덜 더워요', comments: [] } ] },
  { trip_id: 6, owner_name: '마이클', is_public: 'N', hashtags: ['힐링'], member_ids: [3], invite_code: 'JEJU-9X1Z', invite_expire: '2027-03-01', owner_id: 3, title: '제주 한 달 살기', destination: '제주', duration: '29박 30일', start_date: '2027-04-01', end_date: '2027-04-30', members: 1, photo: photos.jeju,
    plans: [ { plan_id: 701, day: 1, time: '11:00', label: '', place: '애월 숙소', photo: photos.hotel, title: '짐 풀고 동네 산책', comments: [] } ] },
  { trip_id: 7, owner_name: '아서', is_public: 'Y', hashtags: ['스포츠여행', '액티비티'], member_ids: [4], invite_code: 'SEOUL-8H3B', invite_expire: '2026-09-25', owner_id: 4, title: '서울 러닝 여행', destination: '서울', duration: '2박 3일', start_date: '2026-10-01', end_date: '2026-10-03', members: 1, photo: photos.mountain,
    plans: [ { plan_id: 801, day: 1, time: '07:00', label: '아침 러닝', place: '한강 반포지구', photo: photos.sunset, title: '10km 코스 러닝', comments: [] }, { plan_id: 802, day: 2, time: '09:00', label: '', place: '북한산 둘레길', photo: photos.mountain, title: '가볍게 3시간 트레킹', comments: [] } ] },
);

// 예산 가계부 가짜 데이터. kind: 'budget'(예산) | 'add'(추가 예산) | 'used'(지출)
// DB 정의서(예산 테이블)의 b_budget / b_add / b_used 에 해당합니다. memo 는 화면용 메모(DB에 컬럼 추가 필요)
export const sampleBudgets = {
  1: [
    { b_id: 1, kind: 'budget', memo: '기본 예산', amount: 2000000, date: '2026-11-01' },
    { b_id: 2, kind: 'add', memo: '환전 추가', amount: 300000, date: '2026-11-03' },
    { b_id: 3, kind: 'used', memo: '항공권', amount: 640000, date: '2026-11-02' },
    { b_id: 4, kind: 'used', memo: '숙소 3박', amount: 860000, date: '2026-11-02' },
    { b_id: 5, kind: 'used', memo: '스카이라이너', amount: 22000, date: '2026-11-04' },
  ],
  2: [ { b_id: 11, kind: 'budget', memo: '기본 예산', amount: 1200000, date: '2026-11-05' } ],
  4: [
    { b_id: 21, kind: 'budget', memo: '기본 예산', amount: 500000, date: '2026-09-01' },
    { b_id: 22, kind: 'used', memo: '자갈치시장 회', amount: 120000, date: '2026-09-12' },
    { b_id: 23, kind: 'used', memo: '숙소', amount: 240000, date: '2026-09-12' },
  ],
};

export const samplePlaces = [
  { place_id: 1, name: '아사쿠사 센소지', category: '관광', address: '도쿄 다이토구', photo: photos.asakusa },
  { place_id: 2, name: '아사쿠사 규카츠', category: '식당', address: '도쿄 다이토구', photo: photos.gyukatsu },
  { place_id: 3, name: '시부야 스크램블 교차로', category: '관광', address: '도쿄 시부야구', photo: photos.shibuya },
  { place_id: 4, name: '게이오 플라자 호텔', category: '숙소', address: '도쿄 신주쿠구', photo: photos.hotel },
  { place_id: 5, name: '신주쿠 라멘 골목', category: '식당', address: '도쿄 신주쿠구', photo: photos.ramen },
];
export const placeCategories = ['전체', '관광', '식당', '카페', '숙소'];

export const sampleMembers = [
  { user_id: 1, user_name: '홍길동', role: '방장' },
  { user_id: 2, user_name: '손오공', role: '참여자' },
  { user_id: 3, user_name: '마이클', role: '참여자' },
  { user_id: 4, user_name: '아서', role: '참여자' },
];
