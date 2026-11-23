// [여행계획] 일정(plan_details)의 서버 호출. 서버 모양 ↔ 화면 모양 변환은 planMapper 의 toSchedule / fromSchedule 이 해요.
import { request } from './client.js';
import { planPath } from './planPaths.js';
import { toSchedule, fromSchedule } from './planMapper.js';

export const scheduleApi = {
  async list(trip) {
    const rows = await request(`${planPath(trip.trip_id)}/details`);
    return rows.map((r) => toSchedule(r, trip)).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  },
  async create(trip, data) {
    const row = await request(`${planPath(trip.trip_id)}/details`, { method: 'POST', body: { p_id: trip.trip_id, ...fromSchedule(trip, data) } });
    return toSchedule(row, trip);
  },
  async update(trip, scheduleId, data) {
    const row = await request(`${planPath(trip.trip_id)}/details/${scheduleId}`, { method: 'PUT', body: fromSchedule(trip, data) });
    return toSchedule(row, trip);
  },
  remove: (trip, scheduleId) => request(`${planPath(trip.trip_id)}/details/${scheduleId}`, { method: 'DELETE' }),
};
