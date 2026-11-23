// src/api/planApi.js
import { request } from './client.js';
import { photos } from '../data/photos.js';

const DAY = 24 * 60 * 60 * 1000;

function calcDuration(startStr, endStr) {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr.slice(0, 10));
  const end = new Date(endStr.slice(0, 10));
  const nights = Math.round((end - start) / DAY);
  if (nights < 0) return '';
  return nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`;
}

// 백엔드 PlanInDB + 멤버 + 해시태그를 프론트엔드 Trip 객체 형태로 변환
export function toTripModel(plan, members = [], hashtags = []) {
  const startDate = plan.p_start ? plan.p_start.slice(0, 10) : '';
  const endDate = plan.p_end ? plan.p_end.slice(0, 10) : '';
  const memberUserIds = members.map((m) => m.u_id);

  // 방장이 멤버 목록에 없더라도 포함시켜 멤버 수 계산
  const allMemberIds = Array.from(new Set([plan.u_id, ...memberUserIds]));

  return {
    trip_id: plan.p_id,
    owner_id: plan.u_id,
    owner_name: `회원 #${plan.u_id}`, // 백엔드에 owner_name 필드가 생기면 교체
    title: plan.p_title,
    destination: plan.loc,
    start_date: startDate,
    end_date: endDate,
    duration: calcDuration(startDate, endDate),
    is_public: plan.p_status ? 'Y' : 'N',
    photo: photos.tokyo, // DB에 photo 컬럼이 없으므로 기본 이미지 사용
    hashtags: hashtags.map((h) => h.h_name),
    hashtagObjs: hashtags, // 삭제 시 h_id 참조용
    memberIds: allMemberIds,
    members: allMemberIds.length,
  };
}

// 권한 및 상태 헬퍼 함수 (기존 sampleTrips.js 대체)
export function isMember(trip, user) {
  if (!trip || !user || !user.user_id) return false;
  return trip.owner_id === user.user_id || (trip.memberIds || []).includes(user.user_id);
}

export function canSee(trip, user) {
  if (!trip) return false;
  return trip.is_public === 'Y' || isMember(trip, user);
}

export function isEnded(trip) {
  if (!trip?.end_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return trip.end_date < today;
}

// 해시태그 이름 배열을 받아 DB에 생성/조회 후 여행계획에 연결
async function syncPlanHashtags(planId, desiredTagNames, currentTagObjs = []) {
  const currentNames = currentTagObjs.map((t) => t.h_name);

  // 1. 추가할 태그
  const toAdd = desiredTagNames.filter((name) => !currentNames.includes(name));
  for (const name of toAdd) {
    // POST /plans/hashtags 는 이미 존재하면 기존 태그를 반환함
    const tag = await request('/plans/hashtags', {
      method: 'POST',
      body: { h_name: name },
    });
    await request(`/plans/${planId}/hashtags`, {
      method: 'POST',
      body: { p_id: planId, h_id: tag.h_id },
    });
  }

  // 2. 제거할 태그
  const toRemove = currentTagObjs.filter((t) => !desiredTagNames.includes(t.h_name));
  for (const tag of toRemove) {
    await request(`/plans/${planId}/hashtags/${tag.h_id}`, {
      method: 'DELETE',
    });
  }
}

export const planApi = {
  // 목록 조회 (각 여행의 멤버와 해시태그도 함께 조회)
  async getPlans() {
    const plans = await request('/plans/');
    const enriched = await Promise.all(
      plans.map(async (p) => {
        const [members, hashtags] = await Promise.all([
          request(`/plans/${p.p_id}/members`).catch(() => []),
          request(`/plans/${p.p_id}/hashtags`).catch(() => []),
        ]);
        return toTripModel(p, members, hashtags);
      })
    );
    return enriched;
  },

  // 단건 상세 조회
  async getPlan(planId) {
    const [plan, members, hashtags] = await Promise.all([
      request(`/plans/${planId}`),
      request(`/plans/${planId}/members`).catch(() => []),
      request(`/plans/${planId}/hashtags`).catch(() => []),
    ]);
    return toTripModel(plan, members, hashtags);
  },

  // 새 여행 생성 + 해시태그 연결
  async createPlan({ userId, title, destination, startDate, endDate, isPublic, hashtags = [] }) {
    const created = await request('/plans/', {
      method: 'POST',
      body: {
        u_id: userId,
        p_title: title,
        loc: destination,
        p_start: `${startDate}T00:00:00`,
        p_end: `${endDate}T23:59:59`,
        p_status: isPublic === 'Y',
      },
    });

    if (hashtags.length > 0) {
      await syncPlanHashtags(created.p_id, hashtags, []);
    }
    return created;
  },

  // 공개 여부 수정
  async updatePublicStatus(planId, isPublic) {
    return request(`/plans/${planId}`, {
      method: 'PUT',
      body: { p_status: isPublic === 'Y' },
    });
  },

  // 해시태그 수정
  async updateHashtags(planId, desiredTagNames, currentTagObjs) {
    await syncPlanHashtags(planId, desiredTagNames, currentTagObjs);
    return request(`/plans/${planId}/hashtags`);
  },

  // 여행 삭제
  async deletePlan(planId) {
    return request(`/plans/${planId}`, { method: 'DELETE' });
  },
};