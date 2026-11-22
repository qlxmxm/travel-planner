// [장소] 장소 화면에서 같이 쓰는 상수/계산/가공 함수 모음 (화면 파일에는 화면 코드만 남기기 위해 분리)
import { photos } from '../../data/photos.js';

export const PLACE_CATEGORY = {
  ALL: '전체',
  FOOD: '맛집',
  SIGHTSEEING: '관광명소',
  LODGING: '숙소',
};

export const placeTabs = Object.values(PLACE_CATEGORY);

const ALL_DAY_START = '00:00';
const ALL_DAY_END = '24:00';

export function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.lr_rating, 0);
  return total / reviews.length;
}

// 상세 화면: 리뷰 목록에서 "평균 별점 + 리뷰 개수" 계산 (리뷰를 쓰고 지우면 바로 반영되도록)
export function summarizeReviews(reviews) {
  return { average: calculateAverageRating(reviews), count: reviews.length };
}

// 목록 카드: 서버가 계산해서 준 평균/개수를 그대로 사용
export const summaryOfPlace = (place) => ({ average: place.avg_rating ?? 0, count: place.review_count ?? 0 });

// DB 의 l_image 는 src/data/photos.js 의 키 이름 (예: 'ramen'). 없으면 기본 그림.
export const imageOfPlace = (place) => photos[place.l_image] ?? photos.tokyo;

// '2026-11-22T09:30:00' → '2026.11.22'
export function formatReviewDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export const isLodging = (place) => place.l_category === PLACE_CATEGORY.LODGING;

export function getHoursLabel(place) {
  return isLodging(place) ? '체크인·아웃' : '영업시간';
}

export function formatHours(place) {
  if (!place.l_start || !place.l_end) return '정보 없음';
  if (place.l_start === ALL_DAY_START && place.l_end === ALL_DAY_END) return '24시간';
  if (isLodging(place)) return `체크인 ${place.l_start} · 체크아웃 ${place.l_end}`;
  return `${place.l_start} ~ ${place.l_end}`;
}

export function isValidReview(rating, content) {
  return rating > 0 && content.trim() !== '';
}
