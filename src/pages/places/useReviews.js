// [장소] 한 장소의 리뷰 목록과 추가/수정/삭제. 지금은 화면 안에서만 동작합니다.
// TODO: 각 함수 안을 리뷰 API(POST/PUT/DELETE) 호출로 바꾸기
import { useState } from 'react';
import { placeReviews } from '../../data/samplePlaces.js';

export default function useReviews(placeId, user) {
  const [reviews, setReviews] = useState(() => placeReviews.filter((review) => review.l_id === placeId));
  const myReview = reviews.find((review) => review.u_id === user.user_id);

  function addReview({ rating, content }) {
    const newReview = {
      lr_id: Date.now(),
      l_id: placeId,
      u_id: user.user_id,
      u_name: user.user_name,
      lr_rating: rating,
      lr_content: content.trim(),
      lr_create: '방금',
    };
    setReviews((current) => [newReview, ...current]);
  }

  function updateReview(reviewId, { rating, content }) {
    setReviews((current) => current.map((review) => (
      review.lr_id === reviewId ? { ...review, lr_rating: rating, lr_content: content.trim() } : review
    )));
  }

  function deleteReview(reviewId) {
    setReviews((current) => current.filter((review) => review.lr_id !== reviewId));
  }

  return { reviews, myReview, addReview, updateReview, deleteReview };
}
