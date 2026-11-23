// [여행계획] 서버 응답(plans, plan_details ...)을 화면에서 쓰는 모양(trip, 일정)으로 바꾸는 변환 함수 모음. 서버 호출은 하지 않습니다.
// 백엔드(DB) 모양:  plans(p_id,u_id,p_title,loc,p_start,p_end,p_status) / plan_members / plan_details / budgets / expenses / hashtag
// 화면(trip) 모양:  { trip_id, title, destination, start_date, end_date, duration, members, member_ids, owner_id, hashtags, photo, completed }
//  - 공개 여부(p_public)·대표 사진(p_photo)은 plans 테이블 컬럼에 저장합니다. (사진이 비어 있으면 여행지 이름으로 고름)
//  - 일정(plan_details)의 장소 이름/구분/제목은 memo 컬럼에 JSON 으로 담습니다. (memo 255자 제한)
import { photos } from '../data/photos.js';
import { DAY_MS, dateOnly, timeOnly, dateToMs, toDateString, pad2 } from '../utils/date.js';

export function durationText(start, end) {
  if (!start || !end) return '';
  const nights = Math.round((dateToMs(end) - dateToMs(start)) / DAY_MS);
  if (nights < 0) return '';
  return nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`;
}

const PHOTO_KEYWORDS = [
  ['도쿄', 'tokyo'], ['오사카', 'osaka'], ['제주', 'jeju'], ['강릉', 'gangneung'], ['부산', 'sunset'], ['산', 'mountain'],
  ['공항', 'narita'], ['센소지', 'asakusa'], ['시부야', 'shibuya'], ['아키하바라', 'akihabara'],
  ['규카츠', 'gyukatsu'], ['라멘', 'ramen'], ['호텔', 'hotel'], ['숙소', 'hotel'],
];
export function photoFor(text, fallback = 'tokyo') {
  const hit = PHOTO_KEYWORDS.find(([k]) => String(text || '').includes(k));
  return photos[hit ? hit[1] : fallback] ?? photos.tokyo;
}

// 사진 값: 임시 그림은 이름(key), 올린 사진은 주소(/uploads/...)로 저장합니다.
export const photoSrc = (v) => (v ? (photos[v] ?? (/^(\/|https?:)/.test(v) ? v : '')) : '');
export const photoKey = (src) => (src ? (Object.keys(photos).find((k) => photos[k] === src) ?? src) : '');

export function toTrip(plan, members = [], tags = []) {
  const start = dateOnly(plan.p_start), end = dateOnly(plan.p_end);
  const owner = members.find((m) => m.u_id === plan.u_id);
  return {
    trip_id: plan.p_id,
    title: plan.p_title,
    destination: plan.loc,
    start_date: start,
    end_date: end,
    duration: durationText(start, end),
    owner_id: plan.u_id,
    owner_name: owner?.u_name ?? '',
    member_ids: members.map((m) => m.u_id),
    editor_ids: members.filter((m) => m.role === '편집자').map((m) => m.u_id), // 방장처럼 편집할 수 있는 멤버
    members: members.length || 1,
    hashtags: tags.map((t) => t.h_name),
    is_public: plan.p_public ? 'Y' : 'N',
    completed: !!plan.p_status,
    photo_key: plan.p_photo || '',
    photo: photoSrc(plan.p_photo) || photoFor(plan.loc),
  };
}

// ----- 일정(plan_details) <-> 화면의 plan -----
export function toSchedule(detail, trip) {
  let extra = {};
  try { extra = JSON.parse(detail.memo || '{}'); } catch { extra = { place: detail.memo || '' }; }
  const day = Math.round((dateToMs(dateOnly(detail.visit_time)) - dateToMs(trip.start_date)) / DAY_MS) + 1;
  const place = extra.place ?? '';
  return { plan_id: detail.pd_id, day: Math.max(day, 1), time: timeOnly(detail.visit_time), label: extra.label ?? '', place, title: extra.title ?? '', photo_key: extra.photo ?? '', photo: photoSrc(extra.photo) || photoFor(place, 'tokyo'), comments: [] };
}
export function fromSchedule(trip, data) {
  const d = new Date(dateToMs(trip.start_date) + (Number(data.day) - 1) * DAY_MS);
  const date = toDateString(d);
  const [hh, mm] = String(data.time).split(':').map(Number);
  return {
    visit_time: `${date}T${pad2(hh)}:${pad2(mm)}:00`,
    orders: Number(data.day) * 1440 + hh * 60 + mm,
    memo: JSON.stringify({ place: data.place, label: data.label || '', title: data.title || '', ...(data.photo_key ? { photo: data.photo_key } : {}) }),
  };
}
