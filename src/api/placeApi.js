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
  // 한 쪽(기본 50곳)만 불러옵니다. 장소 목록 화면의 무한 스크롤에서 사용.
  //   minRating: 평균 별점 이 값 이상만(예: 4, 4.5) · sort: 'rating' 별점 높은 순 / 'rating_asc' 낮은 순 / 'reviews' 리뷰 많은 순 / 'reviews_asc' 적은 순 (비우면 기본순)
  listPage: ({ category, keyword, page = 1, size = 50, minRating, sort }) =>
    request(`/locations${toQuery({ category: category === '전체' ? '' : category, q: keyword?.trim(), min_rating: minRating, sort, size, page })}`),
  // 전부 불러옵니다. 서버가 한 번에 100곳까지만 주므로 100곳이 꽉 차 있으면 다음 쪽을 이어서 불러옵니다.
  list: async ({ category, keyword }) => {
    const all = [];
    for (let page = 1; page <= 20; page += 1) {
      const rows = await placeApi.listPage({ category, keyword, page, size: 100 });
      all.push(...rows);
      if (rows.length < 100) break;
    }
    return all;
  },
  get: (placeId) => request(`/locations/${placeId}`),
  listReviews: (placeId) => request(`/locations/${placeId}/reviews`),
  createReview: (placeId, { rating, content }) =>
    request(`/locations/${placeId}/reviews`, { method: 'POST', body: { lr_rating: rating, lr_content: content.trim() } }),
  updateReview: (reviewId, { rating, content }) =>
    request(`/reviews/${reviewId}`, { method: 'PUT', body: { lr_rating: rating, lr_content: content.trim() } }),
  deleteReview: (reviewId) => request(`/reviews/${reviewId}`, { method: 'DELETE' }),
};
