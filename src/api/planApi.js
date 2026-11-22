// [여행계획] 백엔드 /api/plans 호출 + 화면에서 쓰는 trip/일정/예산 모양으로 바꾸는 변환 함수 모음.
// 백엔드(DB) 모양:  plans(p_id,u_id,p_title,loc,p_start,p_end,p_status) / plan_members / plan_details / budgets / expenses / hashtag
// 화면(trip) 모양:  { trip_id, title, destination, start_date, end_date, duration, members, member_ids, owner_id, hashtags, photo, completed }
//  - 공개 여부·사진·일정 대화는 DB에 컬럼이 없어서 서버에 저장하지 않습니다. (사진은 여행지 이름으로 고름)
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
    members: members.length || 1,
    hashtags: tags.map((t) => t.h_name),
    is_public: 'N',
    completed: !!plan.p_status,
    photo: photoFor(plan.loc),
  };
}

// ----- 일정(plan_details) <-> 화면의 plan -----
export function toSchedule(detail, trip) {
  let extra = {};
  try { extra = JSON.parse(detail.memo || '{}'); } catch { extra = { place: detail.memo || '' }; }
  const day = Math.round((toDay(dateOnly(detail.visit_time)) - toDay(trip.start_date)) / DAY) + 1;
  const place = extra.place ?? '';
  return { plan_id: detail.pd_id, day: Math.max(day, 1), time: timeOnly(detail.visit_time), label: extra.label ?? '', place, title: extra.title ?? '', photo: photoFor(place, 'tokyo'), comments: [] };
}
export function fromSchedule(trip, data) {
  const d = new Date(toDay(trip.start_date) + (Number(data.day) - 1) * DAY);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const [hh, mm] = String(data.time).split(':').map(Number);
  return {
    visit_time: `${date}T${pad(hh)}:${pad(mm)}:00`,
    orders: Number(data.day) * 1440 + hh * 60 + mm,
    memo: JSON.stringify({ place: data.place, label: data.label || '', title: data.title || '' }),
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
  async get(planId) {
    const [plan, members, tags] = await Promise.all([request(base(planId)), request(`${base(planId)}/members`), request(`${base(planId)}/hashtags`)]);
    return toTrip(plan, members, tags);
  },
  async create({ user_id, title, destination, start_date, end_date, tags = [] }) {
    const plan = await request('/plans/', { method: 'POST', body: { u_id: user_id, p_title: title, loc: destination, p_start: `${start_date}T00:00:00`, p_end: `${end_date}T23:59:59` } });
    await planApi.setTags(plan.p_id, [], tags);
    return planApi.get(plan.p_id);
  },
  remove: (planId) => request(base(planId), { method: 'DELETE' }),
  complete: (planId) => request(base(planId), { method: 'PUT', body: { p_status: true } }), // 여행기는 완료된 여행만 쓸 수 있음

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
  async latestInvite(planId) {
    const rows = await request(`${base(planId)}/invites`);
    const now = Date.now();
    return rows.filter((i) => !i.i_used && new Date(i.i_expire).getTime() > now).sort((a, b) => b.i_id - a.i_id)[0] ?? null;
  },
  createInvite(planId, code, days = 7) {
    const now = new Date();
    return request(`${base(planId)}/invites`, { method: 'POST', body: { p_id: planId, i_code: code, i_create: iso(now), i_expire: iso(new Date(now.getTime() + days * DAY)) } });
  },
  join: (code, userId) => request(`/plans/invites/join?user_id=${userId}`, { method: 'POST', body: { i_code: code } }),

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
