// [여행계획] 백엔드 /api/plans 호출 + 화면에서 쓰는 trip/일정/예산 모양으로 바꾸는 변환 함수 모음.
// 백엔드(DB) 모양:  plans(p_id,u_id,p_title,loc,p_start,p_end,p_status) / plan_members / plan_details / budgets / expenses / hashtag
// 화면(trip) 모양:  { trip_id, title, destination, start_date, end_date, duration, members, member_ids, owner_id, hashtags, photo, completed }
//  - 공개 여부(p_public)·대표 사진(p_photo)은 plans 테이블 컬럼에 저장합니다. (사진이 비어 있으면 여행지 이름으로 고름)
//  - 일정 대화는 DB 테이블이 없어서 서버에 저장하지 않습니다.
//  - 일정(plan_details)의 장소 이름/구분/제목은 memo 컬럼에 JSON 으로 담습니다. (memo 255자 제한)
import { request } from './client.js';
import { photos } from '../data/photos.js';

const DAY = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');
const dateOnly = (iso) => String(iso).slice(0, 10);
const timeOnly = (iso) => String(iso).slice(11, 16);
const toDay = (s) => new Date(`${s}T00:00:00`).getTime();

export function durationText(start, end) {
  if (!start || !end) return '';
  const nights = Math.round((toDay(end) - toDay(start)) / DAY);
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
  const day = Math.round((toDay(dateOnly(detail.visit_time)) - toDay(trip.start_date)) / DAY) + 1;
  const place = extra.place ?? '';
  return { plan_id: detail.pd_id, day: Math.max(day, 1), time: timeOnly(detail.visit_time), label: extra.label ?? '', place, title: extra.title ?? '', photo_key: extra.photo ?? '', photo: photoSrc(extra.photo) || photoFor(place, 'tokyo'), comments: [] };
}
export function fromSchedule(trip, data) {
  const d = new Date(toDay(trip.start_date) + (Number(data.day) - 1) * DAY);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const [hh, mm] = String(data.time).split(':').map(Number);
  return {
    visit_time: `${date}T${pad(hh)}:${pad(mm)}:00`,
    orders: Number(data.day) * 1440 + hh * 60 + mm,
    memo: JSON.stringify({ place: data.place, label: data.label || '', title: data.title || '', ...(data.photo_key ? { photo: data.photo_key } : {}) }),
  };
}

const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const base = (id) => `/plans/${id}`;

export const planApi = {
  // ----- 여행 -----
  async listMine(userId) {
    const plans = await request(`/plans/user/${userId}`);
    return Promise.all(plans.map((p) => planApi.get(p.p_id)));
  },
  // 다른 사람이 공개한 여행계획 (GET /api/plans/public)
  async listPublic() {
    const plans = await request('/plans/public');
    return Promise.all(plans.map((p) => planApi.get(p.p_id)));
  },
  async get(planId) {
    const [plan, members, tags] = await Promise.all([request(base(planId)), request(`${base(planId)}/members`), request(`${base(planId)}/hashtags`)]);
    return toTrip(plan, members, tags);
  },
  async create({ user_id, title, destination, start_date, end_date, tags = [], is_public = 'N', photo_key = null }) {
    const plan = await request('/plans/', { method: 'POST', body: { u_id: user_id, p_title: title, loc: destination, p_start: `${start_date}T00:00:00`, p_end: `${end_date}T23:59:59`, p_public: is_public === 'Y', p_photo: photo_key } });
    await planApi.setTags(plan.p_id, [], tags);
    return planApi.get(plan.p_id);
  },
  // 여행 정보(제목·여행지·날짜) 수정. 출발일이 바뀌면 일정도 같은 만큼 날짜를 옮겨서 "n일차" 구성이 그대로 유지됩니다.
  async updateInfo(trip, { title, destination, start_date, end_date }) {
    await request(base(trip.trip_id), { method: 'PUT', body: { p_title: title, loc: destination, p_start: `${start_date}T00:00:00`, p_end: `${end_date}T23:59:59` } });
    const shift = Math.round((toDay(start_date) - toDay(trip.start_date)) / DAY);
    if (shift !== 0) {
      const rows = await request(`${base(trip.trip_id)}/details`);
      for (const r of rows) {
        const t = new Date(new Date(`${dateOnly(r.visit_time)}T00:00:00`).getTime() + shift * DAY);
        const visit_time = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${timeOnly(r.visit_time)}:00`;
        await request(`${base(trip.trip_id)}/details/${r.pd_id}`, { method: 'PUT', body: { visit_time } });
      }
    }
  },
  remove: (planId) => request(base(planId), { method: 'DELETE' }),
  setPublic: (planId, isPublic) => request(base(planId), { method: 'PUT', body: { p_public: isPublic === 'Y' } }),

  // ----- 해시태그: 이름으로 태그를 만들고(이미 있으면 재사용) 여행에 연결/해제 -----
  async setTags(planId, before, after) {
    const current = await request(`${base(planId)}/hashtags`);
    for (const name of after.filter((t) => !before.includes(t))) {
      const tag = await request('/plans/hashtags', { method: 'POST', body: { h_name: name } });
      if (!current.some((c) => c.h_id === tag.h_id)) await request(`${base(planId)}/hashtags`, { method: 'POST', body: { p_id: planId, h_id: tag.h_id } });
    }
    for (const name of before.filter((t) => !after.includes(t))) {
      const tag = current.find((c) => c.h_name === name);
      if (tag) await request(`${base(planId)}/hashtags/${tag.h_id}`, { method: 'DELETE' });
    }
  },

  // ----- 일정 -----
  async listSchedules(trip) {
    const rows = await request(`${base(trip.trip_id)}/details`);
    return rows.map((r) => toSchedule(r, trip)).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  },
  async createSchedule(trip, data) {
    const row = await request(`${base(trip.trip_id)}/details`, { method: 'POST', body: { p_id: trip.trip_id, ...fromSchedule(trip, data) } });
    return toSchedule(row, trip);
  },
  async updateSchedule(trip, id, data) {
    const row = await request(`${base(trip.trip_id)}/details/${id}`, { method: 'PUT', body: fromSchedule(trip, data) });
    return toSchedule(row, trip);
  },
  deleteSchedule: (trip, id) => request(`${base(trip.trip_id)}/details/${id}`, { method: 'DELETE' }),

  // ----- 멤버 / 초대 -----
  listMembers: (planId) => request(`${base(planId)}/members`),
  removeMember: (planId, pmId) => request(`${base(planId)}/members/${pmId}`, { method: 'DELETE' }),
  // 멤버 역할 바꾸기(방장만): '편집자' = 방장처럼 일정·예산·여행 정보를 고칠 수 있음 / '멤버' = 보기만 가능한 참여자
  setMemberRole: (planId, pmId, role) => request(`${base(planId)}/members/${pmId}`, { method: 'PUT', body: { role } }),

  // ----- 참여 요청: 공개된 다른 사람의 여행에 "같이 가고 싶어요" -----
  requestJoin: (planId) => request(`${base(planId)}/join-requests`, { method: 'POST' }),
  myJoinRequest: (planId) => request(`${base(planId)}/join-requests/me`),            // { requested, jr_id }
  listJoinRequests: (planId) => request(`${base(planId)}/join-requests`),             // 멤버만 볼 수 있음
  approveJoinRequest: (planId, jrId) => request(`${base(planId)}/join-requests/${jrId}/approve`, { method: 'POST' }), // 방장만
  removeJoinRequest: (planId, jrId) => request(`${base(planId)}/join-requests/${jrId}`, { method: 'DELETE' }),        // 방장은 거절, 본인은 취소
  async latestInvite(planId) {
    const rows = await request(`${base(planId)}/invites`);
    const now = Date.now();
    return rows.filter((i) => !i.i_used && new Date(i.i_expire).getTime() > now).sort((a, b) => b.i_id - a.i_id)[0] ?? null;
  },
  createInvite(planId, code, days = 7) {
    const now = new Date();
    return request(`${base(planId)}/invites`, { method: 'POST', body: { p_id: planId, i_code: code, i_create: iso(now), i_expire: iso(new Date(now.getTime() + days * DAY)) } });
  },
  join: (code) => request('/plans/invites/join', { method: 'POST', body: { i_code: code } }),

  // ----- 예산 / 지출 -----
  // 화면 항목: { id, kind: 'budget'|'add'|'used', memo, amount, date, ref }
  //  budget → budgets.b_budget, add → budgets.b_add, used → expenses(e_content, e_amount)
  async listBudgetItems(planId) {
    const budgets = await request(`${base(planId)}/budgets`);
    const items = [];
    for (const b of budgets) {
      const date = dateOnly(b.b_date);
      if (b.b_budget > 0) items.push({ id: `b${b.b_id}`, kind: 'budget', memo: '예산', amount: b.b_budget, date, ref: { b_id: b.b_id } });
      if ((b.b_add ?? 0) > 0) items.push({ id: `a${b.b_id}`, kind: 'add', memo: '추가 예산', amount: b.b_add, date, ref: { b_id: b.b_id } });
      const exps = await request(`${base(planId)}/budgets/${b.b_id}/expenses`);
      for (const e of exps) items.push({ id: `e${e.e_id}`, kind: 'used', memo: e.e_content, amount: e.e_amount, date: dateOnly(e.e_time), ref: { b_id: b.b_id, e_id: e.e_id } });
    }
    return { items, budgets };
  },
  async addBudgetItem(planId, budgets, { kind, memo, amount }) {
    if (kind === 'budget') return request(`${base(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: amount } });
    if (kind === 'add') return request(`${base(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: 0, b_add: amount } });
    // 지출은 예산 행에 붙는다. 예산 행이 하나도 없으면 0원짜리 예산 행을 먼저 만든다.
    const parent = budgets[0] ?? (await request(`${base(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: 0 } }));
    return request(`${base(planId)}/budgets/${parent.b_id}/expenses`, { method: 'POST', body: { b_id: parent.b_id, e_content: memo, e_amount: amount, e_time: iso(new Date()) } });
  },
  updateBudgetItem(planId, item, { memo, amount }) {
    if (item.kind === 'budget') return request(`${base(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: { b_budget: amount } });
    if (item.kind === 'add') return request(`${base(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: { b_add: amount } });
    return request(`${base(planId)}/budgets/${item.ref.b_id}/expenses/${item.ref.e_id}`, { method: 'PUT', body: { e_content: memo, e_amount: amount } });
  },
  // 삭제 = 0원으로 만들기. 예산/추가예산은 한 행에 같이 들어 있어서 해당 칸만 0으로 비운다.
  async deleteBudgetItem(planId, item) {
    if (item.kind === 'used') return request(`${base(planId)}/budgets/${item.ref.b_id}/expenses/${item.ref.e_id}`, { method: 'DELETE' });
    return request(`${base(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: item.kind === 'budget' ? { b_budget: 0 } : { b_add: 0 } });
  },
};
