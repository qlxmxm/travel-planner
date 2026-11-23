// [여행계획] 여행 자체(목록 · 만들기 · 수정 · 삭제 · 공개 전환)와 해시태그의 서버 호출.
// 같은 /api/plans 아래 다른 기능은 memberApi(멤버·초대·참여요청) · scheduleApi(일정) · budgetApi(예산)에 있어요.
import { request } from './client.js';
import { planPath } from './planPaths.js';
import { toTrip } from './planMapper.js';
import { DAY_MS, dateOnly, timeOnly, dateToMs, toDateString } from '../utils/date.js';

// 출발일이 바뀌면 모든 일정의 날짜를 같은 만큼(shiftDays 일) 옮겨서 "n일차" 구성이 그대로 유지되게 합니다.
async function shiftScheduleDates(planId, shiftDays) {
  const rows = await request(`${planPath(planId)}/details`);
  for (const row of rows) {
    const moved = new Date(dateToMs(dateOnly(row.visit_time)) + shiftDays * DAY_MS);
    const visit_time = `${toDateString(moved)}T${timeOnly(row.visit_time)}:00`;
    await request(`${planPath(planId)}/details/${row.pd_id}`, { method: 'PUT', body: { visit_time } });
  }
}

export const planApi = {
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
    const [plan, members, tags] = await Promise.all([request(planPath(planId)), request(`${planPath(planId)}/members`), request(`${planPath(planId)}/hashtags`)]);
    return toTrip(plan, members, tags);
  },
  async create({ user_id, title, destination, start_date, end_date, tags = [], is_public = 'N', photo_key = null }) {
    const plan = await request('/plans/', { method: 'POST', body: { u_id: user_id, p_title: title, loc: destination, p_start: `${start_date}T00:00:00`, p_end: `${end_date}T23:59:59`, p_public: is_public === 'Y', p_photo: photo_key } });
    await planApi.setTags(plan.p_id, [], tags);
    return planApi.get(plan.p_id);
  },
  // 여행 정보(제목·여행지·날짜) 수정. 출발일이 바뀌면 일정 날짜도 같이 옮깁니다.
  async updateInfo(trip, { title, destination, start_date, end_date }) {
    await request(planPath(trip.trip_id), { method: 'PUT', body: { p_title: title, loc: destination, p_start: `${start_date}T00:00:00`, p_end: `${end_date}T23:59:59` } });
    const shiftDays = Math.round((dateToMs(start_date) - dateToMs(trip.start_date)) / DAY_MS);
    if (shiftDays !== 0) await shiftScheduleDates(trip.trip_id, shiftDays);
  },
  remove: (planId) => request(planPath(planId), { method: 'DELETE' }),
  setPublic: (planId, isPublic) => request(planPath(planId), { method: 'PUT', body: { p_public: isPublic === 'Y' } }),

  // ----- 해시태그: 이름으로 태그를 만들고(이미 있으면 재사용) 여행에 연결/해제 -----
  async setTags(planId, before, after) {
    const current = await request(`${planPath(planId)}/hashtags`);
    for (const name of after.filter((t) => !before.includes(t))) {
      const tag = await request('/plans/hashtags', { method: 'POST', body: { h_name: name } });
      if (!current.some((c) => c.h_id === tag.h_id)) await request(`${planPath(planId)}/hashtags`, { method: 'POST', body: { p_id: planId, h_id: tag.h_id } });
    }
    for (const name of before.filter((t) => !after.includes(t))) {
      const tag = current.find((c) => c.h_name === name);
      if (tag) await request(`${planPath(planId)}/hashtags/${tag.h_id}`, { method: 'DELETE' });
    }
  },
};
