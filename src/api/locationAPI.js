import {request} from './client.js';








// 38 장소 목록 검색
export async function getLocations(category,q,city,page, size) {
  const params = new URLSearchParams();
// category : 카테고리 (맛집 / 관광명소 / 숙소 중 하나)
  if(category){
    params.append('category', category)
  }
// q        : 검색어 (장소 이름·도시·주소에서 찾음)
  if(q){
  params.append('q', q)
  }
// city     : 도시 (예: 부산)

  if(city){
  params.append('city', city)
  }
// page     : 몇 번째 페이지인지 (안 보내면 1)

  if(page){
  params.append('page', page)
  }
// size     : 한 페이지에 몇 개씩 (안 보내면 20, 최대 100)
  if(size){
  params.append('size', size)
  }

  return request(`/locations?${params}`);
}

// 39 장소 상세 조회
export async function getLocation(lId) {
  return request(`/locations/${lId}`);
}

// 40 리뷰 목록 조회
export async function getReviews(lId) {
  return request(`/locations/${lId}/reviews`);
}

// 41 리뷰 작성(로그인 필요)
export async function createReview(lId, lrRating, lrContent){
  return request(`/locations/${lId}/reviews` ,{ method: 'POST', body: { lr_rating: lrRating, lr_content: lrContent }});
}

// 42 리뷰 수정(작성자)
export async function updateReview(lrId, lrRating, lrContent){
  return request(`/reviews/${lrId}` ,{ method: 'PUT', body: { lr_rating: lrRating, lr_content: lrContent }});
}

// 43 리뷰 삭제(작성자)
export async function deleteReview(lrId){
  return request(`/reviews/${lrId}` ,{ method: 'DELETE'});
}