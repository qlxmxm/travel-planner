// [장소] 장소 화면에서 같이 쓰는 계산/가공 함수 모음 (화면 파일에는 화면 코드만 남기기 위해 분리)
import { PLACE_CATEGORY } from '../../data/samplePlaces.js';

const ALL_DAY_START = '00:00';
const ALL_DAY_END = '24:00';

export function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.lr_rating, 0);
  return total / reviews.length;
}

// 목록 카드·상세 화면이 같이 쓰는 "평균 별점 + 리뷰 개수"
export function summarizeReviews(reviews) {
  return { average: calculateAverageRating(reviews), count: reviews.length };
}

function matchesCategory(place, category) {
  return category === PLACE_CATEGORY.ALL || place.l_category === category;
}

function matchesKeyword(place, keyword) {
  if (!keyword) return true;
  const searchTargets = [place.l_name, place.l_category, place.l_city, place.l_add];
  return searchTargets.some((target) => target.toLowerCase().includes(keyword));
}

export function filterPlaces(places, category, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return places.filter((place) => matchesCategory(place, category) && matchesKeyword(place, normalizedKeyword));
}

export const isLodging = (place) => place.l_category === PLACE_CATEGORY.LODGING;

export function getHoursLabel(place) {
  return isLodging(place) ? '체크인·아웃' : '영업시간';
}

export function formatHours(place) {
  if (place.l_start === ALL_DAY_START && place.l_end === ALL_DAY_END) return '24시간';
  if (isLodging(place)) return `체크인 ${place.l_start} · 체크아웃 ${place.l_end}`;
  return `${place.l_start} ~ ${place.l_end}`;
}

export function isValidReview(rating, content) {
  return rating > 0 && content.trim() !== '';
}
