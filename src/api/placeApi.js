// [장소] 장소 API 호출 모음. 백엔드: src/backend/location/router.py  (주소는 모두 /api/... 로 시작)
import { request } from './client.js';

const toQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : '';
};

export const placeApi = {
  // 장소 목록·검색. category 가 '전체'(또는 빈 값)이면 카테고리 조건을 보내지 않습니다.
  list: ({ category, keyword }) =>
    request(`/locations${toQuery({ category: category === '전체' ? '' : category, q: keyword?.trim(), size: 100 })}`),
  get: (placeId) => request(`/locations/${placeId}`),
  listReviews: (placeId) => request(`/locations/${placeId}/reviews`),
  createReview: (placeId, { rating, content }) =>
    request(`/locations/${placeId}/reviews`, { method: 'POST', body: { lr_rating: rating, lr_content: content.trim() } }),
  updateReview: (reviewId, { rating, content }) =>
    request(`/reviews/${reviewId}`, { method: 'PUT', body: { lr_rating: rating, lr_content: content.trim() } }),
  deleteReview: (reviewId) => request(`/reviews/${reviewId}`, { method: 'DELETE' }),
};
