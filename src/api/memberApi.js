// [여행계획] 멤버 · 초대 코드 · 참여 요청의 서버 호출.
import { request } from './client.js';
import { planPath } from './planPaths.js';
import { DAY_MS, toLocalIso } from '../utils/date.js';

export const memberApi = {
  // ----- 멤버 -----
  listMembers: (planId) => request(`${planPath(planId)}/members`),
  removeMember: (planId, pmId) => request(`${planPath(planId)}/members/${pmId}`, { method: 'DELETE' }),
  // 멤버 역할 바꾸기(방장만): '편집자' = 방장처럼 일정·예산·여행 정보를 고칠 수 있음 / '멤버' = 보기만 가능한 참여자
  setMemberRole: (planId, pmId, role) => request(`${planPath(planId)}/members/${pmId}`, { method: 'PUT', body: { role } }),

  // ----- 참여 요청: 공개된 다른 사람의 여행에 "같이 가고 싶어요" -----
  requestJoin: (planId) => request(`${planPath(planId)}/join-requests`, { method: 'POST' }),
  myJoinRequest: (planId) => request(`${planPath(planId)}/join-requests/me`),            // { requested, jr_id }
  listJoinRequests: (planId) => request(`${planPath(planId)}/join-requests`),             // 멤버만 볼 수 있음
  approveJoinRequest: (planId, jrId) => request(`${planPath(planId)}/join-requests/${jrId}/approve`, { method: 'POST' }), // 방장만
  removeJoinRequest: (planId, jrId) => request(`${planPath(planId)}/join-requests/${jrId}`, { method: 'DELETE' }),        // 방장은 거절, 본인은 취소

  // ----- 초대 코드 -----
  async latestInvite(planId) {
    const rows = await request(`${planPath(planId)}/invites`);
    const now = Date.now();
    return rows.filter((i) => !i.i_used && new Date(i.i_expire).getTime() > now).sort((a, b) => b.i_id - a.i_id)[0] ?? null;
  },
  createInvite(planId, code, days = 7) {
    const now = new Date();
    return request(`${planPath(planId)}/invites`, { method: 'POST', body: { p_id: planId, i_code: code, i_create: toLocalIso(now), i_expire: toLocalIso(new Date(now.getTime() + days * DAY_MS)) } });
  },
  joinByInvite: (code) => request('/plans/invites/join', { method: 'POST', body: { i_code: code } }),
};
