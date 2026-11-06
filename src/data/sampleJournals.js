// [여행기] 여행기 가짜 데이터 (트리플 여행기처럼 Day별 → 시간별 장소 → 글/사진/별점)
// items: kind 'flight' (비행/이동 한 줄) | 'place' (장소: time, name, rating, text[], photo)
// comments: author_id 가 1(홍길동)이면 "내 댓글" → 수정/삭제 가능
import { photos } from './photos.js';

const c = (id, author_id, author_name, text, date) => ({ id, author_id, author_name, text, date });

export const sampleJournals = [
  { journal_id: 1, hashtags: ['관광', '맛집여행'], title: '도쿄 4박 5일, 걷고 먹고 또 걷고', summary: '아사쿠사부터 시부야까지 하루 3만 보를 걸은 기록', author: '홍길동', author_id: 1, date: '2026-10-12', likes: 128, views: 1520, cover: photos.tokyo,
    days: [
      { day: 1, date: '2026.04.17', intro: '너무나도 많은 출발 공항과 짧은 환승 때문에 계획이 완전 틀어졌지만 여전히 재밌었던 하루',
        items: [
          { kind: 'flight', time: '08:50', name: 'ICN 08:50 - NRT 11:20' },
          { kind: 'place', time: '11:20', name: '나리타 국제공항', rating: 0, text: ['새벽같이 일어나서 출발… 전날 갑자기 체하는 바람에 아침에 공항에서 죽만 먹음', '입국 수속이 늦어져서 예매했던 스카이라이너를 놓쳤는데, 현장에서 다음 열차로 변경이 가능해서 다행이었다'], photo: photos.narita },
          { kind: 'place', time: '14:00', name: '신주쿠 와세다 스테이 패밀리룸', rating: 5, text: ['JR 야마노테선 다카다노바바역에서 걸어서 10분 정도 걸림. 나리타 익스프레스를 타면 신주쿠에서 환승하면 된다', '더블 베드 1개에 싱글 침대 1개가 있어서 4인이 충분히 숙박할 수 있음. 아고다에서 예약해 3박 4일 약 86만원 정도'], photo: photos.hotel },
          { kind: 'place', time: '18:30', name: '아사쿠사 규카츠', rating: 4, text: ['웨이팅이 길었지만 기다린 보람이 있었다. 직접 구워 먹는 재미가 있고 정말 입에서 살살 녹는다', '소스는 와사비 간장이 제일 잘 어울렸음'], photo: photos.gyukatsu },
        ] },
      { day: 2, date: '2026.04.18', intro: '이른 아침 사찰 산책으로 시작해서 시부야에서 마무리',
        items: [
          { kind: 'place', time: '09:00', name: '아사쿠사 센소지', rating: 4, text: ['이른 아침이라 사람이 거의 없어서 사진 찍기 좋았다'], photo: photos.asakusa },
          { kind: 'place', time: '17:30', name: '시부야 스크램블 교차로', rating: 5, text: ['해 질 무렵 전망대에서 내려다본 교차로가 이번 여행에서 가장 기억에 남는다'], photo: photos.shibuya },
        ] },
    ],
    comments: [ c(1, 2, '손오공', '규카츠 집 이름 알려주세요! 다음 달에 가요', '2026-10-13'), c(2, 1, '홍길동', '아사쿠사 본점이에요. 5시 반 전에 가면 덜 기다려요', '2026-10-13') ] },
  { journal_id: 2, hashtags: ['힐링', '관광'], title: '제주 겨울바다 드라이브', summary: '렌터카로 해안도로를 따라 한 바퀴', author: '마이클', author_id: 2, date: '2026-09-28', likes: 86, views: 960, cover: photos.jeju,
    days: [ { day: 1, date: '2026.09.20', intro: '겨울 제주는 바람이 세지만 바다 색이 가장 진하다', items: [ { kind: 'place', time: '10:00', name: '애월 해안도로', rating: 5, text: ['창문을 열고 달리면 바다 냄새가 가득'], photo: photos.jeju } ] } ], comments: [] },
  { journal_id: 3, hashtags: ['맛집여행'], title: '오사카 먹방 투어 후기', summary: '타코야키, 오코노미야키, 그리고 또 타코야키', author: '손오공', author_id: 3, date: '2026-09-10', likes: 64, views: 780, cover: photos.osaka,
    days: [ { day: 1, date: '2026.09.02', intro: '도톤보리에서 시작해 밤까지 먹기만 한 하루', items: [ { kind: 'place', time: '12:00', name: '도톤보리 라멘', rating: 4, text: ['줄이 길었지만 국물이 진했다'], photo: photos.ramen } ] } ], comments: [] },
  { journal_id: 4, hashtags: ['사진명소', '힐링'], title: '강릉 일출 보러 가기', summary: '새벽 4시에 출발한 당일치기', author: '아서', author_id: 4, date: '2026-08-21', likes: 41, views: 530, cover: photos.gangneung,
    days: [ { day: 1, date: '2026.08.15', intro: '일출 시간에 맞춰 도착하면 사람이 많지 않다', items: [ { kind: 'place', time: '05:30', name: '강릉 바다', rating: 5, text: ['수평선이 붉게 물드는 20분'], photo: photos.gangneung } ] } ], comments: [] },
  { journal_id: 5, hashtags: ['스포츠여행', '액티비티'], title: '설악산 단풍 산행', summary: '케이블카 없이 올라간 대청봉', author: '홍길동', author_id: 1, date: '2026-10-20', likes: 97, views: 1110, cover: photos.mountain,
    days: [ { day: 1, date: '2026.10.11', intro: '새벽 공기는 차가웠지만 올라가니 구름이 발아래 있었다', items: [ { kind: 'place', time: '06:00', name: '설악산 대청봉', rating: 5, text: ['정상에서 먹는 컵라면은 말이 필요 없다'], photo: photos.mountain } ] } ], comments: [] },
  { journal_id: 6, hashtags: ['사진명소', '힐링'], title: '노을 맛집 해변 모음', summary: '해 질 때 가면 좋은 곳 5곳', author: '마이클', author_id: 2, date: '2026-07-30', likes: 33, views: 402, cover: photos.sunset,
    days: [ { day: 1, date: '2026.07.20', intro: '해가 지는 20분이 하루 중 가장 아름답다', items: [ { kind: 'place', time: '18:40', name: '서쪽 바다', rating: 4, text: ['일몰 30분 전에 도착하기'], photo: photos.sunset } ] } ], comments: [] },
];
